import React from 'react';
import { BsClipboard2Pulse, BsExclamationTriangle, BsShieldExclamation } from 'react-icons/bs';

const AIClinicalExplanation = ({ explanation, recommendation, disclaimer }) => (
  <section className="diag-clinical-card" aria-label="AI clinical interpretation">
    <div className="diag-card-heading">
      <h3>AI Clinical Interpretation</h3>
    </div>

    <div className="diag-clinical-section">
      <div className="diag-clinical-icon" aria-hidden="true">
        <BsClipboard2Pulse size={18} />
      </div>
      <div>
        <div className="diag-clinical-title">AI Explanation</div>
        <p className="diag-clinical-text">{explanation}</p>
      </div>
    </div>

    <div className="diag-clinical-section">
      <div className="diag-clinical-icon" aria-hidden="true">
        <BsExclamationTriangle size={18} />
      </div>
      <div>
        <div className="diag-clinical-title">Recommendation</div>
        <p className="diag-clinical-text">{recommendation}</p>
      </div>
    </div>

    <div className="diag-clinical-section">
      <div className="diag-clinical-icon" aria-hidden="true">
        <BsShieldExclamation size={18} />
      </div>
      <div>
        <div className="diag-clinical-title">Medical Disclaimer</div>
        <p className="diag-clinical-text">{disclaimer}</p>
      </div>
    </div>
  </section>
);

export default AIClinicalExplanation;
