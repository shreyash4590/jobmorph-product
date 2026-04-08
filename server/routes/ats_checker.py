# server/routes/ats_checker.py

import os
import uuid
import time
import traceback
from flask import Blueprint, request, jsonify, send_file
from werkzeug.utils import secure_filename

from utils.ats_checker import detect_ats_issues, auto_fix_resume, get_before_after_comparison
from utils.preview_generator import generate_resume_preview_with_highlights

# ✅ FIX: Import all new exception types from updated extract_text.py
from utils.extract_text import ScannedPDFError, EncryptedPDFError, CorruptedFileError

ats_blueprint = Blueprint('ats', __name__)

# ✅ FIX (Issue #15): Consistent folder with upload.py and batch_matcher.py
UPLOAD_FOLDER = "/tmp/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ✅ FIX (Issue #15 from audit): Removed .doc — extract_text.py
# does not reliably support old .doc format, causes silent failures
ALLOWED_EXTENSIONS = {'pdf', 'docx'}

# ✅ FIX: Max file size enforced at route level
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def unique_filename(original_name):
    """
    ✅ FIX (Issue #2 from audit): Unique filename prevents collision
    when two users upload resume.pdf at the same time.
    ATS checker doesn't have user_id so uses pure UUID.
    """
    safe_name = secure_filename(original_name)
    return f"{uuid.uuid4().hex[:12]}_{safe_name}"


def cleanup_file(path):
    """Safely remove a single temp file."""
    try:
        if path and os.path.exists(path):
            os.remove(path)
    except Exception as e:
        print(f"⚠️ Cleanup warning: {e}")


# ======================================================
# 1. CHECK ATS ISSUES
# ======================================================

@ats_blueprint.route("/ats/check", methods=["POST", "OPTIONS"])
def check_ats():
    """
    Analyze uploaded resume for ATS issues.

    Request:  multipart/form-data with 'resume' file
    Response: JSON with issues, score, warnings, temp_file, original_extension
    """
    if request.method == "OPTIONS":
        return '', 204

    filepath = None

    try:
        # ── File presence ────────────────────────────────────────
        if 'resume' not in request.files:
            return jsonify({"error": "No resume file provided."}), 400

        file = request.files['resume']

        if not file or file.filename == '':
            return jsonify({"error": "No file selected."}), 400

        if not allowed_file(file.filename):
            return jsonify({
                "error": "Invalid file type. Only PDF and DOCX files are supported."
            }), 400

        # ── File size check ───────────────────────────────────────
        file.seek(0, 2)
        file_size = file.tell()
        file.seek(0)

        if file_size == 0:
            return jsonify({"error": "Uploaded file is empty."}), 400

        if file_size > MAX_FILE_SIZE:
            size_mb = file_size / (1024 * 1024)
            return jsonify({
                "error": f"File is too large ({size_mb:.1f}MB). Maximum size is 10MB."
            }), 413

        # ── Save with unique filename ─────────────────────────────
        unique_name = unique_filename(file.filename)
        filepath    = os.path.join(UPLOAD_FOLDER, unique_name)
        file.save(filepath)

        print(f"📄 ATS check: {unique_name}")

        # ── Analyze ───────────────────────────────────────────────
        # ✅ FIX: All 3 exception types handled with correct messages
        try:
            result = detect_ats_issues(filepath)

        except EncryptedPDFError as e:
            cleanup_file(filepath)
            return jsonify({
                "error": str(e),
                "is_encrypted_pdf": True
            }), 400

        except CorruptedFileError as e:
            cleanup_file(filepath)
            return jsonify({
                "error": str(e),
                "is_corrupted": True
            }), 400

        except ScannedPDFError as e:
            cleanup_file(filepath)
            return jsonify({
                "error": str(e),
                "is_scanned_pdf": True
            }), 400

        except (ValueError, RuntimeError) as e:
            cleanup_file(filepath)
            return jsonify({"error": str(e)}), 400

        # ── Attach temp file info for preview/fix endpoints ───────
        # Use unique_name so subsequent calls hit the right file
        result['temp_file']          = unique_name
        result['original_extension'] = os.path.splitext(unique_name)[1].lower()

        print(f"✅ ATS Score: {result['score']}/100 | "
              f"Issues: {len(result['issues'])} | "
              f"Warnings: {len(result['warnings'])}")

        # NOTE: File is NOT deleted here — it's needed for
        # /ats/preview and /ats/fix calls that follow immediately.
        # Files are deleted by /ats/fix after download, or by
        # the /ats/cleanup cron after 1 hour.

        return jsonify(result), 200

    except Exception as e:
        cleanup_file(filepath)
        print(f"❌ ATS check error: {e}")
        traceback.print_exc()
        return jsonify({"error": "An unexpected error occurred. Please try again."}), 500


