# backend/app/api/v1/topic_content_enhanced.py
"""
Enhanced API with real YouTube search and better AI summaries
"""

from fastapi import APIRouter, HTTPException, Request, Query
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from bson import ObjectId
import aiohttp
import asyncio
import google.generativeai as genai
from app.config import settings
from app.services.content_service import ContentService

router = APIRouter(prefix="/api/v1/topics", tags=["content"])

def get_db(request: Request):
    return request.app.state.db

# Configure Gemini AI
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-pro')

# YouTube API configuration
YOUTUBE_API_KEY = settings.YOUTUBE_API_KEY  # Add this to your .env file
YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3"

@router.get("/{topic_id}/content")
async def get_topic_content(
    request: Request,
    topic_id: str,
    user_id: str = Query(..., description="User ID"),
    force_refresh: bool = Query(False, description="Force refresh content")
):
    """
    Get all content for a topic including scraped blog articles
    """
    db = get_db(request)
    
    try:
        # Validate topic_id format
        try:
            obj_id = ObjectId(topic_id)
        except:
            raise HTTPException(status_code=400, detail="Invalid topic ID format")
        
        # Get topic details
        topic = await db["topics"].find_one({"_id": obj_id})
        if not topic:
            raise HTTPException(status_code=404, detail="Topic not found")
        
        # Get subject details for the topic
        subject = None
        if "subject_id" in topic:
            try:
                subject_id = ObjectId(topic["subject_id"]) if isinstance(topic["subject_id"], str) else topic["subject_id"]
                subject = await db["subjects"].find_one({"_id": subject_id})
            except:
                print(f"Could not find subject for topic {topic_id}")
        
        # Determine subject name
        subject_name = ""
        if subject:
            subject_name = subject.get("name", "")
        elif "subject_name" in topic:
            subject_name = topic["subject_name"]
        else:
            # Try to infer from topic
            subject_name = "Mathematics"  # Default for now
        
        # Get class level
        class_level = topic.get("class_level", 10)
        
        print(f"Fetching content for: {topic['name']} - {subject_name} - Class {class_level}")
        
        # Get content using enhanced service
        content_service = ContentService(db)
        
        async with content_service:
            content = await content_service.get_topic_content(
                topic_id=topic_id,
                topic_name=topic["name"],
                subject_name=subject_name,
                class_level=class_level,
                force_refresh=force_refresh
            )
        
        # Process the articles to ensure they have proper structure
        if "articles" in content:
            for i, article in enumerate(content["articles"]):
                # Ensure each article has an ID
                if not article.get("id"):
                    article["id"] = f"article_{i}"
                
                # Mark articles with content as readable in-app
                if article.get("content") and len(article["content"]) > 100:
                    article["has_content"] = True
                    article["type"] = "blog"
                else:
                    article["has_content"] = False
                
                # Add default values if missing
                if not article.get("reading_time"):
                    word_count = len(article.get("content", "").split()) if article.get("content") else 0
                    article["reading_time"] = f"{max(1, word_count // 200)} min"
                
                if not article.get("icon"):
                    article["icon"] = "📖" if article.get("has_content") else "🔗"
        
        # Also ensure videos have proper structure
        if "videos" in content:
            for i, video in enumerate(content["videos"]):
                if not video.get("id"):
                    video["id"] = f"video_{i}"
                if not video.get("content_type"):
                    video["content_type"] = "video"
        
        # Add topic metadata
        response_data = {
            "topic_id": topic_id,
            "topic_name": topic["name"],
            "topic_description": topic.get("description", ""),
            "subject_name": subject_name,
            "class_level": class_level,
            "chapter_number": topic.get("chapter_number", 1),
            **content
        }
        
        # Add user progress if available
        progress = await db["progress"].find_one({
            "user_id": user_id,
            "topic_id": topic_id
        })
        
        if progress:
            response_data["is_completed"] = progress.get("completed", False)
            response_data["completion_percentage"] = progress.get("progress", 0)
        else:
            response_data["is_completed"] = False
            response_data["completion_percentage"] = 0
        
        print(f"Returning {len(content.get('articles', []))} articles with content")
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching content: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{topic_id}/refresh-content")
async def refresh_topic_content(
    request: Request,
    topic_id: str,
    user_id: str = Query(..., description="User ID")
):
    """
    Force refresh content for a topic (re-scrape blogs)
    """
    # This will force refresh the content
    return await get_topic_content(
        request=request,
        topic_id=topic_id,
        user_id=user_id,
        force_refresh=True
    )

