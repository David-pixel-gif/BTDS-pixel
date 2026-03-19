import axios from "axios";

export const API_BASE = process.env.REACT_APP_API_BASE || "";

export const ENDPOINTS = Object.freeze({
  system: {
    root: "/",
    health: "/health",
    endpoints: "/api/endpoints",
  },
  auth: {
    register: "/create_user",
    login: "/login",
    logout: "/logout",
    me: "/me",
  },
  roles: {
    permissions: "/api/permissions",
    all: "/api/roles",
    byId: (roleId) => `/api/roles/${roleId}`,
    users: "/api/users",
    assignRole: "/api/users/assign-role",
  },
  patients: {
    register: "/api/patient/register",
    history: (patientId) => `/api/patient-history/${patientId}`,
    details: (patientId) => `/api/patient/${patientId}`,
  },
  diagnoses: {
    create: "/diagnoses",
  },
  reports: {
    all: "/api/reports/scans",
    rootSummary: "/api/reports/summary",
    summary: "/api/reports/scans/summary",
    patientScans: "/api/reports/patient-scans",
    patientHistory: "/api/reports/patient-history",
    modelPerformance: "/api/reports/model-performance",
    auditTrail: "/api/reports/audit-trail",
    adminUsage: "/api/reports/admin-usage",
    researchDemo: "/api/reports/research-demo",
    tumorClasses: "/api/reports/tumors/classes",
    myHistory: "/api/reports/scans/my-history",
    metrics: "/api/reports/model/metrics",
    performance: "/api/reports/model/performance",
    confusionMatrix: "/api/reports/model/confusion-matrix",
    roc: "/api/reports/model/roc",
    accuracyByClass: "/api/reports/model/accuracy-by-class",
    diagnosesOverTime: "/api/reports/charts/diagnoses-over-time",
    resultDistribution: "/api/reports/charts/result-distribution",
    classDistribution: "/api/reports/charts/class-distribution",
    modelUsage: "/api/reports/charts/model-usage",
    confidenceByModel: "/api/reports/charts/confidence-by-model",
    processingTimeTrend: "/api/reports/charts/processing-time-trend",
    confidenceDistribution: "/api/reports/charts/confidence-distribution",
    exportActivity: "/api/reports/charts/export-activity",
    exportCsv: "/api/reports/export/csv",
    exportPdf: "/api/reports/export/pdf",
    whatsappScans: "/api/reports/scans/whatsapp",
  },
});

