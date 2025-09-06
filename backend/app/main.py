# backend/app/main.py
"""
Main FastAPI application with all routes
"""

from fastapi import FastAPI, HTTPException, Request, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import List, Optional
from datetime import datetime
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

from app.models.models import *
from app.config import settings
from app.api.v1 import curriculum, auth, users


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global database client
db_client = None
database = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown"""
    global db_client, database
    
    # Startup
    logger.info("Starting up...")
    
    try:
        # Connect to MongoDB
        db_client = AsyncIOMotorClient(settings.MONGODB_URL)
        database = db_client[settings.DATABASE_NAME]
        
        # Store in app state
        app.state.db = database
        app.state.db_client = db_client
        
        # Test connection
        await db_client.admin.command('ping')
        logger.info(f"Connected to MongoDB: {settings.DATABASE_NAME}")
        
        # Create indexes
        await create_indexes(database)
        
        # Initialize default data
        await initialize_subjects(database)
        
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    if db_client:
        db_client.close()

async def create_indexes(db):
    """Create database indexes"""
    # User indexes
    await db["users"].create_index("clerk_id", unique=True)
    await db["users"].create_index("email", unique=True)
    
    # Subject indexes
    await db["subjects"].create_index("code", unique=True)
    await db["subjects"].create_index("class_levels")
    
    # Topic indexes
    await db["topics"].create_index("subject_id")
    await db["topics"].create_index("class_level")
    await db["topics"].create_index([("importance", -1)])
    
    # Progress indexes
    await db["progress"].create_index([("user_id", 1), ("topic_id", 1)], unique=True)
    await db["progress"].create_index("user_id")
    
    # Content indexes
    await db["content"].create_index("topic_id")
    await db["content"].create_index([("relevance_score", -1)])
    
    logger.info("Database indexes created")

async def initialize_subjects(db):
    """Initialize default subjects if not exists"""
    subjects_count = await db["subjects"].count_documents({})
    
    if subjects_count == 0:
        default_subjects = [
            {
                "name": "Mathematics",
                "code": "MATH",
                "icon": "🔢",
                "description": "Numbers, equations, and problem-solving",
                "color_gradient": {"from": "#667eea", "to": "#764ba2"},
                "class_levels": [6, 7, 8, 9, 10, 11, 12],
                "boards": ["CBSE", "ICSE", "STATE"],
                "order": 1,
                "is_active": True
            },
            {
                "name": "Physics",
                "code": "PHY",
                "icon": "⚛️",
                "description": "Study of matter, energy, and forces",
                "color_gradient": {"from": "#f093fb", "to": "#f5576c"},
                "class_levels": [9, 10, 11, 12],
                "boards": ["CBSE", "ICSE", "STATE"],
                "order": 2,
                "is_active": True
            },
            {
                "name": "Chemistry",
                "code": "CHEM",
                "icon": "🧪",
                "description": "Elements, compounds, and reactions",
                "color_gradient": {"from": "#4facfe", "to": "#00f2fe"},
                "class_levels": [9, 10, 11, 12],
                "boards": ["CBSE", "ICSE", "STATE"],
                "order": 3,
                "is_active": True
            },
            {
                "name": "Biology",
                "code": "BIO",
                "icon": "🧬",
                "description": "Life sciences and living organisms",
                "color_gradient": {"from": "#43e97b", "to": "#38f9d7"},
                "class_levels": [9, 10, 11, 12],
                "boards": ["CBSE", "ICSE", "STATE"],
                "order": 4,
                "is_active": True
            },
            {
                "name": "Computer Science",
                "code": "CS",
                "icon": "💻",
                "description": "Programming and computational thinking",
                "color_gradient": {"from": "#fa709a", "to": "#fee140"},
                "class_levels": [6, 7, 8, 9, 10, 11, 12],
                "boards": ["CBSE", "ICSE"],
                "order": 5,
                "is_active": True
            }
        ]
        
        await db["subjects"].insert_many(default_subjects)
        logger.info("Default subjects initialized")

# Create FastAPI app
app = FastAPI(
    title="Learning Platform API",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(curriculum.router, prefix="/api/v1/curriculum", tags=["curriculum"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])


def get_db(request: Request):
    """Get database from request"""
    return request.app.state.db

# ==================== ONBOARDING ENDPOINTS ====================

@app.post("/api/v1/onboarding/complete")
async def complete_onboarding(
    data: OnboardingRequest,
    db = Depends(get_db)
):
    """Complete user onboarding - FIXED VERSION"""
    try:
        # Check if user exists
        user = await db["users"].find_one({"clerk_id": data.clerk_id})
        
        if not user:
            # Create new user
            user_data = {
                "clerk_id": data.clerk_id,
                "onboarding": {
                    "completed": True,
                    "class_level": data.class_level,
                    "board": data.board,
                    "target_exams": data.target_exams,
                    "school_name": data.school_name,
                    "city": data.city,
                    "state": data.state
                },
                "study_schedule": {
                    "school_start": data.school_start,
                    "school_end": data.school_end,
                    "daily_study_hours": data.daily_study_hours
                },
                "stats": UserStats().dict(),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            result = await db["users"].insert_one(user_data)
            # Don't include the MongoDB _id in the response
            return {
                "status": "success",
                "user": {
                    "clerk_id": data.clerk_id,
                    "onboarding_completed": True
                },
                "redirect": "/dashboard"
            }
        else:
            # Update existing user
            await db["users"].update_one(
                {"clerk_id": data.clerk_id},
                {
                    "$set": {
                        "onboarding": {
                            "completed": True,
                            "class_level": data.class_level,
                            "board": data.board,
                            "target_exams": data.target_exams,
                            "school_name": data.school_name,
                            "city": data.city,
                            "state": data.state
                        },
                        "study_schedule": {
                            "school_start": data.school_start,
                            "school_end": data.school_end,
                            "daily_study_hours": data.daily_study_hours
                        },
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            # Return simple response without MongoDB objects
            return {
                "status": "success",
                "user": {
                    "clerk_id": data.clerk_id,
                    "onboarding_completed": True
                },
                "redirect": "/dashboard"
            }
            
    except Exception as e:
        logger.error(f"Onboarding error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== SUBJECT & TOPIC ENDPOINTS ====================

@app.get("/api/v1/subjects")
async def get_subjects(
    class_level: Optional[int] = None,
    board: Optional[str] = None,
    db = Depends(get_db)
):
    """Get all subjects"""
    try:
        query = {"is_active": True}
        
        if class_level:
            query["class_levels"] = class_level
        if board:
            query["boards"] = board
            
        subjects = await db["subjects"].find(query).sort("order", 1).to_list(100)
        
        # Convert ObjectId to string
        for subject in subjects:
            subject["_id"] = str(subject["_id"])
            
            # Get topic count for each subject
            topic_count = await db["topics"].count_documents({
                "subject_id": subject["_id"],
                "is_active": True
            })
            subject["topic_count"] = topic_count
        
        return subjects
        
    except Exception as e:
        logger.error(f"Error fetching subjects: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/subjects/{subject_id}/topics")
async def get_subject_topics(
    subject_id: str,
    class_level: Optional[int] = None,
    db = Depends(get_db)
):
    """Get all topics for a subject"""
    try:
        query = {
            "subject_id": subject_id,
            "is_active": True
        }
        
        if class_level:
            query["class_level"] = class_level
            
        topics = await db["topics"].find(query).sort("importance", -1).to_list(200)
        
        # Convert ObjectId to string
        for topic in topics:
            topic["_id"] = str(topic["_id"])
        
        return topics
        
    except Exception as e:
        logger.error(f"Error fetching topics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/topics/{topic_id}")
async def get_topic_details(
    topic_id: str,
    db = Depends(get_db)
):
    """Get detailed information about a topic"""
    try:
        topic = await db["topics"].find_one({"_id": ObjectId(topic_id)})
        
        if not topic:
            raise HTTPException(status_code=404, detail="Topic not found")
        
        topic["_id"] = str(topic["_id"])
        
        # Get content count
        content_count = await db["content"].count_documents({"topic_id": topic_id})
        topic["content_count"] = content_count
        
        return topic
        
    except Exception as e:
        logger.error(f"Error fetching topic: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== SEARCH ENDPOINT ====================

@app.get("/api/v1/search")
async def global_search(
    query: str,
    type: Optional[str] = None,
    class_level: Optional[int] = None,
    limit: int = 20,
    db = Depends(get_db)
):
    """Global search across all content"""
    try:
        results = []
        
        # Search topics
        if not type or type == "topic":
            topic_query = {
                "$or": [
                    {"name": {"$regex": query, "$options": "i"}},
                    {"description": {"$regex": query, "$options": "i"}},
                    {"tags": {"$regex": query, "$options": "i"}}
                ],
                "is_active": True
            }
            
            if class_level:
                topic_query["class_level"] = class_level
                
            topics = await db["topics"].find(topic_query).limit(limit).to_list(limit)
            
            for topic in topics:
                topic["_id"] = str(topic["_id"])
                topic["result_type"] = "topic"
                results.append(topic)
        
        # Search subjects
        if not type or type == "subject":
            subject_query = {
                "$or": [
                    {"name": {"$regex": query, "$options": "i"}},
                    {"description": {"$regex": query, "$options": "i"}}
                ],
                "is_active": True
            }
            
            subjects = await db["subjects"].find(subject_query).limit(10).to_list(10)
            
            for subject in subjects:
                subject["_id"] = str(subject["_id"])
                subject["result_type"] = "subject"
                results.append(subject)
        
        return {"results": results, "count": len(results)}
        
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== USER PROGRESS ENDPOINTS ====================

@app.get("/api/v1/users/{user_id}/progress")
async def get_user_progress(
    user_id: str,
    db = Depends(get_db)
):
    """Get user's overall progress"""
    try:
        # Get all user progress records
        progress_records = await db["progress"].find({"user_id": user_id}).to_list(1000)
        
        # Calculate statistics
        total_topics = await db["topics"].count_documents({"is_active": True})
        completed_topics = len([p for p in progress_records if p.get("status") == "completed"])
        in_progress_topics = len([p for p in progress_records if p.get("status") == "in_progress"])
        
        # Get user stats
        user = await db["users"].find_one({"clerk_id": user_id})
        user_stats = user.get("stats", {}) if user else {}
        
        # Calculate subject-wise progress
        subjects = await db["subjects"].find({"is_active": True}).to_list(10)
        subject_progress = []
        
        for subject in subjects:
            subject_topics = await db["topics"].count_documents({
                "subject_id": str(subject["_id"]),
                "is_active": True
            })
            
            subject_completed = len([
                p for p in progress_records 
                if p.get("subject_id") == str(subject["_id"]) and 
                p.get("status") == "completed"
            ])
            
            subject_progress.append({
                "subject_id": str(subject["_id"]),
                "subject_name": subject["name"],
                "icon": subject["icon"],
                "total_topics": subject_topics,
                "completed_topics": subject_completed,
                "percentage": (subject_completed / subject_topics * 100) if subject_topics > 0 else 0
            })
        
        return {
            "total_topics": total_topics,
            "completed_topics": completed_topics,
            "in_progress_topics": in_progress_topics,
            "completion_percentage": (completed_topics / total_topics * 100) if total_topics > 0 else 0,
            "subject_progress": subject_progress,
            "stats": user_stats
        }
        
    except Exception as e:
        logger.error(f"Error fetching progress: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/progress/topic/{topic_id}/start")
