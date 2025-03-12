import React, { useState, useEffect } from 'react';
import { Line, Pie } from 'react-chartjs-2';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  Chart as ChartJS,
  ArcElement,
  LineElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';

// Register necessary components
ChartJS.register(ArcElement, LineElement, CategoryScale, LinearScale, Tooltip, Legend);

const OutcomeAnalysis = () => {
  const [analysisData, setAnalysisData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('http://localhost:5000/outcome-data'); // Adjust the endpoint if necessary
        const data = await response.json();
        if (data && data.totalScans > 0) {
          setAnalysisData(data);
        } else {
          setAnalysisData(null);
        }
      } catch (error) {
        console.error('Error fetching analysis data:', error);
        setAnalysisData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const confidenceChartData = analysisData
    ? {
        labels: analysisData.accuracyOverTime.labels || [],
        datasets: [
          {
            label: 'Confidence Over Time (%)',
            data: analysisData.accuracyOverTime.data || [],
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: true,
          },
        ],
      }
    : { labels: [], datasets: [] };

  const diagnosisDistributionData = analysisData
    ? {
        labels: analysisData.diagnosisDistribution.labels || [],
        datasets: [
          {
            label: 'Diagnosis Distribution',
            data: analysisData.diagnosisDistribution.data || [],
            backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)'],
            hoverBackgroundColor: ['rgba(255, 99, 132, 0.8)', 'rgba(54, 162, 235, 0.8)'],
          },
        ],
      }
    : { labels: [], datasets: [] };

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">Outcome Analysis</h2>

      {isLoading ? (
        <p>Loading analysis data...</p>
      ) : analysisData ? (
        <>
          {/* Summary Information */}
          <div className="card mb-3">
            <div className="card-body text-center">
              <h5>Total Scans: {analysisData.totalScans}</h5>
              <p>Tumor Cases: {analysisData.tumorCases}</p>
              <p>No Tumor Cases: {analysisData.noTumorCases}</p>
              <p>Average Confidence Score: {analysisData.averageConfidence.toFixed(2)}%</p>
              <p>Tumor Detection Rate: {analysisData.tumorDetectionRate.toFixed(2)}%</p>
            </div>
          </div>

          {/* Confidence Score Over Time */}
          <div className="card mb-3">
            <div className="card-body">
              <h5>Confidence Score Over Time</h5>
              <Line data={confidenceChartData} />
            </div>
          </div>

          {/* Diagnosis Distribution */}
          <div className="card mb-3">
            <div className="card-body">
              <h5>Diagnosis Distribution</h5>
              <Pie data={diagnosisDistributionData} />
            </div>
          </div>

        </>
      ) : (
        <p>No data found</p>
      )}
    </div>
  );
};

export default OutcomeAnalysis;
