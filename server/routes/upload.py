import os
import sys
import re
import uuid
import traceback
import hashlib
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename

# -------------------------------------------------
# Path setup
# -------------------------------------------------
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# -------------------------------------------------
# Firebase setup
# -------------------------------------------------
import firebase_admin
from firebase_admin import credentials, firestore, auth

firebase_key_path = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..', 'serviceAccountKey.json')
)

if not firebase_admin._apps:
    cred = credentials.Certificate(firebase_key_path)
    firebase_admin.initialize_app(cred)

db = firestore.client()

# -------------------------------------------------
# Utilities
# -------------------------------------------------
# ✅ FIX: Import new exception classes from updated extract_text.py
from utils.extract_text import extract_text, ScannedPDFError, EncryptedPDFError, CorruptedFileError
from utils.gemini_utils import analyze_with_gemini
from utils.matcher import is_technical_text

upload_blueprint = Blueprint('upload', __name__)

# -------------------------------------------------
# Upload folder
# -------------------------------------------------
UPLOAD_FOLDER = "/tmp/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_RESUME_EXTENSIONS = {'pdf', 'docx'}
ALLOWED_JD_EXTENSIONS = {'pdf', 'docx', 'txt'}

# -------------------------------------------------
# Validation constants
# ✅ FIX: MIN_JD_LENGTH synced to 100 to match frontend (was 50)
# ✅ FIX: Added MAX_FILE_SIZE for backend enforcement (T1.7, T2.1)
# -------------------------------------------------
MIN_RESUME_LENGTH = 100
MIN_JD_LENGTH     = 100        # was 50 — now matches UploadResume.jsx validation
MAX_JD_LENGTH     = 50000
MAX_FILE_SIZE     = 10 * 1024 * 1024   # 10MB


# -------------------------------------------------
# Helpers
# -------------------------------------------------

def allowed_file(filename, allowed_exts):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_exts


def generate_scan_hash(user_id, resume_text, jd_text):
    combined = f"{user_id}|{resume_text.strip()}|{jd_text.strip()}"
    return hashlib.sha256(combined.encode("utf-8")).hexdigest()


def cleanup_files(*file_paths):
    """Safely remove uploaded temp files"""
    for path in file_paths:
        try:
            if path and os.path.exists(path):
                os.remove(path)
        except Exception as e:
            print(f"⚠️ Cleanup warning for {path}: {e}")


def sanitize_text(text):
    """Remove null bytes and normalize whitespace"""
    if not text:
        return ""
    text = text.replace('\x00', '')
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def unique_filename(user_id, original_name):
    """
    ✅ FIX: Generate unique filename to prevent collision between
    concurrent users uploading files with the same name (Issue #2).
    Format: {short_uid}_{uuid}_{original_name}
    """
    safe_name = secure_filename(original_name)
    unique_prefix = f"{user_id[:8]}_{uuid.uuid4().hex[:8]}_"
    return unique_prefix + safe_name


