# backend/app/services/content_service.py
# UPDATE YOUR EXISTING FILE WITH THESE CHANGES

"""
Enhanced Content Service - Update your existing content_service.py
"""

import asyncio
import aiohttp
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import json
import re
from urllib.parse import quote, urlparse, urljoin
import google.generativeai as genai
from bs4 import BeautifulSoup
import hashlib
import os

from app.config import settings
from app.models.models import ContentType, DifficultyLevel

# Add these new configurations at the top
YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY')
SERPER_API_KEY = os.getenv('SERPER_API_KEY')

# Configure Gemini - Try multiple models
try:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
    except:
        try:
            model = genai.GenerativeModel('gemini-pro')
        except:
            model = None
except:
    model = None
    print("Warning: Gemini API not configured")

class ContentService:
    """Service for managing educational content"""
    
    def __init__(self, db):
        self.db = db
        self.session = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            connector=aiohttp.TCPConnector(ssl=False, limit=10),
            timeout=aiohttp.ClientTimeout(total=30)  # Increase timeout
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    # KEEP YOUR EXISTING get_topic_content METHOD BUT UPDATE IT:
    async def get_topic_content(
        self,
        topic_id: str,
        topic_name: str,
        subject_name: str,
        class_level: int,
        force_refresh: bool = False
    ) -> Dict:
        """Get all content for a topic"""
        
        # Check cache
        if not force_refresh:
            cached = await self._get_cached_content(topic_id)
            if cached and cached.get('last_updated'):
                # Check if cache is recent (within 7 days)
                try:
                    cache_time = datetime.fromisoformat(cached['last_updated'])
                    if (datetime.utcnow() - cache_time).days < 7:
                        print(f"Returning cached content for {topic_name}")
                        return cached
                except:
                    pass
        
        print(f"Fetching fresh content for {topic_name} - Class {class_level}")
        
        # Run all three in parallel
        ai_task = self.generate_ai_summary(topic_name, subject_name, class_level)
        videos_task = self.fetch_youtube_videos(topic_name, subject_name, class_level)
        blogs_task = self.search_and_scrape_blogs(topic_name, subject_name, class_level)
        
        results = await asyncio.gather(ai_task, videos_task, blogs_task, return_exceptions=True)
        
        ai_summary = results[0] if not isinstance(results[0], Exception) else self._get_default_summary(topic_name, subject_name, class_level)
        videos = results[1] if not isinstance(results[1], Exception) else []
        articles = results[2] if not isinstance(results[2], Exception) else []
        
        content_data = {
            "ai_explanation": ai_summary,
            "ai_summary": ai_summary,
            "videos": videos,
            "articles": articles,
            "last_updated": datetime.utcnow().isoformat()
        }
        
        # Cache it
        await self._save_to_cache(topic_id, content_data)
        
        print(f"Content ready: {len(videos)} videos, {len(articles)} articles")
        return content_data
    
    # REPLACE YOUR generate_ai_summary METHOD WITH THIS:
    async def generate_ai_summary(self, topic_name: str, subject_name: str, class_level: int) -> str:
        """Generate comprehensive AI summary with formulas and examples"""
        
        print(f"Generating AI summary for {topic_name}")
        
        if model:
            try:
                # Adjust complexity based on class level
                if class_level <= 8:
                    complexity = "simple explanations with fun examples from daily life"
                elif class_level <= 10:
                    complexity = "clear explanations with practical applications and basic formulas"
                else:
                    complexity = "detailed explanations with formulas, derivations, and JEE/NEET level concepts"
                
                prompt = f"""
                Create a comprehensive study guide for "{topic_name}" in {subject_name} for a Class {class_level} student.
                
                Use {complexity}.
                
                Structure your response with these sections:
                
                # {topic_name}
                
                ## 📚 What is {topic_name}?
                (Provide a clear, engaging introduction suitable for Class {class_level})
                
                ## 🎯 Why is it Important?
                - Real-world applications
                - How it connects to other topics
                - Career relevance
                
                ## 🔑 Key Concepts
                (List and explain 3-5 main concepts with examples)
                
                ## 📐 Important Formulas
                (If applicable, list key formulas with explanations)
                
                ## 📝 Solved Examples
                (Provide 2-3 worked examples appropriate for Class {class_level})
                
                ## ⚠️ Common Mistakes to Avoid
                (List 3-4 common errors students make)
                
                ## 💡 Memory Tips & Tricks
                (Mnemonics, shortcuts, or visual aids to remember concepts)
                
                ## 📊 Quick Revision Points
                (Bullet points for last-minute revision)
                
                ## 🎓 Exam Tips
                - Important questions that frequently appear
                - How to approach problems
                - Time management suggestions
                
                Make it engaging and appropriate for the student's level. Use emojis to make sections visually distinct.
                """
                
                response = model.generate_content(prompt)
                return response.text
            except Exception as e:
                print(f"Gemini error: {e}")
        
        return self._get_default_summary(topic_name, subject_name, class_level)
    
    # REPLACE YOUR fetch_youtube_videos METHOD WITH THIS:
    async def fetch_youtube_videos(self, topic_name: str, subject_name: str, class_level: int) -> List[Dict]:
        """Fetch real YouTube videos using YouTube Data API v3"""
        
        print(f"Fetching YouTube videos for {topic_name}")
        
        if YOUTUBE_API_KEY:
            try:
                # Use YouTube Data API
                search_url = "https://www.googleapis.com/youtube/v3/search"
                
                # Educational channels to prioritize
                edu_channels = [
                    "Khan Academy", "Physics Wallah", "BYJU'S", 
                    "Vedantu", "Unacademy", "NCERT Official"
                ]
                
                query = f"{topic_name} {subject_name} class {class_level} CBSE NCERT"
                
                params = {
                    'part': 'snippet',
                    'q': query,
                    'key': YOUTUBE_API_KEY,
                    'maxResults': 15,
                    'type': 'video',
                    'videoDuration': 'medium',
                    'relevanceLanguage': 'en',
                    'safeSearch': 'strict'
                }
                
                async with self.session.get(search_url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        videos = []
                        for item in data.get('items', []):
                            snippet = item['snippet']
                            video_id = item['id']['videoId']
                            
                            # Get video details for duration
                            details = await self._get_video_details(video_id)
                            
                            videos.append({
                                'id': f'video_{len(videos) + 1}',
                                'video_id': video_id,
                                'title': snippet['title'],
                                'description': snippet.get('description', '')[:200],
                                'url': f"https://www.youtube.com/watch?v={video_id}",
                                'thumbnail_url': snippet['thumbnails']['high']['url'],
                                'channel': snippet['channelTitle'],
                                'author': snippet['channelTitle'],
                                'duration_minutes': details.get('duration', 10),
                                'content_type': 'video',
                                'source': 'YouTube'
                            })
                        
                        print(f"Found {len(videos)} YouTube videos")
                        return videos[:10]
                    
            except Exception as e:
                print(f"YouTube API error: {e}")
        
        # Fallback to your existing implementation
        return self._get_fallback_videos(topic_name, subject_name, class_level)
    
    async def _get_video_details(self, video_id: str) -> Dict:
        """Get video duration and stats"""
        if not YOUTUBE_API_KEY:
            return {'duration': 10}
        
        try:
            url = "https://www.googleapis.com/youtube/v3/videos"
            params = {
                'part': 'contentDetails,statistics',
                'id': video_id,
                'key': YOUTUBE_API_KEY
            }
            
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get('items'):
                        item = data['items'][0]
                        
                        # Parse duration (PT15M33S -> 15)
                        duration_str = item['contentDetails']['duration']
                        import re
                        match = re.match(r'PT(\d+H)?(\d+M)?(\d+S)?', duration_str)
                        if match:
                            hours = int(match.group(1)[:-1]) if match.group(1) else 0
                            minutes = int(match.group(2)[:-1]) if match.group(2) else 0
                            total_minutes = hours * 60 + minutes
                            return {'duration': total_minutes or 10}
        except:
            pass
        
        return {'duration': 10}
    
    def _get_fallback_videos(self, topic_name: str, subject_name: str, class_level: int) -> List[Dict]:
        """Fallback videos when API is not available"""
        channels = [
            "Khan Academy", "BYJU'S", "Vedantu", "Physics Wallah",
            "Unacademy", "NCERT Official", "Manocha Academy"
        ]
        
        videos = []
        for i, channel in enumerate(channels[:6]):
            videos.append({
                'id': f'video_{i + 1}',
                'video_id': f'demo_{i + 1}',
                'title': f'{topic_name} - {channel} Class {class_level}',
                'description': f'Learn {topic_name} with {channel}',
                'url': f'https://www.youtube.com/results?search_query={quote(topic_name + " " + channel)}',
                'thumbnail_url': f'https://via.placeholder.com/480x360.png?text={channel}',
                'channel': channel,
                'author': channel,
                'duration_minutes': 15,
                'content_type': 'video',
                'source': 'YouTube'
            })
        
        return videos
    
    # REPLACE YOUR search_and_scrape_blogs METHOD WITH THIS:
    async def search_and_scrape_blogs(self, topic_name: str, subject_name: str, class_level: int) -> List[Dict]:
        """Enhanced blog scraping with actual content extraction"""
        
        print(f"Searching and scraping blogs for {topic_name}")
        
        articles = []
        
        # Educational sites to try
        edu_urls = [
            f"https://byjus.com/ncert-solutions-class-{class_level}/{subject_name.lower()}/",
            f"https://www.toppr.com/guides/{subject_name.lower()}/",
            f"https://www.vedantu.com/ncert-solutions/ncert-solutions-class-{class_level}-{subject_name.lower()}",
            f"https://www.learncbse.in/ncert-solutions-class-{class_level}-{subject_name.lower()}/",
            f"https://www.khanacademy.org/search?page_search_query={quote(topic_name)}"
        ]
        
        # Try Serper API first if available
        if SERPER_API_KEY:
            articles = await self._search_with_serper(topic_name, subject_name, class_level)
        
        # Try direct scraping as fallback
        if len(articles) < 5:
            for url in edu_urls[:3]:  # Try first 3 URLs
                article = await self._scrape_single_article(url, topic_name)
                if article:
                    articles.append(article)
        
        # If still not enough, use Google search
        if len(articles) < 5:
            search_results = await self._google_search(f"{topic_name} {subject_name} class {class_level} tutorial")
            for result in search_results[:5]:
                article = await self._scrape_single_article(
                    result['url'], 
                    topic_name,
                    title=result.get('title'),
                    snippet=result.get('snippet')
                )
                if article:
                    articles.append(article)
        
        # Ensure proper structure
        for i, article in enumerate(articles):
            article['id'] = f'article_{i + 1}'
            if not article.get('reading_time'):
                words = len(article.get('content', '').split())
                article['reading_time'] = f"{max(1, words // 200)} min read"
            article['has_content'] = bool(article.get('content') and len(article['content']) > 500)
        
        print(f"Scraped {len(articles)} articles with content")
        return articles[:10]
    
    async def _search_with_serper(self, topic_name: str, subject_name: str, class_level: int) -> List[Dict]:
        """Use Serper API for search"""
        if not SERPER_API_KEY:
            return []
        
        try:
            url = "https://google.serper.dev/search"
            headers = {
                'X-API-KEY': SERPER_API_KEY,
                'Content-Type': 'application/json'
            }
            
            payload = {
                'q': f"{topic_name} {subject_name} class {class_level} NCERT tutorial",
                'num': 10
            }
            
            async with self.session.post(url, json=payload, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    articles = []
                    
                    for result in data.get('organic', [])[:10]:
                        article = await self._scrape_single_article(
                            result['link'],
                            topic_name,
                            title=result.get('title'),
                            snippet=result.get('snippet')
                        )
                        if article:
                            articles.append(article)
                    
                    return articles
        except Exception as e:
            print(f"Serper API error: {e}")
        
        return []
    
    async def _google_search(self, query: str) -> List[Dict]:
        """Simple Google search scraping"""
        results = []
        
        try:
            url = f"https://www.google.com/search?q={quote(query)}&num=10"
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            async with self.session.get(url, headers=headers) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    # Find search results
                    for g in soup.find_all('div', class_='g')[:10]:
                        link = g.find('a', href=True)
                        if link:
                            url = link['href']
                            if url.startswith('http'):
                                title = g.find('h3')
                                snippet = g.find('span', class_='aCOpRe')
                                
                                results.append({
                                    'url': url,
                                    'title': title.text if title else '',
                                    'snippet': snippet.text if snippet else ''
                                })
        except Exception as e:
            print(f"Google search error: {e}")
        
        return results
    
    async def _scrape_single_article(self, url: str, topic_name: str, title: str = None, snippet: str = None) -> Optional[Dict]:
        """Scrape content from a single URL"""
        
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            async with self.session.get(url, headers=headers, timeout=10) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    # Remove unwanted elements
                    for element in soup(['script', 'style', 'nav', 'header', 'footer', 'aside']):
                        element.decompose()
                    
                    # Extract title
                    if not title:
                        title_elem = soup.find('h1') or soup.find('title')
                        title = title_elem.get_text(strip=True) if title_elem else topic_name
                    
                    # Extract content
                    content = ""
                    
                    # Try different content selectors
                    content_selectors = [
                        'article', 'main', '.content', '.post-content',
                        '.entry-content', '[role="main"]', '#content'
                    ]
                    
                    for selector in content_selectors:
                        content_elem = soup.select_one(selector)
                        if content_elem:
                            # Get text with proper spacing
                            paragraphs = content_elem.find_all(['p', 'h2', 'h3', 'li'])
                            content_parts = []
                            for p in paragraphs[:30]:  # Limit to first 30 elements
                                text = p.get_text(strip=True)
                                if len(text) > 20:  # Skip very short text
                                    content_parts.append(text)
                            
                            content = '\n\n'.join(content_parts)
                            break
                    
                    # Fallback to body text
                    if not content:
                        body = soup.find('body')
                        if body:
                            paragraphs = body.find_all('p')[:20]
                            content = '\n\n'.join([p.get_text(strip=True) for p in paragraphs if len(p.get_text(strip=True)) > 50])
                    
                    if content and len(content) > 200:
                        # Truncate if too long
                        if len(content) > 3000:
                            content = content[:3000] + "..."
                        
                        # Extract domain
                        domain = urlparse(url).netloc.replace('www.', '')
                        
                        return {
                            'title': title[:100],
                            'url': url,
                            'source': domain,
                            'content': content,
                            'snippet': snippet or content[:200],
                            'type': 'article',
                            'icon': '📚',
                            'scraped_at': datetime.utcnow().isoformat()
                        }
                        
        except Exception as e:
            print(f"Error scraping {url}: {e}")
        
        return None
    
    # UPDATE YOUR _get_default_summary METHOD:
    def _get_default_summary(self, topic_name: str, subject_name: str, class_level: int) -> str:
        """Enhanced fallback summary"""
        
        complexity = "simple" if class_level <= 8 else "detailed" if class_level <= 10 else "advanced"
        
        return f"""
# {topic_name} - Complete Study Guide

## 📚 What is {topic_name}?

{topic_name} is an important concept in {subject_name} that students in Class {class_level} need to master. This topic forms the foundation for more advanced concepts you'll learn in higher classes.

## 🎯 Why is it Important?

**Real-World Applications:**
- Used in everyday problem-solving and practical situations
- Essential for understanding advanced {subject_name} concepts
- Frequently appears in board exams and competitive tests (JEE/NEET)
- Has applications in various career fields

## 🔑 Key Concepts

### 1. Fundamental Principles
Understanding the basic principles of {topic_name} is crucial. Start by grasping the core ideas before moving to complex problems.

### 2. Problem-Solving Approach
- **Step 1:** Read the problem carefully and identify what is given
- **Step 2:** Determine what needs to be found
- **Step 3:** Apply the relevant concepts and formulas
- **Step 4:** Solve systematically
- **Step 5:** Check your answer for reasonableness

### 3. Common Patterns
Look for patterns in problems related to {topic_name}. Most questions follow similar approaches that you can master with practice.

## 📐 Important Formulas

*Note: Specific formulas for {topic_name} will be covered in your class. Key formulas include:*
- Basic formula applications
- Advanced problem-solving formulas
- Quick calculation shortcuts

## 📝 Practice Examples

### Example 1: Basic Level
Start with simple, direct applications of the concept.

### Example 2: Intermediate Level
Move to problems requiring multiple steps.

### Example 3: Advanced Level
Practice complex, application-based questions.

## ⚠️ Common Mistakes to Avoid

1. **Rushing through problems** - Take time to understand each step
2. **Ignoring units** - Always write proper units in your answers
3. **Not checking answers** - Verify your solutions make sense
4. **Memorizing without understanding** - Focus on understanding concepts

## 💡 Memory Tips & Tricks

- Create mnemonics for important formulas
- Use visual diagrams and flowcharts
- Relate concepts to real-life examples
- Practice regularly with timed tests
- Make summary notes for quick revision

## 📊 Quick Revision Points

✓ Master the basic definitions and concepts
✓ Know all important formulas and their applications
✓ Practice different types of problems
✓ Review common mistakes and how to avoid them
✓ Solve previous year question papers

## 🎓 Exam Tips

**Before the Exam:**
- Complete all NCERT exercises thoroughly
- Solve at least 5 sample papers
- Review all important formulas

**During the Exam:**
- Read questions carefully before answering
- Manage time effectively (spend appropriate time per question)
- Attempt easy questions first to build confidence
- Review your answers if time permits

---
*Remember: Success in {subject_name} comes from understanding concepts deeply and regular practice. Stay confident and keep practicing!*
"""
    
    # Keep your existing _get_cached_content method
    async def _get_cached_content(self, topic_id: str) -> Optional[Dict]:
        """Get cached content from database"""
        try:
            cache = await self.db["topic_content"].find_one({"topic_id": topic_id})
            return cache
        except:
            return None
    
    # Keep your existing _save_to_cache method
    async def _save_to_cache(self, topic_id: str, content: Dict):
        """Save content to cache"""
        try:
            content['topic_id'] = topic_id
            await self.db["topic_content"].replace_one(
                {"topic_id": topic_id},
                content,
                upsert=True
            )
        except Exception as e:
            print(f"Error saving to cache: {e}")
    
    # ADD THIS NEW METHOD FOR FALLBACK BLOGS
    def _get_fallback_blogs(self, topic_name: str, subject_name: str, class_level: int, count: int = 5) -> List[Dict]:
        """Generate fallback blog entries"""
        
        sources = [
            {"name": "NCERT Solutions", "domain": "ncert.nic.in", "icon": "📖"},
            {"name": "BYJU'S Learning", "domain": "byjus.com", "icon": "🎓"},
            {"name": "Khan Academy", "domain": "khanacademy.org", "icon": "🏫"},
            {"name": "Vedantu", "domain": "vedantu.com", "icon": "📚"},
            {"name": "TopperLearning", "domain": "topperlearning.com", "icon": "🎯"}
        ]
        
        blogs = []
        for i, source in enumerate(sources[:count]):
            blogs.append({
                'id': f'article_{i + 1}',
                'title': f'{topic_name} - {source["name"]} Guide for Class {class_level}',
                'source': source['domain'],
                'url': f'https://{source["domain"]}/search?q={quote(topic_name)}',
                'snippet': f'Comprehensive guide to {topic_name} with examples, practice problems, and solutions for Class {class_level} {subject_name}.',
                'type': 'article',
                'icon': source['icon'],
                'reading_time': '5 min read',
                'has_content': False,
                'content': ''
            })
        
        return blogs