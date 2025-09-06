import asyncio
from app.services.ai_service import ai_service

async def test():
    print("Testing AI Service...")
    
    # Test explanation generation
    result = await ai_service.generate_explanation(
        topic_name="Newton's Laws",
        subject="Physics",
        class_level=11
    )
    
    print("AI Generated:")
    print(f"Simple: {result.get('simple', 'No response')[:100]}...")
    
    # Test web resources
    resources = await ai_service.search_web_resources(
        topic="Newton's Laws",
        subject="Physics",
        class_level=11
    )
    
    print(f"\nFound {len(resources)} resources")
    
    print("\n✅ AI Service is working!")

asyncio.run(test())