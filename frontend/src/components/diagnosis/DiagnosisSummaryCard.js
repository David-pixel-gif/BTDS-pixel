import React from 'react';
import { BsActivity, BsClockHistory, BsCpu, BsShieldCheck } from 'react-icons/bs';

const iconByTone = {
  danger: BsActivity,
  success: BsShieldCheck,
  warning: BsCpu,
};

const DiagnosisSummaryCard = ({
  title,
  diagnosisText,
  confidenceText,
  modelName,
  processingTimeText,
  tone = 'warning',
  statusLabel,
}) => {
  const Icon = iconByTone[tone] || BsCpu;

  return (
    <section className={`diag-summary-card tone-${tone}`} aria-label="AI diagnosis summary">
      <div className="diag-summary-head">
        <div className="diag-summary-title-wrap">
          <span className="diag-summary-kicker">{title}</span>
          <h2 className="diag-summary-title">{diagnosisText}</h2>
          {statusLabel ? <p className="diag-summary-subtitle">{statusLabel}</p> : null}
        </div>
        <div className="diag-summary-icon" aria-hidden="true">
          <Icon size={26} />
        </div>
      </div>

      <div className="diag-summary-metrics">
        <div className="diag-summary-metric">
          <BsActivity size={14} />
          <span>Confidence: {confidenceText}</span>
        </div>
        <div className="diag-summary-metric">
          <BsCpu size={14} />
          <span>Model: {modelName}</span>
        </div>
        <div className="diag-summary-metric">
          <BsClockHistory size={14} />
          <span>Processing Time: {processingTimeText}</span>
        </div>
      </div>
    </section>
  );
};

export default DiagnosisSummaryCard;
