import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyBQQChAmP6SBWBsuUbxYo7Eeh7QpRl-ySQ",
  authDomain: "directed-optics-460823-q5.firebaseapp.com",
  projectId: "directed-optics-460823-q5",
  storageBucket: "directed-optics-460823-q5.firebasestorage.app",
  messagingSenderId: "718866556670",
  appId: "1:718866556670:web:0ea7df48b3dbb01d1227af",
  measurementId: "G-42JY511VGB"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export default app;
