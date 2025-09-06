# backend/app/services/ai_service.py
"""
AI Service for generating educational content
"""

import os
from typing import Dict, List, Optional
from datetime import datetime
import json

# Try to import Google Generative AI
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print("WARNING: google-generativeai not installed. AI features will be limited.")

class AIService:
    def __init__(self):
        """Initialize AI service with Gemini if available"""
        self.model = None
        
        if GEMINI_AVAILABLE:
            api_key = os.getenv("GEMINI_API_KEY")
            if api_key and api_key != "YOUR_GEMINI_API_KEY_HERE":
                try:
                    genai.configure(api_key=api_key)
                    self.model = genai.GenerativeModel('gemini-pro')
                    print("✅ AI Service initialized with Gemini")
                except Exception as e:
                    print(f"⚠️ Could not initialize Gemini: {e}")
            else:
                print("⚠️ GEMINI_API_KEY not configured in .env file")
        else:
            print("⚠️ Google Generative AI package not installed")
    
    async def generate_explanation(
        self,
        topic_name: str,
        subject: str,
        class_level: int
    ) -> Dict:
        """Generate AI explanation for a topic"""
        
        # Default response if AI is not available
        default_response = {
            "simple": f"Welcome to {topic_name}! This is an important topic in {subject}.",
            "detailed": f"{topic_name} is a fundamental concept in {subject}. Let's explore it step by step.",
            "examples": [
                "Example 1: Real-world application",
                "Example 2: Daily life scenario",
                "Example 3: Practical demonstration"
            ],
            "key_points": [
                f"Understanding {topic_name} basics",
                "Key concepts and formulas",
                "Practice problems",
                "Applications in exams",
                "Common mistakes to avoid"
            ],
            "mistakes": [
                "Not understanding the basics",
                "Skipping practice problems"
            ],
            "memory_trick": "Create mnemonics to remember key concepts"
        }
        
        if not self.model:
            return default_response
        
        try:
            # Determine complexity based on class
            if class_level <= 6:
                style = "Explain in very simple words like talking to a young child. Use toys, games, and fun examples."
            elif class_level <= 8:
                style = "Explain clearly with simple language. Use examples from sports, movies, and daily life."
            elif class_level <= 10:
                style = "Provide clear explanation with some technical terms. Include real-world applications."
            else:
                style = "Give detailed explanation with technical terms, formulas, and exam-oriented content."
            
            prompt = f"""
            You are teaching a Class {class_level} Indian student.
            
            Topic: {topic_name}
            Subject: {subject}
            
            {style}
            
            Provide:
            1. Simple explanation (2-3 paragraphs)
            2. 3 real-life examples (Indian context)
            3. 5 key points to remember
            4. 2 common mistakes students make
            5. A memory trick
            
            Format as JSON with keys: simple, detailed, examples, key_points, mistakes, memory_trick
            """
            
            response = self.model.generate_content(prompt)
            text = response.text
            
            # Try to parse JSON from response
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0]
            elif "```" in text:
                text = text.split("```")[1].split("```")[0]
            
            try:
                data = json.loads(text.strip())
                return data
            except json.JSONDecodeError:
                # If JSON parsing fails, return structured response
                return {
                    "simple": text[:500] if len(text) > 500 else text,
                    "detailed": text,
                    "examples": ["Example from the topic", "Practice scenario", "Real application"],
                    "key_points": ["Key point 1", "Key point 2", "Key point 3", "Key point 4", "Key point 5"],
                    "mistakes": ["Common mistake 1", "Common mistake 2"],
                    "memory_trick": "Use first letters to remember"
                }
                
        except Exception as e:
            print(f"Error generating AI content: {e}")
            return default_response
    
    async def search_web_resources(
        self,
        topic: str,
        subject: str,
        class_level: int
    ) -> List[Dict]:
        """Return curated educational resources"""
        
        # Return mock educational resources
        resources = [
            {
                "type": "video",
                "title": f"{topic} - Explained | Khan Academy",
                "url": "https://www.khanacademy.org",
                "source": "Khan Academy",
                "duration": "12:45",
                "language": "English",
                "quality_score": 9.5
            },
            {
                "type": "video",
                "title": f"{topic} in Hindi | Physics Wallah",
                "url": "https://www.youtube.com",
                "source": "Physics Wallah",
                "duration": "18:30",
                "language": "Hindi",
                "quality_score": 9.2
            },
            {
                "type": "article",
                "title": f"NCERT Solutions: {topic}",
                "url": "https://ncert.nic.in",
                "source": "NCERT Official",
                "read_time": "10 mins",
                "quality_score": 10.0
            },
            {
                "type": "interactive",
                "title": f"{topic} Interactive Simulation",
                "url": "https://phet.colorado.edu",
                "source": "PhET Simulations",
                "quality_score": 8.8
            },
            {
                "type": "pdf",
                "title": f"{topic} - Notes and Formula Sheet",
                "url": "#",
                "source": "Study Material",
                "quality_score": 8.5
            }
        ]
        
        return resources
    
    async def generate_practice_questions(
        self,
        topic_name: str,
        class_level: int,
        count: int = 5
    ) -> List[Dict]:
        """Generate practice questions for a topic"""
        
        questions = [
            {
                "id": "q1",
                "question": f"What is the basic concept of {topic_name}?",
                "type": "MCQ",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "answer": "Option A",
                "difficulty": "Easy",
                "explanation": "This tests your understanding of the fundamental concept."
            },
            {
                "id": "q2",
                "question": f"Explain {topic_name} in your own words.",
                "type": "Short Answer",
                "answer": "Student should explain the concept clearly",
                "difficulty": "Medium",
                "explanation": "This tests your ability to explain concepts."
            },
            {
                "id": "q3",
                "question": f"Which of the following is NOT related to {topic_name}?",
                "type": "MCQ",
                "options": ["Related A", "Related B", "Not Related", "Related D"],
                "answer": "Not Related",
                "difficulty": "Easy",
                "explanation": "This tests your ability to identify relationships."
            },
            {
                "id": "q4",
                "question": f"Solve this problem using {topic_name} concepts.",
                "type": "Problem",
                "answer": "Step-by-step solution",
                "difficulty": "Hard",
                "explanation": "This tests problem-solving skills."
            },
            {
                "id": "q5",
                "question": f"Give a real-life example of {topic_name}.",
                "type": "Short Answer",
                "answer": "Any valid real-life example",
                "difficulty": "Medium",
                "explanation": "This tests practical understanding."
            }
        ]
        
        return questions[:count]
    
    async def generate_study_schedule(
        self,
        user_id: str,
        subjects: List[str],
        daily_hours: float,
        exam_dates: List[Dict]
    ) -> Dict:
        """Generate a personalized study schedule"""
        
        schedule = {
            "user_id": user_id,
            "daily_slots": [
                {
                    "time": "6:00 AM - 7:30 AM",
                    "subject": subjects[0] if subjects else "Mathematics",
                    "activity": "Learn new concepts",
                    "type": "new_learning",
                    "duration_minutes": 90,
                    "tips": "Morning time is best for difficult topics"
                },
                {
                    "time": "5:00 PM - 6:30 PM",
                    "subject": subjects[1] if len(subjects) > 1 else "Science",
                    "activity": "Practice problems",
                    "type": "practice",
                    "duration_minutes": 90,
                    "tips": "Practice after school helps retention"
                },
                {
                    "time": "8:00 PM - 9:00 PM",
                    "subject": subjects[2] if len(subjects) > 2 else "English",
                    "activity": "Revision and notes",
                    "type": "revision",
                    "duration_minutes": 60,
                    "tips": "Light revision before sleep"
                }
            ],
            "weekly_goals": [
                "Complete 3 chapters",
                "Solve 50 practice problems",
                "Take 1 mock test",
                "Review all notes"
            ],
            "study_tips": [
                "Take a 5-minute break every 25 minutes (Pomodoro Technique)",
                "Drink water regularly to stay hydrated",
                "Review notes before sleeping for better retention",
                "Teach concepts to someone else to test understanding",
                "Use different colored pens for better visual memory"
            ],
            "exam_preparation": {
                "days_until_exam": 30 if exam_dates else 90,
                "revision_strategy": "Start revision 2 weeks before exam",
                "mock_test_frequency": "Weekly mock tests in last month"
            },
            "created_at": datetime.utcnow().isoformat(),
            "daily_hours": daily_hours
        }
        
        return schedule
    
    async def summarize_video(self, video_url: str) -> Dict:
        """Generate a summary of educational video"""
        
        # Mock video summary
        return {
            "video_url": video_url,
            "title": "Educational Video",
            "duration": "15:00",
            "summary": "This video covers important concepts related to the topic.",
            "key_points": [
                "Introduction to the concept",
                "Main principles explained",
                "Examples and applications",
                "Practice problems",
                "Summary and conclusion"
            ],
            "timestamps": [
                {"time": "0:00", "topic": "Introduction"},
                {"time": "3:00", "topic": "Main Concept"},
                {"time": "7:00", "topic": "Examples"},
                {"time": "11:00", "topic": "Practice"},
                {"time": "14:00", "topic": "Summary"}
            ],
            "transcript_available": False,
            "generated_at": datetime.utcnow().isoformat()
        }

# Create singleton instance
ai_service = AIService()