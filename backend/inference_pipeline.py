from __future__ import annotations

import io
import os
from dataclasses import dataclass
from typing import Any

import numpy as np
from PIL import Image


DEFAULT_TUMOR_CLASSES = [
    "Astrocitoma",
    "Carcinoma",
    "Ependimoma",
    "Ganglioglioma",
    "Germinoma",
    "Glioblastoma",
    "Granuloma",
    "Meduloblastoma",
    "Meningioma",
    "Neurocitoma",
    "Normal",
    "Oligodendroglioma",
    "Papiloma",
    "Schwannoma",
    "Tuberculoma",
]

NO_TUMOR_LABELS = {"no tumor", "no_tumor", "normal", "negative", "no tumor detected"}


def parse_classifier_labels(raw: str | None) -> list[str]:
    if not raw:
        return DEFAULT_TUMOR_CLASSES
    labels = [item.strip() for item in raw.split(",") if item.strip()]
    return labels or DEFAULT_TUMOR_CLASSES


@dataclass
class DetectionSummary:
    diagnosis: str
    confidence: float
    tumor_type: str | None
    tumor_type_confidence: float | None
    detections: list[dict[str, Any]]


class InferencePipeline:
    def __init__(
        self,
        detector_path: str | None,
        classifier_path: str | None,
        classifier_labels: list[str],
        classifier_size: int = 224,
        detector_confidence: float = 0.25,
        detector_padding_ratio: float = 0.08,
    ) -> None:
        self.detector_path = detector_path
        self.classifier_path = classifier_path
        self.classifier_labels = classifier_labels
        self.classifier_size = classifier_size
        self.detector_confidence = detector_confidence
        self.detector_padding_ratio = detector_padding_ratio
        self._detector = None
        self._classifier = None

    def open_image(self, image_bytes: bytes) -> Image.Image:
        return Image.open(io.BytesIO(image_bytes)).convert("RGB")

    def detector_ready(self) -> bool:
        return bool(self.detector_path and os.path.exists(self.detector_path))

    def classifier_ready(self) -> bool:
        return bool(self.classifier_path and os.path.exists(self.classifier_path))

    def load_detector(self):
        if self._detector is not None:
            return self._detector
        if not self.detector_ready():
            return None
        from ultralytics import YOLO

        self._detector = YOLO(self.detector_path)
        return self._detector

    def load_classifier(self):
        if self._classifier is not None:
            return self._classifier
        if not self.classifier_ready():
            return None
        from tensorflow.keras.models import load_model

        self._classifier = load_model(self.classifier_path, compile=False)
        return self._classifier

    def _prepare_fast_input(self, image: Image.Image, size: int) -> np.ndarray:
        resized = image.convert("RGB").resize((size, size))
        array = np.asarray(resized, dtype=np.float32)
        return np.expand_dims(array, axis=0)

    def _prepare_deep_input(self, image: Image.Image) -> np.ndarray:
        resized = image.convert("RGB").resize((self.classifier_size, self.classifier_size))
        array = np.asarray(resized, dtype=np.float32)
        return np.expand_dims(array, axis=0)

    def _normalize_label(self, label: str | None) -> str | None:
        if not label:
            return None
        text = str(label).strip()
        return text or None

    def _is_no_tumor_label(self, label: str | None) -> bool:
        return bool(label and label.strip().lower() in NO_TUMOR_LABELS)

    def predict_fast(self, image_bytes: bytes, model: Any, image_size: int) -> DetectionSummary:
        if model is None:
            raise RuntimeError("Fast Model is not available.")

        image = self.open_image(image_bytes)
        predictions = model.predict(self._prepare_fast_input(image, image_size), verbose=0)[0]
        predictions = np.asarray(predictions, dtype=np.float32).reshape(-1)

        if predictions.size == 1:
            tumor_probability = float(predictions[0])
        elif predictions.size >= 2:
            tumor_probability = float(predictions[-1])
        else:
            raise RuntimeError("Fast Model returned no predictions.")

        tumor_probability = max(0.0, min(1.0, tumor_probability))
        confidence = tumor_probability * 100.0
        diagnosis = "Tumor Detected" if tumor_probability >= 0.5 else "No Tumor Detected"

        return DetectionSummary(
            diagnosis=diagnosis,
            confidence=confidence,
            tumor_type=None,
            tumor_type_confidence=None,
            detections=[],
        )

    def _clip_box(self, xyxy: list[float], width: int, height: int) -> tuple[int, int, int, int]:
        x1, y1, x2, y2 = xyxy
        pad_x = int(max(0.0, (x2 - x1) * self.detector_padding_ratio))
        pad_y = int(max(0.0, (y2 - y1) * self.detector_padding_ratio))
        left = max(0, int(x1) - pad_x)
        top = max(0, int(y1) - pad_y)
        right = min(width, int(x2) + pad_x)
        bottom = min(height, int(y2) + pad_y)
        return left, top, right, bottom

    def predict_deep(self, image_bytes: bytes) -> DetectionSummary:
        image = self.open_image(image_bytes)
        detector = self.load_detector()
        classifier = self.load_classifier()
        if detector is None:
            raise RuntimeError("Deep Analysis Model v2 detector is not available.")
        if classifier is None:
            raise RuntimeError("Deep Analysis Model v2 classifier is not available.")

        results = detector.predict(image, conf=self.detector_confidence, verbose=False)
        result = results[0]
        boxes = getattr(result, "boxes", None)
        if boxes is None or len(boxes) == 0:
            return DetectionSummary("No Tumor Detected", 0.0, None, None, [])

        image_width, image_height = image.size
        detections: list[dict[str, Any]] = []

        for box in boxes:
            confidence = float(box.conf[0]) if box.conf is not None else 0.0
            class_id = int(box.cls[0]) if box.cls is not None else -1
            if class_id != 1 or confidence < self.detector_confidence:
                continue

            raw_xyxy = [float(value) for value in box.xyxy[0].tolist()]
            left, top, right, bottom = self._clip_box(raw_xyxy, image_width, image_height)
            if right <= left or bottom <= top:
                continue

            crop = image.crop((left, top, right, bottom))
            predictions = classifier.predict(self._prepare_deep_input(crop), verbose=0)[0]
            predictions = np.asarray(predictions, dtype=np.float32).reshape(-1)
            if predictions.size == 0:
                continue

            label_index = int(np.argmax(predictions))
            label = self.classifier_labels[label_index] if label_index < len(self.classifier_labels) else f"class_{label_index}"
            label = self._normalize_label(label)
            label_confidence = float(predictions[label_index]) * 100.0

            detections.append(
                {
                    "class_id": class_id,
                    "confidence": round(confidence * 100.0, 2),
                    "bbox": [left, top, right, bottom],
                    "tumor_type": None if self._is_no_tumor_label(label) else label,
                    "tumor_type_confidence": round(label_confidence, 2),
                }
            )

        if not detections:
            return DetectionSummary("No Tumor Detected", 0.0, None, None, [])

        best_detection = max(detections, key=lambda item: item["confidence"])
        tumor_type = best_detection["tumor_type"]

        return DetectionSummary(
            diagnosis="Tumor Detected" if tumor_type else "No Tumor Detected",
            confidence=best_detection["tumor_type_confidence"] or best_detection["confidence"],
            tumor_type=tumor_type,
            tumor_type_confidence=best_detection["tumor_type_confidence"],
            detections=detections,
        )

    def predict(self, image_bytes: bytes) -> DetectionSummary:
        return self.predict_deep(image_bytes)
