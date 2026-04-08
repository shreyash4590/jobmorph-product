# server/routes/verify_cert.py

import os
import re
import json
import threading
from flask import Blueprint, request, jsonify
from firebase_admin import auth
import google.generativeai as genai

verify_cert_blueprint = Blueprint('verify_cert', __name__)

ACCEPTED_DOMAINS = [
    "coursera.org", "udemy.com", "edx.org", "credentials.edx.org",
    "credly.com", "badgr.com", "credential.net",
    "linkedin.com", "learn.microsoft.com", "microsoft.com",
    "aws.amazon.com", "amazon.com",
    "google.com", "skillshop.exceedlms.com", "learndigital.withgoogle.com",
    "ibm.com", "deeplearning.ai", "kaggle.com", "huggingface.co",
    "nptel.ac.in", "swayam.gov.in", "simplilearn.com",
    "greatlearning.in", "upgrad.com", "internshala.com",
    "freecodecamp.org", "hackerrank.com", "datacamp.com",
    "pluralsight.com", "codecademy.com", "skillshare.com",
    "trailhead.salesforce.com", "salesforce.com",
    "alison.com", "futurelearn.com", "testdome.com",
    "codingninjas.com", "ude.my",
]

PLATFORM_PATTERNS = [
    ("credly.com/badges/",                   "Credly"),
    ("linkedin.com/learning/certificates/",   "LinkedIn Learning"),
    ("linkedin.com",                          "LinkedIn"),
    ("coursera.org/verify/",                  "Coursera"),
    ("coursera.org/account/accomplishments/", "Coursera"),
    ("credentials.edx.org",                  "edX"),
    ("edx.org",                               "edX"),
    ("ude.my",                                "Udemy"),
    ("udemy.com/certificate/",                "Udemy"),
    ("udemy.com",                             "Udemy"),
    ("learn.microsoft.com",                   "Microsoft Learn"),
    ("microsoft.com",                         "Microsoft"),
    ("skillshop.exceedlms.com",               "Google Skillshop"),
    ("learndigital.withgoogle.com",           "Google Digital Garage"),
    ("google.com",                            "Google"),
    ("aws.amazon.com",                        "AWS"),
    ("ibm.com",                               "IBM"),
    ("deeplearning.ai",                       "DeepLearning.AI"),
    ("nptel.ac.in",                           "NPTEL"),
    ("swayam.gov.in",                         "SWAYAM"),
    ("simplilearn.com",                       "Simplilearn"),
    ("greatlearning.in",                      "Great Learning"),
    ("upgrad.com",                            "UpGrad"),
    ("internshala.com",                       "Internshala"),
    ("freecodecamp.org",                      "freeCodeCamp"),
    ("hackerrank.com",                        "HackerRank"),
    ("kaggle.com",                            "Kaggle"),
    ("datacamp.com",                          "DataCamp"),
    ("pluralsight.com",                       "Pluralsight"),
    ("codecademy.com",                        "Codecademy"),
    ("trailhead.salesforce.com",              "Salesforce Trailhead"),
    ("huggingface.co",                        "Hugging Face"),
    ("alison.com",                            "Alison"),
    ("futurelearn.com",                       "FutureLearn"),
    ("badgr.com",                             "Badgr"),
    ("testdome.com",                          "TestDome"),
    ("codingninjas.com",                      "Coding Ninjas"),
]

