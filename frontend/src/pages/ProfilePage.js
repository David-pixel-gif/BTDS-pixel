import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ENDPOINTS, apiUrl, fetchCurrentUser, getAuthConfig, storeAuthSession } from '../api';

const defaultProfile = {
  qualifications: '',
  department: '',
  phone: '',
};

const ProfilePage = () => {
  const [profileData, setProfileData] = useState(defaultProfile);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const currentUser = await fetchCurrentUser();
        setUser(currentUser);
        setProfileData({
          qualifications: currentUser.qualifications || '',
          department: currentUser.department || '',
          phone: currentUser.phone || '',
        });
      } catch (requestError) {
        setError('Unable to load profile.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.put(
        apiUrl(ENDPOINTS.auth.me),
        profileData,
        getAuthConfig()
      );
      setUser(response.data);
      storeAuthSession({ user: response.data });
      setMessage('Profile updated successfully.');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="container mt-4">Loading profile...</div>;
  }

  return (
    <div className="container mt-4">
      <div className="card shadow-sm border-0">
        <div className="card-body p-4">
          <h2 className="mb-4">Profile</h2>

          {error ? <div className="alert alert-danger">{error}</div> : null}
          {message ? <div className="alert alert-success">{message}</div> : null}

          <div className="row mb-4">
            <div className="col-md-6">
              <p><strong>Profile ID:</strong> {user?.id ? `profile_${user.id}` : 'profile_unavailable'}</p>
              <p><strong>Username:</strong> {user?.username || 'Unknown User'}</p>
            </div>
            <div className="col-md-6">
              <p><strong>User ID:</strong> {user?.id || 'Not available'}</p>
              <p><strong>Primary Role:</strong> {user?.roles?.[0] || 'Unassigned'}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="qualifications" className="form-label">Qualifications</label>
              <input
                id="qualifications"
                className="form-control"
                value={profileData.qualifications}
                onChange={(event) =>
                  setProfileData({ ...profileData, qualifications: event.target.value })
                }
              />
            </div>

            <div className="mb-3">
              <label htmlFor="department" className="form-label">Department</label>
              <input
                id="department"
                className="form-control"
                value={profileData.department}
                onChange={(event) =>
                  setProfileData({ ...profileData, department: event.target.value })
                }
              />
            </div>

            <div className="mb-3">
              <label htmlFor="phone" className="form-label">Phone</label>
              <input
                id="phone"
                className="form-control"
                value={profileData.phone}
                onChange={(event) =>
                  setProfileData({ ...profileData, phone: event.target.value })
                }
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};


export default ProfilePage;
