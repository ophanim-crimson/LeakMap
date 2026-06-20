import os
import uuid
import shutil
from typing import List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from backend import models, schemas
from backend.database import engine, Base, get_db

# Create uploads directory if it doesn't exist
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create tables on startup
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="LeakMap API",
    description="Community Water Infrastructure Intelligence Platform API",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the actual frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads folder to serve uploaded photos staticly
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# 1. Submit Report (multipart/form-data for optional file upload)
@app.post("/api/reports", response_model=schemas.ReportResponse, status_code=status.HTTP_201_CREATED)
def create_report(
    issue_type: str = Form(...),
    description: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    # Basic validation of issue types
    valid_types = {"Leak", "Overflow", "Damaged Infrastructure", "Supply Issue"}
    if issue_type not in valid_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid issue type. Must be one of {valid_types}"
        )

    saved_filename = None
    if image and image.filename:
        # Generate safe unique filename
        file_ext = os.path.splitext(image.filename)[1].lower()
        if file_ext not in {".jpg", ".jpeg", ".png", ".gif", ".webp"}:
            raise HTTPException(
                status_code=400,
                detail="Invalid image format. Allowed formats: jpg, jpeg, png, gif, webp"
            )
        
        saved_filename = f"leak_{uuid.uuid4().hex}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, saved_filename)
        
        # Save file to uploads folder
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
            
        # The URL where client can access the image
        # This will be relative to backend url: e.g. /uploads/leak_abc.jpg
        saved_filename = f"/uploads/{saved_filename}"

    # Create database record
    db_report = models.Report(
        issue_type=issue_type,
        description=description,
        latitude=latitude,
        longitude=longitude,
        image_url=saved_filename,
        status="Active"
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report

# 2. Fetch Reports (with optional filter parameters)
@app.get("/api/reports", response_model=List[schemas.ReportResponse])
def get_reports(
    issue_type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Report)
    
    if issue_type:
        query = query.filter(models.Report.issue_type == issue_type)
    if status:
        query = query.filter(models.Report.status == status)
        
    # Order by newest first
    return query.order_by(models.Report.created_date.desc()).all()

# Helper to aggregate verification counts
def get_verification_counts(report_id: int, db: Session) -> schemas.VerificationCounts:
    confirmed = db.query(models.Verification).filter(
        models.Verification.report_id == report_id,
        models.Verification.vote_type == "Confirmed"
    ).count()
    
    duplicate = db.query(models.Verification).filter(
        models.Verification.report_id == report_id,
        models.Verification.vote_type == "Duplicate"
    ).count()
    
    resolved = db.query(models.Verification).filter(
        models.Verification.report_id == report_id,
        models.Verification.vote_type == "Resolved"
    ).count()
    
    return schemas.VerificationCounts(
        confirmed=confirmed,
        duplicate=duplicate,
        resolved=resolved
    )

# 3. Fetch Single Report
@app.get("/api/reports/{id}", response_model=schemas.ReportDetailResponse)
def get_report(id: int, db: Session = Depends(get_db)):
    report = db.query(models.Report).filter(models.Report.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    counts = get_verification_counts(id, db)
    
    # Sort updates newest first
    sorted_updates = sorted(report.updates, key=lambda x: x.timestamp, reverse=True)
    
    return schemas.ReportDetailResponse(
        id=report.id,
        issue_type=report.issue_type,
        description=report.description,
        latitude=report.latitude,
        longitude=report.longitude,
        image_url=report.image_url,
        status=report.status,
        created_date=report.created_date,
        updates=sorted_updates,
        verifications=counts
    )

# 4. Add Community Update / Comment
@app.post("/api/reports/{id}/updates", response_model=schemas.UpdateResponse)
def create_update(
    id: int, 
    update_data: schemas.UpdateCreate, 
    db: Session = Depends(get_db)
):
    report = db.query(models.Report).filter(models.Report.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    db_update = models.Update(
        report_id=id,
        comment=update_data.comment
    )
    db.add(db_update)
    db.commit()
    db.refresh(db_update)
    return db_update

# 5. Add Community Verification / Vote
@app.post("/api/reports/{id}/verify", response_model=schemas.VerificationResponse)
def verify_report(
    id: int, 
    verify_data: schemas.VerificationCreate, 
    db: Session = Depends(get_db)
):
    report = db.query(models.Report).filter(models.Report.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    valid_votes = {"Confirmed", "Duplicate", "Resolved"}
    if verify_data.vote_type not in valid_votes:
        raise HTTPException(status_code=400, detail="Invalid vote type")
        
    db_verification = models.Verification(
        report_id=id,
        vote_type=verify_data.vote_type
    )
    db.add(db_verification)
    db.commit()
    
    # Custom business logic: Automatically adjust report status based on vote counts
    # If 3 or more users mark it as resolved or duplicate, we update its status accordingly.
    counts = get_verification_counts(id, db)
    if counts.resolved >= 3 and report.status != "Resolved":
        report.status = "Resolved"
        db.commit()
    elif counts.duplicate >= 3 and report.status != "Duplicate":
        report.status = "Duplicate"
        db.commit()
        
    db.refresh(db_verification)
    return db_verification
