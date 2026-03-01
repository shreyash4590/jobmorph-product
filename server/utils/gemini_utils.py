import os
import re
import json
import hashlib
import threading
from dotenv import load_dotenv
import google.generativeai as genai

# -------------------------------------------------
# ENV + CONFIG
# ✅ FIX (Issue #16): genai.configure() now inside _get_model()
# so it runs lazily after .env is fully loaded, not at import time.
# Module-level variables are kept minimal — only API_KEY check.
# -------------------------------------------------
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    print("❌ GEMINI_API_KEY missing — Gemini will use fallback mode")
else:
    print(f"✅ GEMINI_API_KEY loaded ({API_KEY[:10]}...)")

# -------------------------------------------------
# MODEL NAME
# -------------------------------------------------
MODEL_NAME = "gemini-2.5-flash"


def _get_model():
    """
    ✅ FIX (Issue #16): Lazily create model only when needed.
    Configures Gemini fresh using current env var value.
    Returns None safely if key missing — never raises.
    """
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        return None
    try:
        genai.configure(api_key=key)
        return genai.GenerativeModel(MODEL_NAME)
    except Exception as e:
        print(f"❌ Gemini model init failed: {e}")
        return None


# -------------------------------------------------
# UTILS
# -------------------------------------------------

def redact_personal_info(text: str) -> str:
    """Remove emails and phone numbers before sending to Gemini."""
    if not text:
        return ""
    text = re.sub(r'\b[\w\.-]+@[\w\.-]+\.\w+\b', '', text)
    text = re.sub(r'\+?\d[\d\s\-]{8,}', '', text)
    return text.strip()


def stable_fallback_score(resume: str, jd: str) -> int:
    """
    Deterministic score from hash — used ONLY when Gemini is
    completely unavailable. Range: 40–70%.
    ✅ NOTE: is_fallback flag is always set True alongside this
    so frontend can show a warning instead of treating it as real.
    """
    h = hashlib.sha256((resume + jd).encode()).hexdigest()
    return int(h[:2], 16) % 31 + 40


# -------------------------------------------------
# SAFE JSON EXTRACTION
# -------------------------------------------------

def try_extract_json(raw: str):
    """
    Extract JSON from Gemini response safely.
    Handles markdown code blocks and partial JSON.
    Never raises — returns None on failure.
    """
    if not raw:
        return None

    # Strip markdown code fences
    raw = raw.replace("```json", "").replace("```", "").strip()

    # Try direct parse first
    try:
        return json.loads(raw)
    except Exception:
        pass

    # Try extracting { ... } block
    match = re.search(r'\{[\s\S]*\}', raw)
    if match:
        try:
            return json.loads(match.group())
        except Exception:
            pass

    return None


# -------------------------------------------------
# GEMINI CALL WITH TIMEOUT
# ✅ FIX (Issue #12): Added 30-second timeout on every Gemini call.
# On GCP, requests timeout at 60s — this gives us a clean
# fallback before GCP kills the request with a 502 error.
# Uses threading.Timer which works on GCP App Engine
# (signal.alarm does NOT work on App Engine).
# -------------------------------------------------

def _call_gemini_with_timeout(model, prompt: str, timeout_seconds: int = 30):
    """
    Call model.generate_content() with a timeout.
    Returns (response_text, error_message)
    """
    result = {"text": None, "error": None}

    def target():
        try:
            response = model.generate_content(prompt)
            result["text"] = getattr(response, "text", "")
        except Exception as e:
            result["error"] = str(e)

    thread = threading.Thread(target=target, daemon=True)
    thread.start()
    thread.join(timeout=timeout_seconds)

    if thread.is_alive():
        # Thread is still running — timeout hit
        return None, f"Gemini API timed out after {timeout_seconds}s"

    if result["error"]:
        return None, result["error"]

    return result["text"], None


# -------------------------------------------------
# GEMINI ERROR CLASSIFIER
# -------------------------------------------------

