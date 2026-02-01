import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDpqUh7SpPsBpz5wxW84j8rEiRshz-Tj8I",
  authDomain: "resumeapp-482804.firebaseapp.com",
  projectId: "resumeapp-482804",
  storageBucket: "resumeapp-482804.firebasestorage.app",
  messagingSenderId: "943925396580",
  appId: "1:943925396580:web:19960b510604047b108b71",
  // measurementId: "G-SJ8VYJ38W4"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);