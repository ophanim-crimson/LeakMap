"""
LeakMap – Application Configuration
All values are read from environment variables with sensible defaults.
"""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/leakmap"
    sync_database_url: str = "postgresql://postgres:postgres@localhost:5432/leakmap"

    # File storage
    uploads_dir: str = "uploads"
    max_upload_size_mb: int = 5

    # CORS – comma-separated list of allowed origins
    allowed_origins_str: str = "http://localhost:5173,http://localhost:3000"

    @property
    def allowed_origins(self) -> List[str]:
        return [o.strip() for o in self.allowed_origins_str.split(",") if o.strip()]

    # Rate limiting
    rate_limit_requests: int = 30
    rate_limit_window_seconds: int = 60

    # App
    app_name: str = "LeakMap"
    debug: bool = False


settings = Settings()
