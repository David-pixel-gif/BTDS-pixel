import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const [profileID, setProfileID] = useState('');
  const [profileData, setProfileData] = useState({
    name: '',
    qualifications: '',
    role: '',
  });
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [existingProfileData, setExistingProfileData] = useState(null);
  const [error, setError] = useState('');
  const [userID, setUserID] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const storedUserID = localStorage.getItem('userID');
    if (storedUserID) {
      setUserID(storedUserID);
    } else {
      navigate('/login?redirectTo=/profile');
    }
  }, [navigate]);

  // Handle profile access by ID
  const handleProfileAccess = (e) => {
    e.preventDefault();
    const storedProfile = localStorage.getItem(`profile_${profileID}`);
    if (storedProfile) {
      const profile = JSON.parse(storedProfile);
      setExistingProfileData(profile);
      setError('');
      const role = profile.role.toLowerCase();
      
      // Check if the role is "doctor" or "radiologist" for accessing the diagnosis page
      if (role === 'doctor' || role === 'radiologist') {
        alert(`Welcome ${profile.name}! Redirecting to the diagnosis page.`);
        navigate('/diagnosis');
      } else if (role === 'nurse') {
        alert(`Welcome ${profile.name}! Redirecting to the patient history page.`);
        navigate('/patient-history');
      } else {
        setError('Access Denied: Only doctors and radiologists can access the Diagnosis page.');
      }
    } else {
      setExistingProfileData(null);
      setError('Profile not found. Please enter a valid Profile ID.');
    }
  };

  // Handle file change for profile picture
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(file);
      setProfilePicPreview(URL.createObjectURL(file));
    } else {
      alert('Please upload a valid image file.');
    }
  };

  // Handle profile creation
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!profileData.name || !profileData.qualifications || !profileData.role) {
      alert('Please fill in all fields.');
      return;
    }
    if (!profilePic) {
      alert('Please upload a profile picture.');
      return;
    }

    const generatedProfileID = `profile_${userID}_${Date.now()}`;
    localStorage.setItem(
      generatedProfileID,
      JSON.stringify({ ...profileData, profilePic })
    );

    alert(`Profile created successfully for ${profileData.name} as ${profileData.role}. Profile ID: ${generatedProfileID}`);
    setProfileID(generatedProfileID);

    // Navigate based on role
    const role = profileData.role.toLowerCase();
    if (role === 'doctor' || role === 'radiologist') {
      navigate('/diagnosis');
    } else if (role === 'nurse') {
      navigate('/patient-history');
    } else {
      alert('Role not recognized.');
    }
  };

  return (
    <div className="container mt-5">
      <h2>Profile Management</h2>

      {/* Access Profile Section */}
      <form onSubmit={handleProfileAccess} className="mb-4">
        <h3>Access Your Profile</h3>
        <div className="mb-3">
          <label htmlFor="profileID" className="form-label">Enter Profile ID</label>
          <input
            type="text"
            id="profileID"
            className="form-control"
            value={profileID}
            onChange={(e) => setProfileID(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">Access Profile</button>
        {error && <div className="alert alert-danger mt-3">{error}</div>}
      </form>

      {/* Show existing profile data if any */}
      {existingProfileData && (
        <div className="mt-5">
          <h3>Profile Overview</h3>
          <p><strong>Name:</strong> {existingProfileData.name}</p>
          <p><strong>Role:</strong> {existingProfileData.role}</p>
          <p><strong>Qualifications:</strong> {existingProfileData.qualifications}</p>
        </div>
      )}

      {/* Create Profile Section */}
      <form onSubmit={handleSubmit} className="mt-5">
        <h3>Create a New Profile</h3>

        <div className="mb-3">
          <label htmlFor="profilePic" className="form-label">Upload Profile Picture</label>
          <input
            type="file"
            id="profilePic"
            className="form-control"
            onChange={handleFileChange}
          />
        </div>
        {profilePicPreview && (
          <div className="mb-3">
            <img src={profilePicPreview} alt="Profile Preview" width="100" />
          </div>
        )}

        <div className="mb-3">
          <label htmlFor="name" className="form-label">Name</label>
          <input
            type="text"
            id="name"
            className="form-control"
            value={profileData.name}
            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="qualifications" className="form-label">Qualifications</label>
          <input
            type="text"
            id="qualifications"
            className="form-control"
            value={profileData.qualifications}
            onChange={(e) => setProfileData({ ...profileData, qualifications: e.target.value })}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="role" className="form-label">Role/Specialization</label>
          <input
            type="text"
            id="role"
            className="form-control"
            value={profileData.role}
            onChange={(e) => setProfileData({ ...profileData, role: e.target.value })}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary">Create Profile</button>
      </form>

      {/* Profile ID display after creation */}
      {profileID && (
        <div className="mt-4 alert alert-success">
          <strong>Profile Created Successfully!</strong>
          <p>Your Profile ID is: <strong>{profileID}</strong></p>
          <p>You can use this Profile ID to access your profile later.</p>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
