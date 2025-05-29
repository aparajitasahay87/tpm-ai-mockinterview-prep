// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Navbar from './common/Navbar';
import Layout from './assets/Layout'; 
import routes from './routes/AppRoutes';
import { auth } from './firebase';

import './App.css'; // Make sure this path is correct for your main CSS file
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('App.js: Setting up auth state listener');
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      setUser(authUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

    // ⭐ NEW: Function to open the external survey URL ⭐
  const handleOpenMarketSurvey = () => {
    // IMPORTANT: Replace this with your actual Google Forms (or other survey tool) URL
    const surveyUrl = 'YOUR_GOOGLE_FORMS_SURVEY_LINK_HERE'; // <<< Don't forget to replace this!
    window.open(surveyUrl, '_blank'); // Opens in a new tab
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Navbar user={user} onOpenMarketSurvey={handleOpenMarketSurvey} />
            {/* ⭐ Replace <div className="container"> with Layout ⭐ */}
      <Layout>
        <Routes>
          {routes.map(({ path, Component, isProtected, redirectTo }) => (
            <Route
              key={path}
              path={path}
              element={
                <ProtectedRouteWrapper
                  isProtected={isProtected}
                  user={user}
                  redirectTo={redirectTo}
                  WrappedComponent={Component}
                  path={path}
                />
              }
            />
          ))}
        </Routes>
      </Layout>
      
    </Router>
  );
}

function ProtectedRouteWrapper({ isProtected, user, redirectTo, WrappedComponent, path }) {
  const navigate = useNavigate();

  const handleCategorySelect = (category) => {
    console.log('Category selected in ProtectedRouteWrapper:', category);
    navigate(`/questions?categoryId=${category.category_id}`);
  };

  if (isProtected && !user) {
    return <Navigate to={redirectTo || "/login"} />;
  }

  if (path === "/login" && user) {
    return <Navigate to={redirectTo || "/"} />;
  }

  const componentProps = path === '/categories' ? { onSelectCategory: handleCategorySelect, user: user } : { user: user };

  return <WrappedComponent {...componentProps} />;
}

export default App;