# If you're getting errors, add this debug version to test

# backend/test_topic_content.py
"""
Test script to check if topic content API is working
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from datetime import datetime

MONGODB_URL = "mongodb://localhost:27017"
DATABASE_NAME = "learning_assistant"

async def test_topic_content():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    print("🔍 Testing Topic Content API")
    print("=" * 60)
    
    # Get a sample topic
    topic = await db["topics"].find_one()
    if not topic:
        print("❌ No topics found in database!")
        print("Run populate_topics.py first")
        return
    
    topic_id = str(topic["_id"])
    topic_name = topic["name"]
    print(f"✅ Found topic: {topic_name}")
    print(f"   Topic ID: {topic_id}")
    
    # Check if topic_content collection exists
    content = await db["topic_content"].find_one({"topic_id": topic_id})
    if content:
        print(f"✅ Cached content exists for this topic")
        if "ai_summary" in content:
            print("   - AI summary: ✅")
        if "videos" in content:
            print(f"   - Videos: {len(content['videos'])}")
        if "articles" in content:
            print(f"   - Articles: {len(content['articles'])}")
    else:
        print("⚠️ No cached content for this topic")
    
    # Check environment
    import os
    youtube_key = os.getenv("YOUTUBE_API_KEY")
    gemini_key = os.getenv("GEMINI_API_KEY")
    
    print("\n📊 API Keys Status:")
    print(f"   YouTube API Key: {'✅ Set' if youtube_key else '❌ Not set'}")
    print(f"   Gemini API Key: {'✅ Set' if gemini_key else '❌ Not set'}")
    
    if not youtube_key:
        print("\n⚠️ YouTube API key not set - will use mock videos")
    if not gemini_key:
        print("⚠️ Gemini API key not set - will use fallback summaries")
    
    print("\n" + "=" * 60)
    print("Test the API with:")
    print(f"http://localhost:8000/api/v1/topics/{topic_id}/content?user_id=test123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(test_topic_content())