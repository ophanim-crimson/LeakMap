from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime

# Photo schemas
class PhotoBase(BaseModel):
    image_url: str
    file_size: Optional[int] = None

class PhotoCreate(PhotoBase):
    report_id: int

class PhotoInput(BaseModel):
    image_url: str
    file_size: Optional[int] = None
    display_order: Optional[int] = None

class PhotoResponse(PhotoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    report_id: int
    display_order: Optional[int] = None
    uploaded_at: datetime

# Verification schemas
class VerificationBase(BaseModel):
    verification_type: str = Field(..., pattern=r"^(Confirmed|Duplicate|Resolved)$")
    session_id: str

class VerificationCreate(VerificationBase):
    pass

class VerificationResponse(VerificationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    report_id: int
    created_at: datetime

# Update schemas
class UpdateBase(BaseModel):
    update_text: str = Field(..., max_length=1000)

class UpdateCreate(UpdateBase):
    pass

class UpdateResponse(UpdateBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    report_id: int
    created_at: datetime

# Report schemas
class ReportBase(BaseModel):
    issue_type: str = Field(..., pattern=r"^(Leak|Overflow|Damaged Tap|Broken Valve|Water Supply Issue|Other)$")
    description: Optional[str] = Field(None, max_length=500)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)

class ReportCreate(ReportBase):
    photo_url: Optional[str] = None
    photos: Optional[List[PhotoInput]] = None

class VerificationCounts(BaseModel):
    confirmed: int = 0
    duplicate: int = 0
    resolved: int = 0

class ReportResponse(ReportBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    report_code: str
    status: str
    created_at: datetime
    photos: List[PhotoResponse] = []
    updates: List[UpdateResponse] = []
    verification_counts: VerificationCounts = Field(default_factory=VerificationCounts)

# Statistics schema
class StatisticsResponse(BaseModel):
    total: int
    active: int
    confirmed: int
    resolved: int
