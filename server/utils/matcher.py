# server/utils/matcher.py

import os
import re
import google.generativeai as genai

# ======================================================
# GEMINI CONFIG
# ✅ FIX (Issue #16): Removed genai.configure() from module
# level. It was running at import time before .env was loaded,
# causing silent auth failures. Now configured lazily inside
# get_gemini_response() only when actually needed.
# ======================================================
GEMINI_MODEL = "gemini-2.5-flash"


def _get_gemini_model():
    """
    Lazily configure and return Gemini model.
    Returns None if API key is missing — never crashes import.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("⚠️ GEMINI_API_KEY not set — Gemini unavailable in matcher.py")
        return None
    try:
        genai.configure(api_key=api_key)
        return genai.GenerativeModel(GEMINI_MODEL)
    except Exception as e:
        print(f"⚠️ Gemini model init failed: {e}")
        return None


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
    "linux", "cloud", "backend", "frontend", "full stack",
    # ✅ NEW: LLM / GenAI / Agentic AI skills
    "llm", "large language model", "generative ai", "genai",
    "langchain", "llamaindex", "rag", "retrieval augmented generation",
    "prompt engineering", "embeddings", "vector database", "vector db",
    "chatbot", "autonomous agent", "agentic ai", "agentic",
    "hugging face", "openai", "gemini", "ollama", "fine tuning",
    "nlp", "natural language processing", "transformers",
    "crm", "erp", "automation", "workflow automation",
    "json", "open source"
}

DOMAIN_KEYWORDS = {
    "fullstack": {"react", "node", "frontend", "backend", "full stack"},
    "aiml":      {"machine learning", "ml", "ai", "tensorflow", "pytorch", "data",
                  "llm", "rag", "langchain", "llamaindex", "genai", "nlp",
                  "agentic", "embeddings", "chatbot"},
    "devops":    {"docker", "kubernetes", "aws", "ci/cd", "cloud"},
    "data":      {"sql", "data analysis", "data science", "analytics"}
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

    ✅ FIX (Issue #18): Original used substring matching
    e.g. "data" matched inside "update", "candidate", "validated"
    causing false positives on non-technical resumes, and
    "ml" matched inside "amily", "email", "formally".

    Now uses word boundaries via re.search() so only exact
    standalone words count as hits.

    ✅ FIX (Issue #7 from audit): Added more non-code tech terms
    so Data Analysts, Power BI users, and similar roles are
    not wrongly blocked.

    ✅ FIX (LLM/Agentic AI): Added full set of LLM, GenAI,
    RAG, Agentic AI, and automation keywords so that roles like
    "LLM SME", "AI Executive", "GenAI Engineer" are correctly
    detected as technical and not blocked.

    Threshold remains >= 3 hits.
    """
    if not text:
        return False

    technical_terms = [
        # Core languages
        r"\bpython\b", r"\bjava\b", r"\bjavascript\b", r"\btypescript\b",
        r"\bc\+\+\b", r"\bc#\b", r"\bphp\b", r"\bruby\b", r"\bswift\b",
        r"\bkotlin\b", r"\bscala\b", r"\bgolang\b", r"\brust\b",

        # Databases
        r"\bsql\b", r"\bmysql\b", r"\bpostgres\b", r"\bmongodb\b",
        r"\bnosql\b", r"\bredis\b", r"\bdynamodb\b",

        # Web / Frameworks
        r"\breact\b", r"\bnode\b", r"\bangular\b", r"\bvue\b",
        r"\bdjango\b", r"\bflask\b", r"\bspring\b", r"\bfastapi\b",
        r"\bexpress\b",

        # Infrastructure / DevOps
        r"\bapi\b", r"\brest\b", r"\bgraphql\b",
        r"\bbackend\b", r"\bfrontend\b", r"\bfull.?stack\b",
        r"\bcloud\b", r"\baws\b", r"\bazure\b", r"\bgcp\b",
        r"\bdocker\b", r"\bkubernetes\b", r"\bci.?cd\b", r"\blinux\b",
        r"\bdevops\b", r"\bterraform\b",

        # Data / ML (expanded — fixes Data Analyst blocking)
        r"\bmachine.?learning\b", r"\bdeep.?learning\b",
        r"\btensorflow\b", r"\bpytorch\b",
        r"\bdata.?science\b", r"\bdata.?engineer\b",
        r"\bdata.?analyst\b", r"\bdata.?analysis\b",
        r"\bpower.?bi\b", r"\btableau\b",
        r"\bstatistics\b", r"\bvisuali[sz]ation\b",

        # Tools
        r"\bgit\b", r"\bgithub\b", r"\bgitlab\b",
        r"\bjira\b", r"\bjenkins\b",

        # ✅ NEW: LLM / GenAI / Agentic AI terms
        r"\bllm\b", r"\blarge.?language.?model\b",
        r"\bgenerative.?ai\b", r"\bgen.?ai\b",
        r"\blangchain\b", r"\bllamaindex\b",
        r"\brag\b", r"\bretrieval.?augmented\b",
        r"\bprompt.?engineer\b", r"\bprompt\b",
        r"\bembedding\b", r"\bembeddings\b",
        r"\bvector.?database\b", r"\bvector.?db\b",
        r"\bchatbot\b", r"\bautonomous.?agent\b",
        r"\bagentic.?ai\b", r"\bagentic\b",
        r"\bhugging.?face\b", r"\bopenai\b",
        r"\bgemini\b", r"\bollama\b",
        r"\bfine.?tun\b",
        r"\bnlp\b", r"\bnatural.?language.?processing\b",
        r"\btransformer\b", r"\btransformers\b",
        r"\bopen.?source.?(llm|ai|model)\b",

        # ✅ NEW: Automation / Integration (catches CRM/ERP roles)
        r"\bcrm\b", r"\berp\b",
        r"\bworkflow.?automation\b", r"\benterprise.?automation\b",
        r"\bsystem.?integration\b",
        r"\bjson\b",
    ]

    normalized = normalize_text(text)
    hits = sum(
        1 for pattern in technical_terms
        if re.search(pattern, normalized)
    )

    print(f"🔍 is_technical_text: {hits} hits (threshold=3)")
    return hits >= 3


