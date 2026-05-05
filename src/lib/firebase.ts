import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDgAD_2aV-VaUG7f6iKqtpltaBu3mCS6f0",
  authDomain: "gestaobrisa-8354d.firebaseapp.com",
  projectId: "gestaobrisa-8354d",
  storageBucket: "gestaobrisa-8354d.firebasestorage.app",
  messagingSenderId: "541155862240",
  appId: "1:541155862240:web:308e23e943c7de86609285",
  measurementId: "G-WWMDY0JWKK"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
