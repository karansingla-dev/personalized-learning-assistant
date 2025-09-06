# backend/app/services/content_service.py
"""
Content service for web scraping and AI summaries
"""

import asyncio
import aiohttp
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import json
import re
from urllib.parse import quote_plus
import google.generativeai as genai
from bs4 import BeautifulSoup

from app.config import settings
from app.models.models import ContentType, DifficultyLevel

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-pro')

class ContentService:
    """Service for managing educational content"""
    
    def __init__(self, db):
        self.db = db
        self.session = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def get_topic_content(
        self,
        topic_id: str,
        topic_name: str,
        subject_name: str,
        class_level: int,
        force_refresh: bool = False
    ) -> Dict:
        """Get all content for a topic (cached or fresh)"""
        
        # Check cache first
        if not force_refresh:
            cached_content = await self._get_cached_content(topic_id)
            if cached_content:
                return cached_content
        
        # Scrape fresh content
        videos = await self.scrape_videos(topic_name, subject_name, class_level)
        articles = await self.scrape_articles(topic_name, subject_name, class_level)
        
        # Generate AI explanation
        ai_explanation = await self.generate_ai_explanation(
            topic_name, subject_name, class_level
        )
        
        # Save to database
        await self._save_content(topic_id, videos, articles)
        
        return {
            "videos": videos,
            "articles": articles,
            "ai_explanation": ai_explanation,
            "last_updated": datetime.utcnow()
        }
    
    async def _get_cached_content(self, topic_id: str) -> Optional[Dict]:
        """Get cached content if fresh enough"""
        
        # Get content from last 24 hours
        cache_time = datetime.utcnow() - timedelta(hours=settings.CONTENT_CACHE_HOURS)
        
        content = await self.db["content"].find({
            "topic_id": topic_id,
            "last_updated": {"$gte": cache_time}
        }).sort("relevance_score", -1).to_list(50)
        
        if not content:
            return None
        
        # Separate by type
        videos = [c for c in content if c["type"] == "video"]
        articles = [c for c in content if c["type"] == "article"]
        
        return {
            "videos": videos[:10],
            "articles": articles[:10],
            "cached": True
        }
    
    async def scrape_videos(
        self,
        topic: str,
        subject: str,
        class_level: int
    ) -> List[Dict]:
        """Scrape educational videos"""
        videos = []
        
        # YouTube search queries
        queries = [
            f"{topic} {subject} class {class_level} NCERT",
            f"{topic} Khan Academy",
            f"{topic} Physics Wallah",
            f"{topic} explained animation",
            f"{topic} {subject} tutorial"
        ]
        
        for query in queries[:3]:  # Limit queries
            search_results = await self._youtube_search(query)
            videos.extend(search_results)
        
        # Score and rank videos
        scored_videos = []
        for video in videos:
            video["relevance_score"] = self._calculate_relevance(
                video, topic, subject, class_level
            )
            scored_videos.append(video)
        
        # Sort by relevance and return top 10
        scored_videos.sort(key=lambda x: x["relevance_score"], reverse=True)
        
        return scored_videos[:10]
    
    async def _youtube_search(self, query: str) -> List[Dict]:
        """Search YouTube (mock implementation)"""
        # In production, use YouTube Data API
        # For now, return mock data
        
        mock_videos = [
            {
                "type": "video",
                "source": "youtube",
                "title": f"{query} - Complete Tutorial",
                "url": f"https://youtube.com/watch?v=example_{query[:10]}",
                "thumbnail_url": "https://img.youtube.com/vi/example/maxresdefault.jpg",
                "author": "Khan Academy" if "Khan" in query else "Physics Wallah",
                "duration_minutes": 15,
                "views": 150000,
                "likes": 5000
            }
        ]
        
        return mock_videos
    
    async def scrape_articles(
        self,
        topic: str,
        subject: str,
        class_level: int
    ) -> List[Dict]:
        """Scrape educational articles"""
        articles = []
        
        # Educational sites to search
        sites = [
            {"name": "NCERT", "base_url": "https://ncert.nic.in"},
            {"name": "GeeksforGeeks", "base_url": "https://www.geeksforgeeks.org"},
            {"name": "Khan Academy", "base_url": "https://www.khanacademy.org"},
            {"name": "Toppr", "base_url": "https://www.toppr.com"}
        ]
        
        for site in sites[:3]:  # Limit sites
            search_url = f"https://www.google.com/search?q=site:{site['base_url']}+{quote_plus(topic)}"
            
            # Mock article data (in production, actually scrape)
            articles.append({
                "type": "article",
                "source": site["name"].lower(),
                "title": f"{topic} - {site['name']} Guide",
                "url": search_url,
                "author": site["name"],
                "reading_time": 10,
                "relevance_score": 0.8
            })
        
        return articles
    
    def _calculate_relevance(
        self,
        content: Dict,
        topic: str,
        subject: str,
        class_level: int
    ) -> float:
        """Calculate content relevance score"""
        score = 0.5  # Base score
        
        # Check title relevance
        title = content.get("title", "").lower()
        if topic.lower() in title:
            score += 0.2
        if subject.lower() in title:
            score += 0.1
        if f"class {class_level}" in title or f"grade {class_level}" in title:
            score += 0.1
        
        # Trusted sources get bonus
        trusted_sources = ["khan academy", "physics wallah", "ncert", "cbse"]
        author = content.get("author", "").lower()
        if any(source in author for source in trusted_sources):
            score += 0.2
        
        # Popular content bonus
        views = content.get("views", 0)
        if views > 100000:
            score += 0.1
        
        return min(1.0, score)
    
    async def generate_ai_explanation(
        self,
        topic: str,
        subject: str,
        class_level: int
    ) -> Dict:
        """Generate AI-powered explanation"""
        
        try:
            # Determine explanation style based on class
            if class_level <= 8:
                style = "Explain in simple words with fun examples from daily life, games, and stories."
            elif class_level <= 10:
                style = "Explain clearly with real-world applications and practical examples."
            else:
                style = "Provide detailed explanation with formulas, advanced concepts, and exam preparation tips."
            
            prompt = f"""
            You are an expert {subject} teacher for Class {class_level} students in India.
            
            Topic: {topic}
            
            {style}
            
            Provide:
            1. Simple explanation (2-3 paragraphs)
            2. Key concepts (5 bullet points)
            3. Important formulas (if applicable)
            4. Common mistakes students make
            5. Memory tricks or mnemonics
            6. Real-life applications
            
            Format the response in a clear, structured way.
            """
            
            response = model.generate_content(prompt)
            explanation_text = response.text
            
            # Parse the response into structured format
            explanation = self._parse_ai_explanation(explanation_text)
            explanation["generated_at"] = datetime.utcnow()
            
            return explanation
            
        except Exception as e:
            print(f"AI generation error: {e}")
            # Return default explanation
            return {
                "simple_explanation": f"{topic} is an important concept in {subject}.",
                "key_concepts": [
                    "Understanding the basics",
                    "Learning the formulas",
                    "Practicing problems",
                    "Real-world applications",
                    "Exam preparation"
                ],
                "formulas": [],
                "common_mistakes": [
                    "Not understanding fundamentals",
                    "Skipping practice"
                ],
                "memory_tricks": "Create your own mnemonics",
                "applications": ["Used in daily life", "Important for exams"]
            }
    
    def _parse_ai_explanation(self, text: str) -> Dict:
        """Parse AI response into structured format"""
        
        # Basic parsing (improve based on actual response format)
        lines = text.split('\n')
        
        explanation = {
            "simple_explanation": "",
            "key_concepts": [],
            "formulas": [],
            "common_mistakes": [],
            "memory_tricks": "",
            "applications": []
        }
        
        current_section = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Detect sections
            if "explanation" in line.lower() or line.startswith("1."):
                current_section = "explanation"
            elif "concept" in line.lower() or line.startswith("2."):
                current_section = "concepts"
            elif "formula" in line.lower() or line.startswith("3."):
                current_section = "formulas"
            elif "mistake" in line.lower() or line.startswith("4."):
                current_section = "mistakes"
            elif "memory" in line.lower() or "mnemonic" in line.lower() or line.startswith("5."):
                current_section = "memory"
            elif "application" in line.lower() or line.startswith("6."):
                current_section = "applications"
            else:
                # Add to current section
                if current_section == "explanation":
                    explanation["simple_explanation"] += line + " "
                elif current_section == "concepts" and line.startswith("-"):
                    explanation["key_concepts"].append(line[1:].strip())
                elif current_section == "formulas" and line:
                    explanation["formulas"].append(line)
                elif current_section == "mistakes" and line:
                    explanation["common_mistakes"].append(line)
                elif current_section == "memory":
                    explanation["memory_tricks"] += line + " "
                elif current_section == "applications" and line:
                    explanation["applications"].append(line)
        
        return explanation
    
    async def generate_video_summary(self, video_url: str, title: str) -> Dict:
        """Generate AI summary of video content"""
        
        try:
            prompt = f"""
            Based on the video title: "{title}"
            
            Generate a brief summary that includes:
            1. Main topic covered
            2. Key points (3-5 bullet points)
            3. Important takeaways
            
            Keep it concise and student-friendly.
            """
            
            response = model.generate_content(prompt)
            summary_text = response.text
            
            # Parse into structured format
            return {
                "summary": summary_text[:500],
                "key_points": self._extract_bullet_points(summary_text),
                "generated_at": datetime.utcnow()
            }
            
        except Exception as e:
            print(f"Summary generation error: {e}")
            return {
                "summary": f"This video covers {title}",
                "key_points": ["Watch the video for detailed explanation"],
                "generated_at": datetime.utcnow()
            }
    
    def _extract_bullet_points(self, text: str) -> List[str]:
        """Extract bullet points from text"""
        points = []
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if line.startswith('-') or line.startswith('•') or line.startswith('*'):
                points.append(line[1:].strip())
            elif re.match(r'^\d+\.', line):  # Numbered list
                points.append(re.sub(r'^\d+\.\s*', '', line))
        
        return points[:5]  # Max 5 points
    
    async def _save_content(
        self,
        topic_id: str,
        videos: List[Dict],
        articles: List[Dict]
    ):
        """Save content to database"""
        
        all_content = []
        
        for video in videos:
            video["topic_id"] = topic_id
            video["last_updated"] = datetime.utcnow()
            all_content.append(video)
        
        for article in articles:
            article["topic_id"] = topic_id
            article["last_updated"] = datetime.utcnow()
            all_content.append(article)
        
        if all_content:
            # Update or insert content
            for content in all_content:
                await self.db["content"].update_one(
                    {"url": content["url"], "topic_id": topic_id},
                    {"$set": content},
                    upsert=True
                )

# Singleton instance
content_service = None

def get_content_service(db):
    """Get content service instance"""
    global content_service
    if not content_service:
        content_service = ContentService(db)
    return content_service