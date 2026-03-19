import React from 'react';
import { BsInfoCircle } from 'react-icons/bs';

const EmptyDiagnosisState = ({ title, message, subtle }) => (
  <section className={`diag-empty-card${subtle ? ' subtle' : ''}`} aria-label={title}>
    <div className="diag-empty-icon" aria-hidden="true">
      <BsInfoCircle size={18} />
    </div>
    <div>
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  </section>
);

export default EmptyDiagnosisState;
