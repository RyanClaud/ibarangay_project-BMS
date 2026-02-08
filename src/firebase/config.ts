// Firebase Configuration
// This file uses environment variables for sensitive data
// For local development, these are loaded from .env.local
// For production, set these in your deployment platform (Vercel, Firebase, etc.)

export const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "studio-1858135779-a881a",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:870936117487:web:a07168d1e4a8511cc2db1a",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "studio-1858135779-a881a.appspot.com",
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAPNIFzrQdlLzvLTEbmZDFcE8tpiKxxkf8",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "studio-1858135779-a881a.firebaseapp.com",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "870936117487"
};
