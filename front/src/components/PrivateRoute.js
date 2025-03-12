// PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

// A higher-order component that checks for user authentication
function PrivateRoute({ children }) {
  const isAuthenticated = Boolean(localStorage.getItem("accessToken")); // Check for token in localStorage
  return isAuthenticated ? children : <Navigate to="/login" />;
}

export default PrivateRoute;
