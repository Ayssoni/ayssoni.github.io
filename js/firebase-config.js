// Import the Firebase SDK services required
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Replace with your Firebase configuration values
const firebaseConfig = {
    apiKey: "AIzaSyDXPwRJXqPoUTtAqt5DCbumF4Lq-8MWBpY",
    authDomain: "sonijewellers-1976.firebaseapp.com",
    projectId: "sonijewellers-1976",
    storageBucket: "sonijewellers-1976.firebasestorage.app",
    messagingSenderId: "924385120103",
    appId: "1:924385120103:web:aa8548cf80db742f29a9c2",
    measurementId: "G-HX8PRKM6R6"
};

export const ADMIN_EMAILS = ['ramsoni9968@gmail.com'];

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app); // Authentication Service
export const db = getFirestore(app); // Firestore database

console.log("Firebase is successfully connected and initialized!");