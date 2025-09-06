# This file contains the complete curriculum structure for Indian boards

CURRICULUM_DATA = {
    "CBSE": {
        "11": {
            "Science": {
                "subjects": [
                    {
                        "code": "PHY",
                        "name": "Physics",
                        "icon": "⚛️",
                        "color": "#3B82F6",
                        "chapters": [
                            {
                                "number": 1,
                                "name": "Physical World",
                                "topics": [
                                    {
                                        "id": "PHY_11_1_1",
                                        "name": "What is Physics?",
                                        "description": "Introduction to physics and its scope",
                                        "difficulty": "Easy",
                                        "estimated_hours": 2
                                    },
                                    {
                                        "id": "PHY_11_1_2",
                                        "name": "Fundamental Forces in Nature",
                                        "description": "Four fundamental forces explained",
                                        "difficulty": "Medium",
                                        "estimated_hours": 3
                                    }
                                ]
                            },
                            {
                                "number": 2,
                                "name": "Units and Measurements",
                                "topics": [
                                    {
                                        "id": "PHY_11_2_1",
                                        "name": "SI Units",
                                        "description": "International System of Units",
                                        "difficulty": "Easy",
                                        "estimated_hours": 2
                                    },
                                    {
                                        "id": "PHY_11_2_2",
                                        "name": "Errors in Measurement",
                                        "description": "Types of errors and calculations",
                                        "difficulty": "Hard",
                                        "estimated_hours": 4
                                    }
                                ]
                            },
                            {
                                "number": 3,
                                "name": "Motion in a Straight Line",
                                "topics": [
                                    {
                                        "id": "PHY_11_3_1",
                                        "name": "Position and Displacement",
                                        "description": "Understanding position and displacement",
                                        "difficulty": "Easy",
                                        "estimated_hours": 2
                                    },
                                    {
                                        "id": "PHY_11_3_2",
                                        "name": "Velocity and Acceleration",
                                        "description": "Concepts of velocity and acceleration",
                                        "difficulty": "Medium",
                                        "estimated_hours": 3
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "code": "CHEM",
                        "name": "Chemistry",
                        "icon": "🧪",
                        "color": "#10B981",
                        "chapters": [
                            {
                                "number": 1,
                                "name": "Some Basic Concepts of Chemistry",
                                "topics": [
                                    {
                                        "id": "CHEM_11_1_1",
                                        "name": "Importance of Chemistry",
                                        "description": "Role of chemistry in daily life",
                                        "difficulty": "Easy",
                                        "estimated_hours": 1
                                    },
                                    {
                                        "id": "CHEM_11_1_2",
                                        "name": "Mole Concept",
                                        "description": "Understanding moles and calculations",
                                        "difficulty": "Hard",
                                        "estimated_hours": 5
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "code": "MATH",
                        "name": "Mathematics",
                        "icon": "📐",
                        "color": "#F59E0B",
                        "chapters": [
                            {
                                "number": 1,
                                "name": "Sets",
                                "topics": [
                                    {
                                        "id": "MATH_11_1_1",
                                        "name": "Introduction to Sets",
                                        "description": "Basic concepts of sets",
                                        "difficulty": "Easy",
                                        "estimated_hours": 2
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "code": "BIO",
                        "name": "Biology",
                        "icon": "🧬",
                        "color": "#84CC16",
                        "chapters": []
                    },
                    {
                        "code": "CS",
                        "name": "Computer Science",
                        "icon": "💻",
                        "color": "#EF4444",
                        "chapters": []
                    }
                ]
            },
            "Commerce": {
                "subjects": [
                    {
                        "code": "ACC",
                        "name": "Accountancy",
                        "icon": "📊",
                        "color": "#06B6D4",
                        "chapters": []
                    }
                ]
            }
        },
        "10": {
            "General": {
                "subjects": [
                    {
                        "code": "SCI",
                        "name": "Science",
                        "icon": "🔬",
                        "color": "#3B82F6",
                        "chapters": []
                    },
                    {
                        "code": "MATH",
                        "name": "Mathematics",
                        "icon": "📐",
                        "color": "#F59E0B",
                        "chapters": []
                    }
                ]
            }
        }
    }
}

def get_curriculum_for_user(board: str, class_level: str, stream: str = None) -> dict:
    """Get curriculum based on user's education details"""
    
    try:
        board_data = CURRICULUM_DATA.get(board, {})
        class_data = board_data.get(class_level, {})
        
        if stream:
            return class_data.get(stream, {})
        else:
            # For classes without streams (like 10th)
            return class_data.get("General", {})
    except:
        return {}