import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Form,
  Modal,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { ENDPOINTS, apiUrl, downloadProtectedFile, getStoredAuthUser } from "../api";
import { fetchReportsDashboard } from "../services/reportsService";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

const defaultFilters = {
  date_from: "",
  date_to: "",
  model_type: "",
  diagnosis: "",
};

const palette = [
  "#145c7a",
  "#1c8d7d",
  "#cf8f2e",
  "#d65d5d",
  "#7a68d4",
  "#3b6ea8",
];

function chartFromObject(data, label) {
  const entries = Object.entries(data || {});
  return {
    labels: entries.map(([key]) => key),
    datasets: [
      {
        label,
        data: entries.map(([, value]) => value),
        backgroundColor: entries.map((_, index) => palette[index % palette.length]),
        borderColor: entries.map((_, index) => palette[index % palette.length]),
      },
    ],
  };
}

const Reports = () => {
  const { role } = getStoredAuthUser();
  const isAdmin = role === "Admin";
  const [filters, setFilters] = useState(defaultFilters);
  const [dashboard, setDashboard] = useState(null);
  const [selectedScan, setSelectedScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (activeFilters = defaultFilters) => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchReportsDashboard(activeFilters);
      setDashboard(data);
    } catch (requestError) {
      setError("Failed to load reports data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard(defaultFilters);
  }, [loadDashboard]);

  const summaryCards = useMemo(() => {
    if (!dashboard?.summary) {
      return [];
    }
    return [
      { label: "Total Scans", value: dashboard.summary.total_scans },
      { label: "Tumors Detected", value: dashboard.summary.tumors_detected },
      { label: "Detection Rate", value: `${dashboard.summary.detection_rate}%` },
      { label: "Avg Confidence", value: `${dashboard.summary.average_confidence}%` },
      { label: "Avg Processing", value: `${dashboard.summary.average_processing_time}s` },
      ...(isAdmin ? [{ label: "WhatsApp Scans", value: dashboard.whatsappScans?.length ?? 0 }] : []),
      { label: "Exports Logged", value: dashboard.adminUsage?.total_exports ?? 0 },
    ];
  }, [dashboard, isAdmin]);

  const diagnosesOverTimeChart = useMemo(
    () => ({
      labels: (dashboard?.charts.diagnosesOverTime || []).map((point) => point.label),
      datasets: [
        {
          label: "Diagnoses Over Time",
          data: (dashboard?.charts.diagnosesOverTime || []).map((point) => point.value),
          borderColor: "#145c7a",
          backgroundColor: "rgba(20,92,122,0.18)",
          fill: true,
          tension: 0.35,
        },
      ],
    }),
    [dashboard]
  );

  const processingTrendChart = useMemo(
    () => ({
      labels: (dashboard?.charts.processingTimeTrend || []).map((point) => point.label),
      datasets: [
        {
          label: "Processing Time Trend",
          data: (dashboard?.charts.processingTimeTrend || []).map((point) => point.value),
          borderColor: "#cf8f2e",
          backgroundColor: "rgba(207,143,46,0.18)",
          fill: true,
          tension: 0.35,
        },
      ],
    }),
    [dashboard]
  );

  const exportActivityChart = useMemo(
    () => ({
      labels: (dashboard?.charts.exportActivity || []).map((point) => point.label),
      datasets: [
        {
          label: "Export Activity",
          data: (dashboard?.charts.exportActivity || []).map((point) => point.value),
          borderColor: "#1c8d7d",
          backgroundColor: "rgba(28,141,125,0.18)",
          fill: true,
          tension: 0.35,
        },
      ],
    }),
    [dashboard]
  );

  const confidenceByModelChart = useMemo(
    () => chartFromObject(dashboard?.charts.confidenceByModel, "Confidence by Model"),
    [dashboard]
  );
  const modelUsageChart = useMemo(
    () => chartFromObject(dashboard?.charts.modelUsage, "Model Usage"),
    [dashboard]
  );
  const resultDistributionChart = useMemo(
    () => chartFromObject(dashboard?.charts.resultDistribution, "Result Distribution"),
    [dashboard]
  );
  const classDistributionChart = useMemo(
    () => chartFromObject(dashboard?.charts.classDistribution, "Class Distribution"),
    [dashboard]
  );
  const confidenceDistributionChart = useMemo(
    () => chartFromObject(dashboard?.charts.confidenceDistribution, "Confidence Distribution"),
    [dashboard]
  );

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const applyFilters = (event) => {
    event.preventDefault();
    loadDashboard(filters);
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    loadDashboard(defaultFilters);
  };

  const exportCsv = async () => {
    try {
      await downloadProtectedFile(ENDPOINTS.reports.exportCsv, "scan_report.csv");
      await loadDashboard(filters);
    } catch (_error) {
      setError("Failed to export CSV report.");
    }
  };

  const exportPdf = async () => {
    try {
      await downloadProtectedFile(ENDPOINTS.reports.exportPdf, "scan_report.pdf");
      await loadDashboard(filters);
    } catch (_error) {
      setError("Failed to export PDF report.");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-3 mb-0">Loading reports dashboard...</p>
      </div>
    );
  }

  return (
    <div className="reports-page">
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div>
          <h2 className="mb-1">Reports & Analytics</h2>
          <p className="text-muted mb-0">
            Real-time reporting across diagnoses, patients, models, audits, and exports.
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" onClick={exportCsv}>Export CSV</Button>
          <Button variant="outline-primary" onClick={exportPdf}>Export PDF</Button>
        </div>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Form onSubmit={applyFilters}>
            <Row className="g-3 align-items-end">
              <Col md={3}>
                <Form.Label>Date From</Form.Label>
                <Form.Control type="date" name="date_from" value={filters.date_from} onChange={handleFilterChange} />
              </Col>
              <Col md={3}>
                <Form.Label>Date To</Form.Label>
                <Form.Control type="date" name="date_to" value={filters.date_to} onChange={handleFilterChange} />
              </Col>
              <Col md={3}>
                <Form.Label>Model Type</Form.Label>
                <Form.Select name="model_type" value={filters.model_type} onChange={handleFilterChange}>
                  <option value="">All models</option>
                  <option value="fast">Fast Model</option>
                  <option value="deep">Deep Learning Tumor Detection Model</option>
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Label>Diagnosis</Form.Label>
                <Form.Select name="diagnosis" value={filters.diagnosis} onChange={handleFilterChange}>
                  <option value="">All results</option>
                  <option value="Tumor Detected">Tumor Detected</option>
                  <option value="No Tumor Detected">No Tumor Detected</option>
                </Form.Select>
              </Col>
              <Col xs="auto">
                <Button type="submit">Apply Filters</Button>
              </Col>
              <Col xs="auto">
                <Button variant="outline-secondary" type="button" onClick={resetFilters}>
                  Reset
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      <Row className="g-3 mb-4">
        {summaryCards.map((card) => (
          <Col md={4} xl={2} key={card.label}>
            <Card className="shadow-sm h-100 report-summary-card">
              <Card.Body>
                <div className="text-muted small mb-2">{card.label}</div>
                <div className="report-summary-value">{card.value}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="g-4 mb-4">
        <Col lg={8}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <h5>Diagnoses Over Time</h5>
              <Line data={diagnosesOverTimeChart} />
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <h5>Result Distribution</h5>
              <Doughnut data={resultDistributionChart} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col lg={4}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <h5>Class Distribution</h5>
              <Doughnut data={classDistributionChart} />
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <h5>Model Usage</h5>
              <Bar data={modelUsageChart} options={{ plugins: { legend: { display: false } } }} />
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <h5>Confidence by Model</h5>
              <Bar data={confidenceByModelChart} options={{ plugins: { legend: { display: false } } }} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col lg={6}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <h5>Processing Time Trend</h5>
              <Line data={processingTrendChart} />
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <h5>Confidence Distribution</h5>
              <Bar data={confidenceDistributionChart} options={{ plugins: { legend: { display: false } } }} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col lg={8}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <h5>Export Activity</h5>
              <Line data={exportActivityChart} />
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <h5>Live Model Activity</h5>
              <div className="text-muted small">Stored diagnosis records</div>
              <div className="fw-semibold fs-4 mb-3">{dashboard?.modelPerformance?.summary?.total_scans ?? 0}</div>
              <div className="text-muted small">Models with scan activity</div>
              <div className="mb-3">
                {(dashboard?.modelPerformance?.models || []).map((model) => model.model).join(", ") || "No model activity yet"}
              </div>
              <div className="text-muted small">Audit export events</div>
              <div className="fw-semibold">{dashboard?.adminUsage?.total_exports ?? 0}</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col lg={8}>
          <Card className="shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Patient Scan Reports</h5>
                <small className="text-muted">{dashboard?.patientScans?.length ?? 0} patients</small>
              </div>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Patient ID</th>
                    <th>Name</th>
                    <th>Scan Count</th>
                    <th>Latest Diagnosis</th>
                    <th>Latest Scan</th>
                  </tr>
                </thead>
                <tbody>
                  {(dashboard?.patientScans || []).map((patient) => (
                    <tr key={patient.patientId}>
                      <td>{patient.patientId}</td>
                      <td>{patient.fullName || "Unnamed Patient"}</td>
                      <td>{patient.scanCount}</td>
                      <td>{patient.latestDiagnosis || "No linked scans"}</td>
                      <td>{patient.latestScanAt || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <h5>Admin Usage</h5>
              {(dashboard?.adminUsage?.active_users || []).slice(0, 8).map((user) => (
                <div key={user.userEmail} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <div>
                    <div className="fw-semibold">{user.userEmail}</div>
                    <small className="text-muted">Exports: {user.exportCount}</small>
                  </div>
                  <Badge bg="dark">{user.scanCount} scans</Badge>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        <Col lg={7}>
          <Card className="shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Diagnosis Records</h5>
                <small className="text-muted">{dashboard?.scans?.length ?? 0} records</small>
              </div>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Scan ID</th>
                    <th>Diagnosis</th>
                    <th>Model</th>
                    <th>Confidence</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {(dashboard?.scans || []).slice(0, 100).map((scan) => (
                    <tr key={scan.id} style={{ cursor: "pointer" }} onClick={() => setSelectedScan(scan)}>
                      <td>{scan.id}</td>
                      <td>
                        <Badge bg={scan.diagnosis === "Tumor Detected" ? "danger" : "success"}>
                          {scan.diagnosis}
                        </Badge>
                      </td>
                      <td>{scan.model_used || scan.model_type || "Unknown"}</td>
                      <td>{scan.confidence}%</td>
                      <td>{scan.processing_time}s</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={5}>
          <Card className="shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Audit Trail</h5>
                <small className="text-muted">{dashboard?.auditTrail?.length ?? 0} events</small>
              </div>
              <Table responsive size="sm">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>User</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {(dashboard?.auditTrail || []).slice(0, 12).map((entry, index) => (
                    <tr key={`${entry.action}-${entry.createdAt}-${index}`}>
                      <td>{entry.action}</td>
                      <td>{entry.actorEmail || "System"}</td>
                      <td>{entry.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {isAdmin ? (
        <Row className="g-4 mt-1">
          <Col lg={12}>
            <Card className="shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">WhatsApp-Originated Scans</h5>
                  <small className="text-muted">{dashboard?.whatsappScans?.length ?? 0} records</small>
                </div>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Scan ID</th>
                      <th>Phone</th>
                      <th>Diagnosis</th>
                      <th>Model</th>
                      <th>Created</th>
                      <th>Image</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(dashboard?.whatsappScans || []).slice(0, 100).map((scan) => (
                      <tr key={`wa-${scan.id}`} style={{ cursor: "pointer" }} onClick={() => setSelectedScan(scan)}>
                        <td>{scan.id}</td>
                        <td>{scan.phone || "Unknown"}</td>
                        <td>
                          <Badge bg={scan.diagnosis === "Tumor Detected" ? "danger" : "success"}>
                            {scan.diagnosis}
                          </Badge>
                        </td>
                        <td>{scan.model_used || scan.model_type || "Unknown"}</td>
                        <td>{scan.createdAt || "N/A"}</td>
                        <td>
                          {scan.generated_media_url ? (
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={(event) => {
                                event.stopPropagation();
                                window.open(apiUrl(scan.generated_media_url), "_blank", "noopener,noreferrer");
                              }}
                            >
                              View Annotated
                            </Button>
                          ) : (
                            <span className="text-muted">No image</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      ) : null}

      <Modal show={Boolean(selectedScan)} onHide={() => setSelectedScan(null)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Diagnosis Record Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedScan ? (
            <Row className="g-3">
              <Col md={6}><strong>Scan ID:</strong> {selectedScan.id}</Col>
              <Col md={6}><strong>Diagnosis:</strong> {selectedScan.diagnosis}</Col>
              <Col md={6}><strong>Confidence:</strong> {selectedScan.confidence}%</Col>
              <Col md={6}><strong>Processing Time:</strong> {selectedScan.processing_time}s</Col>
              <Col md={6}><strong>Model:</strong> {selectedScan.model_used || selectedScan.model_type || "Unknown"}</Col>
              <Col md={6}><strong>Tumor Type:</strong> {selectedScan.tumor_type || "N/A"}</Col>
              {isAdmin ? <Col md={6}><strong>Source:</strong> {selectedScan.source || "web"}</Col> : null}
              {isAdmin ? <Col md={6}><strong>Phone:</strong> {selectedScan.phone || "N/A"}</Col> : null}
              <Col md={12}><strong>Created At:</strong> {selectedScan.createdAt}</Col>
              <Col md={12}><strong>Recommendations:</strong> {selectedScan.recommendations || "N/A"}</Col>
              {isAdmin ? (
                <Col md={12}>
                  <strong>Annotated Image:</strong>{" "}
                  {selectedScan.generated_media_url ? (
                    <a
                      href={apiUrl(selectedScan.generated_media_url)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open generated scan
                    </a>
                  ) : (
                    "N/A"
                  )}
                </Col>
              ) : null}
            </Row>
          ) : null}
        </Modal.Body>
      </Modal>

      <style>{`
        .reports-page .report-summary-card {
          border-radius: 18px;
        }
        .reports-page .report-summary-value {
          font-size: 1.8rem;
          font-weight: 700;
          color: #17384a;
        }
      `}</style>
    </div>
  );
};

export default Reports;
