# backend/app/api/v1/auth.py
"""
Updated authentication endpoints with username support.
This is a minimal update to your existing auth.py file.
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import logging
from app.models.user import (
    UserCreate,
    OnboardingData,
    UserResponse,
    UserRole
)

logger = logging.getLogger(__name__)
router = APIRouter()


class UserRegistrationRequest(BaseModel):
    """User registration request from frontend"""
    clerk_id: str
    email: str
    first_name: Optional[str] = ""
    last_name: Optional[str] = ""
    username: Optional[str] = ""


class OnboardingRequest(BaseModel):
    """Onboarding completion request"""
    clerk_id: str
    age: Optional[int] = None
    date_of_birth: Optional[str] = None
    phone_number: Optional[str] = None
    class_level: Optional[str] = None
    school: Optional[str] = None
    competitive_exam: Optional[str] = None
    country: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(registration_data: UserRegistrationRequest):
    """Register a new user after Clerk signup"""
    try:
        from app.db.crud.user import user_crud
        
        logger.info(f"Registering user: {registration_data.email}")
        
        # Check if user already exists
        existing_user = await user_crud.get_user_by_clerk_id(registration_data.clerk_id)
        if existing_user:
            logger.info(f"User already exists: {registration_data.email}")
            return {
                "status": "success",
                "message": "User already exists",
                "user_id": str(existing_user.get("_id", "")),
                "onboarding_completed": existing_user.get("onboarding_completed", False)
            }
        
        # Create user data dictionary
        user_data = {
            "clerk_id": registration_data.clerk_id,
            "email": registration_data.email,
            "first_name": registration_data.first_name,
            "last_name": registration_data.last_name,
            "username": registration_data.username or registration_data.email.split("@")[0],
            "role": "student",
            "onboarding_completed": False,
            "profile": {},
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        }
        
        # Insert directly into MongoDB
        from app.db.mongodb import database_manager
        result = await database_manager.users_collection.insert_one(user_data)
        
        if not result.inserted_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user"
            )
        
        logger.info(f"User registered successfully: {registration_data.email}")
        
        return {
            "status": "success",
            "message": "User registered successfully",
            "user_id": str(result.inserted_id),
            "onboarding_completed": False
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error registering user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/onboarding", status_code=status.HTTP_200_OK)
async def complete_onboarding(onboarding_data: OnboardingRequest):
    """Complete user onboarding"""
    try:
        from app.db.crud.user import user_crud
        from app.db.mongodb import database_manager
        
        logger.info(f"Processing onboarding for clerk_id: {onboarding_data.clerk_id}")
        
        # Check if user exists
        user = await user_crud.get_user_by_clerk_id(onboarding_data.clerk_id)
        
        if not user:
            # Create a basic user if not exists
            logger.warning(f"User not found, creating basic user for clerk_id: {onboarding_data.clerk_id}")
            
            user_data = {
                "clerk_id": onboarding_data.clerk_id,
                "email": f"{onboarding_data.clerk_id}@placeholder.com",
                "first_name": "",
                "last_name": "",
                "username": onboarding_data.clerk_id,
                "role": "student",
                "onboarding_completed": False,
                "profile": {},
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "is_active": True
            }
            
            result = await database_manager.users_collection.insert_one(user_data)
            if not result.inserted_id:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create user"
                )
        
        # Prepare profile data
        profile_data = {
            "age": onboarding_data.age,
            "date_of_birth": onboarding_data.date_of_birth,
            "phone_number": onboarding_data.phone_number,
            "class_level": onboarding_data.class_level,
            "school": onboarding_data.school,
            "competitive_exam": onboarding_data.competitive_exam,
            "country": onboarding_data.country,
            "state": onboarding_data.state,
            "city": onboarding_data.city
        }
        
        # Remove None values
        profile_data = {k: v for k, v in profile_data.items() if v is not None}
        
        # Update user profile
        update_result = await database_manager.users_collection.update_one(
            {"clerk_id": onboarding_data.clerk_id},
            {
                "$set": {
                    "profile": profile_data,
                    "onboarding_completed": True,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if update_result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update user profile"
            )
        
        logger.info(f"Onboarding completed for clerk_id: {onboarding_data.clerk_id}")
        
        return {
            "status": "success",
            "message": "Onboarding completed successfully",
            "onboarding_completed": True,
            "redirect_to": "/dashboard"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during onboarding: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to complete onboarding: {str(e)}"
        )


@router.post("/login", status_code=status.HTTP_200_OK)
async def login_user(login_data: dict):
    """Sync user login with backend"""
    try:
        from app.db.crud.user import user_crud
        
        clerk_id = login_data.get("clerk_id")
        
        if not clerk_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="clerk_id is required"
            )
        
        # Get user from database
        user = await user_crud.get_user_by_clerk_id(clerk_id)
        
        if not user:
            return {
                "status": "user_not_found",
                "message": "User not found. Please complete registration.",
                "redirect_to": "/auth/sign-up"
            }
        
        # Update last login
        await user_crud.update_user_by_clerk_id(
            clerk_id,
            {"last_login": datetime.utcnow()}
        )
        
        return {
            "status": "success",
            "onboarding_completed": user.get("onboarding_completed", False),
            "redirect_to": "/dashboard" if user.get("onboarding_completed", False) else "/onboarding"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )


@router.get("/me", status_code=status.HTTP_200_OK)
async def get_current_user(clerk_id: str):
    """Get current user data by Clerk ID"""
    try:
        from app.db.crud.user import user_crud
        
        if not clerk_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Clerk ID is required"
            )
        
        user = await user_crud.get_user_by_clerk_id(clerk_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return {
            "status": "success",
            "user": user
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user"
        )