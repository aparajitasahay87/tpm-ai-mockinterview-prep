// src/auth/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isTokenExpiringSoon } from '../../utils/tokenUtils';

const ProtectedRoute = ({ children }) => {
  const { user, jwt, loading } = useAuth();

  if (loading) return <p>Loading...</p>;

  // No user or token or token is expired
  if (!user || !jwt || isTokenExpiringSoon(jwt)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
