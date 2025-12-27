import os
import sys
import traceback
import uuid
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
from utils.extract_text import extract_text
from utils.gemini_utils import analyze_with_gemini
from utils.matcher import is_technical_text

upload_blueprint = Blueprint('upload', __name__)

UPLOAD_FOLDER = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'uploads'))
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_RESUME_EXTENSIONS = {'pdf', 'docx'}
ALLOWED_JD_EXTENSIONS = {'pdf', 'docx', 'txt'}


def allowed_file(filename, allowed_exts):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_exts


def get_learning_resources_from_keywords(keywords):
    return [
        {
            "skill": kw,
            "description": f"Learn {kw} from free tutorials and resources online.",
            "youtubeLink": f"https://www.youtube.com/results?search_query=learn+{kw.replace(' ', '+')}"
        }
        for kw in keywords or []
    ]


@upload_blueprint.route('/upload', methods=['POST'])
def upload_files():
    try:
        # -------------------------------------------------
        # 1. AUTH (SINGLE, CLEAN)
        # -------------------------------------------------
        auth_header = request.headers.get("Authorization")

        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({
                "valid": False,
                "message": "❌ Missing or malformed Authorization header."
            }), 401

        id_token = auth_header.split("Bearer ")[1]
        decoded_token = auth.verify_id_token(id_token)
        user_id = decoded_token["uid"]

        # -------------------------------------------------
        # 2. FILE CHECK
        # -------------------------------------------------
        if 'resume' not in request.files or 'jd' not in request.files:
            return jsonify({"valid": False, "message": "Resume and JD required"}), 400

        resume = request.files['resume']
        jd = request.files['jd']

        resume_name = secure_filename(resume.filename)
        jd_name = secure_filename(jd.filename)

        resume_file = f"{uuid.uuid4()}_{resume_name}"
        jd_file = f"{uuid.uuid4()}_{jd_name}"

        if not allowed_file(resume_file, ALLOWED_RESUME_EXTENSIONS):
            return jsonify({"valid": False, "message": "Invalid resume format"}), 400

        if not allowed_file(jd_file, ALLOWED_JD_EXTENSIONS):
            return jsonify({"valid": False, "message": "Invalid JD format"}), 400

        resume_path = os.path.join(UPLOAD_FOLDER, resume_file)
        jd_path = os.path.join(UPLOAD_FOLDER, jd_file)

        resume.save(resume_path)
        jd.save(jd_path)

        # -------------------------------------------------
        # 3. TEXT EXTRACTION
        # -------------------------------------------------
        resume_text = extract_text(resume_path)
        jd_text = extract_text(jd_path)

        if not resume_text.strip() or not jd_text.strip():
            return jsonify({"valid": False, "message": "Empty or image-only files"}), 400

        # -------------------------------------------------
        # 4. TECH VALIDATION
        # -------------------------------------------------
        if not is_technical_text(resume_text) and is_technical_text(jd_text):
            return jsonify({"valid": False, "message": "Resume not technical"}), 200

        if is_technical_text(resume_text) and not is_technical_text(jd_text):
            return jsonify({"valid": False, "message": "JD not technical"}), 200

        # -------------------------------------------------
        # 5. GEMINI (SAFE)
        # -------------------------------------------------
        gemini_result = analyze_with_gemini(resume_text, jd_text)

        # If Gemini failed → prevent fake score
        if not gemini_result or "score" not in gemini_result:
            gemini_result = {
                "score": 0,
                "missing_keywords": [],
                "suggestions": []
            }

        learning_resources = get_learning_resources_from_keywords(
            gemini_result["missing_keywords"]
        )

        # -------------------------------------------------
        # 6. FIRESTORE SAVE
        # -------------------------------------------------
        doc_ref = db.collection('resume_analysis').document()
        doc_ref.set({
            "user_id": user_id,
            "resume_name": resume_name,
            "jd_name": jd_name,
            "gemini_score": gemini_result["score"],
            "gemini_missing_keywords": gemini_result["missing_keywords"],
            "gemini_suggestions": gemini_result["suggestions"],
            "gemini_learning_resources": learning_resources,
            "timestamp": firestore.SERVER_TIMESTAMP
        })

        return jsonify({
            "valid": True,
            "doc_id": doc_ref.id,
            "gemini_score": gemini_result["score"],
            "gemini_missing_keywords": gemini_result["missing_keywords"],
            "gemini_suggestions": gemini_result["suggestions"],
            "gemini_learning_resources": learning_resources
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "valid": False,
            "message": "Internal server error"
        }), 500