# -------------------------------------------------
# 🚀 UPLOAD ROUTE
# -------------------------------------------------
@upload_blueprint.route('/upload', methods=['POST'])
def upload_files():
    resume_path = None
    jd_path = None

    try:

        # ════════════════════════════════════════
        # 1. AUTH
        # ════════════════════════════════════════
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"valid": False, "message": "Unauthorized"}), 401

        try:
            id_token = auth_header.split("Bearer ")[1]
            decoded_token = auth.verify_id_token(id_token)
            user_id = decoded_token["uid"]
        except auth.ExpiredIdTokenError:
            return jsonify({
                "valid": False,
                "message": "Your session has expired. Please log in again."
            }), 401
        except Exception as e:
            print(f"❌ Auth error: {e}")
            return jsonify({
                "valid": False,
                "message": "Invalid or expired authentication token. Please log in again."
            }), 401

        # ════════════════════════════════════════
        # 2. FILE PRESENCE CHECK
        # ════════════════════════════════════════
        if 'resume' not in request.files or 'jd' not in request.files:
            return jsonify({"valid": False, "message": "Resume and JD are both required."}), 400

        resume = request.files['resume']
        jd     = request.files['jd']

        if resume.filename == '':
            return jsonify({"valid": False, "message": "No resume file selected."}), 400
        if jd.filename == '':
            return jsonify({"valid": False, "message": "No job description file selected."}), 400

        # ════════════════════════════════════════
        # 3. EXTENSION VALIDATION
        # ════════════════════════════════════════
        resume_name = secure_filename(resume.filename)
        jd_name     = secure_filename(jd.filename)

        if not allowed_file(resume_name, ALLOWED_RESUME_EXTENSIONS):
            return jsonify({
                "valid": False,
                "message": "Invalid resume format. Only PDF and DOCX files are allowed."
            }), 400

        if not allowed_file(jd_name, ALLOWED_JD_EXTENSIONS):
            return jsonify({
                "valid": False,
                "message": "Invalid job description format. Only PDF, DOCX, and TXT files are allowed."
            }), 400

        # ════════════════════════════════════════
        # 4. FILE SIZE VALIDATION (T1.7, T2.1)
        # ✅ FIX: Backend now enforces 10MB limit independently
        # of frontend — prevents server overload if frontend bypassed
        # ════════════════════════════════════════
        resume.seek(0, 2)           # Seek to end to get size
        resume_size = resume.tell()
        resume.seek(0)              # Reset for saving

        jd.seek(0, 2)
        jd_size = jd.tell()
        jd.seek(0)

        if resume_size == 0:
            return jsonify({
                "valid": False,
                "message": "Resume file is empty. Please upload a valid resume."
            }), 400

        if resume_size > MAX_FILE_SIZE:
            size_mb = resume_size / (1024 * 1024)
            return jsonify({
                "valid": False,
                "message": f"Resume file is too large ({size_mb:.1f}MB). Maximum size is 10MB. "
                           f"Tip: Compress your PDF or remove embedded images."
            }), 413

        if jd_size == 0:
            return jsonify({
                "valid": False,
                "message": "Job description file is empty. Please upload a valid file."
            }), 400

        if jd_size > MAX_FILE_SIZE:
            size_mb = jd_size / (1024 * 1024)
            return jsonify({
                "valid": False,
                "message": f"Job description file is too large ({size_mb:.1f}MB). Maximum size is 10MB."
            }), 413

        # ════════════════════════════════════════
        # 5. SAVE FILES
        # ✅ FIX: Unique filenames prevent collision between
        # concurrent users uploading resume.pdf at same time (Issue #2)
        # ════════════════════════════════════════
        resume_unique_name = unique_filename(user_id, resume_name)
        jd_unique_name     = unique_filename(user_id, jd_name)

        resume_path = os.path.join(UPLOAD_FOLDER, resume_unique_name)
        jd_path     = os.path.join(UPLOAD_FOLDER, jd_unique_name)

        resume.save(resume_path)
        jd.save(jd_path)

        print(f"📁 Saved: {resume_unique_name}, {jd_unique_name}")

        # ════════════════════════════════════════
        # 6. TEXT EXTRACTION
        # ✅ FIX: Now catches EncryptedPDFError and CorruptedFileError
        # separately so users get the correct error message (T1.6, T1.9, T2.5)
        # ════════════════════════════════════════

        # -- Resume extraction --
        try:
            resume_text = extract_text(resume_path)

        except EncryptedPDFError as e:
            cleanup_files(resume_path, jd_path)
            return jsonify({
                "valid": False,
                "message": str(e)
            }), 400

        except CorruptedFileError as e:
            cleanup_files(resume_path, jd_path)
            return jsonify({
                "valid": False,
                "message": str(e)
            }), 400

        except ScannedPDFError as e:
            cleanup_files(resume_path, jd_path)
            return jsonify({
                "valid": False,
                "message": str(e)
            }), 400

        except (ValueError, RuntimeError) as e:
            cleanup_files(resume_path, jd_path)
            return jsonify({
                "valid": False,
                "message": str(e)
            }), 400

        # -- JD extraction --
        try:
            jd_text = extract_text(jd_path)

        except EncryptedPDFError as e:
            cleanup_files(resume_path, jd_path)
            return jsonify({
                "valid": False,
                "message": f"Job Description error: {str(e)}"
            }), 400

        except CorruptedFileError as e:
            cleanup_files(resume_path, jd_path)
            return jsonify({
                "valid": False,
                "message": f"Job Description error: {str(e)}"
            }), 400

        except ScannedPDFError as e:
            cleanup_files(resume_path, jd_path)
            return jsonify({
                "valid": False,
                "message": f"Job Description error: {str(e)}"
            }), 400

        except (ValueError, RuntimeError) as e:
            cleanup_files(resume_path, jd_path)
            return jsonify({
                "valid": False,
                "message": f"Job Description error: {str(e)}"
            }), 400

        # ════════════════════════════════════════
        # 7. SANITIZE
        # ════════════════════════════════════════
        resume_text = sanitize_text(resume_text)
        jd_text     = sanitize_text(jd_text)

        # ════════════════════════════════════════
        # 8. TEXT LENGTH VALIDATION
        # ════════════════════════════════════════
        if not resume_text:
            cleanup_files(resume_path, jd_path)
            return jsonify({
                "valid": False,
                "message": "Resume appears to be empty or image-based. Please upload a text-based resume."
            }), 400

        if not jd_text:
            cleanup_files(resume_path, jd_path)
            return jsonify({
                "valid": False,
                "message": "Job description appears to be empty. Please upload a valid job description."
            }), 400

        if len(resume_text) < MIN_RESUME_LENGTH:
            cleanup_files(resume_path, jd_path)
            return jsonify({
                "valid": False,
                "message": f"Resume is too short ({len(resume_text)} characters). "
                           f"Please upload a complete resume (minimum {MIN_RESUME_LENGTH} characters)."
            }), 400

        if len(jd_text) < MIN_JD_LENGTH:
            cleanup_files(resume_path, jd_path)
            return jsonify({
                "valid": False,
                "message": f"Job description is too short ({len(jd_text)} characters). "
                           f"Please provide a complete job posting (minimum {MIN_JD_LENGTH} characters)."
            }), 400

        if len(jd_text) > MAX_JD_LENGTH:
            cleanup_files(resume_path, jd_path)
            return jsonify({
                "valid": False,
                "message": f"Job description is too long ({len(jd_text):,} characters). "
                           f"Maximum allowed is {MAX_JD_LENGTH:,} characters."
            }), 400

        # ════════════════════════════════════════
        # 9. TECH VALIDATION
        # ✅ FIX: Rewrote this block with 4 clear scenarios:
        #
        #   Scenario A — Both technical       → ✅ ALLOW (normal case)
        #   Scenario B — JD tech, resume not  → ❌ BLOCK (resume lacks tech skills)
        #   Scenario C — Resume tech, JD not  → ❌ BLOCK (wrong JD uploaded)
        #   Scenario D — Neither is technical → ❌ BLOCK (app is for tech roles only)
        #
        # OLD BUG: The original code only checked C and B, but
        # missing scenario D meant two non-tech uploads could
        # slip through silently. Also, the keyword list in
        # is_technical_text() was missing all LLM/GenAI/Agentic
        # terms, causing roles like "LLM SME" to be falsely
        # flagged as non-technical (the SkyMeric JD bug).
        # That is now fixed in matcher.py.
        # ════════════════════════════════════════
        resume_is_tech = is_technical_text(resume_text)
        jd_is_tech     = is_technical_text(jd_text)

        print(f"🔎 resume_is_tech={resume_is_tech} | jd_is_tech={jd_is_tech}")

        # Scenario D: Neither is technical — app supports tech roles only
        if not resume_is_tech and not jd_is_tech:
            cleanup_files(resume_path, jd_path)
            return jsonify({
                "valid": False,
                "message": "Both your resume and job description appear to be for non-technical roles. "
                           "JobMorph currently supports technical roles only (software, data, AI/ML, DevOps, etc.)."
            }), 400

        # Scenario B: JD is technical but resume isn't
        if not resume_is_tech and jd_is_tech:
            cleanup_files(resume_path, jd_path)
            return jsonify({
                "valid": False,
                "message": "Your resume does not appear to contain technical skills "
                           "matching this job description. Please ensure your resume "
                           "lists relevant technical skills."
            }), 400

        # Scenario C: Resume is technical but JD isn't
        if resume_is_tech and not jd_is_tech:
            cleanup_files(resume_path, jd_path)
            return jsonify({
                "valid": False,
                "message": "The job description does not appear to be for a technical role. "
                           "Please upload a technical job description."
            }), 400

        # Scenario A: Both technical — proceed ✅

        # ════════════════════════════════════════
        # 10. GEMINI ANALYSIS
        # ════════════════════════════════════════
        try:
            gemini_result = analyze_with_gemini(resume_text, jd_text) or {}
        except Exception as e:
            print(f"❌ Gemini API error: {e}")
            cleanup_files(resume_path, jd_path)
            return jsonify({
                "valid": False,
                "message": "AI analysis service is temporarily unavailable. Please try again in a moment."
            }), 503

        gemini_score      = gemini_result.get("score", 0)
        missing_keywords  = gemini_result.get("missing_keywords", [])
        suggestions       = gemini_result.get("suggestions", [])
        learning_resources = gemini_result.get("learning_resources", [])
        is_fallback       = gemini_result.get("is_fallback", False)

        # ════════════════════════════════════════
        # 11. FIRESTORE SAVE
        # ✅ FIX: jd_text truncated to 5000 chars to stay well
        # within Firestore 1MB document limit (Issue #8 from audit)
        # ════════════════════════════════════════
        scan_hash = generate_scan_hash(user_id, resume_text, jd_text)

        try:
            db.collection("resume_analysis").document(scan_hash).set({
                "user_id":                   user_id,
                "resume_name":               resume_name,        # original name for display
                "jd_name":                   jd_name,
                "jd_text":                   jd_text[:5000],     # truncated for storage

                "gemini_score":              gemini_score,
                "gemini_missing_keywords":   missing_keywords,
                "gemini_suggestions":        suggestions,
                "gemini_learning_resources": learning_resources,
                "is_fallback_score":         is_fallback,        # frontend can show warning

                "timestamp": firestore.SERVER_TIMESTAMP
            })
        except Exception as e:
            print(f"❌ Firestore save error: {e}")
            cleanup_files(resume_path, jd_path)
            return jsonify({
                "valid": False,
                "message": "Failed to save analysis results. Please try again."
            }), 500

        # ════════════════════════════════════════
        # 12. SUCCESS
        # ════════════════════════════════════════
        cleanup_files(resume_path, jd_path)

        print(f"✅ Analysis complete — score: {gemini_score}, doc: {scan_hash[:12]}...")

        return jsonify({
            "valid":  True,
            "doc_id": scan_hash
        }), 200

    except Exception as e:
        print(f"❌ Unexpected error in upload: {e}")
        traceback.print_exc()
        cleanup_files(resume_path, jd_path)
        return jsonify({
            "valid": False,
            "message": "An unexpected error occurred. Please try again or contact support."
        }), 500
    

    
