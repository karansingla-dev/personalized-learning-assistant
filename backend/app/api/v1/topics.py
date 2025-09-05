# backend/app/api/v1/topics.py
"""
Topics API with learning content recommendations
"""

from fastapi import APIRouter, HTTPException, Request, Query
from typing import List, Optional
import google.generativeai as genai
from datetime import datetime
from bson import ObjectId
import aiohttp
import os
from dotenv import load_dotenv
import json
import re

load_dotenv()

# Initialize router
router = APIRouter()

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-pro')
else:
    model = None

# YouTube API key (optional - will work without it using web search)
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

def get_db(request: Request):
    """Get database from request state."""
    if hasattr(request.app.state, 'db'):
        return request.app.state.db
    else:
        from motor.motor_asyncio import AsyncIOMotorClient
        client = AsyncIOMotorClient(os.getenv("MONGODB_URL", "mongodb://localhost:27017"))
        return client[os.getenv("DATABASE_NAME", "learning_assistant")]

@router.get("/{topic_id}")
async def get_topic_details(
    request: Request,
    topic_id: str
):
    """Get topic details with learning content."""
    db = get_db(request)
    
    try:
        # First, try to get cached content
        cached_content = await db["topic_content"].find_one({"topic_id": topic_id})
        if cached_content:
            cached_content["id"] = str(cached_content.pop("_id", ""))
            return cached_content
        
        # If not cached, fetch the topic and generate content
        topic = await db["topics"].find_one({"_id": ObjectId(topic_id)})
        if not topic:
            # Try without ObjectId conversion (if topic_id is stored as string)
            topic = await db["topics"].find_one({"id": topic_id})
            if not topic:
                raise HTTPException(status_code=404, detail="Topic not found")
        
        # Generate learning content
        content = await generate_learning_content(
            topic_id=topic_id,
            topic_name=topic.get("name", "Unknown Topic"),
            topic_description=topic.get("description", ""),
            syllabus_id=topic.get("syllabus_id", ""),
            user_id=topic.get("user_id", "")
        )
        
        # Store in database
        await db["topic_content"].insert_one(content)
        
        return content
        
    except Exception as e:
        print(f"Error getting topic details: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{topic_id}/content")
