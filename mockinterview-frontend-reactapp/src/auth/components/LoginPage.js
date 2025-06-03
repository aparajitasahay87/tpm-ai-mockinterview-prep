import React, { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, provider as googleAuthProvider } from "../../firebase"; // Use googleAuthProvider for clarity
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { verifyFirebaseToken } from "../services/authService"; // <-- You need this service

const LoginPage = () => {
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setError(""); // Clear any previous errors
    try {
      const userCredential = await signInWithPopup(auth, googleAuthProvider);
      console.log("User credential:", userCredential);
      const user = userCredential.user;
      if (!user) {
        throw new Error("No user returned from Firebase signIn");
      }
      const firebaseToken = await userCredential.user.getIdToken();
      console.log("Firebase ID token:", firebaseToken);

      // ⭐⭐⭐ CRITICAL FIX HERE ⭐⭐⭐
      // Change 'token' to 'appToken' to match the backend response property name
      const { appToken, refreshToken } = await verifyFirebaseToken(firebaseToken);

      if (!appToken || !refreshToken) { // Check for appToken instead of token
          throw new Error("Missing token data from backend");
      }

      console.log("JWT saved to localStorage: AppToken : RefreshToken", appToken, refreshToken);

      // Assuming successful login, you might want to redirect to the dashboard or categories page
      navigate("/categories"); // Or wherever your main app page is after login

    } catch (err) {
      console.error("Login failed", err);
      setError("Login failed. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <button onClick={handleLogin} disabled={isLoggingIn}>
        {isLoggingIn ? "Logging in..." : "Login with Google"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default LoginPage;