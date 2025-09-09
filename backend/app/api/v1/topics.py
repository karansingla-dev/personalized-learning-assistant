# backend/app/api/v1/topics.py
# COMPLETE FIXED VERSION

from fastapi import APIRouter, HTTPException, Request, Query
from typing import List, Optional, Dict
from bson import ObjectId
from datetime import datetime
from urllib.parse import quote
from app.config import settings
import aiohttp

router = APIRouter(prefix="/api/v1", tags=["topics"])

YOUTUBE_API_KEY = settings.YOUTUBE_API_KEY

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
    
@router.get("/topics/{topic_id}/videos")
async def get_topic_videos(
    request: Request,
    topic_id: str,
    topic_name: str = Query(..., description="Topic name"),
    subject_name: str = Query(..., description="Subject name"),
    class_level: int = Query(..., description="Class level")
):
    """
    Get top 10 YouTube videos for a topic
    Uses YouTube Data API v3 to fetch real videos
    """
    db = get_db(request)
    
    try:
        print(f"🎥 Fetching videos for: {topic_name} | {subject_name} | Class {class_level}")
        
        if not YOUTUBE_API_KEY:
            return {
                "success": False,
                "error": "YouTube API key not configured",
                "message": "Please add YOUTUBE_API_KEY to your .env file",
                "topic_id": topic_id,
                "topic_name": topic_name,
                "videos": []
            }
        
        # Fetch real YouTube videos
        videos = await fetch_youtube_videos(
            topic_name, subject_name, class_level
        )
        
        if not videos:
            return {
                "success": False,
                "error": "No videos found",
                "message": f"Could not find videos for {topic_name}",
                "topic_id": topic_id,
                "topic_name": topic_name,
                "videos": []
            }
        
        return {
            "success": True,
            "topic_id": topic_id,
            "topic_name": topic_name,
            "subject_name": subject_name,
            "class_level": class_level,
            "total_videos": len(videos),
            "videos": videos
        }
        
    except Exception as e:
        print(f"❌ Error in get_topic_videos: {e}")
        return {
            "success": False,
            "error": str(e),
            "topic_id": topic_id,
            "topic_name": topic_name,
            "videos": []
        }

async def fetch_youtube_videos(
    topic_name: str, 
    subject_name: str, 
    class_level: int
) -> List[Dict]:
    """
    Fetch real YouTube videos using YouTube Data API v3
    Returns top 10 educational videos for the topic
    """
    
    videos = []
    
    try:
        async with aiohttp.ClientSession() as session:
            # Educational channels to search from
            educational_channels = [
                "Khan Academy",
                "Khan Academy India", 
                "Physics Wallah - Alakh Pandey",
                "Physics Wallah Foundation",
                "Vedantu 9&10",
                "Vedantu JEE",
                "Unacademy JEE",
                "Unacademy NEET",
                "BYJU'S - Class 9 & 10",
                "Manocha Academy",
                "Doubtnut",
                "Magnet Brains",
                "Science and Fun Education",
                "Dear Sir",
                "Wifistudy"
            ]
            
            all_videos = []
            
            # Search queries with different variations
            search_queries = [
                f"{topic_name} {subject_name} class {class_level}",
                f"{topic_name} class {class_level} CBSE",
                f"{topic_name} NCERT class {class_level}",
                f"{topic_name} explained in Hindi class {class_level}",
            ]
            
            for query in search_queries[:2]:  # Use first 2 queries to avoid quota issues
                print(f"🔍 Searching: {query}")
                
                # YouTube Search API
                search_url = "https://www.googleapis.com/youtube/v3/search"
                params = {
                    'part': 'snippet',
                    'q': query,
                    'key': YOUTUBE_API_KEY,
                    'maxResults': 10,
                    'type': 'video',
                    'videoDuration': 'medium',  # 4-20 minutes
                    'relevanceLanguage': 'en',
                    'regionCode': 'IN',  # India region for better results
                    'safeSearch': 'strict',
                    'order': 'relevance'
                }
                
                try:
                    async with session.get(search_url, params=params) as response:
                        if response.status == 200:
                            data = await response.json()
                            
                            if 'items' in data:
                                # Collect video IDs for batch details fetch
                                video_ids = [item['id']['videoId'] for item in data['items']]
                                
                                # Fetch video details (duration, statistics)
                                if video_ids:
                                    video_details = await fetch_video_details(session, video_ids)
                                    
                                    for item in data['items']:
                                        video_id = item['id']['videoId']
                                        snippet = item['snippet']
                                        
                                        # Get details for this video
                                        details = video_details.get(video_id, {})
                                        
                                        # Check if it's from an educational channel
                                        channel_name = snippet['channelTitle']
                                        is_educational = any(
                                            edu.lower() in channel_name.lower() 
                                            for edu in educational_channels
                                        )
                                        
                                        # Create video object with real data
                                        video_data = {
                                            'id': f'yt_{video_id}',
                                            'video_id': video_id,
                                            'title': snippet['title'],
                                            'description': snippet.get('description', '')[:500],
                                            'url': f"https://www.youtube.com/watch?v={video_id}",
                                            'embed_url': f"https://www.youtube.com/embed/{video_id}?rel=0&modestbranding=1",
                                            'thumbnail_url': snippet['thumbnails'].get('high', {}).get('url', 
                                                snippet['thumbnails'].get('medium', {}).get('url', '')),
                                            'channel': channel_name,
                                            'channel_id': snippet['channelId'],
                                            'channel_url': f"https://www.youtube.com/channel/{snippet['channelId']}",
                                            'duration_minutes': details.get('duration_minutes', 10),
                                            'view_count': details.get('view_count', 0),
                                            'like_count': details.get('like_count', 0),
                                            'published_at': snippet['publishedAt'],
                                            'is_educational': is_educational,
                                            'relevance_score': calculate_relevance_score(
                                                snippet['title'], 
                                                topic_name, 
                                                is_educational,
                                                details.get('view_count', 0)
                                            )
                                        }
                                        
                                        all_videos.append(video_data)
                        
                        elif response.status == 403:
                            error_data = await response.json()
                            print(f"❌ YouTube API Error: {error_data}")
                            if 'quotaExceeded' in str(error_data):
                                raise Exception("YouTube API quota exceeded. Please try again later.")
                            else:
                                raise Exception("YouTube API access denied. Check your API key.")
                                
                except Exception as e:
                    print(f"Error fetching from YouTube: {e}")
                    continue
            
            # Remove duplicates based on video_id
            seen_ids = set()
            unique_videos = []
            for video in all_videos:
                if video['video_id'] not in seen_ids:
                    seen_ids.add(video['video_id'])
                    unique_videos.append(video)
            
            # Sort by relevance score (educational channels first, then by views)
            unique_videos.sort(key=lambda x: x['relevance_score'], reverse=True)
            
            # Return top 10 videos
            videos = unique_videos[:10]
            
            print(f"✅ Found {len(videos)} videos")
            
    except Exception as e:
        print(f"❌ Error in fetch_youtube_videos: {e}")
        raise e
    
    return videos