async def get_topic_learning_content(
    request: Request,
    topic_id: str,
    refresh: bool = Query(False, description="Force refresh content")
):
    """Get or generate learning content for a topic."""
    db = get_db(request)
    
    try:
        # Check if we have cached content and not forcing refresh
        if not refresh:
            cached = await db["topic_content"].find_one({"topic_id": topic_id})
            if cached:
                cached["id"] = str(cached.pop("_id", ""))
                return cached
        
        # Get topic details
        topic = await db["topics"].find_one({"_id": ObjectId(topic_id)})
        if not topic:
            topic = await db["topics"].find_one({"id": topic_id})
            if not topic:
                raise HTTPException(status_code=404, detail="Topic not found")
        
        # Generate fresh content
        content = await generate_learning_content(
            topic_id=topic_id,
            topic_name=topic.get("name", "Unknown Topic"),
            topic_description=topic.get("description", ""),
            syllabus_id=topic.get("syllabus_id", ""),
            user_id=topic.get("user_id", "")
        )
        
        # Update or insert in database
        await db["topic_content"].replace_one(
            {"topic_id": topic_id},
            content,
            upsert=True
        )
        
        return content
        
    except Exception as e:
        print(f"Error generating content: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def generate_learning_content(
    topic_id: str,
    topic_name: str,
    topic_description: str,
    syllabus_id: str,
    user_id: str
) -> dict:
    """Generate comprehensive learning content for a topic."""
    
    content = {
        "topic_id": topic_id,
        "syllabus_id": syllabus_id,
        "user_id": user_id,
        "topic_name": topic_name,
        "topic_description": topic_description,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # Generate AI explanation
    if model:
        try:
            # Generate detailed explanation
            explanation_prompt = f"""
            Create a comprehensive learning guide for the topic: {topic_name}
            Description: {topic_description}
            
            Provide:
            1. A detailed explanation (200-300 words)
            2. 5 key concepts
            3. 3 learning objectives
            4. Prerequisites needed
            5. What topics to study next
            
            Format as JSON with keys: explanation, key_concepts, learning_objectives, prerequisites, next_topics
            """
            
            response = model.generate_content(explanation_prompt)
            
            # Parse response
            try:
                # Clean up the response
                json_text = response.text.strip()
                if json_text.startswith("```"):
                    json_text = json_text[json_text.find("{"):json_text.rfind("}")+1]
                
                ai_content = json.loads(json_text)
                content.update(ai_content)
            except:
                # Fallback if JSON parsing fails
                content["explanation"] = response.text
                content["key_concepts"] = [f"Concept {i+1} for {topic_name}" for i in range(5)]
                content["learning_objectives"] = [f"Understand {topic_name}", "Apply concepts", "Practice problems"]
            
            # Generate simplified explanation
            simple_prompt = f"Explain {topic_name} like I'm a complete beginner in 100 words. Use simple language and analogies."
            simple_response = model.generate_content(simple_prompt)
            content["simplified_explanation"] = simple_response.text
            
        except Exception as e:
            print(f"AI generation error: {e}")
            content["explanation"] = f"A comprehensive guide to understanding {topic_name}. {topic_description}"
            content["simplified_explanation"] = f"Simple explanation of {topic_name}"
            content["key_concepts"] = ["Core concepts", "Applications", "Best practices"]
            content["learning_objectives"] = ["Understand the basics", "Apply the knowledge", "Build projects"]
    
    # Fetch learning resources
    videos = await fetch_youtube_videos(topic_name, topic_description)
    articles = await fetch_articles(topic_name, topic_description)
    
    content["videos"] = videos
    content["articles"] = articles
    
    # Select best content
    if videos:
        content["best_video"] = select_best_video(videos)
    if articles:
        content["best_article"] = select_best_article(articles)
    
    return content

async def fetch_youtube_videos(topic_name: str, description: str) -> List[dict]:
    """Fetch relevant YouTube videos for the topic."""
    videos = []
    
    # Build search query
    search_query = f"{topic_name} tutorial explained"
    
    if YOUTUBE_API_KEY:
        # Use YouTube Data API
        try:
            async with aiohttp.ClientSession() as session:
                params = {
                    'part': 'snippet',
                    'q': search_query,
                    'type': 'video',
                    'maxResults': 10,
                    'order': 'relevance',
                    'videoDuration': 'medium',  # 4-20 minutes
                    'relevanceLanguage': 'en',
                    'key': YOUTUBE_API_KEY
                }
                
                async with session.get(
                    'https://www.googleapis.com/youtube/v3/search',
                    params=params
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        for item in data.get('items', []):
                            snippet = item['snippet']
                            videos.append({
                                'content_type': 'video',
                                'source': 'youtube',
                                'title': snippet['title'],
                                'description': snippet['description'][:500],
                                'url': f"https://www.youtube.com/watch?v={item['id']['videoId']}",
                                'thumbnail_url': snippet['thumbnails']['high']['url'],
                                'author': snippet['channelTitle'],
                                'published_date': snippet['publishedAt'],
                                'relevance_score': 0.9  # YouTube API results are usually relevant
                            })
        except Exception as e:
            print(f"YouTube API error: {e}")
    
    # Fallback: Use web scraping or predefined educational channels
    if not videos:
        # Add some high-quality educational channels' content
        educational_channels = [
            {"channel": "freeCodeCamp", "url_suffix": "freecodecamp"},
            {"channel": "Traversy Media", "url_suffix": "traversymedia"},
            {"channel": "The Net Ninja", "url_suffix": "thenetninja"},
            {"channel": "Academind", "url_suffix": "academind"},
            {"channel": "CS50", "url_suffix": "cs50"}
        ]
        
        # Create search URLs for manual checking
        for channel in educational_channels[:3]:  # Top 3 channels
            videos.append({
                'content_type': 'video',
                'source': 'youtube',
                'title': f"{topic_name} - {channel['channel']} Tutorial",
                'description': f"Search for {topic_name} tutorials on {channel['channel']} YouTube channel",
                'url': f"https://www.youtube.com/c/{channel['url_suffix']}/search?query={topic_name.replace(' ', '+')}",
                'thumbnail_url': "https://i.ytimg.com/vi/default/maxresdefault.jpg",
                'author': channel['channel'],
                'relevance_score': 0.7
            })
    
    return videos

async def fetch_articles(topic_name: str, description: str) -> List[dict]:
    """Fetch relevant articles and blog posts for the topic."""
    articles = []
    
    # Build search queries
    search_queries = [
        f"{topic_name} tutorial beginner",
        f"{topic_name} explained with examples",
        f"understanding {topic_name}"
    ]
    
    # Educational websites to search
    educational_sites = [
        {"name": "MDN Web Docs", "url": "https://developer.mozilla.org", "search": f"https://developer.mozilla.org/en-US/search?q={topic_name.replace(' ', '+')}"},
        {"name": "GeeksforGeeks", "url": "https://www.geeksforgeeks.org", "search": f"https://www.geeksforgeeks.org/search/?q={topic_name.replace(' ', '+')}"},
        {"name": "W3Schools", "url": "https://www.w3schools.com", "search": f"https://www.google.com/search?q=site:w3schools.com+{topic_name.replace(' ', '+')}"},
        {"name": "Medium", "url": "https://medium.com", "search": f"https://medium.com/search?q={topic_name.replace(' ', '%20')}"},
        {"name": "Dev.to", "url": "https://dev.to", "search": f"https://dev.to/search?q={topic_name.replace(' ', '%20')}"},
        {"name": "freeCodeCamp", "url": "https://www.freecodecamp.org", "search": f"https://www.freecodecamp.org/news/search/?query={topic_name.replace(' ', '+')}"}
    ]
    
    # Since we can't actually scrape in real-time, we'll provide search links
    for site in educational_sites[:4]:  # Top 4 sites
        articles.append({
            'content_type': 'article',
            'source': site['name'].lower().replace(' ', ''),
            'title': f"{topic_name} - {site['name']} Guide",
            'description': f"Comprehensive guide to {topic_name} on {site['name']}",
            'url': site['search'],
            'author': site['name'],
            'relevance_score': 0.8,
            'reading_time_minutes': 10  # Estimated
        })
    
    # Add some specific high-quality resources based on common topics
    if any(keyword in topic_name.lower() for keyword in ['python', 'javascript', 'java', 'programming', 'coding']):
        articles.append({
            'content_type': 'article',
            'source': 'documentation',
            'title': f"Official {topic_name} Documentation",
            'description': f"The official documentation and tutorials for {topic_name}",
            'url': f"https://www.google.com/search?q={topic_name.replace(' ', '+')}+official+documentation",
            'relevance_score': 1.0,
            'reading_time_minutes': 15
        })
    
    return articles

def select_best_video(videos: List[dict]) -> dict:
    """Select the best video based on relevance and quality metrics."""
    if not videos:
        return None
    
    # Sort by relevance score and return the best
    sorted_videos = sorted(videos, key=lambda x: x.get('relevance_score', 0), reverse=True)
    return sorted_videos[0]

def select_best_article(articles: List[dict]) -> dict:
    """Select the best article based on relevance and source quality."""
    if not articles:
        return None
    
    # Prioritize certain sources
    priority_sources = ['documentation', 'mdn', 'geeksforgeeks', 'freecodecamp']
    
    for source in priority_sources:
        for article in articles:
            if source in article.get('source', '').lower():
                return article
    
    # Return the most relevant one
    sorted_articles = sorted(articles, key=lambda x: x.get('relevance_score', 0), reverse=True)
    return sorted_articles[0]

@router.post("/{topic_id}/mark-complete")
async def mark_topic_complete(
    request: Request,
    topic_id: str,
    user_id: str = Query(...)
):
    """Mark a topic as completed."""
    db = get_db(request)
    
    try:
        # Update topic content
        await db["topic_content"].update_one(
            {"topic_id": topic_id, "user_id": user_id},
            {
                "$set": {
                    "is_completed": True,
                    "completion_percentage": 100.0,
                    "last_accessed": datetime.utcnow()
                }
            }
        )
        
        # Update progress tracking
        await db["progress"].update_one(
            {"topic_id": topic_id, "user_id": user_id},
            {
                "$set": {
                    "status": "completed",
                    "progress_percentage": 100.0,
                    "completed_at": datetime.utcnow()
                }
            },
            upsert=True
        )
        
        return {"message": "Topic marked as complete", "topic_id": topic_id}
        
    except Exception as e:
        print(f"Error marking topic complete: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{topic_id}/related")
async def get_related_topics(
    request: Request,
    topic_id: str
):
    """Get related topics for continuous learning."""
    db = get_db(request)
    
    try:
        # Get the current topic
        topic = await db["topics"].find_one({"_id": ObjectId(topic_id)})
        if not topic:
            topic = await db["topics"].find_one({"id": topic_id})
        
        if not topic:
            raise HTTPException(status_code=404, detail="Topic not found")
        
        # Find related topics from the same syllabus
        related = await db["topics"].find({
            "syllabus_id": topic.get("syllabus_id"),
            "_id": {"$ne": ObjectId(topic_id) if "_id" in topic else topic_id}
        }).limit(5).to_list(length=5)
        
        # Format response
        for r in related:
            r["id"] = str(r.pop("_id", ""))
        
        return related
        
    except Exception as e:
        print(f"Error getting related topics: {e}")
        raise HTTPException(status_code=500, detail=str(e))