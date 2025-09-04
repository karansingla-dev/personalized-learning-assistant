# backend/app/db/mongodb.py
"""
MongoDB Atlas connection manager.
Handles database connections with MongoDB Atlas cloud database.
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from pymongo import ASCENDING, DESCENDING, IndexModel
import logging
from typing import Optional
from app.config import settings
import certifi

logger = logging.getLogger(__name__)


class DatabaseManager:
    """
    Manages MongoDB Atlas connections using Motor (async driver).
    Implements singleton pattern for connection management.
    """
    
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.database: Optional[AsyncIOMotorDatabase] = None
        
    async def connect(self) -> None:
        """
        Establish connection to MongoDB Atlas.
        Raises ConnectionFailure if unable to connect.
        """
        try:
            logger.info(f"Connecting to MongoDB Atlas...")
            
            # MongoDB Atlas connection with proper SSL/TLS
            connection_string = settings.MONGODB_URL
            
            # Add database name if not in connection string
            if settings.DATABASE_NAME not in connection_string:
                if connection_string.endswith('/'):
                    connection_string = f"{connection_string}{settings.DATABASE_NAME}"
                else:
                    connection_string = f"{connection_string}/{settings.DATABASE_NAME}"
            
            # Add retry writes parameter if not present
            if 'retryWrites' not in connection_string:
                separator = '&' if '?' in connection_string else '?'
                connection_string = f"{connection_string}{separator}retryWrites=true"
            
            # Create Motor client with Atlas-specific options
            self.client = AsyncIOMotorClient(
                connection_string,
                maxPoolSize=settings.MONGODB_MAX_POOL_SIZE,
                minPoolSize=settings.MONGODB_MIN_POOL_SIZE,
                serverSelectionTimeoutMS=settings.MONGODB_SERVER_SELECTION_TIMEOUT,
                tlsCAFile=certifi.where(),  # Required for MongoDB Atlas SSL
                retryWrites=settings.MONGODB_RETRY_WRITES,
                w='majority'  # Write concern for Atlas
            )
            
            # Get database instance
            self.database = self.client[settings.DATABASE_NAME]
            
            # Verify connection with ping
            await self.client.admin.command('ping')
            
            logger.info(f"Successfully connected to MongoDB Atlas database: {settings.DATABASE_NAME}")
            
            # Create indexes
            await self._create_indexes()
            
        except ServerSelectionTimeoutError as e:
            logger.error(f"MongoDB Atlas connection timeout. Please check:")
            logger.error("1. Your connection string is correct")
            logger.error("2. Your IP address is whitelisted in MongoDB Atlas")
            logger.error("3. Your cluster is running")
            logger.error(f"Error: {e}")
            raise ConnectionFailure(f"Could not connect to MongoDB Atlas: {e}")
        except ConnectionFailure as e:
            logger.error(f"Failed to connect to MongoDB Atlas: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error connecting to MongoDB Atlas: {e}")
            raise ConnectionFailure(f"MongoDB Atlas connection error: {e}")
    
    async def disconnect(self) -> None:
        """Close MongoDB Atlas connection."""
        if self.client is not None:
            self.client.close()
            logger.info("Disconnected from MongoDB Atlas")
    
    async def _create_indexes(self) -> None:
        """
        Create database indexes for better query performance.
        Optimized for MongoDB Atlas.
        """
        try:
            logger.info("Creating database indexes...")
            
            # Users collection indexes
            users_collection = self.database[settings.USERS_COLLECTION]
            user_indexes = [
                IndexModel([("clerk_id", ASCENDING)], unique=True, name="clerk_id_unique"),
                IndexModel([("email", ASCENDING)], unique=True, name="email_unique"),
                IndexModel([("created_at", DESCENDING)], name="created_at_desc"),
                IndexModel([("is_active", ASCENDING), ("role", ASCENDING)], name="active_role")
            ]
            await users_collection.create_indexes(user_indexes)
            
            # Topics collection indexes
            topics_collection = self.database[settings.TOPICS_COLLECTION]
            topic_indexes = [
                IndexModel([("user_id", ASCENDING)], name="user_id"),
                IndexModel([("syllabus_id", ASCENDING)], name="syllabus_id"),
                IndexModel([("importance", DESCENDING)], name="importance_desc"),
                IndexModel([("user_id", ASCENDING), ("is_completed", ASCENDING)], name="user_completed")
            ]
            await topics_collection.create_indexes(topic_indexes)
            
            # Quiz collection indexes
            quiz_collection = self.database[settings.QUIZ_COLLECTION]
            quiz_indexes = [
                IndexModel([("user_id", ASCENDING)], name="user_id"),
                IndexModel([("topic_id", ASCENDING)], name="topic_id"),
                IndexModel([("created_at", DESCENDING)], name="created_at_desc"),
                IndexModel([("user_id", ASCENDING), ("created_at", DESCENDING)], name="user_created")
            ]
            await quiz_collection.create_indexes(quiz_indexes)
            
            # Progress collection indexes
            progress_collection = self.database[settings.PROGRESS_COLLECTION]
            progress_indexes = [
                IndexModel(
                    [("user_id", ASCENDING), ("topic_id", ASCENDING)], 
                    unique=True, 
                    name="user_topic_unique"
                ),
                IndexModel([("updated_at", DESCENDING)], name="updated_at_desc")
            ]
            await progress_collection.create_indexes(progress_indexes)
            
            # Study plans collection indexes
            study_plans_collection = self.database[settings.STUDY_PLANS_COLLECTION]
            study_plan_indexes = [
                IndexModel([("user_id", ASCENDING)], name="user_id"),
                IndexModel([("created_at", DESCENDING)], name="created_at_desc"),
                IndexModel([("is_active", ASCENDING)], name="is_active")
            ]
            await study_plans_collection.create_indexes(study_plan_indexes)
            
            # Syllabus collection indexes
            syllabus_collection = self.database[settings.SYLLABUS_COLLECTION]
            syllabus_indexes = [
                IndexModel([("user_id", ASCENDING)], name="user_id"),
                IndexModel([("created_at", DESCENDING)], name="created_at_desc"),
                IndexModel([("status", ASCENDING)], name="status")
            ]
            await syllabus_collection.create_indexes(syllabus_indexes)
            
            logger.info("Database indexes created successfully")
            
        except Exception as e:
            logger.error(f"Error creating indexes: {e}")
            # Don't raise - indexes are optimization, not critical for operation
    
    async def check_connection(self) -> bool:
        """
        Check if the database connection is alive.
        Useful for health checks.
        """
        try:
            if self.client:
                await self.client.admin.command('ping')
                return True
            return False
        except Exception:
            return False
    
    def get_collection(self, collection_name: str):
        """
        Get a collection from the database.
        
        Args:
            collection_name: Name of the collection
            
        Returns:
            AsyncIOMotorCollection instance
        """
        if self.database is None:
            raise RuntimeError("Database not connected. Call connect() first.")
        return self.database[collection_name]
    
    @property
    def users_collection(self):
        """Get users collection."""
        return self.get_collection(settings.USERS_COLLECTION)
    
    @property
    def syllabus_collection(self):
        """Get syllabus collection."""
        return self.get_collection(settings.SYLLABUS_COLLECTION)
    
    @property
    def topics_collection(self):
        """Get topics collection."""
        return self.get_collection(settings.TOPICS_COLLECTION)
    
    @property
    def quiz_collection(self):
        """Get quiz collection."""
        return self.get_collection(settings.QUIZ_COLLECTION)
    
    @property
    def notes_collection(self):
        """Get notes collection."""
        return self.get_collection(settings.NOTES_COLLECTION)
    
    @property
    def progress_collection(self):
        """Get progress collection."""
        return self.get_collection(settings.PROGRESS_COLLECTION)
    
    @property
    def study_plans_collection(self):
        """Get study plans collection."""
        return self.get_collection(settings.STUDY_PLANS_COLLECTION)


# Create singleton instance
database_manager = DatabaseManager()

# Export for convenience
async def get_database() -> AsyncIOMotorDatabase:
    """
    Dependency to get database instance.
    Used in FastAPI dependency injection.
    """
    if not database_manager.database:
        await database_manager.connect()
    return database_manager.database

async def health_check() -> dict:
    """
    Database health check for API endpoints.
    """
    is_connected = await database_manager.check_connection()
    return {
        "database": "MongoDB Atlas",
        "connected": is_connected,
        "database_name": settings.DATABASE_NAME if is_connected else None
    }