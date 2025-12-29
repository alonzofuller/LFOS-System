/**
 * FIREBASE CONFIGURATION
 * 
 * Instructions:
 * 1. Go to https://console.firebase.google.com/
 * 2. Create a project and add a 'Web App'.
 * 3. Copy the 'firebaseConfig' object and paste the values below.
 * 4. Enable 'Firestore Database' in the console.
 */

export const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};
