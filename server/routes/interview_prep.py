import os
import sys
import traceback
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from firebase_admin import auth, firestore

# Path setup
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from utils.interview_utils import (
    detect_experience_level,
    detect_role_type,
    detect_company_type,
    extract_company_name,
    extract_interview_process_from_jd,
    get_default_interview_process
)
from utils.gemini_utils import generate_interview_questions

# ✅ Initialize Firestore client
db = firestore.client()

interview_blueprint = Blueprint("interview_prep", __name__)


def get_cached_questions(user_id, jd_text):
    """
    Check if we have recent cached interview questions for this JD
    Returns cached questions and interview_process if found and less than 24 hours old
    """
    try:
        import hashlib
        jd_hash = hashlib.md5(jd_text.encode()).hexdigest()[:16]
        cache_key = f"{user_id}_{jd_hash}"
        
        doc_ref = db.collection("interviewPrepCache").document(cache_key)
        doc = doc_ref.get()
        
        if doc.exists:
            data = doc.to_dict()
            created_at = data.get('created_at')
            
            if created_at:
                cache_age = datetime.now() - created_at
                if cache_age < timedelta(hours=24):
                    print(f"✅ Using cached interview questions for user {user_id}")
                    return data.get('questions'), data.get('interview_process')
        
        return None, None
    except Exception as e:
        print(f"⚠️ Cache check failed: {e}")
        return None, None


def save_questions_to_cache(user_id, jd_text, questions, interview_process, experience_level, role_type):
    """
    Save interview questions and process to cache for faster retrieval
    """
    try:
        import hashlib
        jd_hash = hashlib.md5(jd_text.encode()).hexdigest()[:16]
        cache_key = f"{user_id}_{jd_hash}"
        
        db.collection("interviewPrepCache").document(cache_key).set({
            'user_id': user_id,
            'jd_hash': jd_hash,
            'experience_level': experience_level,
            'role_type': role_type,
            'questions': questions,
            'interview_process': interview_process,
            'created_at': datetime.now()
        })
        print(f"✅ Cached interview questions and process for user {user_id}")
    except Exception as e:
        print(f"⚠️ Cache save failed: {e}")

@interview_blueprint.route("/interview-prep", methods=["POST"])
def interview_prep():
    """
    Generate AI-powered interview questions based on job description
    Includes caching to improve performance and reduce API costs
    """
    try:
        # --------------------------------------------------
        # 🔐 AUTHENTICATION
        # --------------------------------------------------
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({
                "error": "Unauthorized - No valid token provided"
            }), 401

        token = auth_header.replace("Bearer ", "").strip()
        
        try:
            decoded = auth.verify_id_token(token)
            user_id = decoded.get("uid")
        except Exception as auth_err:
            print(f"❌ Auth verification failed: {auth_err}")
            return jsonify({
                "error": "Invalid or expired token"
            }), 401

        if not user_id:
            return jsonify({
                "error": "Invalid user ID in token"
            }), 401

        # --------------------------------------------------
        # 📥 INPUT VALIDATION
        # --------------------------------------------------
        data = request.get_json(silent=True) or {}
        jd_text = (data.get("jd_text") or "").strip()

        if not jd_text:
            return jsonify({
                "error": "Job Description is required"
            }), 400

        if len(jd_text) < 50:
            return jsonify({
                "error": "Job Description is too short. Please provide a complete job description (minimum 50 characters)."
            }), 400

        # --------------------------------------------------
        # 🔍 CHECK CACHE FIRST (Performance Optimization)
        # --------------------------------------------------
