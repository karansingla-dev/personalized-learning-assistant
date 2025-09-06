# backend/app/api/v1/users.py
"""
Fixed User management endpoints with complete onboarding
"""

from fastapi import APIRouter, HTTPException, Request, Depends
from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from bson import ObjectId
import re

router = APIRouter()

def get_db(request: Request):
    """Get database from request state"""
    return request.app.state.db

# Request model for onboarding
class OnboardingRequest(BaseModel):
    clerk_id: str
    email: str
    username: str
    first_name: str
    last_name: str
    phone_number: str
    city: str
    state: str
    country: str = "India"
    class_level: str
    board: str
    stream: Optional[str] = None
    target_exams: list = []

@router.post("/complete-onboarding")
async def complete_onboarding(request: Request, user_data: Dict[str, Any]):
    """
    Complete user onboarding with all required information
    """
    db = get_db(request)
    
    try:
        print(f"Received onboarding data: {user_data}")
        
        # Clean and validate phone number
        phone_number = user_data.get("phone_number", "").replace(" ", "").replace("-", "")
        if not phone_number.startswith("+91"):
            if phone_number.startswith("91") and len(phone_number) == 12:
                phone_number = "+" + phone_number
            elif len(phone_number) == 10:
                phone_number = "+91" + phone_number
            else:
                phone_number = "+91" + phone_number[-10:]
        
        # Validate required fields
        required_fields = ["clerk_id", "email", "first_name", "phone_number", "city", "state", "class_level", "board"]
        missing_fields = [field for field in required_fields if not user_data.get(field)]
        
        if missing_fields:
            print(f"Missing required fields: {missing_fields}")
            raise HTTPException(status_code=400, detail=f"Missing required fields: {', '.join(missing_fields)}")
        
        # Clean username
        username = user_data.get("username", "")
        if not username:
            # Generate username from first name and clerk_id
            username = f"{user_data.get('first_name', 'user').lower()}{user_data.get('clerk_id', '')[-4:]}"
        
        # Remove any special characters from username
        username = re.sub(r'[^a-zA-Z0-9_]', '', username).lower()
        
        # Check if user already exists
        existing_user = await db["users"].find_one({
            "clerk_id": user_data["clerk_id"]
        })
        
        # Prepare user document
        user_doc = {
            "clerk_id": user_data["clerk_id"],
            "email": user_data["email"].lower(),
            "username": username,
            "first_name": user_data.get("first_name", ""),
            "last_name": user_data.get("last_name", ""),
            "phone_number": phone_number,
            "city": user_data["city"].strip().title(),
            "state": user_data["state"].strip(),
            "country": user_data.get("country", "India"),
            "class_level": str(user_data["class_level"]),  # Ensure it's a string
            "board": user_data["board"].upper(),
            "stream": user_data.get("stream") if user_data.get("stream") else None,
            "target_exams": user_data.get("target_exams", []),
            "profile_picture": None,
            "bio": None,
            "preferred_language": "English",
            "onboarding_completed": True,
            "updated_at": datetime.utcnow()
        }
        
        if existing_user:
            print(f"Updating existing user: {existing_user['_id']}")
            # Update existing user
            await db["users"].update_one(
                {"clerk_id": user_data["clerk_id"]},
                {"$set": user_doc}
            )
            
            user_id = str(existing_user["_id"])
            message = "Profile updated successfully"
        else:
            print("Creating new user")
            # Create new user
            user_doc["created_at"] = datetime.utcnow()
            
            # Insert into database
            result = await db["users"].insert_one(user_doc)
            user_id = str(result.inserted_id)
            message = "Onboarding completed successfully"
            
            # Create initial progress tracking
            await db["progress"].insert_one({
                "user_id": user_id,
                "clerk_id": user_data["clerk_id"],
                "total_topics_completed": 0,
                "total_study_hours": 0,
                "streak_days": 0,
                "last_study_date": None,
                "subject_progress": {},
                "created_at": datetime.utcnow()
            })
            
            print(f"Created new user with ID: {user_id}")
        
        return {
            "success": True,
            "message": message,
            "user_id": user_id,
            "username": username
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in onboarding: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/profile/{clerk_id}")
async def get_user_profile(request: Request, clerk_id: str):
    """
    Get user profile by Clerk ID
    """
    db = get_db(request)
    
    try:
        user = await db["users"].find_one({"clerk_id": clerk_id})
        
        if not user:
            # Return a flag indicating user needs onboarding
            return {
                "exists": False,
                "needs_onboarding": True
            }
        
        # Convert ObjectId to string
        user["id"] = str(user.pop("_id"))
        user["exists"] = True
        user["needs_onboarding"] = not user.get("onboarding_completed", False)
        
        return user
        
    except Exception as e:
        print(f"Error getting profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/profile/{clerk_id}")
async def update_user_profile(
    request: Request,
    clerk_id: str,
    update_data: Dict[str, Any]
):
    """
    Update user profile
    """
    db = get_db(request)
    
    try:
        # Get existing user
        user = await db["users"].find_one({"clerk_id": clerk_id})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Prepare update data
        update_dict = {k: v for k, v in update_data.items() if v is not None}
        update_dict["updated_at"] = datetime.utcnow()
        
        # Update user
        await db["users"].update_one(
            {"clerk_id": clerk_id},
            {"$set": update_dict}
        )
        
        return {"success": True, "message": "Profile updated successfully"}
        
    except Exception as e:
        print(f"Error updating profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/check-username/{username}")
async def check_username_availability(request: Request, username: str):
    """
    Check if username is available
    """
    db = get_db(request)
    
    try:
        # Clean username
        cleaned_username = re.sub(r'[^a-zA-Z0-9_]', '', username).lower()
        
        existing = await db["users"].find_one({"username": cleaned_username})
        
        return {
            "available": existing is None,
            "username": cleaned_username,
            "original": username
        }
        
    except Exception as e:
        print(f"Error checking username: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/check-onboarding/{clerk_id}")
async def check_onboarding_status(request: Request, clerk_id: str):
    """
    Check if user has completed onboarding
    """
    db = get_db(request)
    
    try:
        user = await db["users"].find_one({"clerk_id": clerk_id})
        
        if not user:
            return {
                "completed": False,
                "exists": False
            }
        
        return {
            "completed": user.get("onboarding_completed", False),
            "exists": True,
            "username": user.get("username"),
            "class_level": user.get("class_level"),
            "board": user.get("board")
        }
        
    except Exception as e:
        print(f"Error checking onboarding: {e}")
        raise HTTPException(status_code=500, detail=str(e))