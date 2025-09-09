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
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # ========================================
        # 2. GET SUBJECTS FOR USER'S CLASS
        # ========================================
        class_level = user.get("onboarding", {}).get("class_level", 10)
        board = user.get("onboarding", {}).get("board", "CBSE")
        
        # Build query based on class level
        subject_query = {
            "class_levels": class_level,
            "boards": board
        }
        
        # Add stream filter for classes 11-12
        if class_level in [11, 12] and user.get("onboarding", {}).get("stream"):
            subject_query["stream"] = user["onboarding"]["stream"]
        
        subjects = await db["subjects"].find(subject_query).sort("order", 1).to_list(10)
        
        # ========================================
        # 3. CALCULATE PROGRESS FOR EACH SUBJECT
        # ========================================
        subjects_with_progress = []
        total_completed = 0
        total_topics = 0
        
        for subject in subjects:
            subject_id = str(subject["_id"])
            
            # Get all topics for this subject
            topics = await db["topics"].find({
                "subject_id": subject_id,
                "class_level": class_level
            }).to_list(100)
            
            topic_count = len(topics)
            total_topics += topic_count
            
            # Get user's progress for these topics
            completed_count = 0
            if topics:
                topic_ids = [str(t["_id"]) for t in topics]
                completed = await db["progress"].count_documents({
                    "user_id": user_id,
                    "topic_id": {"$in": topic_ids},
                    "status": "completed"
                })
                completed_count = completed
                total_completed += completed
            
            # Calculate progress percentage
            progress_percentage = (completed_count / topic_count * 100) if topic_count > 0 else 0
            
            # Get next topic (first incomplete topic)
            next_topic = None
            if topics:
                for topic in topics:
                    topic_progress = await db["progress"].find_one({
                        "user_id": user_id,
                        "topic_id": str(topic["_id"])
                    })
                    if not topic_progress or topic_progress.get("status") != "completed":
                        next_topic = topic["name"]
                        break
            
            # Get subject icons based on name
            icon_map = {
                "Physics": "⚡",
                "Mathematics": "📐",
                "Chemistry": "🧪",
                "Biology": "🧬",
                "Computer Science": "💻",
                "English": "📚",
                "History": "📜",
                "Geography": "🌍",
                "Economics": "💰",
                "Business Studies": "💼",
                "Accountancy": "📊",
                "Political Science": "⚖️"
            }
            
            subjects_with_progress.append({
                "id": subject_id,
                "name": subject["name"],
                "code": subject.get("code", ""),
                "icon": icon_map.get(subject["name"], "📖"),
                "total_topics": topic_count,
                "completed_topics": completed_count,
                "progress_percentage": round(progress_percentage, 1),
                "next_topic": next_topic,
                "current_streak": random.randint(0, 7) if completed_count > 0 else 0  # TODO: Calculate from activity
            })
        
        # ========================================
        # 4. CALCULATE STUDY STATISTICS
        # ========================================
        # Calculate current streak (days in a row with activity)
        current_streak = await calculate_streak(db, user_id)
        
        # Calculate total points (based on completed topics and quizzes)
        total_points = total_completed * 100  # 100 points per completed topic
        
        # Calculate user level (every 500 points = 1 level)
        user_level = max(1, (total_points // 500) + 1)
        
        # Weekly statistics (using placeholder data for now)
        today = datetime.utcnow()
        week_start = today - timedelta(days=7)
        
        # TODO: Replace with actual calculations from activity logs
        total_hours_this_week = round(random.uniform(10, 40), 1)
        average_daily_hours = round(total_hours_this_week / 7, 1)
        topics_completed_this_week = random.randint(3, 15)
        weekly_goal_progress = min(100, random.randint(40, 120))
        quiz_accuracy = random.randint(60, 95)
        
        # Calculate changes (comparison with last week)
        hours_change = random.randint(-20, 20)
        topics_change = random.randint(-30, 30)
        goal_change = random.randint(-15, 15)
        accuracy_change = random.randint(-10, 10)
        
        # ========================================
        # 5. GET RECENT ACTIVITY
        # ========================================
        recent_activity = []
        
        # Get recent progress updates
        recent_progress = await db["progress"].find({
            "user_id": user_id
        }).sort("updated_at", -1).limit(10).to_list(10)
        
        for progress in recent_progress:
            # Get topic details
            topic = await db["topics"].find_one({"_id": ObjectId(progress["topic_id"])})
            if topic:
                activity_type = "completed" if progress.get("status") == "completed" else "started"
                recent_activity.append({
                    "type": activity_type,
                    "title": f"{activity_type.capitalize()} {topic['name']}",
                    "subject": topic.get("subject_name", ""),
                    "timestamp": progress.get("updated_at", datetime.utcnow()).isoformat()
                })
        
        # Add some sample quiz activities (TODO: Replace with actual quiz data)
        if random.random() > 0.5:
            recent_activity.append({
                "type": "quiz",
                "title": "Scored 85% in Physics Quiz",
                "subject": "Physics",
                "timestamp": (datetime.utcnow() - timedelta(hours=random.randint(1, 48))).isoformat(),
                "score": 85
            })
        
        # Sort by timestamp
        recent_activity = sorted(recent_activity, key=lambda x: x["timestamp"], reverse=True)[:10]
        
        # ========================================
        # 6. BUILD RESPONSE
        # ========================================
        response = {
            "user_info": {
                "name": user.get("first_name", "Student") + " " + user.get("last_name", ""),
                "email": user.get("email", ""),
                "class_level": class_level,
                "board": board,
                "stream": user.get("onboarding", {}).get("stream"),
                "current_streak": current_streak,
                "total_points": total_points,
                "level": user_level
            },
            "subjects": subjects_with_progress,
            "study_stats": {
                "total_hours_this_week": total_hours_this_week,
                "hours_change": hours_change,
                "average_daily_hours": average_daily_hours,
                "topics_completed_this_week": topics_completed_this_week,
                "topics_change": topics_change,
                "weekly_goal_progress": weekly_goal_progress,
                "goal_change": goal_change,
                "quiz_accuracy": quiz_accuracy,
                "accuracy_change": accuracy_change
            },
            "recent_activity": recent_activity,
            "quick_actions": [
                {
                    "label": "Continue Learning",
                    "action": "continue",
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
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Dashboard API Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

async def calculate_streak(db, user_id: str) -> int:
    """Calculate the current study streak for a user"""
    try:
        # Get user's activity in the last 30 days
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=30)
        
        # Get all progress updates in the last 30 days
        progress_updates = await db["progress"].find({
            "user_id": user_id,
            "updated_at": {"$gte": start_date, "$lte": end_date}
        }).sort("updated_at", -1).to_list(100)
        
        if not progress_updates:
            return 0
        
        # Group by date
        dates_with_activity = set()
        for update in progress_updates:
            date = update.get("updated_at", datetime.utcnow()).date()
            dates_with_activity.add(date)
        
        # Calculate streak
        current_streak = 0
        today = datetime.utcnow().date()
        
        # Check consecutive days backwards from today
        for i in range(30):
            check_date = today - timedelta(days=i)
            if check_date in dates_with_activity:
                current_streak += 1
            else:
                # Allow one day gap for today if it's still early
                if i == 0 and datetime.utcnow().hour < 6:
                    continue
                else:
                    break
        
        return current_streak
    except Exception as e:
        print(f"Error calculating streak: {e}")
        return 0

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
        class_level = user.get("onboarding", {}).get("class_level", 10)
    
    # Get subjects
    subjects = await db["subjects"].find({
        "class_levels": class_level,
        "boards": "CBSE"  # Default to CBSE
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
    """Get detailed user statistics"""
    db = get_db(request)
    
    # Implementation for detailed stats
    # TODO: Add actual implementation
    return {
        "total_study_hours": 0,
        "topics_completed": 0,
        "quizzes_taken": 0,
        "average_score": 0
    }