# import os
# import sys
# import traceback
# import hashlib
# from flask import Blueprint, request, jsonify
# from werkzeug.utils import secure_filename

# # -------------------------------------------------
# # Path setup
# # -------------------------------------------------
# sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# # -------------------------------------------------
# # Firebase setup
# # -------------------------------------------------
# import firebase_admin
# from firebase_admin import credentials, firestore, auth

# firebase_key_path = os.path.abspath(
#     os.path.join(os.path.dirname(__file__), '..', 'serviceAccountKey.json')
# )

# if not firebase_admin._apps:
#     cred = credentials.Certificate(firebase_key_path)
#     firebase_admin.initialize_app(cred)

# db = firestore.client()

# # -------------------------------------------------
# # Utilities
# # -------------------------------------------------
# from utils.extract_text import extract_text, ScannedPDFError
# from utils.gemini_utils import analyze_with_gemini
# from utils.matcher import is_technical_text

# upload_blueprint = Blueprint('upload', __name__)

# # -------------------------------------------------
# # ✅ FIXED: App Engine–safe upload folder
# # -------------------------------------------------
# UPLOAD_FOLDER = "/tmp/uploads"
# os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ALLOWED_RESUME_EXTENSIONS = {'pdf', 'docx'}
# ALLOWED_JD_EXTENSIONS = {'pdf', 'docx', 'txt'}

