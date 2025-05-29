import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebase'; // Import Firebase auth
import LoginButton from './components/LoginButton';
import LogoutButton from './components/LogoutButton';
import ApiTest from './components/ApiTest'; // Assuming ApiTest is where you test feedback
import Home from './components/Home'; // A potential home page
import Navbar from './common/Navbar'; // A navigation bar

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      setUser(authUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Navbar user={user} /> {/* Pass user info to the navbar */}
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/login"
            element={user ? <Navigate to="/test-api" /> : <LoginButton />}
          />
          <Route
            path="/test-api"
            element={user ? <ApiTest /> : <Navigate to="/login" />}
          />
          {/* Add other routes as needed */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;