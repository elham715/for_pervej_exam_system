// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCF36FR8lWWhWIwbck6N9wrbkHdbPMakLg",
  authDomain: "omni-exam-system.firebaseapp.com",
  projectId: "omni-exam-system",
  storageBucket: "omni-exam-system.firebasestorage.app",
  messagingSenderId: "36840216568",
  appId: "1:36840216568:web:daf8b4885ad64e9acba80d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