# ── Shared relevance prompt template ─────────────────────────────
def _relevance_prompt(cert_name: str, cert_issuer: str,
                       cert_skills: str, skill: str) -> str:
    return f"""
You are a senior technical recruiter making a certificate relevance decision.

Certificate: "{cert_name}"
Issued by: {cert_issuer}
Skills on badge/page: "{cert_skills}"
Skill being verified: "{skill}"

STEP 1 — Identify the field of "{cert_name}".
STEP 2 — Identify the field of "{skill}".
STEP 3 — Are they the same field? If not → false.

FIELD BOUNDARIES (strict — cross-field is always false):
• UX/UI Design: user experience, user interface, wireframing, prototyping,
  Figma, user research, usability, interaction design, design thinking
• AI/ML: machine learning, deep learning, LLMs, neural networks, NLP,
  computer vision, generative AI, RAG, LangChain, open-source models, embeddings,
  prompt engineering, autonomous agents, transformers
• Data Analytics: SQL, data analysis, statistics, Excel, Power BI, Tableau,
  data visualization, data engineering, ETL
• Python/Backend: Python, Django, Flask, FastAPI, pandas, numpy
• Web Development: HTML, CSS, JavaScript, TypeScript, React, Vue, Angular,
  Node.js, REST API, frontend, backend
• Cloud/DevOps: AWS, Azure, GCP, Docker, Kubernetes, CI/CD, infrastructure, Linux
• Security: cybersecurity, ethical hacking, penetration testing, network security
• Mobile: Android, iOS, Flutter, React Native, Swift, Kotlin
• Business/Management: project management, agile, scrum, product management
• Design (non-UX): graphic design, Photoshop, Illustrator, branding
• Marketing: SEO, digital marketing, social media, content marketing
• Finance: accounting, financial modeling, Excel finance, investment
• Healthcare: medical, nursing, clinical, public health

RULES:
- If certificate skills explicitly mention "{skill}" → true
- If same field → true
- If different fields → false, always
- "Getting Started with AI" + "open-source LLMs" → AI = AI → true ✅
- "Foundations of UX Design" + "LLMs" → UX ≠ AI → false ❌
- "Foundations of UX Design" + "data analysis" → UX ≠ Data → false ❌
- "Python for Data Science" + "Django" → Python = Python → true ✅
- "AWS Cloud Practitioner" + "React" → Cloud ≠ Web → false ❌

Return ONLY valid JSON:
{{"relevant": true or false, "reason": "one sentence explaining field mismatch if false, else null"}}
"""


def _get_model():
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        return None
    try:
        genai.configure(api_key=key)
        return genai.GenerativeModel("gemini-2.5-flash")
    except Exception as e:
        print(f"❌ Gemini init failed: {e}")
        return None

def _call_gemini(model, prompt: str, timeout: int = 20):
    result = {"text": None, "error": None}
    def target():
        try:
            response = model.generate_content(prompt)
            result["text"] = getattr(response, "text", "")
        except Exception as e:
            result["error"] = str(e)
    t = threading.Thread(target=target, daemon=True)
    t.start()
    t.join(timeout=timeout)
    if t.is_alive():
        return None, "Gemini timed out"
    if result["error"]:
        return None, result["error"]
    return result["text"], None

def _extract_json(raw: str):
    if not raw:
        return None
    raw = raw.replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(raw)
    except Exception:
        pass
    match = re.search(r'\{[\s\S]*\}', raw)
    if match:
        try:
            return json.loads(match.group())
        except Exception:
            pass
    return None

def _verify_token(req):
    header = req.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None, (jsonify({"error": "Unauthorized"}), 401)
    token = header.split("Bearer ", 1)[1].strip()
    try:
        decoded = auth.verify_id_token(token, check_revoked=False)
        return decoded["uid"], None
    except auth.ExpiredIdTokenError:
        return None, (jsonify({"error": "Session expired."}), 401)
    except Exception:
        return None, (jsonify({"error": "Authentication failed."}), 401)

def _is_accepted(url: str) -> bool:
    return any(d in url.lower() for d in ACCEPTED_DOMAINS)

def _detect_platform(url: str) -> str:
    url_lower = url.lower()
    for pattern, name in PLATFORM_PATTERNS:
        if pattern in url_lower:
            return name
    return "Unknown platform"

def _check_relevance(model, cert_name: str, cert_issuer: str,
                      cert_skills: str, skill: str):
    """
    Returns (is_relevant: bool, reason: str|None)
    Returns (None, None) if Gemini unavailable — caller decides fallback.
    """
    if not model:
        return None, None
    prompt = _relevance_prompt(cert_name, cert_issuer, cert_skills, skill)
    raw, err = _call_gemini(model, prompt, timeout=15)
    if err or not raw:
        print(f"⚠️ Relevance check failed: {err}")
        return None, None
    rel = _extract_json(raw)
    if not rel:
        return None, None
    return rel.get("relevant"), rel.get("reason")


