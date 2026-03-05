import streamlit as st
import google.generativeai as genai
import os
from prompts import PERSONAS, COACH_PROMPT_TEMPLATE, QUICK_TEMPLATES

# Page configuration
st.set_page_config(page_title="Coach.AI", page_icon="🧘", layout="wide")

# Custom CSS for a more attractive UI
st.markdown("""
    <style>
    .main {
        background-color: #050505;
        color: #E4E3E0;
    }
    .stButton>button {
        width: 100%;
        border-radius: 12px;
        height: 3em;
        background-color: #FF4B4B;
        color: white;
        font-weight: bold;
        border: none;
        transition: all 0.3s;
    }
    .stButton>button:hover {
        background-color: #FF3333;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(255, 75, 75, 0.3);
    }
    .stTextInput>div>div>input, .stTextArea>div>div>textarea {
        background-color: #151515;
        color: white;
        border: 1px solid #333;
        border-radius: 12px;
    }
    .stSelectbox>div>div>div {
        background-color: #151515;
        color: white;
    }
    .coach-card {
        background-color: #111;
        padding: 2rem;
        border-radius: 24px;
        border: 1px solid #222;
        margin-top: 2rem;
    }
    .template-card {
        background-color: #151515;
        padding: 1rem;
        border-radius: 12px;
        border: 1px solid #222;
        cursor: pointer;
        transition: all 0.2s;
    }
    .template-card:hover {
        border-color: #FF4B4B;
        background-color: #1A1A1A;
    }
    h1, h2, h3 {
        font-family: 'Inter', sans-serif;
        letter-spacing: -1px;
    }
    </style>
    """, unsafe_allow_html=True)

# Load API Key from environment
api_key = os.getenv("GEMINI_API_KEY")

# Sidebar for settings
with st.sidebar:
    st.title("⚙️ Configuration")
    
    persona_name = st.selectbox("Coach Persona", list(PERSONAS.keys()))
    
    with st.expander("Advanced Settings"):
        response_length = st.radio("Response length", ["Short", "Medium", "Long"], index=1)
        tone = st.selectbox("Tone", ["Balanced", "Professional", "Encouraging", "Direct", "Empathetic"])
        challenge_level = st.selectbox("Challenge level", ["Low", "Balanced", "High"])
        language = st.selectbox("Response language", ["English", "Spanish", "French", "German", "Hindi"])
        model_name = st.text_input("Gemini model name", value="gemini-3-flash-preview")
        temperature = st.slider("Creativity (temperature)", 0.0, 1.0, 0.4)

# Main UI
col1, col2 = st.columns([3, 2], gap="large")

with col1:
    st.title("CRAFT YOUR NEXT MOVE.")
    st.markdown("A premium AI coaching experience designed to help you navigate life's complexities with precision.")
    
    st.subheader("Quick Templates")
    t_cols = st.columns(2)
    for i, t in enumerate(QUICK_TEMPLATES):
        with t_cols[i % 2]:
            if st.button(t['title'], key=f"t_{i}"):
                st.session_state.goal = t['goal']
                st.session_state.situation = t['situation']
                st.session_state.constraints = t['constraints']

    st.divider()
    
    # Input fields with session state persistence
    goal = st.text_input("THE OBJECTIVE", value=st.session_state.get('goal', ""), placeholder="What are you trying to achieve?")
    situation = st.text_area("THE CONTEXT", value=st.session_state.get('situation', ""), placeholder="Describe your current situation...")
    constraints = st.text_area("THE CONSTRAINTS", value=st.session_state.get('constraints', ""), placeholder="Any limitations or specific preferences?")

    if st.button("GENERATE ADVICE"):
        if not api_key:
            st.error("Gemini API Key not found.")
        elif not goal or not situation:
            st.warning("Please provide at least a goal and a description of your situation.")
        else:
            try:
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel(model_name)
                
                persona_description = PERSONAS[persona_name]
                prompt = COACH_PROMPT_TEMPLATE.format(
                    persona_description=persona_description,
                    goal=goal,
                    situation=situation,
                    constraints=constraints,
                    length=response_length,
                    tone=tone,
                    challenge_level=challenge_level,
                    language=language
                )
                
                with st.spinner("The coach is thinking..."):
                    response = model.generate_content(
                        prompt,
                        generation_config=genai.types.GenerationConfig(
                            temperature=temperature,
                        )
                    )
                    st.session_state.response = response.text
            
            except Exception as e:
                st.error(f"Error: {str(e)}")

with col2:
    if 'response' in st.session_state:
        st.markdown(f"### Advice from your {persona_name}")
        st.markdown('<div class="coach-card">', unsafe_allow_html=True)
        st.markdown(st.session_state.response)
        st.markdown('</div>', unsafe_allow_html=True)
        
        if st.button("Clear Response"):
            del st.session_state.response
            st.rerun()
    else:
        st.info("Ready to assist. Fill in the details on the left to receive personalized coaching advice.")

# Footer
st.divider()
st.caption("Built with Streamlit and Google Gemini AI • Inspired by premium SaaS design")