# # ✅ NEW: Constants for validation
# MIN_RESUME_LENGTH = 100
# MIN_JD_LENGTH = 50
# MAX_JD_LENGTH = 50000


# def allowed_file(filename, allowed_exts):
#     return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_exts


# def generate_scan_hash(user_id, resume_text, jd_text):
#     combined = f"{user_id}|{resume_text.strip()}|{jd_text.strip()}"
#     return hashlib.sha256(combined.encode("utf-8")).hexdigest()


# # ✅ NEW: Helper to clean up files
# def cleanup_files(*file_paths):
#     """Safely remove uploaded files"""
#     for path in file_paths:
#         try:
#             if path and os.path.exists(path):
#                 os.remove(path)
#         except Exception as e:
#             print(f"⚠️ Cleanup warning for {path}: {e}")


# # ✅ NEW: Helper to sanitize text
# def sanitize_text(text):
#     """Remove null bytes and excessive whitespace"""
#     if not text:
#         return ""
#     # Remove null bytes
#     text = text.replace('\x00', '')
#     # Remove excessive whitespace
#     import re
#     text = re.sub(r'\s+', ' ', text)
#     return text.strip()


# # -------------------------------------------------
# # 🚀 UPLOAD ROUTE (PRODUCTION SAFE)
# # -------------------------------------------------
# @upload_blueprint.route('/upload', methods=['POST'])
# def upload_files():
#     resume_path = None
#     jd_path = None
    
