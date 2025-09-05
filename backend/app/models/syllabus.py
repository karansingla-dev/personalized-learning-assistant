# backend/app/models/syllabus.py
"""
Data models for syllabus and related entities
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class Topic(BaseModel):
    """Topic model for course topics."""
    id: Optional[str] = Field(alias="_id", default=None)
    name: str
    description: str
    importance: int = Field(ge=1, le=10)
    prerequisites: List[str] = []
    estimated_hours: float = 1.0
    syllabus_id: str
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed: bool = False
    progress_percentage: float = 0.0
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class Syllabus(BaseModel):
    """Syllabus model for uploaded course syllabi."""
    id: Optional[str] = Field(alias="_id", default=None)
    user_id: str
    file_name: str
    file_hash: str
    content: str  # Partial content for preview
    full_content: Optional[str] = None  # Full extracted text
    status: str = "pending"  # pending, processing, completed, failed
    topics: List[Topic] = []
    metadata: Dict[str, Any] = {}
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    processed_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class User(BaseModel):
    """User model synchronized with Clerk."""
    id: Optional[str] = Field(alias="_id", default=None)
    clerk_id: str
    email: str
    first_name: str
    last_name: str
    age: Optional[int] = None
    date_of_birth: Optional[str] = None
    education_info: Dict[str, Any] = {}
    contact_info: Dict[str, Any] = {}
    location: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    onboarding_completed: bool = False
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class StudyPlan(BaseModel):
    """Study plan model for user learning schedules."""
    id: Optional[str] = Field(alias="_id", default=None)
    user_id: str
    syllabus_id: str
    topic_ids: List[str] = []
    daily_hours: float = 2.0
    start_date: datetime
    end_date: datetime
    schedule: List[Dict[str, Any]] = []  # Daily/weekly breakdown
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class Progress(BaseModel):
    """Progress tracking model."""
    id: Optional[str] = Field(alias="_id", default=None)
    user_id: str
    topic_id: str
    syllabus_id: str
    status: str = "not_started"  # not_started, in_progress, completed
    progress_percentage: float = 0.0
    time_spent_minutes: float = 0
    last_accessed: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    notes: List[str] = []
    quiz_scores: List[float] = []
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class Quiz(BaseModel):
    """Quiz model for topic assessments."""
    id: Optional[str] = Field(alias="_id", default=None)
    topic_id: str
    syllabus_id: str
    questions: List[Dict[str, Any]] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    difficulty: str = "medium"  # easy, medium, hard
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class Note(BaseModel):
    """Note model for user notes on topics."""
    id: Optional[str] = Field(alias="_id", default=None)
    user_id: str
    topic_id: str
    syllabus_id: str
    title: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    tags: List[str] = []
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}