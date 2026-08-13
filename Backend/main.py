import os
import uuid
import datetime
import math
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Query, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from PIL import Image
import io
import requests

from database import engine, Base, get_db
import models
import schemas
from auth import get_password_hash, verify_password, create_access_token, get_current_user, get_current_active_user, get_current_admin, ACCESS_TOKEN_EXPIRE_MINUTES, timedelta

# Initialize FastAPI App
app = FastAPI(
    title="LeakMap API",
    description="Community-Powered Water Infrastructure Intelligence API",
    version="1.0.0"
)

# CORS Setup
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        # Check if code already exists
        exists = db.query(models.Report).filter(models.Report.report_code == code).first()
        if not exists:
            return code

def haversine_distance(lat1, lon1, lat2, lon2):
    # Radius of earth in meters
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
        latitude=report.latitude,
        longitude=report.longitude,
        status=report.status,
        ai_urgency=report.ai_urgency,
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
    
    # First user is admin for testing purposes, or can just be user.
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

@app.get("/api/users", response_model=List[schemas.UserResponse])
def get_all_users(db: Session = Depends(get_db), current_admin: models.User = Depends(get_current_admin)):
    """Admin endpoint to list all registered users."""
    users = db.query(models.User).order_by(desc(models.User.id)).all()
    return users

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
        
    # Prevent removing own admin privileges to avoid lockout if only 1 admin exists
    if user.id == current_admin.id and payload.role != "admin":
        raise HTTPException(status_code=400, detail="You cannot demote yourself.")

    user.role = payload.role
    db.commit()
    db.refresh(user)
    return user

# ----------------- ENDPOINTS -----------------

@app.get("/api/statistics", response_model=schemas.StatisticsResponse)
def get_statistics(db: Session = Depends(get_db)):
    """
    Get general dashboard statistics: Total, Active, Resolved reports (Anonymous view)
    """
    base_query = db.query(models.Report)
    total = base_query.count() or 0
    active = base_query.filter(models.Report.status == "Active").count() or 0
    resolved = base_query.filter(models.Report.status == "Resolved").count() or 0
    
    return schemas.StatisticsResponse(
        total=total,
        active=active,
        confirmed=0,
        resolved=resolved
    )

def classify_photo_with_ai(image_bytes: bytes) -> dict:
    """Use Gemini Vision REST API to strictly classify photos."""
    import time
    
    # Check low resolution or invalid images
    try:
        img = Image.open(io.BytesIO(image_bytes))
        width, height = img.size
        if width < 100 or height < 100:
            return {"is_valid": False, "label": "Image resolution too low"}
    except Exception:
        return {"is_valid": False, "label": "Corrupted or invalid image file"}

    # Try Groq API first
    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        # Fallback to hardcoded key if env var isn't set yet (for immediate testing)
        groq_key = "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"
        
    try:
        import base64
        b64_image = base64.b64encode(image_bytes).decode("utf-8")
        prompt = (
            "You are an AI assistant helping verify photos submitted to a water leak reporting app used by citizens in Kerala, India. "
            "Your job is to check if the photo shows ANY water-related infrastructure problem in a real-world setting.\n\n"
            "ACCEPT (VALID: true) photos showing:\n"
            "- Water leaking from pipes, taps, or fittings\n"
            "- Waterlogged roads, flooded streets, or stagnant water\n"
            "- Broken or overflowing water mains, manholes, or drains\n"
            "- Damp or wet walls, ceilings, or floors due to leaks\n"
            "- Any outdoor water puddles, puddles on footpaths, or wet ground near infrastructure\n"
            "- Damaged water infrastructure even without visible flowing water\n\n"
            "REJECT (VALID: false) ONLY if the photo clearly shows:\n"
            "- A pure screenshot, graphic, logo, cartoon, or drawing (not a real photo)\n"
            "- An explicit/NSFW image\n"
            "- Something completely unrelated like food, a selfie, or a random indoor room with no water issue\n\n"
            "IMPORTANT: Be GENEROUS. If there is any doubt, mark VALID: true. "
            "A photo of a wet road, damp area, or water near pipes counts as valid.\n\n"
            "Respond in EXACTLY this format:\n"
            "VALID: true OR false\n"
            "LABEL: (2-5 words describing what is shown)\n"
            "DESCRIPTION: (1-2 sentences describing the water issue for a report)\n"
        )
        
        payload = {
            "model": "meta-llama/llama-4-scout-17b-16e-instruct",
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
            "max_tokens": 150
        }
        
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {groq_key}",
            "Content-Type": "application/json"
        }
        
        resp = None
        for attempt in range(3):
            resp = requests.post(url, headers=headers, json=payload, timeout=30)
            if resp.status_code == 429:
                time.sleep(3)
                continue
            resp.raise_for_status()
            break
        else:
            return {"is_valid": False, "label": "AI temporarily busy, please try again in a minute"}
        
        text = resp.json()["choices"][0]["message"]["content"].strip()
        print(f"--- QWEN VISION RESPONSE ---\n{text}\n---------------------------")
        
        # Qwen sometimes adds <think> blocks or **markdown**, so we do robust parsing
        is_valid = False
        label = "Unknown Image"
        description = ""
        
        # Remove <think> blocks if present
        import re
        text_clean = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
        
        for line in text_clean.split("\n"):
            line_lower = line.strip().lower().replace("*", "").replace("-", "")
            if "valid:" in line_lower:
                is_valid = "true" in line_lower
            elif "label:" in line_lower:
                parts = line_lower.split("label:", 1)
                if len(parts) > 1:
                    label = parts[1].strip().title()
            elif "description:" in line_lower:
                parts = line_lower.split("description:", 1)
                if len(parts) > 1:
                    description = parts[1].strip().capitalize()
                
        return {"is_valid": is_valid, "label": label, "description": description}
        
    except Exception as e:
        print(f"Groq Vision Error: {e}")
        return {"is_valid": False, "label": "AI verification failed, please try again"}

