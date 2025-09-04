# backend/app/models/user.py
"""
User data models using Pydantic for validation.
These models define the structure of user data throughout the application.
"""

from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class CompetitiveExam(str, Enum):
    """Supported competitive exams."""
    NONE = "none"
    JEE = "jee"
    NEET = "neet"
    CAT = "cat"
    GATE = "gate"
    UPSC = "upsc"
    OTHER = "other"


class UserRole(str, Enum):
    """User roles in the system."""
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"


class UserBase(BaseModel):
    """Base user model with common fields."""
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    email: EmailStr
    age: int = Field(..., ge=5, le=100)
    date_of_birth: datetime
    phone_number: str = Field(..., regex=r'^\+?[1-9]\d{1,14}$')
    
    @validator('phone_number')
    def validate_phone(cls, v):
        """Validate phone number format."""
        # Remove spaces and hyphens
        cleaned = v.replace(' ', '').replace('-', '')
        if len(cleaned) < 10 or len(cleaned) > 15:
            raise ValueError('Phone number must be between 10 and 15 digits')
        return cleaned


class UserEducation(BaseModel):
    """User education information."""
    class_level: str = Field(..., min_length=1, max_length=50)
    school: str = Field(..., min_length=1, max_length=100)
    competitive_exam: CompetitiveExam = Field(default=CompetitiveExam.NONE)
    competitive_exam_other: Optional[str] = None
    
    @validator('competitive_exam_other')
    def validate_other_exam(cls, v, values):
        """Validate other exam field."""
        if values.get('competitive_exam') == CompetitiveExam.OTHER and not v:
            raise ValueError('Please specify the competitive exam')
        return v


class UserLocation(BaseModel):
    """User location information."""
    country: str = Field(..., min_length=2, max_length=100)
    state: str = Field(..., min_length=2, max_length=100)
    city: str = Field(..., min_length=2, max_length=100)


class UserCreate(UserBase, UserEducation, UserLocation):
    """Model for creating a new user."""
    clerk_id: str = Field(..., min_length=1)
    role: UserRole = Field(default=UserRole.STUDENT)
    
    class Config:
        json_schema_extra = {
            "example": {
                "clerk_id": "user_2abc123def456",
                "first_name": "John",
                "last_name": "Doe",
                "email": "john.doe@example.com",
                "age": 16,
                "date_of_birth": "2008-05-15T00:00:00",
                "phone_number": "+919876543210",
                "class_level": "10th Standard",
                "school": "Delhi Public School",
                "competitive_exam": "jee",
                "country": "India",
                "state": "Delhi",
                "city": "New Delhi",
                "role": "student"
            }
        }


class UserUpdate(BaseModel):
    """Model for updating user information."""
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)
    age: Optional[int] = Field(None, ge=5, le=100)
    phone_number: Optional[str] = Field(None, regex=r'^\+?[1-9]\d{1,14}$')
    class_level: Optional[str] = Field(None, min_length=1, max_length=50)
    school: Optional[str] = Field(None, min_length=1, max_length=100)
    competitive_exam: Optional[CompetitiveExam] = None
    competitive_exam_other: Optional[str] = None
    country: Optional[str] = Field(None, min_length=2, max_length=100)
    state: Optional[str] = Field(None, min_length=2, max_length=100)
    city: Optional[str] = Field(None, min_length=2, max_length=100)


class UserPreferences(BaseModel):
    """User learning preferences."""
    preferred_language: str = Field(default="English")
    learning_pace: str = Field(default="medium")  # slow, medium, fast
    daily_study_hours: int = Field(default=2, ge=1, le=12)
    notification_enabled: bool = Field(default=True)
    email_notifications: bool = Field(default=True)
    study_reminder_time: Optional[str] = None  # Format: "HH:MM"


class UserStats(BaseModel):
    """User learning statistics."""
    total_study_hours: float = Field(default=0.0)
    topics_completed: int = Field(default=0)
    quizzes_taken: int = Field(default=0)
    average_quiz_score: float = Field(default=0.0)
    current_streak: int = Field(default=0)
    longest_streak: int = Field(default=0)
    last_active: Optional[datetime] = None


class UserInDB(UserBase, UserEducation, UserLocation):
    """User model as stored in database."""
    id: str = Field(alias="_id")
    clerk_id: str
    role: UserRole
    preferences: UserPreferences = Field(default_factory=UserPreferences)
    stats: UserStats = Field(default_factory=UserStats)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = Field(default=True)
    
    class Config:
        populate_by_name = True


class UserResponse(UserBase, UserEducation, UserLocation):
    """User model for API responses."""
    id: str
    clerk_id: str
    role: UserRole
    preferences: UserPreferences
    stats: UserStats
    created_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True