import re

# --------------------------------------------------
# 🔍 EXPERIENCE LEVEL DETECTION
# --------------------------------------------------
def detect_experience_level(jd_text: str) -> str:
    """
    Detect whether the job is for a fresher or experienced candidate.
    Defaults safely to 'fresher'.
    """

    if not jd_text:
        return "fresher"

    text = jd_text.lower()

    # ✅ Strong signals for experienced roles (checked FIRST)
    experienced_patterns = [
        r"\b\d+\s*\+?\s*years?\b",          # e.g. "3+ years", "5 years"
        r"\bminimum\s+\d+\s+years?\b",      # e.g. "minimum 2 years"
        r"\bat\s+least\s+\d+\s+years?\b",   # e.g. "at least 4 years"
        r"\bover\s+\d+\s+years?\b",         # e.g. "over 3 years"
        r"\bexperienced\b",
        r"\bsenior\b",
        r"\blead\b",
        r"\bmanager\b"
    ]

    # ✅ Fresher / early career signals
    fresher_patterns = [
        r"\bfresher\b",
        r"\bentry[- ]?level\b",
        r"\b0\s*[-–]?\s*1\s*years?\b",
        r"\brecent graduate\b",
        r"\bgraduate trainee\b",
        r"\bjunior\b",
        r"\bintern\b"
    ]

    for pattern in experienced_patterns:
        if re.search(pattern, text):
            return "experienced"

    for pattern in fresher_patterns:
        if re.search(pattern, text):
            return "fresher"

    # ✅ Safe default
    return "fresher"


# --------------------------------------------------
# 🧠 ROLE TYPE DETECTION
# --------------------------------------------------
def detect_role_type(jd_text: str) -> str:
    """
    Detect whether the role is technical or non-technical.
    More accurate for Data / Business roles.
    """

    if not jd_text:
        return "non-technical"

    text = jd_text.lower()

    # ✅ Core engineering / development keywords
    hardcore_technical = [
        "backend", "frontend", "full stack",
        "api", "rest", "graphql",
        "microservices",
        "react", "angular", "vue",
        "node", "django", "flask", "spring",
        "docker", "kubernetes", "devops",
        "ci/cd", "linux"
    ]

    # ✅ Programming / data tools (lighter technical)
    data_technical = [
        "python", "sql", "nosql",
        "data analyst", "data analysis",
        "data science", "data engineer",
        "power bi", "tableau", "excel",
        "statistics", "visualization"
    ]

    # ✅ Purely non-technical / business roles
    non_technical_keywords = [
        "hr", "human resources",
        "marketing", "sales",
        "operations", "customer support",
        "content", "recruiter",
        "finance", "accounting"
    ]

    # 🔥 Priority logic (IMPORTANT)
    for kw in non_technical_keywords:
        if re.search(rf"\b{re.escape(kw)}\b", text):
            return "non-technical"

    for kw in hardcore_technical:
        if re.search(rf"\b{re.escape(kw)}\b", text):
            return "technical"

    for kw in data_technical:
        if re.search(rf"\b{re.escape(kw)}\b", text):
            return "technical"

    return "non-technical"

# --------------------------------------------------
# 🏢 COMPANY TYPE DETECTION
# --------------------------------------------------
def detect_company_type(jd_text: str) -> str:
    """
    Detect if the company is a tech giant, startup, or general company.
    Returns: 'tech_giant', 'startup', or 'general'
    """
    if not jd_text:
        return "general"

    text = jd_text.lower()

    # Well-known tech giants
    tech_giants = [
        "google", "microsoft", "amazon", "meta", "facebook", 
        "apple", "netflix", "adobe", "salesforce", "oracle",
        "ibm", "intel", "nvidia", "tesla", "uber", "airbnb",
        "twitter", "linkedin", "snap", "spotify", "shopify",
        "stripe", "twilio", "zoom", "slack", "atlassian"
    ]

    # Startup indicators
    startup_indicators = [
        r"\bstartup\b", r"\bearly[- ]stage\b", r"\bseed[- ]funded\b",
        r"\bseries\s+[a-c]\b", r"\bfast[- ]paced\b", r"\brapid growth\b",
        r"\bfounding team\b", r"\bwearing multiple hats\b"
    ]

    # Check for tech giants
    for company in tech_giants:
        if re.search(rf"\b{re.escape(company)}\b", text):
            return "tech_giant"

    # Check for startup indicators
    for pattern in startup_indicators:
        if re.search(pattern, text):
            return "startup"

    return "general"


