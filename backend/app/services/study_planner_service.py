# backend/app/services/study_planner_service.py
"""
AI-powered study planner service
"""

from typing import List, Dict, Optional
from datetime import datetime, timedelta, time
import google.generativeai as genai
from bson import ObjectId

from app.config import settings
from app.models.models import (
    StudyPlan, 
    WeeklySchedule, 
    TimeSlot,
    ExamType,
    DifficultyLevel
)

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-pro')

class StudyPlannerService:
    """Service for generating personalized study plans"""
    
    def __init__(self, db):
        self.db = db
    
    async def generate_study_plan(
        self,
        user_id: str,
        target_exam: Optional[ExamType],
        exam_date: datetime,
        subjects: List[str],
        daily_hours: int,
        preparation_weeks: int
    ) -> Dict:
        """Generate AI-powered study plan"""
        
        # Get user details
        user = await self.db["users"].find_one({"clerk_id": user_id})
        if not user:
            raise ValueError("User not found")
        
        # Get topics for selected subjects
        topics = await self._get_topics_for_subjects(
            subjects, 
            user["onboarding"]["class_level"]
        )
        
        # Sort topics by importance and prerequisites
        sorted_topics = await self._sort_topics_by_priority(
            topics, 
            target_exam,
            preparation_weeks
        )
        
        # Generate weekly schedule
        weekly_schedule = await self._generate_weekly_schedule(
            sorted_topics,
            user["study_schedule"],
            daily_hours,
            preparation_weeks
        )
        
        # Generate revision schedule
        revision_schedule = self._generate_revision_schedule(
            sorted_topics,
            exam_date,
            preparation_weeks
        )
        
        # Create study plan
        study_plan = {
            "user_id": user_id,
            "name": f"{target_exam or 'General'} Preparation Plan",
            "target_exam": target_exam,
            "start_date": datetime.utcnow(),
            "end_date": exam_date,
            "daily_hours": daily_hours,
            "weekly_schedule": weekly_schedule,
            "topics_to_cover": [t["_id"] for t in sorted_topics],
            "revision_schedule": revision_schedule,
            "mock_test_dates": self._generate_mock_test_dates(exam_date, preparation_weeks),
            "created_at": datetime.utcnow(),
            "is_active": True
        }
        
        # Save to database
        result = await self.db["study_plans"].insert_one(study_plan)
        study_plan["_id"] = str(result.inserted_id)
        
        # Deactivate previous plans
        await self.db["study_plans"].update_many(
            {"user_id": user_id, "_id": {"$ne": result.inserted_id}},
            {"$set": {"is_active": False}}
        )
        
        return study_plan
    
    async def _get_topics_for_subjects(
        self,
        subject_ids: List[str],
        class_level: int
    ) -> List[Dict]:
        """Get all topics for selected subjects"""
        
        topics = []
        
        for subject_id in subject_ids:
            subject_topics = await self.db["topics"].find({
                "subject_id": subject_id,
                "class_level": {"$lte": class_level},
                "is_active": True
            }).to_list(1000)
            
            # Add subject name to each topic
            subject = await self.db["subjects"].find_one({"_id": ObjectId(subject_id)})
            for topic in subject_topics:
                topic["subject_name"] = subject["name"] if subject else ""
                topic["_id"] = str(topic["_id"])
            
            topics.extend(subject_topics)
        
        return topics
    
    async def _sort_topics_by_priority(
        self,
        topics: List[Dict],
        target_exam: Optional[ExamType],
        preparation_weeks: int
    ) -> List[Dict]:
        """Sort topics by importance, prerequisites, and exam relevance"""
        
        # Calculate priority score for each topic
        for topic in topics:
            score = 0
            
            # Base importance
            score += topic.get("importance", 5) * 10
            
            # Exam weightage
            if target_exam:
                exam_weightage = topic.get("exam_weightage", {})
                score += exam_weightage.get(target_exam, 0) * 5
            
            # Difficulty (easier topics first for confidence building)
            difficulty_scores = {
                DifficultyLevel.EASY: 30,
                DifficultyLevel.MEDIUM: 20,
                DifficultyLevel.HARD: 10
            }
            score += difficulty_scores.get(topic.get("difficulty", DifficultyLevel.MEDIUM), 20)
            
            # Time to master (prioritize quick wins early)
            estimated_hours = topic.get("estimated_hours", 5)
            if estimated_hours <= 3:
                score += 20
            elif estimated_hours <= 5:
                score += 10
            
            topic["priority_score"] = score
        
        # Sort by priority score (descending)
        sorted_topics = sorted(topics, key=lambda x: x["priority_score"], reverse=True)
        
        # Handle prerequisites
        final_order = []
        added_ids = set()
        
        for topic in sorted_topics:
            # Add prerequisites first
            for prereq_id in topic.get("prerequisites", []):
                if prereq_id not in added_ids:
                    prereq = next((t for t in topics if t["_id"] == prereq_id), None)
                    if prereq:
                        final_order.append(prereq)
                        added_ids.add(prereq_id)
            
            # Add the topic
            if topic["_id"] not in added_ids:
                final_order.append(topic)
                added_ids.add(topic["_id"])
        
        return final_order
    
    async def _generate_weekly_schedule(
        self,
        topics: List[Dict],
        user_schedule: Dict,
        daily_hours: int,
        preparation_weeks: int
    ) -> Dict:
        """Generate weekly study schedule"""
        
        # Parse school timings
        school_start = datetime.strptime(user_schedule["school_start"], "%H:%M").time()
        school_end = datetime.strptime(user_schedule["school_end"], "%H:%M").time()
        
        # Determine study slots based on preference
        study_slots = self._get_study_slots(
            school_end,
            daily_hours,
            user_schedule.get("preferred_study_time", "evening")
        )
        
        # Initialize weekly schedule
        week_days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        weekly_schedule = {day: [] for day in week_days}
        
        # Distribute topics across weeks
        topics_per_week = len(topics) // preparation_weeks if preparation_weeks > 0 else len(topics)
        
        current_topic_index = 0
        current_day_index = 0
        
        for week in range(min(4, preparation_weeks)):  # Plan for first 4 weeks
            for day in week_days:
                if current_topic_index >= len(topics):
                    break
                
                # Skip Sunday morning (revision time)
                if day == "sunday" and len(weekly_schedule[day]) == 0:
                    weekly_schedule[day].append({
                        "time_start": "10:00",
                        "time_end": "12:00",
                        "subject_name": "Revision",
                        "topic_name": "Weekly Revision",
                        "content_type": "revision",
                        "is_revision": True
                    })
                    continue
                
                # Add study slots for the day
                for slot in study_slots[:2]:  # Max 2 slots per day
                    if current_topic_index >= len(topics):
                        break
                    
                    topic = topics[current_topic_index]
                    
                    weekly_schedule[day].append({
                        "time_start": slot["start"],
                        "time_end": slot["end"],
                        "subject_id": topic.get("subject_id", ""),
                        "subject_name": topic.get("subject_name", ""),
                        "topic_id": topic["_id"],
                        "topic_name": topic["name"],
                        "content_type": "video" if current_topic_index % 2 == 0 else "article",
                        "is_revision": False
                    })
                    
                    current_topic_index += 1
        
        return weekly_schedule
    
    def _get_study_slots(
        self,
        school_end: time,
        daily_hours: int,
        preference: str
    ) -> List[Dict]:
        """Generate study time slots"""
        
        slots = []
        
        if preference == "morning":
            # Morning slots (before school)
            slots = [
                {"start": "05:00", "end": "06:00"},
                {"start": "06:00", "end": "07:00"}
            ]
        elif preference == "evening":
            # Evening slots (after school)
            start_hour = school_end.hour + 1  # 1 hour break after school
            
            for i in range(daily_hours):
                hour = start_hour + i
                if hour < 22:  # Don't study too late
                    slots.append({
                        "start": f"{hour:02d}:00",
                        "end": f"{hour+1:02d}:00"
                    })
        else:  # night
            # Night slots
            slots = [
                {"start": "20:00", "end": "21:00"},
                {"start": "21:00", "end": "22:00"},
                {"start": "22:00", "end": "23:00"}
            ]
        
        return slots[:daily_hours]
    
    def _generate_revision_schedule(
        self,
        topics: List[Dict],
        exam_date: datetime,
        preparation_weeks: int
    ) -> Dict[str, List[str]]:
        """Generate spaced repetition revision schedule"""
        
        revision_schedule = {}
        
        # Spaced repetition intervals (in days)
        intervals = [1, 3, 7, 14, 30]
        
        for i, topic in enumerate(topics):
            # Initial study date
            study_date = datetime.utcnow() + timedelta(days=i * 2)
            
            # Add revision dates
            for interval in intervals:
                revision_date = study_date + timedelta(days=interval)
                
                # Don't schedule after exam
                if revision_date < exam_date:
                    date_str = revision_date.strftime("%Y-%m-%d")
                    
                    if date_str not in revision_schedule:
                        revision_schedule[date_str] = []
                    
                    revision_schedule[date_str].append(topic["_id"])
        
        return revision_schedule
    
    def _generate_mock_test_dates(
        self,
        exam_date: datetime,
        preparation_weeks: int
    ) -> List[datetime]:
        """Generate mock test dates"""
        
        mock_dates = []
        
        # Weekly mock tests in last month
        if preparation_weeks >= 4:
            for week in range(4, 0, -1):
                mock_date = exam_date - timedelta(weeks=week)
                # Schedule on Sunday
                days_until_sunday = (6 - mock_date.weekday()) % 7
                mock_date = mock_date + timedelta(days=days_until_sunday)
                mock_dates.append(mock_date)
        
        return mock_dates
    
    async def get_active_plan(self, user_id: str) -> Optional[Dict]:
        """Get user's active study plan"""
        
        plan = await self.db["study_plans"].find_one({
            "user_id": user_id,
            "is_active": True
        })
        
        if plan:
            plan["_id"] = str(plan["_id"])
        
        return plan
    
    async def update_plan_progress(
        self,
        plan_id: str,
        completed_topic_id: str
    ):
        """Update study plan progress"""
        
        await self.db["study_plans"].update_one(
            {"_id": ObjectId(plan_id)},
            {
                "$addToSet": {"completed_topics": completed_topic_id},
                "$set": {"last_updated": datetime.utcnow()}
            }
        )
    
    async def get_today_schedule(self, user_id: str) -> List[Dict]:
        """Get today's study schedule"""
        
        plan = await self.get_active_plan(user_id)
        if not plan:
            return []
        
        # Get current day
        today = datetime.utcnow().strftime("%A").lower()
        
        # Get today's schedule
        today_schedule = plan["weekly_schedule"].get(today, [])
        
        # Add topic details
        for slot in today_schedule:
            if slot.get("topic_id"):
                topic = await self.db["topics"].find_one({"_id": ObjectId(slot["topic_id"])})
                if topic:
                    slot["topic_details"] = {
                        "description": topic.get("description", ""),
                        "difficulty": topic.get("difficulty", "medium"),
                        "importance": topic.get("importance", 5)
                    }
        
        return today_schedule