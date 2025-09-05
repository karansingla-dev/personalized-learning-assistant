# backend/app/models/learning_content.py
"""
Models for learning content (videos, articles, etc.)
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class ContentType(str, Enum):
    VIDEO = "video"
    ARTICLE = "article"
    TUTORIAL = "tutorial"
    DOCUMENTATION = "documentation"
    COURSE = "course"

class ContentSource(str, Enum):
    YOUTUBE = "youtube"
    MEDIUM = "medium"
    DEVTO = "dev.to"
    HASHNODE = "hashnode"
    FREECODECAMP = "freecodecamp"
    COURSERA = "coursera"
    UDEMY = "udemy"
    CUSTOM = "custom"

class LearningResource(BaseModel):
    """Individual learning resource (video, article, etc.)"""
    id: Optional[str] = Field(alias="_id", default=None)
    topic_id: str
    syllabus_id: str
    content_type: ContentType
    source: ContentSource
    
    # Content details
    title: str
    description: str
    url: str
    thumbnail_url: Optional[str] = None
    author: Optional[str] = None
    author_url: Optional[str] = None
    
    # Metadata
    duration_minutes: Optional[int] = None  # For videos
    reading_time_minutes: Optional[int] = None  # For articles
    difficulty_level: str = "intermediate"  # beginner, intermediate, advanced
    
    # Quality metrics
    view_count: Optional[int] = None
    like_count: Optional[int] = None
    rating: Optional[float] = None
    relevance_score: float = 0.0  # AI-calculated relevance
    
    # Timestamps
    published_date: Optional[datetime] = None
    fetched_at: datetime = Field(default_factory=datetime.utcnow)
    last_validated: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True

class TopicContent(BaseModel):
    """Complete learning content for a topic"""
    id: Optional[str] = Field(alias="_id", default=None)
    topic_id: str
    syllabus_id: str
    user_id: str
    
    # Topic details (cached)
    topic_name: str
    topic_description: str
    
    # AI-generated explanation
    explanation: str
    simplified_explanation: Optional[str] = None  # ELI5 version
    key_concepts: List[str] = []
    learning_objectives: List[str] = []
    
    # Learning resources
    videos: List[LearningResource] = []
    articles: List[LearningResource] = []
    tutorials: List[LearningResource] = []
    
    # Best recommendations (top picks)
    best_video: Optional[LearningResource] = None
    best_article: Optional[LearningResource] = None
    
    # Study metadata
    estimated_time_hours: float = 1.0
    prerequisites: List[str] = []
    next_topics: List[str] = []
    
    # User progress
    is_completed: bool = False
    completion_percentage: float = 0.0
    last_accessed: Optional[datetime] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True

class ContentSearchQuery(BaseModel):
    """Query for searching learning content"""
    topic_name: str
    subject_area: Optional[str] = None
    difficulty_level: str = "intermediate"
    max_results: int = 10
    content_types: List[ContentType] = [ContentType.VIDEO, ContentType.ARTICLE]