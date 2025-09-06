# backend/app/api/v1/content_quiz_api.py
"""
API endpoints for content discovery and quiz management
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional, Dict
from datetime import datetime

from app.models.models import (
    DifficultyLevel, 
    QuizSubmission,
    ContentType
)
from app.services.content_service import ContentService
from app.services.quiz_service import QuizService
from app.main import get_db

router = APIRouter(prefix="/api/v1", tags=["content", "quiz"])

# ==================== CONTENT ENDPOINTS ====================

@router.get("/topics/{topic_id}/content")
async def get_topic_content(
    topic_id: str,
    force_refresh: bool = False,
    db = Depends(get_db)
):
    """Get all learning content for a topic"""
    try:
        # Get topic details
        topic = await db["topics"].find_one({"_id": ObjectId(topic_id)})
        if not topic:
            raise HTTPException(status_code=404, detail="Topic not found")
        
        # Get content using service
        content_service = ContentService(db)
        
        async with content_service:
            content = await content_service.get_topic_content(
                topic_id=topic_id,
                topic_name=topic["name"],
                subject_name=topic.get("subject_name", ""),
                class_level=topic["class_level"],
                force_refresh=force_refresh
            )
        
        # Get user progress if user_id provided
        # This would come from auth token in production
        
        return {
            "topic_id": topic_id,
            "topic_name": topic["name"],
            "topic_description": topic.get("description", ""),
            **content
        }
        
    except Exception as e:
        print(f"Error fetching content: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/content/{content_id}/summarize")
async def generate_content_summary(
    content_id: str,
    content_type: ContentType,
    title: str,
    url: Optional[str] = None,
    db = Depends(get_db)
):
    """Generate AI summary for video/article"""
    try:
        content_service = ContentService(db)
        
        async with content_service:
            if content_type == ContentType.VIDEO:
                summary = await content_service.generate_video_summary(url or "", title)
            else:
                # For articles, we'd need to fetch and summarize the content
                summary = {
                    "summary": f"Summary of {title}",
                    "key_points": ["Key point 1", "Key point 2"],
                    "generated_at": datetime.utcnow()
                }
        
        # Save summary to database
        await db["content"].update_one(
            {"_id": ObjectId(content_id)},
            {"$set": {"ai_summary": summary["summary"], "key_points": summary["key_points"]}},
            upsert=True
        )
        
        return summary
        
    except Exception as e:
        print(f"Error generating summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/content/mark-watched")
async def mark_content_watched(
    user_id: str,
    topic_id: str,
    content_id: str,
    content_type: ContentType,
    db = Depends(get_db)
):
    """Mark content as watched/read"""
    try:
        update_field = "videos_watched" if content_type == ContentType.VIDEO else "articles_read"
        
        # Update progress
        await db["progress"].update_one(
            {"user_id": user_id, "topic_id": topic_id},
            {
                "$addToSet": {update_field: content_id},
                "$inc": {"time_spent_minutes": 10},  # Estimate
                "$set": {"last_accessed": datetime.utcnow()}
            },
            upsert=True
        )
        
        return {"status": "success", "message": f"Content marked as {update_field}"}
        
    except Exception as e:
        print(f"Error marking content: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== QUIZ ENDPOINTS ====================

@router.get("/topics/{topic_id}/quiz")
async def generate_quiz(
    topic_id: str,
    difficulty: DifficultyLevel = DifficultyLevel.MEDIUM,
    num_questions: int = 10,
    db = Depends(get_db)
):
    """Generate or get existing quiz for topic"""
    try:
        # Get topic details
        topic = await db["topics"].find_one({"_id": ObjectId(topic_id)})
        if not topic:
            raise HTTPException(status_code=404, detail="Topic not found")
        
        # Generate quiz
        quiz_service = QuizService(db)
        quiz = await quiz_service.generate_quiz(
            topic_id=topic_id,
            topic_name=topic["name"],
            subject_name=topic.get("subject_name", ""),
            class_level=topic["class_level"],
            difficulty=difficulty,
            num_questions=num_questions
        )
        
        return quiz
        
    except Exception as e:
        print(f"Error generating quiz: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/quiz/{quiz_id}")
async def get_quiz(
    quiz_id: str,
    db = Depends(get_db)
):
    """Get quiz by ID"""
    try:
        quiz = await db["quizzes"].find_one({"_id": ObjectId(quiz_id)})
        
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")
        
        quiz["_id"] = str(quiz["_id"])
        return quiz
        
    except Exception as e:
        print(f"Error fetching quiz: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/quiz/{quiz_id}/submit")
async def submit_quiz(
    quiz_id: str,
    submission: QuizSubmission,
    db = Depends(get_db)
):
    """Submit quiz answers and get results"""
    try:
        quiz_service = QuizService(db)
        
        result = await quiz_service.submit_quiz(
            quiz_id=quiz_id,
            user_id=submission.user_id,
            answers=submission.answers,
            time_taken_minutes=submission.time_taken_minutes
        )
        
        return result
        
    except Exception as e:
        print(f"Error submitting quiz: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/{user_id}/quiz-history")
async def get_quiz_history(
    user_id: str,
    topic_id: Optional[str] = None,
    limit: int = 20,
    db = Depends(get_db)
):
    """Get user's quiz history"""
    try:
        quiz_service = QuizService(db)
        history = await quiz_service.get_quiz_history(user_id, topic_id)
        
        return {
            "user_id": user_id,
            "quiz_history": history[:limit],
            "total_quizzes": len(history)
        }
        
    except Exception as e:
        print(f"Error fetching quiz history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== PERFORMANCE ENDPOINTS ====================

@router.get("/users/{user_id}/performance")
async def get_performance_metrics(
    user_id: str,
    period: str = "week",  # week, month, all
    db = Depends(get_db)
):
    """Get user performance metrics"""
    try:
        # Get user
        user = await db["users"].find_one({"clerk_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get progress records
        progress_records = await db["progress"].find({"user_id": user_id}).to_list(1000)
        
        # Calculate metrics
        total_topics = len(progress_records)
        completed_topics = len([p for p in progress_records if p.get("status") == "completed"])
        in_progress_topics = len([p for p in progress_records if p.get("status") == "in_progress"])
        
        # Calculate average quiz score
        all_scores = []
        for record in progress_records:
            for attempt in record.get("quiz_attempts", []):
                all_scores.append(attempt["score"])
        
        avg_quiz_score = sum(all_scores) / len(all_scores) if all_scores else 0
        
        # Calculate study time
        total_study_time = sum(r.get("time_spent_minutes", 0) for r in progress_records)
        
        # Get weak topics (quiz score < 60%)
        weak_topics = []
        strong_topics = []
        
        for record in progress_records:
            best_score = record.get("best_quiz_score", 0)
            topic_id = record["topic_id"]
            
            # Get topic name
            topic = await db["topics"].find_one({"_id": ObjectId(topic_id)})
            if topic:
                if best_score < 60:
                    weak_topics.append({
                        "topic_id": topic_id,
                        "topic_name": topic["name"],
                        "best_score": best_score
                    })
                elif best_score >= 85:
                    strong_topics.append({
                        "topic_id": topic_id,
                        "topic_name": topic["name"],
                        "best_score": best_score
                    })
        
        return {
            "user_id": user_id,
            "period": period,
            "metrics": {
                "total_topics": total_topics,
                "completed_topics": completed_topics,
                "in_progress_topics": in_progress_topics,
                "completion_rate": (completed_topics / total_topics * 100) if total_topics > 0 else 0,
                "average_quiz_score": round(avg_quiz_score, 1),
                "total_study_hours": round(total_study_time / 60, 1),
                "current_streak": user.get("stats", {}).get("current_streak", 0),
                "longest_streak": user.get("stats", {}).get("longest_streak", 0)
            },
            "weak_topics": weak_topics[:5],
            "strong_topics": strong_topics[:5]
        }
        
    except Exception as e:
        print(f"Error fetching performance: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Import ObjectId
from bson import ObjectId