import React from 'react';
import { BsActivity, BsClockHistory } from 'react-icons/bs';

const iconByTone = {
  danger: BsActivity,
  success: BsActivity,
  warning: BsClockHistory,
};

const DiagnosisSummaryCard = ({
  title,
  diagnosisText,
  confidenceText,
  processingTimeText,
  tone = 'warning',
  statusLabel,
}) => {
  const Icon = iconByTone[tone] || BsClockHistory;

  return (
    <section className={`diag-summary-card tone-${tone}`} aria-label="AI diagnosis summary">
      <div className="diag-summary-head">
        <div className="diag-summary-title-wrap diag-summary-inline">
          <span className="diag-summary-kicker">{title}</span>
          <h2 className="diag-summary-title">{diagnosisText}</h2>
          {statusLabel ? <p className="diag-summary-subtitle">{statusLabel}</p> : null}
        </div>
        <div className="diag-summary-metrics diag-summary-metrics-inline">
          <div className="diag-summary-metric">
            <Icon size={14} />
            <span>Confidence: {confidenceText}</span>
          </div>
          <div className="diag-summary-metric">
          <BsClockHistory size={14} />
          <span>Processing Time: {processingTimeText}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DiagnosisSummaryCard;
