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

logger = logging.getLogger(__name__)
router = APIRouter()


class UserRegistrationRequest(BaseModel):
    """User registration request from frontend after Clerk signup"""
    clerk_id: str
    email: EmailStr
    first_name: Optional[str] = ""
    last_name: Optional[str] = ""


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


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(registration_data: UserRegistrationRequest):
    """
    Register a new user after Clerk signup
    This is called from frontend after successful Clerk registration
    """
    try:
        logger.info(f"Registering new user: {registration_data.email}")
        
        # Check if user already exists
        existing_user = await user_crud.get_user_by_clerk_id(registration_data.clerk_id)
        if existing_user:
            logger.info(f"User already exists, returning existing: {registration_data.email}")
            return UserResponse(**existing_user)
        
        # Create user data
        user_data = UserCreate(
            clerk_id=registration_data.clerk_id,
            email=registration_data.email,
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
        
        logger.info(f"User registered successfully: {registration_data.email}")
        return UserResponse(**created_user)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error registering user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register user: {str(e)}"
        )


@router.post("/login", status_code=status.HTTP_200_OK)
async def login_user(login_data: UserLoginRequest):
    """
    Sync user login with backend
    Called after successful Clerk authentication
    """
    try:
        logger.info(f"User login sync for clerk_id: {login_data.clerk_id}")
        
        # Get user from database
        user = await user_crud.get_user_by_clerk_id(login_data.clerk_id)
        
        if not user:
            logger.warning(f"User not found for clerk_id: {login_data.clerk_id}")
            # Return a response indicating user needs to register
            return {
                "status": "user_not_found",
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


@router.get("/me", status_code=status.HTTP_200_OK)
async def get_current_user(clerk_id: str):
    """
    Get current user data by Clerk ID
    Used to fetch user data on app initialization
    """
    try:
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
            "user": UserResponse(**user),
            "onboarding_completed": user.get("onboarding_completed", False)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user data"
        )


@router.post("/onboarding/complete", status_code=status.HTTP_200_OK)
async def complete_onboarding(onboarding_data: OnboardingRequest):
    """
    Complete user onboarding with profile information
    """
    try:
        logger.info(f"Completing onboarding for clerk_id: {onboarding_data.clerk_id}")
        
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
        
        # Update user with onboarding data
        updated_user = await user_crud.complete_onboarding(
            onboarding_data.clerk_id,
            profile_data
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


@router.post("/webhook/clerk", status_code=status.HTTP_200_OK)
async def handle_clerk_webhook(request: Request):
    """
    Handle Clerk webhooks for user events
    This endpoint receives webhooks from Clerk when user events occur
    """
    try:
        # Get webhook data
        payload = await request.body()
        data = json.loads(payload)
        
        webhook_type = data.get("type")
        user_data = data.get("data", {})
        
        logger.info(f"Received Clerk webhook: {webhook_type}")
        
        if webhook_type == "user.created":
            # User created in Clerk, create in our database
            email_addresses = user_data.get("email_addresses", [])
            primary_email = None
            
            for email_obj in email_addresses:
                if email_obj.get("id") == user_data.get("primary_email_address_id"):
                    primary_email = email_obj.get("email_address")
                    break
            
            if not primary_email and email_addresses:
                primary_email = email_addresses[0].get("email_address")
            
            if primary_email:
                user_create = UserCreate(
                    clerk_id=user_data.get("id"),
                    email=primary_email,
                    first_name=user_data.get("first_name", ""),
                    last_name=user_data.get("last_name", ""),
                    role="student"
                )
                await user_crud.create_user(user_create)
                logger.info(f"User created via webhook: {primary_email}")
                
        elif webhook_type == "user.updated":
            # User updated in Clerk, update in our database
            clerk_id = user_data.get("id")
            if clerk_id:
                update_data = {}
                
                if "first_name" in user_data:
                    update_data["first_name"] = user_data.get("first_name", "")
                if "last_name" in user_data:
                    update_data["last_name"] = user_data.get("last_name", "")
                
                if update_data:
                    await user_crud.update_user_by_clerk_id(clerk_id, update_data)
                    logger.info(f"User updated via webhook: {clerk_id}")
                
        elif webhook_type == "user.deleted":
            # User deleted in Clerk, deactivate in our database
            clerk_id = user_data.get("id")
            if clerk_id:
                await user_crud.deactivate_user(clerk_id)
                logger.info(f"User deactivated via webhook: {clerk_id}")
        
        elif webhook_type == "session.created":
            # User signed in
            user_id = user_data.get("user_id")
            if user_id:
                await user_crud.update_user_by_clerk_id(
                    user_id,
                    {"last_login": datetime.utcnow()}
                )
                logger.info(f"User session created: {user_id}")
        
        return {"status": "success", "message": f"Webhook {webhook_type} processed"}
        
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in webhook: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook payload"
        )
    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        # Don't raise HTTP exception for webhooks, just log and return error
        return {"status": "error", "message": str(e)}


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout_user(clerk_id: str):
    """
    Handle user logout
    Update last active time and any cleanup
    """
    try:
        if not clerk_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Clerk ID is required"
            )
        
        # Update last active time
        await user_crud.update_user_by_clerk_id(
            clerk_id,
            {"stats.last_active": datetime.utcnow()}
        )
        
        logger.info(f"User logged out: {clerk_id}")
        
        return {
            "status": "success",
            "message": "Logged out successfully"
        }
        
    except Exception as e:
        logger.error(f"Error during logout: {str(e)}")
        # Don't fail logout even if backend update fails
        return {
            "status": "warning",
            "message": "Logout completed with warnings"
        }


@router.get("/check-onboarding/{clerk_id}", status_code=status.HTTP_200_OK)
async def check_onboarding_status(clerk_id: str):
    """
    Quick endpoint to check if user has completed onboarding
    """
    try:
        user = await user_crud.get_user_by_clerk_id(clerk_id)
        
        if not user:
            return {
                "exists": False,
                "onboarding_completed": False
            }
        
        return {
            "exists": True,
            "onboarding_completed": user.get("onboarding_completed", False),
            "email": user.get("email")
        }
        
    except Exception as e:
        logger.error(f"Error checking onboarding status: {str(e)}")
        return {
            "exists": False,
            "onboarding_completed": False,
            "error": str(e)
        }