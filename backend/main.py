import os
import uuid
import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from PIL import Image
import io

from database import engine, Base, get_db
import models
import schemas

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

def get_report_verification_counts(report: models.Report, db: Session) -> schemas.VerificationCounts:
    # Query database to aggregate counts of verifications for this report
    counts = db.query(
        models.Verification.verification_type,
        func.count(models.Verification.id)
    ).filter(models.Verification.report_id == report.id).group_by(models.Verification.verification_type).all()
    
    confirmed = 0
    duplicate = 0
    resolved = 0
    
    for v_type, count in counts:
        if v_type == "Confirmed":
            confirmed = count
        elif v_type == "Duplicate":
            duplicate = count
        elif v_type == "Resolved":
            resolved = count
            
    return schemas.VerificationCounts(
        confirmed=confirmed,
        duplicate=duplicate,
        resolved=resolved
    )

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
    
    # Get verifications count
    verification_counts = get_report_verification_counts(report, db)
    
    return schemas.ReportResponse(
        id=report.id,
        report_code=report.report_code,
        issue_type=report.issue_type,
        description=report.description,
        latitude=report.latitude,
        longitude=report.longitude,
        status=report.status,
        created_at=report.created_at,
        photos=photos,
        updates=updates,
        verification_counts=verification_counts
    )

# ----------------- ENDPOINTS -----------------

@app.get("/api/statistics", response_model=schemas.StatisticsResponse)
def get_statistics(db: Session = Depends(get_db)):
    """
    Get general dashboard statistics: Total, Active, Confirmed, Resolved reports
    """
    twenty_four_hours_ago = datetime.datetime.utcnow() - datetime.timedelta(hours=24)
    expired_report_ids_query = db.query(models.Verification.report_id).filter(
        models.Verification.verification_type == "Resolved",
        models.Verification.created_at <= twenty_four_hours_ago
    )

    base_query = db.query(models.Report).filter(~models.Report.id.in_(expired_report_ids_query))

    total_non_expired = base_query.count() or 0
    active = base_query.filter(models.Report.status == "Active").count() or 0
    resolved = base_query.filter(models.Report.status == "Resolved").count() or 0
    total = total_non_expired - resolved
    
    # "Confirmed" means active reports that have at least 1 Confirmed verification
    confirmed = base_query.join(models.Verification, models.Report.id == models.Verification.report_id)\
        .filter(models.Report.status == "Active")\
        .filter(models.Verification.verification_type == "Confirmed")\
        .distinct().count() or 0
        
    return schemas.StatisticsResponse(
        total=total,
        active=active,
        confirmed=confirmed,
        resolved=resolved
    )

