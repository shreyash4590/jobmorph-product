# server/utils/matcher.py

import os
import re
import google.generativeai as genai

# ======================================================
# GEMINI CONFIG (EXPLANATION ONLY – NEVER BLOCK CORE FLOW)
# ======================================================
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
GEMINI_MODEL = "gemini-2.5-flash"

# ======================================================
# CORE SKILL SET (STABLE & DOMAIN-ORIENTED)
# ======================================================
SKILL_SET = {
    "python", "java", "javascript", "typescript", "c++", "sql",
    "react", "node", "express", "flask", "django",
    "html", "css", "bootstrap",
    "aws", "azure", "gcp",
    "docker", "kubernetes",
    "git", "github",
    "machine learning", "ml", "ai",
    "tensorflow", "pytorch",
    "data analysis", "data science",
    "rest api", "api",
    "linux", "cloud", "backend", "frontend", "full stack"
}

DOMAIN_KEYWORDS = {
    "fullstack": {"react", "node", "frontend", "backend", "full stack"},
    "aiml": {"machine learning", "ml", "ai", "tensorflow", "pytorch", "data"},
    "devops": {"docker", "kubernetes", "aws", "ci/cd", "cloud"},
    "data": {"sql", "data analysis", "data science", "analytics"}
}

# ======================================================
# TEXT NORMALIZATION
# ======================================================
def normalize_text(text: str) -> str:
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()

# ======================================================
# TECH / NON-TECH VALIDATION (USED BY upload.py)
# ======================================================
def is_technical_text(text: str) -> bool:
    """
    Lightweight technical-content detector.
    Used ONLY for validation, NOT for scoring.
    """
    if not text:
        return False

    technical_terms = {
        "python", "java", "sql", "javascript", "react", "node",
        "api", "backend", "frontend", "cloud", "aws",
        "docker", "kubernetes", "ml", "ai", "data"
    }

    text = normalize_text(text)
    hits = sum(1 for term in technical_terms if term in text)
    return hits >= 3

# ======================================================
# SKILL EXTRACTION
# ======================================================
def extract_skills(text: str) -> set:
    text = normalize_text(text)
    return {skill for skill in SKILL_SET if skill in text}

# ======================================================
# DOMAIN DETECTION
# ======================================================
def detect_domain(text: str) -> str:
    text = normalize_text(text)
    scores = {
        domain: sum(1 for kw in keywords if kw in text)
        for domain, keywords in DOMAIN_KEYWORDS.items()
    }
    best_domain = max(scores, key=scores.get)
    return best_domain if scores[best_domain] > 0 else "unknown"

# ======================================================
# QUALITY CHECKS
# ======================================================
def jd_quality_score(jd_text: str) -> int:
    return min(len(extract_skills(jd_text)) * 10, 100)

def resume_quality_score(resume_text: str) -> int:
    text = normalize_text(resume_text)
    skill_count = len(extract_skills(text))
    project_signal = text.count("project")
    return min((skill_count * 10) + (project_signal * 5), 100)

# ======================================================
# CORE MATCHING ENGINE (DETERMINISTIC)
# ======================================================
def calculate_match_score(resume_text: str, jd_text: str) -> dict:
    resume_text_n = normalize_text(resume_text)
    jd_text_n = normalize_text(jd_text)

    resume_skills = extract_skills(resume_text_n)
    jd_skills = extract_skills(jd_text_n)

    # -------- Skill Match --------
    skill_match = (
        (len(resume_skills & jd_skills) / len(jd_skills)) * 100
        if jd_skills else 0
    )

    # -------- Domain Match --------
    resume_domain = detect_domain(resume_text_n)
    jd_domain = detect_domain(jd_text_n)

    domain_penalty = (
        0.6 if resume_domain != jd_domain and resume_domain != "unknown" else 1.0
    )

    # -------- Quality --------
    jd_quality = jd_quality_score(jd_text)
    resume_quality = resume_quality_score(resume_text)

    # -------- Adaptive Weights --------
    if jd_quality < 40:
        skill_w, role_w, exp_w = 0.25, 0.30, 0.30
    else:
        skill_w, role_w, exp_w = 0.50, 0.15, 0.20

    final_score = (
        skill_match * skill_w +
        resume_quality * exp_w +
        jd_quality * role_w
    ) * domain_penalty

    final_score = round(min(final_score, 100), 2)

    return {
        "final_score": final_score,
        "skill_match": round(skill_match, 2),
        "missing_skills": sorted(jd_skills - resume_skills),
        "resume_domain": resume_domain,
        "jd_domain": jd_domain
    }

# ======================================================
# GEMINI – EXPLANATION ONLY (FAIL-SAFE)
# ======================================================
def get_gemini_response(resume_text: str, jd_text: str) -> str:
    """
    Gemini is OPTIONAL.
    Failure must NEVER break upload or scoring.
    """
    try:
        prompt = f"""
You are an ATS resume expert.

DO NOT calculate scores.
ONLY explain gaps and improvements.

Return EXACTLY in this format:

Missing Keywords: ["skill1", "skill2"]
Suggestions:
- Actionable suggestion 1
- Actionable suggestion 2

RESUME:
\"\"\"{resume_text[:3000]}\"\"\"

JOB DESCRIPTION:
\"\"\"{jd_text[:3000]}\"\"\"
"""

        model = genai.GenerativeModel(GEMINI_MODEL)
        response = model.generate_content(prompt)
        return response.text.strip()

    except Exception as e:
        print("⚠️ Gemini failed safely:", e)
        return ""













# # server/utils/matcher.py

# import os
# import google.generativeai as genai

# # ✅ Configure Gemini
# genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# def is_technical_text(text):
#     """Check if the text contains enough technical terms to consider it technical."""
#     technical_terms = {
#         'python', 'java', 'sql', 'c++', 'javascript', 'api', 'database', 'html', 'css',
#         'react', 'node', 'aws', 'azure', 'cloud', 'git', 'github', 'docker', 'linux',
#         'flask', 'django', 'tensorflow', 'ml', 'ai', 'testing', 'debug', 'deployment',
#         'development', 'engineering', 'system', 'backend', 'frontend'
#     }
#     text = text.lower()
#     count = sum(1 for term in technical_terms if term in text)
#     return count >= 5

# def get_gemini_response(resume_text, jd_text):
#     """Send resume and JD to Gemini and get back missing keywords and suggestions."""

#     prompt = f"""
# You are a resume screening assistant.

# Compare the following RESUME and JOB DESCRIPTION.
# Return:
# - A list of Missing Keywords from the resume (in JSON list format)
# - 2 to 3 actionable suggestions to improve the resume (as bullet points)

# Format exactly like this:
# Missing Keywords: ["keyword1", "keyword2"]
# Suggestions:
# - Suggestion 1
# - Suggestion 2

# RESUME:
# \"\"\"{resume_text}\"\"\"

# JOB DESCRIPTION:
# \"\"\"{jd_text}\"\"\"
# """

#     model = genai.GenerativeModel('gemini-pro')
#     response = model.generate_content(prompt)
#     return response.text

