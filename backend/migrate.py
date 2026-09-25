"""
Migration script to add missing columns to the PostgreSQL database.
"""
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

migrations = [
    "ALTER TABLE reports ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'user';",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE;",
    "ALTER TABLE reports ADD COLUMN IF NOT EXISTS ai_urgency VARCHAR;",
    "ALTER TABLE reports ADD COLUMN IF NOT EXISTS report_code VARCHAR;",
    "ALTER TABLE reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;",
]

with engine.connect() as conn:
    for sql in migrations:
        try:
            conn.execute(text(sql))
            print(f"OK: {sql[:60]}...")
        except Exception as e:
            print(f"SKIP: {e}")
    conn.commit()

from database import Base
import models
Base.metadata.create_all(bind=engine)
print("All tables created/verified successfully!")