# --------------------------------------------------
        # 🔍 CHECK CACHE FIRST (Performance Optimization)
        # --------------------------------------------------
        cached_questions, cached_process = get_cached_questions(user_id, jd_text)
        
        if cached_questions and cached_process:
            return jsonify({
                "experience_level": cached_questions.get("experience_level", "Not specified"),
                "role_type": cached_questions.get("role_type", "General"),
                "questions": {
                    "hr": cached_questions.get("hr", []),
                    "technical": cached_questions.get("technical", []),
                    "scenario": cached_questions.get("scenario", [])
                },
                "interview_process": cached_process,
                "cached": True
            }), 200

        # --------------------------------------------------
        # 🔍 DETECTION (Experience Level & Role Type)
        # --------------------------------------------------
        print(f"🔍 Detecting experience level and role type for user {user_id}")
        
        try:
            experience_level = detect_experience_level(jd_text)
        except Exception as exp_err:
            print(f"⚠️ Experience detection failed: {exp_err}")
            experience_level = "Not specified"
        
        try:
            role_type = detect_role_type(jd_text)
        except Exception as role_err:
            print(f"⚠️ Role detection failed: {role_err}")
            role_type = "General"
        
        try:
            company_type = detect_company_type(jd_text)
        except Exception as comp_err:
            print(f"⚠️ Company type detection failed: {comp_err}")
            company_type = "general"
        
        try:
            company_name = extract_company_name(jd_text)
        except Exception as name_err:
            print(f"⚠️ Company name extraction failed: {name_err}")
            company_name = "Company"

        # --------------------------------------------------
        # 🗺️ BUILD INTERVIEW PROCESS
        # --------------------------------------------------
        print(f"🗺️ Building interview process roadmap")
        
        # Try to extract process from JD first
        extracted_stages = extract_interview_process_from_jd(jd_text)
        
        # If JD mentions process, use it; otherwise use defaults
        if extracted_stages and len(extracted_stages) >= 3:
            process_stages = extracted_stages
            print(f"✅ Extracted {len(extracted_stages)} stages from JD")
        else:
            process_stages = get_default_interview_process(company_type, role_type)
            print(f"✅ Using default {company_type} process ({len(process_stages)} stages)")
        
        interview_process = {
            "company_type": company_type,
            "company_name": company_name,
            "stages": process_stages
        }

        # --------------------------------------------------
        # 🧠 GEMINI – GENERATE INTERVIEW QUESTIONS
        # --------------------------------------------------
        print(f"🧠 Generating interview questions for {role_type} role ({experience_level} level)")
        
        try:
            questions = generate_interview_questions(
                jd_text=jd_text,
                experience=experience_level,
                role_type=role_type
            )
        except Exception as gemini_err:
            print(f"❌ Gemini generation failed: {gemini_err}")
            traceback.print_exc()
            return jsonify({
                "error": "Failed to generate interview questions. Please try again."
            }), 500

        # 🔒 Defensive fallback - ensure proper structure
        if not questions or not isinstance(questions, dict):
            print("⚠️ Invalid questions format, using empty structure")
            questions = {
                "hr": [],
                "technical": [],
                "scenario": []
            }
        
        # Ensure all required keys exist
        questions.setdefault("hr", [])
        questions.setdefault("technical", [])
        questions.setdefault("scenario", [])

        # Validate that questions are lists
        for key in ["hr", "technical", "scenario"]:
            if not isinstance(questions[key], list):
                questions[key] = []

        # --------------------------------------------------
        # 💾 SAVE TO FIRESTORE (History Tracking)
        # --------------------------------------------------
        try:
            db.collection("interviewPrepHistory").add({
                "user_id": user_id,
                "jd_text": jd_text[:500],  # Save only first 500 chars to reduce storage
                "experience_level": experience_level,
                "role_type": role_type,
                "questions_count": {
                    "hr": len(questions.get("hr", [])),
                    "technical": len(questions.get("technical", [])),
                    "scenario": len(questions.get("scenario", []))
                },
                "created_at": firestore.SERVER_TIMESTAMP
            })
            print(f"✅ Saved interview prep history for user {user_id}")
        except Exception as db_err:
            print(f"⚠️ Firestore history save failed: {db_err}")
            # Don't fail the request if history save fails

        # --------------------------------------------------
        # 💾 SAVE TO CACHE (For Future Requests)
        # --------------------------------------------------
        try:
            save_questions_to_cache(
                user_id=user_id,
                jd_text=jd_text,
                questions={
                    "experience_level": experience_level,
                    "role_type": role_type,
                    "hr": questions.get("hr", []),
                    "technical": questions.get("technical", []),
                    "scenario": questions.get("scenario", [])
                },
                interview_process=interview_process,
                experience_level=experience_level,
                role_type=role_type
            )
        except Exception as cache_err:
            print(f"⚠️ Cache save failed: {cache_err}")
            # Don't fail the request if cache save fails

        # --------------------------------------------------
        # ✅ RESPONSE
        # --------------------------------------------------
        total_questions = (
            len(questions.get("hr", [])) +
            len(questions.get("technical", [])) +
            len(questions.get("scenario", []))
        )
        
        print(f"✅ Generated {total_questions} questions for user {user_id}")
        
        return jsonify({
            "experience_level": experience_level,
            "role_type": role_type,
            "questions": {
                "hr": questions.get("hr", []),
                "technical": questions.get("technical", []),
                "scenario": questions.get("scenario", [])
            },
            "interview_process": interview_process,
            "cached": False,
            "total_questions": total_questions
        }), 200

    except Exception as e:
        print("❌ Interview prep error:", repr(e))
        traceback.print_exc()
        return jsonify({
            "error": "An unexpected error occurred. Please try again."
        }), 500