#     try:
#         # ---------------- AUTH ----------------
#         auth_header = request.headers.get("Authorization")
#         if not auth_header or not auth_header.startswith("Bearer "):
#             return jsonify({"valid": False, "message": "Unauthorized"}), 401

#         # ✅ FIXED: Better auth error handling
#         try:
#             id_token = auth_header.split("Bearer ")[1]
#             decoded_token = auth.verify_id_token(id_token)
#             user_id = decoded_token["uid"]
#         except Exception as e:
#             print(f"❌ Auth error: {e}")
#             return jsonify({
#                 "valid": False, 
#                 "message": "Invalid or expired authentication token. Please log in again."
#             }), 401

#         # ---------------- FILE CHECK ----------------
#         if 'resume' not in request.files or 'jd' not in request.files:
#             return jsonify({"valid": False, "message": "Resume and JD required"}), 400

#         resume = request.files['resume']
#         jd = request.files['jd']

#         resume_name = secure_filename(resume.filename)
#         jd_name = secure_filename(jd.filename)

#         if not allowed_file(resume_name, ALLOWED_RESUME_EXTENSIONS):
#             return jsonify({"valid": False, "message": "Invalid resume format"}), 400

#         if not allowed_file(jd_name, ALLOWED_JD_EXTENSIONS):
#             return jsonify({"valid": False, "message": "Invalid JD format"}), 400

#         resume_path = os.path.join(UPLOAD_FOLDER, resume_name)
#         jd_path = os.path.join(UPLOAD_FOLDER, jd_name)

#         resume.save(resume_path)
#         jd.save(jd_path)

#         # ---------------- TEXT EXTRACTION ----------------
#         try:
#             resume_text = extract_text(resume_path)
#         except ScannedPDFError as e:
#             cleanup_files(resume_path, jd_path)  # ✅ FIXED: Cleanup on error
#             return jsonify({
#                 "valid": False,
#                 "message": str(e)
#             }), 400
#         except (ValueError, RuntimeError) as e:
#             cleanup_files(resume_path, jd_path)  # ✅ FIXED: Cleanup on error
#             return jsonify({
#                 "valid": False,
#                 "message": str(e)
#             }), 400

#         try:
#             jd_text = extract_text(jd_path)
#         except ScannedPDFError as e:
#             cleanup_files(resume_path, jd_path)  # ✅ FIXED: Cleanup on error
#             return jsonify({
#                 "valid": False,
#                 "message": f"Job Description error: {str(e)}"
#             }), 400
#         except (ValueError, RuntimeError) as e:
#             cleanup_files(resume_path, jd_path)  # ✅ FIXED: Cleanup on error
#             return jsonify({
#                 "valid": False,
#                 "message": f"Job Description error: {str(e)}"
#             }), 400

#         # ✅ FIXED: Sanitize extracted text
#         resume_text = sanitize_text(resume_text)
#         jd_text = sanitize_text(jd_text)