@app.post("/api/uploads", response_model=schemas.PhotoBase)
def upload_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Upload and compress an image to WebP, saving it in a YYYY/MM/ folder.
    Uses Gemini Vision AI to classify the photo.
    """
    # Filename extension validation
    filename = file.filename.lower()
    allowed_extensions = (".jpg", ".jpeg", ".png", ".webp")
    rejected_extensions = (".gif", ".bmp", ".svg", ".exe", ".php", ".zip")
    
    if filename.endswith(rejected_extensions) or not filename.endswith(allowed_extensions):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format. Allowed formats: JPG, JPEG, PNG, WEBP. GIF, BMP, SVG, EXE, PHP, ZIP are rejected."
        )

    # MIME validation
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format. Allowed formats: JPG, PNG, WEBP."
        )
        
    try:
        content = file.file.read()
        
        # Verify file size limit (5MB)
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image size exceeds the maximum limit of 5MB."
            )
            
        # Compress image to WEBP
        img = Image.open(io.BytesIO(content))
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
            
        # Create YYYY/MM directory structure
        now = datetime.datetime.now()
        year_month_dir = os.path.join(UPLOAD_DIR, f"{now.year:04d}", f"{now.month:02d}")
        os.makedirs(year_month_dir, exist_ok=True)
        
        # Save compressed image
        filename_new = f"{uuid.uuid4()}.webp"
        filepath = os.path.join(year_month_dir, filename_new)
        
        img.save(filepath, format="WEBP", quality=80, optimize=True)
        
        # Build path URL (use forward slashes for cross platform URLs)
        relative_url = f"/uploads/{now.year:04d}/{now.month:02d}/{filename_new}"
        
        # AI generates a description for the photo (no rejection/flagging - that is disabled for now)
        ai_label = ""
        ai_description = ""
        try:
            with open(filepath, "rb") as f:
                saved_bytes = f.read()
            classification = classify_photo_with_ai(saved_bytes)
            ai_label = classification.get("label", "")
            ai_description = classification.get("description", "")
        except Exception:
            pass  # AI description is optional, never block upload
        
        return schemas.PhotoBase(
            image_url=relative_url,
            file_size=len(content),
            ai_is_valid=True,
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
    
    # Critical indicators
    critical_keywords = ["burst", "flooding", "sewage", "contaminated", "emergency", "major", "collapse", "sinkhole"]
    if any(kw in combined for kw in critical_keywords):
        return "Critical"
    
    # High indicators
    high_keywords = ["broken", "overflow", "damage", "large leak", "no water", "supply cut", "pressure"]
    if any(kw in combined for kw in high_keywords):
        return "High"
    
    # Medium indicators
    medium_keywords = ["leak", "drip", "crack", "seepage", "slow", "minor damage"]
    if any(kw in combined for kw in medium_keywords):
        return "Medium"
    
    # Default
    return "Low"

@app.post("/api/reports", response_model=schemas.ReportResponse)
def create_report(
    payload: schemas.ReportCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Submit a new water infrastructure issue report (Requires Login)
    """
    code = generate_report_code(db)
    
    from database import is_sqlite
    geom = func.ST_SetSRID(func.ST_MakePoint(payload.longitude, payload.latitude), 4326) if not is_sqlite else f"POINT({payload.longitude} {payload.latitude})"
    
    urgency = get_ai_urgency(payload.issue_type, payload.description)
    
    report = models.Report(
        user_id=current_user.id,
        report_code=code,
        issue_type=payload.issue_type,
        description=payload.description,
        latitude=payload.latitude,
        longitude=payload.longitude,
        geometry=geom,
        status="Active",
        ai_urgency=urgency
    )
    
    db.add(report)
    db.commit()
    db.refresh(report)
    
    # Add photos if present
    if payload.photos:
        for idx, p_input in enumerate(payload.photos):
            photo = models.Photo(
                report_id=report.id,
                image_url=p_input.image_url,
                file_size=p_input.file_size,
                display_order=p_input.display_order or (idx + 1)
            )
            db.add(photo)
        db.commit()
        db.refresh(report)
    elif payload.photo_url:
        photo = models.Photo(
            report_id=report.id,
            image_url=payload.photo_url,
            display_order=1
        )
        db.add(photo)
        db.commit()
        db.refresh(report)
        
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
    """
    List recent anonymous reports for the public home view.
    """
    reports = db.query(models.Report).order_by(desc(models.Report.created_at)).limit(20).all()
    # Strip user data for public
    res = []
    for r in reports:
        mapped = map_report_to_response(r, db)
        mapped.user = None
        res.append(mapped)
    return res