# --------------------------------------------------
# 📋 EXTRACT COMPANY NAME
# --------------------------------------------------
def extract_company_name(jd_text: str) -> str:
    """
    Try to extract company name from JD.
    Returns the company name or 'Company' as default.
    """
    if not jd_text:
        return "Company"

    # Common patterns for company names in JDs
    patterns = [
        r"(?:at|for|join)\s+([A-Z][A-Za-z0-9\s&.]{2,30}?)(?:\s+is|\s+seeks|\s+we|\s+our|\n|$)",
        r"^([A-Z][A-Za-z0-9\s&.]{2,30}?)(?:\s+is\s+(?:hiring|looking|seeking))",
        r"(?:company|about)\s*:\s*([A-Z][A-Za-z0-9\s&.]{2,30})",
    ]

    for pattern in patterns:
        match = re.search(pattern, jd_text, re.MULTILINE)
        if match:
            company = match.group(1).strip()
            # Clean up common suffixes
            company = re.sub(r'\s+(Inc|LLC|Ltd|Corp|Corporation|Company)\.?$', '', company)
            if len(company) > 2:
                return company

    return "Company"


# --------------------------------------------------
# 🗺️ EXTRACT INTERVIEW PROCESS FROM JD
# --------------------------------------------------
def extract_interview_process_from_jd(jd_text: str) -> list:
    """
    Extract interview process stages mentioned in the JD.
    Returns list of stage dictionaries or None if not found.
    """
    if not jd_text:
        return None

    text = jd_text.lower()
    
    # Look for interview process section
    process_patterns = [
        r"interview\s+process[:\s]+(.*?)(?:\n\n|\Z)",
        r"hiring\s+process[:\s]+(.*?)(?:\n\n|\Z)",
        r"selection\s+process[:\s]+(.*?)(?:\n\n|\Z)",
        r"recruitment\s+process[:\s]+(.*?)(?:\n\n|\Z)"
    ]

    process_text = None
    for pattern in process_patterns:
        match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
        if match:
            process_text = match.group(1)
            break

    if not process_text:
        return None

    # Extract stages from the process text
    stages = []
    stage_keywords = [
        "screening", "resume", "phone", "technical", "coding", 
        "assessment", "aptitude", "group discussion", "gd",
        "hr round", "behavioral", "final", "onsite", "cultural fit"
    ]

    lines = process_text.split('\n')
    for line in lines:
        line = line.strip()
        if not line or len(line) < 5:
            continue
            
        for keyword in stage_keywords:
            if keyword in line.lower():
                stage_name = line.strip('- •*0123456789.)').strip()
                if stage_name and len(stage_name) > 3:
                    stages.append({
                        "stage": stage_name.capitalize(),
                        "duration": "To be confirmed",
                        "description": f"Details about {stage_name}",
                        "tips": ["Prepare thoroughly for this stage"]
                    })
                    break

    return stages if stages else None


