import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const PatientHistory = () => {
  const [patientId, setPatientId] = useState('');
  const [historyData, setHistoryData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchPatientHistory = (e) => {
    e.preventDefault();
    if (!patientId) {
      setError("Please enter a valid Patient ID.");
      return;
    }

    setError('');
    setLoading(true);

    axios.get(`http://localhost:5000/api/patient-history/${patientId}`)
      .then((response) => {
        setHistoryData(response.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching patient history:', err);
        setError('Failed to load patient history. Patient ID may be incorrect or unavailable.');
        setLoading(false);
      });
  };

  return (
    <div className="container-fluid d-flex align-items-center justify-content-center vh-100" style={{ backgroundColor: "#f5f6fa" }}>
      {/* Full-Width Shadowed Container */}
      <div className="shadow-lg p-5 rounded-3 w-100" style={{
        maxWidth: '2600px', // Triple the previous max width for near full-page coverage
        backgroundColor: '#ffffff',
        borderRadius: '15px',
      }}>

        {/* Form for Patient ID Input */}
        <div className="mb-4">
          <h2 className="text-center text-primary fw-bold mb-4">Patient History Lookup</h2>
          <p className="text-center text-muted mb-4">Enter Patient ID to retrieve history</p>
          
          <form onSubmit={fetchPatientHistory} className="d-flex justify-content-center">
            <input
              type="text"
              className="form-control form-control-lg me-3 w-50" // Wider input field for Patient ID
              style={{ maxWidth: '1000px' }} // Expanded width of the input field for near full-page balance
              placeholder="Enter Patient ID"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary btn-lg px-5">Retrieve History</button>
          </form>
        </div>

        {/* Error Message Display */}
        {error && (
          <div className="alert alert-danger text-center mt-3" role="alert">
            {error}
          </div>
        )}

        {/* Loading Message */}
        {loading && (
          <p className="text-center text-primary fs-5 mt-3">Loading patient history...</p>
        )}

        {/* Display Patient History if Data Exists */}
        {historyData && !loading && (
          <div className="row row-cols-1 row-cols-md-2 g-4 mt-4">
            <div className="col">
              <div className="card border-primary h-100">
                <div className="card-body">
                  <h5 className="card-title text-primary">Patient Name</h5>
                  <p className="card-text">{historyData.patientName}</p>
                </div>
              </div>
            </div>

            <div className="col">
              <div className="card border-primary h-100">
                <div className="card-body">
                  <h5 className="card-title text-primary">Medical History</h5>
                  <p className="card-text">{historyData.medicalHistory}</p>
                </div>
              </div>
            </div>

            <div className="col">
              <div className="card border-primary h-100">
                <div className="card-body">
                  <h5 className="card-title text-primary">Latest MRI</h5>
                  <p className="card-text">{historyData.latestMRI}</p>
                </div>
              </div>
            </div>

            <div className="col">
              <div className="card border-primary h-100">
                <div className="card-body">
                  <h5 className="card-title text-primary">Specialist Recommendations</h5>
                  <p className="card-text">{historyData.specialistRecommendations}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientHistory;
