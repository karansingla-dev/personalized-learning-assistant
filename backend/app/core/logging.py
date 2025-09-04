# backend/app/core/logging.py
"""
Logging configuration for the application.
Sets up structured logging with proper formatting.
"""

import logging
import sys
from pathlib import Path
from app.config import settings


def setup_logging():
    """
    Configure logging for the application.
    Sets up both file and console handlers.
    """
    # Create logs directory if it doesn't exist
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # Configure logging format
    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"
    
    # Get root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, settings.LOG_LEVEL))
    
    # Remove existing handlers
    root_logger.handlers = []
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(
        logging.Formatter(log_format, datefmt=date_format)
    )
    root_logger.addHandler(console_handler)
    
    # File handler
    file_handler = logging.FileHandler(
        log_dir / settings.LOG_FILE,
        mode='a',
        encoding='utf-8'
    )
    file_handler.setFormatter(
        logging.Formatter(log_format, datefmt=date_format)
    )
    root_logger.addHandler(file_handler)
    
    # Set specific loggers
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("motor").setLevel(logging.WARNING)
    
    return root_logger