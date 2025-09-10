# backend/app/api/v1/video_summary.py
"""
Video Summary API - Fixed version with proper transcript fetching
"""

from fastapi import APIRouter, HTTPException, Request, Query
from typing import Dict, Optional, List
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os
import re
import html
import google.generativeai as genai
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import TranscriptsDisabled, NoTranscriptFound, VideoUnavailable

router = APIRouter(prefix="/api/v1/video-summary", tags=["video-summary"])
load_dotenv()
# Configure Gemini AI
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-pro')
else:
    model = None

def get_db(request: Request):
    return request.app.state.db

@router.post("/{video_id}/summarize")
async def summarize_video(
    request: Request,
    video_id: str,
    video_title: Optional[str] = Query(None),
    force_refresh: bool = Query(False)
):
    """
    Generate AI summary from YouTube video subtitles
    """
    db = get_db(request)
    
    try:
        print(f"📝 Summarizing video: {video_id}")
        
        # Check cache first (unless force refresh)
        if not force_refresh:
            cached_summary = await db["video_summaries"].find_one({
                "video_id": video_id
            })
            
            if cached_summary:
                # Check if cache is recent (within 30 days)
                cache_time = cached_summary.get("created_at")
                if cache_time:
                    age_days = (datetime.utcnow() - cache_time).days
                    if age_days < 30:
                        print(f"✅ Returning cached summary (age: {age_days} days)")
                        cached_summary["_id"] = str(cached_summary["_id"])
                        cached_summary["from_cache"] = True
                        return cached_summary
        
        # Step 1: Fetch video transcript/subtitles
        transcript_data = fetch_video_transcript_simple(video_id)
        
        if not transcript_data or not transcript_data.get("transcript"):
            return {
                "success": False,
                "error": "No subtitles available",
                "message": "This video doesn't have subtitles/captions available. Try another video from educational channels like Khan Academy or Physics Wallah.",
                "video_id": video_id
            }
        
        # Step 2: Generate AI summary
        summary = await generate_ai_summary(
            transcript_data["transcript"],
            transcript_data["duration"],
            video_title
        )
        
        # Step 3: Extract key timestamps and topics
        key_points = extract_key_points(transcript_data["segments"])
        
        # Prepare summary data
        summary_data = {
            "video_id": video_id,
            "video_title": video_title or "Unknown Title",
            "duration_minutes": transcript_data["duration"],
            "language": transcript_data["language"],
            "summary": summary["summary"],
            "key_points": summary["key_points"],
            "topics_covered": summary["topics"],
            "timestamps": key_points[:5],  # Top 5 key timestamps
            "transcript_length": len(transcript_data["transcript"]),
            "created_at": datetime.utcnow(),
            "success": True
        }
        
        # Cache the summary
        await db["video_summaries"].replace_one(
            {"video_id": video_id},
            summary_data,
            upsert=True
        )
        
        summary_data["_id"] = str(summary_data.get("_id", ""))
        summary_data["from_cache"] = False
        
        return summary_data
        
    except Exception as e:
        print(f"❌ Error in summarize_video: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to generate summary. The video may not have subtitles or there was an error processing.",
            "video_id": video_id
        }

def fetch_video_transcript_simple(video_id: str) -> Dict:
    """
    Simple and robust transcript fetching
    """
    try:
        print(f"🔍 Fetching transcript for video: {video_id}")
        
        transcript_list = None
        language = "Unknown"
        
        # Method 1: Try to get any available transcript (simplest approach)
        try:
            transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
            language = "Auto-detected"
            print("✅ Got transcript using default method")
        except:
            # Method 2: Try with specific languages
            languages_to_try = [
                (['en', 'en-IN', 'en-GB', 'en-US'], "English"),
                (['hi', 'hi-IN'], "Hindi"),
                (['en-auto'], "Auto-generated English"),
                (['a.en', 'a.en-US', 'a.en-GB'], "Auto-generated"),
            ]
            
            for lang_codes, lang_name in languages_to_try:
                try:
                    transcript_list = YouTubeTranscriptApi.get_transcript(
                        video_id,
                        languages=lang_codes
                    )
                    language = lang_name
                    print(f"✅ Got transcript in {lang_name}")
                    break
                except:
                    continue
        
        # If still no transcript, return None
        if not transcript_list:
            print("❌ No transcript found after all attempts")
            return None
        
        # Process transcript segments
        full_text = ""
        segments = []
        total_duration = 0
        
        for segment in transcript_list:
            # Clean text
            text = segment.get('text', '')
            if text:
                # Remove HTML tags and special characters
                text = html.unescape(text)
                text = re.sub(r'\[.*?\]', '', text)  # Remove [Music], [Applause] etc
                text = re.sub(r'<.*?>', '', text)  # Remove any HTML tags
                text = text.strip()
                
                if text:
                    full_text += text + " "
                    segments.append({
                        "text": text,
                        "start": segment.get('start', 0),
                        "duration": segment.get('duration', 0)
                    })
                    
                    end_time = segment.get('start', 0) + segment.get('duration', 0)
                    total_duration = max(total_duration, end_time)
        
        # If we have content, return it
        if full_text.strip():
            return {
                "transcript": full_text.strip(),
                "segments": segments,
                "language": language,
                "duration": int(total_duration / 60)  # Convert to minutes
            }
        else:
            print("❌ Transcript was empty after processing")
            return None
            
    except VideoUnavailable:
        print(f"❌ Video {video_id} is unavailable")
        return None
    except TranscriptsDisabled:
        print(f"❌ Transcripts are disabled for video {video_id}")
        return None
    except NoTranscriptFound:
        print(f"❌ No transcript found for video {video_id}")
        return None
    except Exception as e:
        print(f"❌ Unexpected error fetching transcript: {e}")
        return None

async def generate_ai_summary(
    transcript: str,
    duration_minutes: int,
    video_title: Optional[str]
) -> Dict:
    """
    Generate AI summary using Gemini
    """
    
    if not model:
        # Fallback summary if Gemini not configured
        return {
            "summary": "AI summarization not available. Please configure Gemini API key in the backend .env file.",
            "key_points": ["Transcript extracted successfully but AI summary not generated"],
            "topics": ["Video content available"]
        }
    
    try:
        # Limit transcript length to avoid token limits
        max_chars = 10000
        if len(transcript) > max_chars:
            transcript = transcript[:max_chars] + "..."
        
        prompt = f"""
        You are an educational video summarizer helping students save time.
        
        Video Title: {video_title or 'Educational Video'}
        Duration: {duration_minutes} minutes
        
        Transcript:
        {transcript}
        
        Please provide:
        
        1. SUMMARY (2-3 paragraphs):
        Write a clear, concise summary of the main content covered in this video.
        Focus on the educational value and key concepts explained.
        
        2. KEY POINTS (5-7 bullet points):
        List the most important takeaways a student should remember.
        
        3. TOPICS COVERED:
        List the main topics/concepts discussed in the video.
        
        Format your response as JSON:
        {{
            "summary": "...",
            "key_points": ["point 1", "point 2", ...],
            "topics": ["topic 1", "topic 2", ...]
        }}
        
        Make it student-friendly and easy to understand.
        """
        
        response = model.generate_content(prompt)
        
        # Parse JSON response
        import json
        text = response.text
        
        # Clean response (remove markdown code blocks if present)
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]
        
        try:
            summary_data = json.loads(text)
            
            # Ensure all fields exist
            if not isinstance(summary_data.get("key_points"), list):
                summary_data["key_points"] = [summary_data.get("summary", "")[:100]]
            if not isinstance(summary_data.get("topics"), list):
                summary_data["topics"] = ["General content"]
                
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails - try to extract content
            summary_data = {
                "summary": text[:1000] if len(text) > 1000 else text,
                "key_points": ["Video content summarized", "Please watch video for details"],
                "topics": ["Educational content"]
            }
        
        return summary_data
        
    except Exception as e:
        print(f"Error generating AI summary: {e}")
        return {
            "summary": f"Summary generation encountered an issue. Transcript is available but couldn't be processed by AI.",
            "key_points": ["Transcript extracted successfully", "Manual review recommended"],
            "topics": ["Content available"]
        }

def extract_key_points(segments: List[Dict]) -> List[Dict]:
    """
    Extract key timestamps from transcript segments
    """
    if not segments:
        return []
    
    key_points = []
    
    # Get segments at regular intervals (max 6 points)
    total_segments = len(segments)
    if total_segments <= 6:
        selected_segments = segments
    else:
        # Select evenly distributed segments
        interval = total_segments // 6
        selected_segments = []
        for i in range(0, total_segments, interval):
            if len(selected_segments) < 6:
                selected_segments.append(segments[i])
    
    for segment in selected_segments:
        # Format timestamp
        start_time = segment.get('start', 0)
        minutes = int(start_time // 60)
        seconds = int(start_time % 60)
        
        text = segment.get('text', '')
        if len(text) > 100:
            text = text[:100] + "..."
        
        key_points.append({
            "timestamp": f"{minutes:02d}:{seconds:02d}",
            "seconds": start_time,
            "text": text
        })
    
    return key_points[:6]  # Return max 6 key points

@router.get("/{video_id}")
async def get_video_summary(
    request: Request,
    video_id: str
):
    """
    Get existing video summary from cache
    """
    db = get_db(request)
    
    try:
        summary = await db["video_summaries"].find_one({
            "video_id": video_id
        })
        
        if summary:
            summary["_id"] = str(summary["_id"])
            return summary
        else:
            return {
                "success": False,
                "error": "Summary not found",
                "message": "No summary exists for this video. Generate one first.",
                "video_id": video_id
            }
            
    except Exception as e:
        print(f"Error fetching summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{video_id}")
async def delete_video_summary(
    request: Request,
    video_id: str
):
    """
    Delete cached video summary
    """
    db = get_db(request)
    
    try:
        result = await db["video_summaries"].delete_one({
            "video_id": video_id
        })
        
        if result.deleted_count > 0:
            return {
                "success": True,
                "message": "Summary deleted successfully",
                "video_id": video_id
            }
        else:
            return {
                "success": False,
                "message": "No summary found to delete",
                "video_id": video_id
            }
            
    except Exception as e:
        print(f"Error deleting summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))