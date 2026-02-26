# server/routes/ats_checker.py

import os
from flask import Blueprint, request, jsonify, send_file
from werkzeug.utils import secure_filename
from utils.ats_checker import detect_ats_issues, auto_fix_resume, get_before_after_comparison
from utils.preview_generator import generate_resume_preview_with_highlights
from utils.extract_text import ScannedPDFError

ats_blueprint = Blueprint('ats', __name__)

UPLOAD_FOLDER = "/tmp"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {'pdf', 'docx', 'doc'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ======================================================
# 1. CHECK ATS ISSUES
# ======================================================

@ats_blueprint.route("/ats/check", methods=["POST", "OPTIONS"])
def check_ats():
    """
    Analyze uploaded resume for ATS issues.
    
    Request: multipart/form-data with 'resume' file
    Response: JSON with issues, score, and recommendations
    """
    
    if request.method == "OPTIONS":
        return '', 204
    
    try:
        if 'resume' not in request.files:
            return jsonify({"error": "No resume file provided"}), 400
        
        file = request.files['resume']
        
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        if not allowed_file(file.filename):
            return jsonify({"error": "Invalid file type. Only PDF and DOCX allowed."}), 400
        
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        print(f"📄 Checking ATS compatibility: {filename}")
        
        # Analyze file - this will catch scanned PDFs
        try:
            result = detect_ats_issues(filepath)
        except ScannedPDFError as e:
            return jsonify({
                "error": str(e),
                "is_scanned_pdf": True
            }), 400
        except (ValueError, RuntimeError) as e:
            return jsonify({
                "error": str(e)
            }), 400
        
        # Store filepath and original extension
        result['temp_file'] = filename
        result['original_extension'] = os.path.splitext(filename)[1].lower()
        
        print(f"✅ ATS Score: {result['score']}/100")
        print(f"   Issues: {len(result['issues'])}")
        print(f"   Warnings: {len(result['warnings'])}")
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"❌ ATS check error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "An unexpected error occurred. Please try again."}), 500


# ======================================================
# 2. GENERATE PREVIEW WITH HIGHLIGHTS
# ======================================================

@ats_blueprint.route("/ats/preview", methods=["POST", "OPTIONS"])
def generate_preview():
    """
    Generate visual preview of resume with highlighted issues.
    
    Request: JSON with { "filename": "resume.pdf" }
    Response: JSON with base64 encoded images showing highlights
    """
    
    if request.method == "OPTIONS":
        return '', 204
    
    try:
        data = request.get_json()
        filename = data.get('filename')
        
        if not filename:
            return jsonify({"error": "Filename required"}), 400
        
        filename = secure_filename(filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        
        if not os.path.exists(filepath):
            return jsonify({"error": "File not found"}), 404
        
        print(f"🖼️ Generating preview with highlights: {filename}")
        
        # Get issues for this file
        try:
            issues_result = detect_ats_issues(filepath)
            issues = issues_result.get('issues', [])
        except ScannedPDFError as e:
            return jsonify({
                "error": str(e),
                "is_scanned_pdf": True
            }), 400
        except Exception as e:
            return jsonify({
                "error": "Could not analyze file for preview"
            }), 400
        
        # Generate preview images with highlights
        try:
            preview_images = generate_resume_preview_with_highlights(filepath, issues)
        except Exception as e:
            print(f"Preview generation failed: {e}")
            preview_images = None
        
        if not preview_images:
            return jsonify({
                "error": "Could not generate preview. File may be scanned, corrupted, or unsupported."
            }), 500
        
        print(f"✅ Generated {len(preview_images)} page(s) with highlights")
        
        return jsonify({
            "success": True,
            "pages": preview_images,
            "total_pages": len(preview_images)
        }), 200
        
    except Exception as e:
        print(f"❌ Preview generation error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Preview generation failed"}), 500


# ======================================================
# 3. AUTO-FIX AND DOWNLOAD
# ======================================================

@ats_blueprint.route("/ats/fix", methods=["POST", "OPTIONS"])
def fix_and_download():
    """
    Auto-fix ATS issues and return fixed file IN ORIGINAL FORMAT.
    
    Request: JSON with { "filename": "original_file.pdf" }
    Response: Fixed file download (SAME FORMAT as uploaded)
    """
    
    if request.method == "OPTIONS":
        return '', 204
    
    try:
        data = request.get_json()
        filename = data.get('filename')
        
        if not filename:
            return jsonify({"error": "Filename required"}), 400
        
        filename = secure_filename(filename)
        original_path = os.path.join(UPLOAD_FOLDER, filename)
        
        if not os.path.exists(original_path):
            return jsonify({"error": "Original file not found"}), 404
        
        base_name, original_ext = os.path.splitext(filename)
        original_ext = original_ext.lower()
        
        print(f"🔧 Auto-fixing resume: {filename} (format: {original_ext})")
        
        fixed_filename = f"{base_name}_ATS_Optimized{original_ext}"
        fixed_path = os.path.join(UPLOAD_FOLDER, fixed_filename)
        
        try:
            auto_fix_resume(original_path, fixed_path)
        except ScannedPDFError as e:
            return jsonify({
                "error": str(e),
                "is_scanned_pdf": True
            }), 400
        except Exception as e:
            print(f"Auto-fix failed: {e}")
            return jsonify({
                "error": "Unable to fix resume. Please ensure it's a valid text-based PDF or DOCX file."
            }), 500
        
        print(f"✅ Fixed resume ready: {fixed_filename}")
        
        if original_ext == '.pdf':
            mimetype = 'application/pdf'
        else:
            mimetype = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        
        return send_file(
            fixed_path,
            mimetype=mimetype,
            as_attachment=True,
            download_name=fixed_filename
        )
        
    except Exception as e:
        print(f"❌ Auto-fix error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "An unexpected error occurred"}), 500


# ======================================================
# 4. GET BEFORE/AFTER COMPARISON
# ======================================================

@ats_blueprint.route("/ats/compare", methods=["POST", "OPTIONS"])
def compare_versions():
    """
    Compare original vs fixed resume.
    """
    
    if request.method == "OPTIONS":
        return '', 204
    
    try:
        data = request.get_json()
        original_filename = secure_filename(data.get('original', ''))
        fixed_filename = secure_filename(data.get('fixed', ''))
        
        if not original_filename or not fixed_filename:
            return jsonify({"error": "Both filenames required"}), 400
        
        original_path = os.path.join(UPLOAD_FOLDER, original_filename)
        fixed_path = os.path.join(UPLOAD_FOLDER, fixed_filename)
        
        if not os.path.exists(original_path) or not os.path.exists(fixed_path):
            return jsonify({"error": "Files not found"}), 404
        
        comparison = get_before_after_comparison(original_path, fixed_path)
        
        return jsonify(comparison), 200
        
    except Exception as e:
        print(f"❌ Comparison error: {e}")
        return jsonify({"error": str(e)}), 500


# ======================================================
# 5. CLEANUP OLD FILES
# ======================================================

@ats_blueprint.route("/ats/cleanup", methods=["POST", "OPTIONS"])
def cleanup_files():
    """Remove temporary files older than 1 hour"""
    
    if request.method == "OPTIONS":
        return '', 204
    
    try:
        import time
        
        now = time.time()
        removed = 0
        
        for filename in os.listdir(UPLOAD_FOLDER):
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            
            if os.path.isfile(filepath):
                if now - os.path.getmtime(filepath) > 3600:
                    os.remove(filepath)
                    removed += 1
        
        return jsonify({
            "message": f"Cleaned up {removed} old files",
            "removed": removed
        }), 200
        
    except Exception as e:
        print(f"❌ Cleanup error: {e}")
        return jsonify({"error": str(e)}), 500

















# # server/routes/ats_checker.py

# import os
# from flask import Blueprint, request, jsonify, send_file
# from werkzeug.utils import secure_filename
# from utils.ats_checker import detect_ats_issues, auto_fix_resume, get_before_after_comparison
# from utils.preview_generator import generate_resume_preview_with_highlights

# ats_blueprint = Blueprint('ats', __name__)

# UPLOAD_FOLDER = "/tmp"
# os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ALLOWED_EXTENSIONS = {'pdf', 'docx', 'doc'}

# def allowed_file(filename):
#     return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# # ======================================================
# # 1. CHECK ATS ISSUES
# # ======================================================

# @ats_blueprint.route("/ats/check", methods=["POST", "OPTIONS"])
# def check_ats():
#     """
#     Analyze uploaded resume for ATS issues.
    
#     Request: multipart/form-data with 'resume' file
#     Response: JSON with issues, score, and recommendations
#     """
    
#     if request.method == "OPTIONS":
#         return '', 204
    
#     try:
#         if 'resume' not in request.files:
#             return jsonify({"error": "No resume file provided"}), 400
        
#         file = request.files['resume']
        
#         if file.filename == '':
#             return jsonify({"error": "No file selected"}), 400
        
#         if not allowed_file(file.filename):
#             return jsonify({"error": "Invalid file type. Only PDF and DOCX allowed."}), 400
        
#         filename = secure_filename(file.filename)
#         filepath = os.path.join(UPLOAD_FOLDER, filename)
#         file.save(filepath)
        
#         print(f"📄 Checking ATS compatibility: {filename}")
        
#         # Analyze file
#         result = detect_ats_issues(filepath)
        
#         # Store filepath and original extension
#         result['temp_file'] = filename
#         result['original_extension'] = os.path.splitext(filename)[1].lower()
        
#         print(f"✅ ATS Score: {result['score']}/100")
#         print(f"   Issues: {len(result['issues'])}")
#         print(f"   Warnings: {len(result['warnings'])}")
        
#         return jsonify(result), 200
        
#     except Exception as e:
#         print(f"❌ ATS check error: {e}")
#         import traceback
#         traceback.print_exc()
#         return jsonify({"error": str(e)}), 500


# # ======================================================
# # 2. GENERATE PREVIEW WITH HIGHLIGHTS (NEW!)
# # ======================================================

# @ats_blueprint.route("/ats/preview", methods=["POST", "OPTIONS"])
# def generate_preview():
#     """
#     Generate visual preview of resume with highlighted issues.
    
#     Request: JSON with { "filename": "resume.pdf" }
#     Response: JSON with base64 encoded images showing highlights
#     """
    
#     if request.method == "OPTIONS":
#         return '', 204
    
#     try:
#         data = request.get_json()
#         filename = data.get('filename')
        
#         if not filename:
#             return jsonify({"error": "Filename required"}), 400
        
#         filename = secure_filename(filename)
#         filepath = os.path.join(UPLOAD_FOLDER, filename)
        
#         if not os.path.exists(filepath):
#             return jsonify({"error": "File not found"}), 404
        
#         print(f"🖼️ Generating preview with highlights: {filename}")
        
#         # Get issues for this file
#         issues_result = detect_ats_issues(filepath)
#         issues = issues_result.get('issues', [])
        
#         # Generate preview images with highlights
#         preview_images = generate_resume_preview_with_highlights(filepath, issues)
        
#         if not preview_images:
#             return jsonify({
#                 "error": "Could not generate preview. File may be corrupted or unsupported."
#             }), 500
        
#         print(f"✅ Generated {len(preview_images)} page(s) with highlights")
        
#         return jsonify({
#             "success": True,
#             "pages": preview_images,
#             "total_pages": len(preview_images)
#         }), 200
        
#     except Exception as e:
#         print(f"❌ Preview generation error: {e}")
#         import traceback
#         traceback.print_exc()
#         return jsonify({"error": str(e)}), 500


# # ======================================================
# # 3. AUTO-FIX AND DOWNLOAD
# # ======================================================

# @ats_blueprint.route("/ats/fix", methods=["POST", "OPTIONS"])
# def fix_and_download():
#     """
#     Auto-fix ATS issues and return fixed file IN ORIGINAL FORMAT.
    
#     Request: JSON with { "filename": "original_file.pdf" }
#     Response: Fixed file download (SAME FORMAT as uploaded)
#     """
    
#     if request.method == "OPTIONS":
#         return '', 204
    
#     try:
#         data = request.get_json()
#         filename = data.get('filename')
        
#         if not filename:
#             return jsonify({"error": "Filename required"}), 400
        
#         filename = secure_filename(filename)
#         original_path = os.path.join(UPLOAD_FOLDER, filename)
        
#         if not os.path.exists(original_path):
#             return jsonify({"error": "Original file not found"}), 404
        
#         base_name, original_ext = os.path.splitext(filename)
#         original_ext = original_ext.lower()
        
#         print(f"🔧 Auto-fixing resume: {filename} (format: {original_ext})")
        
#         fixed_filename = f"{base_name}_ATS_Optimized{original_ext}"
#         fixed_path = os.path.join(UPLOAD_FOLDER, fixed_filename)
        
#         auto_fix_resume(original_path, fixed_path)
        
#         print(f"✅ Fixed resume ready: {fixed_filename}")
        
#         if original_ext == '.pdf':
#             mimetype = 'application/pdf'
#         else:
#             mimetype = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        
#         return send_file(
#             fixed_path,
#             mimetype=mimetype,
#             as_attachment=True,
#             download_name=fixed_filename
#         )
        
#     except Exception as e:
#         print(f"❌ Auto-fix error: {e}")
#         import traceback
#         traceback.print_exc()
#         return jsonify({"error": str(e)}), 500


# # ======================================================
# # 4. GET BEFORE/AFTER COMPARISON
# # ======================================================

# @ats_blueprint.route("/ats/compare", methods=["POST", "OPTIONS"])
# def compare_versions():
#     """
#     Compare original vs fixed resume.
#     """
    
#     if request.method == "OPTIONS":
#         return '', 204
    
#     try:
#         data = request.get_json()
#         original_filename = secure_filename(data.get('original', ''))
#         fixed_filename = secure_filename(data.get('fixed', ''))
        
#         if not original_filename or not fixed_filename:
#             return jsonify({"error": "Both filenames required"}), 400
        
#         original_path = os.path.join(UPLOAD_FOLDER, original_filename)
#         fixed_path = os.path.join(UPLOAD_FOLDER, fixed_filename)
        
#         if not os.path.exists(original_path) or not os.path.exists(fixed_path):
#             return jsonify({"error": "Files not found"}), 404
        
#         comparison = get_before_after_comparison(original_path, fixed_path)
        
#         return jsonify(comparison), 200
        
#     except Exception as e:
#         print(f"❌ Comparison error: {e}")
#         return jsonify({"error": str(e)}), 500


# # ======================================================
# # 5. CLEANUP OLD FILES
# # ======================================================

# @ats_blueprint.route("/ats/cleanup", methods=["POST", "OPTIONS"])
# def cleanup_files():
#     """Remove temporary files older than 1 hour"""
    
#     if request.method == "OPTIONS":
#         return '', 204
    
#     try:
#         import time
        
#         now = time.time()
#         removed = 0
        
#         for filename in os.listdir(UPLOAD_FOLDER):
#             filepath = os.path.join(UPLOAD_FOLDER, filename)
            
#             if os.path.isfile(filepath):
#                 if now - os.path.getmtime(filepath) > 3600:
#                     os.remove(filepath)
#                     removed += 1
        
#         return jsonify({
#             "message": f"Cleaned up {removed} old files",
#             "removed": removed
#         }), 200
        
#     except Exception as e:
#         print(f"❌ Cleanup error: {e}")
#         return jsonify({"error": str(e)}), 500











