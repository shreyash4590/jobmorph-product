import os
import subprocess
import sys
import json

def upgrade_pip():
    print("[INFO] Upgrading pip to 23.3.2...")
    subprocess.run([sys.executable, "-m", "pip", "install", "--upgrade", "pip==23.3.2"], check=True)

def install_requirements():
    print("[INFO] Installing requirements...")
    subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)

def download_spacy_model():
    print("[INFO] Downloading Spacy model...")
    subprocess.run([sys.executable, "-m", "spacy", "download", "en_core_web_sm"], check=True)

def create_service_account():
    path = "serviceAccountKey.json"
    if not os.path.exists(path):
        print("[INFO] Creating dummy serviceAccountKey.json file...")
        dummy_data = {
            "type": "service_account",
            "project_id": "your-project-id",
            "private_key_id": "your-private-key-id",
            "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n",
            "client_email": "your-service-account-email@project-id.iam.gserviceaccount.com",
            "client_id": "your-client-id",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
        }
        with open(path, 'w') as f:
            json.dump(dummy_data, f, indent=4)
        print("[WARNING] Dummy serviceAccountKey.json created. Replace with real credentials.")

def run_app():
    print("[INFO] Running the app...")
    subprocess.run([sys.executable, "app.py"], check=True)

if __name__ == "__main__":
    upgrade_pip()
    install_requirements()
    download_spacy_model()
    create_service_account()
    run_app()
