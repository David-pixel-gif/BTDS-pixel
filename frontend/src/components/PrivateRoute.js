import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { clearAuthSession, fetchCurrentUser, getAuthToken, storeAuthSession } from '../api';

function PrivateRoute({ children }) {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    const token = getAuthToken();

    if (!token) {
      setStatus('unauthenticated');
      return;
    }

    fetchCurrentUser(token)
      .then((user) => {
        storeAuthSession({ token, user });
        setStatus('authenticated');
      })
      .catch(() => {
        clearAuthSession();
        setStatus('unauthenticated');
      });
  }, []);

  if (status === 'checking') {
    return null;
  }

  return status === 'authenticated' ? children : <Navigate to="/login" replace />;
}

export default PrivateRoute;
