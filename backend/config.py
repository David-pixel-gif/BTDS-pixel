import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent


def _read_labels_file(path: Path) -> str | None:
    if not path.exists():
        return None
    labels = [line.strip() for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]
    return ",".join(labels) if labels else None


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production")
    TOKEN_MAX_AGE_SECONDS = int(os.getenv("TOKEN_MAX_AGE_SECONDS", "3600"))
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017")
    MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "brain_tumor_detection")
    TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_VALIDATE_SIGNATURE = os.getenv("TWILIO_VALIDATE_SIGNATURE", "true").lower() not in {"0", "false", "no"}
    INFOBIP_BASE_URL = os.getenv("INFOBIP_BASE_URL", "")
    INFOBIP_API_KEY = os.getenv("INFOBIP_API_KEY", "")
    INFOBIP_WHATSAPP_SENDER = os.getenv("INFOBIP_WHATSAPP_SENDER", "")
    INFOBIP_WEBHOOK_SECRET = os.getenv("INFOBIP_WEBHOOK_SECRET", "")
    META_WHATSAPP_ACCESS_TOKEN = os.getenv("META_WHATSAPP_ACCESS_TOKEN", "")
    META_WHATSAPP_PHONE_NUMBER_ID = os.getenv("META_WHATSAPP_PHONE_NUMBER_ID", "")
    META_WHATSAPP_VERIFY_TOKEN = os.getenv("META_WHATSAPP_VERIFY_TOKEN", "")
    META_APP_SECRET = os.getenv("META_APP_SECRET", "")
    META_VALIDATE_SIGNATURE = os.getenv("META_VALIDATE_SIGNATURE", "true").lower() not in {"0", "false", "no"}
    META_GRAPH_API_VERSION = os.getenv("META_GRAPH_API_VERSION", "v23.0")
    WHATSAPP_SESSION_COLLECTION = os.getenv("WHATSAPP_SESSION_COLLECTION", "whatsapp_sessions")
    GENERATED_MEDIA_DIR = os.getenv(
        "GENERATED_MEDIA_DIR",
        str(BASE_DIR / "backend" / "generated_media"),
    )
    FRONTEND_BUILD_DIR = os.getenv(
        "FRONTEND_BUILD_DIR",
        str(BASE_DIR / "frontend" / "build"),
    )
    PUBLIC_BASE_URL = os.getenv("PUBLIC_BASE_URL", "")
    FAST_MODEL_NAME = "Fast Model"
    DEEP_MODEL_NAME = "Deep Analysis Model v2"
    MODEL_PATH = os.getenv(
        "MODEL_PATH",
        str(BASE_DIR / "BrainTumor10EpochsCategorical.h5"),
    )
    FAST_MODEL_IMAGE_SIZE = int(os.getenv("FAST_MODEL_IMAGE_SIZE", "64"))
    YOLO_MODEL_PATH = os.getenv(
        "YOLO_MODEL_PATH",
        str(BASE_DIR / "backend" / "runs" / "brain_tumor_train_better_cpu" / "weights" / "best.pt"),
    )
    CLASSIFIER_MODEL_PATH = os.getenv(
        "CLASSIFIER_MODEL_PATH",
        str(BASE_DIR / "backend" / "models" / "brain_tumor_classifier.h5"),
    )
    CLASSIFIER_LABELS = os.getenv(
        "CLASSIFIER_LABELS",
        _read_labels_file(BASE_DIR / "backend" / "models" / "brain_tumor_classifier.labels.txt")
        or "Astrocitoma,Carcinoma,Ependimoma,Ganglioglioma,Germinoma,Glioblastoma,Granuloma,Meduloblastoma,Meningioma,Neurocitoma,Normal,Oligodendroglioma,Papiloma,Schwannoma,Tuberculoma",
    )
    CLASSIFIER_IMAGE_SIZE = int(os.getenv("CLASSIFIER_IMAGE_SIZE", "224"))

