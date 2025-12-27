# server/utils/matcher.py

import os
import google.generativeai as genai

# ✅ Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def is_technical_text(text):
    """Check if the text contains enough technical terms to consider it technical."""
    technical_terms = {
        'python', 'java', 'sql', 'c++', 'javascript', 'api', 'database', 'html', 'css',
        'react', 'node', 'aws', 'azure', 'cloud', 'git', 'github', 'docker', 'linux',
        'flask', 'django', 'tensorflow', 'ml', 'ai', 'testing', 'debug', 'deployment',
        'development', 'engineering', 'system', 'backend', 'frontend'
    }
    text = text.lower()
    count = sum(1 for term in technical_terms if term in text)
    return count >= 5

def get_gemini_response(resume_text, jd_text):
    """Send resume and JD to Gemini and get back missing keywords and suggestions."""

    prompt = f"""
You are a resume screening assistant.

Compare the following RESUME and JOB DESCRIPTION.
Return:
- A list of Missing Keywords from the resume (in JSON list format)
- 2 to 3 actionable suggestions to improve the resume (as bullet points)

Format exactly like this:
Missing Keywords: ["keyword1", "keyword2"]
Suggestions:
- Suggestion 1
- Suggestion 2

RESUME:
\"\"\"{resume_text}\"\"\"

JOB DESCRIPTION:
\"\"\"{jd_text}\"\"\"
"""

    model = genai.GenerativeModel('gemini-pro')
    response = model.generate_content(prompt)
    return response.text
