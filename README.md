<<<<<<< HEAD
# Personal AI Coach

A minimal Streamlit app to experiment with coaching personas powered by the Gemini API.

## Features
- **Customizable Personas:** Choose between Career Coach, Fitness Coach, Life Coach, and Technical Mentor.
- **Adjustable Settings:** Control response length, tone, challenge level, and creativity.
- **Gemini AI Integration:** Powered by Google's latest Gemini models.

## Setup Instructions

### 1. Python Installation
Ensure you have Python 3.9 or higher installed. You can download it from [python.org](https://www.python.org/downloads/).

### 2. Virtual Environment Setup
It's recommended to use a virtual environment to manage dependencies.

```bash
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### 3. Install Dependencies
Install the required Python packages using pip:

```bash
pip install -r requirements.txt
```

### 4. Configure API Key
Set your Gemini API key as an environment variable:

```bash
# On Windows (Command Prompt):
set GEMINI_API_KEY=your_api_key_here

# On Windows (PowerShell):
$env:GEMINI_API_KEY="your_api_key_here"

# On macOS/Linux:
export GEMINI_API_KEY=your_api_key_here
```

### 5. Run the Application
Start the Streamlit app:

```bash
streamlit run app.py
```

### 6. Run Evaluation
To run the evaluation script and test the prompt against 3 predefined cases:

```bash
python evaluation.py
```

## Project Structure
- `app.py`: Main Streamlit application logic.
- `prompts.py`: Stores prompt templates and persona options.
- `evaluation.py`: Script to run test cases and print a report.
- `requirements.txt`: List of Python dependencies.
- `README.md`: Project documentation and setup guide.
- `.gitignore`: Standard git ignore file.
=======
# personal-ai-coach
Personal AI Coach – An AI-powered assistant that provides personalized guidance for learning, productivity, and self-improvement using LLMs and intelligent prompts.
>>>>>>> 6f1545b2d82fee57a066a23eeba8ce74205a4598
