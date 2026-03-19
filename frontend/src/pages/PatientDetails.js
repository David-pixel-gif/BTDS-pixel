import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ENDPOINTS, apiUrl, getAuthHeader } from '../api';


const PatientDetails = () => {
  const [patientId, setPatientId] = useState('');
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState('');

  const fetchPatient = async (event) => {
    event.preventDefault();
    setError('');
    setPatient(null);

    try {
      const response = await axios.get(
        apiUrl(ENDPOINTS.patients.details(patientId)),
        { headers: getAuthHeader() }
      );
      setPatient(response.data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error || 'Unable to load patient details.'
      );
    }
  };

  return (
    <div className="container mt-4">
      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <h2 className="mb-3">Patient Details</h2>
          <form className="row g-3 mb-4" onSubmit={fetchPatient}>
            <div className="col-md-8">
              <input
                className="form-control"
                placeholder="Enter patient ID, for example PAT-00001"
                value={patientId}
                onChange={(event) => setPatientId(event.target.value)}
              />
            </div>
            <div className="col-md-4">
              <button className="btn btn-primary w-100" type="submit">
                Load Patient
              </button>
            </div>
          </form>

          {error ? <div className="alert alert-danger">{error}</div> : null}

          {patient ? (
            <div className="row">
              <div className="col-md-6">
                <p><strong>Patient ID:</strong> {patient.patientId}</p>
                <p><strong>Name:</strong> {patient.fullName}</p>
                <p><strong>Age:</strong> {patient.age}</p>
                <p><strong>Gender:</strong> {patient.gender}</p>
              </div>
              <div className="col-md-6">
                <p><strong>Contact:</strong> {patient.contactNumber}</p>
                <p><strong>Latest MRI:</strong> {patient.latestMRI}</p>
                <p><strong>Recommendations:</strong> {patient.specialistRecommendations}</p>
              </div>
              <div className="col-12">
                <p><strong>Medical History:</strong> {patient.medicalHistory || 'Not provided'}</p>
                <p><strong>Radiology Notes:</strong> {patient.radiologyNotes || 'Not provided'}</p>
                <Link className="btn btn-outline-secondary" to="/patient-history">
                  Open History Lookup
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};


export default PatientDetails;
