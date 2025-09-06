# backend/app/main.py
# ADD these lines to your existing main.py file

# At the top, add to your imports:
from app.api.v1 import dashboard

"""
Main FastAPI application with all routes including the new dashboard
"""

from fastapi import FastAPI, HTTPException, Request, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import List, Optional
from datetime import datetime
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

from app.models.models import *
from app.config import settings
from app.api.v1 import curriculum, auth, users, syllabus, dashboard, topics, topic_content

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global database client
db_client = None
database = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown"""
    global db_client, database
    
    # Startup
    logger.info("Starting up...")
    
    try:
        # Connect to MongoDB
        db_client = AsyncIOMotorClient(settings.MONGODB_URL)
        database = db_client[settings.DATABASE_NAME]
        
        # Store in app state
        app.state.db = database
        app.state.db_client = db_client
        
        # Test connection
        await db_client.admin.command('ping')
        logger.info(f"Connected to MongoDB: {settings.DATABASE_NAME}")
        
        # Create indexes
        await create_indexes(database)
        
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    if db_client:
        db_client.close()

async def create_indexes(db):
    """Create database indexes"""
    # User indexes
    await db["users"].create_index("clerk_id", unique=True)
    await db["users"].create_index("email", unique=True)
    
    # Subject indexes
    await db["subjects"].create_index("code", unique=True)
    await db["subjects"].create_index("class_levels")
    
    # Topic indexes
    await db["topics"].create_index("subject_id")
    await db["topics"].create_index("class_level")
    await db["topics"].create_index([("importance", -1)])
    
    # Progress indexes
    await db["progress"].create_index([("user_id", 1), ("topic_id", 1)], unique=True)
    await db["progress"].create_index("user_id")
    
    logger.info("Database indexes created")

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get database
def get_db(request: Request):
    return request.app.state.db

# Include routers
app.include_router(curriculum.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(syllabus.router)
app.include_router(dashboard.router)
app.include_router(topics.router)
app.include_router(topic_content.router)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION
    }

# Database connection check
@app.get("/db-check")
async def database_check(request: Request):
    try:
        db = get_db(request)
        # Try to fetch one document
        await db["users"].find_one()
        return {"database": "connected", "status": "healthy"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Learning Assistant API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)