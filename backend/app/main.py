# backend/app/main.py
"""
Main FastAPI application setup with all configurations
"""

import warnings
import os
# Suppress SSL warnings if needed
warnings.filterwarnings('ignore', message='urllib3 v2 only supports OpenSSL')

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
from motor.motor_asyncio import AsyncIOMotorClient

from app.config import settings
from app.api.v1 import syllabus, users, topics, quiz, notes, progress, study_plan

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global database client
db_client = None
database = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events."""
    global db_client, database
    
    # Startup
    logger.info("Starting up application...")
    
    try:
        # Connect to MongoDB
        db_client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            maxPoolSize=settings.MONGODB_MAX_POOL_SIZE,
            minPoolSize=settings.MONGODB_MIN_POOL_SIZE,
            serverSelectionTimeoutMS=settings.MONGODB_SERVER_SELECTION_TIMEOUT
        )
        
        # Get database
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
    logger.info("Shutting down application...")
    if db_client:
        db_client.close()

async def create_indexes(db):
    """Create necessary database indexes."""
    # Users collection indexes
    await db[settings.USERS_COLLECTION].create_index("clerk_id", unique=True)
    await db[settings.USERS_COLLECTION].create_index("email", unique=True)
    
    # Syllabus collection indexes
    await db[settings.SYLLABUS_COLLECTION].create_index("user_id")
    await db[settings.SYLLABUS_COLLECTION].create_index([("created_at", -1)])
    
    # Topics collection indexes
    await db[settings.TOPICS_COLLECTION].create_index("syllabus_id")
    await db[settings.TOPICS_COLLECTION].create_index([("importance", -1)])
    
    logger.info("Database indexes created successfully")

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.APP_VERSION,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# Health check endpoint
@app.get("/health")
async def health_check():
    """Check if the API is running and database is connected."""
    try:
        # Check database connection
        await db_client.admin.command('ping')
        return {
            "status": "healthy",
            "database": "connected",
            "version": settings.APP_VERSION
        }
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "database": "disconnected",
                "error": str(e)
            }
        )

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Learning Assistant API",
        "version": settings.APP_VERSION,
        "docs": f"{settings.API_V1_PREFIX}/docs"
    }

# Include routers
app.include_router(
    syllabus.router,
    prefix=f"{settings.API_V1_PREFIX}/syllabus",
    tags=["syllabus"]
)

app.include_router(
    users.router,
    prefix=f"{settings.API_V1_PREFIX}/users",
    tags=["users"]
)

app.include_router(
    topics.router,
    prefix=f"{settings.API_V1_PREFIX}/topics",
    tags=["topics"]
)

app.include_router(
    quiz.router,
    prefix=f"{settings.API_V1_PREFIX}/quiz",
    tags=["quiz"]
)

app.include_router(
    notes.router,
    prefix=f"{settings.API_V1_PREFIX}/notes",
    tags=["notes"]
)

app.include_router(
    progress.router,
    prefix=f"{settings.API_V1_PREFIX}/progress",
    tags=["progress"]
)

app.include_router(
    study_plan.router,
    prefix=f"{settings.API_V1_PREFIX}/study-plan",
    tags=["study_plan"]
)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )