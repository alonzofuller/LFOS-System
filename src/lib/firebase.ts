import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { firebaseConfig } from "./firebase-config";

// Detect if config is still using placeholders or is missing
const isConfigured = Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== "YOUR_API_KEY" &&
    firebaseConfig.apiKey !== "undefined" &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== "YOUR_PROJECT_ID" &&
    firebaseConfig.projectId !== "undefined"
);

if (isConfigured) {
    console.log("[Firebase] Configured for project:", firebaseConfig.projectId);
} else {
    console.warn("[Firebase] NOT CONFIGURED. Local fallback active.");
    console.log("[Firebase] API Key status:", typeof firebaseConfig.apiKey, firebaseConfig.apiKey === "undefined" ? "(literal undefined)" : "");
}

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
    ignoreUndefinedProperties: true
});

export { app, db, isConfigured };