# ======================================================
# 2. GENERATE PREVIEW WITH HIGHLIGHTS
# ======================================================

@ats_blueprint.route("/ats/preview", methods=["POST", "OPTIONS"])
def generate_preview():
    """
    Generate visual preview of resume with highlighted ATS issues.

    Request:  JSON { "filename": "uuid_resume.pdf" }
    Response: JSON { "success": true, "pages": [...], "total_pages": N }
    """
    if request.method == "OPTIONS":
        return '', 204

    try:
        data     = request.get_json(silent=True) or {}
        filename = data.get('filename', '').strip()

        if not filename:
            return jsonify({"error": "Filename is required."}), 400

        # ✅ FIX: secure_filename ensures no path traversal
        filename = secure_filename(filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)

        if not os.path.exists(filepath):
            return jsonify({
                "error": "Resume file not found. Please re-upload your resume."
            }), 404

        print(f"🖼️ Generating preview: {filename}")

        # ── Get issues for highlights ─────────────────────────────
        try:
            issues_result = detect_ats_issues(filepath)
            issues        = issues_result.get('issues', [])

        except EncryptedPDFError as e:
            return jsonify({"error": str(e), "is_encrypted_pdf": True}), 400

        except CorruptedFileError as e:
            return jsonify({"error": str(e), "is_corrupted": True}), 400

        except ScannedPDFError as e:
            return jsonify({"error": str(e), "is_scanned_pdf": True}), 400

        except Exception as e:
            print(f"⚠️ Issue detection failed for preview: {e}")
            issues = []   # Generate preview without highlights rather than failing

        # ── Generate preview images ───────────────────────────────
        try:
            preview_images = generate_resume_preview_with_highlights(filepath, issues)
        except Exception as e:
            print(f"⚠️ Preview generation failed: {e}")
            preview_images = None

        if not preview_images:
            return jsonify({
                "error": "Could not generate preview. "
                         "The file may be scanned, corrupted, or in an unsupported format."
            }), 500

        print(f"✅ Preview generated: {len(preview_images)} page(s)")

        return jsonify({
            "success":     True,
            "pages":       preview_images,
            "total_pages": len(preview_images)
        }), 200

    except Exception as e:
        print(f"❌ Preview error: {e}")
        traceback.print_exc()
        return jsonify({"error": "Preview generation failed. Please try again."}), 500


# ======================================================
# 3. AUTO-FIX AND DOWNLOAD
# ======================================================

@ats_blueprint.route("/ats/fix", methods=["POST", "OPTIONS"])
def fix_and_download():
    """
    Auto-fix ATS issues and return the fixed file in original format.

    Request:  JSON { "filename": "uuid_resume.pdf" }
    Response: Fixed file download (same format as uploaded)
    """
    if request.method == "OPTIONS":
        return '', 204

    fixed_path = None

    try:
        data     = request.get_json(silent=True) or {}
        filename = data.get('filename', '').strip()

        if not filename:
            return jsonify({"error": "Filename is required."}), 400

        filename      = secure_filename(filename)
        original_path = os.path.join(UPLOAD_FOLDER, filename)

        if not os.path.exists(original_path):
            return jsonify({
                "error": "Original file not found. Please re-upload your resume and try again."
            }), 404

        base_name, original_ext = os.path.splitext(filename)
        original_ext = original_ext.lower()

        # Validate extension before attempting fix
        if original_ext not in {'.pdf', '.docx'}:
            return jsonify({
                "error": f"Cannot fix '{original_ext}' files. Only PDF and DOCX are supported."
            }), 400

        fixed_filename = f"{base_name}_ATS_Optimized{original_ext}"
        fixed_path     = os.path.join(UPLOAD_FOLDER, fixed_filename)

        print(f"🔧 Auto-fixing: {filename} → {fixed_filename}")

        # ── Run fix ───────────────────────────────────────────────
        try:
            auto_fix_resume(original_path, fixed_path)

        except EncryptedPDFError as e:
            cleanup_file(fixed_path)
            return jsonify({"error": str(e), "is_encrypted_pdf": True}), 400

        except CorruptedFileError as e:
            cleanup_file(fixed_path)
            return jsonify({"error": str(e), "is_corrupted": True}), 400

        except ScannedPDFError as e:
            cleanup_file(fixed_path)
            return jsonify({"error": str(e), "is_scanned_pdf": True}), 400

        except Exception as e:
            cleanup_file(fixed_path)
            print(f"⚠️ Auto-fix failed: {e}")
            return jsonify({
                "error": "Unable to fix resume. "
                         "Please ensure it is a valid text-based PDF or DOCX file."
            }), 500

        # ── Verify fixed file was actually created ────────────────
        # ✅ FIX (Issue #14 from audit): Check file exists before serving
        if not os.path.exists(fixed_path):
            return jsonify({
                "error": "Fix process did not produce an output file. Please try again."
            }), 500

        print(f"✅ Fixed file ready: {fixed_filename}")

        # ── Determine MIME type ───────────────────────────────────
        if original_ext == '.pdf':
            mimetype = 'application/pdf'
        else:
            mimetype = ('application/vnd.openxmlformats-officedocument'
                        '.wordprocessingml.document')

        # ── Send file — original file cleaned up after send ───────
        # Flask's send_file streams the file; we clean original after
        response = send_file(
            fixed_path,
            mimetype=mimetype,
            as_attachment=True,
            download_name=fixed_filename
        )

        # Clean up original uploaded file after fix is served
        @response.call_on_close
        def cleanup_after_send():
            cleanup_file(original_path)
            cleanup_file(fixed_path)
            print(f"🗑️ Cleaned up after fix download: {filename}")

        return response

    except Exception as e:
        cleanup_file(fixed_path)
        print(f"❌ Auto-fix error: {e}")
        traceback.print_exc()
        return jsonify({"error": "An unexpected error occurred. Please try again."}), 500


