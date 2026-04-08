import os
import sys
import re
import uuid
import traceback
import hashlib
from flask import Blueprint, request, jsonify, g
from werkzeug.utils import secure_filename

# -------------------------------------------------
# Path setup
# -------------------------------------------------
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# -------------------------------------------------
# Firebase setup — reuse the already-initialised app
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
from utils.extract_text  import extract_text, ScannedPDFError, EncryptedPDFError, CorruptedFileError
from utils.gemini_utils  import analyze_with_gemini
from utils.matcher       import is_technical_text

# ✅ REMOVED: verify_session import — it was causing all 401 errors
# because the frontend never sends X-Session-Id header.
# Firebase tokens are already short-lived (1 hour) so session
# revocation checking is not needed here.

upload_blueprint = Blueprint('upload', __name__)

# -------------------------------------------------
# Upload folder
# -------------------------------------------------
UPLOAD_FOLDER = "/tmp/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_RESUME_EXTENSIONS = {'pdf', 'docx'}
ALLOWED_JD_EXTENSIONS     = {'pdf', 'docx', 'txt'}

MIN_RESUME_LENGTH = 100
MIN_JD_LENGTH     = 100
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
    for path in file_paths:
        try:
            if path and os.path.exists(path):
                os.remove(path)
        except Exception as e:
            print(f"⚠️ Cleanup warning for {path}: {e}")


def sanitize_text(text):
    if not text:
        return ""
    text = text.replace('\x00', '')
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def unique_filename(user_id, original_name):
    safe_name      = secure_filename(original_name)
    unique_prefix  = f"{user_id[:8]}_{uuid.uuid4().hex[:8]}_"
    return unique_prefix + safe_name


