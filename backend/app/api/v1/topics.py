# backend/app/api/v1/topics.py
# COMPLETE FIXED VERSION

from fastapi import APIRouter, HTTPException, Request, Query
from typing import List, Optional
from bson import ObjectId

router = APIRouter(prefix="/api/v1", tags=["topics"])

def get_db(request: Request):
    return request.app.state.db

@router.get("/subjects/{subject_id}")
async def get_subject_details(
    request: Request,
    subject_id: str
):
    """Get subject details by ID"""
    db = get_db(request)
    
    try:
        subject = await db["subjects"].find_one({"_id": ObjectId(subject_id)})
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")
        
        # Convert ObjectId to string
        subject["id"] = str(subject.pop("_id"))
        return subject
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/subjects/{subject_id}/topics")
async def get_subject_topics(
    request: Request,
    subject_id: str,
    user_id: str = Query(...)
):
    """Get all topics for a subject - FIXED"""
    db = get_db(request)
    
    try:
        # Get user to determine class level
        user = await db["users"].find_one({"clerk_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        class_level = user["onboarding"]["class_level"]
        
        print(f"📚 Fetching topics for subject_id: {subject_id}, class: {class_level}")
        
        # Get topics for this subject and class
        topics = await db["topics"].find({
            "subject_id": subject_id,
            "class_level": class_level
        }).sort("chapter_number", 1).to_list(100)
        
        print(f"✅ Found {len(topics)} topics")
        
        # IMPORTANT: Convert ObjectId to string for each topic
        topics_list = []
        for topic in topics:
            # Convert ObjectId to string
            topic_dict = {
                "_id": str(topic["_id"]),  # Convert ObjectId to string
                "subject_id": topic.get("subject_id", ""),
                "subject_name": topic.get("subject_name", ""),
                "name": topic.get("name", ""),
                "description": topic.get("description", ""),
                "class_level": topic.get("class_level", 0),
                "chapter_number": topic.get("chapter_number", 0),
                "importance": topic.get("importance", 5),
                "estimated_hours": topic.get("estimated_hours", 1),
                "difficulty": topic.get("difficulty", "medium"),
                "prerequisites": topic.get("prerequisites", []),
                "tags": topic.get("tags", []),
                "order": topic.get("order", 0)
            }
            
            # Check if user has progress on this topic
            topic_id = str(topic["_id"])
            progress = await db["progress"].find_one({
                "user_id": user_id,
                "topic_id": topic_id
            })
            
            topic_dict["status"] = progress["status"] if progress else "not_started"
            topic_dict["progress_percentage"] = progress.get("progress_percentage", 0) if progress else 0
            
            topics_list.append(topic_dict)
        
        return topics_list
        
    except Exception as e:
        print(f"❌ Error in get_subject_topics: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/topics/{topic_id}")
async def get_topic_details(
    request: Request,
    topic_id: str
):
    """Get single topic details"""
    db = get_db(request)
    
    try:
        topic = await db["topics"].find_one({"_id": ObjectId(topic_id)})
        if not topic:
            raise HTTPException(status_code=404, detail="Topic not found")
        
        # Convert ObjectId to string
        topic["id"] = str(topic.pop("_id"))
        
        # Also convert subject_id if it's ObjectId
        if "subject_id" in topic and isinstance(topic["subject_id"], ObjectId):
            topic["subject_id"] = str(topic["subject_id"])
        
        return topic
        
    except Exception as e:
        print(f"❌ Error getting topic: {e}")
        raise HTTPException(status_code=500, detail=str(e))