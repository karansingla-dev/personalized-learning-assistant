# backend/app/api/v1/auth.py
"""
Authentication API endpoints
Handles user registration and login sync with Clerk
"""

from fastapi import APIRouter, HTTPException, status
from typing import Optional
from pydantic import BaseModel, EmailStr
import logging
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()


class UserRegistrationRequest(BaseModel):
    """User registration request from frontend after Clerk signup"""
    clerk_id: str
    email: EmailStr
    first_name: str
    last_name: str
    username: str


class UserLoginRequest(BaseModel):
    """User login request to sync with backend"""
    clerk_id: str


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


@router.post("/register")
async def register_user(registration_data: UserRegistrationRequest):
    """
    Register a new user after Clerk signup
    This is called from frontend after successful Clerk registration
    """
    try:
        logger.info(f"Registering new user: {registration_data.email}")
        
        # For now, just return success
        # You'll add database logic here later
        return {
            "id": "temp_id",
            "clerk_id": registration_data.clerk_id,
            "email": registration_data.email,
            "first_name": registration_data.first_name,
            "last_name": registration_data.last_name,
            "username": registration_data.username,
            "onboarding_completed": False,
            "created_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error registering user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register user"
        )


@router.post("/login")
async def login_user(login_data: UserLoginRequest):
    """
    Sync user login with backend
    Returns user data and onboarding status
    """
    try:
        logger.info(f"User login sync: {login_data.clerk_id}")
        
        # For now, just return mock data
        # You'll add database logic here later
        return {
            "user": {
                "id": "temp_id",
                "clerk_id": login_data.clerk_id,
                "onboarding_completed": False
            },
            "onboarding_completed": False,
            "redirect_to": "/onboarding"
        }
        
    except Exception as e:
        logger.error(f"Error during login sync: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to sync login"
        )


@router.post("/onboarding/complete")
async def complete_onboarding(onboarding_data: OnboardingRequest):
    """
    Complete user onboarding by adding additional information
    """
    try:
        logger.info(f"Completing onboarding for user: {onboarding_data.clerk_id}")
        
        # For now, just return success
        # You'll add database logic here later
        return {
            "success": True,
            "message": "Onboarding completed successfully"
        }
        
    except Exception as e:
        logger.error(f"Error completing onboarding: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to complete onboarding"
        )


@router.get("/me")
async def get_current_user(clerk_id: str):
    """
    Get current user data from backend
    """
    try:
        # For now, return mock data
        # You'll add database logic here later
        return {
            "user": {
                "id": "temp_id",
                "clerk_id": clerk_id,
                "onboarding_completed": False
            },
            "onboarding_completed": False,
            "redirect_to": "/onboarding"
        }
        
    except Exception as e:
        logger.error(f"Error fetching user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user data"
        )