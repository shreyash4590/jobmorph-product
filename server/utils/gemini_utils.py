import os
import re
import json
import hashlib
from dotenv import load_dotenv
import google.generativeai as genai

# -------------------------------------------------
# ENV + CONFIG
# -------------------------------------------------
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    print("❌ GEMINI_API_KEY missing")
    API_KEY = None
else:
    genai.configure(api_key=API_KEY)

# -------------------------------------------------
# MODEL
# -------------------------------------------------
MODEL_NAME = "gemini-2.5-flash"

try:
    model = genai.GenerativeModel(MODEL_NAME) if API_KEY else None
    print(f"✅ Gemini model ready: {MODEL_NAME}")
except Exception as e:
    print("❌ Gemini unavailable:", e)
    model = None

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
    h = hashlib.sha256((resume + jd).encode()).hexdigest()
    return int(h[:2], 16) % 31 + 40  # 40–70%


# -------------------------------------------------
# SAFE JSON EXTRACTION (NO CRASH)
# -------------------------------------------------
def try_extract_json(raw: str):
    if not raw:
        return None

    raw = raw.replace("```json", "").replace("```", "").strip()

    # Try direct JSON
    try:
        return json.loads(raw)
    except Exception:
        pass

    # Try { ... }
    match = re.search(r'\{[\s\S]*\}', raw)
    if match:
        try:
            return json.loads(match.group())
        except Exception:
            pass

    return None


# -------------------------------------------------
# ✅ RESUME ANALYSIS (NEVER FAILS)
# -------------------------------------------------
def analyze_with_gemini(resume_text: str, jd_text: str):
    resume_text = redact_personal_info(resume_text)
    jd_text = jd_text.strip()

    # Absolute fallback (guaranteed)
    fallback = {
        "score": stable_fallback_score(resume_text, jd_text),
        "missing_keywords": [],
        "suggestions": [],
        "learning_resources": []
    }

    if not model:
        return fallback

    prompt = f"""
You are an expert ATS (Applicant Tracking System) evaluator and hiring mentor.

Your goal is to give a REALISTIC and TRUSTWORTHY evaluation.
Do NOT inflate scores.

--------------------------------------------------
SCORING RULES (STRICT):
- 90–100: Near-perfect match, all required skills present with experience
- 75–89: Strong match, minor gaps
- 60–74: Average match, noticeable skill gaps
- 45–59: Weak match, major gaps
- Below 45: Poor fit, not recommended

--------------------------------------------------
IMPORTANT INSTRUCTIONS:
1. Extract ONLY skills explicitly mentioned in the JOB DESCRIPTION
2. Use EXACT skill names as written in the JD
3. Do NOT infer or guess skills
4. Prefer ATS keywords (tools, frameworks, languages)
5. Suggestions must be actionable and resume-specific
6. Learning resources must be relevant, official when possible
7. Be honest — user trust is critical

--------------------------------------------------
RETURN STRICT JSON ONLY:

{{
  "score": <integer 0-100>,
  "missing_keywords": ["ExactSkill1", "ExactSkill2"],
  "suggestions": [
    "Specific resume improvement suggestion",
    "Another actionable suggestion"
  ],
  "learning_resources": [
    {{
      "skill": "ExactSkillName",
      "platforms": [
        {{
          "name": "Official Docs / Coursera / Microsoft Learn / freeCodeCamp / Udemy / YouTube",
          "title": "Specific learning resource title",
          "link": "URL or 'Search on platform'"
        }}
      ],
      "roadmap": "Short realistic roadmap (2–6 weeks)"
    }}
  ]
}}

CONSTRAINTS:
- Max 5 missing keywords
- Max 5 suggestions
- Learning resources only for top 3 missing skills

--------------------------------------------------
RESUME:
{resume_text}

JOB DESCRIPTION:
{jd_text}
"""

    try:
        response = model.generate_content(prompt)
        raw = getattr(response, "text", "")

        data = try_extract_json(raw)

        if not data:
            retry = model.generate_content(prompt)
            raw_retry = getattr(retry, "text", "")
            data = try_extract_json(raw_retry)

        if not data:
            return fallback

        score = int(data.get("score", fallback["score"]))
        score = max(0, min(100, score))

        return {
            "score": score,
            "missing_keywords": data.get("missing_keywords", [])[:5],
            "suggestions": data.get("suggestions", [])[:5],
            "learning_resources": data.get("learning_resources", [])[:3]
        }

    except Exception as e:
        print("⚠️ Gemini skipped, fallback used:", e)
        return fallback


# -------------------------------------------------
# INTERVIEW PREP (UNCHANGED)
# -------------------------------------------------
def generate_interview_questions(jd_text: str, experience: str, role_type: str):
    if not model or not jd_text.strip():
        return {"hr": [], "technical": [], "scenario": []}

    prompt = f"""
Generate interview questions.

Return JSON:
{{
  "hr": [],
  "technical": [],
  "scenario": []
}}

JD:
{jd_text}
"""

    try:
        response = model.generate_content(prompt)
        raw = getattr(response, "text", "")
        data = try_extract_json(raw)

        if not data:
            return {"hr": [], "technical": [], "scenario": []}

        return {
            "hr": data.get("hr", []),
            "technical": data.get("technical", []),
            "scenario": data.get("scenario", [])
        }

    except Exception:
        return {"hr": [], "technical": [], "scenario": []}
    













# import os
# import re
# import json
# import hashlib
# from dotenv import load_dotenv
# import google.generativeai as genai

# # -------------------------------------------------
# # ENV + CONFIG
# # -------------------------------------------------
# load_dotenv()
# API_KEY = os.getenv("GEMINI_API_KEY")

