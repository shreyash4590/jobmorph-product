import os
import sys
from flask import Flask, request, jsonify, send_from_directory, g
from flask_cors import CORS
from dotenv import load_dotenv
from functools import wraps

# 🔥 LOAD .env FILE FIRST!
load_dotenv()

# --------------------------------------------------
# 🔧 Path setup
# --------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

# --------------------------------------------------
# 🔥 Firebase Admin SDK
# --------------------------------------------------
import firebase_admin
from firebase_admin import credentials, auth, firestore

SERVICE_ACCOUNT_PATH = os.path.join(BASE_DIR, "serviceAccountKey.json")

if not os.path.exists(SERVICE_ACCOUNT_PATH):
    raise FileNotFoundError("❌ serviceAccountKey.json not found in server folder")

if not firebase_admin._apps:
    cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
    firebase_admin.initialize_app(cred)

# ✅ Firestore client
db = firestore.client()

# --------------------------------------------------
# 🚀 Flask App
# --------------------------------------------------
app = Flask(__name__, static_folder='../client/build', static_url_path='')

# --------------------------------------------------
# 🌐 CORS — single source of truth, no double-headers
# --------------------------------------------------
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://resumeapp-482804.uc.r.appspot.com",
    "https://resumeapp-482804.appspot.com",
]

CORS(
    app,
    origins=ALLOWED_ORIGINS,          # ← use `origins` not `resources` dict
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    expose_headers=["Content-Type", "Authorization"],
)

# ⚠️  REMOVED the after_request double-header block that was here before.
#     Flask-CORS already handles everything — adding headers twice caused
#     browsers to reject responses with duplicate Access-Control-Allow-Origin.

# --------------------------------------------------
# 🔐 Centralised Firebase token verifier
# --------------------------------------------------
def verify_firebase_token(token: str):
    """
    Returns (uid, None) on success.
    Returns (None, error_response_tuple) on any failure.

    Always passes check_revoked=False so that multi-device logins
    don't incorrectly reject valid tokens.  If you WANT to enforce
    single-device sessions, switch check_revoked=True and handle the
    auth.RevokedIdTokenError branch below.
    """
    try:
        decoded = auth.verify_id_token(
            token,
            check_revoked=False,   # ← KEY FIX: was True (or missing) before
        )
        return decoded["uid"], None

    except auth.ExpiredIdTokenError:
        return None, (jsonify({
            "error":   "Token expired. Please refresh and try again.",
            "code":    "TOKEN_EXPIRED",
        }), 401)

    except auth.RevokedIdTokenError:
        # Only raised when check_revoked=True.
        # Keeping branch here in case you re-enable it later.
        return None, (jsonify({
            "error":   "Session was revoked. Please log in again.",
            "code":    "TOKEN_REVOKED",
        }), 401)

    except auth.InvalidIdTokenError as e:
        return None, (jsonify({
            "error":   "Invalid token. Please log in again.",
            "code":    "TOKEN_INVALID",
            "detail":  str(e),
        }), 401)

    except auth.CertificateFetchError:
        # Transient network error fetching Google's public certs
        return None, (jsonify({
            "error":   "Could not verify token right now. Please try again.",
            "code":    "CERT_FETCH_ERROR",
        }), 503)

    except Exception as e:
        print(f"❌ Token verification unexpected error: {e}")
        return None, (jsonify({
            "error":   "Authentication failed. Please log in again.",
            "code":    "AUTH_ERROR",
        }), 401)


