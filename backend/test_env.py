# backend/test_env.py
"""
Quick test to verify environment variables are loading
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Try multiple methods to load .env
print("🔍 Testing Environment Variable Loading")
print("=" * 60)

# Method 1: Load from current directory
load_dotenv()
print("Method 1 - Load from current directory:")
print(f"  GEMINI_API_KEY: {os.getenv('GEMINI_API_KEY')[:20] + '...' if os.getenv('GEMINI_API_KEY') else 'NOT FOUND'}")
print(f"  YOUTUBE_API_KEY: {os.getenv('YOUTUBE_API_KEY')[:20] + '...' if os.getenv('YOUTUBE_API_KEY') else 'NOT FOUND'}")

# Method 2: Load with explicit path
env_path = Path('.') / '.env'
print(f"\nMethod 2 - Load from explicit path: {env_path.absolute()}")
load_dotenv(env_path, override=True)
print(f"  GEMINI_API_KEY: {os.getenv('GEMINI_API_KEY')[:20] + '...' if os.getenv('GEMINI_API_KEY') else 'NOT FOUND'}")
print(f"  YOUTUBE_API_KEY: {os.getenv('YOUTUBE_API_KEY')[:20] + '...' if os.getenv('YOUTUBE_API_KEY') else 'NOT FOUND'}")

# Method 3: Check if .env file exists
print(f"\n.env file exists: {env_path.exists()}")
if env_path.exists():
    print(f".env file location: {env_path.absolute()}")
    
    # Read and display (masked) content
    with open(env_path, 'r') as f:
        lines = f.readlines()
        print(f".env file has {len(lines)} lines")
        for line in lines:
            if 'API_KEY' in line:
                key = line.split('=')[0].strip()
                print(f"  Found: {key}")

# Test with settings
print("\n" + "=" * 60)
print("Testing with Settings class:")
try:
    from app.config import settings
    print(f"  GEMINI_API_KEY from settings: {'✅ Loaded' if settings.GEMINI_API_KEY else '❌ Not loaded'}")
    print(f"  YOUTUBE_API_KEY from settings: {'✅ Loaded' if settings.YOUTUBE_API_KEY else '❌ Not loaded'}")
except Exception as e:
    print(f"  Error loading settings: {e}")

print("\n" + "=" * 60)
print("✅ Test complete!")