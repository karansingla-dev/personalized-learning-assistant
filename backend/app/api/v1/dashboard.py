# backend/app/api/v1/dashboard.py
"""
Dashboard API endpoints for the learning platform
Provides all data needed for the main dashboard view
"""

from fastapi import APIRouter, HTTPException, Request, Query
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from bson import ObjectId
import random

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])

def get_db(request: Request):
    """Get database from app state"""
    return request.app.state.db

@router.get("")
async def get_dashboard_data(
    request: Request,
    user_id: str = Query(..., description="User's Clerk ID")
):
    """
    Get complete dashboard data for a user including:
    - User profile and streak
    - Subjects with progress
    - Study statistics
    - Recent activity
    - Today's schedule (if exists)
    """
    db = get_db(request)
    
    try:
        # ========================================
        # 1. GET USER PROFILE
        # ========================================
        user = await db["users"].find_one({"clerk_id": user_id})
        
        # ========================================
        # 2. GET SUBJECTS FOR USER'S CLASS
        # ========================================
        class_level = user["onboarding"]["class_level"]
        board = user["onboarding"]["board"]
        
        # Build query based on class level
        subject_query = {
            "class_levels": class_level,
            "boards": board
        }
        
        # Add stream filter for classes 11-12
        if class_level in [11, 12] and user["onboarding"].get("stream"):
            subject_query["stream"] = user["onboarding"]["stream"]
        
        subjects = await db["subjects"].find(subject_query).sort("order", 1).to_list(10)
        
        # ========================================
        # 3. CALCULATE PROGRESS FOR EACH SUBJECT
        # ========================================
        subject_progress = []
        total_completed = 0
        total_topics_count = 0
        
        for subject in subjects:
            subject_id = str(subject["_id"])
            
            # Get all topics for this subject and class
            topics = await db["topics"].find({
                "subject_id": subject_id,
                "class_level": class_level
            }).to_list(100)
            
            total_topics = len(topics)
            total_topics_count += total_topics
            
            # Get completed topics (from progress collection)
            completed_topics = await db["progress"].count_documents({
                "user_id": user_id,
                "subject_id": subject_id,
                "status": "completed"
            })
            
            # Get in-progress topics
            in_progress = await db["progress"].count_documents({
                "user_id": user_id,
                "subject_id": subject_id,
                "status": "in_progress"
            })
            
            total_completed += completed_topics
            
            # Calculate percentage
            progress_percentage = round((completed_topics / total_topics * 100) if total_topics > 0 else 0, 1)
            
            subject_progress.append({
                "subject_id": subject_id,
                "subject_name": subject["name"],
                "subject_code": subject["code"],
                "icon": subject.get("icon", "📚"),
                "color": subject.get("color", "#6B7280"),
                "description": subject.get("description", ""),
                "total_topics": total_topics,
                "completed_topics": completed_topics,
                "in_progress_topics": in_progress,
                "progress_percentage": progress_percentage,
                "next_topic": topics[completed_topics]["name"] if completed_topics < len(topics) else None
            })
        
        # ========================================
        # 4. CALCULATE STUDY STATISTICS
        # ========================================
        
        # Get all user's progress records
        all_progress = await db["progress"].find({"user_id": user_id}).to_list(1000)
        
        # Calculate total study time
        total_study_minutes = sum([p.get("time_spent_minutes", 0) for p in all_progress])
        total_study_hours = round(total_study_minutes / 60, 1)
        
        # Calculate average quiz score
        quiz_scores = []
        for progress in all_progress:
            for attempt in progress.get("quiz_attempts", []):
                quiz_scores.append(attempt["score"])
        
        avg_quiz_score = round(sum(quiz_scores) / len(quiz_scores), 1) if quiz_scores else 0
        
        # Calculate study streak (simplified - check if studied yesterday)
        yesterday = datetime.utcnow() - timedelta(days=1)
        studied_yesterday = await db["progress"].find_one({
            "user_id": user_id,
            "last_accessed": {"$gte": yesterday}
        })
        
        study_streak = user.get("study_streak", 0)
        if studied_yesterday:
            study_streak += 1
            await db["users"].update_one(
                {"clerk_id": user_id},
                {"$set": {"study_streak": study_streak}}
            )
        
        # ========================================
        # 5. GET RECENT ACTIVITY
        # ========================================
        recent_activity = await db["progress"].find({
            "user_id": user_id
        }).sort("last_accessed", -1).limit(5).to_list(5)
        
        # Format recent activity
        formatted_activity = []
        for activity in recent_activity:
            # Get topic details
            topic = await db["topics"].find_one({"_id": ObjectId(activity["topic_id"])})
            if topic:
                formatted_activity.append({
                    "topic_name": topic["name"],
                    "subject_id": topic["subject_id"],
                    "status": activity["status"],
                    "last_accessed": activity.get("last_accessed", datetime.utcnow()),
                    "time_spent": activity.get("time_spent_minutes", 0)
                })
        
        # ========================================
        # 6. GET TODAY'S SCHEDULE (IF EXISTS)
        # ========================================
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_schedule = await db["study_plans"].find_one({
            "user_id": user_id,
            "date": {"$gte": today_start}
        })
        
        # Create a sample schedule if none exists
        if not today_schedule:
            school_end = user["onboarding"]["school_timing"]["end"]
            hour = int(school_end.split(":")[0]) + 1  # Start 1 hour after school
            
            today_schedule = {
                "slots": [
                    {
                        "time": f"{hour}:00 - {hour+1}:00",
                        "subject": subject_progress[0]["subject_name"] if subject_progress else "Mathematics",
                        "topic": "Continue learning",
                        "type": "learn"
                    },
                    {
                        "time": f"{hour+1}:30 - {hour+2}:30",
                        "subject": subject_progress[1]["subject_name"] if len(subject_progress) > 1 else "Science",
                        "topic": "Practice problems",
                        "type": "practice"
                    }
                ]
            }
        
        # ========================================
        # 7. GENERATE MOTIVATIONAL QUOTE
        # ========================================
        quotes = [
            "Success is the sum of small efforts repeated day in and day out.",
            "The expert in anything was once a beginner.",
            "Education is the passport to the future.",
            "Every accomplishment starts with the decision to try.",
            "Learning is a treasure that will follow its owner everywhere."
        ]
        
        # ========================================
        # 8. BUILD RESPONSE
        # ========================================
        response = {
            "user": {
                "name": user.get("name", "Student"),
                "class_level": class_level,
                "board": board,
                "stream": user["onboarding"].get("stream"),
                "study_streak": study_streak
            },
            "stats": {
                "total_topics": total_topics_count,
                "topics_completed": total_completed,
                "completion_percentage": round((total_completed / total_topics_count * 100) if total_topics_count > 0 else 0, 1),
                "average_quiz_score": avg_quiz_score,
                "total_study_hours": total_study_hours,
                "study_streak_days": study_streak,
                "topics_this_week": len([a for a in recent_activity if a.get("last_accessed", datetime.utcnow()) > datetime.utcnow() - timedelta(days=7)])
            },
            "subjects": subject_progress,
            "recent_activity": formatted_activity,
            "today_schedule": today_schedule,
            "motivational_quote": random.choice(quotes),
            "quick_actions": [
                {
                    "label": "Continue Learning",
                    "action": "continue",
                    "subject_id": subject_progress[0]["subject_id"] if subject_progress else None
                },
                {
                    "label": "Take a Quiz",
                    "action": "quiz",
                    "enabled": total_completed > 0
                },
                {
                    "label": "View Schedule",
                    "action": "schedule"
                },
                {
                    "label": "Practice Problems",
                    "action": "practice"
                }
            ]
        }
        
        return response
        
    except Exception as e:
        print(f"Dashboard API Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/subjects")
async def get_subjects(
    request: Request,
    user_id: str = Query(...),
    class_level: Optional[int] = Query(None)
):
    """Get all subjects for a user's class"""
    db = get_db(request)
    
    # Get user to determine class level
    user = await db["users"].find_one({"clerk_id": user_id})
    if not user and not class_level:
        raise HTTPException(status_code=400, detail="User not found and class_level not provided")
    
    if not class_level:
        class_level = user["onboarding"]["class_level"]
    
    # Get subjects
    subjects = await db["subjects"].find({
        "class_levels": class_level,
        "board": "CBSE"  # Default to CBSE
    }).sort("order", 1).to_list(20)
    
    # Convert ObjectId to string
    for subject in subjects:
        subject["id"] = str(subject.pop("_id"))
    
    return subjects

@router.get("/stats")
async def get_user_stats(
    request: Request,
    user_id: str = Query(...)
):
    """Get detailed statistics for a user"""
    db = get_db(request)
    
    # Get all progress records
    progress_records = await db["progress"].find({"user_id": user_id}).to_list(1000)
    
    # Calculate various stats
    total_topics = len(progress_records)
    completed_topics = len([p for p in progress_records if p["status"] == "completed"])
    in_progress_topics = len([p for p in progress_records if p["status"] == "in_progress"])
    
    # Time stats
    total_minutes = sum([p.get("time_spent_minutes", 0) for p in progress_records])
    
    # Quiz stats
    all_quiz_scores = []
    for record in progress_records:
        for attempt in record.get("quiz_attempts", []):
            all_quiz_scores.append(attempt["score"])
    
    return {
        "topics": {
            "total": total_topics,
            "completed": completed_topics,
            "in_progress": in_progress_topics,
            "not_started": total_topics - completed_topics - in_progress_topics
        },
        "time": {
            "total_hours": round(total_minutes / 60, 1),
            "average_per_topic": round(total_minutes / total_topics, 1) if total_topics > 0 else 0
        },
        "quiz": {
            "attempts": len(all_quiz_scores),
            "average_score": round(sum(all_quiz_scores) / len(all_quiz_scores), 1) if all_quiz_scores else 0,
            "highest_score": max(all_quiz_scores) if all_quiz_scores else 0,
            "lowest_score": min(all_quiz_scores) if all_quiz_scores else 0
        }
    }