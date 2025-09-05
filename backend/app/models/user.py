from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"


class UserBase(BaseModel):
    email: EmailStr
    username: str
    first_name: str = ""
    last_name: str = ""
    role: UserRole = UserRole.STUDENT


class UserCreate(UserBase):
    clerk_id: str


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    age: Optional[int] = None
    date_of_birth: Optional[str] = None
    phone_number: Optional[str] = None
    class_level: Optional[str] = None
    school: Optional[str] = None
    competitive_exam: Optional[str] = None
    country: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    preferences: Optional[dict] = None
    onboarding_completed: Optional[bool] = None


class UserResponse(UserBase):
    id: str = Field(alias="_id")
    clerk_id: str
    is_active: bool = True
    onboarding_completed: bool = False
    created_at: datetime
    updated_at: datetime
    
    class Config:
        populate_by_name = True


class UserInDB(UserResponse):
    pass