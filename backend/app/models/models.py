# backend/app/models/models.py
"""
Complete database models for the learning platform
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, time
from enum import Enum
from bson import ObjectId

# ==================== ENUMS ====================

class BoardType(str, Enum):
    CBSE = "CBSE"
    ICSE = "ICSE"
    STATE = "STATE"
    IB = "IB"

class ExamType(str, Enum):
    JEE = "JEE"
    NEET = "NEET"
    BOARDS = "BOARDS"
    OLYMPIAD = "OLYMPIAD"
    SAT = "SAT"

class ContentType(str, Enum):
    VIDEO = "video"
    ARTICLE = "article"
    BLOG = "blog"
    PDF = "pdf"
    INTERACTIVE = "interactive"

class DifficultyLevel(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class ProgressStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

class QuestionType(str, Enum):
    MCQ = "mcq"
    TRUE_FALSE = "true_false"
    SHORT_ANSWER = "short_answer"
    NUMERICAL = "numerical"

# ==================== USER MODEL ====================

class OnboardingData(BaseModel):
    """User onboarding information"""
    completed: bool = False
    class_level: int = Field(ge=6, le=12)  # Class 6-12
    board: BoardType
    target_exams: List[ExamType] = []
    preferred_language: str = "English"
    school_name: Optional[str] = None
    city: str
    state: str

class StudySchedule(BaseModel):
    """User's study schedule preferences"""
    school_start: str = "09:00"  # Time format HH:MM
    school_end: str = "15:00"
    preferred_study_time: str = "evening"  # morning/evening/night
    daily_study_hours: int = Field(ge=1, le=6, default=3)
    exam_date: Optional[datetime] = None
    preparation_duration_weeks: Optional[int] = None
    weekend_hours: int = Field(ge=1, le=8, default=4)

class UserStats(BaseModel):
    """User performance statistics"""
    topics_completed: int = 0
    total_study_hours: float = 0
    average_quiz_score: float = 0
    current_streak: int = 0
    longest_streak: int = 0
    badges_earned: List[str] = []
    weak_topics: List[str] = []
    strong_topics: List[str] = []

class User(BaseModel):
    """Complete user model"""
    id: Optional[str] = Field(alias="_id", default=None)
    clerk_id: str
    email: str
    username: str
    first_name: str
    last_name: str
    
    onboarding: OnboardingData
    study_schedule: StudySchedule
    stats: UserStats
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_active: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

# ==================== SUBJECT MODEL ====================

class Subject(BaseModel):
    """Subject model"""
    id: Optional[str] = Field(alias="_id", default=None)
    name: str  # Mathematics, Physics, etc.
    code: str  # MATH, PHY, CHEM
    icon: str  # 🔢, ⚛️, 🧪
    description: str
    color_gradient: Dict[str, str]  # {"from": "#667eea", "to": "#764ba2"}
    class_levels: List[int]  # [9, 10, 11, 12]
    boards: List[BoardType]
    order: int  # Display order
    is_active: bool = True
    topic_count: int = 0
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

# ==================== TOPIC MODEL ====================

class ExamWeightage(BaseModel):
    """Exam weightage for topics"""
    JEE: int = 0  # Percentage
    NEET: int = 0
    BOARDS: int = 0

class Topic(BaseModel):
    """Topic model"""
    id: Optional[str] = Field(alias="_id", default=None)
    subject_id: str
    subject_name: str  # Denormalized for easier queries
    name: str
    description: str
    class_level: int
    board: BoardType
    
    # Topic metadata
    difficulty: DifficultyLevel
    importance: int = Field(ge=1, le=10)  # 1-10 scale
    estimated_hours: float
    prerequisites: List[str] = []  # Topic IDs
    next_topics: List[str] = []  # Topic IDs
    
    # Learning content
    learning_objectives: List[str] = []
    key_concepts: List[str] = []
    formulas: List[str] = []
    
    # Exam relevance
    exam_weightage: ExamWeightage
    
    tags: List[str] = []
    is_active: bool = True
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

# ==================== LEARNING CONTENT MODEL ====================

class LearningContent(BaseModel):
    """Scraped/curated learning content"""
    id: Optional[str] = Field(alias="_id", default=None)
    topic_id: str
    type: ContentType
    source: str  # youtube, khan_academy, medium, etc.
    
    # Content details
    title: str
    url: str
    thumbnail_url: Optional[str] = None
    author: Optional[str] = None
    duration_minutes: Optional[int] = None  # For videos
    reading_time: Optional[int] = None  # For articles
    
    # AI generated
    ai_summary: Optional[str] = None
    key_points: List[str] = []
    transcript: Optional[str] = None  # For videos
    
    # Quality metrics
    relevance_score: float = Field(ge=0, le=1)  # 0-1
    quality_score: float = Field(ge=0, le=1)
    difficulty_match: float = Field(ge=0, le=1)
    views: int = 0
    likes: int = 0
    
    scraped_at: datetime = Field(default_factory=datetime.utcnow)
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