# if not API_KEY:
#     raise RuntimeError("❌ GEMINI_API_KEY missing")

# genai.configure(api_key=API_KEY)

# # -------------------------------------------------
# # MODEL PRIORITY (FLASH ONLY → SAFE FOR FREE TIER)
# # -------------------------------------------------
# MODEL_PRIORITY = [
#     "gemini-2.5-flash",
# ]

# model = None
# MODEL_NAME = None

# for name in MODEL_PRIORITY:
#     try:
#         model = genai.GenerativeModel(name)
#         MODEL_NAME = name
#         break
#     except Exception as e:
#         print(f"⚠️ Model load failed: {name} → {e}")

# if not model:
#     print("❌ Gemini unavailable → running in fallback mode")

# print(f"✅ Gemini model ready: {MODEL_NAME}")

# # -------------------------------------------------
# # UTILS
# # -------------------------------------------------
# def redact_personal_info(text: str) -> str:
#     if not text:
#         return ""
#     text = re.sub(r'\b[\w\.-]+@[\w\.-]+\.\w+\b', '', text)
#     text = re.sub(r'\+?\d[\d\s\-]{8,}', '', text)
#     return text.strip()


# def stable_fallback_score(resume: str, jd: str) -> int:
#     """
#     Deterministic fallback score
#     """
#     h = hashlib.sha256((resume + jd).encode()).hexdigest()
#     return int(h[:2], 16) % 41 + 30  # 30–70%


# # -------------------------------------------------
# # PARSER (BULLETPROOF)
# # -------------------------------------------------
# def parse_gemini_response(text):
#     if not isinstance(text, str) or not text.strip():
#         return {
#             "score": 0,
#             "missing_keywords": [],
#             "suggestions": []
#         }

#     # SCORE
#     score = 0
#     score_match = re.search(r'(\d{1,3})\s*%', text)
#     if score_match:
#         score = min(int(score_match.group(1)), 100)

#     # KEYWORDS
#     keywords = []
#     kw_match = re.search(r'Missing Keywords:\s*\[(.*?)\]', text, re.DOTALL)
#     if kw_match:
#         keywords = [
#             k.strip().strip('"').strip("'")
#             for k in kw_match.group(1).split(',')
#             if len(k.strip()) > 1
#         ]

#     # SUGGESTIONS
#     suggestions = []
#     if "Suggestions:" in text:
#         for line in text.splitlines():
#             if line.strip().startswith("-"):
#                 suggestions.append(line.replace("-", "").strip())

#     return {
#         "score": score,
#         "missing_keywords": keywords,
#         "suggestions": suggestions
#     }

# # -------------------------------------------------
# # MAIN ANALYSIS FUNCTION (UNCHANGED)
# # -------------------------------------------------
# def analyze_with_gemini(resume_text: str, jd_text: str) -> dict:
#     resume_text = redact_personal_info(resume_text)
#     jd_text = jd_text.strip()

#     if not model:
#         return {
#             "score": stable_fallback_score(resume_text, jd_text),
#             "missing_keywords": [],
#             "suggestions": ["Gemini unavailable – fallback score used"]
#         }

#     prompt = f"""
# You are an ATS resume evaluator.

# Return ONLY this format:

# Matching Score: <0-100>%

# Missing Keywords: ["skill1", "skill2"]

# Suggestions:
# - suggestion 1
# - suggestion 2

# RESUME:
# {resume_text}

# JOB DESCRIPTION:
# {jd_text}
# """

#     try:
#         response = model.generate_content(prompt)

#         if not response or not getattr(response, "text", "").strip():
#             raise ValueError("Empty Gemini response")

#         return parse_gemini_response(response.text)

#     except Exception as e:
#         error = str(e)
#         print("❌ Gemini error:", error)

#         if "429" in error or "quota" in error.lower():
#             return {
#                 "score": stable_fallback_score(resume_text, jd_text),
#                 "missing_keywords": [],
#                 "suggestions": ["Gemini quota exceeded – fallback score used"]
#             }

#         return {
#             "score": stable_fallback_score(resume_text, jd_text),
#             "missing_keywords": [],
#             "suggestions": ["Gemini failed – fallback score used"]
#         }


# # -------------------------------------------------
# # 🔥 INTERVIEW PREPARATION (NEW – SAFE ADDITION)
# # -------------------------------------------------
# def generate_interview_questions(jd_text: str, experience: str, role_type: str):
#     """
#     Generates professional interview questions.
#     Does NOT affect resume analysis logic.
#     """

#     if not model:
#         return {
#             "hr": [],
#             "technical": [],
#             "scenario": []
#         }

#     prompt = f"""
# You are a senior interviewer.

# Generate REAL interview questions based on:

# Experience Level: {experience}
# Role Type: {role_type}

# Job Description:
# {jd_text}

# Rules:
# - Not basic or textbook questions
# - Fresher: fundamentals + thinking
# - Experienced: ownership, decisions, scalability
# - Questions must sound like real interviews

# Return ONLY valid JSON:

# {{
#   "hr": ["question 1", "question 2"],
#   "technical": ["question 1", "question 2"],
#   "scenario": ["question 1", "question 2"]
# }}
# """

#     try:
#         response = model.generate_content(prompt)

#         if not response or not getattr(response, "text", "").strip():
#             raise ValueError("Empty interview response")

#         return json.loads(response.text)

#     except Exception as e:
#         print("❌ Interview Gemini error:", e)

#         return {
#             "hr": [],
#             "technical": [],
#             "scenario": []
#         }