# -------------------------------------------------
# ✅ Centralised token verifier (self-contained)
# Works whether or not you use the @require_auth
# decorator from app.py — safe either way.
# -------------------------------------------------
def _verify_token(request):
    """
    Returns (user_id, None)         on success.
    Returns (None, response_tuple)  on failure.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None, (jsonify({
            "valid":   False,
            "message": "Unauthorized. Please log in.",
            "code":    "NO_TOKEN",
        }), 401)

    token = auth_header.split("Bearer ", 1)[1].strip()

    try:
        # check_revoked=False — avoids false "opened on another device" errors
        decoded  = auth.verify_id_token(token, check_revoked=False)
        user_id  = decoded["uid"]
        return user_id, None

    except auth.ExpiredIdTokenError:
        return None, (jsonify({
            "valid":   False,
            "message": "Your session has expired. Please log in again.",
            "code":    "TOKEN_EXPIRED",
        }), 401)

    except auth.InvalidIdTokenError:
        return None, (jsonify({
            "valid":   False,
            "message": "Invalid session. Please log in again.",
            "code":    "TOKEN_INVALID",
        }), 401)

    except Exception as e:
        print(f"❌ Auth error: {e}")
        return None, (jsonify({
            "valid":   False,
            "message": "Authentication failed. Please log in again.",
            "code":    "AUTH_ERROR",
        }), 401)


# -------------------------------------------------
# 🚀 UPLOAD ROUTE
# -------------------------------------------------
@upload_blueprint.route('/upload', methods=['POST'])
def upload_files():
    resume_path = None
    jd_path     = None

    try:

        # ════════════════════════════════════════
        # 1. AUTH — clean centralised check
        # ════════════════════════════════════════
        user_id, auth_error = _verify_token(request)
        if auth_error:
            return auth_error   # (jsonify(...), status_code)

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
                "valid":   False,
                "message": "Invalid resume format. Only PDF and DOCX files are allowed."
            }), 400

        if not allowed_file(jd_name, ALLOWED_JD_EXTENSIONS):
            return jsonify({
                "valid":   False,
                "message": "Invalid job description format. Only PDF, DOCX, and TXT files are allowed."
            }), 400

        # ════════════════════════════════════════
        # 4. FILE SIZE VALIDATION
        # ════════════════════════════════════════
        resume.seek(0, 2)
        resume_size = resume.tell()
        resume.seek(0)

        jd.seek(0, 2)
        jd_size = jd.tell()
        jd.seek(0)

        if resume_size == 0:
            return jsonify({"valid": False, "message": "Resume file is empty."}), 400

        if resume_size > MAX_FILE_SIZE:
            return jsonify({
                "valid":   False,
                "message": f"Resume is too large ({resume_size/1024/1024:.1f}MB). Maximum is 10MB."
            }), 413

        if jd_size == 0:
            return jsonify({"valid": False, "message": "Job description file is empty."}), 400

        if jd_size > MAX_FILE_SIZE:
            return jsonify({
                "valid":   False,
                "message": f"Job description is too large ({jd_size/1024/1024:.1f}MB). Maximum is 10MB."
            }), 413

        # ════════════════════════════════════════
        # 5. SAVE FILES with unique names
        # ════════════════════════════════════════
        resume_path = os.path.join(UPLOAD_FOLDER, unique_filename(user_id, resume_name))
        jd_path     = os.path.join(UPLOAD_FOLDER, unique_filename(user_id, jd_name))

        resume.save(resume_path)
        jd.save(jd_path)

        print(f"📁 Saved: {os.path.basename(resume_path)}, {os.path.basename(jd_path)}")

        # ════════════════════════════════════════
        # 6. TEXT EXTRACTION
        # ════════════════════════════════════════
        try:
            resume_text = extract_text(resume_path)
        except EncryptedPDFError as e:
            cleanup_files(resume_path, jd_path)
            return jsonify({"valid": False, "message": str(e)}), 400
        except CorruptedFileError as e:
            cleanup_files(resume_path, jd_path)
            return jsonify({"valid": False, "message": str(e)}), 400
        except ScannedPDFError as e:
            cleanup_files(resume_path, jd_path)
            return jsonify({"valid": False, "message": str(e)}), 400
        except (ValueError, RuntimeError) as e:
            cleanup_files(resume_path, jd_path)
            return jsonify({"valid": False, "message": str(e)}), 400

        try:
            jd_text = extract_text(jd_path)
        except EncryptedPDFError as e:
            cleanup_files(resume_path, jd_path)
            return jsonify({"valid": False, "message": f"Job Description error: {e}"}), 400
        except CorruptedFileError as e:
            cleanup_files(resume_path, jd_path)
            return jsonify({"valid": False, "message": f"Job Description error: {e}"}), 400
        except ScannedPDFError as e:
            cleanup_files(resume_path, jd_path)
            return jsonify({"valid": False, "message": f"Job Description error: {e}"}), 400
        except (ValueError, RuntimeError) as e:
            cleanup_files(resume_path, jd_path)
            return jsonify({"valid": False, "message": f"Job Description error: {e}"}), 400

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
                "valid":   False,
                "message": "Resume appears to be empty or image-based. Please upload a text-based resume."
            }), 400

        if not jd_text:
            cleanup_files(resume_path, jd_path)
            return jsonify({
                "valid":   False,
                "message": "Job description appears to be empty. Please upload a valid job description."
            }), 400

        if len(resume_text) < MIN_RESUME_LENGTH:
            cleanup_files(resume_path, jd_path)
            return jsonify({
                "valid":   False,
                "message": f"Resume is too short ({len(resume_text)} chars). Minimum is {MIN_RESUME_LENGTH}."
            }), 400

        if len(jd_text) < MIN_JD_LENGTH:
            cleanup_files(resume_path, jd_path)
            return jsonify({
                "valid":   False,
                "message": f"Job description is too short ({len(jd_text)} chars). Minimum is {MIN_JD_LENGTH}."
            }), 400

        if len(jd_text) > MAX_JD_LENGTH:
            cleanup_files(resume_path, jd_path)
            return jsonify({
                "valid":   False,
                "message": f"Job description is too long ({len(jd_text):,} chars). Maximum is {MAX_JD_LENGTH:,}."
            }), 400

        # ════════════════════════════════════════
        # 9. TECH VALIDATION
        # ════════════════════════════════════════
        resume_is_tech = is_technical_text(resume_text)
        jd_is_tech     = is_technical_text(jd_text)

        print(f"🔎 resume_is_tech={resume_is_tech} | jd_is_tech={jd_is_tech}")

        if not resume_is_tech and not jd_is_tech:
            cleanup_files(resume_path, jd_path)
            return jsonify({
                "valid":   False,
                "message": "Both your resume and job description appear to be for non-technical roles. "
                           "JobMorph currently supports technical roles only (software, data, AI/ML, DevOps, etc.)."
            }), 400

        if not resume_is_tech and jd_is_tech:
            cleanup_files(resume_path, jd_path)
            return jsonify({
                "valid":   False,
                "message": "Your resume does not appear to contain technical skills matching this job description."
            }), 400

        if resume_is_tech and not jd_is_tech:
            cleanup_files(resume_path, jd_path)
            return jsonify({
                "valid":   False,
                "message": "The job description does not appear to be for a technical role."
            }), 400

        # ════════════════════════════════════════
        # 10. GEMINI ANALYSIS
        # ════════════════════════════════════════
        try:
            gemini_result = analyze_with_gemini(resume_text, jd_text) or {}
        except Exception as e:
            print(f"❌ Gemini API error: {e}")
            cleanup_files(resume_path, jd_path)
            return jsonify({
                "valid":   False,
                "message": "AI analysis service is temporarily unavailable. Please try again in a moment."
            }), 503

        gemini_score       = gemini_result.get("score", 0)
        missing_keywords   = gemini_result.get("missing_keywords", [])
        suggestions        = gemini_result.get("suggestions", [])
        learning_resources = gemini_result.get("learning_resources", [])
        is_fallback        = gemini_result.get("is_fallback", False)

        # ════════════════════════════════════════
        # 11. FIRESTORE SAVE
        # ════════════════════════════════════════
        scan_hash = generate_scan_hash(user_id, resume_text, jd_text)

        try:
            db.collection("resume_analysis").document(scan_hash).set({
                "user_id":                   user_id,
                "resume_name":               resume_name,
                "jd_name":                   jd_name,
                "jd_text":                   jd_text[:5000],   # truncated to stay under Firestore 1MB limit

                "gemini_score":              gemini_score,
                "gemini_missing_keywords":   missing_keywords,
                "gemini_suggestions":        suggestions,
                "gemini_learning_resources": learning_resources,
                "is_fallback_score":         is_fallback,

                "timestamp": firestore.SERVER_TIMESTAMP,
            })
        except Exception as e:
            print(f"❌ Firestore save error: {e}")
            cleanup_files(resume_path, jd_path)
            return jsonify({
                "valid":   False,
                "message": "Failed to save results. Please try again."
            }), 500

        # ════════════════════════════════════════
        # 12. SUCCESS
        # ════════════════════════════════════════
        cleanup_files(resume_path, jd_path)
        print(f"✅ Analysis complete — score: {gemini_score}, doc: {scan_hash[:12]}...")

        return jsonify({
            "valid":  True,
            "doc_id": scan_hash,
        }), 200

    except Exception as e:
        print(f"❌ Unexpected error in upload: {e}")
        traceback.print_exc()
        cleanup_files(resume_path, jd_path)
        return jsonify({
            "valid":   False,
            "message": "An unexpected error occurred. Please try again or contact support."
        }), 500