# ==================== USER PROGRESS MODEL ====================

class QuizAttempt(BaseModel):
    """Individual quiz attempt"""
    quiz_id: str
    score: float
    passed: bool
    time_taken_minutes: int
    attempted_at: datetime = Field(default_factory=datetime.utcnow)

class UserProgress(BaseModel):
    """User's progress on topics"""
    id: Optional[str] = Field(alias="_id", default=None)
    user_id: str
    topic_id: str
    subject_id: str  # Denormalized
    
    status: ProgressStatus = ProgressStatus.NOT_STARTED
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    # Content progress
    videos_watched: List[str] = []  # Content IDs
    articles_read: List[str] = []
    time_spent_minutes: float = 0
    
    # Quiz performance
    quiz_attempts: List[QuizAttempt] = []
    best_quiz_score: float = 0
    
    # User generated
    notes: List[str] = []
    bookmarks: List[str] = []  # Content IDs
    
    last_accessed: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

# ==================== QUIZ MODEL ====================

class Question(BaseModel):
    """Quiz question"""
    question_id: str
    question_text: str
    question_type: QuestionType
    options: List[str] = []  # For MCQ
    correct_answer: str
    explanation: str
    points: int = 1
    difficulty: DifficultyLevel

class Quiz(BaseModel):
    """Quiz for topics"""
    id: Optional[str] = Field(alias="_id", default=None)
    topic_id: str
    topic_name: str  # Denormalized
    difficulty: DifficultyLevel
    
    questions: List[Question]
    
    total_points: int
    passing_score: int  # 80% typically
    time_limit_minutes: int = 30
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    ai_generated: bool = True
    version: int = 1
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

# ==================== STUDY PLAN MODEL ====================

class TimeSlot(BaseModel):
    """Individual study time slot"""
    time_start: str  # "16:00"
    time_end: str    # "17:00"
    subject_id: str
    subject_name: str
    topic_id: str
    topic_name: str
    content_type: ContentType
    is_revision: bool = False

class WeeklySchedule(BaseModel):
    """Weekly study schedule"""
    monday: List[TimeSlot] = []
    tuesday: List[TimeSlot] = []
    wednesday: List[TimeSlot] = []
    thursday: List[TimeSlot] = []
    friday: List[TimeSlot] = []
    saturday: List[TimeSlot] = []
    sunday: List[TimeSlot] = []

class StudyPlan(BaseModel):
    """AI-generated study plan"""
    id: Optional[str] = Field(alias="_id", default=None)
    user_id: str
    name: str
    target_exam: Optional[ExamType] = None
    
    # Schedule
    start_date: datetime
    end_date: datetime
    daily_hours: int
    
    # AI generated schedule
    weekly_schedule: WeeklySchedule
    
    topics_to_cover: List[str]  # Topic IDs in order
    revision_schedule: Dict[str, List[str]] = {}  # Date -> Topic IDs
    mock_test_dates: List[datetime] = []
    
    # Tracking
    completed_topics: List[str] = []
    current_week: int = 1
    adherence_percentage: float = 0  # How well user follows plan
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

# ==================== REQUEST/RESPONSE MODELS ====================

class OnboardingRequest(BaseModel):
    """Onboarding completion request"""
    clerk_id: str
    class_level: int
    board: BoardType
    target_exams: List[ExamType]
    school_name: Optional[str]
    city: str
    state: str
    school_start: str
    school_end: str
    daily_study_hours: int

class SearchRequest(BaseModel):
    """Search request"""
    query: str
    type: Optional[str] = None  # topic, subject, question
    class_level: Optional[int] = None
    subject_id: Optional[str] = None

class QuizSubmission(BaseModel):
    """Quiz submission"""
    quiz_id: str
    user_id: str
    answers: Dict[str, str]  # question_id -> answer
    time_taken_minutes: int

class StudyPlanRequest(BaseModel):
    """Study plan generation request"""
    user_id: str
    target_exam: Optional[ExamType]
    exam_date: datetime
    subjects: List[str]  # Subject IDs
    daily_hours: int
    preparation_weeks: int

class OnboardingRequest(BaseModel):
    """Onboarding completion request - with all optional fields for testing"""
    clerk_id: str
    class_level: int = 10
    board: str = "CBSE"
    target_exams: List[str] = ["JEE", "BOARDS"]
    school_name: Optional[str] = "Test School"
    city: str = "Mumbai"
    state: str = "Maharashtra"
    school_start: str = "08:00"
    school_end: str = "14:00"
    daily_study_hours: int = 3
    
    # Optional fields with defaults
    email: Optional[str] = None
    username: Optional[str] = None
    first_name: Optional[str] = "Test"
    last_name: Optional[str] = "User"
    preferred_language: Optional[str] = "English"
    preferred_study_time: Optional[str] = "evening"
    weekend_hours: Optional[int] = 4