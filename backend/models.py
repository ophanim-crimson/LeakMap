import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base, is_sqlite

# Conditional import of Geometry to support SQLite fallback without GeoAlchemy2 issues
if not is_sqlite:
    from geoalchemy2 import Geometry
else:
    Geometry = None

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    report_code = Column(String(10), unique=True, nullable=False, index=True)
    issue_type = Column(String(50), nullable=False, index=True)
    description = Column(Text, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    # GeoAlchemy2 Geometry Point in SRID 4326 (only used if PostgreSQL)
    geometry = Column(Geometry(geometry_type="POINT", srid=4326), nullable=True) if Geometry else Column(Text, nullable=True)
    status = Column(String(20), default="Active", nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)


    # Relationships
    photos = relationship("Photo", back_populates="report", cascade="all, delete-orphan")
    verifications = relationship("Verification", back_populates="report", cascade="all, delete-orphan")
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

class Verification(Base):
    __tablename__ = "verifications"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True)
    verification_type = Column(String(20), nullable=False) # 'Confirmed', 'Duplicate', 'Resolved'
    session_id = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("report_id", "session_id", "verification_type", name="uq_report_session_verification"),
    )

    # Relationships
    report = relationship("Report", back_populates="verifications")

class Update(Base):
    __tablename__ = "updates"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True)
    update_text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)

    # Relationships
    report = relationship("Report", back_populates="updates")
