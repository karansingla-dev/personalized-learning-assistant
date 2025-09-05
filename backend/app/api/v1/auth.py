# backend/app/api/v1/auth.py
"""
Authentication API endpoints
Handles user registration and login sync with Clerk
"""

from fastapi import APIRouter, HTTPException, status, Request, Depends
from typing import Dict, Any, Optional
from app.db.crud.user import user_crud
from app.models.user import UserCreate, UserResponse
from pydantic import BaseModel, EmailStr
import logging
from datetime import datetime
import json
import random
import string

logger = logging.getLogger(__name__)
router = APIRouter()


class UserRegistrationRequest(BaseModel):
    """User registration request from frontend after Clerk signup"""
    clerk_id: str
    email: EmailStr
    first_name: Optional[str] = ""
    last_name: Optional[str] = ""
    username: Optional[str] = None


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


def generate_username(email: str) -> str:
    """Generate a unique username from email"""
    base_username = email.split('@')[0].lower()
    # Remove special characters
    base_username = ''.join(c for c in base_username if c.isalnum())
    
    # Add random suffix to ensure uniqueness
    random_suffix = ''.join(random.choices(string.digits, k=4))
    return f"{base_username}{random_suffix}"


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(registration_data: UserRegistrationRequest):
    """
    Register a new user after Clerk signup (including Google OAuth)
    This is called from frontend after successful Clerk registration
    """
    try:
        logger.info(f"Registering new user: {registration_data.email}")
        
        # Check if user already exists
        existing_user = await user_crud.get_user_by_clerk_id(registration_data.clerk_id)
        if existing_user:
            logger.info(f"User already exists, returning existing: {registration_data.email}")
            # Return 409 Conflict so frontend knows to try login instead
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User already exists"
            )
        
        # Generate username if not provided (Google OAuth case)
        username = registration_data.username
        if not username:
            username = generate_username(registration_data.email)
            logger.info(f"Generated username: {username}")
        
        # Ensure username is unique
        existing_username = await user_crud.get_user_by_username(username)
        if existing_username:
            # Add random suffix to make it unique
            username = f"{username}{random.randint(1000, 9999)}"
            logger.info(f"Username taken, using: {username}")
        
        # Create user data
        user_data = UserCreate(
            clerk_id=registration_data.clerk_id,
            email=registration_data.email,
            username=username,
            first_name=registration_data.first_name or "",
            last_name=registration_data.last_name or "",
            role="student"  # Default role
        )
        
        # Create user in database
        created_user = await user_crud.create_user(user_data)
        
        if not created_user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user"
            )
        
        logger.info(f"User created successfully: {registration_data.email} with username: {username}")
        
        return UserResponse(**created_user)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register user"
        )


@router.post("/login", status_code=status.HTTP_200_OK)
async def sync_user_login(login_data: UserLoginRequest):
    """
    Sync user login with backend
    Called after successful Clerk authentication
    """
    try:
        logger.info(f"Syncing login for clerk_id: {login_data.clerk_id}")
        
        # Get user from database
        user = await user_crud.get_user_by_clerk_id(login_data.clerk_id)
        
        if not user:
            logger.warning(f"User not found for clerk_id: {login_data.clerk_id}")
            return {
                "status": "not_found",
                "message": "User not found. Please complete registration.",
                "redirect_to": "/auth/sign-up"
            }
        
        # Check if user is active
        if not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is deactivated"
            )
        
        # Update last login time
        await user_crud.update_user_by_clerk_id(
            login_data.clerk_id,
            {"last_login": datetime.utcnow()}
        )
        
        # Determine redirect based on onboarding status
        onboarding_completed = user.get("onboarding_completed", False)
        redirect_to = "/dashboard" if onboarding_completed else "/onboarding"
        
        logger.info(f"User logged in: {user.get('email')}, redirecting to: {redirect_to}")
        
        # Return user data with onboarding status
        return {
            "status": "success",
            "user": UserResponse(**user),
            "onboarding_completed": onboarding_completed,
            "redirect_to": redirect_to
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during login sync: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to sync login"
        )


@router.post("/complete-onboarding", status_code=status.HTTP_200_OK)
async def complete_onboarding(onboarding_data: OnboardingRequest):
    """
    Complete user onboarding process
    Updates user profile with additional information
    """
    try:
        logger.info(f"Completing onboarding for clerk_id: {onboarding_data.clerk_id}")
        
        # Update user profile
        update_data = {
            "age": onboarding_data.age,
            "date_of_birth": onboarding_data.date_of_birth,
            "phone_number": onboarding_data.phone_number,
            "class_level": onboarding_data.class_level,
            "school": onboarding_data.school,
            "competitive_exam": onboarding_data.competitive_exam,
            "country": onboarding_data.country,
            "state": onboarding_data.state,
            "city": onboarding_data.city,
            "onboarding_completed": True,
            "updated_at": datetime.utcnow()
        }
        
        # Remove None values
        update_data = {k: v for k, v in update_data.items() if v is not None}
        
        updated_user = await user_crud.update_user_by_clerk_id(
            onboarding_data.clerk_id,
            update_data
        )
        
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        logger.info(f"Onboarding completed for user: {updated_user.get('email')}")
        
        return {
            "status": "success",
            "message": "Onboarding completed successfully",
            "user": UserResponse(**updated_user)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error completing onboarding: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to complete onboarding"
        )