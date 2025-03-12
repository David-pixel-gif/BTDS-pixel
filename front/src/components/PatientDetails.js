import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal } from 'react-bootstrap';
import { BsArrowsFullscreen, BsXCircle } from 'react-icons/bs';

const Diagnosis = () => {
  const [userRole, setUserRole] = useState('');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [detectedObjects, setDetectedObjects] = useState(null);
  const [annotatedImage, setAnnotatedImage] = useState(null); // For the annotated image
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    setUserRole(role);
  }, []);

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);

    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please upload an MRI image.');
      return;
    }

    setIsProcessing(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/diagnoses', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (response.ok) {
        setDetectedObjects(data.detectedObjects);
        if (data.image) {
          setAnnotatedImage(`data:image/png;base64,${data.image}`);
        }
      } else {
        alert(data.error || 'Failed to process the image.');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error processing the image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleResultsModal = () => {
    setShowResultsModal(!showResultsModal);
  };

  if (userRole && userRole !== 'Doctor') {
    return (
      <div className="container-fluid d-flex flex-column align-items-center justify-content-center vh-100">
        <h2 className="text-danger fw-bold mb-3">Access Denied</h2>
        <p className="text-danger">
          You are not authorized to access this page. Please contact a qualified doctor for diagnosis.
        </p>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      <div className="row g-4">
        <h2 className="text-center fw-bold mb-4">Brain Tumor Detection Using YOLOv10</h2>

        {/* Upload Card */}
        <div className="col-md-4">
          <div className="card shadow-lg h-100 border-0">
            <div className="card-body d-flex flex-column align-items-center">
              <h5 className="card-title">Upload an MRI Image</h5>
              <input type="file" className="form-control mb-3" onChange={handleFileUpload} />
              {filePreview && <img src={filePreview} alt="Uploaded preview" className="img-fluid rounded shadow" />}
            </div>
          </div>
        </div>

        {/* Results Card */}
        <div className="col-md-4 position-relative">
          <div className="card shadow-lg h-100 border-0">
            <div className="card-body">
              <h5 className="card-title d-flex justify-content-between align-items-center">
                Detection Results
                <button className="btn btn-sm btn-outline-secondary" onClick={toggleResultsModal} title="Expand">
                  <BsArrowsFullscreen />
                </button>
              </h5>
              {annotatedImage ? (
                <img src={annotatedImage} alt="Annotated result" className="img-fluid rounded shadow mb-3" />
              ) : (
                <p className="text-muted">No objects detected</p>
              )}
              {detectedObjects &&
                detectedObjects.map((obj, idx) => (
                  <p key={idx} className="text-muted">
                    <strong className="text-danger">{obj.label}</strong> - Confidence: {(obj.confidence * 100).toFixed(2)}%
                  </p>
                ))}
            </div>
          </div>
        </div>

        {/* Explainable AI Card */}
        <div className="col-md-4">
          <div className="card shadow-lg h-100 border-0">
            <div className="card-body">
              <h5 className="card-title">Explainable AI Insights</h5>
              {annotatedImage ? (
                <>
                  <p className="text-muted">
                    The heatmap overlay on the annotated image below highlights the areas the model focused on while detecting a tumor.
                    This helps in understanding the AI's reasoning and provides an interpretability layer to the detection process.
                  </p>
                  <img src={annotatedImage} alt="Explainable AI heatmap" className="img-fluid rounded shadow" />
                </>
              ) : (
                <p className="text-muted">
                  This section provides insights into the model's decisions, explaining the areas of the MRI that were analyzed
                  to detect brain tumors. This helps in understanding the AI's reasoning process.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="d-flex justify-content-center my-4">
        <button
          className="btn btn-primary btn-lg"
          onClick={handleSubmit}
          disabled={isProcessing}
          style={{ width: '100%', maxWidth: '200px' }}
        >
          {isProcessing ? 'Processing...' : 'Submit'}
        </button>
      </div>

      {/* Results Modal */}
      <Modal show={showResultsModal} onHide={toggleResultsModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Detection Results - Enlarged View</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {annotatedImage ? (
            <img src={annotatedImage} alt="Annotated result" className="img-fluid rounded shadow mb-3" />
          ) : (
            <p className="text-muted">No objects detected</p>
          )}
          {detectedObjects &&
            detectedObjects.map((obj, idx) => (
              <p key={idx} className="text-muted">
                <strong className="text-danger">{obj.label}</strong> - Confidence: {(obj.confidence * 100).toFixed(2)}%
              </p>
            ))}
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" onClick={toggleResultsModal}>
            <BsXCircle /> Close
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Diagnosis;
