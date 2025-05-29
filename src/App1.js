import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ClipLoader from "react-spinners/ClipLoader";
import { useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import InterviewPage from './pages/InterviewPage';

function App() {
  const { user , loading } = useAuth();

  if (loading) {
    // 🔥 While checking user, show spinner
    return (
      <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <ClipLoader color="#36d7b7" />
      </div>
    );
  }
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/interview"
          element={user ? <InterviewPage /> : <Navigate to="/" />}
        />
      </Routes>
    </Router>
  );
}

export default App;