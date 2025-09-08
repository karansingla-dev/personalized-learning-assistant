# backend/app/api/v1/ai_summary_api.py
"""
AI Summary API endpoints
"""

from fastapi import APIRouter, HTTPException, Request, Query
from typing import Dict, Optional
from datetime import datetime
from bson import ObjectId

from app.services.ai_summary_service import ai_summary_service

router = APIRouter(prefix="/api/v1/ai-summary", tags=["ai-summary"])

def get_db(request: Request):
    return request.app.state.db

@router.get("/{topic_id}")
async def get_ai_summary(
    request: Request,
    topic_id: str,
    force_refresh: bool = Query(False, description="Force regenerate summary")
):
    """
    Get AI-generated summary for a topic
    """
    db = get_db(request)
    
    try:
        # Validate topic_id
        try:
            obj_id = ObjectId(topic_id)
        except:
            raise HTTPException(status_code=400, detail="Invalid topic ID format")
        
        # Check cache first (unless force refresh)
        if not force_refresh:
            cached_summary = await db["ai_summaries"].find_one({"topic_id": topic_id})
            if cached_summary:
                # Check if cache is recent (within 30 days)
                if "_id" in cached_summary:
                    del cached_summary["_id"]
                if "topic_id" in cached_summary:
                    cached_summary["topic_id"] = str(cached_summary["topic_id"])
                
                # Check cache age
                if cached_summary.get("generated_at"):
                    try:
                        cache_time = datetime.fromisoformat(cached_summary["generated_at"])
                        age_days = (datetime.utcnow() - cache_time).days
                        if age_days < 30:
                            print(f"✅ Returning cached AI summary (age: {age_days} days)")
                            cached_summary["from_cache"] = True
                            return cached_summary
                    except:
                        pass
        
        # Get topic details
        topic = await db["topics"].find_one({"_id": obj_id})
        if not topic:
            raise HTTPException(status_code=404, detail="Topic not found")
        
        # Get subject details
        subject_name = "General"
        chapter_name = None
        
        if "subject_id" in topic:
            try:
                subject_id = ObjectId(topic["subject_id"]) if isinstance(topic["subject_id"], str) else topic["subject_id"]
                subject = await db["subjects"].find_one({"_id": subject_id})
                if subject:
                    subject_name = subject.get("name", "General")
            except:
                pass
        elif "subject_name" in topic:
            subject_name = topic["subject_name"]
        
        # Get chapter name if available
        if "chapter_id" in topic:
            try:
                chapter_id = ObjectId(topic["chapter_id"]) if isinstance(topic["chapter_id"], str) else topic["chapter_id"]
                chapter = await db["chapters"].find_one({"_id": chapter_id})
                if chapter:
                    chapter_name = chapter.get("name")
            except:
                pass
        elif "chapter_name" in topic:
            chapter_name = topic["chapter_name"]
        
        # Get class level
        class_level = topic.get("class_level", 10)
        
        print(f"🤖 Generating AI summary for: {topic['name']} ({subject_name}, Class {class_level})")
        
        # Generate AI summary
        summary_data = await ai_summary_service.generate_topic_summary(
            topic_name=topic["name"],
            subject_name=subject_name,
            class_level=class_level,
            chapter_name=chapter_name
        )
        
        # Add metadata
        summary_data["topic_id"] = topic_id
        summary_data["from_cache"] = False
        
        # Cache the summary
        await db["ai_summaries"].replace_one(
            {"topic_id": topic_id},
            {**summary_data, "topic_id": topic_id},
            upsert=True
        )
        
        print(f"✅ AI summary generated and cached")
        
        return summary_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error generating AI summary: {e}")
        import traceback
        traceback.print_exc()
        
        # Return a basic summary on error
        return {
            "topic_id": topic_id,
            "topic_name": "Topic",
            "subject": "Subject",
            "class_level": 10,
            "generated_at": datetime.utcnow().isoformat(),
            "overview": "AI summary generation failed. Please try again later.",
            "error": str(e),
            "from_cache": False
        }

@router.post("/{topic_id}/regenerate")
async def regenerate_ai_summary(
    request: Request,
    topic_id: str
):
    """
    Force regenerate AI summary for a topic
    """
    return await get_ai_summary(request, topic_id, force_refresh=True)

@router.get("/health/check")
async def check_ai_service_health():
    """
    Check if AI summary service is working
    """
    import os
    
    gemini_configured = bool(os.getenv('GEMINI_API_KEY'))
    
    # Test generation with a simple prompt
    test_working = False
    if gemini_configured:
        try:
            test_summary = await ai_summary_service.generate_topic_summary(
                topic_name="Test Topic",
                subject_name="Mathematics",
                class_level=10,
                chapter_name="Test Chapter"
            )
            test_working = bool(test_summary.get("overview"))
        except:
            test_working = False
    
    return {
        "service": "AI Summary Service",
        "status": "healthy" if gemini_configured else "degraded",
        "gemini_api_configured": gemini_configured,
        "test_generation_successful": test_working,
        "message": "AI summaries working" if test_working else "Using fallback summaries"
    }