def _classify_gemini_error(error_msg: str) -> str:
    """
    Classify Gemini error into a user-friendly category.
    Returns a short label used for logging and fallback decisions.
    """
    msg = error_msg.lower()

    if any(w in msg for w in ["quota", "rate", "429", "resource_exhausted"]):
        return "quota"
    if any(w in msg for w in ["timeout", "timed out", "deadline"]):
        return "timeout"
    if any(w in msg for w in ["auth", "permission", "403", "401", "api_key"]):
        return "auth"
    if any(w in msg for w in ["safety", "blocked", "harm", "recitation"]):
        return "safety"
    if any(w in msg for w in ["503", "502", "unavailable", "overloaded"]):
        return "unavailable"

    return "unknown"


# -------------------------------------------------
# ✅ RESUME ANALYSIS (NEVER FAILS)
# -------------------------------------------------

def analyze_with_gemini(resume_text: str, jd_text: str):
    """
    Analyze resume against job description using Gemini.

    GUARANTEES:
    - Never raises an exception
    - Always returns a valid dict with all 4 keys
    - Falls back gracefully on quota, timeout, auth, or parse errors
    - is_fallback flag is set True when real Gemini data not available

    ✅ FIX (Issue #4): Added is_fallback flag so frontend/ResultPage
    can show a warning instead of presenting fake score as real.

    Returns:
        {
            "score": int (0-100),
            "missing_keywords": list,
            "suggestions": list,
            "learning_resources": list,
            "is_fallback": bool   ← NEW
        }
    """
    resume_text = redact_personal_info(resume_text)
    jd_text     = jd_text.strip()

    # ── Absolute fallback — guaranteed return ────────────────────
    fallback = {
        "score":              stable_fallback_score(resume_text, jd_text),
        "missing_keywords":   [],
        "suggestions":        [],
        "learning_resources": [],
        "is_fallback":        True    # ✅ FIX: Frontend knows this is estimated
    }

    # ── Get model — return fallback if unavailable ────────────────
    model = _get_model()
    if not model:
        print("⚠️ Gemini model unavailable — using fallback score")
        return fallback

    # ── Build prompt ──────────────────────────────────────────────
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
RETURN STRICT JSON ONLY (no extra text, no markdown):

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

    # ── First attempt ─────────────────────────────────────────────
    try:
        raw, error = _call_gemini_with_timeout(model, prompt, timeout_seconds=30)

        if error:
            error_type = _classify_gemini_error(error)
            print(f"⚠️ Gemini attempt 1 failed [{error_type}]: {error}")

            # Quota hit — don't retry, it won't help
            if error_type == "quota":
                print("⚠️ Gemini quota exceeded — using fallback score")
                return fallback

            # Auth error — retrying won't help either
            if error_type == "auth":
                print("❌ Gemini auth error — check GEMINI_API_KEY")
                return fallback

            # Timeout / unavailable — try once more
            raw = None

        data = try_extract_json(raw) if raw else None

        # ── Retry once if parse failed or response was empty ─────
        if not data:
            print("⚠️ Gemini attempt 1 returned no valid JSON — retrying once...")
            raw2, error2 = _call_gemini_with_timeout(model, prompt, timeout_seconds=30)

            if error2:
                error_type = _classify_gemini_error(error2)
                print(f"⚠️ Gemini attempt 2 failed [{error_type}]: {error2}")
                return fallback

            data = try_extract_json(raw2) if raw2 else None

        # ── Both attempts failed — use fallback ──────────────────
        if not data:
            print("⚠️ Gemini returned unparseable response after 2 attempts — fallback used")
            return fallback

        # ── Validate and sanitize score ───────────────────────────
        raw_score = data.get("score", fallback["score"])
        try:
            score = int(raw_score)
        except (TypeError, ValueError):
            print(f"⚠️ Invalid score from Gemini: {raw_score!r} — using fallback score")
            score = fallback["score"]

        score = max(0, min(100, score))

        # ── Validate lists ────────────────────────────────────────
        missing_keywords   = data.get("missing_keywords", [])
        suggestions        = data.get("suggestions", [])
        learning_resources = data.get("learning_resources", [])

        # Ensure they are actually lists (Gemini occasionally returns strings)
        if not isinstance(missing_keywords,   list): missing_keywords   = []
        if not isinstance(suggestions,        list): suggestions        = []
        if not isinstance(learning_resources, list): learning_resources = []

        # Filter out empty strings from lists
        missing_keywords = [k for k in missing_keywords if k and str(k).strip()]
        suggestions      = [s for s in suggestions      if s and str(s).strip()]

        print(f"✅ Gemini analysis complete — score: {score}, "
              f"keywords: {len(missing_keywords)}, suggestions: {len(suggestions)}")

        return {
            "score":              score,
            "missing_keywords":   missing_keywords[:5],
            "suggestions":        suggestions[:5],
            "learning_resources": learning_resources[:3],
            "is_fallback":        False     # ✅ Real Gemini data
        }

    except Exception as e:
        print(f"⚠️ Gemini analyze_with_gemini unexpected error: {e}")
        return fallback


