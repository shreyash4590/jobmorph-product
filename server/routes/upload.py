import os
import sys
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
from utils.extract_text import extract_text, ScannedPDFError
from utils.gemini_utils import analyze_with_gemini
from utils.matcher import is_technical_text

upload_blueprint = Blueprint('upload', __name__)

# -------------------------------------------------
# ✅ FIXED: App Engine–safe upload folder
# -------------------------------------------------
UPLOAD_FOLDER = "/tmp/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_RESUME_EXTENSIONS = {'pdf', 'docx'}
ALLOWED_JD_EXTENSIONS = {'pdf', 'docx', 'txt'}

# ✅ NEW: Constants for validation
MIN_RESUME_LENGTH = 100
MIN_JD_LENGTH = 50
MAX_JD_LENGTH = 50000


def allowed_file(filename, allowed_exts):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_exts


def generate_scan_hash(user_id, resume_text, jd_text):
    combined = f"{user_id}|{resume_text.strip()}|{jd_text.strip()}"
    return hashlib.sha256(combined.encode("utf-8")).hexdigest()


# ✅ NEW: Helper to clean up files
def cleanup_files(*file_paths):
    """Safely remove uploaded files"""
    for path in file_paths:
        try:
            if path and os.path.exists(path):
                os.remove(path)
        except Exception as e:
            print(f"⚠️ Cleanup warning for {path}: {e}")


# ✅ NEW: Helper to sanitize text
def sanitize_text(text):
    """Remove null bytes and excessive whitespace"""
    if not text:
        return ""
    # Remove null bytes
    text = text.replace('\x00', '')
    # Remove excessive whitespace
    import re
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


