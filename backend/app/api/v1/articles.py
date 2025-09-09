# backend/app/api/v1/articles.py
"""
Article API endpoints for fetching and reading articles
"""

from fastapi import APIRouter, HTTPException, Request, Query, Body
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from bson import ObjectId
import hashlib

from app.services.article_service import article_service

router = APIRouter(prefix="/api/v1/articles", tags=["articles"])

def get_db(request: Request):
    return request.app.state.db

@router.get("/topic/{topic_id}")
async def get_topic_articles(
    request: Request,
    topic_id: str,
    force_refresh: bool = Query(False, description="Force fetch new articles")
):
    """
    Get articles for a specific topic
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
            cached_articles = await db["topic_articles"].find_one({
                "topic_id": topic_id
            })
            
            # if cached_articles:
            #     # Check if cache is recent (within 7 days)
            #     cache_time = cached_articles.get("cached_at")
            #     if cache_time:
            #         age_days = (datetime.utcnow() - cache_time).days
            #         if age_days < 7:
            #             print(f"✅ Returning cached articles (age: {age_days} days)")
            #             cached_articles["_id"] = str(cached_articles["_id"])
            #             cached_articles["from_cache"] = True
            #             return cached_articles
        
        # Get topic details
        topic = await db["topics"].find_one({"_id": obj_id})
        if not topic:
            raise HTTPException(status_code=404, detail="Topic not found")
        
        # Get subject details
        subject = await db["subjects"].find_one({
            "_id": ObjectId(topic["subject_id"])
        })
        
        # Fetch fresh articles
        async with article_service as service:
            articles = await service.fetch_articles(
                topic_name=topic["name"],
                subject_name=subject["name"] if subject else "General",
                class_level=topic.get("class_level", 10),
                max_articles=10
            )
        
        print(f"✅ Fetched {len(articles)} articles for topic '{topic['name']}'")

        # Process articles for storage
        processed_articles = []
        for idx, article in enumerate(articles):
            article_id = hashlib.md5(article['url'].encode()).hexdigest()
            processed_articles.append({
                "id": article_id,
                "title": article["title"],
                "url": article["url"],
                "excerpt": article.get("excerpt", ""),
                "source": article.get("source", ""),
                "difficulty": article.get("difficulty", "Medium"),
                "relevance_score": article.get("relevance_score", 0),
                "order": idx + 1
            })
        
        # Prepare response data
        articles_data = {
            "topic_id": topic_id,
            "topic_name": topic["name"],
            "articles": processed_articles,
            "total_count": len(processed_articles),
            "cached_at": datetime.utcnow(),
            "from_cache": False
        }
        
        # Cache the articles
        await db["topic_articles"].replace_one(
            {"topic_id": topic_id},
            articles_data,
            upsert=True
        )
        
        articles_data["_id"] = str(articles_data.get("_id", ""))
        
        return articles_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching articles: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/content")
async def get_article_content(
    request: Request,
    article_data: Dict = Body(...)
):
    """
    Fetch and extract the content of a specific article
    """
    db = get_db(request)
    article_url = article_data.get("article_url")
    
    if not article_url:
        raise HTTPException(status_code=400, detail="article_url is required")
    
    try:
        # Generate article ID from URL
        article_id = hashlib.md5(article_url.encode()).hexdigest()
        
        # Check cache first
        cached_content = await db["article_content"].find_one({
            "article_id": article_id
        })
        
        if cached_content:
            # Check if cache is recent (within 30 days)
            cache_time = cached_content.get("cached_at")
            if cache_time:
                age_days = (datetime.utcnow() - cache_time).days
                if age_days < 30:
                    print(f"✅ Returning cached article content")
                    cached_content["_id"] = str(cached_content["_id"])
                    cached_content["from_cache"] = True
                    return cached_content
        
        # Fetch fresh content
        async with article_service as service:
            content = await service.fetch_article_content(article_url)
        
        # Prepare content data
        content_data = {
            "article_id": article_id,
            "url": article_url,
            "title": content.get("title", "Article"),
            "content_blocks": content.get("content_blocks", []),
            "reading_time": content.get("reading_time", 0),
            "success": content.get("success", False),
            "cached_at": datetime.utcnow(),
            "from_cache": False
        }
        
        # Cache if successful
        if content.get("success"):
            await db["article_content"].replace_one(
                {"article_id": article_id},
                content_data,
                upsert=True
            )
        
        content_data["_id"] = str(content_data.get("_id", ""))
        
        return content_data
        
    except Exception as e:
        print(f"Error fetching article content: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/cache/{topic_id}")
async def clear_article_cache(
    request: Request,
    topic_id: str
):
    """
    Clear cached articles for a topic
    """
    db = get_db(request)
    
    try:
        result = await db["topic_articles"].delete_one({
            "topic_id": topic_id
        })
        
        return {
            "success": True,
            "message": f"Cleared article cache for topic {topic_id}",
            "deleted_count": result.deleted_count
        }
        
    except Exception as e:
        print(f"Error clearing cache: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats/{topic_id}")
async def get_article_stats(
    request: Request,
    topic_id: str
):
    """
    Get article reading statistics for a topic
    """
    db = get_db(request)
    
    try:
        # Get cached articles
        articles_data = await db["topic_articles"].find_one({
            "topic_id": topic_id
        })
        
        if not articles_data:
            return {
                "topic_id": topic_id,
                "total_articles": 0,
                "cached": False
            }
        
        # Calculate stats
        total_articles = len(articles_data.get("articles", []))
        sources = {}
        difficulties = {"Easy": 0, "Medium": 0, "Advanced": 0}
        
        for article in articles_data.get("articles", []):
            # Count by source
            source = article.get("source", "Unknown")
            sources[source] = sources.get(source, 0) + 1
            
            # Count by difficulty
            difficulty = article.get("difficulty", "Medium")
            if difficulty in difficulties:
                difficulties[difficulty] += 1
        
        return {
            "topic_id": topic_id,
            "total_articles": total_articles,
            "sources": sources,
            "difficulties": difficulties,
            "cached": True,
            "cache_age_days": (datetime.utcnow() - articles_data.get("cached_at", datetime.utcnow())).days
        }
        
    except Exception as e:
        print(f"Error getting stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))