import os
import google.generativeai as genai
from prompts import PERSONAS, COACH_PROMPT_TEMPLATE

def run_evaluation():
    # Load API Key from environment
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable not set.")
        return

    # Configure Gemini
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-3-flash-preview")

    # Define 3 test cases
    test_cases = [
        {
            "name": "Career Growth",
            "persona": "Career Coach",
            "goal": "Get promoted to Senior Software Engineer",
            "situation": "Currently a Mid-level Engineer with 4 years of experience. Good technical skills but lack visibility in leadership.",
            "constraints": "Limited time for extra projects, but willing to learn soft skills.",
            "length": "Short",
            "tone": "Professional",
            "challenge_level": "High",
            "language": "English"
        },
        {
            "name": "Fitness Habit",
            "persona": "Fitness Coach",
            "goal": "Run a 5K in under 25 minutes",
            "situation": "Regularly run 3K but struggle with pace and consistency.",
            "constraints": "Work full-time, can only train in the early morning or late evening.",
            "length": "Medium",
            "tone": "Encouraging",
            "challenge_level": "Balanced",
            "language": "English"
        },
        {
            "name": "Learning RAG",
            "persona": "Technical Mentor",
            "goal": "Build a RAG pipeline from scratch",
            "situation": "Student in 4th year of BTech, knows Python and basic ML but new to LLMs.",
            "constraints": "Limited time due to final year exams, need a structured path.",
            "length": "Medium",
            "tone": "Balanced",
            "challenge_level": "Balanced",
            "language": "English"
        }
    ]

    print("--- Evaluation Report ---")
    print(f"Running {len(test_cases)} test cases against the Gemini API...\n")

    for i, case in enumerate(test_cases, 1):
        print(f"Test Case {i}: {case['name']}")
        print(f"Persona: {case['persona']}")
        
        # Prepare the prompt
        persona_description = PERSONAS[case['persona']]
        prompt = COACH_PROMPT_TEMPLATE.format(
            persona_description=persona_description,
            goal=case['goal'],
            situation=case['situation'],
            constraints=case['constraints'],
            length=case['length'],
            tone=case['tone'],
            challenge_level=case['challenge_level'],
            language=case['language']
        )

        try:
            # Call API
            response = model.generate_content(prompt)
            print(f"Response (first 200 characters):\n{response.text[:200]}...")
            print(f"Status: SUCCESS\n")
        except Exception as e:
            print(f"Status: FAILED - {str(e)}\n")

    print("--- Evaluation Complete ---")

if __name__ == "__main__":
    run_evaluation()
