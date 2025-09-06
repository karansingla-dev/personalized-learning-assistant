# backend/test_backend.py
"""
Test script to verify all backend functionality
Run this after setting up the backend
"""

import asyncio
import aiohttp
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

# Test user data
TEST_USER = {
    "clerk_id": "test_user_123",
    "email": "test@example.com",
    "username": "testuser",
    "first_name": "Test",
    "last_name": "User"
}

async def test_health():
    """Test health endpoint"""
    print("📍 Testing health endpoint...")
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{BASE_URL}/health") as response:
            if response.status == 200:
                data = await response.json()
                print(f"✅ Health check passed: {data}")
                return True
            else:
                print(f"❌ Health check failed: {response.status}")
                return False

async def test_onboarding():
    """Test onboarding completion"""
    print("\n📍 Testing onboarding...")
    
    onboarding_data = {
        "clerk_id": TEST_USER["clerk_id"],
        "class_level": 10,
        "board": "CBSE",
        "target_exams": ["JEE", "BOARDS"],
        "school_name": "Test School",
        "city": "Mumbai",
        "state": "Maharashtra",
        "school_start": "08:00",
        "school_end": "14:00",
        "daily_study_hours": 3
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{BASE_URL}/api/v1/onboarding/complete",
            json=onboarding_data
        ) as response:
            if response.status == 200:
                data = await response.json()
                print(f"✅ Onboarding completed: {data['status']}")
                return True
            else:
                print(f"❌ Onboarding failed: {response.status}")
                return False

async def test_subjects():
    """Test fetching subjects"""
    print("\n📍 Testing subjects endpoint...")
    
    async with aiohttp.ClientSession() as session:
        async with session.get(
            f"{BASE_URL}/api/v1/subjects?class_level=10"
        ) as response:
            if response.status == 200:
                subjects = await response.json()
                print(f"✅ Found {len(subjects)} subjects:")
                for subject in subjects[:3]:
                    print(f"   - {subject['icon']} {subject['name']}")
                return subjects
            else:
                print(f"❌ Failed to fetch subjects: {response.status}")
                return []

async def test_topics(subject_id: str):
    """Test fetching topics for a subject"""
    print(f"\n📍 Testing topics for subject {subject_id}...")
    
    async with aiohttp.ClientSession() as session:
        async with session.get(
            f"{BASE_URL}/api/v1/subjects/{subject_id}/topics?class_level=10"
        ) as response:
            if response.status == 200:
                topics = await response.json()
                print(f"✅ Found {len(topics)} topics")
                if topics:
                    print(f"   Sample topic: {topics[0].get('name', 'Unknown')}")
                return topics
            else:
                print(f"❌ Failed to fetch topics: {response.status}")
                return []

async def test_search():
    """Test search functionality"""
    print("\n📍 Testing search...")
    
    async with aiohttp.ClientSession() as session:
        async with session.get(
            f"{BASE_URL}/api/v1/search?query=physics&class_level=10"
        ) as response:
            if response.status == 200:
                results = await response.json()
                print(f"✅ Search returned {results['count']} results")
                return True
            else:
                print(f"❌ Search failed: {response.status}")
                return False

async def test_progress():
    """Test user progress"""
    print(f"\n📍 Testing user progress...")
    
    async with aiohttp.ClientSession() as session:
        async with session.get(
            f"{BASE_URL}/api/v1/users/{TEST_USER['clerk_id']}/progress"
        ) as response:
            if response.status == 200:
                progress = await response.json()
                print(f"✅ Progress data retrieved:")
                print(f"   - Total topics: {progress['total_topics']}")
                print(f"   - Completed: {progress['completed_topics']}")
                print(f"   - In progress: {progress['in_progress_topics']}")
                return True
            else:
                print(f"❌ Failed to fetch progress: {response.status}")
                return False

async def test_content_and_quiz_flow():
    """Test the complete content and quiz flow"""
    print("\n📍 Testing content and quiz flow...")
    
    # First, get a subject
    async with aiohttp.ClientSession() as session:
        # Get subjects
        async with session.get(f"{BASE_URL}/api/v1/subjects") as response:
            if response.status != 200:
                print("❌ Failed to get subjects")
                return False
            subjects = await response.json()
        
        if not subjects:
            print("❌ No subjects found")
            return False
        
        subject_id = subjects[0]["_id"]
        
        # Get topics for the subject
        async with session.get(
            f"{BASE_URL}/api/v1/subjects/{subject_id}/topics"
        ) as response:
            if response.status != 200:
                print("❌ Failed to get topics")
                return False
            topics = await response.json()
        
        if not topics:
            print("❌ No topics found")
            return False
        
        topic_id = topics[0]["_id"]
        topic_name = topics[0]["name"]
        
        print(f"   Testing with topic: {topic_name}")
        
        # Start the topic
        async with session.post(
            f"{BASE_URL}/api/v1/progress/topic/{topic_id}/start?user_id={TEST_USER['clerk_id']}"
        ) as response:
            if response.status == 200:
                print("   ✅ Topic started")
            else:
                print(f"   ⚠️ Failed to start topic: {response.status}")
        
        # Mark topic as completed
        async with session.post(
            f"{BASE_URL}/api/v1/progress/topic/{topic_id}/complete?user_id={TEST_USER['clerk_id']}"
        ) as response:
            if response.status == 200:
                print("   ✅ Topic marked as completed")
            else:
                print(f"   ⚠️ Failed to complete topic: {response.status}")
        
        return True

async def test_database_connection():
    """Test MongoDB connection"""
    print("📍 Testing database connection...")
    
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        from app.config import settings
        
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        db = client[settings.DATABASE_NAME]
        
        # Test connection
        await client.admin.command('ping')
        print("✅ MongoDB connection successful")
        
        # Check collections
        collections = await db.list_collection_names()
        print(f"   Collections: {', '.join(collections)}")
        
        # Check document counts
        for collection in ["users", "subjects", "topics"]:
            if collection in collections:
                count = await db[collection].count_documents({})
                print(f"   - {collection}: {count} documents")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

async def run_all_tests():
    """Run all tests"""
    print("=" * 60)
    print("🚀 STARTING BACKEND TESTS")
    print("=" * 60)
    
    # Test database first
    await test_database_connection()
    
    # Test API endpoints
    health_ok = await test_health()
    
    if not health_ok:
        print("\n⚠️ Server not running. Start the server with:")
        print("   cd backend")
        print("   uvicorn app.main:app --reload")
        return
    
    await test_onboarding()
    subjects = await test_subjects()
    
    if subjects:
        await test_topics(subjects[0]["_id"])
    
    await test_search()
    await test_progress()
    await test_content_and_quiz_flow()
    
    print("\n" + "=" * 60)
    print("✅ BACKEND TESTS COMPLETED")
    print("=" * 60)
    
    print("\n📝 Next Steps:")
    print("1. If all tests passed, your backend is ready!")
    print("2. You can now proceed with frontend implementation")
    print("3. Make sure to keep the backend server running")

if __name__ == "__main__":
    asyncio.run(run_all_tests())