async def start_topic(
    topic_id: str,
    user_id: str,
    db = Depends(get_db)
):
    """Mark topic as started"""
    try:
        # Get topic details
        topic = await db["topics"].find_one({"_id": ObjectId(topic_id)})
        if not topic:
            raise HTTPException(status_code=404, detail="Topic not found")
        
        # Check if progress exists
        progress = await db["progress"].find_one({
            "user_id": user_id,
            "topic_id": topic_id
        })
        
        if not progress:
            # Create new progress
            progress_data = {
                "user_id": user_id,
                "topic_id": topic_id,
                "subject_id": topic["subject_id"],
                "status": "in_progress",
                "started_at": datetime.utcnow(),
                "videos_watched": [],
                "articles_read": [],
                "time_spent_minutes": 0,
                "quiz_attempts": [],
                "best_quiz_score": 0,
                "last_accessed": datetime.utcnow()
            }
            
            await db["progress"].insert_one(progress_data)
        else:
            # Update existing progress
            await db["progress"].update_one(
                {"_id": progress["_id"]},
                {
                    "$set": {
                        "status": "in_progress",
                        "last_accessed": datetime.utcnow()
                    }
                }
            )
        
        return {"status": "success", "message": "Topic started"}
        
    except Exception as e:
        logger.error(f"Error starting topic: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/progress/topic/{topic_id}/complete")
async def complete_topic(
    topic_id: str,
    user_id: str,
    db = Depends(get_db)
):
    """Mark topic as completed"""
    try:
        # Update progress
        result = await db["progress"].update_one(
            {"user_id": user_id, "topic_id": topic_id},
            {
                "$set": {
                    "status": "completed",
                    "completed_at": datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Progress record not found")
        
        # Update user stats
        await db["users"].update_one(
            {"clerk_id": user_id},
            {
                "$inc": {"stats.topics_completed": 1},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        return {"status": "success", "message": "Topic completed"}
        
    except Exception as e:
        logger.error(f"Error completing topic: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== HEALTH CHECK ====================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow()}

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Learning Platform API", "version": "1.0.0"}