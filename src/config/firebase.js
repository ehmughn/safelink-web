// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDcqCr3W0ShMeRZAYglc_QIwSFVHKF6nIc",
  authDomain: "disaster-preparedness-b21f9.firebaseapp.com",
  projectId: "disaster-preparedness-b21f9",
  storageBucket: "disaster-preparedness-b21f9.firebasestorage.app",
  messagingSenderId: "947195980810",
  appId: "1:947195980810:web:8d76e07db1f7fefc0503f3",
  measurementId: "G-SD5Q9DNK9W",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
