# server/routes/batch_matcher.py

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
from utils.extract_text import extract_text
from utils.gemini_utils import analyze_with_gemini
from utils.matcher import is_technical_text

batch_blueprint = Blueprint('batch_matcher', __name__)

UPLOAD_FOLDER = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'uploads'))
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_RESUME_EXTENSIONS = {'pdf', 'docx'}
ALLOWED_JD_EXTENSIONS = {'pdf', 'docx', 'txt'}


def allowed_file(filename, allowed_exts):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_exts


def generate_batch_id(user_id, resume_text):
    """Generate unique ID for batch analysis"""
    import time
    combined = f"{user_id}|{resume_text[:500]}|{time.time()}"
    return hashlib.sha256(combined.encode("utf-8")).hexdigest()


# -------------------------------------------------
# 🚀 BATCH ANALYZE ROUTE
# -------------------------------------------------
@batch_blueprint.route('/batch/analyze', methods=['POST'])
def batch_analyze():
    """
    Analyze one resume against multiple job descriptions.
    Returns ranked list of matches.
    """
    try:
        # ---------------- AUTH ----------------
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Unauthorized"}), 401

        id_token = auth_header.split("Bearer ")[1]
        decoded_token = auth.verify_id_token(id_token)
        user_id = decoded_token["uid"]

        print(f"📊 Batch analysis request from user: {user_id}")

        # ---------------- FILE VALIDATION ----------------
        if 'resume' not in request.files:
            return jsonify({"error": "Resume file required"}), 400

        if 'jds' not in request.files:
            return jsonify({"error": "At least one job description required"}), 400

        resume = request.files['resume']
        jd_files = request.files.getlist('jds')

        if not jd_files:
            return jsonify({"error": "No job descriptions uploaded"}), 400

        print(f"📄 Resume: {resume.filename}")
        print(f"📋 Job Descriptions: {len(jd_files)} files")

        # Validate resume
        resume_name = secure_filename(resume.filename)
        if not allowed_file(resume_name, ALLOWED_RESUME_EXTENSIONS):
            return jsonify({"error": "Invalid resume format. Only PDF and DOCX allowed."}), 400

        # Save resume
        resume_path = os.path.join(UPLOAD_FOLDER, resume_name)
        resume.save(resume_path)

        # Extract resume text ONCE
        resume_text = extract_text(resume_path)
        if not resume_text.strip():
            return jsonify({"error": "Resume is empty or unreadable"}), 400

        # Validate resume is technical
        if not is_technical_text(resume_text):
            return jsonify({"error": "Resume does not appear to be technical"}), 400

        print(f"✅ Resume extracted: {len(resume_text)} characters")

        # ---------------- PROCESS EACH JD ----------------
        results = []
        
        for idx, jd_file in enumerate(jd_files):
            try:
                jd_name = secure_filename(jd_file.filename)
                
                # Validate JD file
                if not allowed_file(jd_name, ALLOWED_JD_EXTENSIONS):
                    print(f"⚠️ Skipping {jd_name} - invalid format")
                    continue

                # Save JD
                jd_path = os.path.join(UPLOAD_FOLDER, jd_name)
                jd_file.save(jd_path)

                # Extract JD text
                jd_text = extract_text(jd_path)
                
                if not jd_text.strip() or len(jd_text.strip()) < 50:
                    print(f"⚠️ Skipping {jd_name} - too short or empty")
                    continue

                # Validate JD is technical
                if not is_technical_text(jd_text):
                    print(f"⚠️ Skipping {jd_name} - not technical")
                    continue

                print(f"🔄 Processing {idx + 1}/{len(jd_files)}: {jd_name}")

                # ---------------- GEMINI ANALYSIS ----------------
                gemini_result = analyze_with_gemini(resume_text, jd_text) or {}

                score = gemini_result.get("score", 0)
                missing_keywords = gemini_result.get("missing_keywords", [])
                suggestions = gemini_result.get("suggestions", [])
                learning_resources = gemini_result.get("learning_resources", [])

                # ---------------- BUILD RESULT ----------------
                result = {
                    "jd_name": jd_name,
                    "jd_text": jd_text[:500],  # First 500 chars for preview
                    "score": score,
                    "missing_keywords": missing_keywords,
                    "suggestions": suggestions,
                    "learning_resources": learning_resources,
                    "rank": 0,  # Will be set after sorting
                    "match_quality": get_match_quality(score),
                    "priority": get_priority_level(score, missing_keywords)
                }

                results.append(result)
                print(f"✅ {jd_name} - Score: {score}%")

            except Exception as e:
                print(f"❌ Error processing {jd_file.filename}: {e}")
                traceback.print_exc()
                continue

        # ---------------- NO VALID RESULTS ----------------
        if not results:
            return jsonify({
                "error": "No valid job descriptions could be processed. Please check file formats and content."
            }), 400

        # ---------------- SORT BY SCORE (HIGHEST FIRST) ----------------
        results.sort(key=lambda x: x['score'], reverse=True)

        # Assign ranks
        for idx, result in enumerate(results):
            result['rank'] = idx + 1

        print(f"🎯 Batch analysis complete: {len(results)} jobs ranked")

        # ---------------- SAVE TO FIRESTORE ----------------
        batch_id = generate_batch_id(user_id, resume_text)
        
        db.collection("batch_analysis").document(batch_id).set({
            "user_id": user_id,
            "resume_name": resume_name,
            "total_jobs": len(results),
            "top_score": results[0]['score'] if results else 0,
            "results": results,
            "timestamp": firestore.SERVER_TIMESTAMP
        })

        print(f"💾 Saved batch analysis: {batch_id}")

        # ---------------- RESPONSE ----------------
        return jsonify({
            "success": True,
            "batch_id": batch_id,
            "resume_name": resume_name,
            "total_jobs_analyzed": len(results),
            "results": results
        }), 200

    except Exception as e:
        print("❌ Batch analysis error:")
        traceback.print_exc()
        return jsonify({"error": "Internal server error during batch analysis"}), 500


# -------------------------------------------------
# 🔍 GET BATCH RESULTS
# -------------------------------------------------
@batch_blueprint.route('/batch/<batch_id>', methods=['GET'])
def get_batch_results(batch_id):
    """
    Retrieve saved batch analysis results.
    """
    try:
        # Auth check
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Unauthorized"}), 401

        id_token = auth_header.split("Bearer ")[1]
        decoded_token = auth.verify_id_token(id_token)
        user_id = decoded_token["uid"]

        # Get from Firestore
        doc_ref = db.collection("batch_analysis").document(batch_id)
        doc = doc_ref.get()

        if not doc.exists:
            return jsonify({"error": "Batch analysis not found"}), 404

        data = doc.to_dict()

        # Verify ownership
        if data.get("user_id") != user_id:
            return jsonify({"error": "Unauthorized access"}), 403

        return jsonify({
            "success": True,
            "data": data
        }), 200

    except Exception as e:
        print("❌ Get batch results error:", e)
        traceback.print_exc()
        return jsonify({"error": "Failed to retrieve results"}), 500


# -------------------------------------------------
# HELPER FUNCTIONS
# -------------------------------------------------

def get_match_quality(score):
    """Return match quality label based on score"""
    if score >= 85:
        return "Excellent"
    elif score >= 70:
        return "Good"
    elif score >= 60:
        return "Fair"
    else:
        return "Poor"


def get_priority_level(score, missing_keywords):
    """Determine application priority"""
    if score >= 85 and len(missing_keywords) <= 2:
        return "HIGH"
    elif score >= 70 and len(missing_keywords) <= 5:
        return "MEDIUM"
    else:
        return "LOW"