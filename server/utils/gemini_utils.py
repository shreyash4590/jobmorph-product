import os
import re
import hashlib
from dotenv import load_dotenv
import google.generativeai as genai

# -------------------------------------------------
# ENV + CONFIG
# -------------------------------------------------
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    raise RuntimeError("❌ GEMINI_API_KEY missing")

genai.configure(api_key=API_KEY)

# -------------------------------------------------
# MODEL PRIORITY (FLASH ONLY → SAFE FOR FREE TIER)
# -------------------------------------------------
MODEL_PRIORITY = [
    "gemini-2.5-flash",
]

model = None
MODEL_NAME = None

for name in MODEL_PRIORITY:
    try:
        model = genai.GenerativeModel(name)
        MODEL_NAME = name
        break
    except Exception as e:
        print(f"⚠️ Model load failed: {name} → {e}")

if not model:
    print("❌ Gemini unavailable → running in fallback mode")

print(f"✅ Gemini model ready: {MODEL_NAME}")

# -------------------------------------------------
# UTILS
# -------------------------------------------------
def redact_personal_info(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r'\b[\w\.-]+@[\w\.-]+\.\w+\b', '', text)
    text = re.sub(r'\+?\d[\d\s\-]{8,}', '', text)
    return text.strip()

def stable_fallback_score(resume: str, jd: str) -> int:
    """
    Deterministic fallback score so:
    - Different resume/JD → different score
    - Same resume/JD → same score
    """
    h = hashlib.sha256((resume + jd).encode()).hexdigest()
    return int(h[:2], 16) % 41 + 30  # 30–70%

# -------------------------------------------------
# PARSER (BULLETPROOF)
# -------------------------------------------------
def parse_gemini_response(text):
    if not isinstance(text, str) or not text.strip():
        return {
            "score": 0,
            "missing_keywords": [],
            "suggestions": []
        }

    # SCORE
    score = 0
    score_match = re.search(r'(\d{1,3})\s*%', text)
    if score_match:
        score = min(int(score_match.group(1)), 100)

    # KEYWORDS
    keywords = []
    kw_match = re.search(r'Missing Keywords:\s*\[(.*?)\]', text, re.DOTALL)
    if kw_match:
        keywords = [
            k.strip().strip('"').strip("'")
            for k in kw_match.group(1).split(',')
            if len(k.strip()) > 1
        ]

    # SUGGESTIONS
    suggestions = []
    if "Suggestions:" in text:
        for line in text.splitlines():
            if line.strip().startswith("-"):
                suggestions.append(line.replace("-", "").strip())

    return {
        "score": score,
        "missing_keywords": keywords,
        "suggestions": suggestions
    }

# -------------------------------------------------
# MAIN ANALYSIS FUNCTION
# -------------------------------------------------
def analyze_with_gemini(resume_text: str, jd_text: str) -> dict:
    resume_text = redact_personal_info(resume_text)
    jd_text = jd_text.strip()

    # ---------- Gemini unavailable ----------
    if not model:
        return {
            "score": stable_fallback_score(resume_text, jd_text),
            "missing_keywords": [],
            "suggestions": ["Gemini unavailable – fallback score used"]
        }

    prompt = f"""
You are an ATS resume evaluator.

Return ONLY this format:

Matching Score: <0-100>%

Missing Keywords: ["skill1", "skill2"]

Suggestions:
- suggestion 1
- suggestion 2

RESUME:
{resume_text}

JOB DESCRIPTION:
{jd_text}
"""

    try:
        response = model.generate_content(prompt)

        if not response or not getattr(response, "text", "").strip():
            raise ValueError("Empty Gemini response")

        return parse_gemini_response(response.text)

    except Exception as e:
        error = str(e)
        print("❌ Gemini error:", error)

        # ---------- QUOTA / MODEL FAILURE ----------
        if "429" in error or "quota" in error.lower():
            return {
                "score": stable_fallback_score(resume_text, jd_text),
                "missing_keywords": [],
                "suggestions": ["Gemini quota exceeded – fallback score used"]
            }

        return {
            "score": stable_fallback_score(resume_text, jd_text),
            "missing_keywords": [],
            "suggestions": ["Gemini failed – fallback score used"]
        }
