# backend/app/db/crud/user.py
"""
User CRUD operations for MongoDB
Handles all database operations for users
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
from bson import ObjectId
from pymongo.errors import DuplicateKeyError
from app.db.mongodb import database_manager
from app.models.user import UserCreate, UserUpdate, UserInDB
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class UserCRUD:
    """Handle all user-related database operations"""
    
    @staticmethod
    async def create_user(user_data: UserCreate) -> Dict[str, Any]:
        """
        Create a new user in the database
        Called after successful Clerk authentication
        """
        try:
            # Check if user already exists
            existing_user = await database_manager.users_collection.find_one(
                {"$or": [
                    {"clerk_id": user_data.clerk_id},
                    {"email": user_data.email}
                ]}
            )
            
            if existing_user:
                logger.warning(f"User already exists: {user_data.email}")
                # Update and return existing user instead of failing
                return await UserCRUD.update_user_by_clerk_id(
                    user_data.clerk_id,
                    {"last_login": datetime.utcnow()}
                )
            
            # Prepare user document
            user_dict = {
                "clerk_id": user_data.clerk_id,
                "email": user_data.email,
                "first_name": user_data.first_name if hasattr(user_data, 'first_name') else "",
                "last_name": user_data.last_name if hasattr(user_data, 'last_name') else "",
                "role": user_data.role if hasattr(user_data, 'role') else "student",
                "onboarding_completed": False,
                "profile": {
                    "age": None,
                    "date_of_birth": None,
                    "phone_number": None,
                    "class_level": None,
                    "school": None,
                    "competitive_exam": None,
                    "country": None,
                    "state": None,
                    "city": None
                },
                "preferences": {
                    "preferred_language": "English",
                    "learning_pace": "medium",
                    "daily_study_hours": 2,
                    "notification_enabled": True,
                    "email_notifications": True,
                    "study_reminder_time": None
                },
                "stats": {
                    "total_study_hours": 0,
                    "topics_completed": 0,
                    "quizzes_taken": 0,
                    "average_quiz_score": 0,
                    "current_streak": 0,
                    "longest_streak": 0,
                    "last_active": datetime.utcnow()
                },
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "last_login": datetime.utcnow(),
                "is_active": True
            }
            
            # Insert user
            result = await database_manager.users_collection.insert_one(user_dict)
            
            # Fetch and return created user
            created_user = await database_manager.users_collection.find_one(
                {"_id": result.inserted_id}
            )
            
            if created_user:
                created_user["id"] = str(created_user.pop("_id"))
                logger.info(f"User created successfully: {user_data.email}")
                return created_user
            
            raise Exception("Failed to retrieve created user")
            
        except DuplicateKeyError as e:
            logger.error(f"Duplicate key error: {e}")
            # If duplicate, try to fetch and return existing user
            existing = await UserCRUD.get_user_by_clerk_id(user_data.clerk_id)
            if existing:
                return existing
            raise
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            raise
    
    @staticmethod
    async def get_user_by_clerk_id(clerk_id: str) -> Optional[Dict[str, Any]]:
        """Get user by Clerk ID"""
        try:
            user = await database_manager.users_collection.find_one(
                {"clerk_id": clerk_id}
            )
            if user:
                user["id"] = str(user.pop("_id"))
                # Update last login
                await database_manager.users_collection.update_one(
                    {"clerk_id": clerk_id},
                    {"$set": {"last_login": datetime.utcnow()}}
                )
            return user
        except Exception as e:
            logger.error(f"Error fetching user by clerk_id: {e}")
            return None
    
    @staticmethod
    async def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by database ID"""
        try:
            if not ObjectId.is_valid(user_id):
                return None
            
            user = await database_manager.users_collection.find_one(
                {"_id": ObjectId(user_id)}
            )
            if user is not None:
                user["id"] = str(user.pop("_id"))
            return user
        except Exception as e:
            logger.error(f"Error fetching user by id: {e}")
            return None
    
    @staticmethod
    async def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        try:
            user = await database_manager.users_collection.find_one(
                {"email": email}
            )
            if user:
                user["id"] = str(user.pop("_id"))
            return user
        except Exception as e:
            logger.error(f"Error fetching user by email: {e}")
            return None
    
    @staticmethod
    async def update_user_by_clerk_id(clerk_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update user by Clerk ID"""
        try:
            # Add updated_at timestamp
            update_data["updated_at"] = datetime.utcnow()
            
            # Update user
            result = await database_manager.users_collection.update_one(
                {"clerk_id": clerk_id},
                {"$set": update_data}
            )
            
            if result.matched_count > 0:
                # Return updated user
                return await UserCRUD.get_user_by_clerk_id(clerk_id)
            return None
        except Exception as e:
            logger.error(f"Error updating user: {e}")
            return None
    
    @staticmethod
    async def complete_onboarding(clerk_id: str, onboarding_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Complete user onboarding with profile information
        """
        try:
            update_data = {
                "profile": onboarding_data,
                "onboarding_completed": True,
                "updated_at": datetime.utcnow()
            }
            
            # Update user profile
            result = await database_manager.users_collection.update_one(
                {"clerk_id": clerk_id},
                {"$set": update_data}
            )
            
            if result.matched_count > 0:
                logger.info(f"Onboarding completed for user: {clerk_id}")
                return await UserCRUD.get_user_by_clerk_id(clerk_id)
            return None
        except Exception as e:
            logger.error(f"Error completing onboarding: {e}")
            return None
    
    @staticmethod
    async def update_user_stats(clerk_id: str, stat_updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update user statistics"""
        try:
            # Build update query
            update_query = {
                "stats.last_active": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            # Add stat updates with proper path
            for key, value in stat_updates.items():
                update_query[f"stats.{key}"] = value
            
            # Update user stats
            result = await database_manager.users_collection.update_one(
                {"clerk_id": clerk_id},
                {"$set": update_query}
            )
            
            if result.matched_count > 0:
                return await UserCRUD.get_user_by_clerk_id(clerk_id)
            return None
        except Exception as e:
            logger.error(f"Error updating user stats: {e}")
            return None
    
    @staticmethod
    async def deactivate_user(clerk_id: str) -> bool:
        """Soft delete user (mark as inactive)"""
        try:
            result = await database_manager.users_collection.update_one(
                {"clerk_id": clerk_id},
                {
                    "$set": {
                        "is_active": False,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            return result.matched_count > 0
        except Exception as e:
            logger.error(f"Error deactivating user: {e}")
            return False
    
    @staticmethod
    async def get_all_users(skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all users with pagination"""
        try:
            cursor = database_manager.users_collection.find(
                {"is_active": True}
            ).skip(skip).limit(limit)
            
            users = []
            async for user in cursor:
                user["id"] = str(user.pop("_id"))
                users.append(user)
            
            return users
        except Exception as e:
            logger.error(f"Error fetching users: {e}")
            return []
        
    @staticmethod
    async def create_user_dict(user_dict: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create user from dictionary (for flexibility)."""
        try:
            # Insert user
            result = await database_manager.users_collection.insert_one(user_dict)
            
            # Return created user
            user = await database_manager.users_collection.find_one(
                {"_id": result.inserted_id}
            )
            if user:
                user["id"] = str(user.pop("_id"))
            return user
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            return None


# Export instance for easy access
user_crud = UserCRUD()