# server/routes/batch_matcher.py

import os
import sys
import uuid
import traceback
import hashlib
import time
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
# ✅ FIX: Import new exception classes from updated extract_text.py
# -------------------------------------------------
from utils.extract_text import extract_text, ScannedPDFError, EncryptedPDFError, CorruptedFileError
from utils.gemini_utils import analyze_with_gemini
from utils.matcher import is_technical_text

batch_blueprint = Blueprint('batch_matcher', __name__)

# -------------------------------------------------
# ✅ FIX (Issue #15): Consistent upload folder with upload.py
# Was /tmp — now /tmp/uploads to match all other routes
# -------------------------------------------------
UPLOAD_FOLDER = "/tmp/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_RESUME_EXTENSIONS = {'pdf', 'docx'}
ALLOWED_JD_EXTENSIONS     = {'pdf', 'docx', 'txt'}

# -------------------------------------------------
# ✅ FIX (Issue #3 / Frontend #5): Max JD file limit
# Prevents unlimited Gemini calls burning quota
# Synced with frontend BatchJobMatcher.jsx limit
# -------------------------------------------------
MAX_JD_FILES  = 10
MAX_FILE_SIZE = 10 * 1024 * 1024   # 10MB


# -------------------------------------------------
# Helpers
# -------------------------------------------------

def allowed_file(filename, allowed_exts):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_exts


def generate_batch_id(user_id, resume_text):
    """Generate unique ID for this batch analysis"""
    combined = f"{user_id}|{resume_text[:500]}|{time.time()}"
    return hashlib.sha256(combined.encode("utf-8")).hexdigest()


def unique_filename(user_id, original_name):
    """
    ✅ FIX (Issue #2): Unique filename prevents collision when
    two users upload resume.pdf at the same time.
    Format: {short_uid}_{uuid}_{original_name}
    """
    safe_name = secure_filename(original_name)
    prefix    = f"{user_id[:8]}_{uuid.uuid4().hex[:8]}_"
    return prefix + safe_name


def cleanup_files(*file_paths):
    """
    ✅ FIX (Issue #1): Safely remove temp files after processing.
    Old code never deleted files — caused RAM exhaustion on GCP.
    """
    for path in file_paths:
        try:
            if path and os.path.exists(path):
                os.remove(path)
                print(f"🗑️ Cleaned up: {os.path.basename(path)}")
        except Exception as e:
            print(f"⚠️ Cleanup warning for {path}: {e}")


# -------------------------------------------------
# 🚀 BATCH ANALYZE ROUTE
# -------------------------------------------------
@batch_blueprint.route('/batch/analyze', methods=['POST'])
def batch_analyze():
    """
    Analyze one resume against multiple job descriptions.
    Returns ranked list of matches.
    """
    resume_path     = None
    jd_paths_saved  = []   # ✅ Track all saved JD paths for cleanup

    try:

        # ════════════════════════════════════════
        # 1. AUTH
        # ✅ FIX (Issue #11): Separate ExpiredIdTokenError so user
        # gets "session expired" instead of generic "unexpected error"
        # ════════════════════════════════════════
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Unauthorized"}), 401

        try:
            id_token      = auth_header.split("Bearer ")[1]
            decoded_token = auth.verify_id_token(id_token)
            user_id       = decoded_token["uid"]
        except auth.ExpiredIdTokenError:
            return jsonify({
                "error": "Your session has expired. Please log in again."
            }), 401
        except Exception as e:
            print(f"❌ Auth error: {e}")
            return jsonify({
                "error": "Invalid or expired authentication token. Please log in again."
            }), 401

        print(f"📊 Batch analysis request from user: {user_id}")

        # ════════════════════════════════════════
        # 2. FILE PRESENCE CHECK
        # ════════════════════════════════════════
        if 'resume' not in request.files:
            return jsonify({"error": "Resume file is required."}), 400

        if 'jds' not in request.files:
            return jsonify({"error": "At least one job description file is required."}), 400

        resume   = request.files['resume']
        jd_files = request.files.getlist('jds')

        if not jd_files or all(f.filename == '' for f in jd_files):
            return jsonify({"error": "No job description files uploaded."}), 400

        print(f"📄 Resume: {resume.filename}")
        print(f"📋 Job Descriptions: {len(jd_files)} files")

        # ════════════════════════════════════════
        # 3. JD COUNT LIMIT
        # ✅ FIX (Issue #3 / Frontend #5): Hard cap on JD files
        # ════════════════════════════════════════
        if len(jd_files) > MAX_JD_FILES:
            return jsonify({
                "error": f"Too many job descriptions. Maximum allowed is {MAX_JD_FILES} files per batch. "
                         f"You uploaded {len(jd_files)} files."
            }), 400

        # ════════════════════════════════════════
        # 4. RESUME VALIDATION + SIZE CHECK
        # ════════════════════════════════════════
        resume_name = secure_filename(resume.filename)

        if not allowed_file(resume_name, ALLOWED_RESUME_EXTENSIONS):
            return jsonify({
                "error": "Invalid resume format. Only PDF and DOCX files are allowed."
            }), 400

        # Check resume size before saving
        resume.seek(0, 2)
        resume_size = resume.tell()
        resume.seek(0)

        if resume_size == 0:
            return jsonify({"error": "Resume file is empty."}), 400

        if resume_size > MAX_FILE_SIZE:
            size_mb = resume_size / (1024 * 1024)
            return jsonify({
                "error": f"Resume file is too large ({size_mb:.1f}MB). Maximum size is 10MB."
            }), 413

        # ════════════════════════════════════════
        # 5. SAVE RESUME WITH UNIQUE FILENAME
        # ✅ FIX (Issue #2): Unique name prevents collision
        # ════════════════════════════════════════
        resume_unique_name = unique_filename(user_id, resume_name)
        resume_path        = os.path.join(UPLOAD_FOLDER, resume_unique_name)
        resume.save(resume_path)

        # ════════════════════════════════════════
        # 6. EXTRACT RESUME TEXT
        # ✅ FIX: Catches all new exception types from extract_text.py
        # ════════════════════════════════════════
        try:
            resume_text = extract_text(resume_path)
        except EncryptedPDFError as e:
            cleanup_files(resume_path)
            return jsonify({"error": str(e)}), 400
        except CorruptedFileError as e:
            cleanup_files(resume_path)
            return jsonify({"error": str(e)}), 400
        except ScannedPDFError as e:
            cleanup_files(resume_path)
            return jsonify({"error": str(e)}), 400
        except (ValueError, RuntimeError) as e:
            cleanup_files(resume_path)
            return jsonify({"error": str(e)}), 400

        if not resume_text or not resume_text.strip():
            cleanup_files(resume_path)
            return jsonify({"error": "Resume appears to be empty or unreadable."}), 400

        if not is_technical_text(resume_text):
            cleanup_files(resume_path)
            return jsonify({
                "error": "Resume does not appear to contain technical skills. "
                         "Please ensure your resume lists relevant technical skills."
            }), 400

        print(f"✅ Resume extracted: {len(resume_text)} characters")

        # ════════════════════════════════════════
        # 7. PROCESS EACH JD
        # ✅ FIX (Issue #1): Each JD file is cleaned up immediately
        # after processing — not left in /tmp forever
        # ════════════════════════════════════════
        results       = []
        skipped_files = []

        for idx, jd_file in enumerate(jd_files):
            jd_path = None   # Track per-JD for cleanup in finally

            try:
                jd_name = secure_filename(jd_file.filename)

                if not jd_name or jd_file.filename == '':
                    skipped_files.append(f"File {idx+1} (no filename)")
                    continue

                # Validate extension
                if not allowed_file(jd_name, ALLOWED_JD_EXTENSIONS):
                    skipped_files.append(f"{jd_name} (invalid format — use PDF, DOCX, or TXT)")
                    print(f"⚠️ Skipping {jd_name} — invalid format")
                    continue

                # Check JD file size
                jd_file.seek(0, 2)
                jd_size = jd_file.tell()
                jd_file.seek(0)

                if jd_size == 0:
                    skipped_files.append(f"{jd_name} (empty file)")
                    continue

                if jd_size > MAX_FILE_SIZE:
                    size_mb = jd_size / (1024 * 1024)
                    skipped_files.append(f"{jd_name} (too large: {size_mb:.1f}MB)")
                    continue

                # ✅ FIX (Issue #2): Unique JD filename
                jd_unique_name = unique_filename(user_id, jd_name)
                jd_path        = os.path.join(UPLOAD_FOLDER, jd_unique_name)
                jd_paths_saved.append(jd_path)
                jd_file.save(jd_path)

                # Extract JD text
                try:
                    jd_text = extract_text(jd_path)
                except EncryptedPDFError:
                    skipped_files.append(f"{jd_name} (password-protected PDF)")
                    print(f"⚠️ Skipping {jd_name} — encrypted PDF")
                    continue
                except CorruptedFileError:
                    skipped_files.append(f"{jd_name} (corrupted file)")
                    print(f"⚠️ Skipping {jd_name} — corrupted")
                    continue
                except ScannedPDFError:
                    skipped_files.append(f"{jd_name} (scanned PDF — no text)")
                    print(f"⚠️ Skipping {jd_name} — scanned PDF")
                    continue
                except (ValueError, RuntimeError):
                    skipped_files.append(f"{jd_name} (unreadable)")
                    print(f"⚠️ Skipping {jd_name} — extraction failed")
                    continue

                if not jd_text or not jd_text.strip() or len(jd_text.strip()) < 50:
                    skipped_files.append(f"{jd_name} (too short or empty)")
                    print(f"⚠️ Skipping {jd_name} — too short")
                    continue

                if not is_technical_text(jd_text):
                    skipped_files.append(f"{jd_name} (not a technical job description)")
                    print(f"⚠️ Skipping {jd_name} — not technical")
                    continue

                print(f"🔄 Analyzing {idx + 1}/{len(jd_files)}: {jd_name}")

                # Gemini analysis
                gemini_result    = analyze_with_gemini(resume_text, jd_text) or {}
                score            = gemini_result.get("score", 0)
                missing_keywords = gemini_result.get("missing_keywords", [])
                suggestions      = gemini_result.get("suggestions", [])
                learning_resources = gemini_result.get("learning_resources", [])
                is_fallback      = gemini_result.get("is_fallback", False)

                results.append({
                    "jd_name":           jd_name,
                    "jd_text":           jd_text[:500],
                    "score":             score,
                    "missing_keywords":  missing_keywords,
                    "suggestions":       suggestions,
                    "learning_resources": learning_resources,
                    "is_fallback_score": is_fallback,
                    "rank":              0,
                    "match_quality":     get_match_quality(score),
                    "priority":          get_priority_level(score, missing_keywords)
                })

                print(f"✅ {jd_name} — Score: {score}%"
                      f"{' (estimated)' if is_fallback else ''}")

            except Exception as e:
                print(f"❌ Error processing {jd_file.filename}: {e}")
                traceback.print_exc()
                skipped_files.append(f"{jd_file.filename} (processing error)")
                continue

            finally:
                # ✅ FIX (Issue #1): Delete each JD immediately after use
                # This is the core RAM fix — files deleted one by one
                # not left accumulating in /tmp
                if jd_path:
                    cleanup_files(jd_path)

        # ════════════════════════════════════════
        # 8. VALIDATE RESULTS
        # ════════════════════════════════════════
        if not results:
            cleanup_files(resume_path)
            error_msg = "No valid job descriptions could be processed."
            if skipped_files:
                error_msg += " Skipped: " + ", ".join(skipped_files[:5])
                if len(skipped_files) > 5:
                    error_msg += f" and {len(skipped_files) - 5} more."
                error_msg += " Tip: Make sure all files are text-based PDFs or DOCX (not scanned images)."
            return jsonify({"error": error_msg}), 400

        # ════════════════════════════════════════
        # 9. SORT AND RANK
        # ════════════════════════════════════════
        results.sort(key=lambda x: x['score'], reverse=True)
        for idx, result in enumerate(results):
            result['rank'] = idx + 1

        print(f"🎯 Batch complete: {len(results)} ranked, {len(skipped_files)} skipped")

        # ════════════════════════════════════════
        # 10. SAVE TO FIRESTORE
        # ✅ FIX (Issue #7): Save summary + results separately
        # to stay well under Firestore's 1MB document limit.
        # Each result saved as its own subcollection document.
        # ════════════════════════════════════════
        batch_id = generate_batch_id(user_id, resume_text)

        try:
            # Main document — summary only (small, always under limit)
            db.collection("batch_analysis").document(batch_id).set({
                "user_id":       user_id,
                "resume_name":   resume_name,
                "total_jobs":    len(results),
                "top_score":     results[0]['score'] if results else 0,
                "skipped_count": len(skipped_files),
                "timestamp":     firestore.SERVER_TIMESTAMP
            })

            # Results as subcollection — each doc is one JD result
            batch_ref = db.collection("batch_analysis").document(batch_id)
            for i, result in enumerate(results):
                batch_ref.collection("results").document(str(i)).set(result)

            print(f"💾 Saved batch: {batch_id[:12]}... "
                  f"({len(results)} results in subcollection)")

        except Exception as e:
            # Firestore failure is non-fatal — return results anyway
            print(f"⚠️ Firestore save failed (non-fatal): {e}")

        # ════════════════════════════════════════
        # 11. CLEANUP RESUME + RESPONSE
        # ✅ FIX (Issue #1): Resume cleaned up after all processing done
        # ════════════════════════════════════════
        cleanup_files(resume_path)

        response_data = {
            "success":              True,
            "batch_id":             batch_id,
            "resume_name":          resume_name,
            "total_jobs_analyzed":  len(results),
            "results":              results
        }

        if skipped_files:
            response_data["warning"]       = (
                f"{len(skipped_files)} file(s) were skipped "
                f"(scanned PDFs, invalid format, encrypted, or too short)"
            )
            response_data["skipped_files"] = skipped_files

        return jsonify(response_data), 200

    except Exception as e:
        # ✅ FIX: Cleanup all files on unexpected crash
        cleanup_files(resume_path)
        cleanup_files(*jd_paths_saved)
        print("❌ Batch analysis unexpected error:")
        traceback.print_exc()
        return jsonify({
            "error": "An unexpected error occurred during batch analysis. Please try again."
        }), 500


# -------------------------------------------------
# 🔍 GET BATCH RESULTS
# -------------------------------------------------
@batch_blueprint.route('/batch/<batch_id>', methods=['GET'])
def get_batch_results(batch_id):
    """
    Retrieve saved batch analysis results from subcollection.
    ✅ FIX: Reads from subcollection to match new save structure.
    """
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Unauthorized"}), 401

        try:
            id_token      = auth_header.split("Bearer ")[1]
            decoded_token = auth.verify_id_token(id_token)
            user_id       = decoded_token["uid"]
        except auth.ExpiredIdTokenError:
            return jsonify({
                "error": "Your session has expired. Please log in again."
            }), 401
        except Exception:
            return jsonify({
                "error": "Invalid or expired authentication token."
            }), 401

        # Get main document
        doc_ref = db.collection("batch_analysis").document(batch_id)
        doc     = doc_ref.get()

        if not doc.exists:
            return jsonify({"error": "Batch analysis not found."}), 404

        data = doc.to_dict()

        # Ownership check
        if data.get("user_id") != user_id:
            return jsonify({"error": "Unauthorized access."}), 403

        # Fetch results from subcollection
        results_docs = doc_ref.collection("results").order_by(
            "__name__"
        ).stream()

        results = []
        for r in results_docs:
            results.append(r.to_dict())

        data["results"] = results

        return jsonify({"success": True, "data": data}), 200

    except Exception as e:
        print("❌ Get batch results error:", e)
        traceback.print_exc()
        return jsonify({"error": "Failed to retrieve batch results."}), 500


# -------------------------------------------------
# HELPER FUNCTIONS (unchanged)
# -------------------------------------------------

def get_match_quality(score):
    if score >= 85:  return "Excellent"
    elif score >= 70: return "Good"
    elif score >= 60: return "Fair"
    else:             return "Poor"


def get_priority_level(score, missing_keywords):
    if score >= 85 and len(missing_keywords) <= 2:   return "HIGH"
    elif score >= 70 and len(missing_keywords) <= 5: return "MEDIUM"
    else:                                             return "LOW"




# # server/routes/batch_matcher.py

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

# batch_blueprint = Blueprint('batch_matcher', __name__)

# UPLOAD_FOLDER = "/tmp"
# os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ALLOWED_RESUME_EXTENSIONS = {'pdf', 'docx'}
# ALLOWED_JD_EXTENSIONS = {'pdf', 'docx', 'txt'}


# def allowed_file(filename, allowed_exts):
#     return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_exts


# def generate_batch_id(user_id, resume_text):
#     """Generate unique ID for batch analysis"""
#     import time
#     combined = f"{user_id}|{resume_text[:500]}|{time.time()}"
#     return hashlib.sha256(combined.encode("utf-8")).hexdigest()


# # -------------------------------------------------
# # 🚀 BATCH ANALYZE ROUTE
# # -------------------------------------------------
# @batch_blueprint.route('/batch/analyze', methods=['POST'])
# def batch_analyze():
#     """
#     Analyze one resume against multiple job descriptions.
#     Returns ranked list of matches.
#     """
#     try:
#         # ---------------- AUTH ----------------
#         auth_header = request.headers.get("Authorization")
#         if not auth_header or not auth_header.startswith("Bearer "):
#             return jsonify({"error": "Unauthorized"}), 401

#         id_token = auth_header.split("Bearer ")[1]
#         decoded_token = auth.verify_id_token(id_token)
#         user_id = decoded_token["uid"]

#         print(f"📊 Batch analysis request from user: {user_id}")

#         # ---------------- FILE VALIDATION ----------------
#         if 'resume' not in request.files:
#             return jsonify({"error": "Resume file required"}), 400

#         if 'jds' not in request.files:
#             return jsonify({"error": "At least one job description required"}), 400

#         resume = request.files['resume']
#         jd_files = request.files.getlist('jds')

#         if not jd_files:
#             return jsonify({"error": "No job descriptions uploaded"}), 400

#         print(f"📄 Resume: {resume.filename}")
#         print(f"📋 Job Descriptions: {len(jd_files)} files")

#         # Validate resume
#         resume_name = secure_filename(resume.filename)
#         if not allowed_file(resume_name, ALLOWED_RESUME_EXTENSIONS):
#             return jsonify({"error": "Invalid resume format. Only PDF and DOCX allowed."}), 400

#         # Save resume
#         resume_path = os.path.join(UPLOAD_FOLDER, resume_name)
#         resume.save(resume_path)

#         # Extract resume text ONCE - with proper error handling
#         try:
#             resume_text = extract_text(resume_path)
#         except ScannedPDFError as e:
#             return jsonify({"error": str(e)}), 400
#         except (ValueError, RuntimeError) as e:
#             return jsonify({"error": str(e)}), 400
        
#         if not resume_text.strip():
#             return jsonify({"error": "Resume is empty or unreadable"}), 400

#         # Validate resume is technical
#         if not is_technical_text(resume_text):
#             return jsonify({"error": "Resume does not appear to be technical"}), 400

#         print(f"✅ Resume extracted: {len(resume_text)} characters")

#         # ---------------- PROCESS EACH JD ----------------
#         results = []
#         skipped_files = []
        
#         for idx, jd_file in enumerate(jd_files):
#             try:
#                 jd_name = secure_filename(jd_file.filename)
                
#                 # Validate JD file
#                 if not allowed_file(jd_name, ALLOWED_JD_EXTENSIONS):
#                     skipped_files.append(f"{jd_name} (invalid format)")
#                     print(f"⚠️ Skipping {jd_name} - invalid format")
#                     continue

#                 # Save JD
#                 jd_path = os.path.join(UPLOAD_FOLDER, jd_name)
#                 jd_file.save(jd_path)

#                 # Extract JD text - with error handling
#                 try:
#                     jd_text = extract_text(jd_path)
#                 except ScannedPDFError:
#                     skipped_files.append(f"{jd_name} (scanned PDF)")
#                     print(f"⚠️ Skipping {jd_name} - scanned PDF")
#                     continue
#                 except (ValueError, RuntimeError):
#                     skipped_files.append(f"{jd_name} (unreadable)")
#                     print(f"⚠️ Skipping {jd_name} - extraction failed")
#                     continue
                
#                 if not jd_text.strip() or len(jd_text.strip()) < 50:
#                     skipped_files.append(f"{jd_name} (too short)")
#                     print(f"⚠️ Skipping {jd_name} - too short or empty")
#                     continue

#                 # Validate JD is technical
#                 if not is_technical_text(jd_text):
#                     skipped_files.append(f"{jd_name} (not technical)")
#                     print(f"⚠️ Skipping {jd_name} - not technical")
#                     continue

#                 print(f"🔄 Processing {idx + 1}/{len(jd_files)}: {jd_name}")

#                 # ---------------- GEMINI ANALYSIS ----------------
#                 gemini_result = analyze_with_gemini(resume_text, jd_text) or {}

#                 score = gemini_result.get("score", 0)
#                 missing_keywords = gemini_result.get("missing_keywords", [])
#                 suggestions = gemini_result.get("suggestions", [])
#                 learning_resources = gemini_result.get("learning_resources", [])

#                 # ---------------- BUILD RESULT ----------------
#                 result = {
#                     "jd_name": jd_name,
#                     "jd_text": jd_text[:500],  # First 500 chars for preview
#                     "score": score,
#                     "missing_keywords": missing_keywords,
#                     "suggestions": suggestions,
#                     "learning_resources": learning_resources,
#                     "rank": 0,  # Will be set after sorting
#                     "match_quality": get_match_quality(score),
#                     "priority": get_priority_level(score, missing_keywords)
#                 }

#                 results.append(result)
#                 print(f"✅ {jd_name} - Score: {score}%")

#             except Exception as e:
#                 print(f"❌ Error processing {jd_file.filename}: {e}")
#                 traceback.print_exc()
#                 skipped_files.append(f"{jd_file.filename} (processing error)")
#                 continue

#         # ---------------- NO VALID RESULTS ----------------
#         if not results:
#             error_msg = "No valid job descriptions could be processed."
#             if skipped_files:
#                 error_msg += f"\n\nSkipped files:\n" + "\n".join(f"• {f}" for f in skipped_files)
#                 error_msg += "\n\nTip: Make sure all files are text-based PDFs or DOCX (not scanned images)."
            
#             return jsonify({"error": error_msg}), 400

#         # ---------------- SORT BY SCORE (HIGHEST FIRST) ----------------
#         results.sort(key=lambda x: x['score'], reverse=True)

#         # Assign ranks
#         for idx, result in enumerate(results):
#             result['rank'] = idx + 1

#         print(f"🎯 Batch analysis complete: {len(results)} jobs ranked")
#         if skipped_files:
#             print(f"⚠️ Skipped {len(skipped_files)} files")

#         # ---------------- SAVE TO FIRESTORE ----------------
#         batch_id = generate_batch_id(user_id, resume_text)
        
#         db.collection("batch_analysis").document(batch_id).set({
#             "user_id": user_id,
#             "resume_name": resume_name,
#             "total_jobs": len(results),
#             "top_score": results[0]['score'] if results else 0,
#             "results": results,
#             "skipped_count": len(skipped_files),
#             "timestamp": firestore.SERVER_TIMESTAMP
#         })

#         print(f"💾 Saved batch analysis: {batch_id}")

#         # ---------------- RESPONSE ----------------
#         response_data = {
#             "success": True,
#             "batch_id": batch_id,
#             "resume_name": resume_name,
#             "total_jobs_analyzed": len(results),
#             "results": results
#         }
        
#         # Add warning about skipped files
#         if skipped_files:
#             response_data["warning"] = f"{len(skipped_files)} file(s) were skipped (scanned PDFs, invalid format, or too short)"
#             response_data["skipped_files"] = skipped_files
        
#         return jsonify(response_data), 200

#     except Exception as e:
#         print("❌ Batch analysis error:")
#         traceback.print_exc()
#         return jsonify({"error": "An unexpected error occurred during batch analysis"}), 500


# # -------------------------------------------------
# # 🔍 GET BATCH RESULTS
# # -------------------------------------------------
# @batch_blueprint.route('/batch/<batch_id>', methods=['GET'])
# def get_batch_results(batch_id):
#     """
#     Retrieve saved batch analysis results.
#     """
#     try:
#         # Auth check
#         auth_header = request.headers.get("Authorization")
#         if not auth_header or not auth_header.startswith("Bearer "):
#             return jsonify({"error": "Unauthorized"}), 401

#         id_token = auth_header.split("Bearer ")[1]
#         decoded_token = auth.verify_id_token(id_token)
#         user_id = decoded_token["uid"]

#         # Get from Firestore
#         doc_ref = db.collection("batch_analysis").document(batch_id)
#         doc = doc_ref.get()

#         if not doc.exists:
#             return jsonify({"error": "Batch analysis not found"}), 404

#         data = doc.to_dict()

#         # Verify ownership
#         if data.get("user_id") != user_id:
#             return jsonify({"error": "Unauthorized access"}), 403

#         return jsonify({
#             "success": True,
#             "data": data
#         }), 200

#     except Exception as e:
#         print("❌ Get batch results error:", e)
#         traceback.print_exc()
#         return jsonify({"error": "Failed to retrieve results"}), 500


# # -------------------------------------------------
# # HELPER FUNCTIONS
# # -------------------------------------------------

# def get_match_quality(score):
#     """Return match quality label based on score"""
#     if score >= 85:
#         return "Excellent"
#     elif score >= 70:
#         return "Good"
#     elif score >= 60:
#         return "Fair"
#     else:
#         return "Poor"


# def get_priority_level(score, missing_keywords):
#     """Determine application priority"""
#     if score >= 85 and len(missing_keywords) <= 2:
#         return "HIGH"
#     elif score >= 70 and len(missing_keywords) <= 5:
#         return "MEDIUM"
#     else:
#         return "LOW"