export const FRONTEND_ENDPOINT_MANIFEST = Object.freeze([
  { name: "system.root", path: ENDPOINTS.system.root, methods: ["GET"] },
  { name: "system.health", path: ENDPOINTS.system.health, methods: ["GET"] },
  { name: "system.endpoints", path: ENDPOINTS.system.endpoints, methods: ["GET"] },
  { name: "auth.register", path: ENDPOINTS.auth.register, methods: ["POST"] },
  { name: "auth.login", path: ENDPOINTS.auth.login, methods: ["POST"] },
  { name: "auth.logout", path: ENDPOINTS.auth.logout, methods: ["POST"] },
  { name: "auth.me", path: ENDPOINTS.auth.me, methods: ["GET", "PUT"] },
  { name: "roles.permissions", path: ENDPOINTS.roles.permissions, methods: ["GET"] },
  { name: "roles.all", path: ENDPOINTS.roles.all, methods: ["GET", "POST"] },
  { name: "roles.byId", path: "/api/roles/<role_id>", methods: ["PUT"] },
  { name: "roles.users", path: ENDPOINTS.roles.users, methods: ["GET"] },
  { name: "roles.assignRole", path: ENDPOINTS.roles.assignRole, methods: ["POST"] },
  { name: "patients.register", path: ENDPOINTS.patients.register, methods: ["POST"] },
  { name: "patients.history", path: "/api/patient-history/<patient_id>", methods: ["GET"] },
  { name: "patients.details", path: "/api/patient/<patient_id>", methods: ["GET"] },
  { name: "diagnoses.create", path: ENDPOINTS.diagnoses.create, methods: ["POST"] },
  { name: "reports.all", path: ENDPOINTS.reports.all, methods: ["GET"] },
  { name: "reports.rootSummary", path: ENDPOINTS.reports.rootSummary, methods: ["GET"] },
  { name: "reports.summary", path: ENDPOINTS.reports.summary, methods: ["GET"] },
  { name: "reports.patientScans", path: ENDPOINTS.reports.patientScans, methods: ["GET"] },
  { name: "reports.patientHistory", path: ENDPOINTS.reports.patientHistory, methods: ["GET"] },
  { name: "reports.modelPerformance", path: ENDPOINTS.reports.modelPerformance, methods: ["GET"] },
  { name: "reports.auditTrail", path: ENDPOINTS.reports.auditTrail, methods: ["GET"] },
  { name: "reports.adminUsage", path: ENDPOINTS.reports.adminUsage, methods: ["GET"] },
  { name: "reports.researchDemo", path: ENDPOINTS.reports.researchDemo, methods: ["GET"] },
  { name: "reports.tumorClasses", path: ENDPOINTS.reports.tumorClasses, methods: ["GET"] },
  { name: "reports.myHistory", path: ENDPOINTS.reports.myHistory, methods: ["GET"] },
  { name: "reports.metrics", path: ENDPOINTS.reports.metrics, methods: ["GET"] },
  { name: "reports.performance", path: ENDPOINTS.reports.performance, methods: ["GET"] },
  { name: "reports.confusionMatrix", path: ENDPOINTS.reports.confusionMatrix, methods: ["GET"] },
  { name: "reports.roc", path: ENDPOINTS.reports.roc, methods: ["GET"] },
  { name: "reports.accuracyByClass", path: ENDPOINTS.reports.accuracyByClass, methods: ["GET"] },
  { name: "reports.diagnosesOverTime", path: ENDPOINTS.reports.diagnosesOverTime, methods: ["GET"] },
  { name: "reports.resultDistribution", path: ENDPOINTS.reports.resultDistribution, methods: ["GET"] },
  { name: "reports.classDistribution", path: ENDPOINTS.reports.classDistribution, methods: ["GET"] },
  { name: "reports.modelUsage", path: ENDPOINTS.reports.modelUsage, methods: ["GET"] },
  { name: "reports.confidenceByModel", path: ENDPOINTS.reports.confidenceByModel, methods: ["GET"] },
  { name: "reports.processingTimeTrend", path: ENDPOINTS.reports.processingTimeTrend, methods: ["GET"] },
  { name: "reports.confidenceDistribution", path: ENDPOINTS.reports.confidenceDistribution, methods: ["GET"] },
  { name: "reports.exportActivity", path: ENDPOINTS.reports.exportActivity, methods: ["GET"] },
  { name: "reports.exportCsv", path: ENDPOINTS.reports.exportCsv, methods: ["GET"] },
  { name: "reports.exportPdf", path: ENDPOINTS.reports.exportPdf, methods: ["GET"] },
  { name: "reports.whatsappScans", path: ENDPOINTS.reports.whatsappScans, methods: ["GET"] },
]);

export const apiUrl = (path) => `${API_BASE}${path}`;

export const getAuthToken = () => localStorage.getItem("accessToken");

export const clearAuthSession = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("userID");
  localStorage.removeItem("userName");
  localStorage.removeItem("userRole");
};

export const storeAuthSession = ({ token, user, role } = {}) => {
  if (token) {
    localStorage.setItem("accessToken", token);
  }
  if (user?.id) {
    localStorage.setItem("userID", user.id);
  }
  if (user?.username) {
    localStorage.setItem("userName", user.username);
  }
  const resolvedRole = role || user?.roles?.[0];
  if (resolvedRole) {
    localStorage.setItem("userRole", resolvedRole);
  }
};

export const getStoredAuthUser = () => ({
  id: localStorage.getItem("userID"),
  username: localStorage.getItem("userName"),
  role: localStorage.getItem("userRole"),
});

export const getAuthHeader = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getAuthConfig = () => ({ headers: getAuthHeader() });

export const fetchCurrentUser = async (token = getAuthToken()) => {
  if (!token) {
    throw new Error("Missing access token");
  }

  const response = await axios.get(apiUrl(ENDPOINTS.auth.me), {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const fetchBackendEndpoints = async () => {
  const response = await axios.get(apiUrl(ENDPOINTS.system.endpoints));
  return response.data;
};

export const validateEndpointContract = async () => {
  try {
    const backendEndpoints = await fetchBackendEndpoints();
    const backendMap = new Map(
      backendEndpoints.map((item) => [item.path, new Set(item.methods)])
    );

    const missing = FRONTEND_ENDPOINT_MANIFEST.filter((item) => {
      const methods = backendMap.get(item.path);
      return !methods || item.methods.some((method) => !methods.has(method));
    });

    const extra = backendEndpoints.filter(
      (item) => !FRONTEND_ENDPOINT_MANIFEST.some((entry) => entry.path === item.path)
    );

    return { ok: missing.length === 0, missing, extra, backendEndpoints };
  } catch (error) {
    return {
      ok: false,
      missing: FRONTEND_ENDPOINT_MANIFEST,
      extra: [],
      error,
    };
  }
};

export const downloadProtectedFile = async (path, filename) => {
  const response = await fetch(apiUrl(path), {
    method: "GET",
    headers: getAuthHeader(),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Failed to download ${filename}`);
  }

  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
};
