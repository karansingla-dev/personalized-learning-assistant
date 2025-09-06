# backend/app/db/initialize_data.py
"""
Script to initialize subjects and topics in MongoDB
Run this ONCE to populate your database with educational content
"""

from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import asyncio
from typing import Dict, List

# MongoDB connection
MONGODB_URL = "mongodb://localhost:27017"  # Update with your MongoDB URL
DATABASE_NAME = "learning_assistant"

async def initialize_subjects_and_topics():
    """Initialize all subjects and topics for CBSE curriculum"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    print("🚀 Starting database initialization...")
    
    # Clear existing data (optional - comment out if you want to keep existing data)
    await db["subjects"].delete_many({})
    await db["topics"].delete_many({})
    print("✅ Cleared existing subjects and topics")
    
    # ========================================
    # CBSE CLASS 9-10 SUBJECTS
    # ========================================
    
    subjects_data = [
        {
            "name": "Mathematics",
            "code": "MATH",
            "class_levels": [9, 10],
            "board": "CBSE",
            "icon": "📐",
            "color": "#3B82F6",
            "description": "Build strong foundation in mathematical concepts",
            "order": 1
        },
        {
            "name": "Science",
            "code": "SCI",
            "class_levels": [9, 10],
            "board": "CBSE",
            "icon": "🔬",
            "color": "#10B981",
            "description": "Explore Physics, Chemistry, and Biology",
            "order": 2
        },
        {
            "name": "Social Science",
            "code": "SST",
            "class_levels": [9, 10],
            "board": "CBSE",
            "icon": "🌍",
            "color": "#F59E0B",
            "description": "History, Geography, Politics, and Economics",
            "order": 3
        },
        {
            "name": "English",
            "code": "ENG",
            "class_levels": [9, 10],
            "board": "CBSE",
            "icon": "📖",
            "color": "#8B5CF6",
            "description": "Language, Literature, and Grammar",
            "order": 4
        },
        {
            "name": "Hindi",
            "code": "HIN",
            "class_levels": [9, 10],
            "board": "CBSE",
            "icon": "📝",
            "color": "#EF4444",
            "description": "Hindi language and literature",
            "order": 5
        }
    ]
    
    # ========================================
    # CBSE CLASS 11-12 SCIENCE STREAM
    # ========================================
    
    subjects_11_12 = [
        {
            "name": "Physics",
            "code": "PHY",
            "class_levels": [11, 12],
            "board": "CBSE",
            "stream": "Science",
            "icon": "⚛️",
            "color": "#6366F1",
            "description": "Advanced physics for JEE and NEET",
            "order": 1
        },
        {
            "name": "Chemistry",
            "code": "CHEM",
            "class_levels": [11, 12],
            "board": "CBSE",
            "stream": "Science",
            "icon": "🧪",
            "color": "#14B8A6",
            "description": "Organic, Inorganic, and Physical Chemistry",
            "order": 2
        },
        {
            "name": "Mathematics",
            "code": "MATH",
            "class_levels": [11, 12],
            "board": "CBSE",
            "stream": "Science",
            "icon": "📐",
            "color": "#3B82F6",
            "description": "Advanced mathematics for JEE",
            "order": 3
        },
        {
            "name": "Biology",
            "code": "BIO",
            "class_levels": [11, 12],
            "board": "CBSE",
            "stream": "Science",
            "icon": "🧬",
            "color": "#22C55E",
            "description": "Botany and Zoology for NEET",
            "order": 4
        }
    ]
    
    # ========================================
    # TOPICS DATA
    # ========================================
    
    topics_data = {
        "Mathematics": {
            9: [
                {"name": "Number Systems", "chapter": 1, "importance": 8, "hours": 6},
                {"name": "Polynomials", "chapter": 2, "importance": 9, "hours": 8},
                {"name": "Coordinate Geometry", "chapter": 3, "importance": 8, "hours": 7},
                {"name": "Linear Equations in Two Variables", "chapter": 4, "importance": 10, "hours": 9},
                {"name": "Lines and Angles", "chapter": 5, "importance": 7, "hours": 5},
                {"name": "Triangles", "chapter": 6, "importance": 9, "hours": 8},
                {"name": "Quadrilaterals", "chapter": 7, "importance": 8, "hours": 6},
                {"name": "Circles", "chapter": 8, "importance": 8, "hours": 7},
                {"name": "Heron's Formula", "chapter": 9, "importance": 6, "hours": 4},
                {"name": "Surface Areas and Volumes", "chapter": 10, "importance": 9, "hours": 8},
                {"name": "Statistics", "chapter": 11, "importance": 8, "hours": 6},
                {"name": "Probability", "chapter": 12, "importance": 8, "hours": 6}
            ],
            10: [
                {"name": "Real Numbers", "chapter": 1, "importance": 8, "hours": 6},
                {"name": "Polynomials", "chapter": 2, "importance": 9, "hours": 7},
                {"name": "Pair of Linear Equations", "chapter": 3, "importance": 10, "hours": 9},
                {"name": "Quadratic Equations", "chapter": 4, "importance": 10, "hours": 10},
                {"name": "Arithmetic Progressions", "chapter": 5, "importance": 9, "hours": 8},
                {"name": "Triangles", "chapter": 6, "importance": 9, "hours": 8},
                {"name": "Coordinate Geometry", "chapter": 7, "importance": 9, "hours": 8},
                {"name": "Trigonometry", "chapter": 8, "importance": 10, "hours": 10},
                {"name": "Applications of Trigonometry", "chapter": 9, "importance": 8, "hours": 7},
                {"name": "Circles", "chapter": 10, "importance": 8, "hours": 7},
                {"name": "Surface Areas and Volumes", "chapter": 11, "importance": 9, "hours": 9},
                {"name": "Statistics", "chapter": 12, "importance": 8, "hours": 7},
                {"name": "Probability", "chapter": 13, "importance": 9, "hours": 8}
            ]
        },
        "Science": {
            9: [
                {"name": "Matter in Our Surroundings", "chapter": 1, "importance": 8, "hours": 6},
                {"name": "Is Matter Around Us Pure", "chapter": 2, "importance": 9, "hours": 7},
                {"name": "Atoms and Molecules", "chapter": 3, "importance": 10, "hours": 8},
                {"name": "Structure of Atom", "chapter": 4, "importance": 10, "hours": 8},
                {"name": "The Fundamental Unit of Life", "chapter": 5, "importance": 9, "hours": 7},
                {"name": "Tissues", "chapter": 6, "importance": 8, "hours": 6},
                {"name": "Motion", "chapter": 7, "importance": 10, "hours": 9},
                {"name": "Force and Laws of Motion", "chapter": 8, "importance": 10, "hours": 9},
                {"name": "Gravitation", "chapter": 9, "importance": 9, "hours": 8},
                {"name": "Work and Energy", "chapter": 10, "importance": 9, "hours": 8},
                {"name": "Sound", "chapter": 11, "importance": 8, "hours": 6},
                {"name": "Natural Resources", "chapter": 12, "importance": 7, "hours": 5}
            ],
            10: [
                {"name": "Chemical Reactions and Equations", "chapter": 1, "importance": 10, "hours": 8},
                {"name": "Acids, Bases and Salts", "chapter": 2, "importance": 9, "hours": 7},
                {"name": "Metals and Non-metals", "chapter": 3, "importance": 9, "hours": 8},
                {"name": "Carbon and its Compounds", "chapter": 4, "importance": 10, "hours": 9},
                {"name": "Life Processes", "chapter": 5, "importance": 10, "hours": 9},
                {"name": "Control and Coordination", "chapter": 6, "importance": 9, "hours": 8},
                {"name": "How do Organisms Reproduce", "chapter": 7, "importance": 8, "hours": 7},
                {"name": "Heredity and Evolution", "chapter": 8, "importance": 9, "hours": 8},
                {"name": "Light - Reflection and Refraction", "chapter": 9, "importance": 10, "hours": 9},
                {"name": "Human Eye and Colourful World", "chapter": 10, "importance": 9, "hours": 7},
                {"name": "Electricity", "chapter": 11, "importance": 10, "hours": 10},
                {"name": "Magnetic Effects of Electric Current", "chapter": 12, "importance": 9, "hours": 8},
                {"name": "Our Environment", "chapter": 13, "importance": 7, "hours": 5}
            ]
        },
        "Physics": {
            11: [
                {"name": "Physical World", "chapter": 1, "importance": 5, "hours": 3},
                {"name": "Units and Measurements", "chapter": 2, "importance": 8, "hours": 6},
                {"name": "Motion in a Straight Line", "chapter": 3, "importance": 9, "hours": 8},
                {"name": "Motion in a Plane", "chapter": 4, "importance": 10, "hours": 10},
                {"name": "Laws of Motion", "chapter": 5, "importance": 10, "hours": 10},
                {"name": "Work, Energy and Power", "chapter": 6, "importance": 9, "hours": 9},
                {"name": "System of Particles", "chapter": 7, "importance": 8, "hours": 7},
                {"name": "Rotational Motion", "chapter": 8, "importance": 10, "hours": 10},
                {"name": "Gravitation", "chapter": 9, "importance": 8, "hours": 7},
                {"name": "Mechanical Properties of Solids", "chapter": 10, "importance": 7, "hours": 5},
                {"name": "Mechanical Properties of Fluids", "chapter": 11, "importance": 8, "hours": 6},
                {"name": "Thermal Properties of Matter", "chapter": 12, "importance": 7, "hours": 5},
                {"name": "Thermodynamics", "chapter": 13, "importance": 9, "hours": 8},
                {"name": "Kinetic Theory", "chapter": 14, "importance": 7, "hours": 5},
                {"name": "Oscillations", "chapter": 15, "importance": 9, "hours": 8},
                {"name": "Waves", "chapter": 16, "importance": 9, "hours": 8}
            ],
            12: [
                {"name": "Electric Charges and Fields", "chapter": 1, "importance": 9, "hours": 8},
                {"name": "Electrostatic Potential", "chapter": 2, "importance": 9, "hours": 8},
                {"name": "Current Electricity", "chapter": 3, "importance": 10, "hours": 10},
                {"name": "Moving Charges and Magnetism", "chapter": 4, "importance": 10, "hours": 10},
                {"name": "Magnetism and Matter", "chapter": 5, "importance": 7, "hours": 5},
                {"name": "Electromagnetic Induction", "chapter": 6, "importance": 10, "hours": 9},
                {"name": "Alternating Current", "chapter": 7, "importance": 9, "hours": 8},
                {"name": "Electromagnetic Waves", "chapter": 8, "importance": 7, "hours": 5},
                {"name": "Ray Optics", "chapter": 9, "importance": 10, "hours": 10},
                {"name": "Wave Optics", "chapter": 10, "importance": 9, "hours": 8},
                {"name": "Dual Nature of Matter", "chapter": 11, "importance": 8, "hours": 7},
                {"name": "Atoms", "chapter": 12, "importance": 8, "hours": 6},
                {"name": "Nuclei", "chapter": 13, "importance": 8, "hours": 6},
                {"name": "Semiconductor Electronics", "chapter": 14, "importance": 9, "hours": 8}
            ]
        }
    }
    
    # ========================================
    # INSERT DATA INTO DATABASE
    # ========================================
    
    all_subjects = subjects_data + subjects_11_12
    
    for subject in all_subjects:
        # Calculate total topics for this subject
        subject_name = subject["name"]
        total_topics = 0
        
        if subject_name in topics_data:
            for class_level in subject["class_levels"]:
                if class_level in topics_data[subject_name]:
                    total_topics += len(topics_data[subject_name][class_level])
        
        subject["total_topics"] = total_topics
        subject["created_at"] = datetime.utcnow()
        
        # Insert subject
        result = await db["subjects"].insert_one(subject)
        subject_id = str(result.inserted_id)
        
        print(f"✅ Inserted subject: {subject['name']} (ID: {subject_id})")
        
        # Insert topics for this subject
        if subject_name in topics_data:
            for class_level in subject["class_levels"]:
                if class_level in topics_data[subject_name]:
                    for topic in topics_data[subject_name][class_level]:
                        topic_doc = {
                            "subject_id": subject_id,
                            "subject_name": subject_name,
                            "name": topic["name"],
                            "class_level": class_level,
                            "chapter_number": topic["chapter"],
                            "importance": topic["importance"],
                            "estimated_hours": topic["hours"],
                            "difficulty": "medium" if topic["importance"] <= 7 else "hard" if topic["importance"] >= 9 else "easy",
                            "description": f"Master {topic['name']} - a crucial topic in {subject_name} for Class {class_level}",
                            "prerequisites": [],
                            "tags": [subject_name.lower(), f"class{class_level}", "cbse"],
                            "order": topic["chapter"],
                            "created_at": datetime.utcnow()
                        }
                        
                        await db["topics"].insert_one(topic_doc)
                    
                    print(f"  ➡️ Added {len(topics_data[subject_name][class_level])} topics for Class {class_level}")
    
    # ========================================
    # CREATE INDEXES FOR PERFORMANCE
    # ========================================
    
    print("\n🔧 Creating indexes...")
    
    # Subject indexes
    await db["subjects"].create_index("code")
    await db["subjects"].create_index("class_levels")
    await db["subjects"].create_index([("board", 1), ("class_levels", 1)])
    
    # Topic indexes  
    await db["topics"].create_index("subject_id")
    await db["topics"].create_index("class_level")
    await db["topics"].create_index([("subject_id", 1), ("class_level", 1)])
    await db["topics"].create_index([("importance", -1)])
    
    print("✅ Indexes created")
    
    # ========================================
    # SUMMARY
    # ========================================
    
    total_subjects = await db["subjects"].count_documents({})
    total_topics = await db["topics"].count_documents({})
    
    print("\n" + "="*50)
    print("🎉 DATABASE INITIALIZATION COMPLETE!")
    print("="*50)
    print(f"📚 Total Subjects: {total_subjects}")
    print(f"📖 Total Topics: {total_topics}")
    print("="*50)
    
    client.close()

# Run the initialization
if __name__ == "__main__":
    asyncio.run(initialize_subjects_and_topics())