# backend/app/models/user.py
"""
User model with username from Clerk (not asked in onboarding)
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
import re

class User(BaseModel):
    """User model for the learning platform"""
    
    # Authentication fields (from Clerk)
    clerk_id: str
    email: str
    username: str  # Generated from Clerk data or provided during sign-up
    
    # Personal Information
    first_name: str
    last_name: str
    phone_number: str  # Indian format: +91XXXXXXXXXX
    
    # Location Information
    city: str
    state: str
    country: str = "India"  # Default to India
    
    # Educational Information
    class_level: str  # "6", "7", "8", "9", "10", "11", "12"
    board: str  # "CBSE", "ICSE", "STATE"
    stream: Optional[str] = None  # "Science", "Commerce", "Arts" (for 11-12)
    target_exams: List[str] = []  # ["JEE", "NEET", "BOARDS"]
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Optional fields
    profile_picture: Optional[str] = None
    bio: Optional[str] = None
    preferred_language: str = "English"  # "English", "Hindi", "Regional"
    
    # Validators
    @validator('phone_number')
    def validate_phone(cls, v):
        """Validate Indian phone number format"""
        if not v:
            raise ValueError('Phone number is required')
            
        # Remove spaces and special characters
        cleaned = re.sub(r'[\s\-\(\)]', '', v)
        
        # Check if it matches Indian phone format
        if not re.match(r'^(\+91)?[6-9]\d{9}$', cleaned):
            raise ValueError('Invalid Indian phone number format')
        
        # Standardize to +91 format
        if not cleaned.startswith('+91'):
            if cleaned.startswith('91') and len(cleaned) == 12:
                cleaned = '+' + cleaned
            else:
                cleaned = '+91' + cleaned[-10:]
        
        return cleaned
    
    @validator('email')
    def validate_email(cls, v):
        """Validate email format"""
        if not re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', v):
            raise ValueError('Invalid email format')
        return v.lower()
    
    @validator('username')
    def validate_username(cls, v):
        """Validate username - auto-generated from Clerk or provided"""
        if not v:
            raise ValueError('Username is required')
        # Clean up the username
        cleaned = re.sub(r'[^a-zA-Z0-9_]', '', v)
        if len(cleaned) < 3:
            # If too short after cleaning, add some random chars
            import random
            import string
            cleaned += ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))
        return cleaned.lower()[:20]  # Limit to 20 chars
    
    @validator('class_level')
    def validate_class(cls, v):
        """Validate class level"""
        valid_classes = ["6", "7", "8", "9", "10", "11", "12"]
        if v not in valid_classes:
            raise ValueError(f'Class must be one of {valid_classes}')
        return v
    
    @validator('board')
    def validate_board(cls, v):
        """Validate education board"""
        valid_boards = ["CBSE", "ICSE", "STATE"]
        if v.upper() not in valid_boards:
            raise ValueError(f'Board must be one of {valid_boards}')
        return v.upper()
    
    @validator('stream')
    def validate_stream(cls, v, values):
        """Validate stream (only for classes 11-12)"""
        if v:
            class_level = values.get('class_level')
            if class_level not in ["11", "12"]:
                # Clear stream if not in 11 or 12
                return None
            
            valid_streams = ["Science", "Commerce", "Arts", "Humanities"]
            if v.capitalize() not in valid_streams:
                raise ValueError(f'Stream must be one of {valid_streams}')
            return v.capitalize()
        return v
    
    @validator('city')
    def validate_city(cls, v):
        """Validate city name"""
        if not v or len(v.strip()) < 2:
            raise ValueError('Please enter a valid city name')
        return v.strip().title()  # Capitalize first letter of each word
    
    @validator('state')
    def validate_state(cls, v):
        """Validate state name"""
        if not v or len(v.strip()) < 2:
            raise ValueError('Please select a state')
        return v.strip()
    
    class Config:
        """Pydantic config"""
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class UserCreate(BaseModel):
    """Schema for creating a new user during onboarding"""
    clerk_id: str
    email: str
    username: str  # Will be auto-generated from Clerk data
    first_name: str
    last_name: str
    phone_number: str
    city: str
    state: str
    country: str = "India"
    class_level: str
    board: str
    stream: Optional[str] = None
    target_exams: List[str] = []


class UserUpdate(BaseModel):
    """Schema for updating user information"""
    phone_number: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    class_level: Optional[str] = None
    board: Optional[str] = None
    stream: Optional[str] = None
    target_exams: Optional[List[str]] = None
    bio: Optional[str] = None
    preferred_language: Optional[str] = None


class UserResponse(BaseModel):
    """Schema for user response (excludes sensitive data)"""
    id: str
    username: str
    email: str
    first_name: str
    last_name: str
    phone_number: str
    city: str
    state: str
    country: str
    class_level: str
    board: str
    stream: Optional[str]
    target_exams: List[str]
    profile_picture: Optional[str]
    bio: Optional[str]
    preferred_language: str
    created_at: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }