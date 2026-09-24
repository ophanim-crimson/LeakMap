import os
import uuid
import datetime
import math
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Query, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session, selectinload, joinedload
from sqlalchemy import func, desc, or_, case
from PIL import Image
import io
import requests

from .database import engine, Base, get_db
from . import models
from . import schemas
from .utils import calculate_priority
from .auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
    get_current_active_user,
    get_current_admin,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from datetime import timedelta
import time

_cache = {
    "stats": None,
    "stats_time": 0,
    "public_reports": None,
    "public_reports_time": 0,
}
CACHE_TTL = 30  # 30 seconds TTL

def invalidate_cache():
    _cache["stats"] = None
    _cache["public_reports"] = None

# Initialize FastAPI App
app = FastAPI(
    title="LeakMap API",
    description="Community-Powered Water Infrastructure Intelligence API",
    version="1.0.0"
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "online", "message": "LeakMap API is running", "docs": "/docs"}

# Upload Configuration
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)


def generate_report_code(db: Session) -> str:
    import random
    import string
    chars = string.ascii_uppercase + string.digits
    while True:
        code = "LM-" + "".join(random.choices(chars, k=6))
        exists = db.query(models.Report).filter(models.Report.report_code == code).first()
        if not exists:
            return code

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    meters = R * c
    return meters

def map_report_to_response(report: models.Report, db: Session) -> schemas.ReportResponse:
    # Build photo list sorted by display_order
    sorted_photos = sorted(report.photos, key=lambda x: (x.display_order or 999, x.uploaded_at or datetime.datetime.min))
    photos = [
        schemas.PhotoResponse(
            id=photo.id,
            report_id=photo.report_id,
            image_url=photo.image_url,
            file_size=photo.file_size,
            display_order=photo.display_order,
            uploaded_at=photo.uploaded_at
        ) for photo in sorted_photos
    ]
    
    # Build updates list
    updates = [
        schemas.UpdateResponse(
            id=up.id,
            report_id=up.report_id,
            update_text=up.update_text,
            created_at=up.created_at
        ) for up in sorted(report.updates, key=lambda x: x.created_at, reverse=True)
    ]
    
    # Build comments list
    comments = [
        schemas.CommentResponse(
            id=c.id,
            report_id=c.report_id,
            user_id=c.user_id,
            text=c.text,
            created_at=c.created_at,
            user=schemas.UserResponse.model_validate(c.user) if c.user else None
        ) for c in sorted(report.comments, key=lambda x: x.created_at, reverse=True)
    ]
    
    user_resp = schemas.UserResponse.model_validate(report.user) if report.user else None
    
    return schemas.ReportResponse(
        id=report.id,
        report_code=report.report_code,
        issue_type=report.issue_type,
        description=report.description,
        district=getattr(report, "district", "Kasaragod") or "Kasaragod",
        latitude=report.latitude,
        longitude=report.longitude,
        status=report.status,
        ai_urgency=report.ai_urgency,
        priority_score=report.priority_score or 0,
        created_at=report.created_at,
        photos=photos,
        updates=updates,
        comments=comments,
        user=user_resp
    )

# ----------------- AUTH ENDPOINTS -----------------

@app.post("/api/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # First user is admin, rest are regular users
    is_first = db.query(models.User).count() == 0
    role = "admin" if is_first else "user"
    
    hashed_password = get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password, role=role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/api/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if user.is_flagged:
        raise HTTPException(status_code=400, detail="Account is flagged due to malicious uploads.")
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/api/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(get_current_active_user)):
    return current_user

# ----------------- ADMIN USER MANAGEMENT -----------------

@app.get("/api/admin/users", response_model=List[schemas.UserResponse])
def get_all_users(db: Session = Depends(get_db), current_admin: models.User = Depends(get_current_admin)):
    """Admin endpoint to list all registered users."""
    users = db.query(models.User).order_by(desc(models.User.id)).all()
    return users

