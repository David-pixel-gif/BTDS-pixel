import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BsInfoCircle } from 'react-icons/bs';
import { apiUrl, getAuthHeader } from '../api';
import DiagnosisSummaryCard from '../components/diagnosis/DiagnosisSummaryCard';
import TumorDetectionViewer from '../components/diagnosis/TumorDetectionViewer';
import DetectionMetricsGrid from '../components/diagnosis/DetectionMetricsGrid';
import AIClinicalExplanation from '../components/diagnosis/AIClinicalExplanation';
import AnalysisFactorsChart from '../components/diagnosis/AnalysisFactorsChart';
import UploadMRISection from '../components/diagnosis/UploadMRISection';
import EmptyDiagnosisState from '../components/diagnosis/EmptyDiagnosisState';

const MODEL_LABELS = {
  fast: 'Fast Model',
  deep: 'Deep Learning Tumor Detection Model',
};

const normalizeDiagnosisResponse = (result, selectedModel) => {
  if (!result) {
    return {
      tumorDetected: false,
      diagnosisText: 'Awaiting Analysis',
      confidenceText: 'N/A',
      processingTimeText: 'N/A',
      recommendationText: 'Upload an MRI scan and run the analysis to generate results.',
      modelName: MODEL_LABELS[selectedModel] || MODEL_LABELS.fast,
      tumorType: 'Pending',
      bbox: null,
      originalUrl: null,
      processedUrl: null,
      message: null,
      statusLabel: 'Standby',
      interpretation: null,
      recommendation: null,
      disclaimer: null,
      notes: null,
      analysisFactors: null,
    };
  }

  const prediction = result.prediction || {};
  const primaryDetection = Array.isArray(result.detections) && result.detections.length > 0
    ? result.detections[0]
    : null;
  const rawConfidence =
    typeof result.confidence === 'number'
      ? result.confidence
      : typeof prediction.confidence === 'number'
        ? prediction.confidence * (prediction.confidence <= 1 ? 100 : 1)
        : typeof primaryDetection?.tumor_type_confidence === 'number'
          ? primaryDetection.tumor_type_confidence
          : 0;
  const tumorDetected =
    typeof result.tumor_detected === 'boolean'
      ? result.tumor_detected
      : typeof prediction.detected === 'boolean'
        ? prediction.detected
        : result.diagnosis === 'Tumor Detected';
  const modelName =
    result.model_used ||
    result.model_name ||
    MODEL_LABELS[result.model_type] ||
    MODEL_LABELS[selectedModel] ||
    MODEL_LABELS.fast;

  return {
    tumorDetected,
    diagnosisText: tumorDetected ? 'Tumor Detected' : 'No Tumor Detected',
    confidenceText: `${Number(rawConfidence || 0).toFixed(0)}%`,
    processingTimeText:
      typeof result.processing_time === 'number'
        ? `${result.processing_time.toFixed(2)}s`
        : result.processing_time || 'N/A',
    recommendationText: result.recommendation || result.recommendations || null,
    modelName,
    tumorType:
      result.tumor_type ||
      prediction.class_name ||
      primaryDetection?.tumor_type ||
      (tumorDetected ? 'Detected Region' : 'No Tumor'),
    bbox: prediction.bbox || primaryDetection?.bbox || null,
    originalUrl: result.images?.original_url || null,
    processedUrl: result.images?.processed_url || (result.image ? `data:image/png;base64,${result.image}` : null),
    message: result.message || null,
    statusLabel: result.success === false ? 'Review Required' : 'AI Detection Result',
    interpretation: result.interpretation || null,
    recommendation: result.recommendation || result.recommendations || null,
    disclaimer: result.disclaimer || null,
    notes: result.notes || null,
    analysisFactors: Array.isArray(result.analysis_factors)
      ? result.analysis_factors
      : Array.isArray(result.factors)
        ? result.factors
        : null,
  };
};

const getTone = (normalized) => {
  if (normalized.diagnosisText === 'Awaiting Analysis') {
    return 'warning';
  }
  const confidenceValue = Number.parseInt(normalized.confidenceText, 10) || 0;
  if (confidenceValue > 0 && confidenceValue < 60) {
    return 'warning';
  }
  return normalized.tumorDetected ? 'danger' : 'success';
};

