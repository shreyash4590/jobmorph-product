// // Replace with your config from Firebase Console
// import { initializeApp } from "firebase/app";
// import { getFirestore } from "firebase/firestore";

// const firebaseConfig = {
//   apiKey: "AIzaSyAh37oCY5oWc1o9Q2KowgPNQw1jD57mq_k",
//   authDomain: "YOUR_AUTH_DOMAIN",
//   projectId: "YOUR_PROJECT_ID",
//   storageBucket: "YOUR_BUCKET",
//   messagingSenderId: "YOUR_SENDER_ID",
//   appId: "YOUR_APP_ID",
// };

// const app = initializeApp(firebaseConfig);
// export const db = getFirestore(app);


// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAh37oCY5oWc1o9Q2KowgPNQw1jD57mq_k",
  authDomain: "jobmorph-e302e.firebaseapp.com",
  projectId: "jobmorph-e302e",
  storageBucket: "jobmorph-e302e.firebasestorage.app",
  messagingSenderId: "481792203359",
  appId: "1:481792203359:web:d7743119785b4123ea99ea",
  measurementId: "G-LVKVNGE3V1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);