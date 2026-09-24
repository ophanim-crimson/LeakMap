import os
import sys
import datetime
import random

# Add root directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal, is_sqlite
from backend import models
from sqlalchemy import func

def seed_data():
    db = SessionLocal()
    try:
        print("Cleaning up old reports, photos, comments, updates...")
        db.query(models.Photo).delete()
        db.query(models.Comment).delete()
        db.query(models.Update).delete()
        db.query(models.Report).delete()
        db.commit()
        print("All old reports deleted successfully.")

        # Ensure admin user exists
        admin = db.query(models.User).filter(models.User.email == "asherjohnjobin2028@cs.ajce.in").first()
        admin_id = admin.id if admin else None

        # Sample Kerala locations with coordinates
        locations = [
            # Kasaragod
            {"district": "Kasaragod", "lat": 12.5102, "lng": 74.9852, "desc": "Main distribution pipe burst near Kasaragod Railway Station road.", "issue": "Leak", "urgency": "Critical"},
            {"district": "Kasaragod", "lat": 12.5020, "lng": 74.9920, "desc": "Water tank overflow flooding the municipal market alley.", "issue": "Overflow", "urgency": "High"},
            {"district": "Kasaragod", "lat": 12.5150, "lng": 74.9780, "desc": "Broken public tap continuously wasting drinking water in Vidyanagar.", "issue": "Damaged Tap", "urgency": "Medium"},
            {"district": "Kasaragod", "lat": 12.4980, "lng": 75.0010, "desc": "Underground pipeline leakage causing minor road sink near Nullipady.", "issue": "Leak", "urgency": "High"},

            # Kannur
            {"district": "Kannur", "lat": 11.8745, "lng": 75.3704, "desc": "Severe pipeline burst near Caltex Junction spilling thousands of liters.", "issue": "Leak", "urgency": "Critical"},
            {"district": "Kannur", "lat": 11.8680, "lng": 75.3550, "desc": "Control valve broken causing no water supply to 50 households in Payyambalam.", "issue": "Broken Valve", "urgency": "High"},
            {"district": "Kannur", "lat": 11.8820, "lng": 75.3810, "desc": "Low pressure water supply issue in Talap residential area.", "issue": "Water Supply Issue", "urgency": "Low"},
            {"district": "Kannur", "lat": 11.8600, "lng": 75.3620, "desc": "Overhead reservoir overflow at Thana junction.", "issue": "Overflow", "urgency": "Medium"},

            # Kozhikode
            {"district": "Kozhikode", "lat": 11.2588, "lng": 75.7804, "desc": "Major main pipe leak submerged SM Street pedestrian pathway.", "issue": "Leak", "urgency": "Critical"},
            {"district": "Kozhikode", "lat": 11.2650, "lng": 75.7920, "desc": "Public water kiosk tap broken and continuously flowing in Mavoor Road.", "issue": "Damaged Tap", "urgency": "Medium"},
            {"district": "Kozhikode", "lat": 11.2480, "lng": 75.7720, "desc": "Sluice valve malfunction at Kozhikode Beach promenade.", "issue": "Broken Valve", "urgency": "High"},
            {"district": "Kozhikode", "lat": 11.2720, "lng": 75.8050, "desc": "Supply shortage for past 3 days in Medical College campus quarters.", "issue": "Water Supply Issue", "urgency": "High"},

            # Thrissur
            {"district": "Thrissur", "lat": 10.5276, "lng": 76.2144, "desc": "Main water pipeline crack near Swaraj Round West.", "issue": "Leak", "urgency": "Critical"},
            {"district": "Thrissur", "lat": 10.5340, "lng": 76.2210, "desc": "Commercial building overhead tank overflow on MG Road.", "issue": "Overflow", "urgency": "Medium"},
            {"district": "Thrissur", "lat": 10.5180, "lng": 76.2080, "desc": "Broken valve at Chembukkavu junction leading to dirty tap water.", "issue": "Broken Valve", "urgency": "High"},
            {"district": "Thrissur", "lat": 10.5400, "lng": 76.2300, "desc": "Minor pipe seepage near KSRTC bus stand.", "issue": "Leak", "urgency": "Low"},

            # Ernakulam
            {"district": "Ernakulam", "lat": 9.9816, "lng": 76.2999, "desc": "Heavy drinking water leak flooding MG Road near Shenoys junction.", "issue": "Leak", "urgency": "Critical"},
            {"district": "Ernakulam", "lat": 9.9720, "lng": 76.2850, "desc": "Submerged pipeline crack in Marine Drive walkway area.", "issue": "Leak", "urgency": "High"},
            {"district": "Ernakulam", "lat": 10.0150, "lng": 76.3100, "desc": "Water supply outage across Kakkanad Infopark residential zone.", "issue": "Water Supply Issue", "urgency": "Critical"},
            {"district": "Ernakulam", "lat": 9.9920, "lng": 76.3050, "desc": "Broken pressure valve spilling water near Palarivattom bypass.", "issue": "Broken Valve", "urgency": "High"},

            # Kottayam
            {"district": "Kottayam", "lat": 9.5916, "lng": 76.5222, "desc": "High pressure pipe burst near Kanjikuzhy junction.", "issue": "Leak", "urgency": "Critical"},
            {"district": "Kottayam", "lat": 9.5850, "lng": 76.5150, "desc": "Public tap broken near Baker Junction bus stop.", "issue": "Damaged Tap", "urgency": "Medium"},
            {"district": "Kottayam", "lat": 9.5980, "lng": 76.5300, "desc": "Water reservoir overflow at Nagampadam.", "issue": "Overflow", "urgency": "Low"},
            {"district": "Kottayam", "lat": 9.5780, "lng": 76.5100, "desc": "Water supply disrupted for 24 hours in Thirunakkara area.", "issue": "Water Supply Issue", "urgency": "High"},

            # Alappuzha
            {"district": "Alappuzha", "lat": 9.4981, "lng": 76.3388, "desc": "Canal-side drinking water pipe leaking near Boat Jetty.", "issue": "Leak", "urgency": "High"},
            {"district": "Alappuzha", "lat": 9.5050, "lng": 76.3450, "desc": "Broken public tap near Alappuzha Beach park.", "issue": "Damaged Tap", "urgency": "Low"},
            {"district": "Alappuzha", "lat": 9.4890, "lng": 76.3290, "desc": "Overhead water storage tank overflowing continuously in Mullakkal.", "issue": "Overflow", "urgency": "Medium"},

            # Thiruvananthapuram
            {"district": "Thiruvananthapuram", "lat": 8.5241, "lng": 76.9366, "desc": "Emergency pipe rupture in front of Secretariat statue junction.", "issue": "Leak", "urgency": "Critical"},
            {"district": "Thiruvananthapuram", "lat": 8.5120, "lng": 76.9450, "desc": "Large supply valve damaged near Palayam underpass.", "issue": "Broken Valve", "urgency": "High"},
            {"district": "Thiruvananthapuram", "lat": 8.5350, "lng": 76.9280, "desc": "Water tank overflow flooding Pattom main road.", "issue": "Overflow", "urgency": "Medium"},
            {"district": "Thiruvananthapuram", "lat": 8.5020, "lng": 76.9550, "desc": "Broken public tap wasting clean water at Thampanoor railway station entrance.", "issue": "Damaged Tap", "urgency": "High"},
            {"district": "Thiruvananthapuram", "lat": 8.5420, "lng": 76.9150, "desc": "Water pressure drop affecting Kowdiar residential avenue.", "issue": "Water Supply Issue", "urgency": "Low"},
        ]

        reports_created = 0
        now = datetime.datetime.utcnow()

        for idx, item in enumerate(locations, start=1):
            code = f"LM-{1000 + idx}"
            # 70% Active, 30% Resolved
            status = "Resolved" if idx % 4 == 0 else "Active"
            # Some reports registered to admin, some unregistered (None)
            user_id = admin_id if (idx % 2 == 1 and admin_id) else None
            
            created_time = now - datetime.timedelta(days=random.randint(0, 10), hours=random.randint(1, 23))
            priority = random.choice([0, 1, 2, 3, 4, 5]) if status == "Active" else 0

            geom = None
            if not is_sqlite:
                geom = func.ST_SetSRID(func.ST_MakePoint(item["lng"], item["lat"]), 4326)
            else:
                geom = f"POINT({item['lng']} {item['lat']})"

            rep = models.Report(
                user_id=user_id,
                report_code=code,
                issue_type=item["issue"],
                description=item["desc"],
                district=item["district"],
                latitude=item["lat"],
                longitude=item["lng"],
                geometry=geom,
                status=status,
                ai_urgency=item["urgency"],
                priority_score=priority,
                created_at=created_time,
                updated_at=created_time
            )
            db.add(rep)
            db.flush()

            # Add comments to some reports
            if idx % 3 == 0 and admin_id:
                comment = models.Comment(
                    report_id=rep.id,
                    user_id=admin_id,
                    text=f"Inspection team dispatched for {item['district']} location.",
                    created_at=created_time + datetime.timedelta(hours=2)
                )
                db.add(comment)

            reports_created += 1

        db.commit()
        print(f"Successfully seeded {reports_created} realistic reports across Kerala districts!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