@app.get("/api/reports", response_model=List[schemas.ReportResponse])
def list_reports(
    status: Optional[str] = Query(None, description="Filter by status ('Active' or 'Resolved')"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    latitude: Optional[float] = Query(None),
    longitude: Optional[float] = Query(None),
    radius_meters: Optional[int] = Query(100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    List reports based on RBAC. 
    Admins see all reports. Users see their own reports OR reports within a radius.
    """
    query = db.query(models.Report)

    if status:
        query = query.filter(models.Report.status == status)
        
    if current_user.role != "admin":
        # If user, only show their reports OR reports in 100m radius
        if latitude is not None and longitude is not None:
            # We fetch all (filtered by status) and do distance calculation in python
            # In a production DB like Postgres we would use ST_DWithin
            all_reports = query.order_by(desc(models.Report.created_at)).all()
            result = []
            for r in all_reports:
                if r.user_id == current_user.id:
                    result.append(r)
                else:
                    dist = haversine_distance(latitude, longitude, r.latitude, r.longitude)
                    if dist <= radius_meters:
                        result.append(r)
            
            # Apply pagination to python list
            offset = (page - 1) * limit
            return [map_report_to_response(r, db) for r in result[offset:offset+limit]]
        else:
            # No location provided, just show their own reports
            query = query.filter(models.Report.user_id == current_user.id)
            
    # Admin view or User view (no radius)
    query = query.order_by(desc(models.Report.created_at))
    offset = (page - 1) * limit
    reports = query.offset(offset).limit(limit).all()
    
    return [map_report_to_response(report, db) for report in reports]

@app.get("/api/reports/{id}", response_model=schemas.ReportResponse)
def get_report(id: int, db: Session = Depends(get_db)):
    """
    Get detailed information about a single report
    """
    report = db.query(models.Report).filter(models.Report.id == id).first()
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
    """
    Add a comment to a report (visible to admins)
    """
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
    """
    Add a text update about the status of a report (Admin only)
    """
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
