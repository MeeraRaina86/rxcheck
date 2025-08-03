// src/lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// This is your configuration object
const firebaseConfig = {
  apiKey: "AIzaSyAxdd9FtDw0f0yeYjW73aSpuSQNXe92B8Y",
  authDomain: "medicheck-app-84fd9.firebaseapp.com",
  projectId: "medicheck-app-84fd9",
  storageBucket: "medicheck-app-84fd9.firebasestorage.app",
  messagingSenderId: "433005175054",
  appId: "1:433005175054:web:e49130ce53ba99f7f6775f"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Export the services you need
export const auth = getAuth(app);
export const db = getFirestore(app);