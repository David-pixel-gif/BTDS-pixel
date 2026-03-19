# Brain Tumor Detection System (BTDS)

An AI-powered web application for brain tumor detection and classification from MRI scans. The system uses a three-layer pipeline to detect, classify, and localise brain tumors.

---

## What It Does

### Layer 1 — Tumor Presence Detection
The first layer analyses the MRI scan and determines whether a tumor is present or not. It returns a binary result: **tumor detected** or **no tumor detected**. If no tumor is found, the pipeline stops here.

### Layer 2 — Tumor Type Classification
If a tumor is detected, the second layer classifies it into one of 14 tumor types:

| Tumor Type | Tumor Type |
|---|---|
| Astrocitoma | Glioblastoma |
| Carcinoma | Granuloma |
| Ependimoma | Meduloblastoma |
| Ganglioglioma | Meningioma |
| Germinoma | Neurocitoma |
| Oligodendroglioma | Papiloma |
| Schwannoma | Tuberculoma |

### Layer 3 — Tumor Localisation (Bounding Box)
The third layer uses a YOLOv8/YOLOv11 object detection model to draw a **bounding box** around the suspected tumor area in the MRI image, giving a precise localisation of the region of concern.

---

## Project Structure

```
BTDS/
├── backend/                  # Flask API
│   ├── app.py                # Application entry point
│   ├── inference_pipeline.py # 3-layer detection pipeline
│   ├── models/               # Trained classifier model
│   ├── routes.py             # API endpoints
│   ├── auth.py               # Authentication
│   └── requirements.txt      # Python dependencies
├── frontend/                 # React web interface
│   └── src/
│       ├── pages/            # App pages
│       ├── components/       # UI components
│       └── services/         # API calls
├── scripts/                  # Startup scripts
├── BrainTumor10Epo.h5        # Trained model weights
├── BrainTumor10EpochsCategorical.h5
└── mri.ipynb                 # Training notebook
```

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Frontend
```bash
cd frontend
npm install
npm start
```

---

## Tech Stack

- **Backend:** Python, Flask, TensorFlow/Keras, YOLOv8/YOLOv11 (Ultralytics)
- **Frontend:** React
- **Models:** CNN classifier + YOLO object detection