async def fetch_video_details(session: aiohttp.ClientSession, video_ids: List[str]) -> Dict:
    """
    Fetch detailed information for videos including duration and statistics
    """
    details = {}
    
    try:
        details_url = "https://www.googleapis.com/youtube/v3/videos"
        params = {
            'part': 'contentDetails,statistics',
            'id': ','.join(video_ids),
            'key': YOUTUBE_API_KEY
        }
        
        async with session.get(details_url, params=params) as response:
            if response.status == 200:
                data = await response.json()
                
                for item in data.get('items', []):
                    video_id = item['id']
                    
                    # Parse duration
                    duration = item.get('contentDetails', {}).get('duration', 'PT10M')
                    duration_minutes = parse_youtube_duration(duration)
                    
                    # Get statistics
                    stats = item.get('statistics', {})
                    
                    details[video_id] = {
                        'duration_minutes': duration_minutes,
                        'view_count': int(stats.get('viewCount', 0)),
                        'like_count': int(stats.get('likeCount', 0)),
                        'comment_count': int(stats.get('commentCount', 0))
                    }
    
    except Exception as e:
        print(f"Error fetching video details: {e}")
    
    return details

def parse_youtube_duration(duration_str: str) -> int:
    """
    Parse YouTube duration format (PT15M33S) to minutes
    """
    if not duration_str:
        return 10
    
    # Remove PT prefix
    duration_str = duration_str.replace('PT', '')
    
    # Extract hours, minutes, seconds using regex
    hours = 0
    minutes = 0
    seconds = 0
    
    # Hours
    hour_match = re.search(r'(\d+)H', duration_str)
    if hour_match:
        hours = int(hour_match.group(1))
    
    # Minutes
    minute_match = re.search(r'(\d+)M', duration_str)
    if minute_match:
        minutes = int(minute_match.group(1))
    
    # Seconds
    second_match = re.search(r'(\d+)S', duration_str)
    if second_match:
        seconds = int(second_match.group(1))
    
    # Convert to total minutes (round up if seconds > 30)
    total_minutes = hours * 60 + minutes + (1 if seconds > 30 else 0)
    
    return max(1, total_minutes)

def calculate_relevance_score(
    title: str, 
    topic_name: str, 
    is_educational: bool,
    view_count: int
) -> float:
    """
    Calculate relevance score for ranking videos
    """
    score = 0
    
    # Check if topic name is in title (case insensitive)
    title_lower = title.lower()
    topic_lower = topic_name.lower()
    
    # Exact match gets highest score
    if topic_lower in title_lower:
        score += 100
    
    # Check for individual words
    topic_words = topic_lower.split()
    for word in topic_words:
        if len(word) > 3 and word in title_lower:  # Skip small words
            score += 20
    
    # Boost for educational channels
    if is_educational:
        score += 50
    
    # Add view count factor (logarithmic to prevent domination)
    if view_count > 0:
        import math
        score += math.log10(view_count) * 5
    
    # Check for quality indicators in title
    quality_keywords = ['complete', 'full', 'explained', 'tutorial', 'lecture', 
                       'ncert', 'cbse', 'class', 'chapter']
    for keyword in quality_keywords:
        if keyword in title_lower:
            score += 10
    
    return score
