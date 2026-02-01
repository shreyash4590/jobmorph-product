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
  apiKey: "AIzaSyDpqUh7SpPsBpz5wxW84j8rEiRshz-Tj8I",
  authDomain: "resumeapp-482804.firebaseapp.com",
  projectId: "resumeapp-482804",
  storageBucket: "resumeapp-482804.firebasestorage.app",
  messagingSenderId: "943925396580",
  appId: "1:943925396580:web:19960b510604047b108b71",
  measurementId: "G-SJ8VYJ38W4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);