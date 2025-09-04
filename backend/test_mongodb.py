# backend/test_mongodb.py
"""
Test script to verify MongoDB Atlas connection
"""

import asyncio
import sys
from datetime import datetime
from pathlib import Path

# Add the backend directory to Python path
sys.path.append(str(Path(__file__).parent))

# Now import our modules
from app.db.mongodb import database_manager
from app.config import settings


async def test_connection():
    """Test MongoDB Atlas connection and basic operations"""
    print("=" * 50)
    print("Testing MongoDB Atlas Connection")
    print("=" * 50)
    
    try:
        # Test connection
        print(f"\n1. Connecting to MongoDB Atlas...")
        print(f"   Database: {settings.DATABASE_NAME}")
        
        await database_manager.connect()
        print("   ✅ Successfully connected to MongoDB Atlas!")
        
        # Test database access
        print(f"\n2. Testing database access...")
        is_connected = await database_manager.check_connection()
        if is_connected:
            print("   ✅ Database is accessible!")
        else:
            print("   ❌ Database is not accessible!")
            return
        
        # Test creating a document
        print(f"\n3. Testing document creation...")
        test_user = {
            "clerk_id": f"test_{datetime.now().timestamp()}",
            "email": f"test_{datetime.now().timestamp()}@example.com",
            "first_name": "Test",
            "last_name": "User",
            "created_at": datetime.utcnow(),
            "is_active": True
        }
        
        result = await database_manager.users_collection.insert_one(test_user)
        print(f"   ✅ Test document created with ID: {result.inserted_id}")
        
        # Test reading the document
        print(f"\n4. Testing document retrieval...")
        retrieved_user = await database_manager.users_collection.find_one(
            {"_id": result.inserted_id}
        )
        if retrieved_user is not None:
            print(f"   ✅ Document retrieved successfully!")
            print(f"   Email: {retrieved_user['email']}")
        else:
            print("   ❌ Failed to retrieve document!")
        
        # Test updating the document
        print(f"\n5. Testing document update...")
        update_result = await database_manager.users_collection.update_one(
            {"_id": result.inserted_id},
            {"$set": {"last_name": "Updated"}}
        )
        if update_result.modified_count > 0:
            print("   ✅ Document updated successfully!")
        else:
            print("   ❌ Failed to update document!")
        
        # Clean up - delete test document
        print(f"\n6. Cleaning up test data...")
        delete_result = await database_manager.users_collection.delete_one(
            {"_id": result.inserted_id}
        )
        if delete_result.deleted_count > 0:
            print("   ✅ Test document deleted!")
        else:
            print("   ❌ Failed to delete test document!")
        
        # List collections
        print(f"\n7. Available collections:")
        collections = await database_manager.database.list_collection_names()
        for collection in collections:
            print(f"   - {collection}")
        
        # Disconnect
        await database_manager.disconnect()
        print(f"\n✅ All tests completed successfully!")
        print("=" * 50)
        
    except Exception as e:
        print(f"\n❌ Test failed with error:")
        print(f"   Type: {type(e).__name__}")
        print(f"   Message: {str(e)}")
        print("\nPossible solutions:")
        print("1. Check your MongoDB Atlas connection string in .env")
        print("2. Verify your IP is whitelisted in MongoDB Atlas Network Access")
        print("3. Ensure your database user has proper permissions")
        print("4. Check if your cluster is active and running")
        print("=" * 50)
        
        # Try to disconnect if connected
        try:
            await database_manager.disconnect()
        except:
            pass


if __name__ == "__main__":
    print("\nStarting MongoDB Atlas connection test...")
    asyncio.run(test_connection())