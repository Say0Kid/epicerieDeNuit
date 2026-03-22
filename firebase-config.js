import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAJTRdzqD83doPjIOVAv0XwN0iIMY9MaQs",
  authDomain: "noctushop.firebaseapp.com",
  projectId: "noctushop",
  storageBucket: "noctushop.firebasestorage.app",
  messagingSenderId: "687232666538",
  appId: "1:687232666538:web:a5e21ea9c2ddae4d1539d3",
  measurementId: "G-1YR1E5HR7S"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