# -------------------------------------------------
# 🚀 UPLOAD ROUTE (PRODUCTION SAFE)
# -------------------------------------------------
@upload_blueprint.route('/upload', methods=['POST'])
def upload_files():
    resume_path = None
    jd_path = None
    
    try:
        # ---------------- AUTH ----------------
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"valid": False, "message": "Unauthorized"}), 401

        # ✅ FIXED: Better auth error handling
        try:
            id_token = auth_header.split("Bearer ")[1]
            decoded_token = auth.verify_id_token(id_token)
            user_id = decoded_token["uid"]
        except Exception as e:
            print(f"❌ Auth error: {e}")
            return jsonify({
                "valid": False, 
                "message": "Invalid or expired authentication token. Please log in again."
            }), 401

        # ---------------- FILE CHECK ----------------
        if 'resume' not in request.files or 'jd' not in request.files:
            return jsonify({"valid": False, "message": "Resume and JD required"}), 400

        resume = request.files['resume']
        jd = request.files['jd']

        resume_name = secure_filename(resume.filename)
        jd_name = secure_filename(jd.filename)

        if not allowed_file(resume_name, ALLOWED_RESUME_EXTENSIONS):
            return jsonify({"valid": False, "message": "Invalid resume format"}), 400

        if not allowed_file(jd_name, ALLOWED_JD_EXTENSIONS):
            return jsonify({"valid": False, "message": "Invalid JD format"}), 400

        resume_path = os.path.join(UPLOAD_FOLDER, resume_name)
        jd_path = os.path.join(UPLOAD_FOLDER, jd_name)

        resume.save(resume_path)
        jd.save(jd_path)

        # ---------------- TEXT EXTRACTION ----------------
        try:
            resume_text = extract_text(resume_path)
        except ScannedPDFError as e:
            cleanup_files(resume_path, jd_path)  # ✅ FIXED: Cleanup on error
            return jsonify({
                "valid": False,
                "message": str(e)
            }), 400
        except (ValueError, RuntimeError) as e:
            cleanup_files(resume_path, jd_path)  # ✅ FIXED: Cleanup on error
            return jsonify({
                "valid": False,
                "message": str(e)
            }), 400

        try:
            jd_text = extract_text(jd_path)
        except ScannedPDFError as e:
            cleanup_files(resume_path, jd_path)  # ✅ FIXED: Cleanup on error
            return jsonify({
                "valid": False,
                "message": f"Job Description error: {str(e)}"
            }), 400
        except (ValueError, RuntimeError) as e:
            cleanup_files(resume_path, jd_path)  # ✅ FIXED: Cleanup on error
            return jsonify({
                "valid": False,
                "message": f"Job Description error: {str(e)}"
            }), 400

        # ✅ FIXED: Sanitize extracted text
        resume_text = sanitize_text(resume_text)
        jd_text = sanitize_text(jd_text)

        # ---------------- TEXT VALIDATION ----------------
        if not resume_text or not jd_text:
            cleanup_files(resume_path, jd_path)  # ✅ FIXED: Cleanup on error
            return jsonify({"valid": False, "message": "Empty or image-based file"}), 400

        # ✅ FIXED: Check minimum resume length
        if len(resume_text) < MIN_RESUME_LENGTH:
            cleanup_files(resume_path, jd_path)
            return jsonify({
                "valid": False,
                "message": f"Resume is too short. Please upload a complete resume (minimum {MIN_RESUME_LENGTH} characters)."
            }), 400

        # ✅ FIXED: Check JD length (min and max)
        if len(jd_text) < MIN_JD_LENGTH:
            cleanup_files(resume_path, jd_path)
            return jsonify({
                "valid": False,
                "message": f"Job Description too short (minimum {MIN_JD_LENGTH} characters)."
            }), 400

        if len(jd_text) > MAX_JD_LENGTH:
            cleanup_files(resume_path, jd_path)
            return jsonify({
                "valid": False,
                "message": f"Job Description too long (maximum {MAX_JD_LENGTH} characters)."
            }), 400

        # ---------------- TECH VALIDATION ----------------
        resume_is_tech = is_technical_text(resume_text)
        jd_is_tech = is_technical_text(jd_text)

        if not resume_is_tech and jd_is_tech:
            cleanup_files(resume_path, jd_path)  # ✅ FIXED: Cleanup on error
            return jsonify({"valid": False, "message": "Resume not technical"}), 400

        if resume_is_tech and not jd_is_tech:
            cleanup_files(resume_path, jd_path)  # ✅ FIXED: Cleanup on error
            return jsonify({"valid": False, "message": "JD not technical"}), 400

        # ---------------- GEMINI ANALYSIS ----------------
        # ✅ FIXED: Error handling for Gemini API
        try:
            gemini_result = analyze_with_gemini(resume_text, jd_text) or {}
        except Exception as e:
            print(f"❌ Gemini API error: {e}")
            cleanup_files(resume_path, jd_path)
            return jsonify({
                "valid": False,
                "message": "AI analysis service is temporarily unavailable. Please try again in a moment."
            }), 503

        gemini_score = gemini_result.get("score", 0)
        missing_keywords = gemini_result.get("missing_keywords", [])
        suggestions = gemini_result.get("suggestions", [])
        learning_resources = gemini_result.get("learning_resources", [])

        # ---------------- FIRESTORE SAVE ----------------
        scan_hash = generate_scan_hash(user_id, resume_text, jd_text)

        # ✅ FIXED: Error handling for Firestore
        try:
            db.collection("resume_analysis").document(scan_hash).set({
                "user_id": user_id,
                "resume_name": resume_name,
                "jd_name": jd_name,
                "jd_text": jd_text,

                "gemini_score": gemini_score,
                "gemini_missing_keywords": missing_keywords,
                "gemini_suggestions": suggestions,
                "gemini_learning_resources": learning_resources,

                "timestamp": firestore.SERVER_TIMESTAMP
            })
        except Exception as e:
            print(f"❌ Firestore save error: {e}")
            cleanup_files(resume_path, jd_path)
            return jsonify({
                "valid": False,
                "message": "Failed to save analysis results. Please try again."
            }), 500

        # ---------------- SUCCESS ----------------
        # ✅ FIXED: Cleanup files after successful processing
        cleanup_files(resume_path, jd_path)
        
        return jsonify({
            "valid": True,
            "doc_id": scan_hash
        }), 200

    except Exception as e:
        # ✅ FIXED: Better error logging and cleanup
        print(f"❌ Unexpected error: {e}")
        traceback.print_exc()
        cleanup_files(resume_path, jd_path)
        return jsonify({
            "valid": False, 
            "message": "An unexpected error occurred. Please try again or contact support."
        }), 500