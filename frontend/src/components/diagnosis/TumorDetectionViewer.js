import React, { useMemo, useRef, useState } from 'react';
import { Modal } from 'react-bootstrap';
import {
  BsArrowsAngleExpand,
  BsArrowClockwise,
  BsBoundingBox,
  BsDownload,
  BsFiles,
  BsFullscreen,
  BsSearch,
  BsXLg,
} from 'react-icons/bs';

const ViewerCanvas = ({
  imageSrc,
  alt,
  bbox,
  imageSize,
  confidenceLabel,
  tumorLabel,
  onImageLoad,
  zoom,
  pan,
  onWheel,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
}) => {
  const hasBox = Array.isArray(bbox) && bbox.length === 4;
  const overlayStyle = useMemo(() => {
    if (!hasBox || !imageSrc || !imageSize.width || !imageSize.height) {
      return null;
    }
    return {
      left: `${(bbox[0] / imageSize.width) * 100}%`,
      top: `${(bbox[1] / imageSize.height) * 100}%`,
      width: `${((bbox[2] - bbox[0]) / imageSize.width) * 100}%`,
      height: `${((bbox[3] - bbox[1]) / imageSize.height) * 100}%`,
    };
  }, [bbox, hasBox, imageSrc, imageSize.height, imageSize.width]);

  return (
    <div
      className="diag-viewer-stage"
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      <div
        className="diag-viewer-transform"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
      >
        <img src={imageSrc} alt={alt} className="diag-viewer-image" onLoad={onImageLoad} />
        {overlayStyle ? (
          <>
            <div className="diag-viewer-box" style={overlayStyle} />
            <div
              className="diag-viewer-label"
              style={{ left: overlayStyle.left, top: `calc(${overlayStyle.top} - 52px)` }}
            >
              <strong>Tumor Region</strong>
              <span>{tumorLabel}</span>
              <span>Confidence: {confidenceLabel}</span>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

const TumorDetectionViewer = ({
  originalImageSrc,
  processedImageSrc,
  bbox,
  confidenceText,
  tumorType,
}) => {
  const [compareMode, setCompareMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const fullscreenRef = useRef(null);

  const primaryImage = originalImageSrc || processedImageSrc;
  const scaledBbox = useMemo(() => {
    if (!bbox) {
      return null;
    }
    return bbox;
  }, [bbox]);

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const downloadImage = () => {
    const target = processedImageSrc || primaryImage;
    if (!target) {
      return;
    }
    const link = document.createElement('a');
    link.href = target;
    link.download = 'annotated-mri.png';
    link.click();
  };

  const handleWheel = (event) => {
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.12 : -0.12;
    setZoom((current) => Math.min(3.5, Math.max(1, Number((current + delta).toFixed(2)))));
  };

  const handleMouseDown = (event) => {
    setDragging(true);
    setStartPoint({ x: event.clientX - pan.x, y: event.clientY - pan.y });
  };

  const handleMouseMove = (event) => {
    if (!dragging) {
      return;
    }
    setPan({ x: event.clientX - startPoint.x, y: event.clientY - startPoint.y });
  };

  const stopDragging = () => setDragging(false);

  const requestFullscreen = async () => {
    if (!fullscreenRef.current?.requestFullscreen) {
      return;
    }
    await fullscreenRef.current.requestFullscreen();
  };

  return (
    <section className="diag-viewer-card" aria-label="AI tumor localisation">
      <div className="diag-card-heading diag-card-heading-with-actions">
        <div>
          <h3>AI Tumor Localisation</h3>
          <p>Visual review of the detected tumor region with interactive image controls.</p>
        </div>
        <div className="diag-viewer-mini-badge">
          <BsBoundingBox size={14} />
          <span>Detected Region</span>
        </div>
      </div>

      {primaryImage ? (
        <>
          {compareMode && originalImageSrc && processedImageSrc ? (
            <div className="diag-compare-grid">
              <div className="diag-compare-panel">
                <span className="diag-compare-label">Original MRI</span>
                <img src={originalImageSrc} alt="Original MRI scan" />
              </div>
              <div className="diag-compare-panel">
                <span className="diag-compare-label">Detected MRI</span>
                <img src={processedImageSrc} alt="Detected MRI scan" />
              </div>
            </div>
          ) : (
            <div className="diag-viewer-shell" ref={fullscreenRef}>
              <div className="diag-viewer-badge">{confidenceText}</div>
              <ViewerCanvas
                imageSrc={primaryImage}
                alt="Detected MRI scan with tumor localisation"
                bbox={scaledBbox}
                imageSize={imageSize}
                confidenceLabel={confidenceText}
                tumorLabel={tumorType || 'Detected Region'}
                onImageLoad={(event) =>
                  setImageSize({
                    width: event.currentTarget.naturalWidth,
                    height: event.currentTarget.naturalHeight,
                  })
                }
                zoom={zoom}
                pan={pan}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={stopDragging}
                onMouseLeave={stopDragging}
              />
            </div>
          )}

          <div className="diag-viewer-controls">
            <button type="button" className="diag-viewer-button" onClick={() => setShowModal(true)}>
              <BsArrowsAngleExpand size={15} /> Expand
            </button>
            <button type="button" className="diag-viewer-button" onClick={() => setCompareMode((value) => !value)}>
              <BsFiles size={15} /> Compare
            </button>
            <button type="button" className="diag-viewer-button" onClick={downloadImage}>
              <BsDownload size={15} /> Download
            </button>
            <button type="button" className="diag-viewer-button" onClick={resetView}>
              <BsArrowClockwise size={15} /> Reset Zoom
            </button>
            <button type="button" className="diag-viewer-button" onClick={requestFullscreen}>
              <BsFullscreen size={15} /> Fullscreen
            </button>
          </div>
        </>
      ) : (
        <div className="diag-empty-state">No MRI visualisation is available yet.</div>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="xl" dialogClassName="diag-modal">
        <Modal.Header closeButton>
          <Modal.Title>Expanded Tumor Localisation Viewer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {primaryImage ? (
            <ViewerCanvas
              imageSrc={primaryImage}
              alt="Expanded detected MRI scan"
              bbox={scaledBbox}
              imageSize={imageSize}
              confidenceLabel={confidenceText}
              tumorLabel={tumorType || 'Detected Region'}
              onImageLoad={() => {}}
              zoom={zoom}
              pan={pan}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={stopDragging}
              onMouseLeave={stopDragging}
            />
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="diag-viewer-button" onClick={resetView}>
            <BsSearch size={15} /> Reset
          </button>
          <button type="button" className="diag-viewer-button" onClick={() => setShowModal(false)}>
            <BsXLg size={15} /> Close
          </button>
        </Modal.Footer>
      </Modal>
    </section>
  );
};

export default TumorDetectionViewer;
