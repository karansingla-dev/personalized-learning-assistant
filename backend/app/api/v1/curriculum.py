from fastapi import APIRouter, HTTPException, Request, Query
from typing import Optional, List
from app.data.curriculum_data import CURRICULUM_DATA, get_curriculum_for_user
from app.services.ai_service import ai_service

router = APIRouter()

def get_db(request: Request):
    return request.app.state.db

@router.get("/subjects")
async def get_subjects(
    request: Request,
    user_id: str = Query(...),
):
    """Get subjects based on user's class and board"""
    
    db = get_db(request)
    
    # Get user details
    user = await db["users"].find_one({"clerk_id": user_id})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    board = user.get("board", "CBSE")
    class_level = user.get("class_level", "11")
    stream = user.get("stream", "Science")
    
    curriculum = get_curriculum_for_user(board, class_level, stream)
    subjects = curriculum.get("subjects", [])
    
    # Add progress info for each subject
    for subject in subjects:
        # Get user's progress
        progress = await db["progress"].find_one({
            "user_id": user_id,
            "subject_code": subject["code"]
        })
        
        subject["progress"] = progress.get("percentage", 0) if progress else 0
        subject["completed_topics"] = progress.get("completed_topics", []) if progress else []
    
    return {
        "board": board,
        "class": class_level,
        "stream": stream,
        "subjects": subjects
    }

@router.get("/chapters/{subject_code}")
async def get_chapters(
    request: Request,
    subject_code: str,
    user_id: str = Query(...),
):
    """Get chapters for a subject"""
    
    db = get_db(request)
    user = await db["users"].find_one({"clerk_id": user_id})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    board = user.get("board", "CBSE")
    class_level = user.get("class_level", "11")
    stream = user.get("stream", "Science")
    
    curriculum = get_curriculum_for_user(board, class_level, stream)
    subjects = curriculum.get("subjects", [])
    
    # Find the subject
    subject = next((s for s in subjects if s["code"] == subject_code), None)
    
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    return {
        "subject": subject["name"],
        "chapters": subject.get("chapters", [])
    }

@router.get("/topics/{subject_code}/{chapter_number}")
async def get_topics(
    request: Request,
    subject_code: str,
    chapter_number: int,
    user_id: str = Query(...),
):
    """Get topics for a chapter"""
    
    db = get_db(request)
    user = await db["users"].find_one({"clerk_id": user_id})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    board = user.get("board", "CBSE")
    class_level = user.get("class_level", "11")
    stream = user.get("stream", "Science")
    
    curriculum = get_curriculum_for_user(board, class_level, stream)
    subjects = curriculum.get("subjects", [])
    
    # Find subject and chapter
    subject = next((s for s in subjects if s["code"] == subject_code), None)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    chapter = next((c for c in subject.get("chapters", []) if c["number"] == chapter_number), None)
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    # Get user's progress for these topics
    topics = chapter.get("topics", [])
    for topic in topics:
        progress = await db["topic_progress"].find_one({
            "user_id": user_id,
            "topic_id": topic["id"]
        })
        topic["completed"] = progress.get("completed", False) if progress else False
        topic["last_studied"] = progress.get("last_studied") if progress else None
    
    return {
        "chapter": chapter["name"],
        "topics": topics
    }

@router.post("/generate-content")
async def generate_ai_content(
    request: Request,
    topic_id: str,
    topic_name: str,
    subject: str,
    class_level: int
):
    """Generate AI content for a topic"""
    
    db = get_db(request)
    
    # Check cache first
    cached = await db["ai_content_cache"].find_one({"topic_id": topic_id})
    
    if cached:
        return cached
    
    # Generate new content
    explanation = await ai_service.generate_explanation(topic_name, subject, class_level)
    resources = await ai_service.search_web_resources(topic_name, subject, class_level)
    questions = await ai_service.generate_practice_questions(topic_name, class_level)
    
    content = {
        "topic_id": topic_id,
        "topic_name": topic_name,
        "explanation": explanation,
        "web_resources": resources,
        "practice_questions": questions,
        "generated_at": datetime.utcnow()
    }
    
    # Cache it
    await db["ai_content_cache"].insert_one(content)
    
    return content

@router.post("/summarize-video")
async def summarize_video(video_url: str):
    """Summarize a YouTube video"""
    return await ai_service.summarize_video(video_url)

@router.post("/generate-schedule")
async def generate_schedule(
    request: Request,
    user_id: str,
    exam_dates: List[dict] = []
):
    """Generate personalized study schedule"""
    
    db = get_db(request)
    user = await db["users"].find_one({"clerk_id": user_id})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's subjects
    board = user.get("board", "CBSE")
    class_level = user.get("class_level", "11")
    stream = user.get("stream", "Science")
    
    curriculum = get_curriculum_for_user(board, class_level, stream)
    subjects = [s["name"] for s in curriculum.get("subjects", [])][:3]
    
    schedule = await ai_service.generate_study_schedule(
        user_id=user_id,
        subjects=subjects,
        daily_hours=3.0,
        exam_dates=exam_dates
    )
    
    # Save schedule
    await db["study_schedules"].insert_one({
        "user_id": user_id,
        **schedule
    })
    
    return schedule