# -------------------------------------------------
# INTERVIEW QUESTIONS
# ✅ FIX (Issue #5): experience and role_type now actually used
# in the prompt — they were accepted as params but never inserted.
# ✅ FIX: Added timeout and quota/error handling same as above.
# -------------------------------------------------

def generate_interview_questions(jd_text: str, experience: str, role_type: str):
    """
    Generate interview questions tailored to experience level and role type.

    ✅ FIX (Issue #5): experience and role_type are now injected
    into the prompt so Gemini generates appropriate questions.
    Previously these params were silently ignored.

    Returns:
        { "hr": [...], "technical": [...], "scenario": [...] }
        Always returns this structure — never raises.
    """
    empty_response = {"hr": [], "technical": [], "scenario": []}

    if not jd_text or not jd_text.strip():
        return empty_response

    model = _get_model()
    if not model:
        print("⚠️ Gemini unavailable — returning empty interview questions")
        return empty_response

    # ── Determine question counts by experience level ─────────────
    if experience and "experienced" in experience.lower():
        hr_count        = 4
        technical_count = 6
        scenario_count  = 4
        difficulty      = "intermediate to advanced"
    else:
        # fresher / entry level / default
        hr_count        = 5
        technical_count = 4
        scenario_count  = 3
        difficulty      = "beginner to intermediate"

    # ── Role-specific instruction ─────────────────────────────────
    role_instruction = ""
    if role_type and role_type.lower() == "technical":
        role_instruction = (
            "Focus technical questions on coding, system design, "
            "algorithms, and tools mentioned in the JD."
        )
    elif role_type and role_type.lower() == "non-technical":
        role_instruction = (
            "Focus on communication, stakeholder management, "
            "domain knowledge, and process questions. "
            "Keep technical questions minimal."
        )
    else:
        role_instruction = "Balance technical and soft skill questions appropriately."

    # ── Build prompt with experience + role_type injected ─────────
    prompt = f"""
You are an expert interview coach preparing a candidate for a job interview.

CANDIDATE PROFILE:
- Experience Level: {experience or 'Not specified'}
- Role Type: {role_type or 'General'}
- Difficulty: {difficulty}

ROLE-SPECIFIC INSTRUCTIONS:
{role_instruction}

TASK:
Generate exactly {hr_count} HR questions, {technical_count} technical questions,
and {scenario_count} scenario-based questions for this job description.

QUESTION GUIDELINES:
- HR questions: behavioral, motivation, culture fit, soft skills
- Technical questions: specific to skills and tools in the JD, difficulty = {difficulty}
- Scenario questions: real-world problem solving relevant to this role
- All questions must be directly relevant to the JD below
- Questions must be complete sentences ending with "?"
- Do NOT include answers — questions only

RETURN STRICT JSON ONLY (no markdown, no extra text):
{{
  "hr": [
    "Question 1?",
    "Question 2?"
  ],
  "technical": [
    "Question 1?",
    "Question 2?"
  ],
  "scenario": [
    "Question 1?",
    "Question 2?"
  ]
}}

JOB DESCRIPTION:
{jd_text}
"""

    # ── Call with timeout ─────────────────────────────────────────
    try:
        raw, error = _call_gemini_with_timeout(model, prompt, timeout_seconds=30)

        if error:
            error_type = _classify_gemini_error(error)
            print(f"⚠️ Interview questions Gemini error [{error_type}]: {error}")
            return empty_response

        data = try_extract_json(raw) if raw else None

        # ── Retry once if parse failed ────────────────────────────
        if not data:
            print("⚠️ Interview questions attempt 1 no JSON — retrying...")
            raw2, error2 = _call_gemini_with_timeout(model, prompt, timeout_seconds=30)

            if error2:
                print(f"⚠️ Interview questions retry failed: {error2}")
                return empty_response

            data = try_extract_json(raw2) if raw2 else None

        if not data:
            print("⚠️ Interview questions: no valid JSON after 2 attempts")
            return empty_response

        # ── Extract and validate lists ────────────────────────────
        hr         = data.get("hr", [])
        technical  = data.get("technical", [])
        scenario   = data.get("scenario", [])

        # Ensure lists, filter empty strings
        hr        = [q for q in (hr        if isinstance(hr,        list) else []) if q and str(q).strip()]
        technical = [q for q in (technical if isinstance(technical, list) else []) if q and str(q).strip()]
        scenario  = [q for q in (scenario  if isinstance(scenario,  list) else []) if q and str(q).strip()]

        total = len(hr) + len(technical) + len(scenario)
        print(f"✅ Interview questions generated — "
              f"HR: {len(hr)}, Technical: {len(technical)}, Scenario: {len(scenario)} "
              f"(total: {total}) for {experience} {role_type} role")

        return {
            "hr":        hr,
            "technical": technical,
            "scenario":  scenario
        }

    except Exception as e:
        print(f"⚠️ generate_interview_questions unexpected error: {e}")
        return empty_response
    



