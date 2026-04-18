import axios from "axios";
import { ENDPOINTS, apiUrl, getAuthConfig, getStoredAuthUser } from "../api";

const withParams = (params = {}) => ({
  ...getAuthConfig(),
  params: Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "" && value !== null && value !== undefined)
  ),
});

const emptySummary = {
  total_scans: 0,
  tumors_detected: 0,
  no_tumor: 0,
  detection_rate: 0,
  average_confidence: 0,
  average_processing_time: 0,
  model_usage: {},
};

const emptyAdminUsage = {
  active_users: [],
  total_audit_events: 0,
  total_exports: 0,
};

const safeGet = async (path, config, fallback) => {
  try {
    const response = await axios.get(apiUrl(path), config);
    return response.data;
  } catch (error) {
    console.warn(`Report endpoint failed: ${path}`, error);
    return fallback;
  }
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
    safeGet(ENDPOINTS.reports.rootSummary, config, emptySummary),
    safeGet(ENDPOINTS.reports.all, config, []),
    safeGet(ENDPOINTS.reports.patientScans, config, []),
    safeGet(ENDPOINTS.reports.modelPerformance, config, { summary: emptySummary, models: [], recent_scans: [] }),
    safeGet(ENDPOINTS.reports.auditTrail, config, []),
    safeGet(ENDPOINTS.reports.adminUsage, config, emptyAdminUsage),
    safeGet(ENDPOINTS.reports.researchDemo, config, {
      dataset_size: 0,
      models_used: [],
      average_confidence: 0,
      average_processing_time: 0,
      tumor_type_distribution: {},
      export_events: 0,
    }),
    safeGet(ENDPOINTS.reports.diagnosesOverTime, config, []),
    safeGet(ENDPOINTS.reports.resultDistribution, config, {}),
    safeGet(ENDPOINTS.reports.classDistribution, config, {}),
    safeGet(ENDPOINTS.reports.modelUsage, config, {}),
    safeGet(ENDPOINTS.reports.confidenceByModel, config, {}),
    safeGet(ENDPOINTS.reports.processingTimeTrend, config, []),
    safeGet(ENDPOINTS.reports.confidenceDistribution, config, {}),
    safeGet(ENDPOINTS.reports.exportActivity, config, []),
    isAdmin
      ? safeGet(ENDPOINTS.reports.whatsappScans, config, [])
      : Promise.resolve([]),
  ]);

  return {
    summary,
    scans,
    patientScans,
    modelPerformance,
    auditTrail,
    adminUsage,
    researchDemo,
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