@verify_cert_blueprint.route('/verify-certificate', methods=['POST'])
def verify_certificate():

    # 1. Auth
    user_id, auth_error = _verify_token(request)
    if auth_error:
        return auth_error

    # 2. Parse body
    data       = request.get_json(force=True) or {}
    url        = (data.get("url")       or "").strip()
    skill      = (data.get("skill")     or "").strip()
    page_text  = (data.get("page_text") or "").strip()
    badge_data = data.get("badge_data") or {}

    if not url:
        return jsonify({"error": "Certificate URL is required."}), 400

    if not url.startswith("http"):
        return jsonify({"is_valid": False,
                        "reason": "Please paste a full URL starting with https://"}), 200

    # 3. Domain check
    if not _is_accepted(url):
        return jsonify({
            "is_valid": False,
            "reason": "URL not from a recognised platform. Accepted: Coursera, Udemy, Credly, LinkedIn, Google, Microsoft, AWS, IBM, edX, NPTEL, freeCodeCamp, HackerRank, DataCamp and more."
        }), 200

    platform = _detect_platform(url)
    model    = _get_model()

    # ─────────────────────────────────────────────────────────────
    # PATH 1: CREDLY — badge_data fetched by browser
    # ─────────────────────────────────────────────────────────────
    if badge_data and badge_data.get("bname"):
        cert_name   = badge_data.get("bname", "")
        cert_issuer = badge_data.get("issuer", "Credly")
        cert_date   = badge_data.get("date") or None
        cert_skills = badge_data.get("skills", "")

        relevant, reason = _check_relevance(
            model, cert_name, cert_issuer, cert_skills, skill
        )

        if relevant is False:
            return jsonify({
                "is_valid": False,
                "reason": reason or f"'{cert_name}' does not cover '{skill}'."
            }), 200

        if relevant is None:
            # Gemini unavailable — fail safe, ask user to retry
            return jsonify({
                "is_valid": False,
                "reason": "Verification service busy. Please try again in a moment."
            }), 200

        return jsonify({
            "is_valid": True,
            "skill":    cert_name or skill,
            "issuer":   cert_issuer,
            "date":     cert_date,
            "reason":   None,
        }), 200

    # ─────────────────────────────────────────────────────────────
    # PATH 2: CREDLY — proxy failed, no badge_data
    # ─────────────────────────────────────────────────────────────
    if "credly.com/badges/" in url.lower():
        return jsonify({
            "is_valid": False,
            "reason": "Could not fetch badge details. Please try again in a moment."
        }), 200

    # ─────────────────────────────────────────────────────────────
    # PATH 3: LINKEDIN — page requires login, can't fetch
    # Use URL pattern only + relevance check with platform name
    # ─────────────────────────────────────────────────────────────
    if "linkedin.com" in url.lower():
        valid_url = "/certificates/" in url.lower() or "/learning/" in url.lower()
        if not valid_url:
            return jsonify({
                "is_valid": False,
                "reason": "Not a valid LinkedIn Learning certificate URL."
            }), 200

        # We can't read the course name — run relevance with platform only
        relevant, reason = _check_relevance(
            model,
            cert_name   = "LinkedIn Learning certificate",
            cert_issuer = "LinkedIn",
            cert_skills = skill,   # hint: user claims it covers this skill
            skill       = skill,
        )
        if relevant is False:
            return jsonify({
                "is_valid": False,
                "reason": reason or f"LinkedIn does not appear to offer certificates for '{skill}'."
            }), 200

        return jsonify({
            "is_valid": True,
            "skill":    skill,
            "issuer":   "LinkedIn Learning",
            "date":     None,
            "reason":   None,
        }), 200

    # ─────────────────────────────────────────────────────────────
    # PATH 4: UDEMY (ude.my) — JS-rendered, can't fetch page
    # Use URL pattern + relevance check with platform name
    # ─────────────────────────────────────────────────────────────
    if "ude.my" in url.lower() or "udemy.com" in url.lower():
        relevant, reason = _check_relevance(
            model,
            cert_name   = "Udemy certificate",
            cert_issuer = "Udemy",
            cert_skills = skill,
            skill       = skill,
        )
        if relevant is False:
            return jsonify({
                "is_valid": False,
                "reason": reason or f"Udemy does not appear to offer certificates for '{skill}'."
            }), 200

        return jsonify({
            "is_valid": True,
            "skill":    skill,
            "issuer":   "Udemy",
            "date":     None,
            "reason":   None,
        }), 200

    # ─────────────────────────────────────────────────────────────
    # PATH 5: ALL OTHER PLATFORMS (Coursera, Google, IBM, edX etc.)
    # Must have page_text — proxy fetched by browser
    # ─────────────────────────────────────────────────────────────
    if not page_text:
        return jsonify({
            "is_valid": False,
            "reason": "Could not load the certificate page. Please try again in a moment."
        }), 200

    if not model:
        return jsonify({
            "is_valid": False,
            "reason": "Verification service temporarily unavailable. Please try again."
        }), 200

    # Full Gemini check — reads actual course name from page content
    full_prompt = f"""
You are a senior technical recruiter verifying a certificate.

Platform: {platform}
Skill being claimed: "{skill}"

Certificate page content:
\"\"\"
{page_text[:3000]}
\"\"\"

─── TASK 1: AUTHENTICITY ───
Is this a real certificate/completion page?
✅ REAL: Shows course completion, credential award, learner name, badge earned
❌ NOT REAL: Login page, 404 error, homepage, marketing page, error message

─── TASK 2: EXTRACT COURSE NAME ───
Find the exact course or certificate name from the page content above.

─── TASK 3: RELEVANCE ───
Does the certificate's field match "{skill}"'s field?

Step A — What field does the extracted course name belong to?
Step B — What field does "{skill}" belong to?
Step C — Same field = true. Different field = false, always.

FIELD BOUNDARIES (strict):
• UX/UI Design → wireframing, Figma, user research, usability, interaction design
  NOT: AI, data analysis, Python, security, cloud
• AI/ML → LLMs, RAG, machine learning, NLP, generative AI, neural networks, embeddings
  NOT: UX, web dev, data analytics only, security, cloud
• Data Analytics → SQL, data analysis, Excel, Power BI, Tableau, statistics
  NOT: AI/ML models, UX, web dev, security
• Python/Backend → Python, Django, Flask, FastAPI, pandas
  NOT: UX, cloud infra, pure AI theory
• Web Dev → HTML, CSS, JavaScript, React, Vue, Node, REST API
  NOT: AI, data science, UX, security
• Cloud/DevOps → AWS, Azure, Docker, Kubernetes, CI/CD
  NOT: Python, UX, AI, data analysis
• Security → cybersecurity, ethical hacking, penetration testing
  NOT: AI, UX, web dev, data

EXAMPLES:
✅ "Getting Started with AI" + "open-source LLMs" → AI = AI
✅ "Python for Data Science" + "Django" → Python = Python
❌ "Foundations of UX Design" + "LLMs" → UX ≠ AI
❌ "Foundations of UX Design" + "data analysis" → UX ≠ Data
❌ "AWS Cloud Practitioner" + "React" → Cloud ≠ Web Dev

─── OUTPUT ───
Return ONLY this JSON:
{{
  "is_valid": true or false,
  "cert_name": "exact course name from the page",
  "issuer": "issuing organization",
  "date": "completion date if found, else null",
  "reason": "if false — state exactly: course name + field mismatch with skill. if true — null."
}}
"""
    raw_resp, error = _call_gemini(model, full_prompt, timeout=20)

    if error:
        print(f"⚠️ Gemini error: {error}")
        return jsonify({
            "is_valid": False,
            "reason": "Verification service busy. Please try again in a moment."
        }), 200

    result = _extract_json(raw_resp)
    if not result:
        return jsonify({
            "is_valid": False,
            "reason": "Could not parse verification result. Please try again."
        }), 200

    return jsonify({
        "is_valid": bool(result.get("is_valid", False)),
        "skill":    result.get("cert_name") or skill or None,
        "issuer":   result.get("issuer") or platform or None,
        "date":     result.get("date") or None,
        "reason":   result.get("reason") or None,
    }), 200