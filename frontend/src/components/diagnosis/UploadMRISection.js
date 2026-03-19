import React from 'react';
import { BsCloudArrowUp, BsFileEarmarkImage, BsPlayCircle, BsCheck2Circle } from 'react-icons/bs';

const steps = [
  { label: 'Step 1', text: 'Upload MRI Scan', icon: BsCloudArrowUp },
  { label: 'Step 2', text: 'Run AI Diagnosis', icon: BsPlayCircle },
  { label: 'Step 3', text: 'Review Results', icon: BsCheck2Circle },
];

const UploadMRISection = ({
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileUpload,
  file,
  filePreview,
  selectedModel,
  onModelChange,
  onRunAnalysis,
  isProcessing,
}) => {
  return (
    <section className="diag-upload-card" aria-label="Upload MRI section">
      <div className="diag-card-heading">
        <h3>Upload MRI Scan</h3>
        <p>Prepare the study, select the AI model, and start the clinical review workflow.</p>
      </div>

      <div className="diag-step-strip">
        {steps.map(({ label, text, icon: Icon }) => (
          <div key={label} className="diag-step-pill">
            <Icon size={15} />
            <div>
              <div className="diag-step-label">{label}</div>
              <div className="diag-step-text">{text}</div>
            </div>
          </div>
        ))}
      </div>

      <div
        className={`diag-upload-zone${dragOver ? ' drag-over' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <input type="file" accept="image/*" onChange={onFileUpload} aria-label="Upload MRI file" />
        <div className="diag-upload-icon" aria-hidden="true">
          <BsCloudArrowUp size={26} />
        </div>
        <div className="diag-upload-title">Drop MRI scan here or click to browse</div>
        <div className="diag-upload-subtitle">Supports DICOM, PNG, JPG, and TIFF image formats</div>
      </div>

      <div className="diag-selector-row">
        <label className="diag-selector-label" htmlFor="diagnosis-model-selector">
          AI Model
        </label>
        <select
          id="diagnosis-model-selector"
          value={selectedModel}
          onChange={(event) => onModelChange(event.target.value)}
          className="diag-selector-input"
        >
          <option value="fast">Fast Model</option>
          <option value="deep">Deep Learning Tumor Detection Model</option>
        </select>
      </div>

      {file ? (
        <div className="diag-file-chip">
          <BsFileEarmarkImage size={16} />
          <span className="diag-file-name">{file.name}</span>
          <span className="diag-file-size">{(file.size / 1024).toFixed(1)} KB</span>
        </div>
      ) : null}

      {filePreview ? (
        <div className="diag-upload-preview">
          <img src={filePreview} alt="Uploaded MRI preview" />
          <span className="diag-upload-preview-label">MRI Preview</span>
        </div>
      ) : null}

      <button
        type="button"
        className="diag-run-button"
        onClick={onRunAnalysis}
        disabled={isProcessing || !file}
      >
        {isProcessing ? 'Analyzing MRI Scan...' : 'Run AI Diagnosis'}
      </button>
    </section>
  );
};

export default UploadMRISection;
