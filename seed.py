import os
import sys
import random
import datetime

# Add the parent directory to python path so we can import backend modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.sql import func
from backend.database import SessionLocal, engine, Base
from backend import models

# Ensure tables are created
Base.metadata.create_all(bind=engine)

def seed_database():
    db = SessionLocal()
    try:
        # Check if database is already seeded
        existing_count = db.query(models.Report).count()
        if existing_count > 0:
            print(f"Database already has {existing_count} reports. Skipping seed.")
            return

        print("Seeding database with 50 realistic reports...")

        # Issue categories and description templates
        issue_types = [
            ("Leak", [
                "Water leaking from a cracked pipe on the sidewalk.",
                "Small pool of water bubbling up from under the road asphalt.",
                "Water main burst spraying water onto nearby wall.",
                "Active drip from joint on underground utility main.",
                "Significant wet spot in the grassy area near the main pipeline."
            ]),
            ("Overflow", [
                "Public tap is left completely open and flooding the pavement.",
                "Water storage tank overflowing onto the street.",
                "Drainage overflow of clean water from pressure release valve.",
                "Reservoir valve overflowing over the retaining wall."
            ]),
            ("Damaged Tap", [
                "Public drinking tap is broken and won't turn off.",
                "Faucet handles are missing, water is trickling out.",
                "T-joint tap has broken off completely, leaving a constant stream.",
                "Metal faucet cracked and leaking from the base."
            ]),
            ("Broken Valve", [
                "Gate valve is stuck in open position, leaking heavily.",
                "Pressure regulator valve spraying a fine mist of water.",
                "Shutoff valve has rusted through and is dripping constantly.",
                "Main isolation valve lever is broken."
            ]),
            ("Water Supply Issue", [
                "Low water pressure reported in the entire block.",
                "No water supply for the last 12 hours on this street.",
                "Murky, brownish water coming out of the taps.",
                "Intermittent water supply with high air pockets in the lines."
            ]),
            ("Other", [
                "Unsecured inspection chamber cover with visible water leaks inside.",
                "Illegal connection tap bypassing the water meter.",
                "Wastage due to sprinkler system broken in public park.",
                "Water tanker pipeline coupling dripping excessively."
            ])
        ]

        # Austin, TX coordinates as the center area
        center_lat, center_lng = 30.2672, -97.7431
        
        statuses = ["Active", "Resolved"]
        verification_types = ["Confirmed", "Duplicate", "Resolved"]

        # 50 reports
        for i in range(1, 51):
            issue_type, templates = random.choice(issue_types)
            description = random.choice(templates) + f" (Report #{i})"
            
            # Small random offset for clustering (within ~5km of downtown Austin)
            lat = center_lat + random.uniform(-0.04, 0.04)
            lng = center_lng + random.uniform(-0.04, 0.04)
            
            # Create a report code: LM-XXXXXX
            code = f"LM-{random.randint(100000, 999999)}"
            
            # Random status
            status = random.choice(statuses) if i > 15 else "Active" # Keep first 15 active
            
            # Created at random time in the last 30 days
            days_ago = random.randint(0, 30)
            hours_ago = random.randint(0, 23)
            created_at = datetime.datetime.utcnow() - datetime.timedelta(days=days_ago, hours=hours_ago)
            
            # Use raw SQL or func.ST_SetSRID to insert geometry point if Postgres, otherwise string
            from backend.database import is_sqlite
            geom = func.ST_SetSRID(func.ST_MakePoint(lng, lat), 4326) if not is_sqlite else f"POINT({lng} {lat})"
            
            report = models.Report(
                report_code=code,
                issue_type=issue_type,
                description=description,
                latitude=lat,
                longitude=lng,
                geometry=geom,
                status=status,
                created_at=created_at
            )
            db.add(report)
            db.commit()
            db.refresh(report)

            # Add photo for some reports (every 4th report)
            if i % 4 == 0:
                # Use placeholder images for demo, like picsum or unsplash
                # Example: public water issue images or abstract pictures
                photo_urls = [
                    "https://images.unsplash.com/photo-1542013936693-8848e5740a7b?w=600&auto=format&fit=crop", # pipe leak
                    "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&auto=format&fit=crop", # tap water
                    "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600&auto=format&fit=crop", # pipeline
                    "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop"  # dripping tap
                ]
                photo = models.Photo(
                    report_id=report.id,
                    image_url=random.choice(photo_urls),
                    uploaded_at=created_at + datetime.timedelta(minutes=random.randint(5, 60))
                )
                db.add(photo)

            # Add verifications (votes)
            num_verifications = random.randint(0, 6)
            sessions = [f"session_{random.randint(1000, 9999)}" for _ in range(num_verifications)]
            
            # If resolved, ensure it has at least 2 Resolved verifications
            if report.status == "Resolved":
                v1 = models.Verification(
                    report_id=report.id,
                    verification_type="Resolved",
                    session_id="session_res_1",
                    created_at=created_at + datetime.timedelta(days=1)
                )
                v2 = models.Verification(
                    report_id=report.id,
                    verification_type="Resolved",
                    session_id="session_res_2",
                    created_at=created_at + datetime.timedelta(days=1, hours=2)
                )
                db.add(v1)
                db.add(v2)
                
            for session in set(sessions):
                v_type = random.choice(verification_types)
                # Avoid violating unique constraint
                if report.status == "Resolved" and v_type == "Resolved":
                    continue
                v = models.Verification(
                    report_id=report.id,
                    verification_type=v_type,
                    session_id=session,
                    created_at=created_at + datetime.timedelta(hours=random.randint(1, 24))
                )
                db.add(v)

            # Add community updates (for some reports)
            if i % 3 == 0:
                update_messages = [
                    "Checked today. Water is still leaking heavily. Needs urgent repair.",
                    "Local municipality workers were seen inspecting the tap.",
                    "The flow seems to have slowed down, but still leaking.",
                    "Temporary patch applied but water is starting to drip again.",
                    "Resolution update: Fixed by the municipal engineering team this morning."
                ]
                # If resolved, make sure there is a resolution update
                msg = update_messages[-1] if report.status == "Resolved" else random.choice(update_messages[:-1])
                
                update = models.Update(
                    report_id=report.id,
                    update_text=msg,
                    created_at=created_at + datetime.timedelta(days=min(1, days_ago))
                )
                db.add(update)
                
            db.commit()

        print("Successfully seeded 50 reports, verifications, updates, and photos!")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
