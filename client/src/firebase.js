import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAh37oCY5oWc1o9Q2KowgPNQw1jD57mq_k",
  authDomain: "jobmorph-e302e.firebaseapp.com",
  projectId: "jobmorph-e302e",
  storageBucket: "jobmorph-e302e.firebasestorage.app",
  messagingSenderId: "481792203359",
  appId: "1:481792203359:web:d7743119785b4123ea99ea"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