#         # ---------------- TEXT VALIDATION ----------------
#         if not resume_text or not jd_text:
#             cleanup_files(resume_path, jd_path)  # ✅ FIXED: Cleanup on error
#             return jsonify({"valid": False, "message": "Empty or image-based file"}), 400

#         # ✅ FIXED: Check minimum resume length
#         if len(resume_text) < MIN_RESUME_LENGTH:
#             cleanup_files(resume_path, jd_path)
#             return jsonify({
#                 "valid": False,
#                 "message": f"Resume is too short. Please upload a complete resume (minimum {MIN_RESUME_LENGTH} characters)."
#             }), 400

#         # ✅ FIXED: Check JD length (min and max)
#         if len(jd_text) < MIN_JD_LENGTH:
#             cleanup_files(resume_path, jd_path)
#             return jsonify({
#                 "valid": False,
#                 "message": f"Job Description too short (minimum {MIN_JD_LENGTH} characters)."
#             }), 400

#         if len(jd_text) > MAX_JD_LENGTH:
#             cleanup_files(resume_path, jd_path)
#             return jsonify({
#                 "valid": False,
#                 "message": f"Job Description too long (maximum {MAX_JD_LENGTH} characters)."
#             }), 400

#         # ---------------- TECH VALIDATION ----------------
#         resume_is_tech = is_technical_text(resume_text)
#         jd_is_tech = is_technical_text(jd_text)

#         if not resume_is_tech and jd_is_tech:
#             cleanup_files(resume_path, jd_path)  # ✅ FIXED: Cleanup on error
#             return jsonify({"valid": False, "message": "Resume not technical"}), 400

#         if resume_is_tech and not jd_is_tech:
#             cleanup_files(resume_path, jd_path)  # ✅ FIXED: Cleanup on error
#             return jsonify({"valid": False, "message": "JD not technical"}), 400

#         # ---------------- GEMINI ANALYSIS ----------------
#         # ✅ FIXED: Error handling for Gemini API
#         try:
#             gemini_result = analyze_with_gemini(resume_text, jd_text) or {}
#         except Exception as e:
#             print(f"❌ Gemini API error: {e}")
#             cleanup_files(resume_path, jd_path)
#             return jsonify({
#                 "valid": False,
#                 "message": "AI analysis service is temporarily unavailable. Please try again in a moment."
#             }), 503

#         gemini_score = gemini_result.get("score", 0)
#         missing_keywords = gemini_result.get("missing_keywords", [])
#         suggestions = gemini_result.get("suggestions", [])
#         learning_resources = gemini_result.get("learning_resources", [])

#         # ---------------- FIRESTORE SAVE ----------------
#         scan_hash = generate_scan_hash(user_id, resume_text, jd_text)

#         # ✅ FIXED: Error handling for Firestore
#         try:
#             db.collection("resume_analysis").document(scan_hash).set({
#                 "user_id": user_id,
#                 "resume_name": resume_name,
#                 "jd_name": jd_name,
#                 "jd_text": jd_text,

#                 "gemini_score": gemini_score,
#                 "gemini_missing_keywords": missing_keywords,
#                 "gemini_suggestions": suggestions,
#                 "gemini_learning_resources": learning_resources,

#                 "timestamp": firestore.SERVER_TIMESTAMP
#             })
#         except Exception as e:
#             print(f"❌ Firestore save error: {e}")
#             cleanup_files(resume_path, jd_path)
#             return jsonify({
#                 "valid": False,
#                 "message": "Failed to save analysis results. Please try again."
#             }), 500

#         # ---------------- SUCCESS ----------------
#         # ✅ FIXED: Cleanup files after successful processing
#         cleanup_files(resume_path, jd_path)
        
#         return jsonify({
#             "valid": True,
#             "doc_id": scan_hash
#         }), 200

#     except Exception as e:
#         # ✅ FIXED: Better error logging and cleanup
#         print(f"❌ Unexpected error: {e}")
#         traceback.print_exc()
#         cleanup_files(resume_path, jd_path)
#         return jsonify({
#             "valid": False, 
#             "message": "An unexpected error occurred. Please try again or contact support."
#         }), 500