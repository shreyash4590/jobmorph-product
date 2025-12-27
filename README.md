# 🚀 JobMorph – Smart Resume Analyzer (React + Flask + Gemini AI)

JobMorph is a smart resume analysis web application. It uses Google's Generative AI (Gemini), Firebase, and Natural Language Processing to help job seekers tailor their resumes to specific job descriptions.

This is a **full-stack project** with:

- 🧠 Python + Flask backend (AI, resume parsing, Firebase)
- 💻 React frontend (user interface)

---

## 🧱 Project Structure


---

## 🔧 Backend Setup (Flask + Firebase + AI)

### ✅ Step-by-Step

1. **Clone the repository:**

```bash
[Note: All command do in vs code terminal choose command prompt for that]

git clone https://github.com/yourusername/JobMorph.git
cd JobMorph/server

python -m venv venv
venv\Scripts\activate         # Windows
# source venv/bin/activate   # macOS/Linux

3.Run the setup script to install everything and start the server:
  python setup.py


4.If in case you not have the serviceAccountKey.json file then it automatically created for you if not
then create it your own in server section
(In that file you have your firbase admin sdk file )

5.Make one file in server section "setup.py"
Put their the following code.
code:- import os
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


6.After completing the above steps, run the command python app.py. If any model dependencies are required,
install them as prompted—especially in the server section.

7.In the server section, locate the file named .env.example. Rename it to .env, and insert your Gemini API key in the appropriate field.





---

## 🔧 Frontend Setup (React)

### ✅ Step-by-Step

1. Open a new terminal window.

2. Navigate to the frontend folder:

3. cd JobMorph/client

4.npm install

5.npm start