# --------------------------------------------------
# 🎯 GET DEFAULT INTERVIEW PROCESS
# --------------------------------------------------
def get_default_interview_process(company_type: str, role_type: str) -> list:
    """
    Get default interview process based on company type and role type.
    Returns list of stage dictionaries.
    """
    
    # Tech Giant Process
    if company_type == "tech_giant":
        return [
            {
                "stage": "Resume Screening",
                "duration": "1-2 weeks",
                "description": "HR reviews your resume and cover letter for basic qualifications",
                "tips": [
                    "Tailor your resume to match the job description keywords",
                    "Highlight relevant technical skills and achievements with metrics"
                ]
            },
            {
                "stage": "Online Assessment",
                "duration": "1-2 hours",
                "description": "Automated coding challenges and aptitude tests",
                "tips": [
                    "Practice data structures and algorithms on LeetCode",
                    "Manage your time effectively during the test"
                ]
            },
            {
                "stage": "Phone/Video Screening",
                "duration": "30-45 minutes",
                "description": "Initial conversation with recruiter about your background",
                "tips": [
                    "Research the company culture and recent news",
                    "Prepare your elevator pitch"
                ]
            },
            {
                "stage": "Technical Interview Round 1",
                "duration": "45-60 minutes",
                "description": "Coding interview focused on problem-solving and algorithms",
                "tips": [
                    "Think out loud while solving problems",
                    "Ask clarifying questions"
                ]
            },
            {
                "stage": "Technical Interview Round 2",
                "duration": "45-60 minutes",
                "description": "System design or advanced technical concepts",
                "tips": [
                    "Study system design fundamentals",
                    "Discuss trade-offs in your solutions"
                ]
            },
            {
                "stage": "Behavioral/Leadership Round",
                "duration": "45-60 minutes",
                "description": "Assessment of soft skills and cultural fit",
                "tips": [
                    "Use STAR method for behavioral questions",
                    "Research company values"
                ]
            },
            {
                "stage": "Final HR Round",
                "duration": "30 minutes",
                "description": "Compensation discussion and final questions",
                "tips": [
                    "Research market salary rates",
                    "Prepare questions about team and growth"
                ]
            }
        ]
    
    # Startup Process
    elif company_type == "startup":
        return [
            {
                "stage": "Resume Screening",
                "duration": "3-7 days",
                "description": "Quick review by founders or team leads",
                "tips": [
                    "Highlight ability to wear multiple hats",
                    "Show examples of initiative"
                ]
            },
            {
                "stage": "Initial Call",
                "duration": "20-30 minutes",
                "description": "Informal conversation with hiring manager",
                "tips": [
                    "Show enthusiasm for the startup's mission",
                    "Be ready to discuss why you want to join a startup"
                ]
            },
            {
                "stage": "Technical/Skills Assessment",
                "duration": "1-2 hours",
                "description": "Practical test or take-home assignment",
                "tips": [
                    "Focus on working solutions",
                    "Document your thought process"
                ]
            },
            {
                "stage": "Team Interview",
                "duration": "45-60 minutes",
                "description": "Meet with potential teammates",
                "tips": [
                    "Ask about team dynamics",
                    "Demonstrate collaborative mindset"
                ]
            },
            {
                "stage": "Founder/Leadership Round",
                "duration": "30-45 minutes",
                "description": "Discussion about vision and culture",
                "tips": [
                    "Show alignment with company vision",
                    "Ask about growth trajectory"
                ]
            },
            {
                "stage": "Offer Discussion",
                "duration": "As needed",
                "description": "Compensation, equity, and role clarification",
                "tips": [
                    "Understand equity package",
                    "Clarify role expectations"
                ]
            }
        ]
    
    # General Company Process
    else:
        if role_type == "technical":
            return [
                {
                    "stage": "Resume Screening",
                    "duration": "1-2 weeks",
                    "description": "HR reviews applications for qualifications",
                    "tips": [
                        "Show relevant technical skills clearly",
                        "Include keywords from job description"
                    ]
                },
                {
                    "stage": "Aptitude Test",
                    "duration": "1 hour",
                    "description": "General aptitude and basic technical questions",
                    "tips": [
                        "Practice quantitative aptitude",
                        "Review fundamental concepts"
                    ]
                },
                {
                    "stage": "Technical Interview",
                    "duration": "45-60 minutes",
                    "description": "Assessment of technical knowledge",
                    "tips": [
                        "Review core concepts in your stack",
                        "Prepare to explain past projects"
                    ]
                },
                {
                    "stage": "HR Interview",
                    "duration": "30-45 minutes",
                    "description": "Discussion about expectations and salary",
                    "tips": [
                        "Be honest about expectations",
                        "Prepare questions about culture"
                    ]
                }
            ]
        else:
            return [
                {
                    "stage": "Resume Screening",
                    "duration": "1-2 weeks",
                    "description": "Initial review by HR",
                    "tips": [
                        "Highlight relevant experience",
                        "Keep resume well-formatted"
                    ]
                },
                {
                    "stage": "Aptitude Test",
                    "duration": "1 hour",
                    "description": "Logical reasoning and domain knowledge",
                    "tips": [
                        "Practice sample questions online",
                        "Manage time during test"
                    ]
                },
                {
                    "stage": "Group Discussion",
                    "duration": "20-30 minutes",
                    "description": "Group activity to assess communication",
                    "tips": [
                        "Listen actively",
                        "Contribute meaningfully"
                    ]
                },
                {
                    "stage": "Personal Interview",
                    "duration": "30-45 minutes",
                    "description": "One-on-one discussion about background",
                    "tips": [
                        "Use STAR method",
                        "Show genuine interest"
                    ]
                },
                {
                    "stage": "HR Round",
                    "duration": "20-30 minutes",
                    "description": "Final discussion about compensation",
                    "tips": [
                        "Discuss salary expectations",
                        "Ask about benefits"
                    ]
                }
            ]









































