import axios from "axios";
import { ENDPOINTS, apiUrl, getAuthConfig, getStoredAuthUser } from "../api";

const withParams = (params = {}) => ({
  ...getAuthConfig(),
  params: Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "" && value !== null && value !== undefined)
  ),
});

const getReport = async (path, config) => {
  const response = await axios.get(apiUrl(path), config);
  return response.data;
};

export async function fetchReportsDashboard(filters = {}) {
  const config = withParams(filters);
  const { role } = getStoredAuthUser();
  const isAdmin = role === "Admin";
  const [
    summary,
    scans,
    patientScans,
    modelPerformance,
    auditTrail,
    adminUsage,
    diagnosesOverTime,
    resultDistribution,
    classDistribution,
    modelUsage,
    confidenceByModel,
    processingTimeTrend,
    confidenceDistribution,
    exportActivity,
    whatsappScans,
  ] = await Promise.all([
    getReport(ENDPOINTS.reports.rootSummary, config),
    getReport(ENDPOINTS.reports.all, config),
    getReport(ENDPOINTS.reports.patientScans, config),
    getReport(ENDPOINTS.reports.modelPerformance, config),
    getReport(ENDPOINTS.reports.auditTrail, config),
    getReport(ENDPOINTS.reports.adminUsage, config),
    getReport(ENDPOINTS.reports.diagnosesOverTime, config),
    getReport(ENDPOINTS.reports.resultDistribution, config),
    getReport(ENDPOINTS.reports.classDistribution, config),
    getReport(ENDPOINTS.reports.modelUsage, config),
    getReport(ENDPOINTS.reports.confidenceByModel, config),
    getReport(ENDPOINTS.reports.processingTimeTrend, config),
    getReport(ENDPOINTS.reports.confidenceDistribution, config),
    getReport(ENDPOINTS.reports.exportActivity, config),
    isAdmin
      ? getReport(ENDPOINTS.reports.whatsappScans, config)
      : Promise.resolve([]),
  ]);

  return {
    summary,
    scans,
    patientScans,
    modelPerformance,
    auditTrail,
    adminUsage,
    whatsappScans,
    charts: {
      diagnosesOverTime,
      resultDistribution,
      classDistribution,
      modelUsage,
      confidenceByModel,
      processingTimeTrend,
      confidenceDistribution,
      exportActivity,
    },
  };
}
