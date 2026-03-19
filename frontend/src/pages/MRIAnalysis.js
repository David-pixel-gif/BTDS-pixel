import React, { useEffect, useState } from "react";
import { Line, Bar, Scatter, Pie } from "react-chartjs-2";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { FaUpload, FaCheckCircle } from "react-icons/fa";
import axios from "axios";
import { ENDPOINTS, apiUrl, getAuthConfig, getAuthHeader } from "../api";


ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);


const MRIAnalysis = () => {
  const [scanData, setScanData] = useState([]);
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadHistory = async () => {
    try {
      setError("");
      const response = await axios.get(
        apiUrl(ENDPOINTS.reports.myHistory),
        getAuthConfig()
      );
      setScanData(
        response.data.map((scan) => ({
          ...scan,
          timestamp: scan.createdAt || `Scan ${scan.id}`,
        }))
      );
    } catch (error) {
      setError("Failed to fetch MRI analysis history.");
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const analyzeScan = async () => {
    if (!file) {
      setError("Choose an MRI scan before analysis.");
      return;
    }

    try {
      setIsProcessing(true);
      setError("");
      setMessage("");
      const formData = new FormData();
      formData.append("file", file);
      await axios.post(apiUrl(ENDPOINTS.diagnoses.create), formData, {
        headers: getAuthHeader(),
      });
      await loadHistory();
      setMessage("MRI scan analyzed successfully.");
    } catch (error) {
      setError(error.response?.data?.error || "Failed to analyze MRI.");
    } finally {
      setIsProcessing(false);
    }
  };

  const timestamps = scanData.map((scan) => scan.timestamp);
  const confidenceScores = scanData.map((scan) => scan.confidence);
  const tumorCases = scanData.filter((scan) => scan.diagnosis === "Tumor Detected").length;
  const normalCases = scanData.length - tumorCases;

  return (
    <div className="container mt-5">
      <h2 className="text-center text-primary fw-bold">MRI Scan Analysis Dashboard</h2>
      {error ? <div className="alert alert-danger mt-3">{error}</div> : null}
      {message ? <div className="alert alert-success mt-3">{message}</div> : null}

      <div className="card shadow-lg p-4 mb-4">
        <div className="card-body text-center">
          <label className="btn btn-outline-primary btn-lg">
            <FaUpload className="me-2" />
            Choose MRI Scan
            <input type="file" onChange={(event) => setFile(event.target.files[0])} hidden />
          </label>
          {file ? (
            <p className="mt-3 text-success">
              <FaCheckCircle className="me-2" />
              {file.name} uploaded
            </p>
          ) : null}
          <button
            className="btn btn-primary btn-lg mt-3"
            disabled={isProcessing || !file}
            onClick={analyzeScan}
          >
            {isProcessing ? "Processing..." : "Analyze"}
          </button>
        </div>
      </div>

      <div className="card shadow-lg p-4 mb-4">
        <h5 className="fw-bold text-center">Confidence Score Over Time</h5>
        <Line
          data={{
            labels: timestamps,
            datasets: [
              {
                label: "Confidence (%)",
                data: confidenceScores,
                borderColor: "blue",
                backgroundColor: "rgba(0, 123, 255, 0.2)",
                fill: true,
                tension: 0.4,
              },
            ],
          }}
        />
      </div>

      <div className="card shadow-lg p-4 mb-4">
        <h5 className="fw-bold text-center">Tumor Cases vs. Normal Cases</h5>
        <Bar
          data={{
            labels: ["No Tumor Detected", "Tumor Detected"],
            datasets: [
              {
                label: "Total Cases",
                data: [normalCases, tumorCases],
                backgroundColor: ["green", "red"],
              },
            ],
          }}
        />
      </div>

      <div className="card shadow-lg p-4 mb-4">
        <h5 className="fw-bold text-center">Processing Time vs Confidence</h5>
        <Scatter
          data={{
            datasets: [
              {
                label: "Confidence vs Processing Time",
                data: scanData.map((scan) => ({
                  x: scan.processing_time,
                  y: scan.confidence,
                })),
                backgroundColor: "purple",
              },
            ],
          }}
          options={{
            scales: {
              x: { title: { display: true, text: "Processing Time (Seconds)" } },
              y: { title: { display: true, text: "Confidence (%)" } },
            },
          }}
        />
      </div>

      <div className="card shadow-lg p-4 mb-4">
        <h5 className="fw-bold text-center">Tumor Detection Rate</h5>
        <Pie
          data={{
            labels: ["No Tumor Detected", "Tumor Detected"],
            datasets: [
              {
                data: [normalCases, tumorCases],
                backgroundColor: ["green", "red"],
              },
            ],
          }}
        />
      </div>
    </div>
  );
};


export default MRIAnalysis;
