// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDpqUh7SpPsBpz5wxW84j8rEiRshz-Tj8I",
  authDomain: "resumeapp-482804.firebaseapp.com",
  projectId: "resumeapp-482804",
  storageBucket: "resumeapp-482804.firebasestorage.app",
  messagingSenderId: "943925396580",
  appId: "1:943925396580:web:19960b510604047b108b71",
};

const app = initializeApp(firebaseConfig);

export const auth       = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db         = getFirestore(app);


// ─────────────────────────────────────────────────────────────────
// SESSION MANAGEMENT
// Called immediately after every successful login.
//
// What it does:
//   1. Generates a new unique sessionId for this device
//   2. Writes it to Firestore — this OVERWRITES any previous session
//      (so the other device gets logged out on their next request)
//   3. Saves the sessionId in localStorage on this device
// ─────────────────────────────────────────────────────────────────

export async function registerSession(user) {
  // Generate a unique session ID for this login
  const sessionId = crypto.randomUUID();

  // Overwrite activeSessionId in Firestore
  // This is what kicks the other device out
  await setDoc(
    doc(db, "users", user.uid),
    { activeSessionId: sessionId },
    { merge: true }
  );

  // Save on this device so we can send it with every API call
  localStorage.setItem("sessionId", sessionId);

  console.log("✅ Session registered:", sessionId.slice(0, 8) + "...");
}


// ─────────────────────────────────────────────────────────────────
// CLEAR SESSION
// Called on logout. Removes the sessionId from localStorage only.
// We do NOT clear Firestore here — the next login will overwrite it.
// ─────────────────────────────────────────────────────────────────

export function clearSession() {
  localStorage.removeItem("sessionId");
}


// ─────────────────────────────────────────────────────────────────
// GET SESSION ID
// Used by every API call to attach the session header.
// ─────────────────────────────────────────────────────────────────

export function getSessionId() {
  return localStorage.getItem("sessionId") || "";
}