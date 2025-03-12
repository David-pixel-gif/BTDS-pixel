import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear localStorage on logout
    localStorage.clear();
    alert('You have been logged out successfully.');
    navigate('/login'); // Redirect to login page
  }, [navigate]);

  return null; // No UI needed
};

export default Logout;