# working code
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
#     print("❌ GEMINI_API_KEY missing")
#     API_KEY = None
# else:
#     genai.configure(api_key=API_KEY)

# # -------------------------------------------------
# # MODEL
# # -------------------------------------------------
# MODEL_NAME = "gemini-2.5-flash"

# try:
#     model = genai.GenerativeModel(MODEL_NAME) if API_KEY else None
#     print(f"✅ Gemini model ready: {MODEL_NAME}")
# except Exception as e:
#     print("❌ Gemini unavailable:", e)
#     model = None

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
#     h = hashlib.sha256((resume + jd).encode()).hexdigest()
#     return int(h[:2], 16) % 31 + 40  # 40–70%


# # -------------------------------------------------
# # SAFE JSON EXTRACTION (NO CRASH)
# # -------------------------------------------------
# def try_extract_json(raw: str):
#     if not raw:
#         return None

#     raw = raw.replace("```json", "").replace("```", "").strip()

#     # Try direct JSON
#     try:
#         return json.loads(raw)
#     except Exception:
#         pass

#     # Try { ... }
#     match = re.search(r'\{[\s\S]*\}', raw)
#     if match:
#         try:
#             return json.loads(match.group())
#         except Exception:
#             pass

#     return None


# # -------------------------------------------------
# # ✅ RESUME ANALYSIS (NEVER FAILS)
# # -------------------------------------------------
# def analyze_with_gemini(resume_text: str, jd_text: str):
#     resume_text = redact_personal_info(resume_text)
#     jd_text = jd_text.strip()

