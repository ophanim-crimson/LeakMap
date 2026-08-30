import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base, is_sqlite

# Conditional import of Geometry to support SQLite fallback without GeoAlchemy2 issues
if not is_sqlite:
    from geoalchemy2 import Geometry
else:
    Geometry = None

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="user", nullable=False) # 'user' or 'admin'
    is_flagged = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)

    reports = relationship("Report", back_populates="user", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    report_code = Column(String(10), unique=True, nullable=False, index=True)
    issue_type = Column(String(50), nullable=False, index=True)
    description = Column(Text, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    # GeoAlchemy2 Geometry Point in SRID 4326 (only used if PostgreSQL)
    geometry = Column(Geometry(geometry_type="POINT", srid=4326), nullable=True) if Geometry else Column(Text, nullable=True)
    status = Column(String(20), default="Active", nullable=False, index=True)
    ai_urgency = Column(String(20), default="Pending", nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="reports")
    photos = relationship("Photo", back_populates="report", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="report", cascade="all, delete-orphan")
    updates = relationship("Update", back_populates="report", cascade="all, delete-orphan")

class Photo(Base):
    __tablename__ = "photos"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True)
    image_url = Column(Text, nullable=False)
    file_size = Column(Integer, nullable=True)
    display_order = Column(Integer, nullable=True)
    uploaded_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)

    # Relationships
    report = relationship("Report", back_populates="photos")

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)

    report = relationship("Report", back_populates="comments")
    user = relationship("User", back_populates="comments")

class Update(Base):
    __tablename__ = "updates"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True)
    update_text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)

    # Relationships
    report = relationship("Report", back_populates="updates")