@interview_blueprint.route("/interview-prep/clear-cache", methods=["POST"])
def clear_interview_cache():
    """
    Optional endpoint to clear cached interview questions
    Useful for testing or when user wants fresh questions
    """
    try:
        # Auth check
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Unauthorized"}), 401

        token = auth_header.replace("Bearer ", "").strip()
        decoded = auth.verify_id_token(token)
        user_id = decoded.get("uid")

        if not user_id:
            return jsonify({"error": "Invalid user"}), 401

        # Delete user's cached questions
        cache_docs = db.collection("interviewPrepCache").where("user_id", "==", user_id).stream()
        deleted_count = 0
        
        for doc in cache_docs:
            doc.reference.delete()
            deleted_count += 1

        return jsonify({
            "message": f"Cleared {deleted_count} cached question sets",
            "deleted": deleted_count
        }), 200

    except Exception as e:
        print(f"❌ Cache clear error: {e}")
        return jsonify({
            "error": "Failed to clear cache"
        }), 500








# from flask import Blueprint, request, jsonify
# from firebase_admin import auth, firestore
# from utils.interview_utils import (
#     detect_experience_level,
#     detect_role_type
# )
# from utils.gemini_utils import generate_interview_questions

# # ✅ Initialize Firestore client (after firebase_admin.initialize_app() in your app entrypoint)
# db = firestore.client()

# interview_blueprint = Blueprint("interview_prep", __name__)


# @interview_blueprint.route("/interview-prep", methods=["POST"])
# def interview_prep():
#     try:
#         # --------------------------------------------------
#         # 🔐 AUTH
#         # --------------------------------------------------
#         auth_header = request.headers.get("Authorization", "")
#         if not auth_header.startswith("Bearer "):
#             return jsonify({"error": "Unauthorized"}), 401

#         token = auth_header.replace("Bearer ", "").strip()
#         decoded = auth.verify_id_token(token)
#         user_id = decoded.get("uid")

#         if not user_id:
#             return jsonify({"error": "Invalid user"}), 401

#         # --------------------------------------------------
#         # 📥 INPUT
#         # --------------------------------------------------
#         data = request.get_json(silent=True) or {}
#         jd_text = (data.get("jd_text") or "").strip()

#         if not jd_text or len(jd_text) < 50:
#             return jsonify({
#                 "error": "Job Description text is too short or missing."
#             }), 400

#         # --------------------------------------------------
#         # 🔍 DETECTION
#         # --------------------------------------------------
#         experience_level = detect_experience_level(jd_text)
#         role_type = detect_role_type(jd_text)

#         # --------------------------------------------------
#         # 🧠 GEMINI – INTERVIEW QUESTIONS
#         # --------------------------------------------------
#         questions = generate_interview_questions(
#             jd_text=jd_text,
#             experience=experience_level,
#             role_type=role_type
#         )

#         # 🔒 Defensive fallback
#         if not questions or not isinstance(questions, dict):
#             questions = {
#                 "hr": [],
#                 "technical": [],
#                 "scenario": []
#             }

#         # --------------------------------------------------
#         # 💾 SAVE TO FIRESTORE (optional history tracking)
#         # --------------------------------------------------
#         try:
#             db.collection("interviewPrepHistory").add({
#                 "user_id": user_id,
#                 "jd_text": jd_text,
#                 "experience_level": experience_level,
#                 "role_type": role_type,
#                 "questions": questions,
#                 "created_at": firestore.SERVER_TIMESTAMP
#             })
#         except Exception as db_err:
#             print("⚠️ Firestore save failed:", db_err)

#         # --------------------------------------------------
#         # ✅ RESPONSE
#         # --------------------------------------------------
#         return jsonify({
#             "experience_level": experience_level,
#             "role_type": role_type,
#             "questions": {
#                 "hr": questions.get("hr", []),
#                 "technical": questions.get("technical", []),
#                 "scenario": questions.get("scenario", [])
#             }
#         }), 200

#     except Exception as e:
#         print("❌ Interview prep error:", repr(e))
#         return jsonify({
#             "error": "Internal server error"
#         }), 500