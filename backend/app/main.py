# backend/app/main.py
"""
Main FastAPI application entry point.
Configures the app, middleware, and routes.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import logging
from app.config import settings
from app.db.mongodb import database_manager
from app.api.v1 import auth, users, syllabus, topics, quiz, notes, study_plan, progress
from app.core.logging import setup_logging

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application lifecycle.
    Handles startup and shutdown events.
    """
    # Startup
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    
    try:
        # Connect to MongoDB
        await database_manager.connect()
        logger.info("Database connection established")
        
        # You can add more startup tasks here
        # e.g., cache warming, background tasks initialization
        
        yield
        
    finally:
        # Shutdown
        logger.info("Shutting down application")
        
        # Disconnect from MongoDB
        await database_manager.disconnect()
        logger.info("Database connection closed")
        
        # Clean up other resources if needed


# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.APP_VERSION,
    description="Personalized Learning Assistant API - Helping students understand topics better with AI",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)


# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)


# Add Trusted Host middleware for security
if not settings.DEBUG:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["*.yourdomain.com", "localhost"]
    )


# Health check endpoint
@app.get("/", tags=["Health"])
async def root():
    """Root endpoint - health check."""
    return {
        "status": "healthy",
        "name": settings.PROJECT_NAME,
        "version": settings.APP_VERSION,
        "message": "Welcome to Learning Assistant API"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """
    Detailed health check endpoint.
    Checks database connectivity and other services.
    """
    health_status = {
        "status": "healthy",
        "services": {}
    }
    
    # Check MongoDB connection
    try:
        if database_manager.client:
            await database_manager.client.server_info()
            health_status["services"]["mongodb"] = "connected"
        else:
            health_status["services"]["mongodb"] = "disconnected"
            health_status["status"] = "degraded"
    except Exception as e:
        health_status["services"]["mongodb"] = f"error: {str(e)}"
        health_status["status"] = "unhealthy"
    
    # You can add more service checks here (Redis, external APIs, etc.)
    
    return health_status


# Include API routers
# Note: We'll create these router files next
app.include_router(
    auth.router,
    prefix=f"{settings.API_V1_PREFIX}/auth",
    tags=["Authentication"]
)

app.include_router(
    users.router,
    prefix=f"{settings.API_V1_PREFIX}/users",
    tags=["Users"]
)

app.include_router(
    syllabus.router,
    prefix=f"{settings.API_V1_PREFIX}/syllabus",
    tags=["Syllabus"]
)

app.include_router(
    topics.router,
    prefix=f"{settings.API_V1_PREFIX}/topics",
    tags=["Topics"]
)

app.include_router(
    quiz.router,
    prefix=f"{settings.API_V1_PREFIX}/quiz",
    tags=["Quiz"]
)

app.include_router(
    notes.router,
    prefix=f"{settings.API_V1_PREFIX}/notes",
    tags=["Notes"]
)

app.include_router(
    study_plan.router,
    prefix=f"{settings.API_V1_PREFIX}/study-plan",
    tags=["Study Plan"]
)

app.include_router(
    progress.router,
    prefix=f"{settings.API_V1_PREFIX}/progress",
    tags=["Progress"]
)


# Custom exception handlers can be added here
@app.exception_handler(404)
async def custom_404_handler(request, exc):
    """Custom 404 error handler."""
    return {
        "error": "Not Found",
        "message": "The requested resource was not found",
        "path": str(request.url)
    }


@app.exception_handler(500)
async def custom_500_handler(request, exc):
    """Custom 500 error handler."""
    logger.error(f"Internal server error: {exc}")
    return {
        "error": "Internal Server Error",
        "message": "An unexpected error occurred. Please try again later."
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )