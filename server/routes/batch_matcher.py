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
# -------------------------------------------------
from utils.extract_text import extract_text, ScannedPDFError, EncryptedPDFError, CorruptedFileError
from utils.gemini_utils import analyze_with_gemini
from utils.matcher import is_technical_text

batch_blueprint = Blueprint('batch_matcher', __name__)

UPLOAD_FOLDER = "/tmp/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_RESUME_EXTENSIONS = {'pdf', 'docx'}
ALLOWED_JD_EXTENSIONS     = {'pdf', 'docx', 'txt'}

MAX_JD_FILES  = 10
MAX_FILE_SIZE = 10 * 1024 * 1024   # 10MB


# -------------------------------------------------
# Helpers
# -------------------------------------------------

def allowed_file(filename, allowed_exts):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_exts


def generate_batch_id(user_id, resume_text):
    combined = f"{user_id}|{resume_text[:500]}|{time.time()}"
    return hashlib.sha256(combined.encode("utf-8")).hexdigest()


def unique_filename(user_id, original_name):
    safe_name = secure_filename(original_name)
    prefix    = f"{user_id[:8]}_{uuid.uuid4().hex[:8]}_"
    return prefix + safe_name


def cleanup_files(*file_paths):
    for path in file_paths:
        try:
            if path and os.path.exists(path):
                os.remove(path)
                print(f"🗑️ Cleaned up: {os.path.basename(path)}")
        except Exception as e:
            print(f"⚠️ Cleanup warning for {path}: {e}")


# -------------------------------------------------
# ✅ FIX 1: Centralised token verifier
# Uses check_revoked=False to prevent false
# "opened on another device" 401 errors
# -------------------------------------------------
def _verify_token(request):
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None, (jsonify({"error": "Unauthorized"}), 401)

    token = auth_header.split("Bearer ", 1)[1].strip()

    try:
        decoded = auth.verify_id_token(token, check_revoked=False)  # ✅ FIX
        return decoded["uid"], None
    except auth.ExpiredIdTokenError:
        return None, (jsonify({
            "error": "Your session has expired. Please log in again."
        }), 401)
    except Exception as e:
        print(f"❌ Auth error: {e}")
        return None, (jsonify({
            "error": "Invalid or expired authentication token. Please log in again."
        }), 401)


# -------------------------------------------------
# 🚀 BATCH ANALYZE ROUTE
# -------------------------------------------------
@batch_blueprint.route('/batch/analyze', methods=['POST'])
def batch_analyze():
    resume_path    = None
    jd_paths_saved = []

    try:

        # ════════════════════════════════════════
        # 1. AUTH
        # ════════════════════════════════════════
        user_id, auth_error = _verify_token(request)
        if auth_error:
            return auth_error

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
        # 5. SAVE RESUME
        # ════════════════════════════════════════
        resume_unique_name = unique_filename(user_id, resume_name)
        resume_path        = os.path.join(UPLOAD_FOLDER, resume_unique_name)
        resume.save(resume_path)

        # ════════════════════════════════════════
        # 6. EXTRACT RESUME TEXT
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
        # ════════════════════════════════════════
        results       = []
        skipped_files = []

        for idx, jd_file in enumerate(jd_files):
            jd_path = None

            try:
                jd_name = secure_filename(jd_file.filename)

                if not jd_name or jd_file.filename == '':
                    skipped_files.append(f"File {idx+1} (no filename)")
                    continue

                if not allowed_file(jd_name, ALLOWED_JD_EXTENSIONS):
                    skipped_files.append(f"{jd_name} (invalid format — use PDF, DOCX, or TXT)")
                    print(f"⚠️ Skipping {jd_name} — invalid format")
                    continue

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

                jd_unique_name = unique_filename(user_id, jd_name)
                jd_path        = os.path.join(UPLOAD_FOLDER, jd_unique_name)
                jd_paths_saved.append(jd_path)
                jd_file.save(jd_path)

                # Extract JD text
                try:
                    jd_text = extract_text(jd_path)
                except EncryptedPDFError:
                    skipped_files.append(f"{jd_name} (password-protected PDF)")
                    continue
                except CorruptedFileError:
                    skipped_files.append(f"{jd_name} (corrupted file)")
                    continue
                except ScannedPDFError:
                    skipped_files.append(f"{jd_name} (scanned PDF — no text)")
                    continue
                except (ValueError, RuntimeError):
                    skipped_files.append(f"{jd_name} (unreadable)")
                    continue

                if not jd_text or not jd_text.strip() or len(jd_text.strip()) < 50:
                    skipped_files.append(f"{jd_name} (too short or empty)")
                    continue

                if not is_technical_text(jd_text):
                    skipped_files.append(f"{jd_name} (not a technical job description)")
                    print(f"⚠️ Skipping {jd_name} — not technical")
                    continue

                print(f"🔄 Analyzing {idx + 1}/{len(jd_files)}: {jd_name}")

                # ════════════════════════════════════════
                # ✅ FIX 2: Gemini call with proper fallback
                # When Gemini returns empty lists for
                # missing_keywords or suggestions, we now
                # guarantee the frontend always gets valid
                # arrays — never None or missing keys.
                # This was causing the blank card for
                # SkyMeric_LLM_SME_JD1.pdf
                # ════════════════════════════════════════
                try:
                    gemini_result = analyze_with_gemini(resume_text, jd_text) or {}
                except Exception as e:
                    print(f"❌ Gemini error for {jd_name}: {e}")
                    skipped_files.append(f"{jd_name} (AI analysis failed — please retry)")
                    continue

                score              = gemini_result.get("score", 0)
                missing_keywords   = gemini_result.get("missing_keywords") or []   # ✅ None → []
                suggestions        = gemini_result.get("suggestions") or []        # ✅ None → []
                learning_resources = gemini_result.get("learning_resources") or [] # ✅ None → []
                is_fallback        = gemini_result.get("is_fallback", False)

                # ✅ FIX 3: If score came back 0 and everything is
                # empty, Gemini silently failed — skip this JD
                # instead of showing a blank card
                if score == 0 and not missing_keywords and not suggestions:
                    print(f"⚠️ Gemini returned empty result for {jd_name} — skipping")
                    skipped_files.append(f"{jd_name} (AI returned no data — please retry)")
                    continue

                results.append({
                    "jd_name":            jd_name,
                    "jd_text":            jd_text[:500],
                    "score":              score,
                    "missing_keywords":   missing_keywords,
                    "suggestions":        suggestions,
                    "learning_resources": learning_resources,
                    "is_fallback_score":  is_fallback,
                    "rank":               0,
                    "match_quality":      get_match_quality(score),
                    "priority":           get_priority_level(score, missing_keywords),
                })

                print(f"✅ {jd_name} — Score: {score}%"
                      f"{' (estimated)' if is_fallback else ''}")

            except Exception as e:
                print(f"❌ Error processing {jd_file.filename}: {e}")
                traceback.print_exc()
                skipped_files.append(f"{jd_file.filename} (processing error)")
                continue

            finally:
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
        # ════════════════════════════════════════
        batch_id = generate_batch_id(user_id, resume_text)

        try:
            db.collection("batch_analysis").document(batch_id).set({
                "user_id":       user_id,
                "resume_name":   resume_name,
                "total_jobs":    len(results),
                "top_score":     results[0]['score'] if results else 0,
                "skipped_count": len(skipped_files),
                "timestamp":     firestore.SERVER_TIMESTAMP,
            })

            batch_ref = db.collection("batch_analysis").document(batch_id)
            for i, result in enumerate(results):
                batch_ref.collection("results").document(str(i)).set(result)

            print(f"💾 Saved batch: {batch_id[:12]}... ({len(results)} results)")

        except Exception as e:
            print(f"⚠️ Firestore save failed (non-fatal): {e}")

        # ════════════════════════════════════════
        # 11. CLEANUP + RESPONSE
        # ════════════════════════════════════════
        cleanup_files(resume_path)

        response_data = {
            "success":             True,
            "batch_id":            batch_id,
            "resume_name":         resume_name,
            "total_jobs_analyzed": len(results),
            "results":             results,
        }

        if skipped_files:
            response_data["warning"]       = (
                f"{len(skipped_files)} file(s) were skipped "
                f"(scanned PDFs, invalid format, encrypted, or too short)"
            )
            response_data["skipped_files"] = skipped_files

        return jsonify(response_data), 200

    except Exception as e:
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
    try:
        user_id, auth_error = _verify_token(request)
        if auth_error:
            return auth_error

        doc_ref = db.collection("batch_analysis").document(batch_id)
        doc     = doc_ref.get()

        if not doc.exists:
            return jsonify({"error": "Batch analysis not found."}), 404

        data = doc.to_dict()

        if data.get("user_id") != user_id:
            return jsonify({"error": "Unauthorized access."}), 403

        results_docs = doc_ref.collection("results").order_by("__name__").stream()
        data["results"] = [r.to_dict() for r in results_docs]

        return jsonify({"success": True, "data": data}), 200

    except Exception as e:
        print("❌ Get batch results error:", e)
        traceback.print_exc()
        return jsonify({"error": "Failed to retrieve batch results."}), 500


# -------------------------------------------------
# HELPER FUNCTIONS
# -------------------------------------------------

def get_match_quality(score):
    if score >= 85:   return "Excellent"
    elif score >= 70: return "Good"
    elif score >= 60: return "Fair"
    else:             return "Poor"


def get_priority_level(score, missing_keywords):
    if score >= 85 and len(missing_keywords) <= 2:   return "HIGH"
    elif score >= 70 and len(missing_keywords) <= 5: return "MEDIUM"
    else:                                             return "LOW"
