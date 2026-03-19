import axios from "axios";
import { ENDPOINTS, apiUrl, getAuthConfig, getStoredAuthUser } from "../api";

const withParams = (params = {}) => ({
  ...getAuthConfig(),
  params: Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "" && value !== null && value !== undefined)
  ),
});

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
    researchDemo,
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
    axios.get(apiUrl(ENDPOINTS.reports.rootSummary), config),
    axios.get(apiUrl(ENDPOINTS.reports.all), config),
    axios.get(apiUrl(ENDPOINTS.reports.patientScans), config),
    axios.get(apiUrl(ENDPOINTS.reports.modelPerformance), config),
    axios.get(apiUrl(ENDPOINTS.reports.auditTrail), config),
    axios.get(apiUrl(ENDPOINTS.reports.adminUsage), config),
    axios.get(apiUrl(ENDPOINTS.reports.researchDemo), config),
    axios.get(apiUrl(ENDPOINTS.reports.diagnosesOverTime), config),
    axios.get(apiUrl(ENDPOINTS.reports.resultDistribution), config),
    axios.get(apiUrl(ENDPOINTS.reports.classDistribution), config),
    axios.get(apiUrl(ENDPOINTS.reports.modelUsage), config),
    axios.get(apiUrl(ENDPOINTS.reports.confidenceByModel), config),
    axios.get(apiUrl(ENDPOINTS.reports.processingTimeTrend), config),
    axios.get(apiUrl(ENDPOINTS.reports.confidenceDistribution), config),
    axios.get(apiUrl(ENDPOINTS.reports.exportActivity), config),
    isAdmin
      ? axios.get(apiUrl(ENDPOINTS.reports.whatsappScans), config)
      : Promise.resolve({ data: [] }),
  ]);

  return {
    summary: summary.data,
    scans: scans.data,
    patientScans: patientScans.data,
    modelPerformance: modelPerformance.data,
    auditTrail: auditTrail.data,
    adminUsage: adminUsage.data,
    researchDemo: researchDemo.data,
    whatsappScans: whatsappScans.data,
    charts: {
      diagnosesOverTime: diagnosesOverTime.data,
      resultDistribution: resultDistribution.data,
      classDistribution: classDistribution.data,
      modelUsage: modelUsage.data,
      confidenceByModel: confidenceByModel.data,
      processingTimeTrend: processingTimeTrend.data,
      confidenceDistribution: confidenceDistribution.data,
      exportActivity: exportActivity.data,
    },
  };
}