async def search_youtube_videos(topic: str, subject: str, class_level: int) -> List[Dict]:
    """Search YouTube for real educational videos"""
    
    if not YOUTUBE_API_KEY:
        print("⚠️ YouTube API key not configured, returning mock data")
        return get_mock_videos(topic, subject, class_level)
    
    videos = []
    
    # Create optimized search queries for Indian education
    search_queries = [
        f"{topic} class {class_level} {subject} NCERT",
        f"{topic} {subject} Khan Academy Hindi",
        f"{topic} Physics Wallah Alakh Pandey",
        f"{topic} class {class_level} Vedantu JEE",
        f"{topic} Unacademy {subject}",
        f"{topic} explained animation {subject}"
    ]
    
    # Priority channels for Indian students
    priority_channels = {
        "Khan Academy India": 1.0,
        "Physics Wallah - Alakh Pandey": 0.95,
        "Vedantu JEE": 0.90,
        "Unacademy JEE": 0.88,
        "NCERT Official": 0.92,
        "Vedantu 9 & 10": 0.89,
        "Doubtnut": 0.85,
        "Manocha Academy": 0.83,
        "Science and Fun": 0.82,
        "MathsTeacher": 0.84
    }
    
    async with aiohttp.ClientSession() as session:
        all_videos = []
        
        for query in search_queries[:3]:  # Limit to 3 queries to save API quota
            try:
                # Search for videos
                search_url = f"{YOUTUBE_API_URL}/search"
                params = {
                    "key": YOUTUBE_API_KEY,
                    "q": query,
                    "part": "snippet",
                    "type": "video",
                    "maxResults": 10,
                    "order": "relevance",
                    "videoDuration": "medium",  # 4-20 minutes
                    "regionCode": "IN",  # India region
                    "relevanceLanguage": "en"
                }
                
                async with session.get(search_url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        for item in data.get("items", []):
                            video_id = item["id"]["videoId"]
                            snippet = item["snippet"]
                            
                            # Get video details (duration, views)
                            details = await get_video_details(session, video_id)
                            
                            # Calculate quality score
                            channel_title = snippet["channelTitle"]
                            base_score = priority_channels.get(channel_title, 0.7)
                            
                            # Boost score for relevant keywords
                            title_lower = snippet["title"].lower()
                            if str(class_level) in title_lower:
                                base_score += 0.05
                            if "ncert" in title_lower:
                                base_score += 0.05
                            if subject.lower() in title_lower:
                                base_score += 0.03
                            
                            video = {
                                "id": video_id,
                                "title": snippet["title"],
                                "channel": channel_title,
                                "thumbnail": snippet["thumbnails"]["high"]["url"],
                                "description": snippet["description"][:200],
                                "publishedAt": snippet["publishedAt"],
                                "duration": details.get("duration", "N/A"),
                                "views": details.get("views", "N/A"),
                                "likes": details.get("likes", "N/A"),
                                "quality_score": min(base_score, 1.0),
                                "language": "Hindi/English" if any(ch in channel_title for ch in ["Physics Wallah", "Vedantu"]) else "English"
                            }
                            
                            all_videos.append(video)
                    
            except Exception as e:
                print(f"YouTube search error: {e}")
        
        # Remove duplicates and sort by quality score
        seen = set()
        unique_videos = []
        for video in all_videos:
            if video["id"] not in seen:
                seen.add(video["id"])
                unique_videos.append(video)
        
        # Sort by quality score and return top 10
        unique_videos.sort(key=lambda x: x["quality_score"], reverse=True)
        return unique_videos[:10]

async def get_video_details(session: aiohttp.ClientSession, video_id: str) -> Dict:
    """Get detailed information about a YouTube video"""
    
    try:
        url = f"{YOUTUBE_API_URL}/videos"
        params = {
            "key": YOUTUBE_API_KEY,
            "id": video_id,
            "part": "contentDetails,statistics"
        }
        
        async with session.get(url, params=params) as response:
            if response.status == 200:
                data = await response.json()
                if data["items"]:
                    item = data["items"][0]
                    
                    # Parse duration (PT15M33S -> 15:33)
                    duration_str = item["contentDetails"]["duration"]
                    duration = parse_youtube_duration(duration_str)
                    
                    # Format views
                    view_count = int(item["statistics"].get("viewCount", 0))
                    if view_count > 1000000:
                        views = f"{view_count / 1000000:.1f}M views"
                    elif view_count > 1000:
                        views = f"{view_count / 1000:.0f}K views"
                    else:
                        views = f"{view_count} views"
                    
                    return {
                        "duration": duration,
                        "views": views,
                        "likes": item["statistics"].get("likeCount", 0)
                    }
    except Exception as e:
        print(f"Error getting video details: {e}")
    
    return {"duration": "N/A", "views": "N/A", "likes": 0}

def parse_youtube_duration(duration: str) -> str:
    """Convert YouTube duration format (PT15M33S) to readable format (15:33)"""
    import re
    
    match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', duration)
    if match:
        hours, minutes, seconds = match.groups()
        
        if hours:
            return f"{hours}:{minutes or '00'}:{seconds or '00'}"
        elif minutes:
            return f"{minutes}:{seconds or '00':0>2}"
        elif seconds:
            return f"0:{seconds:0>2}"
    
    return "N/A"

def get_mock_videos(topic: str, subject: str, class_level: int) -> List[Dict]:
    """Fallback mock videos if YouTube API is not configured"""
    return [
        {
            "id": "dQw4w9WgXcQ",
            "title": f"{topic} - Complete Explanation | Class {class_level} {subject}",
            "channel": "Khan Academy India",
            "thumbnail": "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
            "description": "Complete explanation with examples",
            "duration": "12:45",
            "views": "250K views",
            "quality_score": 0.95,
            "language": "English"
        }
    ]

async def generate_enhanced_ai_summary(
    topic: str, 
    subject: str, 
    class_level: int, 
    chapter: int,
    description: str
) -> Dict:
    """Generate comprehensive, student-friendly AI summary"""
    
    try:
        if settings.GEMINI_API_KEY:
            prompt = f"""
            You are an expert teacher explaining {topic} (Chapter {chapter} of {subject}) to a Class {class_level} student in India.
            Topic context: {description}
            
            Create a comprehensive, easy-to-understand study guide with:
            
            1. SIMPLE OVERVIEW (3-4 sentences)
            - Explain what this topic is about in very simple language
            - Why is it important to learn?
            - How does it connect to real life?
            
            2. KEY CONCEPTS (5-7 points)
            - Break down the main ideas into simple points
            - Use examples from daily life
            - Explain each concept as if teaching a friend
            
            3. IMPORTANT FORMULAS/DEFINITIONS
            - List all important formulas with what each symbol means
            - Provide simple definitions in easy language
            - Include units where applicable
            
            4. STEP-BY-STEP LEARNING APPROACH
            - How should a student approach learning this topic?
            - What to learn first, second, third?
            - Tips for understanding difficult parts
            
            5. COMMON MISTAKES STUDENTS MAKE
            - List 4-5 mistakes students typically make
            - Explain why these mistakes happen
            - How to avoid them
            
            6. MEMORY TRICKS & MNEMONICS
            - Creative ways to remember formulas
            - Mnemonics for sequences or lists
            - Visual memory aids
            
            7. REAL-WORLD APPLICATIONS
            - Where do we see this in daily life?
            - How is it used in technology/nature?
            - Career fields that use this knowledge
            
            8. EXAM TIPS
            - What type of questions are usually asked?
            - Important points examiners look for
            - Quick revision points
            
            Make it engaging, use simple language, and include Indian context where possible.
            Format the response clearly with sections.
            """
            
            response = model.generate_content(prompt)
            text = response.text
            
            # Parse the enhanced response
            return {
                "overview": extract_section(text, "OVERVIEW", "KEY CONCEPTS") or 
                           f"{topic} is a fundamental concept in {subject} that helps us understand important principles.",
                
                "key_concepts": extract_numbered_list(text, "KEY CONCEPTS") or [
                    f"Understanding the basics of {topic}",
                    "Core principles and their applications",
                    "How to solve problems step by step",
                    "Connecting theory with practical examples",
                    "Building strong foundation for advanced topics"
                ],
                
                "formulas": extract_numbered_list(text, "FORMULAS") or 
                           extract_numbered_list(text, "DEFINITIONS") or [
                    "Check your textbook for specific formulas",
                    "Important formulas will be covered in video lessons"
                ],
                
                "learning_approach": extract_section(text, "LEARNING APPROACH", "COMMON MISTAKES") or
                                   "Start with understanding basics, practice problems, and review regularly.",
                
                "common_mistakes": extract_numbered_list(text, "COMMON MISTAKES") or [
                    "Not understanding the fundamental concept",
                    "Rushing through problems without reading carefully",
                    "Forgetting to check units in calculations",
                    "Not practicing enough variety of problems"
                ],
                
                "memory_tips": extract_section(text, "MEMORY TRICKS", "REAL-WORLD") or 
                              extract_section(text, "MNEMONICS", "APPLICATIONS") or
                              "Create visual diagrams, use acronyms, and relate to real-life examples.",
                
                "applications": extract_numbered_list(text, "APPLICATIONS") or [
                    "Used in everyday technology",
                    "Important for competitive exams",
                    "Foundation for advanced studies"
                ],
                
                "exam_tips": extract_numbered_list(text, "EXAM TIPS") or [
                    "Focus on NCERT examples",
                    "Practice previous year questions",
                    "Understand concepts rather than memorizing"
                ],
                
                "generated_at": datetime.utcnow().isoformat()
            }
            
    except Exception as e:
        print(f"AI generation error: {e}")
    
    # Enhanced fallback summary
    return {
        "overview": f"""
        {topic} is an essential topic in {subject} for Class {class_level} students. 
        This chapter helps you understand fundamental concepts that are crucial for both board exams and competitive exams. 
        By mastering this topic, you'll build a strong foundation for advanced learning and develop problem-solving skills.
        """,
        
        "key_concepts": [
            f"Core Principle 1: Understanding what {topic} means and why it matters",
            f"Core Principle 2: Learning the fundamental rules and properties",
            f"Core Principle 3: Applying concepts to solve numerical problems",
            f"Core Principle 4: Connecting {topic} with other chapters in {subject}",
            f"Core Principle 5: Real-world applications and practical examples"
        ],
        
        "formulas": [
            "Important formulas will be covered in video lessons",
            "Refer to NCERT textbook Chapter {chapter} for complete list",
            "Practice derivations to understand formula origins"
        ],
        
        "learning_approach": """
        Start by reading the NCERT textbook introduction. Watch the concept videos to understand basics. 
        Practice solved examples first, then attempt exercise questions. Review and revise regularly.
        """,
        
        "common_mistakes": [
            "Not reading the question carefully and missing important details",
            "Forgetting to convert units before calculation",
            "Skipping steps in problem-solving",
            "Not practicing enough variety of questions",
            "Memorizing without understanding concepts"
        ],
        
        "memory_tips": """
        Use the VIBGYOR technique - Visualize, Imagine, Build connections, Group similar concepts, 
        Yell it out (teach someone), Organize notes, and Review regularly. Create mind maps and flowcharts.
        """,
        
        "applications": [
            "Essential for JEE/NEET and other competitive exams",
            "Used in everyday technology and innovations",
            "Important for understanding advanced topics",
            "Applications in various career fields"
        ],
        
        "exam_tips": [
            "First solve all NCERT examples and exercises",
            "Practice at least 5 previous year questions daily",
            "Time yourself while solving problems",
            "Focus on step-by-step solutions for full marks",
            "Review mistakes and maintain an error log"
        ],
        
        "generated_at": datetime.utcnow().isoformat()
    }

def extract_section(text: str, start: str, end: str) -> str:
    """Extract a section from AI response"""
    try:
        start_idx = text.upper().find(start.upper())
        end_idx = text.upper().find(end.upper())
        if start_idx != -1:
            if end_idx != -1 and end_idx > start_idx:
                return text[start_idx + len(start):end_idx].strip().strip(':').strip()
            else:
                # Take next 500 characters if no end marker
                return text[start_idx + len(start):start_idx + len(start) + 500].strip().strip(':').strip()
    except:
        pass
    return ""

def extract_numbered_list(text: str, section: str) -> List[str]:
    """Extract numbered or bulleted list from AI response"""
    points = []
    try:
        section_start = text.upper().find(section.upper())
        if section_start != -1:
            # Get text after section heading
            section_text = text[section_start:section_start + 1500]
            lines = section_text.split('\n')
            
            for line in lines[1:]:  # Skip the heading line
                line = line.strip()
                if not line:
                    continue
                    
                # Check for numbered points (1., 2., etc) or bullets (-, •, *)
                if (line and (line[0].isdigit() or line[0] in '-•*')):
                    # Clean the point
                    clean_point = line.lstrip('0123456789.-•*').strip()
                    if clean_point and len(clean_point) > 10:  # Minimum length
                        points.append(clean_point)
                elif points and len(points) < 10:  # Continue previous point
                    # If line doesn't start with number/bullet but we're building list
                    if len(line) > 10 and not any(marker in line[:20].upper() for marker in ['FORMULA', 'STEP', 'TIPS', 'EXAM', 'APPLICATIONS']):
                        points[-1] = points[-1] + " " + line
                
                if len(points) >= 8:  # Maximum points
                    break
    except Exception as e:
        print(f"Error extracting list: {e}")
    
    return points if points else []

async def get_educational_articles(topic: str, subject: str, class_level: int) -> List[Dict]:
    """Get educational articles with correct URLs"""
    
    # URL-friendly topic name
    topic_slug = topic.lower().replace(' ', '-').replace('&', 'and')
    
    articles = [
        {
            "id": "article_1",
            "title": f"{topic} - NCERT Solutions",
            "source": "NCERT Official",
            "type": "Textbook",
            "icon": "📚",
            "url": f"https://ncert.nic.in/textbook.php?{get_subject_code(subject)}{class_level}",
            "reading_time": "15 min read",
            "difficulty": "Medium",
            "highlights": [
                "Official NCERT content",
                "Board exam focused",
                "Solved examples",
                "Exercise solutions"
            ]
        },
        {
            "id": "article_2",
            "title": f"{topic} Explained - Khan Academy",
            "source": "Khan Academy",
            "type": "Interactive",
            "icon": "🎓",
            "url": f"https://www.khanacademy.org/search?page_search_query={topic}+class+{class_level}",
            "reading_time": "10 min read",
            "difficulty": "Easy",
            "highlights": [
                "Step-by-step explanation",
                "Interactive exercises",
                "Visual learning",
                "Free practice"
            ]
        },
        {
            "id": "article_3",
            "title": f"Master {topic} - Vedantu",
            "source": "Vedantu",
            "type": "Study Guide",
            "icon": "📖",
            "url": f"https://www.vedantu.com/ncert-solutions/ncert-solutions-class-{class_level}-{subject.lower()}",
            "reading_time": "12 min read",
            "difficulty": "Medium",
            "highlights": [
                "Detailed explanations",
                "Important questions",
                "Tips and tricks",
                "Exam preparation"
            ]
        },
        {
            "id": "article_4",
            "title": f"{topic} Practice Problems",
            "source": "Toppr",
            "type": "Practice",
            "icon": "✏️",
            "url": f"https://www.toppr.com/ask/question/search/?q={topic_slug}",
            "reading_time": "20 min practice",
            "difficulty": "Hard",
            "highlights": [
                "Variety of problems",
                "Difficulty levels",
                "Instant solutions",
                "Doubt clearing"
            ]
        }
    ]
    
    return articles

def get_subject_code(subject: str) -> str:
    """Get NCERT subject code for URL"""
    codes = {
        "Mathematics": "jemh1",
        "Physics": "leph1",
        "Chemistry": "lech1",
        "Biology": "lebo1",
        "Science": "jesc1"
    }
    return codes.get(subject, "jesc1")

async def get_practice_resources(topic: str, subject: str, class_level: int) -> Dict:
    """Get practice resources"""
    
    return {
        "quiz_available": True,
        "quiz_questions": 15,
        "difficulty_levels": ["Easy", "Medium", "Hard"],
        "estimated_time": "15-20 minutes",
        "previous_attempts": 0,
        "best_score": None,
        "practice_problems": {
            "total": 30,
            "solved_examples": 10,
            "exercise_questions": 20
        },
        "additional_resources": [
            {
                "type": "PDF Notes",
                "title": f"{topic} - Complete Notes",
                "size": "2.5 MB",
                "pages": 12
            },
            {
                "type": "Formula Sheet",
                "title": f"{topic} - Quick Reference",
                "size": "500 KB",
                "pages": 2
            },
            {
                "type": "Mind Map",
                "title": f"{topic} - Visual Summary",
                "size": "1 MB",
                "pages": 1
            }
        ]
    }