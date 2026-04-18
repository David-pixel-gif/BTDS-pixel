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

  const labelStyle = useMemo(() => {
    if (!hasBox || !imageSize.width || !imageSize.height) {
      return null;
    }

    const [x1, y1, x2, y2] = bbox;
    const labelWidth = 220;
    const labelHeight = 58;
    const horizontalPadding = 14;
    const verticalOffset = 14;
    const canPlaceRight = x2 + labelWidth + horizontalPadding <= imageSize.width;
    const canPlaceLeft = x1 - labelWidth - horizontalPadding >= horizontalPadding;
    const preferredLeft = canPlaceRight
      ? x2 + horizontalPadding
      : canPlaceLeft
        ? x1 - labelWidth - horizontalPadding
        : Math.min(
            Math.max(horizontalPadding, x1),
            Math.max(horizontalPadding, imageSize.width - labelWidth - horizontalPadding),
          );
    const preferredTop =
      y1 > labelHeight + verticalOffset
        ? y1 - labelHeight - verticalOffset
        : Math.min(
            imageSize.height - labelHeight - verticalOffset,
            y2 + verticalOffset,
          );

    return {
      left: `${(preferredLeft / imageSize.width) * 100}%`,
      top: `${(preferredTop / imageSize.height) * 100}%`,
    };
  }, [bbox, hasBox, imageSize.height, imageSize.width]);

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
              style={labelStyle || { left: overlayStyle.left, top: `calc(${overlayStyle.top} - 52px)` }}
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

const exportAnnotatedImage = ({ imageSrc, bbox, tumorType, confidenceText }) =>
  new Promise((resolve, reject) => {
    if (!imageSrc) {
      reject(new Error('No image source available.'));
      return;
    }

    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d');

      if (!context) {
        reject(new Error('Canvas context is unavailable.'));
        return;
      }

      context.drawImage(image, 0, 0);

      if (Array.isArray(bbox) && bbox.length === 4) {
        const [x1, y1, x2, y2] = bbox;
        const width = Math.max(0, x2 - x1);
        const height = Math.max(0, y2 - y1);
        const label = `Tumor Region | ${tumorType || 'Detected Region'} | Confidence: ${confidenceText}`;

        context.strokeStyle = '#ff6d63';
        context.lineWidth = Math.max(4, Math.round(canvas.width * 0.005));
        context.shadowColor = 'rgba(255,91,91,0.45)';
        context.shadowBlur = 24;
        context.strokeRect(x1, y1, width, height);
        context.shadowBlur = 0;

        context.font = `${Math.max(18, Math.round(canvas.width * 0.018))}px "DM Sans", sans-serif`;
        const textWidth = context.measureText(label).width;
        const labelHeight = Math.max(36, Math.round(canvas.height * 0.05));
        const labelY = Math.max(12, y1 - labelHeight - 10);

        context.fillStyle = 'rgba(10,23,30,0.86)';
        context.fillRect(x1, labelY, textWidth + 28, labelHeight);
        context.strokeStyle = 'rgba(255,255,255,0.16)';
        context.lineWidth = 1;
        context.strokeRect(x1, labelY, textWidth + 28, labelHeight);
        context.fillStyle = '#eff9ff';
        context.fillText(label, x1 + 14, labelY + (labelHeight / 2) + 6);
      }

      resolve(canvas.toDataURL('image/png'));
    };
    image.onerror = () => reject(new Error('Unable to render image export.'));
    image.src = imageSrc;
  });

const exportCompareImage = async ({ processedImageSrc, originalImageSrc, bbox, tumorType, confidenceText }) => {
  const annotatedResult = await exportAnnotatedImage({
    imageSrc: processedImageSrc || originalImageSrc,
    bbox,
    tumorType,
    confidenceText,
  });

  return new Promise((resolve, reject) => {
    if (!originalImageSrc) {
      reject(new Error('No original image source available.'));
      return;
    }

    const annotatedImage = new Image();
    const originalImage = new Image();
    let loaded = 0;

    const finishIfReady = () => {
      loaded += 1;
      if (loaded < 2) {
        return;
      }

      const gap = 24;
      const labelHeight = 44;
      const panelWidth = Math.max(annotatedImage.naturalWidth, originalImage.naturalWidth);
      const panelHeight = Math.max(annotatedImage.naturalHeight, originalImage.naturalHeight);
      const canvas = document.createElement('canvas');
      canvas.width = (panelWidth * 2) + gap;
      canvas.height = panelHeight + labelHeight;
      const context = canvas.getContext('2d');

      if (!context) {
        reject(new Error('Canvas context is unavailable.'));
        return;
      }

      context.fillStyle = '#09131a';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.font = '700 22px "DM Sans", sans-serif';
      context.fillStyle = '#dbe8ef';
      context.fillText('Annotated Result', 18, 30);
      context.fillText('Original Upload', panelWidth + gap + 18, 30);
      context.drawImage(annotatedImage, 0, labelHeight, panelWidth, panelHeight);
      context.drawImage(originalImage, panelWidth + gap, labelHeight, panelWidth, panelHeight);
      resolve(canvas.toDataURL('image/png'));
    };

    annotatedImage.onload = finishIfReady;
    originalImage.onload = finishIfReady;
    annotatedImage.onerror = () => reject(new Error('Unable to render annotated compare image.'));
    originalImage.onerror = () => reject(new Error('Unable to render original compare image.'));
    annotatedImage.src = annotatedResult;
    originalImage.src = originalImageSrc;
  });
};

const TumorDetectionViewer = ({
  originalImageSrc,
  processedImageSrc,
  bbox,
  confidenceText,
  tumorType,
  embedded = false,
}) => {
  const [compareMode, setCompareMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const fullscreenRef = useRef(null);

  const primaryImage = processedImageSrc || originalImageSrc;
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

  const downloadImage = async () => {
    try {
      const exportUrl = compareMode && originalImageSrc && (processedImageSrc || originalImageSrc)
        ? await exportCompareImage({
            processedImageSrc: processedImageSrc || originalImageSrc,
            originalImageSrc,
            bbox: scaledBbox,
            tumorType,
            confidenceText,
          })
        : await exportAnnotatedImage({
            imageSrc: primaryImage,
            bbox: scaledBbox,
            tumorType,
            confidenceText,
          });
      const link = document.createElement('a');
      link.href = exportUrl;
      link.download = compareMode ? 'mri-compare-view.png' : 'annotated-mri.png';
      link.click();
    } catch (error) {
      console.error('Unable to download annotated MRI image:', error);
    }
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

  const content = (
    <>
      {!embedded ? (
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
      ) : null}

      {primaryImage ? (
        <>
          {compareMode && originalImageSrc && processedImageSrc ? (
            <div className="diag-compare-grid">
              <div className="diag-compare-panel">
                <span className="diag-compare-label">Annotated Result</span>
                <img src={processedImageSrc} alt="Detected MRI scan" />
              </div>
              <div className="diag-compare-panel">
                <span className="diag-compare-label">Original Upload</span>
                <img src={originalImageSrc} alt="Original MRI scan" />
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
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <section className="diag-viewer-card" aria-label="AI tumor localisation">
      {content}
    </section>
  );
};

export default TumorDetectionViewer;