#     # Absolute fallback (guaranteed)
#     fallback = {
#         "score": stable_fallback_score(resume_text, jd_text),
#         "missing_keywords": [],
#         "suggestions": [],
#         "learning_resources": []
#     }

#     if not model:
#         return fallback

#     prompt = f"""
# You are an expert ATS (Applicant Tracking System) evaluator and hiring mentor.

# Your goal is to give a REALISTIC and TRUSTWORTHY evaluation.
# Do NOT inflate scores.

# --------------------------------------------------
# SCORING RULES (STRICT):
# - 90–100: Near-perfect match, all required skills present with experience
# - 75–89: Strong match, minor gaps
# - 60–74: Average match, noticeable skill gaps
# - 45–59: Weak match, major gaps
# - Below 45: Poor fit, not recommended

# --------------------------------------------------
# IMPORTANT INSTRUCTIONS:
# 1. Extract ONLY skills explicitly mentioned in the JOB DESCRIPTION
# 2. Use EXACT skill names as written in the JD
# 3. Do NOT infer or guess skills
# 4. Prefer ATS keywords (tools, frameworks, languages)
# 5. Suggestions must be actionable and resume-specific
# 6. Learning resources must be relevant, official when possible
# 7. Be honest — user trust is critical

# --------------------------------------------------
# RETURN STRICT JSON ONLY:

# {{
#   "score": <integer 0-100>,
#   "missing_keywords": ["ExactSkill1", "ExactSkill2"],
#   "suggestions": [
#     "Specific resume improvement suggestion",
#     "Another actionable suggestion"
#   ],
#   "learning_resources": [
#     {{
#       "skill": "ExactSkillName",
#       "platforms": [
#         {{
#           "name": "Official Docs / Coursera / Microsoft Learn / freeCodeCamp / Udemy / YouTube",
#           "title": "Specific learning resource title",
#           "link": "URL or 'Search on platform'"
#         }}
#       ],
#       "roadmap": "Short realistic roadmap (2–6 weeks)"
#     }}
#   ]
# }}

# CONSTRAINTS:
# - Max 5 missing keywords
# - Max 5 suggestions
# - Learning resources only for top 3 missing skills

# --------------------------------------------------
# RESUME:
# {resume_text}

# JOB DESCRIPTION:
# {jd_text}
# """

#     try:
#         response = model.generate_content(prompt)
#         raw = getattr(response, "text", "")

#         data = try_extract_json(raw)

#         if not data:
#             retry = model.generate_content(prompt)
#             raw_retry = getattr(retry, "text", "")
#             data = try_extract_json(raw_retry)

#         if not data:
#             return fallback

#         score = int(data.get("score", fallback["score"]))
#         score = max(0, min(100, score))

#         return {
#             "score": score,
#             "missing_keywords": data.get("missing_keywords", [])[:5],
#             "suggestions": data.get("suggestions", [])[:5],
#             "learning_resources": data.get("learning_resources", [])[:3]
#         }

#     except Exception as e:
#         print("⚠️ Gemini skipped, fallback used:", e)
#         return fallback


# # -------------------------------------------------
# # INTERVIEW PREP (UNCHANGED)
# # -------------------------------------------------
# def generate_interview_questions(jd_text: str, experience: str, role_type: str):
#     if not model or not jd_text.strip():
#         return {"hr": [], "technical": [], "scenario": []}

#     prompt = f"""
# Generate interview questions.

# Return JSON:
# {{
#   "hr": [],
#   "technical": [],
#   "scenario": []
# }}

# JD:
# {jd_text}
# """

#     try:
#         response = model.generate_content(prompt)
#         raw = getattr(response, "text", "")
#         data = try_extract_json(raw)

#         if not data:
#             return {"hr": [], "technical": [], "scenario": []}

#         return {
#             "hr": data.get("hr", []),
#             "technical": data.get("technical", []),
#             "scenario": data.get("scenario", [])
#         }

#     except Exception:
#         return {"hr": [], "technical": [], "scenario": []}
    







