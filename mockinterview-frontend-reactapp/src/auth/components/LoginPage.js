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
      //Login With Google
      // await signInWithPopup(auth, googleAuthProvider);
      // The auth state change will be handled by onAuthStateChanged in App.js
     // navigate("/test-api"); // Redirect to the main app area after login
      //console.log("Logged in with Google");
       const userCredential = await signInWithPopup(auth, googleAuthProvider);
       console.log("User credential:", userCredential);
       const user = userCredential.user;
if (!user) {
  throw new Error("No user returned from Firebase signIn");
}
      const firebaseToken = await userCredential.user.getIdToken();
      console.log("Firebase ID token:", firebaseToken);

      //const appToken = await verifyFirebaseToken(firebaseToken);
      //if (!appToken) throw new Error("Failed to verify Firebase token");
      const { token, refreshToken } = await verifyFirebaseToken(firebaseToken);
if (!token || !refreshToken) throw new Error("Missing token data from backend");

console.log("JWT saved to localStorage: Token : RefreshToken", token , refreshToken);
     
      //navigate("/test-api");
    } catch (err) {
      console.error("Login failed", err);
      setError("Login failed. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div>
     
      <button onClick={handleLogin} disabled={isLoggingIn}>
        {isLoggingIn ? "Logging in..." : "Login with Google"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default LoginPage;