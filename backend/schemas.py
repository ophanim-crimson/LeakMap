from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
from datetime import datetime

# User Auth schemas
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserRoleUpdate(BaseModel):
    role: str

class UserLogin(UserBase):
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: str
    is_flagged: bool
    created_at: datetime

# Photo schemas
class PhotoBase(BaseModel):
    image_url: str
    file_size: Optional[int] = None
    ai_is_valid: Optional[bool] = None
    ai_label: Optional[str] = None
    ai_description: Optional[str] = None

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

# Comment schemas
class CommentBase(BaseModel):
    text: str = Field(..., max_length=1000)

class CommentCreate(CommentBase):
    pass

class CommentResponse(CommentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    report_id: int
    user_id: int
    created_at: datetime
    user: Optional[UserResponse] = None

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

class ReportListRequest(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius_meters: Optional[int] = 100

class ReportResponse(ReportBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    report_code: str
    status: str
    ai_urgency: Optional[str] = None
    created_at: datetime
    photos: List[PhotoResponse] = []
    updates: List[UpdateResponse] = []
    comments: List[CommentResponse] = []
    user: Optional[UserResponse] = None

# Statistics schema
class StatisticsResponse(BaseModel):
    total: int
    active: int
    confirmed: int
    resolved: int
