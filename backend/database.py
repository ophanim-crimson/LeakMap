import os
import sqlite3
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")

# Use SQLite only if no DATABASE_URL is set at all
if not DATABASE_URL:
    DATABASE_URL = "sqlite:///leakmap.db"

is_sqlite = DATABASE_URL.startswith("sqlite")

if is_sqlite:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

    @event.listens_for(engine, "connect")
    def connect(dbapi_connection, connection_record):
        if isinstance(dbapi_connection, sqlite3.Connection):
            dbapi_connection.enable_load_extension(True)
            try:
                base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                math_path = os.path.join(base_dir, "sqlean", "math.dll")
                regexp_path = os.path.join(base_dir, "sqlean", "regexp.dll")
                if os.path.exists(math_path):
                    dbapi_connection.load_extension(math_path)
                if os.path.exists(regexp_path):
                    dbapi_connection.load_extension(regexp_path)
            except Exception as e:
                print(f"Warning: Could not load sqlite extensions: {e}")
else:
    engine = create_engine(
        DATABASE_URL,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

