# backend/test_learning_content.py
"""
Test script for the learning content system
"""

import requests
import json

API_URL = "http://localhost:8000/api/v1"

def test_topic_content():
    """Test the topic content generation."""
    print("=" * 60)
    print("🧪 TESTING LEARNING CONTENT SYSTEM")
    print("=" * 60)
    
    # Step 1: Get list of topics (you need a syllabus uploaded first)
    print("\n1️⃣ Getting topics list...")
    
    # First, get a syllabus
    syllabi_response = requests.get(f"{API_URL}/syllabus/list?user_id=test")
    
    if syllabi_response.status_code != 200:
        print("❌ No syllabi found. Please upload a syllabus first.")
        return
    
    syllabi = syllabi_response.json()
    
    if not syllabi:
        print("❌ No syllabi found. Please upload a syllabus first.")
        return
    
    syllabus_id = syllabi[0]['id']
    print(f"✅ Found syllabus: {syllabi[0]['file_name']}")
    
    # Step 2: Get topics for the syllabus
    print(f"\n2️⃣ Getting topics for syllabus {syllabus_id}...")
    topics_response = requests.get(f"{API_URL}/syllabus/{syllabus_id}/topics")
    
    if topics_response.status_code != 200:
        print("❌ Failed to get topics")
        return
    
    topics = topics_response.json()
    
    if not topics:
        print("❌ No topics found in syllabus")
        return
    
    print(f"✅ Found {len(topics)} topics")
    
    # Step 3: Get content for the first topic
    topic = topics[0]
    topic_id = topic.get('id', topic.get('_id'))
    topic_name = topic.get('name', 'Unknown Topic')
    
    print(f"\n3️⃣ Getting learning content for topic: {topic_name}")
    print(f"   Topic ID: {topic_id}")
    
    content_response = requests.get(f"{API_URL}/topics/{topic_id}/content")
    
    if content_response.status_code != 200:
        print(f"❌ Failed to get topic content: {content_response.status_code}")
        print(f"   Error: {content_response.text}")
        return
    
    content = content_response.json()
    
    # Step 4: Display the content
    print(f"\n✅ Successfully fetched learning content!")
    print("\n📚 TOPIC DETAILS:")
    print(f"   Name: {content.get('topic_name')}")
    print(f"   Description: {content.get('topic_description')}")
    
    print("\n📝 EXPLANATION:")
    explanation = content.get('explanation', 'No explanation available')
    print(f"   {explanation[:200]}..." if len(explanation) > 200 else f"   {explanation}")
    
    print("\n🔑 KEY CONCEPTS:")
    for i, concept in enumerate(content.get('key_concepts', [])[:3], 1):
        print(f"   {i}. {concept}")
    
    print("\n🎯 LEARNING OBJECTIVES:")
    for i, objective in enumerate(content.get('learning_objectives', [])[:3], 1):
        print(f"   {i}. {objective}")
    
    print("\n🎥 VIDEO RESOURCES:")
    videos = content.get('videos', [])
    if videos:
        for i, video in enumerate(videos[:3], 1):
            print(f"   {i}. {video.get('title', 'Unknown Title')}")
            print(f"      Source: {video.get('source', 'Unknown')}")
            print(f"      URL: {video.get('url', 'No URL')}")
    else:
        print("   No videos found")
    
    print("\n📄 ARTICLE RESOURCES:")
    articles = content.get('articles', [])
    if articles:
        for i, article in enumerate(articles[:3], 1):
            print(f"   {i}. {article.get('title', 'Unknown Title')}")
            print(f"      Source: {article.get('source', 'Unknown')}")
            print(f"      URL: {article.get('url', 'No URL')}")
    else:
        print("   No articles found")
    
    # Step 5: Test marking as complete
    print(f"\n4️⃣ Testing mark as complete...")
    complete_response = requests.post(
        f"{API_URL}/topics/{topic_id}/mark-complete?user_id=test"
    )
    
    if complete_response.status_code == 200:
        print("✅ Topic marked as complete successfully")
    else:
        print(f"❌ Failed to mark as complete: {complete_response.status_code}")
    
    print("\n" + "=" * 60)
    print("✅ LEARNING CONTENT SYSTEM TEST COMPLETE")
    print("=" * 60)
    print("\n💡 Next steps:")
    print("   1. Visit http://localhost:3000/dashboard/syllabus")
    print("   2. Click 'View Topics' on any syllabus")
    print("   3. Click 'Start Learning' on any topic")
    print("   4. Explore the Overview, Videos, and Articles tabs")

if __name__ == "__main__":
    test_topic_content()