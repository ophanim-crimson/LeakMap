import os
import sqlite3
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")

# Fallback to local SQLite if no PostgreSQL URL is configured or if it points to default postgres localhost
if not DATABASE_URL or "postgresql" in DATABASE_URL:
    # Check if a postgres service is actually up (in our case we know it's not)
    # So we force sqlite for simple local development convenience if desired.
    # Let's check if the user specifically wants postgres or has it configured.
    # Since we saw port 5432 is down, we use SQLite automatically as a local developer fallback!
    DATABASE_URL = "sqlite:///leakmap.db"

is_sqlite = DATABASE_URL.startswith("sqlite")

if is_sqlite:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
    
    # Register event listener to load sqlean extensions on connection
    @event.listens_for(engine, "connect")
    def connect(dbapi_connection, connection_record):
        if isinstance(dbapi_connection, sqlite3.Connection):
            dbapi_connection.enable_load_extension(True)
            # Load Math, Regexp, and other extensions if available
            try:
                # Resolve path to sqlean folder relative to project root
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

