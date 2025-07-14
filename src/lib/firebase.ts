import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAL9ffRKWav4Nisoji2GxBoGodQT-Cv0IM",
  authDomain: "ggemgap.firebaseapp.com",
  projectId: "ggemgap",
  storageBucket: "ggemgap.firebasestorage.app",
  messagingSenderId: "797868756155",
  appId: "1:797868756155:web:a4b60a2c51f9ef121bad9e",
  measurementId: "G-6R0Z1EQ2C6"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db }; 