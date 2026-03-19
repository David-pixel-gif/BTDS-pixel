import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Badge,
  ProgressBar,
  Spinner
} from "react-bootstrap";
import { Link } from "react-router-dom";
import {
  FaBrain,
  FaClipboardList,
  FaCheckCircle,
  FaUpload,
  FaChartLine
} from "react-icons/fa";
import axios from "axios";
import { ENDPOINTS, apiUrl, getAuthConfig } from "../api";

const Home = () => {
  const [summary, setSummary] = useState(null);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");
        const config = getAuthConfig();

        const [summaryRes, scansRes] = await Promise.all([
          axios.get(apiUrl(ENDPOINTS.reports.summary), config),
          axios.get(apiUrl(ENDPOINTS.reports.myHistory), config),
        ]);

        setSummary(summaryRes.data);
        setScans(scansRes.data.slice(0, 5));
      } catch (err) {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
        <p className="mt-3">Loading dashboard…</p>
      </div>
    );
  }

  if (error || !summary) {
    return <div className="alert alert-danger m-4">{error || "Dashboard data is unavailable."}</div>;
  }

  const detectionRate =
    summary.total_scans > 0
      ? ((summary.tumors_detected / summary.total_scans) * 100).toFixed(1)
      : 0;

  return (
    <Container fluid className="p-4">

      <Row className="mb-4">
        <Col>
          <h5 className="fw-semibold mb-1">Dashboard Overview</h5>
          <small className="text-muted">
            Brain Tumor Detection System – Live Operational Summary
          </small>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col xl={3} md={6}>
          <Card className="shadow-sm rounded-4">
            <Card.Body>
              <FaClipboardList size={22} className="text-primary mb-2" />
              <small className="text-muted">Total Scans</small>
              <h3 className="fw-bold">{summary.total_scans}</h3>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={3} md={6}>
          <Card className="shadow-sm rounded-4">
            <Card.Body>
              <FaBrain size={22} className="text-danger mb-2" />
              <small className="text-muted">Tumors Detected</small>
              <h3 className="fw-bold">{summary.tumors_detected}</h3>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={3} md={6}>
          <Card className="shadow-sm rounded-4">
            <Card.Body>
              <FaCheckCircle size={22} className="text-success mb-2" />
              <small className="text-muted">No Tumor</small>
              <h3 className="fw-bold">{summary.no_tumor}</h3>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={3} md={6}>
          <Card className="shadow-sm rounded-4">
            <Card.Body>
              <FaChartLine size={22} className="text-info mb-2" />
              <small className="text-muted">Detection Rate</small>
              <h3 className="fw-bold">{detectionRate}%</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col lg={6}>
          <Card className="shadow-sm rounded-4 h-100">
            <Card.Body className="d-flex flex-column justify-content-center align-items-center">
              <FaUpload size={30} className="text-primary mb-3" />
              <h6 className="fw-semibold mb-2">Upload MRI for Analysis</h6>
              <Button as={Link} to="/diagnosis" size="lg" className="px-4">
                Upload MRI Scan
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="shadow-sm rounded-4 h-100">
            <Card.Body>
              <h6 className="fw-semibold mb-3">Latest AI Result</h6>

              {scans.length > 0 ? (
                <>
                  <p className="mb-1">
                    Diagnosis:{" "}
                    <Badge bg={scans[0].diagnosis === "Tumor Detected" ? "danger" : "success"}>
                      {scans[0].diagnosis}
                    </Badge>
                  </p>
                  <p className="mb-2">
                    Confidence: <strong>{scans[0].confidence}%</strong>
                  </p>
                  <ProgressBar now={scans[0].confidence} />
                </>
              ) : (
                <p className="text-muted">No scans processed yet.</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card className="shadow-sm rounded-4">
            <Card.Body>
              <h6 className="fw-semibold mb-3">Recent Scans</h6>
              <Table hover responsive>
                <thead className="text-muted small">
                  <tr>
                    <th>ID</th>
                    <th>Diagnosis</th>
                    <th>Confidence</th>
                    <th>Processing Time (s)</th>
                  </tr>
                </thead>
                <tbody>
                  {scans.map((scan) => (
                    <tr key={scan.id}>
                      <td>{scan.id}</td>
                      <td>
                        <Badge
                          bg={scan.diagnosis === "Tumor Detected" ? "danger" : "success"}
                        >
                          {scan.diagnosis}
                        </Badge>
                      </td>
                      <td>{scan.confidence}%</td>
                      <td>{scan.processing_time}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

    </Container>
  );
};

export default Home;
