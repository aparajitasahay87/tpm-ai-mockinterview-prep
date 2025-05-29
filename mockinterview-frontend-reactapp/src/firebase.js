// src/firebase.js
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: "mockinterviewauthenticate-app.firebaseapp.com",
  projectId: "mockinterviewauthenticate-app",
  storageBucket: "mockinterviewauthenticate-app.firebasestorage.app",
  messagingSenderId: "319036485579",
  appId: "1:319036485579:web:7642ec187da51e760a904e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
export { auth, provider };