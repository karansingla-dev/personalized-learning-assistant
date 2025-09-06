# backend/app/services/quiz_service.py
"""
Quiz generation and management service
"""

import random
import json
from typing import List, Dict, Optional
from datetime import datetime
import google.generativeai as genai
from bson import ObjectId

from app.config import settings
from app.models.models import Quiz, Question, QuestionType, DifficultyLevel

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-pro')

class QuizService:
    """Service for quiz generation and management"""
    
    def __init__(self, db):
        self.db = db
    
    async def generate_quiz(
        self,
        topic_id: str,
        topic_name: str,
        subject_name: str,
        class_level: int,
        difficulty: DifficultyLevel = DifficultyLevel.MEDIUM,
        num_questions: int = 10
    ) -> Dict:
        """Generate AI-powered quiz for a topic"""
        
        # Check if quiz exists and is recent
        existing_quiz = await self._get_existing_quiz(topic_id, difficulty)
        if existing_quiz:
            return existing_quiz
        
        # Generate new quiz using AI
        questions = await self._generate_ai_questions(
            topic_name, subject_name, class_level, difficulty, num_questions
        )
        
        # Create quiz object
        quiz_data = {
            "topic_id": topic_id,
            "topic_name": topic_name,
            "difficulty": difficulty,
            "questions": questions,
            "total_points": len(questions),
            "passing_score": int(len(questions) * 0.8),  # 80% to pass
            "time_limit_minutes": 30,
            "created_at": datetime.utcnow(),
            "ai_generated": True,
            "version": 1
        }
        
        # Save to database
        result = await self.db["quizzes"].insert_one(quiz_data)
        quiz_data["_id"] = str(result.inserted_id)
        
        return quiz_data
    
    async def _get_existing_quiz(
        self,
        topic_id: str,
        difficulty: DifficultyLevel
    ) -> Optional[Dict]:
        """Get existing quiz if available"""
        
        # Get quiz created in last 7 days
        week_ago = datetime.utcnow() - timedelta(days=7)
        
        quiz = await self.db["quizzes"].find_one({
            "topic_id": topic_id,
            "difficulty": difficulty,
            "created_at": {"$gte": week_ago}
        })
        
        if quiz:
            quiz["_id"] = str(quiz["_id"])
            return quiz
        
        return None
    
    async def _generate_ai_questions(
        self,
        topic: str,
        subject: str,
        class_level: int,
        difficulty: DifficultyLevel,
        num_questions: int
    ) -> List[Dict]:
        """Generate quiz questions using AI"""
        
        try:
            # Adjust prompt based on difficulty
            difficulty_guide = {
                DifficultyLevel.EASY: "Basic understanding and recall questions",
                DifficultyLevel.MEDIUM: "Application and understanding questions",
                DifficultyLevel.HARD: "Analysis, critical thinking, and problem-solving"
            }
            
            prompt = f"""
            Create {num_questions} quiz questions for Class {class_level} students on the topic: {topic} in {subject}.
            
            Difficulty Level: {difficulty} - {difficulty_guide[difficulty]}
            
            Generate a mix of question types:
            - Multiple Choice Questions (MCQ) - 60%
            - True/False - 20%
            - Short Answer - 20%
            
            For each question provide:
            1. Question text
            2. Question type (mcq/true_false/short_answer)
            3. Options (for MCQ - provide 4 options)
            4. Correct answer
            5. Explanation of the answer
            
            Format as JSON array with structure:
            [{{
                "question_text": "...",
                "question_type": "mcq/true_false/short_answer",
                "options": ["A", "B", "C", "D"],
                "correct_answer": "A",
                "explanation": "..."
            }}]
            
            Make questions appropriate for Indian curriculum and exam patterns.
            """
            
            response = model.generate_content(prompt)
            response_text = response.text
            
            # Extract JSON from response
            questions = self._parse_quiz_response(response_text, num_questions)
            
            # Add metadata to each question
            for i, q in enumerate(questions):
                q["question_id"] = f"q_{i+1}"
                q["points"] = 1
                q["difficulty"] = difficulty
            
            return questions
            
        except Exception as e:
            print(f"AI quiz generation error: {e}")
            # Return default questions
            return self._generate_default_questions(topic, num_questions, difficulty)
    
    def _parse_quiz_response(self, text: str, num_questions: int) -> List[Dict]:
        """Parse AI response to extract questions"""
        
        questions = []
        
        try:
            # Try to extract JSON
            if "```json" in text:
                json_str = text.split("```json")[1].split("```")[0]
            elif "[" in text and "]" in text:
                # Find JSON array
                start = text.index("[")
                end = text.rindex("]") + 1
                json_str = text[start:end]
            else:
                json_str = text
            
            # Parse JSON
            parsed = json.loads(json_str.strip())
            
            if isinstance(parsed, list):
                questions = parsed[:num_questions]
            
        except (json.JSONDecodeError, ValueError) as e:
            print(f"JSON parsing error: {e}")
            # Fall back to text parsing
            questions = self._parse_text_questions(text, num_questions)
        
        return questions
    
    def _parse_text_questions(self, text: str, num_questions: int) -> List[Dict]:
        """Parse questions from plain text"""
        
        questions = []
        lines = text.split('\n')
        current_question = {}
        
        for line in lines:
            line = line.strip()
            if not line:
                if current_question.get("question_text"):
                    questions.append(current_question)
                    current_question = {}
                continue
            
            # Parse question components
            if line.startswith("Question:") or line.startswith("Q:"):
                current_question["question_text"] = line.split(":", 1)[1].strip()
            elif line.startswith("Type:"):
                current_question["question_type"] = line.split(":", 1)[1].strip().lower()
            elif line.startswith("Options:") or line.startswith("A)"):
                # Parse options
                if "options" not in current_question:
                    current_question["options"] = []
                if line.startswith("Options:"):
                    continue
                current_question["options"].append(line[2:].strip())
            elif line.startswith("Answer:"):
                current_question["correct_answer"] = line.split(":", 1)[1].strip()
            elif line.startswith("Explanation:"):
                current_question["explanation"] = line.split(":", 1)[1].strip()
        
        # Add last question
        if current_question.get("question_text"):
            questions.append(current_question)
        
        return questions[:num_questions]
    
    def _generate_default_questions(
        self,
        topic: str,
        num_questions: int,
        difficulty: DifficultyLevel
    ) -> List[Dict]:
        """Generate default questions as fallback"""
        
        questions = []
        
        # MCQ questions
        for i in range(min(6, num_questions)):
            questions.append({
                "question_id": f"q_{i+1}",
                "question_text": f"What is the key concept in {topic} (Question {i+1})?",
                "question_type": "mcq",
                "options": [
                    f"Option A for question {i+1}",
                    f"Option B for question {i+1}",
                    f"Option C for question {i+1}",
                    f"Option D for question {i+1}"
                ],
                "correct_answer": "A",
                "explanation": f"Option A is correct because it represents the main concept of {topic}.",
                "points": 1,
                "difficulty": difficulty
            })
        
        # True/False questions
        for i in range(min(2, num_questions - 6)):
            questions.append({
                "question_id": f"q_{i+7}",
                "question_text": f"True or False: {topic} is an important concept in the curriculum?",
                "question_type": "true_false",
                "options": ["True", "False"],
                "correct_answer": "True",
                "explanation": f"This statement is true because {topic} is fundamental.",
                "points": 1,
                "difficulty": difficulty
            })
        
        # Short answer questions
        for i in range(min(2, num_questions - 8)):
            questions.append({
                "question_id": f"q_{i+9}",
                "question_text": f"Briefly explain the concept of {topic}.",
                "question_type": "short_answer",
                "options": [],
                "correct_answer": f"A brief explanation of {topic}",
                "explanation": "The answer should cover the main points of the topic.",
                "points": 1,
                "difficulty": difficulty
            })
        
        return questions[:num_questions]
    
    async def submit_quiz(
        self,
        quiz_id: str,
        user_id: str,
        answers: Dict[str, str],
        time_taken_minutes: int
    ) -> Dict:
        """Submit and evaluate quiz answers"""
        
        # Get quiz
        quiz = await self.db["quizzes"].find_one({"_id": ObjectId(quiz_id)})
        if not quiz:
            raise ValueError("Quiz not found")
        
        # Calculate score
        correct_answers = 0
        total_questions = len(quiz["questions"])
        feedback = []
        
        for question in quiz["questions"]:
            q_id = question["question_id"]
            user_answer = answers.get(q_id, "")
            correct_answer = question["correct_answer"]
            
            is_correct = False
            
            if question["question_type"] == "mcq" or question["question_type"] == "true_false":
                is_correct = user_answer.upper() == correct_answer.upper()
            elif question["question_type"] == "short_answer":
                # For short answers, check if key words are present
                # In production, use more sophisticated NLP
                is_correct = len(user_answer) > 10  # Basic check
            
            if is_correct:
                correct_answers += 1
            
            feedback.append({
                "question_id": q_id,
                "user_answer": user_answer,
                "correct_answer": correct_answer,
                "is_correct": is_correct,
                "explanation": question.get("explanation", "")
            })
        
        # Calculate percentage score
        score_percentage = (correct_answers / total_questions) * 100
        passed = score_percentage >= 80
        
        # Save attempt to user progress
        attempt_data = {
            "quiz_id": quiz_id,
            "score": score_percentage,
            "passed": passed,
            "time_taken_minutes": time_taken_minutes,
            "attempted_at": datetime.utcnow()
        }
        
        # Update user progress
        await self.db["progress"].update_one(
            {"user_id": user_id, "topic_id": quiz["topic_id"]},
            {
                "$push": {"quiz_attempts": attempt_data},
                "$max": {"best_quiz_score": score_percentage}
            },
            upsert=True
        )
        
        # Update user stats
        await self.db["users"].update_one(
            {"clerk_id": user_id},
            {
                "$inc": {"stats.total_quizzes_taken": 1},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        # If passed, mark topic as completed
        if passed:
            await self.db["progress"].update_one(
                {"user_id": user_id, "topic_id": quiz["topic_id"]},
                {
                    "$set": {
                        "status": "completed",
                        "completed_at": datetime.utcnow()
                    }
                }
            )
            
            await self.db["users"].update_one(
                {"clerk_id": user_id},
                {"$inc": {"stats.topics_completed": 1}}
            )
        
        return {
            "quiz_id": quiz_id,
            "score": score_percentage,
            "correct_answers": correct_answers,
            "total_questions": total_questions,
            "passed": passed,
            "feedback": feedback,
            "time_taken_minutes": time_taken_minutes,
            "message": "Congratulations! You passed!" if passed else "Keep practicing! You need 80% to pass."
        }
    
    async def get_quiz_history(
        self,
        user_id: str,
        topic_id: Optional[str] = None
    ) -> List[Dict]:
        """Get user's quiz history"""
        
        query = {"user_id": user_id}
        if topic_id:
            query["topic_id"] = topic_id
        
        progress_records = await self.db["progress"].find(query).to_list(100)
        
        quiz_history = []
        for record in progress_records:
            for attempt in record.get("quiz_attempts", []):
                quiz_history.append({
                    "topic_id": record["topic_id"],
                    "quiz_id": attempt["quiz_id"],
                    "score": attempt["score"],
                    "passed": attempt["passed"],
                    "attempted_at": attempt["attempted_at"]
                })
        
        # Sort by date
        quiz_history.sort(key=lambda x: x["attempted_at"], reverse=True)
        
        return quiz_history

# Import for timedelta
from datetime import timedelta