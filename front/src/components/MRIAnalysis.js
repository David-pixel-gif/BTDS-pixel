import React, { useState, useEffect } from "react";
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
} from "chart.js";
import { FaUpload, FaCheckCircle } from "react-icons/fa";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const MRIAnalysis = () => {
  const [scanData, setScanData] = useState([]);
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Simulated fetch from the database (Replace with API call)
  useEffect(() => {
    setScanData([
      { id: 1, diagnosis: "No Tumor Detected", confidence: 1.58, processing_time: 3.35, timestamp: "2025-03-09 07:48:26" },
      { id: 2, diagnosis: "Tumor Detected", confidence: 81.10, processing_time: 0.41, timestamp: "2025-03-09 07:49:05" },
      { id: 3, diagnosis: "No Tumor Detected", confidence: 1.58, processing_time: 0.45, timestamp: "2025-03-09 10:37:03" },
      { id: 4, diagnosis: "No Tumor Detected", confidence: 0.0023, processing_time: 0.12, timestamp: "2025-03-09 10:40:29" },
      { id: 5, diagnosis: "Tumor Detected", confidence: 100.0, processing_time: 0.11, timestamp: "2025-03-09 10:49:36" },
      { id: 6, diagnosis: "No Tumor Detected", confidence: 0.0023, processing_time: 0.19, timestamp: "2025-03-09 11:03:02" },
      { id: 7, diagnosis: "No Tumor Detected", confidence: 0.0023, processing_time: 0.12, timestamp: "2025-03-09 11:05:38" },
    ]);
  }, []);

  // Process scan data for visualization
  const timestamps = scanData.map((scan) => scan.timestamp);
  const confidenceScores = scanData.map((scan) => scan.confidence);
  const processingTimes = scanData.map((scan) => scan.processing_time);
  const tumorCases = scanData.filter((scan) => scan.diagnosis === "Tumor Detected").length;
  const normalCases = scanData.length - tumorCases;

  return (
    <div className="container mt-5">
      <h2 className="text-center text-primary fw-bold">MRI Scan Analysis Dashboard</h2>

      {/* File Upload Section */}
      <div className="card shadow-lg p-4 mb-4">
        <div className="card-body text-center">
          <label className="btn btn-outline-primary btn-lg">
            <FaUpload className="me-2" />
            Choose MRI Scan
            <input type="file" onChange={(e) => setFile(e.target.files[0])} hidden />
          </label>
          {file && (
            <p className="mt-3 text-success">
              <FaCheckCircle className="me-2" />
              {file.name} uploaded
            </p>
          )}
          <button className="btn btn-primary btn-lg mt-3" disabled={isProcessing}>
            {isProcessing ? "Processing..." : "Analyze"}
          </button>
        </div>
      </div>

      {/* Line Chart - Confidence Over Time */}
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

      {/* Bar Chart - Tumor vs No Tumor Cases */}
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

      {/* Scatter Plot - Processing Time vs Confidence */}
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

      {/* Pie Chart - Tumor Detection Rate */}
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
