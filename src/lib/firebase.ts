import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "./firebase-config";

// Detect if config is still using placeholders
const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db, isConfigured };