def require_auth(f):
    """
    Decorator — use on any route that needs a logged-in user.

    Sets g.uid so the route function can use it directly.

    Usage:
        @app.route("/api/something", methods=["POST"])
        @require_auth
        def something():
            uid = g.uid
            ...
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({
                "error": "Missing or malformed Authorization header.",
                "code":  "NO_TOKEN",
            }), 401

        token = auth_header.split("Bearer ", 1)[1].strip()
        uid, err = verify_firebase_token(token)
        if err:
            return err          # returns the (jsonify(...), status) tuple

        g.uid = uid
        return f(*args, **kwargs)
    return decorated


# --------------------------------------------------
# 🔹 Register Blueprints FIRST (BEFORE catch-all route)
# --------------------------------------------------
from routes.upload        import upload_blueprint
from routes.interview_prep import interview_blueprint
from routes.ats_checker   import ats_blueprint
from routes.batch_matcher import batch_blueprint
from routes.verify_cert   import verify_cert_blueprint  # 🆕 NEW!

app.register_blueprint(upload_blueprint,    url_prefix='/api')
app.register_blueprint(interview_blueprint, url_prefix='/api')
app.register_blueprint(ats_blueprint,       url_prefix='/api')
app.register_blueprint(batch_blueprint,     url_prefix='/api')
app.register_blueprint(verify_cert_blueprint, url_prefix='/api')  # 🆕 NEW!


# --------------------------------------------------
# 🔐 Admin Password Reset
# --------------------------------------------------
@app.route("/api/reset-password", methods=["POST", "OPTIONS"])
def reset_password():
    if request.method == "OPTIONS":
        return '', 204

    try:
        data         = request.get_json(force=True)
        email        = data.get("email", "").strip().lower()
        new_password = data.get("newPassword", "").strip()

        if not email or not new_password:
            return jsonify({"error": "Email and newPassword are required"}), 400

        user = auth.get_user_by_email(email)
        auth.update_user(user.uid, password=new_password)

        return jsonify({"message": "✅ Password updated successfully"}), 200

    except auth.UserNotFoundError:
        return jsonify({"error": "User not found"}), 404
    except Exception as e:
        print("❌ Reset password error:", e)
        return jsonify({"error": "Password reset failed"}), 500


# --------------------------------------------------
# 🔍 Health Check
# --------------------------------------------------
@app.route("/health", methods=["GET"])
def health():
    gemini_key = os.getenv("GEMINI_API_KEY")
    return jsonify({
        "status":               "ok",
        "firebase":             True,
        "firestore":            True,
        "gemini_configured":    bool(gemini_key),
        "environment":          os.getenv("FLASK_ENV", "development"),
        "static_folder":        app.static_folder,
        "static_folder_exists": os.path.exists(app.static_folder) if app.static_folder else False,
    }), 200


# --------------------------------------------------
# 🎨 Serve React App — MUST BE LAST (catch-all)
# --------------------------------------------------
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    if path.startswith("api"):
        return jsonify({"error": "API route not found"}), 404

    static_path = os.path.join(app.static_folder, path)
    if path != "" and os.path.exists(static_path):
        return send_from_directory(app.static_folder, path)

    return send_from_directory(app.static_folder, "index.html")


# --------------------------------------------------
# ▶ Run Server
# --------------------------------------------------
if __name__ == "__main__":
    port       = int(os.getenv("PORT", 5000))
    gemini_key = os.getenv("GEMINI_API_KEY")

    print("=" * 60)
    print("🚀 JobMorph Backend Starting...")
    print("=" * 60)
    print(f"✅ GEMINI_API_KEY: {'Loaded (' + gemini_key[:10] + '...)' if gemini_key else 'NOT FOUND ⚠️'}")
    print(f"📍 Server        : http://0.0.0.0:{port}")
    print(f"📁 Static folder : {app.static_folder}")
    print(f"📂 Folder exists : {os.path.exists(app.static_folder) if app.static_folder else False}")
    print("✅ Features: Resume Analysis, Interview Prep, ATS Checker, Batch Matcher")
    print("=" * 60)

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False,
        use_reloader=False,
    )

    
# import os
# import sys
# from flask import Flask, request, jsonify, send_from_directory
# from flask_cors import CORS
# from dotenv import load_dotenv

# # 🔥 LOAD .env FILE FIRST!
# load_dotenv()

# # --------------------------------------------------
# # 🔧 Path setup
# # --------------------------------------------------
# BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# if BASE_DIR not in sys.path:
#     sys.path.append(BASE_DIR)

# # --------------------------------------------------
# # 🔥 Firebase Admin SDK
# # --------------------------------------------------
# import firebase_admin
# from firebase_admin import credentials, auth, firestore

# SERVICE_ACCOUNT_PATH = os.path.join(BASE_DIR, "serviceAccountKey.json")

# if not os.path.exists(SERVICE_ACCOUNT_PATH):
#     raise FileNotFoundError("❌ serviceAccountKey.json not found in server folder")

# if not firebase_admin._apps:
#     cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
#     firebase_admin.initialize_app(cred)

# # ✅ Firestore client
# db = firestore.client()

# # --------------------------------------------------
# # 🚀 Flask App - UPDATED for GCP
# # --------------------------------------------------
# app = Flask(__name__, static_folder='../client/build', static_url_path='')

# # --------------------------------------------------
# # 🌐 CORS - UPDATED for GCP deployment
# # --------------------------------------------------
# ALLOWED_ORIGINS = [
#     "http://localhost:3000",
#     "http://127.0.0.1:3000",
#     "https://resumeapp-482804.uc.r.appspot.com",
#     "https://resumeapp-482804.appspot.com"
# ]

# CORS(
#     app,
#     resources={r"/*": {"origins": ALLOWED_ORIGINS}},
#     supports_credentials=True,
#     allow_headers=["Content-Type", "Authorization"],
#     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
# )

# # 🔥 Add after_request handler for CORS preflight
# @app.after_request
# def after_request(response):
#     origin = request.headers.get('Origin')
#     if origin in ALLOWED_ORIGINS:
#         response.headers.add('Access-Control-Allow-Origin', origin)
#         response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
#         response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
#         response.headers.add('Access-Control-Allow-Credentials', 'true')
#     return response

# # --------------------------------------------------
# # 🔹 Register Blueprints FIRST (BEFORE catch-all route)
# # --------------------------------------------------
# from routes.upload import upload_blueprint
# from routes.interview_prep import interview_blueprint
# from routes.ats_checker import ats_blueprint
# from routes.batch_matcher import batch_blueprint

# app.register_blueprint(upload_blueprint, url_prefix='/api')
# app.register_blueprint(interview_blueprint, url_prefix='/api')
# app.register_blueprint(ats_blueprint, url_prefix='/api')
# app.register_blueprint(batch_blueprint, url_prefix='/api')


# # app.register_blueprint(upload_blueprint)
# # app.register_blueprint(interview_blueprint)
# # app.register_blueprint(ats_blueprint)
# # app.register_blueprint(batch_blueprint)

# # --------------------------------------------------
# # 🔐 Admin Password Reset
# # --------------------------------------------------
# @app.route("/api/reset-password", methods=["POST", "OPTIONS"])
# def reset_password():
#     if request.method == "OPTIONS":
#         return '', 204
        
#     try:
#         data = request.get_json(force=True)

#         email = data.get("email", "").strip().lower()
#         new_password = data.get("newPassword", "").strip()

#         if not email or not new_password:
#             return jsonify({"error": "Email and newPassword are required"}), 400

#         user = auth.get_user_by_email(email)
#         auth.update_user(user.uid, password=new_password)

#         return jsonify({"message": "✅ Password updated successfully"}), 200

#     except auth.UserNotFoundError:
#         return jsonify({"error": "User not found"}), 404
#     except Exception as e:
#         print("❌ Reset password error:", e)
#         return jsonify({"error": "Password reset failed"}), 500

# # --------------------------------------------------
# # 🔍 Health Check
# # --------------------------------------------------
# @app.route("/health", methods=["GET", "OPTIONS"])
# def health():
#     if request.method == "OPTIONS":
#         return '', 204
        
#     gemini_key = os.getenv("GEMINI_API_KEY")
    
#     return jsonify({
#         "status": "ok",
#         "firebase": True,
#         "firestore": True,
#         "company_research": True,
#         "ats_checker": True,
#         "gemini_configured": bool(gemini_key),
#         "environment": os.getenv("FLASK_ENV", "development"),
#         "static_folder": app.static_folder,
#         "static_folder_exists": os.path.exists(app.static_folder) if app.static_folder else False
#     }), 200

# # --------------------------------------------------
# # 🎨 Serve React App - MUST BE LAST (catch-all route)
# # --------------------------------------------------
# @app.route("/", defaults={"path": ""})
# @app.route("/<path:path>")
# def serve_react(path):
#     # ❌ Never touch API routes
#     if path.startswith("api"):
#         return jsonify({"error": "API route not found"}), 404

#     static_path = os.path.join(app.static_folder, path)

#     # Serve static files if they exist
#     if path != "" and os.path.exists(static_path):
#         return send_from_directory(app.static_folder, path)

#     # Otherwise serve React SPA
#     return send_from_directory(app.static_folder, "index.html")


# # --------------------------------------------------
# # ▶ Run Server - UPDATED for GCP
# # --------------------------------------------------
# if __name__ == "__main__":
#     # Get port from environment variable (GCP uses PORT=8080)
#     port = int(os.getenv("PORT", 5000))
    
#     gemini_key = os.getenv("GEMINI_API_KEY")
    
#     print("=" * 60)
#     print("🚀 JobMorph Backend Starting...")
#     print("=" * 60)
    
#     if gemini_key:
#         print(f"✅ GEMINI_API_KEY: Loaded ({gemini_key[:10]}...)")
#     else:
#         print("⚠️  GEMINI_API_KEY: NOT FOUND!")
    
#     print(f"📍 Server: http://0.0.0.0:{port}")
#     print(f"📁 Static folder: {app.static_folder}")
#     print(f"📂 Static folder exists: {os.path.exists(app.static_folder) if app.static_folder else False}")
#     print("✅ Features: Resume Analysis, Interview Prep, ATS Checker")
#     print("=" * 60)
    
#     # Bind to 0.0.0.0 for GCP compatibility
#     app.run(
#         host="0.0.0.0",
#         port=port,
#         debug=False,
#         use_reloader=False
#     )
















# This is below code is about the localhost
# import os
# import sys
# from flask import Flask, request, jsonify
# from flask_cors import CORS
# from dotenv import load_dotenv

# # 🔥 LOAD .env FILE FIRST!
# load_dotenv()

# # --------------------------------------------------
# # 🔧 Path setup
# # --------------------------------------------------
# BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# if BASE_DIR not in sys.path:
#     sys.path.append(BASE_DIR)

# # --------------------------------------------------
# # 🔥 Firebase Admin SDK
# # --------------------------------------------------
# import firebase_admin
# from firebase_admin import credentials, auth, firestore

# SERVICE_ACCOUNT_PATH = os.path.join(BASE_DIR, "serviceAccountKey.json")

# if not os.path.exists(SERVICE_ACCOUNT_PATH):
#     raise FileNotFoundError("❌ serviceAccountKey.json not found in server folder")

# if not firebase_admin._apps:
#     cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
#     firebase_admin.initialize_app(cred)

# # ✅ Firestore client
# db = firestore.client()

# # --------------------------------------------------
# # 🚀 Flask App
# # --------------------------------------------------
# app = Flask(__name__)

# # --------------------------------------------------
# # 🌐 CORS - FIXED for Authorization headers
# # --------------------------------------------------
# CORS(
#     app,
#     resources={r"/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}},
#     supports_credentials=True,
#     allow_headers=["Content-Type", "Authorization"],
#     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
# )

# # 🔥 Add after_request handler for CORS preflight
# @app.after_request
# def after_request(response):
#     origin = request.headers.get('Origin')
#     if origin in ['http://localhost:3000', 'http://127.0.0.1:3000']:
#         response.headers.add('Access-Control-Allow-Origin', origin)
#         response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
#         response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
#         response.headers.add('Access-Control-Allow-Credentials', 'true')
#     return response

# # --------------------------------------------------
# # 🔹 Register Blueprints
# # --------------------------------------------------
# from routes.upload import upload_blueprint
# from routes.interview_prep import interview_blueprint
# from routes.ats_checker import ats_blueprint  # 🆕 NEW!
# from routes.batch_matcher import batch_blueprint  # 🆕 NEW!


# app.register_blueprint(upload_blueprint)
# app.register_blueprint(interview_blueprint)
# app.register_blueprint(ats_blueprint)  # 🆕 NEW!
# app.register_blueprint(batch_blueprint)  # 🆕 NEW!

# # --------------------------------------------------
# # 🔐 Admin Password Reset
# # --------------------------------------------------
# @app.route("/api/reset-password", methods=["POST", "OPTIONS"])
# def reset_password():
#     if request.method == "OPTIONS":
#         return '', 204
        
#     try:
#         data = request.get_json(force=True)

#         email = data.get("email", "").strip().lower()
#         new_password = data.get("newPassword", "").strip()

#         if not email or not new_password:
#             return jsonify({"error": "Email and newPassword are required"}), 400

#         user = auth.get_user_by_email(email)
#         auth.update_user(user.uid, password=new_password)

#         return jsonify({"message": "✅ Password updated successfully"}), 200

#     except auth.UserNotFoundError:
#         return jsonify({"error": "User not found"}), 404
#     except Exception as e:
#         print("❌ Reset password error:", e)
#         return jsonify({"error": "Password reset failed"}), 500

# # --------------------------------------------------
# # 🔍 Health Check
# # --------------------------------------------------
# @app.route("/health", methods=["GET", "OPTIONS"])
# def health():
#     if request.method == "OPTIONS":
#         return '', 204
        
#     gemini_key = os.getenv("GEMINI_API_KEY")
    
#     return jsonify({
#         "status": "ok",
#         "firebase": True,
#         "firestore": True,
#         "company_research": True,
#         "ats_checker": True,  # 🆕 NEW!
#         "gemini_configured": bool(gemini_key)
#     }), 200

# # --------------------------------------------------
# # ▶ Run Server
# # --------------------------------------------------
# if __name__ == "__main__":
#     gemini_key = os.getenv("GEMINI_API_KEY")
    
#     print("=" * 60)
#     print("🚀 JobMorph Backend Starting...")
#     print("=" * 60)
    
#     if gemini_key:
#         print(f"✅ GEMINI_API_KEY: Loaded ({gemini_key[:10]}...)")
#     else:
#         print("⚠️  GEMINI_API_KEY: NOT FOUND!")
    
#     print("📍 Server: http://127.0.0.1:5000")
#     print("✅ Features: Resume Analysis, Interview Prep, ATS Checker")  # 🆕 UPDATED!
#     print("=" * 60)
    
#     app.run(
#         host="127.0.0.1",
#         port=5000,
#         debug=False,
#         use_reloader=False
#     )







# import os
# import sys
# from flask import Flask, request, jsonify
# from flask_cors import CORS

# # --------------------------------------------------
# # 🔧 Path setup
# # --------------------------------------------------
# BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# if BASE_DIR not in sys.path:
#     sys.path.append(BASE_DIR)

# # --------------------------------------------------
# # 🔥 Firebase Admin SDK
# # --------------------------------------------------
# import firebase_admin
# from firebase_admin import credentials, auth, firestore

# SERVICE_ACCOUNT_PATH = os.path.join(BASE_DIR, "serviceAccountKey.json")

# if not os.path.exists(SERVICE_ACCOUNT_PATH):
#     raise FileNotFoundError("❌ serviceAccountKey.json not found in server folder")

# if not firebase_admin._apps:
#     cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
#     firebase_admin.initialize_app(cred)

# # ✅ Firestore client
# db = firestore.client()

# # --------------------------------------------------
# # 🚀 Flask App
# # --------------------------------------------------
# app = Flask(__name__)

# # --------------------------------------------------
# # 🌐 CORS (React + Auth Header)
# # --------------------------------------------------
# CORS(
#     app,
#     resources={r"/*": {"origins": "http://localhost:3000"}},
#     supports_credentials=True,
#     allow_headers=["Content-Type", "Authorization"],
#     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
# )

# # --------------------------------------------------
# # 🔹 Register Blueprints
# # --------------------------------------------------
# from routes.upload import upload_blueprint
# from routes.interview_prep import interview_blueprint
# from routes.company_research import company_research_blueprint  # 🆕 NEW!

# app.register_blueprint(upload_blueprint)
# app.register_blueprint(interview_blueprint)
# app.register_blueprint(company_research_blueprint)  # 🆕 NEW!

# # --------------------------------------------------
# # 🔐 Admin Password Reset
# # --------------------------------------------------
# @app.route("/api/reset-password", methods=["POST"])
# def reset_password():
#     try:
#         data = request.get_json(force=True)

#         email = data.get("email", "").strip().lower()
#         new_password = data.get("newPassword", "").strip()

#         if not email or not new_password:
#             return jsonify({"error": "Email and newPassword are required"}), 400

#         user = auth.get_user_by_email(email)
#         auth.update_user(user.uid, password=new_password)

#         return jsonify({"message": "✅ Password updated successfully"}), 200

#     except auth.UserNotFoundError:
#         return jsonify({"error": "User not found"}), 404
#     except Exception as e:
#         print("❌ Reset password error:", e)
#         return jsonify({"error": "Password reset failed"}), 500

# # --------------------------------------------------
# # 🔍 Health Check
# # --------------------------------------------------
# @app.route("/health", methods=["GET"])
# def health():
#     return jsonify({
#         "status": "ok",
#         "firebase": True,
#         "firestore": True,
#         "company_research": True  # 🆕 NEW!
#     }), 200

# # --------------------------------------------------
# # ▶ Run Server
# # --------------------------------------------------
# if __name__ == "__main__":
#     print("🚀 JobMorph Backend Running on http://127.0.0.1:5000")
#     print("✅ Features: Resume Analysis, Interview Prep, Company Research")
#     app.run(
#         host="127.0.0.1",
#         port=5000,
#         debug=True,
#         use_reloader=False  # 🔥 PREVENT DOUBLE EXECUTION
#     )






























































































