import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ENDPOINTS, apiUrl, clearAuthSession, getAuthHeader } from '../api';

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    axios.post(apiUrl(ENDPOINTS.auth.logout), {}, { headers: getAuthHeader() })
      .catch(() => null)
      .finally(() => {
        clearAuthSession();
        navigate('/login');
      });
  }, [navigate]);

  return null;
};

export default Logout;
