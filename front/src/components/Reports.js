import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Reports = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        console.log("Attempting to fetch logs from backend...");
        const response = await axios.get('http://localhost:5000/get_reports');
        console.log("Logs fetched successfully:", response.data);
        
        // Check and set both activity logs and scan logs if present
        const allLogs = [...(response.data.activity_logs || []), ...(response.data.scan_logs || [])];
        setLogs(allLogs);
      } catch (error) {
        console.error('Error fetching logs:', error);
        setError('Failed to fetch logs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const downloadLogs = () => {
    window.open('http://localhost:5000/download_logs', '_blank');
  };

  return (
    <div>
      <h2>User Activity Logs</h2>
      <button onClick={downloadLogs} disabled={loading}>
        Download Logs as CSV
      </button>
      
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && logs.length === 0 && (
        <p>No activity logs found.</p>
      )}

      {!loading && logs.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Patient Name</th>
              <th>Scan Result</th>
              <th>Scan Date</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => (
              <tr key={index}>
                <td>{log.username || 'N/A'}</td>
                <td>{log.email || 'N/A'}</td>
                <td>{log.patient_name || 'N/A'}</td>
                <td>{log.scan_result || 'N/A'}</td>
                <td>{log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Reports;
