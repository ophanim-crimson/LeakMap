import math
from sqlalchemy.orm import Session
from . import models


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two lat/lon points in meters using the Haversine formula."""
    R = 6371000  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def calculate_priority(report: "models.Report", db: Session, radius_meters: int = 10) -> int:
    """Determine priority score based on number of nearby reports.

    The score is the count of other reports within radius_meters of the given report's coordinates.
    """
    if not report.latitude or not report.longitude:
        return 0
        
    # Approx degrees for bounding box filtering (1 deg lat ~ 111km, 10m ~ 0.0001 deg)
    delta_deg = max(0.0001, (radius_meters * 1.5) / 111000)
    
    # Query only lat/lon of candidate nearby reports for maximum performance
    nearby_coords = db.query(models.Report.latitude, models.Report.longitude).filter(
        models.Report.id != (report.id or -1),
        models.Report.latitude >= report.latitude - delta_deg,
        models.Report.latitude <= report.latitude + delta_deg,
        models.Report.longitude >= report.longitude - delta_deg,
        models.Report.longitude <= report.longitude + delta_deg,
    ).all()
    
    count = 0
    for r_lat, r_lon in nearby_coords:
        if r_lat is not None and r_lon is not None:
            if haversine_distance(report.latitude, report.longitude, r_lat, r_lon) <= radius_meters:
                count += 1
    return count

