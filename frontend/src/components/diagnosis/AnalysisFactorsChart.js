import React from 'react';

const factorExplanations = {
  'Tissue Density Variation':
    'Measures abnormal variations in brain tissue density often associated with tumor growth.',
  'Shape Irregularity':
    'Highlights non-uniform lesion boundaries that may suggest abnormal tissue expansion.',
  'Signal Intensity':
    'Reflects unusual MRI signal patterns that can indicate tumor-related changes.',
  'Symmetry Score':
    'Compares left-right brain symmetry to reveal localized anomalies or mass effect.',
};

const AnalysisFactorsChart = ({ factors }) => (
  <section className="diag-factors-card" aria-label="Analysis factors">
    <div className="diag-card-heading">
      <h3>Analysis Factors</h3>
      <p>Hover each indicator for a clinical explanation.</p>
    </div>

    <div className="diag-factors-list">
      {factors.map((factor) => (
        <div key={factor.label} className="diag-factor-row">
          <div className="diag-factor-topline">
            <span className="diag-factor-label" title={factorExplanations[factor.label]}>
              {factor.label}
            </span>
            <span className="diag-factor-value">{factor.pct}%</span>
          </div>
          <div className="diag-factor-track" title={factorExplanations[factor.label]}>
            <div
              className="diag-factor-fill"
              style={{ width: `${factor.pct}%`, background: factor.color }}
            />
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default AnalysisFactorsChart;
