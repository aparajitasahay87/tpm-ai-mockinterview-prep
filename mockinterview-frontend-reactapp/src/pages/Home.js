// src/pages/Home.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup } from "firebase/auth";
import { auth, provider as googleAuthProvider } from "../firebase";
import { verifyFirebaseToken } from "../auth/services/authService";

function Home() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [loginError, setLoginError] = useState("");

    const handleLoginWithGoogle = async () => {
        setIsLoggingIn(true);
        setLoginError("");

        try {
            const userCredential = await signInWithPopup(auth, googleAuthProvider);
            const firebaseUser = userCredential.user;
            if (!firebaseUser) throw new Error("No user returned from Firebase signIn");

            const firebaseToken = await firebaseUser.getIdToken();
            console.log("Firebase ID token obtained:", firebaseToken);

            const { appToken, refreshToken } = await verifyFirebaseToken(firebaseToken);
            if (!appToken || !refreshToken) throw new Error("Missing application token data from backend verification");
            
            console.log("App Token and Refresh Token received from backend:", appToken, refreshToken);
            
        } catch (err) {
            console.error("Login failed:", err);
            if (err.code === 'auth/popup-closed-by-user') {
                setLoginError("Login popup closed. Please try again.");
            } else {
                setLoginError("Login failed. Please try again.");
            }
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handlePracticeInterview = () => {
        navigate('/categories');
    };

    if (!user) {
        // Render login UI directly on the Home page when not authenticated
        return (
            <div className="page-section">
                <h2>Welcome to MockInterviewAI</h2>
                <p>Please log in to start your practice interview.</p>
                <button 
                    onClick={handleLoginWithGoogle} 
                    disabled={isLoggingIn} 
                    className="primary-btn" 
                >
                    {isLoggingIn ? "Logging in..." : "Login with Google"}
                </button>
                {loginError && <p style={{ color: "red", marginTop: "10px" }}>{loginError}</p>}
            </div>
        );
    }

    // Render authenticated view when user is logged in
    return (
        <div className="page-section">
            <h1>Welcome, {user.displayName || user.email}</h1>
            <p>Ready to hone your interview skills?</p>
            <button 
                onClick={handlePracticeInterview} 
                className="primary-btn" 
            >
                Practice Interview
            </button>
        </div>
    );
}

export default Home;