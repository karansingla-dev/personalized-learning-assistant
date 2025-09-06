# backend/app/config.py
"""
Application configuration and settings.
Handles all environment variables and settings.
"""

from typing import Optional, List
from pydantic_settings import BaseSettings
from pydantic import Field, validator
import os
from pathlib import Path


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    Uses pydantic for validation and type checking.
    """
    
    # Application
    APP_NAME: str = "Learning Assistant API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = Field(default=True, env="DEBUG")
    
    # API Configuration
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Learning Assistant"
    
    # Security
    SECRET_KEY: str = Field(default="your-secret-key-change-in-production", env="SECRET_KEY")
    ALGORITHM: str = Field(default="HS256", env="ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    
    # Clerk Authentication
    CLERK_SECRET_KEY: Optional[str] = Field(None, env="CLERK_SECRET_KEY")
    CLERK_WEBHOOK_SECRET: Optional[str] = Field(None, env="CLERK_WEBHOOK_SECRET")
    
    # Database
    MONGODB_URL: str = Field(default="mongodb://localhost:27017", env="MONGODB_URL")
    DATABASE_NAME: str = Field(default="learning_assistant", env="DATABASE_NAME")
    
    # MongoDB Atlas specific settings
    MONGODB_MAX_POOL_SIZE: int = Field(default=50, env="MONGODB_MAX_POOL_SIZE")
    MONGODB_MIN_POOL_SIZE: int = Field(default=10, env="MONGODB_MIN_POOL_SIZE")
    MONGODB_SERVER_SELECTION_TIMEOUT: int = Field(default=5000, env="MONGODB_SERVER_SELECTION_TIMEOUT")
    MONGODB_RETRY_WRITES: bool = Field(default=True, env="MONGODB_RETRY_WRITES")
    
    # MongoDB Collections
    USERS_COLLECTION: str = "users"
    SYLLABUS_COLLECTION: str = "syllabi"
    TOPICS_COLLECTION: str = "topics"
    QUIZ_COLLECTION: str = "quizzes"
    NOTES_COLLECTION: str = "notes"
    PROGRESS_COLLECTION: str = "progress"
    STUDY_PLANS_COLLECTION: str = "study_plans"
    TOPIC_CONTENT_COLLECTION: str = "topic_content"
    LEARNING_RESOURCES_COLLECTION: str = "learning_resources"
    
    # Google Gemini
    GEMINI_API_KEY: Optional[str] = Field(None, env="GEMINI_API_KEY")
    GEMINI_MODEL: str = Field(default="gemini-pro", env="GEMINI_MODEL")
    
    # YouTube API (Optional - for better video recommendations)
    YOUTUBE_API_KEY: Optional[str] = Field(None, env="YOUTUBE_API_KEY")
    YOUTUBE_API_URL: Optional[str] = Field(None, env="YOUTUBE_API_URL")
    
    # Educational Content Settings
    MAX_VIDEOS_PER_TOPIC: int = Field(default=10, env="MAX_VIDEOS_PER_TOPIC")
    MAX_ARTICLES_PER_TOPIC: int = Field(default=10, env="MAX_ARTICLES_PER_TOPIC")
    CONTENT_CACHE_HOURS: int = Field(default=24, env="CONTENT_CACHE_HOURS")
    
    # Content Sources
    ENABLE_YOUTUBE_SEARCH: bool = Field(default=True, env="ENABLE_YOUTUBE_SEARCH")
    ENABLE_ARTICLE_SEARCH: bool = Field(default=True, env="ENABLE_ARTICLE_SEARCH")
    
    # File Upload
    MAX_FILE_SIZE: int = Field(default=10485760, env="MAX_FILE_SIZE")  # 10MB
    UPLOAD_DIR: Path = Field(default=Path("./uploads"), env="UPLOAD_DIR")
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".txt", ".doc", ".docx"]
    
    # CORS
    FRONTEND_URL: str = Field(default="http://localhost:3000", env="FRONTEND_URL")
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001", "*"],
        env="CORS_ORIGINS"
    )
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = Field(default=False, env="RATE_LIMIT_ENABLED")
    RATE_LIMIT_REQUESTS: int = Field(default=100, env="RATE_LIMIT_REQUESTS")
    RATE_LIMIT_PERIOD: int = Field(default=60, env="RATE_LIMIT_PERIOD")  # seconds
    
    # Logging
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    LOG_FILE: str = Field(default="app.log", env="LOG_FILE")
    
    @validator("CORS_ORIGINS", pre=True)
    def parse_cors_origins(cls, v):
        """Parse CORS origins from comma-separated string or list."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    @validator("UPLOAD_DIR", pre=True)
    def create_upload_dir(cls, v):
        """Ensure upload directory exists."""
        upload_path = Path(v)
        upload_path.mkdir(parents=True, exist_ok=True)
        return upload_path
    
    class Config:
        """Pydantic configuration."""
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        # Allow any extra fields from environment
        extra = "ignore"  # This allows extra env vars without errors
        
    def get_mongodb_url_with_db(self) -> str:
        """Get MongoDB URL with database name."""
        if self.DATABASE_NAME in self.MONGODB_URL:
            return self.MONGODB_URL
        return f"{self.MONGODB_URL}/{self.DATABASE_NAME}"


# Create settings instance
settings = Settings()

# Export commonly used settings
PROJECT_NAME = settings.PROJECT_NAME
API_V1_PREFIX = settings.API_V1_PREFIX
DEBUG = settings.DEBUG