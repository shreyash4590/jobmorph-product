import os
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS

# 🔧 Ensure server root is in Python path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)

# 🔥 Firebase Admin SDK
import firebase_admin
from firebase_admin import credentials, auth, firestore

# 🛡️ Load Firebase service account key
SERVICE_ACCOUNT_PATH = os.path.join(BASE_DIR, "serviceAccountKey.json")

if not os.path.exists(SERVICE_ACCOUNT_PATH):
    raise FileNotFoundError("❌ serviceAccountKey.json not found in server folder")

if not firebase_admin._apps:
    cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
    firebase_admin.initialize_app(cred)

# ✅ Firestore client (IMPORTANT)
db = firestore.client()

# 🚀 Flask App
app = Flask(__name__)

# ✅ Proper CORS for React + Authorization header
CORS(
    app,
    resources={r"/*": {"origins": "http://localhost:3000"}},
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
)

# 🔹 Register Blueprints
from routes.upload import upload_blueprint
app.register_blueprint(upload_blueprint)

# --------------------------------------------------
# 🔐 Password Reset (Admin controlled)
# --------------------------------------------------
@app.route("/api/reset-password", methods=["POST"])
def reset_password():
    try:
        data = request.get_json(force=True)

        email = data.get("email", "").strip().lower()
        new_password = data.get("newPassword", "").strip()

        if not email or not new_password:
            return jsonify({"error": "Email and newPassword are required"}), 400

        try:
            user = auth.get_user_by_email(email)
        except auth.UserNotFoundError:
            return jsonify({"error": "User not found"}), 404

        auth.update_user(user.uid, password=new_password)

        return jsonify({"message": "✅ Password updated successfully"}), 200

    except Exception as e:
        print("❌ Reset password error:", e)
        return jsonify({"error": "Password reset failed"}), 500


# --------------------------------------------------
# 🔍 Health Check (VERY IMPORTANT)
# --------------------------------------------------
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "firebase": True,
        "firestore": True
    }), 200


# --------------------------------------------------
# ▶ Run Server
# --------------------------------------------------
if __name__ == "__main__":
    print("🚀 JobMorph Backend Running on http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=True)