const resolveImageUrl = (path) => {
  if (!path) {
    return null;
  }
  if (/^https?:\/\//i.test(path) || path.startsWith('data:')) {
    return path;
  }
  return apiUrl(path);
};

const Diagnosis = () => {
  const [userRole, setUserRole] = useState('');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [selectedModel, setSelectedModel] = useState('fast');
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const [diagnosisError, setDiagnosisError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showModelInfo, setShowModelInfo] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    setUserRole(role);
  }, []);

  const handleFileSelection = (selectedFile) => {
    setFile(selectedFile);
    setDiagnosisError('');
    if (!selectedFile) {
      setFilePreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setFilePreview(reader.result);
    reader.readAsDataURL(selectedFile);
  };

  const handleFileUpload = (event) => {
    handleFileSelection(event.target.files[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    handleFileSelection(event.dataTransfer.files[0]);
  };

  const handleRunAnalysis = async () => {
    if (!file) {
      alert('Please upload an MRI image.');
      return;
    }

    setIsProcessing(true);
    setDiagnosisError('');
    setDiagnosisResult(null);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model_type', selectedModel);

    try {
      const response = await fetch(apiUrl('/diagnose'), {
        method: 'POST',
        headers: getAuthHeader(),
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setDiagnosisResult(data);
        setDiagnosisError('');
      } else if (response.status === 401) {
        alert('Session expired. Please log in again.');
        navigate('/login');
      } else {
        setDiagnosisError(data.error || 'Diagnosis could not be completed. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setDiagnosisError('Diagnosis could not be completed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const normalizedResult = normalizeDiagnosisResponse(diagnosisResult, selectedModel);
  const originalImageSrc = filePreview || resolveImageUrl(normalizedResult.originalUrl);
  const processedImageSrc = resolveImageUrl(normalizedResult.processedUrl);
  const tone = getTone(normalizedResult);
  const hasSelectedImage = Boolean(file);
  const isDiagnosing = isProcessing;
  const hasSuccessfulDiagnosis = Boolean(diagnosisResult) && !diagnosisError;
  const isIdle = !hasSelectedImage && !isDiagnosing && !hasSuccessfulDiagnosis && !diagnosisError;
  const isImageSelected = hasSelectedImage && !isDiagnosing && !hasSuccessfulDiagnosis && !diagnosisError;
  const isErrorState = Boolean(diagnosisError);
  const viewerOriginalImageSrc = hasSuccessfulDiagnosis ? originalImageSrc : null;
  const viewerProcessedImageSrc = hasSuccessfulDiagnosis ? processedImageSrc : null;
  const analysisFactors = Array.isArray(normalizedResult.analysisFactors)
    ? normalizedResult.analysisFactors.map((factor, index) => ({
        label: factor.label || factor.name || `Factor ${index + 1}`,
        pct: typeof factor.pct === 'number' ? factor.pct : Number(factor.value || 0),
        color: factor.color || ['#e16d5a', '#ea8e55', '#d7a347', '#4ba490'][index % 4],
      }))
    : [];
  const interpretationText =
    normalizedResult.interpretation ||
    normalizedResult.notes ||
    (hasSuccessfulDiagnosis
      ? 'AI diagnosis completed. Detailed clinical interpretation is not available for this model output.'
      : null);
  const recommendationText =
    normalizedResult.recommendation ||
    (hasSuccessfulDiagnosis ? 'No model-backed recommendation was returned for this diagnosis output.' : null);
  const genericDisclaimer =
    'This tool provides AI-assisted analysis for educational and clinical support purposes and does not replace professional medical diagnosis.';

  if (userRole && !['Doctor', 'Radiologist', 'Admin'].includes(userRole)) {
    return (
      <div className="diag-access-shell">
        <div className="diag-access-card">
          <h2>Access Denied</h2>
          <p>You are not authorised to access this clinical dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        body { background: #eef3f7; }
        .diag-page { min-height: 100vh; background: radial-gradient(circle at top left, rgba(38,126,164,0.14), transparent 26%), linear-gradient(180deg, #f3f7fb 0%, #edf3f8 100%); color: #183847; font-family: 'DM Sans', system-ui, sans-serif; }
        .diag-shell { width: min(1440px, calc(100% - 32px)); margin: 0 auto; padding: 28px 0 40px; }
        .diag-topbar { display: grid; grid-template-columns: 1.45fr 1fr; gap: 18px; margin-bottom: 22px; }
        .diag-topbar-card, .diag-panel, .diag-summary-card, .diag-viewer-card, .diag-upload-card, .diag-clinical-card, .diag-factors-card { background: rgba(255,255,255,0.88); border: 1px solid rgba(165,187,201,0.34); border-radius: 24px; box-shadow: 0 22px 60px rgba(17,48,65,0.08); backdrop-filter: blur(14px); }
        .diag-topbar-card { padding: 18px 22px; display: flex; align-items: center; justify-content: space-between; gap: 18px; }
        .diag-topbar-title { display: flex; flex-direction: column; gap: 8px; }
        .diag-topbar-title h1 { margin: 0; font-family: 'Playfair Display', serif; font-size: clamp(1.9rem, 3vw, 2.8rem); color: #102a3a; }
        .diag-topbar-title p, .diag-topbar-meta, .diag-card-heading p, .diag-summary-subtitle { margin: 0; color: #5b7383; }
        .diag-status-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; width: 100%; }
        .diag-status-chip { padding: 14px 16px; border-radius: 18px; background: linear-gradient(180deg, #fbfdff, #eef4f8); border: 1px solid rgba(164,187,201,0.32); }
        .diag-status-chip span, .diag-step-label, .diag-metric-label, .diag-clinical-title, .diag-factor-label, .diag-selector-label, .diag-summary-kicker { display: block; font-size: 0.74rem; letter-spacing: 0.08em; text-transform: uppercase; color: #6b8392; font-weight: 700; }
        .diag-status-chip strong, .diag-step-text { display: block; margin-top: 6px; color: #173547; font-size: 0.95rem; }
        .diag-content-grid { display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.95fr); gap: 22px; align-items: start; }
        .diag-main-column, .diag-side-column { display: flex; flex-direction: column; gap: 22px; }
        .diag-summary-card { padding: 26px 28px; color: #f5fbff; background: linear-gradient(135deg, #123141 0%, #163f52 55%, #1a5262 100%); border-color: rgba(150,188,197,0.18); box-shadow: 0 28px 60px rgba(18,49,65,0.22); }
        .diag-summary-card.tone-success { background: linear-gradient(135deg, #0f3f34 0%, #176f57 100%); }
        .diag-summary-card.tone-danger { background: linear-gradient(135deg, #4a1f26 0%, #8c3744 100%); }
        .diag-summary-card.tone-warning { background: linear-gradient(135deg, #5d4215 0%, #b67c1e 100%); }
        .diag-summary-head { display: flex; justify-content: space-between; gap: 16px; align-items: center; }
        .diag-summary-title { margin: 8px 0 0; font-size: clamp(2rem, 3vw, 2.8rem); line-height: 1.02; color: #ffffff; }
        .diag-summary-kicker, .diag-summary-subtitle, .diag-summary-metric { color: rgba(239,248,251,0.82); }
        .diag-summary-icon { width: 66px; height: 66px; border-radius: 20px; background: rgba(255,255,255,0.12); display: flex; align-items: center; justify-content: center; }
        .diag-summary-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 22px; }
        .diag-summary-metric { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; }
        .diag-card-heading { padding: 22px 24px 0; }
        .diag-card-heading h3 { margin: 0 0 6px; color: #102d3c; font-size: 1.2rem; }
        .diag-card-heading-with-actions { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
        .diag-viewer-mini-badge { display: inline-flex; gap: 8px; align-items: center; padding: 10px 12px; border-radius: 999px; background: #edf7ff; color: #1e6285; font-size: 0.82rem; font-weight: 700; }
        .diag-viewer-card, .diag-upload-card, .diag-clinical-card, .diag-factors-card { padding-bottom: 22px; }
        .diag-viewer-shell { position: relative; margin: 18px 24px 0; border-radius: 20px; overflow: hidden; background: #08131a; min-height: 420px; }
        .diag-viewer-badge { position: absolute; top: 16px; right: 16px; z-index: 3; padding: 8px 12px; border-radius: 999px; background: rgba(16,43,58,0.75); color: #f5fbff; font-weight: 700; font-size: 0.84rem; border: 1px solid rgba(255,255,255,0.14); }
        .diag-viewer-stage { position: relative; overflow: hidden; min-height: 420px; cursor: grab; }
        .diag-viewer-stage:active { cursor: grabbing; }
        .diag-viewer-transform { position: relative; transform-origin: center center; transition: transform 0.18s ease; }
        .diag-viewer-image, .diag-compare-panel img, .diag-upload-preview img { width: 100%; display: block; object-fit: contain; }
        .diag-viewer-box { position: absolute; border: 2px solid #ff6d63; box-shadow: 0 0 18px rgba(255,91,91,0.75); border-radius: 14px; }
        .diag-viewer-label { position: absolute; display: flex; flex-direction: column; gap: 2px; min-width: 170px; padding: 10px 12px; border-radius: 14px; background: rgba(10,23,30,0.86); color: #eff9ff; border: 1px solid rgba(255,255,255,0.16); font-size: 0.78rem; }
        .diag-viewer-controls { display: flex; flex-wrap: wrap; gap: 10px; margin: 18px 24px 0; }
        .diag-viewer-button, .diag-run-button, .diag-technical-button { border: none; border-radius: 14px; padding: 12px 16px; font: inherit; font-weight: 700; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease; }
        .diag-viewer-button { background: #eef4f8; color: #194152; border: 1px solid rgba(153,183,198,0.35); }
        .diag-viewer-button:hover, .diag-run-button:hover, .diag-technical-button:hover { transform: translateY(-1px); box-shadow: 0 10px 24px rgba(19,58,76,0.11); }
        .diag-compare-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; padding: 18px 24px 0; }
        .diag-compare-panel { background: #09131a; border-radius: 18px; overflow: hidden; border: 1px solid rgba(153,183,198,0.2); }
        .diag-compare-label, .diag-upload-preview-label { display: inline-block; padding: 10px 12px; color: #dbe8ef; background: rgba(9,19,26,0.88); font-size: 0.82rem; font-weight: 700; }
        .diag-metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        .diag-metric-card { padding: 18px 18px 20px; border-radius: 20px; background: linear-gradient(180deg, #fbfdff 0%, #f2f7fa 100%); border: 1px solid rgba(164,187,201,0.28); min-height: 132px; }
        .diag-metric-icon { width: 36px; height: 36px; border-radius: 12px; background: #eaf3f8; color: #245a75; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 14px; }
        .diag-metric-value { font-size: clamp(1.1rem, 2vw, 1.55rem); font-weight: 700; color: #102f40; margin-top: 8px; line-height: 1.15; }
        .diag-upload-card { padding-bottom: 24px; }
        .diag-step-strip { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 18px 24px 0; }
        .diag-step-pill { display: flex; align-items: center; gap: 10px; padding: 14px; border-radius: 18px; background: linear-gradient(180deg, #f9fbfd 0%, #edf3f7 100%); border: 1px solid rgba(164,187,201,0.28); }
        .diag-upload-zone { position: relative; margin: 18px 24px 0; border: 2px dashed rgba(80,138,163,0.34); border-radius: 22px; background: linear-gradient(180deg, #f8fbfd 0%, #eef5f8 100%); padding: 34px 18px; text-align: center; transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease; }
        .diag-upload-zone.drag-over { transform: translateY(-2px) scale(1.01); border-color: #3386aa; background: linear-gradient(180deg, #eef8fd 0%, #e2f0f7 100%); }
        .diag-upload-zone input[type="file"] { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
        .diag-upload-icon { width: 64px; height: 64px; border-radius: 18px; margin: 0 auto 14px; display: flex; align-items: center; justify-content: center; color: #1f7294; background: white; box-shadow: 0 14px 26px rgba(31,114,148,0.12); }
        .diag-upload-title { font-size: 1rem; font-weight: 700; color: #17394b; }
        .diag-upload-subtitle { margin-top: 6px; color: #64808f; }
        .diag-selector-row { padding: 18px 24px 0; }
        .diag-selector-input { width: 100%; margin-top: 8px; border-radius: 14px; border: 1px solid rgba(164,187,201,0.44); background: #ffffff; padding: 13px 14px; font: inherit; color: #143646; }
        .diag-file-chip { margin: 16px 24px 0; padding: 13px 14px; border-radius: 16px; background: #eef4f8; border: 1px solid rgba(164,187,201,0.28); display: flex; align-items: center; gap: 10px; color: #17384a; }
        .diag-file-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .diag-file-size { color: #69818d; font-size: 0.84rem; }
        .diag-upload-preview { margin: 16px 24px 0; border-radius: 20px; overflow: hidden; background: #09131a; }
        .diag-run-button { margin: 18px 24px 0; justify-content: center; background: linear-gradient(135deg, #1b6b8d 0%, #11465e 100%); color: #ffffff; }
        .diag-run-button:disabled { opacity: 0.65; cursor: not-allowed; transform: none; box-shadow: none; }
        .diag-clinical-card, .diag-factors-card { padding-bottom: 24px; }
        .diag-clinical-section { display: grid; grid-template-columns: 44px 1fr; gap: 14px; align-items: start; padding: 18px 24px 0; }
        .diag-clinical-icon { width: 44px; height: 44px; border-radius: 14px; background: #edf5f8; display: flex; align-items: center; justify-content: center; color: #225f79; }
        .diag-clinical-text { margin: 8px 0 0; color: #415e6e; line-height: 1.75; }
        .diag-factors-list { display: flex; flex-direction: column; gap: 16px; padding: 18px 24px 0; }
        .diag-factor-topline { display: flex; justify-content: space-between; gap: 12px; align-items: center; margin-bottom: 8px; }
        .diag-factor-value { color: #183847; font-weight: 700; }
        .diag-factor-track { height: 10px; border-radius: 999px; overflow: hidden; background: #e4edf2; }
        .diag-factor-fill { height: 100%; border-radius: 999px; animation: diagBarGrow 0.8s ease; }
        .diag-panel { padding: 22px 24px; }
        .diag-floating-notice {
          margin-top: 22px;
          padding: 18px 22px;
          border-radius: 20px;
          background: rgba(255,255,255,0.82);
          border: 1px solid rgba(164,187,201,0.3);
          box-shadow: 0 16px 40px rgba(17,48,65,0.06);
          color: #587282;
        }
        .diag-floating-notice strong {
          display: block;
          margin-bottom: 6px;
          color: #143647;
        }
        .diag-empty-card { display: grid; grid-template-columns: 40px 1fr; gap: 14px; padding: 20px 22px; border-radius: 20px; background: rgba(255,255,255,0.88); border: 1px dashed rgba(153,183,198,0.48); color: #496777; }
        .diag-empty-card.subtle { background: #f6fafc; }
        .diag-empty-card h3 { margin: 0 0 6px; font-size: 1rem; color: #173749; }
        .diag-empty-card p { margin: 0; line-height: 1.7; }
        .diag-empty-icon { width: 40px; height: 40px; border-radius: 14px; background: #edf4f8; color: #1f6887; display: flex; align-items: center; justify-content: center; }
        .diag-panel-head { display: flex; justify-content: space-between; gap: 16px; align-items: center; }
        .diag-panel-head h3 { margin: 0 0 6px; }
        .diag-panel-list { display: grid; gap: 12px; margin-top: 16px; }
        .diag-panel-item { padding: 14px 16px; border-radius: 16px; background: #f6fafc; border: 1px solid rgba(164,187,201,0.24); }
        .diag-panel-item strong { display: block; color: #17394a; margin-bottom: 4px; }
        .diag-panel-item span { color: #5c7686; }
        .diag-technical-button { background: #0f3c50; color: #ffffff; }
        .diag-loading-card { padding: 18px 20px; display: flex; align-items: center; gap: 14px; background: linear-gradient(135deg, #173546 0%, #24617a 100%); color: #f2fbff; border-radius: 22px; margin-bottom: 22px; }
        .diag-loading-spinner { width: 42px; height: 42px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.22); border-top-color: #ffffff; animation: diagSpin 0.8s linear infinite; }
        .diag-loading-copy strong { display: block; margin-bottom: 4px; }
        .diag-modal .modal-content { border-radius: 24px; border: 1px solid rgba(164,187,201,0.28); }
        .diag-empty-state { padding: 42px 24px 24px; color: #5d7684; }
        .diag-access-shell { min-height: 100vh; display: grid; place-items: center; background: #f0f5f8; }
        .diag-access-card { padding: 32px; border-radius: 24px; background: white; box-shadow: 0 20px 50px rgba(16,46,60,0.08); text-align: center; }
        @keyframes diagSpin { to { transform: rotate(360deg); } }
        @keyframes diagBarGrow { from { width: 0; } }
        @media (max-width: 1180px) { .diag-content-grid, .diag-topbar { grid-template-columns: 1fr; } }
        @media (max-width: 900px) { .diag-summary-metrics, .diag-status-grid, .diag-metrics-grid, .diag-step-strip, .diag-compare-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 640px) {
          .diag-shell { width: min(100% - 18px, 100%); padding-top: 18px; }
          .diag-summary-metrics, .diag-status-grid, .diag-metrics-grid, .diag-step-strip, .diag-compare-grid { grid-template-columns: 1fr; }
          .diag-topbar-card, .diag-panel, .diag-summary-card { padding: 18px; }
          .diag-card-heading, .diag-viewer-controls, .diag-upload-zone, .diag-selector-row, .diag-file-chip, .diag-upload-preview, .diag-run-button, .diag-factors-list, .diag-clinical-section { margin-left: 18px; margin-right: 18px; padding-left: 0; padding-right: 0; }
          .diag-viewer-shell, .diag-compare-grid { margin-left: 18px; margin-right: 18px; }
        }
      `}</style>

      <div className="diag-page">
        <div className="diag-shell">
          <header className="diag-topbar">
            <div className="diag-topbar-card">
              <div className="diag-topbar-title">
                <h1>Brain Tumor Detection System</h1>
                <p>Professional AI-assisted MRI dashboard for clinician-facing review workflows.</p>
              </div>
              <div className="diag-topbar-meta">
                {userRole ? `${userRole} workspace active` : 'Clinical workspace ready'}
              </div>
            </div>
            <div className="diag-topbar-card">
              <div className="diag-status-grid" aria-label="System status">
                <div className="diag-status-chip"><span>AI Model Status</span><strong>Active</strong></div>
                <div className="diag-status-chip"><span>GPU/CPU Mode</span><strong>Running</strong></div>
                <div className="diag-status-chip"><span>Last Model Update</span><strong>Current Session</strong></div>
              </div>
            </div>
          </header>

          {isProcessing ? (
            <section className="diag-loading-card" aria-live="polite">
              <div className="diag-loading-spinner" aria-hidden="true" />
              <div className="diag-loading-copy">
                <strong>Analyzing MRI scan using {MODEL_LABELS[selectedModel]}...</strong>
                <span>AI scanning and localisation are in progress. Please wait while the results are prepared.</span>
              </div>
            </section>
          ) : null}

          <main className="diag-content-grid">
            <section className="diag-main-column">
              <DiagnosisSummaryCard
                title="AI Diagnosis Result"
                diagnosisText={normalizedResult.diagnosisText}
                confidenceText={normalizedResult.confidenceText}
                modelName={normalizedResult.modelName}
                processingTimeText={normalizedResult.processingTimeText}
                tone={tone}
                statusLabel={
                  isErrorState
                    ? 'Error'
                    : isDiagnosing
                      ? 'Running'
                      : isImageSelected
                        ? 'Image Selected'
                        : isIdle
                          ? 'Awaiting Analysis'
                          : normalizedResult.statusLabel
                }
              />

              <TumorDetectionViewer
                originalImageSrc={viewerOriginalImageSrc}
                processedImageSrc={viewerProcessedImageSrc}
                bbox={hasSuccessfulDiagnosis ? normalizedResult.bbox : null}
                confidenceText={hasSuccessfulDiagnosis ? normalizedResult.confidenceText : 'N/A'}
                tumorType={hasSuccessfulDiagnosis ? normalizedResult.tumorType : 'Pending'}
              />

              <DetectionMetricsGrid
                confidence={normalizedResult.confidenceText}
                processingTime={normalizedResult.processingTimeText}
                modelName={normalizedResult.modelName}
                tumorType={normalizedResult.tumorType}
              />

              {hasSuccessfulDiagnosis ? (
                <AIClinicalExplanation
                  explanation={interpretationText}
                  recommendation={recommendationText}
                  disclaimer={normalizedResult.disclaimer || genericDisclaimer}
                />
              ) : (
                <EmptyDiagnosisState
                  title="Clinical interpretation will appear after AI inference."
                  message={
                    isDiagnosing
                      ? 'The model is processing the MRI scan. Interpretation will be shown when inference completes.'
                      : 'Upload an MRI scan and run AI diagnosis to view clinical interpretation.'
                  }
                />
              )}

              {hasSuccessfulDiagnosis && analysisFactors.length > 0 ? (
                <AnalysisFactorsChart factors={analysisFactors} />
              ) : (
                <EmptyDiagnosisState
                  title="Analysis factors"
                  message={
                    hasSuccessfulDiagnosis
                      ? 'Detailed analysis factors not available for this model.'
                      : 'Analysis factors will appear after image processing.'
                  }
                  subtle
                />
              )}
            </section>

            <aside className="diag-side-column">
              <UploadMRISection
                dragOver={dragOver}
                onDragOver={(event) => { event.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onFileUpload={handleFileUpload}
                file={file}
                filePreview={filePreview}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                onRunAnalysis={handleRunAnalysis}
                isProcessing={isProcessing}
              />

              <section className="diag-panel" aria-label="AI model information">
                <div className="diag-panel-head">
                  <div>
                    <h3>About the AI Model</h3>
                    <p>Reference information for clinicians, reviewers, and demonstration audiences.</p>
                  </div>
                  <button type="button" className="diag-technical-button" onClick={() => setShowModelInfo((value) => !value)} aria-expanded={showModelInfo}>
                    <BsInfoCircle size={15} /> View Technical Details
                  </button>
                </div>
                {showModelInfo ? (
                  <div className="diag-panel-list">
                    <div className="diag-panel-item"><strong>Model Type</strong><span>Deep Learning CNN (YOLO-based localisation)</span></div>
                    <div className="diag-panel-item"><strong>Training Dataset</strong><span>Brain MRI Tumor Dataset</span></div>
                    <div className="diag-panel-item"><strong>Purpose</strong><span>Assist radiologists in detecting abnormal tumor regions.</span></div>
                  </div>
                ) : null}
              </section>

              {isErrorState ? (
                <section className="diag-panel" aria-label="Diagnosis error">
                  <div className="diag-panel-head">
                    <div>
                      <h3>Diagnosis Error</h3>
                      <p>Diagnosis could not be completed. Please try again.</p>
                    </div>
                  </div>
                  <div className="diag-panel-list">
                    <div className="diag-panel-item">
                      <strong>Error Details</strong>
                      <span>{diagnosisError}</span>
                    </div>
                  </div>
                </section>
              ) : null}

              {hasSuccessfulDiagnosis && normalizedResult.message ? (
                <section className="diag-panel" aria-label="System message">
                  <div className="diag-panel-head">
                    <div>
                      <h3>System Message</h3>
                      <p>{normalizedResult.message}</p>
                    </div>
                  </div>
                </section>
              ) : null}
            </aside>
          </main>

          <section className="diag-floating-notice" aria-label="Medical notice">
            <strong>Medical Notice</strong>
            <span>{genericDisclaimer}</span>
          </section>
        </div>
      </div>
    </>
  );
};

export default Diagnosis;
