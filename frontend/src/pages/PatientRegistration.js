import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { ENDPOINTS, apiUrl, getAuthHeader } from '../api';

const PatientRegistrationForm = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    gender: '',
    contactNumber: '',
    medicalHistory: '',
    radiologyNotes: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [patientId, setPatientId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const response = await axios.post(
        apiUrl(ENDPOINTS.patients.register),
        formData,
        { headers: getAuthHeader() }
      );
      const { patientId } = response.data;

      setPatientId(patientId);
      setMessage('Patient registered successfully.');
      setFormData({
        fullName: '',
        age: '',
        gender: '',
        contactNumber: '',
        medicalHistory: '',
        radiologyNotes: ''
      });
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setError('API endpoint not found. Please check the URL.');
      } else if (error.response && error.response.status === 500) {
        setError(error.response.data?.error || 'Server error. Please try again later.');
      } else {
        setError(error.response?.data?.error || 'Failed to register patient. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-fluid d-flex align-items-center justify-content-center vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="card shadow-lg p-5 border-0" style={{ maxWidth: '700px', width: '100%' }}>
        <h2 className="text-center text-primary fw-bold mb-3">Patient Registration Form</h2>
        <p className="text-center text-muted">Your privacy is important to us. All information is subject to our Patient Privacy Policy.</p>
        
        {error ? <div className="alert alert-danger mt-3">{error}</div> : null}
        {message ? (
          <div className="alert alert-success mt-3 text-center">
            {message} {patientId ? <span>Patient ID: {patientId}</span> : null}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-4">
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label" htmlFor="fullName">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="form-control"
                placeholder="Enter full name"
                required
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label" htmlFor="age">Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="form-control"
                placeholder="Enter age"
                required
              />
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label" htmlFor="gender">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label" htmlFor="contactNumber">Contact Number</label>
              <input
                type="text"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                className="form-control"
                placeholder="Enter contact number"
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="medicalHistory">Medical History</label>
            <textarea
              name="medicalHistory"
              value={formData.medicalHistory}
              onChange={handleChange}
              className="form-control"
              placeholder="Relevant medical history for diagnosis and radiology"
              rows="3"
            />
          </div>

          <div className="mb-4">
            <label className="form-label" htmlFor="radiologyNotes">Radiology Notes</label>
            <textarea
              name="radiologyNotes"
              value={formData.radiologyNotes}
              onChange={handleChange}
              className="form-control"
              placeholder="Important notes for radiologists (if any)"
              rows="3"
            />
          </div>

          <div className="text-center">
            <button type="submit" className="btn btn-primary btn-lg w-100" disabled={submitting}>
              {submitting ? 'Registering...' : 'Register Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientRegistrationForm;