@app.post("/api/uploads", response_model=schemas.PhotoBase)
def upload_photo(file: UploadFile = File(...)):
    """
    Upload and compress an image to WebP, saving it in a YYYY/MM/ folder
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
        
        return schemas.PhotoBase(image_url=relative_url, file_size=len(content))
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process image: {str(e)}"
        )

@app.post("/api/reports", response_model=schemas.ReportResponse)
def create_report(payload: schemas.ReportCreate, db: Session = Depends(get_db)):
    """
    Submit a new water infrastructure issue report
    """
    code = generate_report_code(db)
    
    # Store PostGIS geometry point using WKT or ST_SetSRID + ST_Point/ST_MakePoint
    # We will use ST_SetSRID and ST_MakePoint if PostgreSQL is active, otherwise None/default
    from database import is_sqlite
    geom = func.ST_SetSRID(func.ST_MakePoint(payload.longitude, payload.latitude), 4326) if not is_sqlite else f"POINT({payload.longitude} {payload.latitude})"
    
    report = models.Report(
        report_code=code,
        issue_type=payload.issue_type,
        description=payload.description,
        latitude=payload.latitude,
        longitude=payload.longitude,
        geometry=geom,
        status="Active"
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

@app.get("/api/reports", response_model=List[schemas.ReportResponse])
def list_reports(
    q: Optional[str] = Query(None, description="Search keyword in description or report code"),
    issue_type: Optional[str] = Query(None, description="Filter by issue type"),
    status: Optional[str] = Query(None, description="Filter by status ('Active' or 'Resolved')"),
    min_lat: Optional[float] = Query(None, description="Minimum latitude for map bounds filter"),
    max_lat: Optional[float] = Query(None, description="Maximum latitude for map bounds filter"),
    min_lng: Optional[float] = Query(None, description="Minimum longitude for map bounds filter"),
    max_lng: Optional[float] = Query(None, description="Maximum longitude for map bounds filter"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    """
    List, search, filter, and paginate reports
    """
    twenty_four_hours_ago = datetime.datetime.utcnow() - datetime.timedelta(hours=24)
    expired_report_ids_query = db.query(models.Verification.report_id).filter(
        models.Verification.verification_type == "Resolved",
        models.Verification.created_at <= twenty_four_hours_ago
    )

    query = db.query(models.Report).filter(~models.Report.id.in_(expired_report_ids_query))
    
    # Filters
    if status:
        query = query.filter(models.Report.status == status)
    if issue_type:
        query = query.filter(models.Report.issue_type == issue_type)
    if q:
        query = query.filter(
            or_(
                models.Report.description.ilike(f"%{q}%"),
                models.Report.report_code.ilike(f"%{q}%")
            )
        )
    # Map bounds filtering
    if min_lat is not None and max_lat is not None:
        query = query.filter(models.Report.latitude >= min_lat, models.Report.latitude <= max_lat)
    if min_lng is not None and max_lng is not None:
        query = query.filter(models.Report.longitude >= min_lng, models.Report.longitude <= max_lng)
        
    # Order by newest first
    query = query.order_by(desc(models.Report.created_at))
    
    # Pagination
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

@app.post("/api/reports/{id}/verify", response_model=schemas.ReportResponse)
def verify_report(id: int, payload: schemas.VerificationCreate, db: Session = Depends(get_db)):
    """
    Cast verification vote: 'Confirmed', 'Duplicate', or 'Resolved'
    """
    report = db.query(models.Report).filter(models.Report.id == id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID {id} not found."
        )
        
    # Check if duplicate verification from same session
    existing = db.query(models.Verification).filter(
        models.Verification.report_id == id,
        models.Verification.session_id == payload.session_id,
        models.Verification.verification_type == payload.verification_type
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"You have already marked this report as {payload.verification_type}."
        )
        
    # Save verification
    verification = models.Verification(
        report_id=id,
        verification_type=payload.verification_type,
        session_id=payload.session_id
    )
    db.add(verification)
    
    # If the user votes "Resolved", and resolved votes exceed active thresholds,
    # or just automatically toggle status on resolved votes. Let's make it so if a vote
    # of "Resolved" is submitted, we record it. If the resolved votes count reaches a threshold (e.g. 3),
    # or if we want to immediately resolve, let's keep it interactive. To show immediate feedback
    # in a demo, let's mark the report as "Resolved" if 3 users submit "Resolved" votes, OR
    # let's just make it resolved if there's any Resolved vote for simplicity of demo, or threshold of 2.
    # Let's count current Resolved votes
    db.commit()
    
    resolved_count = db.query(func.count(models.Verification.id)).filter(
        models.Verification.report_id == id,
        models.Verification.verification_type == "Resolved"
    ).scalar() or 0
    
    if resolved_count >= 1:
        report.status = "Resolved"
        db.add(report)
        db.commit()
        db.refresh(report)
        
    return map_report_to_response(report, db)

@app.post("/api/reports/{id}/updates", response_model=schemas.ReportResponse)
def add_update(id: int, payload: schemas.UpdateCreate, db: Session = Depends(get_db)):
    """
    Add a text update about the status of a report
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
