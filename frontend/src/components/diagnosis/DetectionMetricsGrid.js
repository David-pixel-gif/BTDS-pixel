import React from 'react';
import { BsActivity, BsClock, BsCpu, BsLayers } from 'react-icons/bs';

const metricConfig = [
  { key: 'confidence', label: 'Confidence Score', icon: BsActivity },
  { key: 'processing', label: 'Processing Time', icon: BsClock },
  { key: 'model', label: 'Model Version', icon: BsCpu },
  { key: 'tumorType', label: 'Tumor Type', icon: BsLayers },
];

const DetectionMetricsGrid = ({ confidence, processingTime, modelName, tumorType }) => {
  const values = {
    confidence,
    processing: processingTime,
    model: modelName,
    tumorType,
  };

  return (
    <section className="diag-metrics-grid" aria-label="Diagnostic metrics">
      {metricConfig.map(({ key, label, icon: Icon }) => (
        <article key={key} className="diag-metric-card">
          <div className="diag-metric-icon" aria-hidden="true">
            <Icon size={16} />
          </div>
          <div className="diag-metric-label">{label}</div>
          <div className="diag-metric-value">{values[key] || 'N/A'}</div>
        </article>
      ))}
    </section>
  );
};

export default DetectionMetricsGrid;
