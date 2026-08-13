// Firebase init for the admin app.
//
// 1. Create a Firebase project (can be the same project used by the
//    public site, or a separate one — either works).
// 2. Enable Authentication → Sign-in method → Email/Password.
// 3. Enable Firestore (production mode) and deploy firestore.rules
//    from this project (see README).
// 4. Copy the Web App config into a `.env` file (see .env.example).
// 5. Manually create each admin's account in the Firebase console
//    (Authentication → Users → Add user) — this app has no public
//    sign-up screen on purpose, so only accounts you create can log in.

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