# ======================================================
# 4. GET BEFORE/AFTER COMPARISON
# ======================================================

@ats_blueprint.route("/ats/compare", methods=["POST", "OPTIONS"])
def compare_versions():
    """
    Compare original vs fixed resume scores and issues.

    Request:  JSON { "original": "filename.pdf", "fixed": "filename_ATS_Optimized.pdf" }
    Response: JSON with before/after scores and improvements
    """
    if request.method == "OPTIONS":
        return '', 204

    try:
        data = request.get_json(silent=True) or {}

        original_filename = secure_filename(data.get('original', ''))
        fixed_filename    = secure_filename(data.get('fixed', ''))

        if not original_filename or not fixed_filename:
            return jsonify({"error": "Both 'original' and 'fixed' filenames are required."}), 400

        original_path = os.path.join(UPLOAD_FOLDER, original_filename)
        fixed_path    = os.path.join(UPLOAD_FOLDER, fixed_filename)

        if not os.path.exists(original_path):
            return jsonify({"error": "Original file not found."}), 404

        if not os.path.exists(fixed_path):
            return jsonify({"error": "Fixed file not found."}), 404

        comparison = get_before_after_comparison(original_path, fixed_path)

        return jsonify(comparison), 200

    except Exception as e:
        print(f"❌ Comparison error: {e}")
        traceback.print_exc()
        return jsonify({"error": "Comparison failed. Please try again."}), 500


# ======================================================
# 5. CLEANUP OLD FILES
# ✅ FIX (Issue #13 from audit): Added auth check so this endpoint
# is not publicly accessible — anyone could call it and delete
# all temp files for all users.
# ======================================================

@ats_blueprint.route("/ats/cleanup", methods=["POST", "OPTIONS"])
def cleanup_old_files():
    """
    Remove temporary files older than 1 hour.
    Protected — requires valid Authorization header.
    Intended to be called by a Cloud Scheduler cron job.
    """
    if request.method == "OPTIONS":
        return '', 204

    # ── Auth check ────────────────────────────────────────────────
    # Simple token check — set ATS_CLEANUP_TOKEN in your .env
    cleanup_token = os.getenv("ATS_CLEANUP_TOKEN", "")
    auth_header   = request.headers.get("Authorization", "")

    if not cleanup_token or auth_header != f"Bearer {cleanup_token}":
        return jsonify({"error": "Unauthorized"}), 401

    try:
        now     = time.time()
        removed = 0
        errors  = 0

        for filename in os.listdir(UPLOAD_FOLDER):
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            try:
                if os.path.isfile(filepath):
                    age_seconds = now - os.path.getmtime(filepath)
                    if age_seconds > 3600:   # older than 1 hour
                        os.remove(filepath)
                        removed += 1
            except Exception as e:
                print(f"⚠️ Could not remove {filename}: {e}")
                errors += 1

        print(f"🗑️ Cleanup complete: {removed} files removed, {errors} errors")

        return jsonify({
            "message": f"Cleaned up {removed} old file(s)",
            "removed": removed,
            "errors":  errors
        }), 200

    except Exception as e:
        print(f"❌ Cleanup error: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500