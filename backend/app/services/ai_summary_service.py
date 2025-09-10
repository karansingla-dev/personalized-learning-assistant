# backend/app/services/ai_summary_service.py
"""
Enhanced AI Summary Service with proper math formula generation
"""

import os
from typing import Dict, Optional
import google.generativeai as genai
from datetime import datetime
from dotenv import load_dotenv

class AISummaryService:
    def __init__(self):
        load_dotenv()
        self.api_key = os.getenv('GEMINI_API_KEY')
        self.model = None
        
        if self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                try:
                    self.model = genai.GenerativeModel('gemini-1.5-flash')
                except:
                    try:
                        self.model = genai.GenerativeModel('gemini-pro')
                    except:
                        self.model = genai.GenerativeModel('gemini-1.0-pro')
                print("✅ Gemini AI configured successfully")
            except Exception as e:
                print(f"❌ Failed to configure Gemini: {e}")
                self.model = None
        else:
            print("⚠️ GEMINI_API_KEY not found in environment variables")
    
    async def generate_topic_summary(
        self,
        topic_name: str,
        subject_name: str,
        class_level: int,
        chapter_name: Optional[str] = None
    ) -> Dict:
        """
        Generate comprehensive AI summary with properly formatted math
        """
        
        if not self.model:
            return self._get_fallback_summary(topic_name, subject_name, class_level)
        
        try:
            # Create enhanced prompt for math content
            prompt = self._create_math_enhanced_prompt(topic_name, subject_name, class_level, chapter_name)
            
            # Generate content
            response = self.model.generate_content(prompt)
            
            # Parse and structure the response
            summary_data = self._parse_gemini_response(response.text, topic_name, subject_name, class_level)
            
            return summary_data
            
        except Exception as e:
            print(f"Error generating AI summary: {e}")
            return self._get_fallback_summary(topic_name, subject_name, class_level)
    
    def _create_math_enhanced_prompt(
        self,
        topic_name: str,
        subject_name: str,
        class_level: int,
        chapter_name: Optional[str] = None
    ) -> str:
        """
        Create a prompt that generates LaTeX-formatted math content
        """
        
        # Adjust complexity based on class level
        if class_level <= 8:
            complexity = "simple and easy to understand with basic examples"
            math_level = "basic arithmetic and simple algebra"
        elif class_level <= 10:
            complexity = "clear and detailed with practical applications"
            math_level = "algebra, geometry, and basic trigonometry"
        else:
            complexity = "comprehensive and in-depth with advanced concepts"
            math_level = "advanced algebra, calculus, and complex problem-solving"
        
        chapter_context = f"from chapter '{chapter_name}'" if chapter_name else ""
        
        # Special instructions for math subjects
        math_instructions = ""
        if subject_name.lower() in ['mathematics', 'maths', 'math', 'physics', 'chemistry']:
            math_instructions = """
IMPORTANT: For all mathematical formulas and equations:
- Write formulas using standard mathematical notation
- Use proper mathematical symbols (=, +, -, ×, ÷, ^, √, ∫, ∑, etc.)
- For fractions, write as a/b or (numerator)/(denominator)
- For powers, write as x^2, x^n, etc.
- For square roots, write as √x or sqrt(x)
- For complex formulas, break them down step by step
"""
        
        prompt = f"""
You are an expert {subject_name} teacher creating study material for Class {class_level} students.
Create a comprehensive study guide for the topic: "{topic_name}" {chapter_context}.

Make the content {complexity} with {math_level}.

{math_instructions}

Please provide the following sections:

1. TOPIC OVERVIEW
Write a clear, engaging introduction explaining what {topic_name} is and why it's important.
Include real-world applications and connections to daily life.

2. KEY CONCEPTS
List and explain 5-7 main concepts that students must understand.
For each concept:
- Give a clear definition
- Provide a simple example
- Explain its importance

3. IMPORTANT FORMULAS
List all important formulas related to {topic_name}.
For each formula:
- Write the formula clearly using mathematical notation
- Explain what each variable means
- Give the context when to use it
- Show units if applicable

Examples of formula format:
- Area of circle: A = πr^2, where r is radius
- Quadratic equation: ax^2 + bx + c = 0, where a ≠ 0
- Newton's Second Law: F = ma, where F is force (N), m is mass (kg), a is acceleration (m/s^2)

4. STEP-BY-STEP SOLVED EXAMPLES
Provide 3 detailed solved examples of increasing difficulty.

For each example, use this format:
Problem: [State the problem clearly]
Given: [List what is given]
To find: [What needs to be found]
Formula: [Which formula to use]
Solution:
Step 1: [First step with calculation]
Step 2: [Second step with calculation]
...
Answer: [Final answer with units]

Show all mathematical steps clearly.

5. IMPORTANT QUESTIONS FOR EXAMS
List 10 most important questions that frequently appear in exams.
Include a mix of:
- Definition-based questions (2)
- Formula application questions (3)
- Numerical problems (3)
- Conceptual/reasoning questions (2)

For numerical problems, include the mathematical expression.

6. COMMON MISTAKES TO AVOID
List 5 common mistakes students make, especially in calculations.

7. QUICK TIPS AND TRICKS
Provide 5 memory techniques, shortcuts, or tricks for solving problems quickly.

8. REVISION NOTES
Create bullet-point summary for last-minute revision (10-12 points).
Include key formulas and important points.

Format the response clearly with proper headings and mathematical notation.
"""
        
        return prompt
    
    def _parse_gemini_response(
        self,
        response_text: str,
        topic_name: str,
        subject_name: str,
        class_level: int
    ) -> Dict:
        """
        Parse and structure Gemini response with enhanced math formatting
        """
        
        # Default structure
        summary_data = {
            "topic_name": topic_name,
            "subject": subject_name,
            "class_level": class_level,
            "generated_at": datetime.utcnow().isoformat(),
            "overview": "",
            "key_concepts": [],
            "formulas": [],
            "solved_examples": [],
            "important_questions": [],
            "common_mistakes": [],
            "tips_and_tricks": [],
            "revision_notes": [],
            "full_content": response_text
        }
        
        # Parse the response text into sections
        lines = response_text.split('\n')
        current_section = None
        current_content = []
        
        section_mappings = {
            "TOPIC OVERVIEW": "overview",
            "KEY CONCEPTS": "key_concepts",
            "IMPORTANT FORMULAS": "formulas",
            "STEP-BY-STEP": "solved_examples",
            "SOLVED EXAMPLES": "solved_examples",
            "IMPORTANT QUESTIONS": "important_questions",
            "COMMON MISTAKES": "common_mistakes",
            "TIPS AND TRICKS": "tips_and_tricks",
            "QUICK TIPS": "tips_and_tricks",
            "REVISION NOTES": "revision_notes"
        }
        
        for line in lines:
            # Check if this line indicates a new section
            for section_key, field_name in section_mappings.items():
                if section_key in line.upper():
                    # Save previous section content
                    if current_section and current_content:
                        if current_section == "overview":
                            summary_data[current_section] = '\n'.join(current_content).strip()
                        else:
                            summary_data[current_section] = self._extract_list_items(current_content, current_section)
                    
                    # Start new section
                    current_section = field_name
                    current_content = []
                    break
            else:
                # Add line to current section
                if current_section:
                    current_content.append(line)
        
        # Save last section
        if current_section and current_content:
            if current_section == "overview":
                summary_data[current_section] = '\n'.join(current_content).strip()
            else:
                summary_data[current_section] = self._extract_list_items(current_content, current_section)
        
        # Ensure overview has content
        if not summary_data["overview"]:
            summary_data["overview"] = f"""
{topic_name} is a fundamental topic in {subject_name} for Class {class_level} students. 
This topic covers essential concepts that form the foundation for advanced learning.
Understanding this topic is crucial for academic success and practical applications.
"""
        
        return summary_data
    
    def _extract_list_items(self, content_lines: list, section_type: str) -> list:
        """
        Extract list items with special handling for formulas and examples
        """
        items = []
        current_item = []
        in_example = False
        
        for line in content_lines:
            line = line.strip()
            if not line:
                if current_item and not in_example:
                    items.append('\n'.join(current_item))
                    current_item = []
                elif in_example:
                    current_item.append('')  # Keep empty lines in examples
                continue
            
            # Special handling for solved examples
            if section_type == "solved_examples":
                if any(line.lower().startswith(marker) for marker in ['example', 'problem:', 'question:']):
                    if current_item:
                        items.append('\n'.join(current_item))
                        current_item = []
                    in_example = True
                current_item.append(line)
            
            # Special handling for formulas
            elif section_type == "formulas":
                # Each formula should be on its own
                if ':' in line or '=' in line or any(char in line for char in ['∫', '∑', '√', '^']):
                    if current_item:
                        items.append(' '.join(current_item))
                        current_item = []
                    items.append(line)
                elif current_item:
                    current_item.append(line)
                else:
                    items.append(line)
            
            # Regular list items
            else:
                # Check if this is a new list item
                if any(line.startswith(marker) for marker in ['•', '-', '*', '→', '▸', '1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.', '10.', 'Q']):
                    if current_item:
                        items.append(' '.join(current_item))
                        current_item = []
                    # Remove the marker
                    for marker in ['•', '-', '*', '→', '▸']:
                        if line.startswith(marker):
                            line = line[1:].strip()
                            break
                    current_item.append(line)
                elif line and current_item:
                    current_item.append(line)
                elif line:
                    current_item.append(line)
        
        # Add the last item
        if current_item:
            items.append('\n'.join(current_item) if section_type == "solved_examples" else ' '.join(current_item))
        
        return items
    
    def _get_fallback_summary(
        self,
        topic_name: str,
        subject_name: str,
        class_level: int
    ) -> Dict:
        """
        Enhanced fallback summary with REAL mathematical formulas based on topic
        """
        
        # Generate topic-specific formulas based on common topics
        topic_lower = topic_name.lower()
        
        # Mathematics formulas
        if 'quadratic' in topic_lower:
            formulas = [
                "Quadratic equation: ax² + bx + c = 0",
                "Quadratic formula: x = (-b ± √(b² - 4ac)) / 2a",
                "Discriminant: D = b² - 4ac",
                "Sum of roots: α + β = -b/a",
                "Product of roots: α × β = c/a",
                "Vertex form: y = a(x - h)² + k"
            ]
        elif 'linear' in topic_lower or 'equation' in topic_lower:
            formulas = [
                "Linear equation: y = mx + c",
                "Slope formula: m = (y₂ - y₁)/(x₂ - x₁)",
                "Point-slope form: y - y₁ = m(x - x₁)",
                "Distance formula: d = √((x₂ - x₁)² + (y₂ - y₁)²)",
                "Midpoint formula: M = ((x₁ + x₂)/2, (y₁ + y₂)/2)"
            ]
        elif 'triangle' in topic_lower or 'trigonometry' in topic_lower:
            formulas = [
                "Pythagorean theorem: a² + b² = c²",
                "Area of triangle: A = ½ × base × height",
                "Heron's formula: A = √(s(s-a)(s-b)(s-c))",
                "Sine rule: a/sin(A) = b/sin(B) = c/sin(C)",
                "Cosine rule: c² = a² + b² - 2ab·cos(C)",
                "tan(θ) = sin(θ)/cos(θ)"
            ]
        elif 'circle' in topic_lower:
            formulas = [
                "Area of circle: A = πr²",
                "Circumference: C = 2πr",
                "Arc length: s = rθ (θ in radians)",
                "Sector area: A = ½r²θ",
                "Equation of circle: (x - h)² + (y - k)² = r²"
            ]
        elif 'polynomial' in topic_lower:
            formulas = [
                "General polynomial: P(x) = aₙxⁿ + aₙ₋₁xⁿ⁻¹ + ... + a₁x + a₀",
                "Factor theorem: If P(a) = 0, then (x - a) is a factor",
                "Remainder theorem: P(a) = remainder when P(x) is divided by (x - a)",
                "(a + b)² = a² + 2ab + b²",
                "(a - b)² = a² - 2ab + b²",
                "(a + b)³ = a³ + 3a²b + 3ab² + b³"
            ]
        elif 'probability' in topic_lower:
            formulas = [
                "Probability: P(A) = Number of favorable outcomes / Total outcomes",
                "P(A ∪ B) = P(A) + P(B) - P(A ∩ B)",
                "P(A ∩ B) = P(A) × P(B) (for independent events)",
                "Conditional probability: P(A|B) = P(A ∩ B) / P(B)",
                "Bayes' theorem: P(A|B) = P(B|A) × P(A) / P(B)",
                "nCr = n! / (r!(n-r)!)"
            ]
        elif 'statistics' in topic_lower or 'mean' in topic_lower:
            formulas = [
                "Mean: x̄ = Σx / n",
                "Median = Middle value when arranged in order",
                "Mode = Most frequent value",
                "Variance: σ² = Σ(x - x̄)² / n",
                "Standard deviation: σ = √(variance)",
                "Z-score: z = (x - μ) / σ"
            ]
        elif 'logarithm' in topic_lower or 'log' in topic_lower:
            formulas = [
                "Definition: If aˣ = N, then log_a(N) = x",
                "log(ab) = log(a) + log(b)",
                "log(a/b) = log(a) - log(b)",
                "log(aⁿ) = n × log(a)",
                "Change of base: log_a(x) = log_b(x) / log_b(a)",
                "ln(e) = 1, log₁₀(10) = 1"
            ]
        elif 'calculus' in topic_lower or 'derivative' in topic_lower:
            formulas = [
                "Power rule: d/dx(xⁿ) = n × xⁿ⁻¹",
                "Product rule: d/dx(uv) = u(dv/dx) + v(du/dx)",
                "Chain rule: d/dx(f(g(x))) = f'(g(x)) × g'(x)",
                "d/dx(sin x) = cos x",
                "d/dx(cos x) = -sin x",
                "∫xⁿ dx = xⁿ⁺¹/(n+1) + C"
            ]
        elif 'integration' in topic_lower or 'integral' in topic_lower:
            formulas = [
                "∫xⁿ dx = xⁿ⁺¹/(n+1) + C (n ≠ -1)",
                "∫1/x dx = ln|x| + C",
                "∫eˣ dx = eˣ + C",
                "∫sin(x) dx = -cos(x) + C",
                "∫cos(x) dx = sin(x) + C",
                "Integration by parts: ∫u dv = uv - ∫v du"
            ]
        
        # Physics formulas
        elif 'motion' in topic_lower or 'kinematics' in topic_lower:
            formulas = [
                "Velocity: v = d/t",
                "Acceleration: a = (v - u)/t",
                "v = u + at",
                "s = ut + ½at²",
                "v² = u² + 2as",
                "s = ((u + v)/2) × t"
            ]
        elif 'force' in topic_lower or 'newton' in topic_lower:
            formulas = [
                "Newton's Second Law: F = ma",
                "Weight: W = mg",
                "Friction: f = μN",
                "Momentum: p = mv",
                "Impulse: J = FΔt = Δp",
                "F = -kx (Hooke's Law)"
            ]
        elif 'energy' in topic_lower or 'work' in topic_lower:
            formulas = [
                "Work: W = F × d × cos(θ)",
                "Kinetic Energy: KE = ½mv²",
                "Potential Energy: PE = mgh",
                "Power: P = W/t = F × v",
                "Mechanical Energy: E = KE + PE",
                "Efficiency: η = (Output/Input) × 100%"
            ]
        elif 'electricity' in topic_lower or 'current' in topic_lower:
            formulas = [
                "Ohm's Law: V = IR",
                "Power: P = VI = I²R = V²/R",
                "Charge: Q = It",
                "Resistance in series: R_total = R₁ + R₂ + R₃",
                "Resistance in parallel: 1/R_total = 1/R₁ + 1/R₂ + 1/R₃",
                "Energy: E = VIt = Pt"
            ]
        
        # Chemistry formulas
        elif 'mole' in topic_lower or 'stoichiometry' in topic_lower:
            formulas = [
                "Number of moles: n = mass/molar mass",
                "n = N/Nₐ (N = number of particles, Nₐ = Avogadro's number)",
                "Molarity: M = moles of solute/volume in liters",
                "PV = nRT (Ideal Gas Law)",
                "Percentage composition = (mass of element/total mass) × 100",
                "Empirical formula mass = molecular mass/n"
            ]
        elif 'acid' in topic_lower or 'base' in topic_lower or 'ph' in topic_lower:
            formulas = [
                "pH = -log[H⁺]",
                "pOH = -log[OH⁻]",
                "pH + pOH = 14",
                "[H⁺][OH⁻] = 1.0 × 10⁻¹⁴",
                "Ka × Kb = Kw = 1.0 × 10⁻¹⁴",
                "Henderson-Hasselbalch: pH = pKa + log([A⁻]/[HA])"
            ]
        
        # Default general math formulas
        else:
            formulas = [
                "Area of rectangle: A = length × width",
                "Area of square: A = side²",
                "Area of triangle: A = ½ × base × height",
                "Volume of cube: V = side³",
                "Volume of sphere: V = (4/3)πr³",
                "Simple Interest: SI = (P × R × T)/100",
                "Compound Interest: A = P(1 + r/n)ⁿᵗ",
                "Percentage: Percentage = (Part/Whole) × 100"
            ]
        
        # Generate solved examples based on subject
        if subject_name.lower() in ['mathematics', 'maths', 'math']:
            solved_examples = [
                """Example 1: Solve the equation 2x + 5 = 15
    Problem: Find the value of x in 2x + 5 = 15
    Solution:
    Step 1: Subtract 5 from both sides
            2x + 5 - 5 = 15 - 5
            2x = 10
    Step 2: Divide both sides by 2
            x = 10/2
            x = 5
    Answer: x = 5""",

                """Example 2: Find the area of a circle with radius 7 cm
    Problem: Calculate the area of a circle with radius r = 7 cm
    Given: r = 7 cm
    Formula: A = πr²
    Solution:
    Step 1: Substitute r = 7 into the formula
            A = π × (7)²
    Step 2: Calculate 7²
            A = π × 49
    Step 3: Use π ≈ 3.14159
            A = 3.14159 × 49
            A ≈ 153.94 cm²
    Answer: Area = 153.94 cm²""",

                """Example 3: Factorize x² - 5x + 6
    Problem: Factorize the quadratic expression x² - 5x + 6
    Solution:
    Step 1: Find two numbers that multiply to 6 and add to -5
            Numbers are -2 and -3
            (-2) × (-3) = 6 ✓
            (-2) + (-3) = -5 ✓
    Step 2: Write the factored form
            x² - 5x + 6 = (x - 2)(x - 3)
    Step 3: Verify by expanding
            (x - 2)(x - 3) = x² - 3x - 2x + 6 = x² - 5x + 6 ✓
    Answer: (x - 2)(x - 3)"""
            ]
        elif subject_name.lower() == 'physics':
            solved_examples = [
                """Example 1: Calculate the force on a 5 kg object accelerating at 3 m/s²
    Problem: Find the force F
    Given: mass m = 5 kg, acceleration a = 3 m/s²
    Formula: F = ma
    Solution:
    Step 1: Substitute values into F = ma
            F = 5 kg × 3 m/s²
    Step 2: Calculate
            F = 15 kg⋅m/s²
            F = 15 N
    Answer: Force = 15 N""",

                """Example 2: Calculate kinetic energy
    Problem: Find the kinetic energy of a 2 kg ball moving at 4 m/s
    Given: m = 2 kg, v = 4 m/s
    Formula: KE = ½mv²
    Solution:
    Step 1: Substitute values
            KE = ½ × 2 × (4)²
    Step 2: Calculate v²
            KE = ½ × 2 × 16
    Step 3: Simplify
            KE = 1 × 16 = 16 J
    Answer: Kinetic Energy = 16 J"""
            ]
        else:
            solved_examples = [
                f"""Example 1: Basic problem on {topic_name}
    Problem: Solve a fundamental problem related to {topic_name}
    Solution:
    Step 1: Identify the given information
    Step 2: Apply the relevant formula
    Step 3: Calculate the result
    Answer: [Solution will depend on specific values]""",

                f"""Example 2: Application of {topic_name}
    Problem: Apply concepts of {topic_name} to solve a practical problem
    Solution:
    Step 1: Understand the problem context
    Step 2: Choose appropriate method
    Step 3: Solve systematically
    Answer: [Solution based on problem specifics]"""
            ]
        
        # Generate relevant questions
        questions = []
        if formulas:
            questions.append(f"State and derive the formula: {formulas[0]}")
            questions.append(f"Explain when to use: {formulas[1] if len(formulas) > 1 else formulas[0]}")
        questions.extend([
            f"Define {topic_name} and explain its importance.",
            f"What are the key concepts in {topic_name}?",
            f"Solve: If x + 3 = 7, find the value of x.",
            f"A car travels 120 km in 2 hours. Calculate its average speed.",
            f"Explain the difference between {topic_name} and related concepts.",
            f"Give three real-world applications of {topic_name}.",
            f"What are common errors students make in {topic_name}?",
            f"Derive the main formula used in {topic_name} from first principles."
        ])
        
        return {
            "topic_name": topic_name,
            "subject": subject_name,
            "class_level": class_level,
            "generated_at": datetime.utcnow().isoformat(),
            "overview": f"""
    {topic_name} is a fundamental topic in {subject_name} for Class {class_level} students.

    This topic introduces essential concepts that form the foundation for advanced studies in {subject_name}. 
    Understanding {topic_name} is crucial for academic success and has numerous real-world applications.

    In this comprehensive guide, you will learn:
    • Core definitions and concepts
    • Important formulas and their derivations
    • Step-by-step problem-solving techniques
    • Common mistakes and how to avoid them
    • Exam preparation strategies
            """,
            "key_concepts": [
                f"Definition and fundamental principles of {topic_name}",
                f"Mathematical relationships and formulas in {topic_name}",
                f"Problem-solving strategies specific to {topic_name}",
                f"Real-world applications of {topic_name}",
                f"Connection between {topic_name} and other topics in {subject_name}",
                "Common variations and special cases",
                "Graphical representations and interpretations"
            ],
            "formulas": formulas,
            "solved_examples": solved_examples,
            "important_questions": questions[:10],  # Limit to 10 questions
            "common_mistakes": [
                "Forgetting to include units in the final answer",
                "Sign errors in calculations (+ vs -)",
                "Not reading the question carefully and missing important information",
                "Mixing up similar formulas or using the wrong formula",
                "Calculation errors in intermediate steps",
                "Not checking if the answer is reasonable",
                "Forgetting to simplify the final answer"
            ],
            "tips_and_tricks": [
                "Always write down what is given and what needs to be found",
                "Draw diagrams wherever possible to visualize the problem",
                "Check your answer by substituting back into the original equation",
                "Use dimensional analysis to verify formulas",
                "Practice similar problems daily to build speed and accuracy",
                "Create a formula sheet and review it regularly",
                "Break complex problems into smaller, manageable steps"
            ],
            "revision_notes": [
                f"Remember the key definition of {topic_name}",
                "Master all the formulas and know when to apply each",
                "Practice at least 5-10 problems daily",
                "Review your mistakes and learn from them",
                "Focus on understanding concepts, not just memorizing",
                "Time yourself while solving problems",
                "Keep your work neat and organized",
                "Always write complete solutions with proper steps",
                "Use appropriate mathematical notation",
                "Stay calm during exams and manage time well"
            ],
            "full_content": "This is AI-generated fallback content. Configure Gemini API for enhanced, personalized content."
        }

# Create singleton instance
ai_summary_service = AISummaryService()