import re

# # --------------------------------------------------
# # 🔍 EXPERIENCE LEVEL DETECTION
# # --------------------------------------------------
# def detect_experience_level(jd_text: str) -> str:
#     """
#     Detect whether the job is for a fresher or experienced candidate.
#     Defaults safely to 'fresher'.
#     """

#     if not jd_text:
#         return "fresher"

#     text = jd_text.lower()

#     # ✅ Strong signals for experienced roles (checked FIRST)
#     experienced_patterns = [
#         r"\b\d+\s*\+\s*years?\b",
#         r"\bminimum\s+\d+\s+years?\b",
#         r"\bat\s+least\s+\d+\s+years?\b",
#         r"\bexperienced\b",
#         r"\bsenior\b",
#         r"\blead\b",
#         r"\bmanager\b"
#     ]

#     # ✅ Fresher / early career signals
#     fresher_patterns = [
#         r"\bfresher\b",
#         r"\bentry[- ]?level\b",
#         r"\b0\s*[-–]?\s*1\s*years?\b",
#         r"\brecent graduate\b",
#         r"\bgraduate trainee\b",
#         r"\bjunior\b",
#         r"\bintern\b"
#     ]

#     for pattern in experienced_patterns:
#         if re.search(pattern, text):
#             return "experienced"

#     for pattern in fresher_patterns:
#         if re.search(pattern, text):
#             return "fresher"

#     # ✅ Safe default
#     return "fresher"


# # --------------------------------------------------
# # 🧠 ROLE TYPE DETECTION
# # --------------------------------------------------
# def detect_role_type(jd_text: str) -> str:
#     """
#     Detect whether the role is technical or non-technical.
#     More accurate for Data / Business roles.
#     """

#     if not jd_text:
#         return "non-technical"

#     text = jd_text.lower()

#     # ✅ Core engineering / development keywords
#     hardcore_technical = [
#         "backend", "frontend", "full stack",
#         "api", "rest", "graphql",
#         "microservices",
#         "react", "angular", "vue",
#         "node", "django", "flask", "spring",
#         "docker", "kubernetes", "devops",
#         "ci/cd", "linux"
#     ]

#     # ✅ Programming / data tools (lighter technical)
#     data_technical = [
#         "python", "sql", "nosql",
#         "data analyst", "data analysis",
#         "data science", "data engineer",
#         "power bi", "tableau", "excel",
#         "statistics", "visualization"
#     ]

#     # ✅ Purely non-technical / business roles
#     non_technical_keywords = [
#         "hr", "human resources",
#         "marketing", "sales",
#         "business analyst",
#         "operations", "customer support",
#         "content", "recruiter",
#         "finance", "accounting"
#     ]

#     # 🔥 Priority logic (IMPORTANT)
#     for kw in non_technical_keywords:
#         if kw in text:
#             return "non-technical"

#     for kw in hardcore_technical:
#         if kw in text:
#             return "technical"

#     for kw in data_technical:
#         if kw in text:
#             return "technical"

#     return "non-technical"
