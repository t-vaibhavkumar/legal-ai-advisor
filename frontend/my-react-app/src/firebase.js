import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { APIKEY, AUTHDOMAIN, PROJECTID, STORAGEBUCKET, MESSAGINGSENDERID, APPID, MESUREMENTID } from "./const"; // ✅ Make sure these are correct imports

// Firebase config
const firebaseConfig = {
  apiKey: APIKEY,
  authDomain: AUTHDOMAIN,
  projectId: PROJECTID,
  storageBucket: STORAGEBUCKET,
  messagingSenderId: MESSAGINGSENDERID,
  appId: APPID,
  measurementId: MESUREMENTID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase services
const auth = getAuth(app); // ✅ Auth service
const db = getFirestore(app); // ✅ Firestore service
const provider = new GoogleAuthProvider(); // ✅ Google Auth provider

// Export the necessary services for usage
export { auth, provider, signInWithPopup, signOut, db }; // ✅ Export all needed functions
