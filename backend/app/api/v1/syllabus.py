# backend/app/api/v1/syllabus.py
"""
Syllabus management endpoints with PDF processing
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form, Request
from typing import List, Optional
import PyPDF2
import io
import hashlib
from datetime import datetime
import google.generativeai as genai
from bson import ObjectId
import json

from app.config import settings
from app.models.syllabus import Syllabus, Topic

# Initialize router
router = APIRouter()

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-pro')

def get_db(request: Request):
    """Get database from request state."""
    return request.app.state.db

@router.post("/upload")
async def upload_syllabus(
    request: Request,
    file: UploadFile = File(...),
    user_id: str = Form(...)
):
    """
    Upload and process a syllabus PDF file.
    Extracts text, identifies topics using AI, and stores in database.
    """
    db = get_db(request)
    
    # Validate file type
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # Check file size
    contents = await file.read()
    if len(contents) > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"File size exceeds {settings.MAX_FILE_SIZE/1024/1024}MB limit")
    
    try:
        # Extract text from PDF
        pdf_text = extract_pdf_text(contents)
        if not pdf_text:
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")
        
        # Generate file hash for duplicate detection
        file_hash = hashlib.md5(contents).hexdigest()
        
        # Check for duplicate
        existing = await db[settings.SYLLABUS_COLLECTION].find_one({
            "user_id": user_id,
            "file_hash": file_hash
        })
        
        if existing:
            return {
                "id": str(existing["_id"]),
                "message": "This syllabus has already been uploaded",
                "status": "duplicate"
            }
        
        # Create syllabus document
        syllabus_doc = {
            "user_id": user_id,
            "file_name": file.filename,
            "file_hash": file_hash,
            "content": pdf_text[:5000],  # Store first 5000 chars for reference
            "full_content": pdf_text,
            "status": "processing",
            "uploaded_at": datetime.utcnow(),
            "processed_at": None,
            "topics": [],
            "metadata": {
                "file_size": len(contents),
                "page_count": count_pdf_pages(contents),
                "word_count": len(pdf_text.split())
            }
        }
        
        # Insert into database
        result = await db[settings.SYLLABUS_COLLECTION].insert_one(syllabus_doc)
        syllabus_id = str(result.inserted_id)
        
        # Process topics asynchronously (in production, use a task queue)
        topics = await extract_topics_with_ai(pdf_text, syllabus_id)
        
        # Update syllabus with topics
        await db[settings.SYLLABUS_COLLECTION].update_one(
            {"_id": ObjectId(syllabus_id)},
            {
                "$set": {
                    "topics": topics,
                    "status": "completed",
                    "processed_at": datetime.utcnow()
                }
            }
        )
        
        # Store topics in separate collection for easier querying
        if topics:
            topic_docs = [
                {
                    "syllabus_id": syllabus_id,
                    "user_id": user_id,
                    **topic
                }
                for topic in topics
            ]
            await db[settings.TOPICS_COLLECTION].insert_many(topic_docs)
        
        return {
            "id": syllabus_id,
            "fileName": file.filename,
            "status": "completed",
            "message": "Syllabus uploaded and processed successfully",
            "topics_count": len(topics)
        }
        
    except Exception as e:
        print(f"Error processing syllabus: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing syllabus: {str(e)}")

@router.get("/list")
async def get_user_syllabi(
    request: Request,
    user_id: str
):
    """Get all syllabi for a user."""
    db = get_db(request)
    
    try:
        print(f"Fetching syllabi for user: {user_id}")
        syllabi = await db[settings.SYLLABUS_COLLECTION].find(
            {"user_id": user_id}
        ).sort("uploaded_at", -1).to_list(length=100)
        
        print(f"Found {len(syllabi)} syllabi for user {user_id}")
        # Convert ObjectId to string
        for syllabus in syllabi:
            syllabus["id"] = str(syllabus.pop("_id"))
            # Remove large content fields from list view
            syllabus.pop("full_content", None)
            syllabus.pop("content", None)
        
        return syllabi
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{syllabus_id}")
async def get_syllabus(
    request: Request,
    syllabus_id: str
):
    """Get a specific syllabus with its topics."""
    db = get_db(request)
    
    try:
        syllabus = await db[settings.SYLLABUS_COLLECTION].find_one(
            {"_id": ObjectId(syllabus_id)}
        )
        
        if not syllabus:
            raise HTTPException(status_code=404, detail="Syllabus not found")
        
        syllabus["id"] = str(syllabus.pop("_id"))
        syllabus.pop("full_content", None)  # Don't send full content to frontend
        
        return syllabus
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{syllabus_id}/topics")
async def get_syllabus_topics(
    request: Request,
    syllabus_id: str
):
    """Get all topics for a syllabus."""
    db = get_db(request)
    
    try:
        topics = await db[settings.TOPICS_COLLECTION].find(
            {"syllabus_id": syllabus_id}
        ).sort("importance", -1).to_list(length=200)
        
        for topic in topics:
            topic["id"] = str(topic.pop("_id", ""))
        
        return topics
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{syllabus_id}")
async def delete_syllabus(
    request: Request,
    syllabus_id: str
):
    """Delete a syllabus and its associated topics."""
    db = get_db(request)
    
    try:
        # Validate ObjectId format
        try:
            obj_id = ObjectId(syllabus_id)
        except:
            raise HTTPException(status_code=400, detail="Invalid syllabus ID format")
        
        # Delete syllabus
        result = await db[settings.SYLLABUS_COLLECTION].delete_one(
            {"_id": obj_id}
        )
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Syllabus not found")
        
        # Delete associated topics
        await db[settings.TOPICS_COLLECTION].delete_many(
            {"syllabus_id": syllabus_id}
        )
        
        return {"message": "Syllabus deleted successfully", "deleted": True}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting syllabus: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Helper functions
def extract_pdf_text(pdf_content: bytes) -> str:
    """Extract text from PDF content."""
    try:
        pdf_file = io.BytesIO(pdf_content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        
        return text.strip()
    except Exception as e:
        print(f"Error extracting PDF text: {e}")
        return ""

def count_pdf_pages(pdf_content: bytes) -> int:
    """Count number of pages in PDF."""
    try:
        pdf_file = io.BytesIO(pdf_content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        return len(pdf_reader.pages)
    except:
        return 0

async def extract_topics_with_ai(text: str, syllabus_id: str) -> List[dict]:
    """Use Gemini AI to extract and analyze topics from syllabus text."""
    try:
        # Prepare prompt for Gemini
        prompt = f"""
        Analyze the following syllabus text and extract the main topics.
        For each topic, provide:
        1. Topic name
        2. Brief description (2-3 sentences)
        3. Importance level (1-10, where 10 is most important)
        4. Prerequisites (if any)
        5. Estimated learning time (in hours)
        
        Format the response as a JSON array with objects containing:
        - name: string
        - description: string
        - importance: number
        - prerequisites: array of strings
        - estimated_hours: number
        
        Syllabus text:
        {text[:4000]}  # Limit text to avoid token limits
        
        Return ONLY the JSON array, no additional text.
        """
        
        # Generate response
        response = model.generate_content(prompt)
        
        # Parse JSON response
        try:
            # Clean the response text
            json_text = response.text.strip()
            # Remove markdown code blocks if present
            if json_text.startswith("```json"):
                json_text = json_text[7:]
            if json_text.startswith("```"):
                json_text = json_text[3:]
            if json_text.endswith("```"):
                json_text = json_text[:-3]
            
            topics = json.loads(json_text)
            
            # Validate and clean topics
            validated_topics = []
            for topic in topics[:20]:  # Limit to 20 topics
                validated_topic = {
                    "name": topic.get("name", "Unknown Topic"),
                    "description": topic.get("description", ""),
                    "importance": min(10, max(1, topic.get("importance", 5))),
                    "prerequisites": topic.get("prerequisites", []),
                    "estimated_hours": topic.get("estimated_hours", 5),
                    "syllabus_id": syllabus_id,
                    "created_at": datetime.utcnow()
                }
                validated_topics.append(validated_topic)
            
            return validated_topics
            
        except json.JSONDecodeError as e:
            print(f"Error parsing AI response: {e}")
            # Return basic topics if AI fails
            return [
                {
                    "name": "Course Overview",
                    "description": "Introduction to the course content",
                    "importance": 8,
                    "prerequisites": [],
                    "estimated_hours": 2,
                    "syllabus_id": syllabus_id,
                    "created_at": datetime.utcnow()
                }
            ]
            
    except Exception as e:
        print(f"Error with AI extraction: {e}")
        return []