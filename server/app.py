import os
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

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
app = Flask(__name__)

# --------------------------------------------------
# 🌐 CORS - FIXED for Authorization headers
# --------------------------------------------------
CORS(
    app,
    resources={r"/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}},
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
)

# 🔥 Add after_request handler for CORS preflight
@app.after_request
def after_request(response):
    origin = request.headers.get('Origin')
    if origin in ['http://localhost:3000', 'http://127.0.0.1:3000']:
        response.headers.add('Access-Control-Allow-Origin', origin)
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

# --------------------------------------------------
# 🔹 Register Blueprints
# --------------------------------------------------
from routes.upload import upload_blueprint
from routes.interview_prep import interview_blueprint
from routes.ats_checker import ats_blueprint  # 🆕 NEW!
from routes.batch_matcher import batch_blueprint  # 🆕 NEW!


app.register_blueprint(upload_blueprint)
app.register_blueprint(interview_blueprint)
app.register_blueprint(ats_blueprint)  # 🆕 NEW!
app.register_blueprint(batch_blueprint)  # 🆕 NEW!

# --------------------------------------------------
# 🔐 Admin Password Reset
# --------------------------------------------------
@app.route("/api/reset-password", methods=["POST", "OPTIONS"])
def reset_password():
    if request.method == "OPTIONS":
        return '', 204
        
    try:
        data = request.get_json(force=True)

        email = data.get("email", "").strip().lower()
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
@app.route("/health", methods=["GET", "OPTIONS"])
def health():
    if request.method == "OPTIONS":
        return '', 204
        
    gemini_key = os.getenv("GEMINI_API_KEY")
    
    return jsonify({
        "status": "ok",
        "firebase": True,
        "firestore": True,
        "company_research": True,
        "ats_checker": True,  # 🆕 NEW!
        "gemini_configured": bool(gemini_key)
    }), 200

# --------------------------------------------------
# ▶ Run Server
# --------------------------------------------------
if __name__ == "__main__":
    gemini_key = os.getenv("GEMINI_API_KEY")
    
    print("=" * 60)
    print("🚀 JobMorph Backend Starting...")
    print("=" * 60)
    
    if gemini_key:
        print(f"✅ GEMINI_API_KEY: Loaded ({gemini_key[:10]}...)")
    else:
        print("⚠️  GEMINI_API_KEY: NOT FOUND!")
    
    print("📍 Server: http://127.0.0.1:5000")
    print("✅ Features: Resume Analysis, Interview Prep, ATS Checker")  # 🆕 UPDATED!
    print("=" * 60)
    
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False,
        use_reloader=False
    )







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






























































