# ======================================================
# SKILL EXTRACTION
# ======================================================

def extract_skills(text: str) -> set:
    """
    Extract known skills from text using exact word matching.
    ✅ FIX: Uses word boundaries for multi-word skills too.
    """
    normalized = normalize_text(text)
    found = set()

    for skill in SKILL_SET:
        # Build a word-boundary pattern for each skill
        # e.g. "ml" → r"\bml\b", "full stack" → r"\bfull stack\b"
        pattern = r"\b" + re.escape(skill) + r"\b"
        if re.search(pattern, normalized):
            found.add(skill)

    return found


# ======================================================
# DOMAIN DETECTION
# ======================================================

def detect_domain(text: str) -> str:
    """
    Detect primary technical domain from text.
    ✅ FIX: Uses word boundary matching (same fix as extract_skills).
    """
    normalized = normalize_text(text)
    scores = {}

    for domain, keywords in DOMAIN_KEYWORDS.items():
        count = 0
        for kw in keywords:
            pattern = r"\b" + re.escape(kw) + r"\b"
            if re.search(pattern, normalized):
                count += 1
        scores[domain] = count

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
    project_signal = len(re.findall(r"\bproject\b", text))
    return min((skill_count * 10) + (project_signal * 5), 100)


# ======================================================
# CORE MATCHING ENGINE (DETERMINISTIC)
# ======================================================

def calculate_match_score(resume_text: str, jd_text: str) -> dict:
    """
    Deterministic skill-based match score.
    Used as fallback when Gemini is unavailable.
    """
    resume_text_n = normalize_text(resume_text)
    jd_text_n     = normalize_text(jd_text)

    resume_skills = extract_skills(resume_text_n)
    jd_skills     = extract_skills(jd_text_n)

    # ── Skill Match ──────────────────────────────────────────────
    skill_match = (
        (len(resume_skills & jd_skills) / len(jd_skills)) * 100
        if jd_skills else 0
    )

    # ── Domain Match ─────────────────────────────────────────────
    resume_domain = detect_domain(resume_text_n)
    jd_domain     = detect_domain(jd_text_n)

    domain_penalty = (
        0.6 if resume_domain != jd_domain and resume_domain != "unknown" else 1.0
    )

    # ── Quality Scores ────────────────────────────────────────────
    jd_quality     = jd_quality_score(jd_text)
    resume_quality = resume_quality_score(resume_text)

    # ── Adaptive Weights ─────────────────────────────────────────
    if jd_quality < 40:
        skill_w, role_w, exp_w = 0.25, 0.30, 0.30
    else:
        skill_w, role_w, exp_w = 0.50, 0.15, 0.20

    final_score = (
        skill_match    * skill_w +
        resume_quality * exp_w   +
        jd_quality     * role_w
    ) * domain_penalty

    final_score = round(min(final_score, 100), 2)

    return {
        "final_score":    final_score,
        "skill_match":    round(skill_match, 2),
        "missing_skills": sorted(jd_skills - resume_skills),
        "resume_domain":  resume_domain,
        "jd_domain":      jd_domain
    }


# ======================================================
# GEMINI – EXPLANATION ONLY (FAIL-SAFE)
# ======================================================

def get_gemini_response(resume_text: str, jd_text: str) -> str:
    """
    Gemini is OPTIONAL — provides gap explanation only.
    Failure must NEVER break upload or scoring.

    ✅ FIX (Issue #16): Model is now created inside the function
    using _get_gemini_model() instead of at module import time.
    This prevents silent auth failures when .env loads after import.
    """
    try:
        model = _get_gemini_model()
        if not model:
            return ""

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
        response = model.generate_content(prompt)
        return response.text.strip()

    except Exception as e:
        print(f"⚠️ Gemini failed safely in matcher: {e}")
        return ""