@app.put("/api/admin/users/{id}/promote", response_model=schemas.UserResponse)
def promote_user(
    id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """Admin endpoint to promote a user to admin."""
    user = db.query(models.User).filter(models.User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = "admin"
    db.commit()
    db.refresh(user)
    return user

@app.put("/api/users/{id}/role", response_model=schemas.UserResponse)
def update_user_role(
    id: int, 
    payload: schemas.UserRoleUpdate,
    db: Session = Depends(get_db), 
    current_admin: models.User = Depends(get_current_admin)
):
    """Admin endpoint to update a user's role."""
    if payload.role not in ["admin", "user"]:
        raise HTTPException(status_code=400, detail="Invalid role specified. Must be 'admin' or 'user'.")
        
    user = db.query(models.User).filter(models.User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.id == current_admin.id and payload.role != "admin":
        raise HTTPException(status_code=400, detail="You cannot demote yourself.")

    user.role = payload.role
    db.commit()
    db.refresh(user)
    return user

@app.post("/api/admin/users/bulk_register", response_model=schemas.BulkRegisterResponse)
def bulk_register_users(
    payload: schemas.BulkUserCreate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """Admin endpoint to bulk-register multiple user accounts."""
    results = []
    created = 0
    failed = 0
    for u in payload.users:
        existing = db.query(models.User).filter(models.User.email == u.email).first()
        if existing:
            results.append(schemas.BulkUserResult(email=u.email, success=False, message="Email already registered"))
            failed += 1
            continue
        try:
            hashed_password = get_password_hash(u.password)
            new_user = models.User(email=u.email, hashed_password=hashed_password, role="user")
            db.add(new_user)
            db.commit()
            created += 1
            results.append(schemas.BulkUserResult(email=u.email, success=True, message="Created"))
        except Exception as e:
            db.rollback()
            results.append(schemas.BulkUserResult(email=u.email, success=False, message=str(e)))
            failed += 1
    return schemas.BulkRegisterResponse(created=created, failed=failed, results=results)

@app.post("/api/admin/users/{id}/purge_reports")
def purge_user_reports(
    id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """Admin endpoint: purge non-resolved (pending/active) reports for a blacklisted user and clear their flag."""
    user = db.query(models.User).filter(models.User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete non-resolved reports
    reports_to_delete = db.query(models.Report).filter(
        models.Report.user_id == id,
        models.Report.status != "Resolved"
    ).all()
    count = len(reports_to_delete)
    for r in reports_to_delete:
        db.delete(r)
    
    # Clear flagged status
    user.is_flagged = False
    db.commit()
    
    return {"detail": f"Purged {count} pending report(s) and cleared flag for user {user.email}"}

# ----------------- STATISTICS -----------------

@app.get("/api/statistics", response_model=schemas.StatisticsResponse)
def get_statistics(db: Session = Depends(get_db)):
    """Get general dashboard statistics with in-memory caching."""
    now = time.time()
    if _cache["stats"] and (now - _cache["stats_time"] < CACHE_TTL):
        return _cache["stats"]

    row = db.query(
        func.count(models.Report.id).label("total"),
        func.sum(case((models.Report.status == "Active", 1), else_=0)).label("active"),
        func.sum(case((models.Report.status == "Resolved", 1), else_=0)).label("resolved")
    ).first()
    
    total = (row.total if row else 0) or 0
    active = int(row.active or 0) if row else 0
    resolved = int(row.resolved or 0) if row else 0
    
    res = schemas.StatisticsResponse(
        total=total,
        active=active,
        confirmed=0,
        resolved=resolved
    )
    _cache["stats"] = res
    _cache["stats_time"] = now
    return res

@app.get("/api/statistics/me", response_model=schemas.StatisticsResponse)
def get_statistics_me(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    """Get dashboard statistics specifically for the logged in user."""
    row = db.query(
        func.count(models.Report.id).label("total"),
        func.sum(case((models.Report.status == "Active", 1), else_=0)).label("active"),
        func.sum(case((models.Report.status == "Resolved", 1), else_=0)).label("resolved")
    ).filter(models.Report.user_id == current_user.id).first()
    
    total = (row.total if row else 0) or 0
    active = int(row.active or 0) if row else 0
    resolved = int(row.resolved or 0) if row else 0
    
    return schemas.StatisticsResponse(
        total=total,
        active=active,
        confirmed=0,
        resolved=resolved
    )

def classify_photo_with_ai(image_bytes: bytes) -> dict:
    """Fast validation of image with optional Groq Vision classification."""
    try:
        img = Image.open(io.BytesIO(image_bytes))
        width, height = img.size
        if width < 50 or height < 50:
            return {"is_valid": False, "label": "Image resolution too low"}
    except Exception:
        return {"is_valid": False, "label": "Corrupted or invalid image file"}

    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key or groq_key.startswith("gsk_EUjfs1w"):
        # Instant 0ms return when no valid API key is configured
        return {"is_valid": True, "label": "Water Infrastructure", "description": ""}
        
    try:
        import base64
        b64_image = base64.b64encode(image_bytes).decode("utf-8")
        prompt = (
            "You are an AI assistant verifying water leak and infrastructure photos. "
            "Respond strictly in this format:\n"
            "VALID: true OR false\n"
            "LABEL: (2-4 words describing issue)\n"
            "DESCRIPTION: (1 sentence description)\n"
        )
        api_payload = {
            "model": "llama-3.2-11b-vision-preview",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64_image}"}}
                    ]
                }
            ],
            "temperature": 0.1,
            "max_tokens": 120
        }
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"}
        resp = requests.post(url, headers=headers, json=api_payload, timeout=2.0)
        if resp.status_code == 200:
            text = resp.json().get("choices", [{}])[0].get("message", {}).get("content", "").strip()
            is_valid = True
            label = "Water Infrastructure"
            description = ""
            for line in text.split("\n"):
                line_lower = line.strip().lower().replace("*", "").replace("-", "")
                if "valid:" in line_lower:
                    is_valid = "true" in line_lower
                elif "label:" in line_lower:
                    parts = line.split(":", 1)
                    if len(parts) > 1:
                        label = parts[1].strip()
                elif "description:" in line_lower:
                    parts = line.split(":", 1)
                    if len(parts) > 1:
                        description = parts[1].strip()
            return {"is_valid": is_valid, "label": label, "description": description}
    except Exception as e:
        print(f"Vision API fallback: {e}")
        
    return {"is_valid": True, "label": "Water Infrastructure", "description": ""}

@app.post("/api/uploads", response_model=schemas.PhotoBase)
def upload_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Fast upload and compression of report photo."""
    filename = file.filename.lower()
    allowed_extensions = (".jpg", ".jpeg", ".png", ".webp")
    rejected_extensions = (".gif", ".bmp", ".svg", ".exe", ".php", ".zip")
    
    if filename.endswith(rejected_extensions) or not filename.endswith(allowed_extensions):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format. Allowed formats: JPG, JPEG, PNG, WEBP."
        )

    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format. Allowed formats: JPG, PNG, WEBP."
        )
        
    try:
        content = file.file.read()
        
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image size exceeds the maximum limit of 5MB."
            )
            
        img = Image.open(io.BytesIO(content))
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
            
        now = datetime.datetime.now()
        year_month_dir = os.path.join(UPLOAD_DIR, f"{now.year:04d}", f"{now.month:02d}")
        os.makedirs(year_month_dir, exist_ok=True)
        
        filename_new = f"{uuid.uuid4().hex}.webp"
        filepath = os.path.join(year_month_dir, filename_new)
        
        img.save(filepath, format="WEBP", quality=82, optimize=True)
        
        relative_url = f"/uploads/{now.year:04d}/{now.month:02d}/{filename_new}"
        
        classification = classify_photo_with_ai(content)
        ai_label = classification.get("label", "")
        ai_description = classification.get("description", "")
        
        return schemas.PhotoBase(
            image_url=relative_url,
            file_size=len(content),
            ai_is_valid=classification.get("is_valid", True),
            ai_label=ai_label,
            ai_description=ai_description
        )

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process image: {str(e)}"
        )

def get_ai_urgency(issue_type: str, description: str) -> str:
    """Determine urgency based on issue type and description keywords."""
    issue_lower = (issue_type or "").lower()
    desc_lower = (description or "").lower()
    combined = f"{issue_lower} {desc_lower}"
    
    critical_keywords = ["burst", "flooding", "sewage", "contaminated", "emergency", "major", "collapse", "sinkhole"]
    if any(kw in combined for kw in critical_keywords):
        return "Critical"
    
    high_keywords = ["broken", "overflow", "damage", "large leak", "no water", "supply cut", "pressure"]
    if any(kw in combined for kw in high_keywords):
        return "High"
    
    medium_keywords = ["leak", "drip", "crack", "seepage", "slow", "minor damage"]
    if any(kw in combined for kw in medium_keywords):
        return "Medium"
    
    return "Low"

@app.post("/api/reports", response_model=schemas.ReportResponse)
def create_report(
    payload: schemas.ReportCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Submit a new water infrastructure issue report (Requires Login)"""
    import secrets
    code = f"LM-{secrets.token_hex(3).upper()}"
    
    from .database import is_sqlite
    geom = func.ST_SetSRID(func.ST_MakePoint(payload.longitude, payload.latitude), 4326) if not is_sqlite else f"POINT({payload.longitude} {payload.latitude})"
    
    urgency = get_ai_urgency(payload.issue_type, payload.description)
    
    report = models.Report(
        user_id=current_user.id,
        report_code=code,
        issue_type=payload.issue_type,
        description=payload.description,
        district=payload.district or "Kasaragod",
        latitude=payload.latitude,
        longitude=payload.longitude,
        geometry=geom,
        status="Active",
        ai_urgency=urgency,
        priority_score=0
    )
    
    db.add(report)
    
    # Calculate priority score using fast bounding-box query
    report.priority_score = calculate_priority(report, db, radius_meters=10)
    
    # Add photos if present
    if payload.photos:
        for idx, p_input in enumerate(payload.photos):
            photo = models.Photo(
                report=report,
                image_url=p_input.image_url,
                file_size=p_input.file_size,
                display_order=p_input.display_order or (idx + 1)
            )
            db.add(photo)
    elif payload.photo_url:
        photo = models.Photo(
            report=report,
            image_url=payload.photo_url,
            display_order=1
        )
        db.add(photo)
        
    # Single batch commit for maximum speed
    db.commit()
    db.refresh(report)
    
    invalidate_cache()
    return map_report_to_response(report, db)

def cleanup_resolved_reports(db: Session):
    """Deletes reports marked as 'Resolved' more than 24 hours ago."""
    try:
        cutoff = datetime.datetime.utcnow() - datetime.timedelta(hours=24)
        expired_reports = db.query(models.Report).filter(
            models.Report.status == "Resolved",
            models.Report.updated_at <= cutoff
        ).all()
        if expired_reports:
            for r in expired_reports:
                db.delete(r)
            db.commit()
            print(f"Auto-cleaned {len(expired_reports)} resolved report(s) older than 24 hours.")
    except Exception as e:
        print(f"Error during resolved report cleanup: {e}")

@app.get("/api/reports/public", response_model=List[schemas.ReportResponse])
def list_public_reports(db: Session = Depends(get_db)):
    """List recent reports for the public home view with in-memory caching."""
    now = time.time()
    if _cache["public_reports"] and (now - _cache["public_reports_time"] < CACHE_TTL):
        return _cache["public_reports"]

    reports = db.query(models.Report).options(
        selectinload(models.Report.photos),
        selectinload(models.Report.updates),
        selectinload(models.Report.comments),
        joinedload(models.Report.user)
    ).order_by(desc(models.Report.priority_score), desc(models.Report.created_at)).limit(30).all()
    res = []
    for r in reports:
        mapped = map_report_to_response(r, db)
        mapped.user = None
        res.append(mapped)
    
    _cache["public_reports"] = res
    _cache["public_reports_time"] = now
    return res

@app.get("/api/reports", response_model=List[schemas.ReportResponse])
def list_reports(
    status: Optional[str] = Query(None, description="Filter by status ('Active' or 'Resolved')"),
    district: Optional[str] = Query(None, description="Filter by district"),
    search: Optional[str] = Query(None, description="Search by code or description"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=1000, description="Items per page"),
    latitude: Optional[float] = Query(None),
    longitude: Optional[float] = Query(None),
    radius_meters: Optional[int] = Query(100),
    exclude_mine: Optional[bool] = Query(False),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    List reports based on RBAC and optional spatial filtering.
    """
    query = db.query(models.Report).options(
        selectinload(models.Report.photos),
        selectinload(models.Report.updates),
        selectinload(models.Report.comments),
        joinedload(models.Report.user)
    )

    if status:
        query = query.filter(models.Report.status == status)
        
    if district and district != "All":
        query = query.filter(models.Report.district == district)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(or_(models.Report.report_code.ilike(s), models.Report.description.ilike(s), models.Report.issue_type.ilike(s)))

    if current_user.role != "admin":
        if exclude_mine:
            # Show other users' reports
            query = query.filter(models.Report.user_id != current_user.id)
        else:
            # Regular users only see their own reports by default
            query = query.filter(models.Report.user_id == current_user.id)
            
        query = query.order_by(desc(models.Report.created_at))
    else:
        # Admins see all reports sorted by priority then recency
        query = query.order_by(desc(models.Report.priority_score), desc(models.Report.created_at))

    # Calculate distances if lat/lon provided and filter by radius
    reports = query.all()
    if latitude is not None and longitude is not None:
        filtered_reports = []
        for r in reports:
            if r.latitude is not None and r.longitude is not None:
                dist = haversine_distance(latitude, longitude, r.latitude, r.longitude)
                if dist <= radius_meters:
                    filtered_reports.append(r)
        reports = filtered_reports

    offset = (page - 1) * limit
    reports_paginated = reports[offset:offset + limit]
    
    return [map_report_to_response(report, db) for report in reports_paginated]

@app.get("/api/admin/reports", response_model=List[schemas.ReportResponse])
def list_all_reports_admin(
    status: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """Admin-only: get all reports with eager loading, sorted by priority."""
    query = db.query(models.Report).options(
        selectinload(models.Report.photos),
        selectinload(models.Report.updates),
        selectinload(models.Report.comments),
        joinedload(models.Report.user)
    )
    if status:
        query = query.filter(models.Report.status == status)
    if district and district != "All":
        query = query.filter(models.Report.district == district)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(or_(models.Report.report_code.ilike(s), models.Report.description.ilike(s), models.Report.issue_type.ilike(s)))
    query = query.order_by(desc(models.Report.priority_score), desc(models.Report.created_at))
    offset = (page - 1) * limit
    reports = query.offset(offset).limit(limit).all()
    return [map_report_to_response(r, db) for r in reports]

@app.get("/api/reports/{id}", response_model=schemas.ReportResponse)
def get_report(id: int, db: Session = Depends(get_db)):
    """Get detailed information about a single report with eager loading"""
    report = db.query(models.Report).options(
        selectinload(models.Report.photos),
        selectinload(models.Report.updates),
        selectinload(models.Report.comments).selectinload(models.Comment.user),
        joinedload(models.Report.user)
    ).filter(models.Report.id == id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID {id} not found."
        )
    return map_report_to_response(report, db)

@app.post("/api/reports/{id}/comments", response_model=schemas.ReportResponse)
def add_comment(
    id: int, 
    payload: schemas.CommentCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Add a comment to a report (visible to admins)"""
    report = db.query(models.Report).filter(models.Report.id == id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID {id} not found."
        )
        
    comment = models.Comment(
        report_id=id,
        user_id=current_user.id,
        text=payload.text
    )
    db.add(comment)
    db.commit()
    db.refresh(report)
    
    return map_report_to_response(report, db)

@app.post("/api/reports/{id}/updates", response_model=schemas.ReportResponse)
def add_update(
    id: int, 
    payload: schemas.UpdateCreate, 
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """Add a text update about the status of a report (Admin only)"""
    report = db.query(models.Report).filter(models.Report.id == id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID {id} not found."
        )
        
    new_update = models.Update(
        report_id=id,
        update_text=payload.update_text
    )
    db.add(new_update)
    db.commit()
    db.refresh(report)
    
    return map_report_to_response(report, db)

@app.patch("/api/reports/{id}/status", response_model=schemas.ReportResponse)
def update_report_status(
    id: int, 
    payload: schemas.ReportStatusUpdate, 
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """Update the status of a report (Active/Resolved) - Admin only"""
    report = db.query(models.Report).filter(models.Report.id == id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID {id} not found."
        )
    report.status = payload.status
    report.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(report)
    invalidate_cache()
    return map_report_to_response(report, db)

@app.delete("/api/reports/{id}")
def delete_report(
    id: int, 
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """Delete a report completely - Admin only"""
    report = db.query(models.Report).filter(models.Report.id == id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID {id} not found."
        )
    db.delete(report)
    db.commit()
    invalidate_cache()
    return {"detail": "Report deleted successfully"}
