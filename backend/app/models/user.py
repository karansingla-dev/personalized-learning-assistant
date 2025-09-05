# backend/app/models/user.py
"""
Unified user models for the application.
This is the ONLY user model file you need.
Delete user_complete.py after replacing with this.
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    """User roles in the system."""
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"


class UserCreate(BaseModel):
    """Model for creating a new user from sign-up."""
    clerk_id: str
    email: str
    username: str
    first_name: str = ""
    last_name: str = ""
    role: UserRole = Field(default=UserRole.STUDENT)


class OnboardingData(BaseModel):
    """Model for onboarding data."""
    clerk_id: str
    age: Optional[int] = None
    date_of_birth: Optional[str] = None
    phone_number: Optional[str] = None
    class_level: Optional[str] = None
    school: Optional[str] = None
    competitive_exam: Optional[str] = None
    country: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None


class UserUpdate(BaseModel):
    """Model for updating user information."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    onboarding_completed: Optional[bool] = None
    profile: Optional[Dict[str, Any]] = None


class UserInDB(BaseModel):
    """User model as stored in database."""
    id: Optional[str] = Field(default=None, alias="_id")
    clerk_id: str
    email: str
    username: str
    first_name: str = ""
    last_name: str = ""
    role: UserRole = Field(default=UserRole.STUDENT)
    onboarding_completed: bool = Field(default=False)
    profile: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    is_active: bool = Field(default=True)
    
    class Config:
        populate_by_name = True


class UserResponse(BaseModel):
    """User model for API responses."""
    id: Optional[str] = None
    clerk_id: str
    email: str
    username: str
    first_name: str = ""
    last_name: str = ""
    role: UserRole
    onboarding_completed: bool = False
    created_at: Optional[datetime] = None
    is_active: bool = True
    
    class Config:
        from_attributes = True