# backend/app/api/v1/quiz.py
"""
Complete Quiz API Implementation
"""

from fastapi import APIRouter, HTTPException, Request, Query, Body
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from bson import ObjectId
import random
import json
import google.generativeai as genai
from app.config import settings

router = APIRouter(prefix="/api/v1/quiz", tags=["quiz"])

# Configure Gemini AI
GEMINI_API_KEY = settings.GEMINI_API_KEY
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-pro')
else:
    model = None

def get_db(request: Request):
    return request.app.state.db

@router.post("/generate")
async def generate_quiz(
    request: Request,
    data: Dict = Body(...)
):
    """
    Generate quiz for selected topics
    Request body:
    {
        "user_id": str,
        "subject_id": str,
        "subject_name": str,
        "topic_ids": List[str],
        "topic_names": List[str]
    }
    """
    db = get_db(request)
    
    user_id = data.get("user_id")
    subject_id = data.get("subject_id")
    subject_name = data.get("subject_name")
    topic_ids = data.get("topic_ids", [])
    topic_names = data.get("topic_names", [])
    
    if not topic_ids:
        raise HTTPException(status_code=400, detail="No topics selected")
    
    # Get user info for class level
    user = await db["users"].find_one({"clerk_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    class_level = user.get("onboarding", {}).get("class_level", 10)
    
    # Generate 15 questions per topic
    all_questions = []
    question_id_counter = 1
    
    for i, topic_id in enumerate(topic_ids):
        topic_name = topic_names[i] if i < len(topic_names) else f"Topic {i+1}"
        
        # Generate questions for this topic
        topic_questions = await generate_topic_questions(
            topic_name=topic_name,
            subject_name=subject_name,
            class_level=class_level,
            num_questions=15,
            start_id=question_id_counter
        )
        
        # Add topic info to each question
        for q in topic_questions:
            q["topic_id"] = topic_id
            q["topic_name"] = topic_name
        
        all_questions.extend(topic_questions)
        question_id_counter += 15
    
    # Calculate quiz metadata
    total_questions = len(all_questions)
    time_limit = min(len(topic_ids) * 20, 60)  # 20 min per topic, max 60
    passing_score = int(total_questions * 0.8)  # 80% to pass
    
    # Create quiz document
    quiz_data = {
        "user_id": user_id,
        "subject_id": subject_id,
        "subject_name": subject_name,
        "topic_ids": topic_ids,
        "topic_names": topic_names,
        "questions": all_questions,
        "total_questions": total_questions,
        "time_limit_minutes": time_limit,
        "passing_score": passing_score,
        "created_at": datetime.utcnow(),
        "status": "active",
        "expires_at": datetime.utcnow() + timedelta(hours=24)
    }
    
    # Save to database
    result = await db["quizzes"].insert_one(quiz_data)
    quiz_id = str(result.inserted_id)
    
    return {
        "quiz_id": quiz_id,
        "total_questions": total_questions,
        "time_limit_minutes": time_limit,
        "passing_score": passing_score,
        "questions": all_questions
    }

async def generate_topic_questions(
    topic_name: str,
    subject_name: str,
    class_level: int,
    num_questions: int = 15,
    start_id: int = 1
) -> List[Dict]:
    """Generate questions for a single topic using AI"""
    
    if model:
        try:
            prompt = f"""
            Generate {num_questions} quiz questions for Class {class_level} students.
            Subject: {subject_name}
            Topic: {topic_name}
            
            Create exactly {num_questions} Multiple Choice Questions (MCQ).
            
            For EACH question, provide in this EXACT JSON format:
            {{
                "question_text": "The question text here",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correct_answer": 0,  // Index of correct option (0-3)
                "explanation": "Detailed explanation of why this answer is correct",
                "difficulty": "Easy/Medium/Hard"
            }}
            
            Requirements:
            - Make questions appropriate for CBSE/Indian curriculum
            - Include a mix of conceptual and application-based questions
            - Difficulty distribution: 5 Easy, 7 Medium, 3 Hard
            - Explanations should be educational and help students learn
            - Questions should test understanding, not just memorization
            
            Return as a JSON array of {num_questions} questions.
            """
            
            response = model.generate_content(prompt)
            questions = parse_ai_response(response.text, num_questions)
            
            # Add IDs and metadata
            for i, q in enumerate(questions):
                q["question_id"] = f"q_{start_id + i}"
                q["question_number"] = start_id + i
                
            return questions
            
        except Exception as e:
            print(f"AI generation error: {e}")
            return generate_fallback_questions(topic_name, num_questions, start_id)
    else:
        return generate_fallback_questions(topic_name, num_questions, start_id)

def parse_ai_response(response_text: str, num_questions: int) -> List[Dict]:
    """Parse AI response to extract questions"""
    
    try:
        # Extract JSON from response
        if "```json" in response_text:
            json_str = response_text.split("```json")[1].split("```")[0]
        elif "[" in response_text:
            start = response_text.index("[")
            end = response_text.rindex("]") + 1
            json_str = response_text[start:end]
        else:
            json_str = response_text
        
        questions = json.loads(json_str)
        
        # Validate and fix structure
        valid_questions = []
        for q in questions[:num_questions]:
            if isinstance(q, dict) and "question_text" in q and "options" in q:
                # Ensure correct structure
                question = {
                    "question_text": q.get("question_text", ""),
                    "options": q.get("options", ["A", "B", "C", "D"]),
                    "correct_answer": q.get("correct_answer", 0),
                    "explanation": q.get("explanation", "The correct answer is based on the concept."),
                    "difficulty": q.get("difficulty", "Medium")
                }
                valid_questions.append(question)
        
        return valid_questions
        
    except Exception as e:
        print(f"Parse error: {e}")
        return []

def generate_fallback_questions(topic_name: str, num_questions: int, start_id: int) -> List[Dict]:
    """Generate fallback questions when AI is not available"""
    
    questions = []
    difficulties = ["Easy"] * 5 + ["Medium"] * 7 + ["Hard"] * 3
    random.shuffle(difficulties)
    
    for i in range(num_questions):
        questions.append({
            "question_id": f"q_{start_id + i}",
            "question_number": start_id + i,
            "question_text": f"Question {i+1} about {topic_name}: Which of the following best describes the concept?",
            "options": [
                f"Option A: First possible answer",
                f"Option B: Second possible answer",
                f"Option C: Third possible answer",
                f"Option D: Fourth possible answer"
            ],
            "correct_answer": random.randint(0, 3),
            "explanation": f"This question tests your understanding of {topic_name}. The correct answer demonstrates the key concept.",
            "difficulty": difficulties[i] if i < len(difficulties) else "Medium"
        })
    
    return questions

@router.post("/submit")
async def submit_quiz(
    request: Request,
    submission: Dict = Body(...)
):
    """
    Submit quiz and calculate results
    Request body:
    {
        "quiz_id": str,
        "user_id": str,
        "answers": {
            "q_1": 0,  // Selected option index
            "q_2": 2,
            ...
        },
        "time_taken_minutes": int
    }
    """
    db = get_db(request)
    
    quiz_id = submission.get("quiz_id")
    user_id = submission.get("user_id")
    answers = submission.get("answers", {})
    time_taken = submission.get("time_taken_minutes", 0)
    
    # Get quiz from database
    quiz = await db["quizzes"].find_one({"_id": ObjectId(quiz_id)})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Calculate score
    correct_count = 0
    total_questions = len(quiz["questions"])
    question_results = []
    topic_scores = {}  # Track score per topic
    
    for question in quiz["questions"]:
        q_id = question["question_id"]
        correct_answer = question["correct_answer"]
        user_answer = answers.get(q_id)
        
        is_correct = user_answer == correct_answer
        if is_correct:
            correct_count += 1
            
            # Track topic-wise score
            topic_id = question.get("topic_id")
            if topic_id:
                if topic_id not in topic_scores:
                    topic_scores[topic_id] = {"correct": 0, "total": 0}
                topic_scores[topic_id]["correct"] += 1
        
        # Track total questions per topic
        topic_id = question.get("topic_id")
        if topic_id:
            if topic_id not in topic_scores:
                topic_scores[topic_id] = {"correct": 0, "total": 0}
            topic_scores[topic_id]["total"] += 1
        
        question_results.append({
            "question_id": q_id,
            "question_text": question["question_text"],
            "options": question["options"],
            "user_answer": user_answer,
            "correct_answer": correct_answer,
            "is_correct": is_correct,
            "explanation": question["explanation"]
        })
    
    # Calculate overall score
    score_percentage = (correct_count / total_questions * 100) if total_questions > 0 else 0
    passed = score_percentage >= 80
    
    # Check which topics passed (80% or more)
    passed_topics = []
    for topic_id, scores in topic_scores.items():
        topic_percentage = (scores["correct"] / scores["total"] * 100) if scores["total"] > 0 else 0
        if topic_percentage >= 80:
            passed_topics.append(topic_id)
    
    # Create quiz attempt record
    attempt_data = {
        "quiz_id": quiz_id,
        "user_id": user_id,
        "subject_id": quiz["subject_id"],
        "topic_ids": quiz["topic_ids"],
        "score": score_percentage,
        "correct_count": correct_count,
        "total_questions": total_questions,
        "passed": passed,
        "passed_topics": passed_topics,
        "time_taken_minutes": time_taken,
        "submitted_at": datetime.utcnow(),
        "question_results": question_results
    }
    
    # Save attempt
    await db["quiz_attempts"].insert_one(attempt_data)
    
    # Update user progress for passed topics
    if passed_topics:
        for topic_id in passed_topics:
            await db["progress"].update_one(
                {"user_id": user_id, "topic_id": topic_id},
                {
                    "$set": {
                        "status": "completed",
                        "completed_at": datetime.utcnow(),
                        "quiz_score": topic_scores[topic_id]["correct"] / topic_scores[topic_id]["total"] * 100
                    },
                    "$inc": {
                        "quiz_attempts": 1
                    }
                },
                upsert=True
            )
    
    # Update user statistics
    await db["users"].update_one(
        {"clerk_id": user_id},
        {
            "$inc": {
                "stats.quizzes_taken": 1,
                "stats.topics_completed": len(passed_topics)
            },
            "$set": {
                "stats.last_quiz_score": score_percentage,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {
        "score": score_percentage,
        "correct_count": correct_count,
        "total_questions": total_questions,
        "passed": passed,
        "passed_topics": passed_topics,
        "time_taken_minutes": time_taken,
        "question_results": question_results,
        "message": "Congratulations! You passed the quiz!" if passed else "Keep practicing! You need 80% to pass."
    }

@router.get("/history")
async def get_quiz_history(
    request: Request,
    user_id: str = Query(...)
):
    """Get user's quiz history"""
    db = get_db(request)
    
    attempts = await db["quiz_attempts"].find(
        {"user_id": user_id}
    ).sort("submitted_at", -1).limit(20).to_list(20)
    
    # Convert ObjectId to string
    for attempt in attempts:
        attempt["_id"] = str(attempt["_id"])
    
    return attempts