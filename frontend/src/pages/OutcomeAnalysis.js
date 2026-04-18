import React, { useEffect, useState } from "react";
import { Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  LineElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Card, Row, Col, Spinner, Badge } from "react-bootstrap";
import axios from "axios";
import { ENDPOINTS, apiUrl, getAuthConfig } from "../api";

ChartJS.register(
  ArcElement,
  LineElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

const OutcomeAnalysis = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [distribution, setDistribution] = useState({});
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOutcomeData = async () => {
      try {
        setLoading(true);
        setError("");
        const config = getAuthConfig();

        const [summaryRes, distRes, historyRes] = await Promise.allSettled([
          axios.get(apiUrl(ENDPOINTS.reports.summary), config),
          axios.get(apiUrl(ENDPOINTS.reports.tumorClasses), config),
          axios.get(apiUrl(ENDPOINTS.reports.myHistory), config),
        ]);

        const nextSummary =
          summaryRes.status === "fulfilled"
            ? summaryRes.value.data
            : {
                total_scans: 0,
                tumors_detected: 0,
                detection_rate: 0,
                average_confidence: 0,
              };
        const nextDistribution = distRes.status === "fulfilled" ? distRes.value.data : {};
        const nextHistory =
          historyRes.status === "fulfilled" && Array.isArray(historyRes.value.data)
            ? [...historyRes.value.data].reverse()
            : [];

        setSummary(nextSummary);
        setDistribution(nextDistribution);
        setHistory(nextHistory);
      } catch (err) {
        setError("Failed to load outcome analysis.");
      } finally {
        setLoading(false);
      }
    };

    fetchOutcomeData();
  }, []);

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
        <p className="mt-3">Loading outcome analysis...</p>
      </div>
    );
  }

  if (error || !summary) {
    return <div className="alert alert-danger m-4">{error || "No outcome data available."}</div>;
  }

  const totalScans = summary.total_scans;
  const tumorCases = summary.tumors_detected;

  const detectionRate =
    totalScans > 0 ? ((tumorCases / totalScans) * 100).toFixed(1) : 0;

  const avgConfidence =
    history.length > 0
      ? (
          history.reduce((sum, s) => sum + Number(s.confidence || 0), 0) / history.length
        ).toFixed(2)
      : 0;

  const confidenceLineData = {
    labels: history.map((_, i) => `Scan ${i + 1}`),
    datasets: [
      {
        label: "Confidence (%)",
        data: history.map((s) => Number(s.confidence || 0)),
        borderColor: "rgba(13,110,253,1)",
        backgroundColor: "rgba(13,110,253,0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const diagnosisPieData = {
    labels: Object.keys(distribution),
    datasets: [
      {
        data: Object.values(distribution),
        backgroundColor: [
          "rgba(220,53,69,0.7)",
          "rgba(25,135,84,0.7)",
        ],
        hoverBackgroundColor: [
          "rgba(220,53,69,0.9)",
          "rgba(25,135,84,0.9)",
        ],
      },
    ],
  };

  return (
    <div className="p-4">
      <h2 className="mb-2">Outcome Analysis</h2>
      <p className="text-muted mb-4">
        Model behavior, confidence stability, and diagnostic trends
      </p>

      <Row className="mb-4">
        <Col md={3}>
          <Card className="shadow-sm">
            <Card.Body>
              <h6 className="text-muted">Total Scans</h6>
              <h3>{totalScans}</h3>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="shadow-sm">
            <Card.Body>
              <h6 className="text-muted">Detection Rate</h6>
              <h3>{detectionRate}%</h3>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="shadow-sm">
            <Card.Body>
              <h6 className="text-muted">Avg Confidence</h6>
              <h3>{avgConfidence}%</h3>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="shadow-sm">
            <Card.Body>
              <h6 className="text-muted">Model Status</h6>
              <Badge bg="success">Stable</Badge>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={8}>
          <Card className="shadow-sm mb-4">
            <Card.Body>
              <h5 className="mb-3">Confidence Trend Over Time</h5>
              <Line data={confidenceLineData} />
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow-sm mb-4">
            <Card.Body>
              <h5 className="mb-3">Diagnosis Distribution</h5>
              <Pie data={diagnosisPieData} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default OutcomeAnalysis;
