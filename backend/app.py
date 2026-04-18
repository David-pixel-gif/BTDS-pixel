import os
import sys
import io
import json
import time
import atexit
import base64
import signal
import hmac
import hashlib
import uuid
import urllib.error
import urllib.request
from pathlib import Path
from datetime import datetime, timezone

# Fall back to the repo-local site-packages when the copied virtualenv
# activation script is broken and system Python is used directly.
LOCAL_SITE_PACKAGES = os.path.join(
    os.path.dirname(__file__),
    "myenv1",
    "Lib",
    "site-packages",
)
if os.path.isdir(LOCAL_SITE_PACKAGES) and LOCAL_SITE_PACKAGES not in sys.path:
    sys.path.insert(0, LOCAL_SITE_PACKAGES)

from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError, PyMongoError
from flask import Flask, Response, jsonify, request, send_from_directory, session
from flask_cors import CORS
from PIL import ImageDraw, ImageFont
from werkzeug.security import check_password_hash, generate_password_hash

from auth import create_access_token, token_required
from config import Config
from database import close_database, get_database, object_id, serialize_document
from inference_pipeline import InferencePipeline, parse_classifier_labels
from reports import log_audit_event, reports_bp


app = Flask(__name__)
app.config["SECRET_KEY"] = Config.SECRET_KEY
CORS(app, resources={r"/*": {"origins": "*"}})
app.register_blueprint(reports_bp, url_prefix="/api")

db = get_database()
keras_model = None
inference_pipeline = InferencePipeline(
    detector_path=Config.YOLO_MODEL_PATH,
    classifier_path=Config.CLASSIFIER_MODEL_PATH,
    classifier_labels=parse_classifier_labels(Config.CLASSIFIER_LABELS),
    classifier_size=Config.CLASSIFIER_IMAGE_SIZE,
)
GENERATED_MEDIA_DIR = Path(Config.GENERATED_MEDIA_DIR)
GENERATED_MEDIA_DIR.mkdir(parents=True, exist_ok=True)
FRONTEND_BUILD_DIR = Path(Config.FRONTEND_BUILD_DIR)


def shutdown_backend(*_args):
    close_database()


atexit.register(shutdown_backend)
signal.signal(signal.SIGINT, shutdown_backend)
signal.signal(signal.SIGTERM, shutdown_backend)


def get_keras_model():
    global keras_model

    if keras_model is not None:
        return keras_model

    model_path = Config.MODEL_PATH
    if not os.path.exists(model_path):
        return None

    try:
        from tensorflow.keras.models import load_model

        keras_model = load_model(model_path, compile=False)
        return keras_model
    except Exception as exc:
        print(f"Failed to load model from {model_path}: {exc}")
        return None


def log_startup_models():
    print("Model startup status:")

    fast_model = get_keras_model()
    if fast_model is not None:
        print(
            f"  {Config.FAST_MODEL_NAME}: loaded path={Config.MODEL_PATH} "
            f"input_shape={getattr(fast_model, 'input_shape', None)} "
            f"output_shape={getattr(fast_model, 'output_shape', None)}"
        )
    else:
        print(f"  {Config.FAST_MODEL_NAME}: unavailable path={Config.MODEL_PATH}")

    detector = inference_pipeline.load_detector()
    if detector is not None:
        detector_names = getattr(detector, "names", {})
        print(
            f"  {Config.DEEP_MODEL_NAME} detector: loaded path={Config.YOLO_MODEL_PATH} "
            f"classes={detector_names}"
        )
    else:
        print(f"  {Config.DEEP_MODEL_NAME} detector: unavailable path={Config.YOLO_MODEL_PATH}")

    classifier = inference_pipeline.load_classifier()
    if classifier is not None:
        print(
            f"  {Config.DEEP_MODEL_NAME} classifier: loaded path={Config.CLASSIFIER_MODEL_PATH} "
            f"input_shape={getattr(classifier, 'input_shape', None)} "
            f"output_shape={getattr(classifier, 'output_shape', None)}"
        )
    else:
        print(f"  {Config.DEEP_MODEL_NAME} classifier: unavailable path={Config.CLASSIFIER_MODEL_PATH}")


log_startup_models()


def models_status():
    return {
        "fast_model_loaded": get_keras_model() is not None,
        "detector_loaded": inference_pipeline.detector_ready(),
        "classifier_loaded": inference_pipeline.classifier_ready(),
    }


def next_sequence(name):
    result = db.counters.find_one_and_update(
        {"_id": name},
        {"$inc": {"value": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return result["value"]


def recommendation_for(label):
    if label == "Tumor Detected":
        return "Consult a specialist and review the MRI with a radiologist."
    return "No tumor pattern detected. Continue with clinical follow-up if needed."


def resolve_model_type(raw_value):
    value = (raw_value or "fast").strip().lower()
    if value not in {"fast", "deep"}:
        raise ValueError("model_type must be either 'fast' or 'deep'")
    return value


def diagnose_image(image_bytes, model_type):
    if model_type == "deep":
        summary = inference_pipeline.predict_deep(image_bytes)
        return summary, Config.DEEP_MODEL_NAME

    model = get_keras_model()
    if model is None:
        raise RuntimeError("Fast Model is not available.")
    summary = inference_pipeline.predict_fast(image_bytes, model, Config.FAST_MODEL_IMAGE_SIZE)
    return summary, Config.FAST_MODEL_NAME


def format_whatsapp_prompt():
    return (
        "Which model do you want to use for the scan?\n"
        "Reply with FAST or DEEP.\n"
        "FAST = quicker result\n"
        "DEEP = detailed tumor detection"
    )


def xml_escape(value):
    escaped = (
        str(value or "")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )
    return escaped


def whatsapp_reply(message, status_code=200, media_url=None):
    escaped = xml_escape(message)
    media_xml = f"<Media>{xml_escape(media_url)}</Media>" if media_url else ""
    body = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        f"<Response><Message>{escaped}{media_xml}</Message></Response>"
    )
    return Response(body, status=status_code, mimetype="application/xml")


def get_request_public_url():
    if Config.PUBLIC_BASE_URL:
        base = Config.PUBLIC_BASE_URL.rstrip("/")
        path = request.path
        query = request.query_string.decode("utf-8")
        return f"{base}{path}" if not query else f"{base}{path}?{query}"
    return request.url


def is_valid_twilio_signature():
    if not Config.TWILIO_VALIDATE_SIGNATURE:
        return True
    if not Config.TWILIO_AUTH_TOKEN:
        return False

    signature = request.headers.get("X-Twilio-Signature", "")
    if not signature:
        return False

    payload = get_request_public_url()
    for key in sorted(request.form.keys()):
        for value in request.form.getlist(key):
            payload += f"{key}{value}"

    digest = hmac.new(
        Config.TWILIO_AUTH_TOKEN.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha1,
    ).digest()
    expected_signature = base64.b64encode(digest).decode("utf-8")
    return hmac.compare_digest(expected_signature, signature)


def get_public_base_url():
    configured = (Config.PUBLIC_BASE_URL or "").strip().rstrip("/")
    if configured:
        return configured
    return request.url_root.rstrip("/")


def generated_media_url(filename):
    return f"{get_public_base_url()}/media/generated/{filename}"


def load_annotation_font(size=18):
    try:
        return ImageFont.truetype("arial.ttf", size)
    except OSError:
        return ImageFont.load_default()


def draw_text_with_background(draw, position, text, font, fill, background):
    left, top, right, bottom = draw.textbbox(position, text, font=font)
    padding_x = 6
    padding_y = 4
    box = (
        left - padding_x,
        top - padding_y,
        right + padding_x,
        bottom + padding_y,
    )
    draw.rounded_rectangle(box, radius=6, fill=background)
    draw.text(position, text, font=font, fill=fill)


def create_annotated_scan_image(image_bytes, record):
    image = inference_pipeline.open_image(image_bytes).copy()
    draw = ImageDraw.Draw(image)
    title_font = load_annotation_font(20)
    body_font = load_annotation_font(16)

    status_color = (190, 30, 45) if record["tumor_detected"] else (24, 128, 56)
    title = f"{record['diagnosis']}  {record['confidence']}%"
    draw_text_with_background(
        draw,
        (16, 16),
        title,
        title_font,
        fill=(255, 255, 255),
        background=status_color,
    )

    subtitle_parts = [record["model_used"]]
    if record.get("tumor_type"):
        subtitle_parts.append(record["tumor_type"])
    subtitle = " | ".join(subtitle_parts)
    draw_text_with_background(
        draw,
        (16, 50),
        subtitle,
        body_font,
        fill=(255, 255, 255),
        background=(36, 52, 71),
    )

    detections = record.get("detections") or []
    for detection in detections:
        bbox = detection.get("bbox") or []
        if len(bbox) != 4:
            continue
        left, top, right, bottom = [int(value) for value in bbox]
        tumor_type = detection.get("tumor_type") or "Tumor region"
        confidence = detection.get("tumor_type_confidence") or detection.get("confidence") or 0
        label = f"{tumor_type} {round(float(confidence), 2)}%"

        draw.rectangle((left, top, right, bottom), outline=status_color, width=4)
        label_y = top - 28 if top > 32 else top + 8
        draw_text_with_background(
            draw,
            (left + 4, label_y),
            label,
            body_font,
            fill=(255, 255, 255),
            background=status_color,
        )

    output = io.BytesIO()
    image.save(output, format="PNG")
    return output.getvalue()


def save_generated_media(image_bytes, prefix="scan"):
    filename = f"{prefix}-{uuid.uuid4().hex}.png"
    output_path = GENERATED_MEDIA_DIR / filename
    output_path.write_bytes(image_bytes)
    return filename


def normalize_whatsapp_phone(raw_value):
    value = (raw_value or "").strip()
    if value.lower().startswith("whatsapp:"):
        value = value.split(":", 1)[1].strip()
    return value


def get_whatsapp_sessions_collection():
    collection_name = Config.WHATSAPP_SESSION_COLLECTION or "whatsapp_sessions"
    return db[collection_name]


def get_whatsapp_session(phone):
    return get_whatsapp_sessions_collection().find_one({"phone": phone})


def upsert_whatsapp_session(phone, state, selected_model=None):
    now = datetime.now(timezone.utc).isoformat()
    update = {
        "$set": {
            "phone": phone,
            "state": state,
            "updatedAt": now,
        }
    }
    if selected_model is not None:
        update["$set"]["selected_model"] = selected_model
    get_whatsapp_sessions_collection().update_one({"phone": phone}, update, upsert=True)


def clear_whatsapp_session(phone):
    get_whatsapp_sessions_collection().delete_one({"phone": phone})


def resolve_whatsapp_model_choice(message_text):
    normalized = (message_text or "").strip().lower()
    choices = {
        "1": "fast",
        "fast": "fast",
        "fast model": "fast",
        "2": "deep",
        "deep": "deep",
        "deep model": "deep",
        "detailed": "deep",
    }
    return choices.get(normalized)


def download_twilio_media(media_url):
    if not media_url:
        raise ValueError("Missing WhatsApp media URL.")

    request_obj = urllib.request.Request(media_url)
    if Config.TWILIO_ACCOUNT_SID and Config.TWILIO_AUTH_TOKEN:
        credentials = f"{Config.TWILIO_ACCOUNT_SID}:{Config.TWILIO_AUTH_TOKEN}".encode("utf-8")
        token = base64.b64encode(credentials).decode("ascii")
        request_obj.add_header("Authorization", f"Basic {token}")

    try:
        with urllib.request.urlopen(request_obj, timeout=30) as response:
            return response.read()
    except urllib.error.HTTPError as exc:
        raise RuntimeError(f"Failed to download WhatsApp media: HTTP {exc.code}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Failed to download WhatsApp media: {exc.reason}") from exc


def build_scan_record(summary, model_type, model_used, processing_time, user_email=None, source=None, phone=None):
    confidence = round(summary.confidence, 2)
    tumor_detected = summary.diagnosis == "Tumor Detected"
    scan_id = next_sequence("scan_results")
    created_at = datetime.now(timezone.utc).isoformat()

    record = {
        "id": scan_id,
        "diagnosis": summary.diagnosis,
        "confidence": confidence,
        "processing_time": processing_time,
        "recommendations": recommendation_for(summary.diagnosis),
        "userEmail": user_email,
        "createdAt": created_at,
        "tumor_detected": tumor_detected,
        "tumor_type": summary.tumor_type,
        "tumor_type_confidence": round(summary.tumor_type_confidence, 2)
        if summary.tumor_type_confidence is not None
        else None,
        "detections": summary.detections,
        "model_type": model_type,
        "model_used": model_used,
    }
    if source:
        record["source"] = source
    if phone:
        record["phone"] = phone
    return record


def format_scan_response(record):
    return {
        "id": record["id"],
        "diagnosis": record["diagnosis"],
        "confidence": record["confidence"],
        "processing_time": record["processing_time"],
        "recommendations": record["recommendations"],
        "tumor_detected": record["tumor_detected"],
        "tumor_type": record["tumor_type"],
        "tumor_type_confidence": record["tumor_type_confidence"],
        "detections": record["detections"],
        "model_type": record["model_type"],
        "model_used": record["model_used"],
        "generated_media_filename": record.get("generated_media_filename"),
    }


def persist_diagnosis(image_bytes, model_type, actor_email=None, source="web", phone=None):
    start_time = time.time()
    summary, model_used = diagnose_image(image_bytes, model_type)
    processing_time = round(time.time() - start_time, 3)
    record = build_scan_record(
        summary,
        model_type=model_type,
        model_used=model_used,
        processing_time=processing_time,
        user_email=actor_email,
        source=source,
        phone=phone,
    )
    db.scan_results.insert_one(record)
    log_audit_event(
        "diagnosis.run",
        actor_email or phone,
        {
            "scan_id": record["id"],
            "model_type": model_type,
            "model_used": model_used,
            "diagnosis": summary.diagnosis,
            "tumor_type": summary.tumor_type,
            "source": source,
        },
    )
    return record


def format_whatsapp_scan_result(record):
    lines = [
        "Scan result",
        f"Model: {record['model_used']}",
        f"Diagnosis: {record['diagnosis']}",
        f"Confidence: {record['confidence']}%",
    ]
    if record.get("tumor_type"):
        lines.append(f"Tumor type: {record['tumor_type']}")
    lines.append(f"Recommendation: {record['recommendations']}")
    return "\n".join(lines)


def process_whatsapp_interaction(phone, incoming_text="", image_bytes=None, source="whatsapp"):
    session_state = get_whatsapp_session(phone) or {}
    selected_model = session_state.get("selected_model")
    model_choice = resolve_whatsapp_model_choice(incoming_text)

    if model_choice:
        upsert_whatsapp_session(phone, state="awaiting_image", selected_model=model_choice)
        return {
            "text": f"{model_choice.upper()} selected. Now send the scan image for analysis.",
            "media_url": None,
        }

    if image_bytes is not None:
        if not selected_model:
            upsert_whatsapp_session(phone, state="awaiting_model")
            return {
                "text": format_whatsapp_prompt(),
                "media_url": None,
            }

        record = persist_diagnosis(
            image_bytes,
            model_type=selected_model,
            actor_email=None,
            source=source,
            phone=phone,
        )
        annotated_bytes = create_annotated_scan_image(image_bytes, record)
        generated_filename = save_generated_media(annotated_bytes, prefix=f"{source}-scan")
        record["generated_media_filename"] = generated_filename
        db.scan_results.update_one(
            {"id": record["id"]},
            {"$set": {"generated_media_filename": generated_filename}},
        )
        clear_whatsapp_session(phone)
        return {
            "text": format_whatsapp_scan_result(record),
            "media_url": generated_media_url(generated_filename),
        }

    upsert_whatsapp_session(phone, state="awaiting_model", selected_model=selected_model)
    if selected_model:
        return {
            "text": (
                f"Current model: {selected_model.upper()}.\n"
                "Send the scan image now, or reply FAST or DEEP to change it."
            ),
            "media_url": None,
        }
    return {
        "text": format_whatsapp_prompt(),
        "media_url": None,
    }


def get_meta_graph_base_url():
    version = (Config.META_GRAPH_API_VERSION or "v23.0").strip()
    return f"https://graph.facebook.com/{version}"


def meta_api_request(path, method="GET", payload=None, expect_json=True):
    if not Config.META_WHATSAPP_ACCESS_TOKEN:
        raise RuntimeError("META_WHATSAPP_ACCESS_TOKEN is not configured.")

    url = f"{get_meta_graph_base_url()}/{str(path).lstrip('/')}"
    data = None
    headers = {
        "Authorization": f"Bearer {Config.META_WHATSAPP_ACCESS_TOKEN}",
    }
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"

    request_obj = urllib.request.Request(url, data=data, method=method)
    for key, value in headers.items():
        request_obj.add_header(key, value)

    try:
        with urllib.request.urlopen(request_obj, timeout=30) as response:
            body = response.read()
            if not expect_json:
                return body
            return json.loads(body.decode("utf-8")) if body else {}
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"Meta WhatsApp API request failed: HTTP {exc.code} {detail}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Meta WhatsApp API request failed: {exc.reason}") from exc


def is_valid_meta_signature():
    if not Config.META_VALIDATE_SIGNATURE:
        return True
    if not Config.META_APP_SECRET:
        return False

    signature = request.headers.get("X-Hub-Signature-256", "")
    if not signature.startswith("sha256="):
        return False

    raw_body = request.get_data(cache=True) or b""
    expected_digest = hmac.new(
        Config.META_APP_SECRET.encode("utf-8"),
        raw_body,
        hashlib.sha256,
    ).hexdigest()
    provided_digest = signature.split("=", 1)[1].strip()
    return hmac.compare_digest(expected_digest, provided_digest)


def meta_verify_webhook_request():
    mode = request.args.get("hub.mode", "")
    verify_token = request.args.get("hub.verify_token", "")
    challenge = request.args.get("hub.challenge", "")
    if mode == "subscribe" and verify_token == Config.META_WHATSAPP_VERIFY_TOKEN:
        return Response(challenge, status=200, mimetype="text/plain")
    return Response("Verification failed", status=403, mimetype="text/plain")


def meta_download_media(media_id):
    if not media_id:
        raise ValueError("Missing Meta WhatsApp media ID.")
    metadata = meta_api_request(media_id, method="GET")
    media_url = metadata.get("url")
    if not media_url:
        raise RuntimeError("Meta WhatsApp media URL was not returned.")

    request_obj = urllib.request.Request(media_url, method="GET")
    request_obj.add_header("Authorization", f"Bearer {Config.META_WHATSAPP_ACCESS_TOKEN}")
    try:
        with urllib.request.urlopen(request_obj, timeout=30) as response:
            return response.read()
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"Meta media download failed: HTTP {exc.code} {detail}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Meta media download failed: {exc.reason}") from exc


def send_meta_text_message(phone, text):
    if not Config.META_WHATSAPP_PHONE_NUMBER_ID:
        raise RuntimeError("META_WHATSAPP_PHONE_NUMBER_ID is not configured.")
    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "text",
        "text": {
            "preview_url": False,
            "body": text,
        },
    }
    return meta_api_request(f"{Config.META_WHATSAPP_PHONE_NUMBER_ID}/messages", method="POST", payload=payload)


def send_meta_image_message(phone, image_url, caption=None):
    if not Config.META_WHATSAPP_PHONE_NUMBER_ID:
        raise RuntimeError("META_WHATSAPP_PHONE_NUMBER_ID is not configured.")
    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "image",
        "image": {
            "link": image_url,
        },
    }
    if caption:
        payload["image"]["caption"] = caption
    return meta_api_request(f"{Config.META_WHATSAPP_PHONE_NUMBER_ID}/messages", method="POST", payload=payload)


def iter_meta_incoming_messages(payload):
    for entry in payload.get("entry", []) or []:
        for change in entry.get("changes", []) or []:
            value = change.get("value", {}) or {}
            for message in value.get("messages", []) or []:
                yield message


def is_valid_infobip_webhook():
    expected = (Config.INFOBIP_WEBHOOK_SECRET or "").strip()
    if not expected:
        return True

    provided = (
        request.headers.get("X-Webhook-Secret")
        or request.headers.get("X-Infobip-Secret")
        or request.headers.get("Authorization", "").replace("App ", "", 1).strip()
        or request.args.get("secret", "")
    ).strip()
    return bool(provided) and hmac.compare_digest(expected, provided)


def infobip_api_request(path, payload=None, method="POST", expect_json=True):
    if not Config.INFOBIP_BASE_URL:
        raise RuntimeError("INFOBIP_BASE_URL is not configured.")
    if not Config.INFOBIP_API_KEY:
        raise RuntimeError("INFOBIP_API_KEY is not configured.")

    url = f"{Config.INFOBIP_BASE_URL.rstrip('/')}/{str(path).lstrip('/')}"
    data = None
    request_obj = None

    if payload is not None:
        data = json.dumps(payload).encode("utf-8")

    request_obj = urllib.request.Request(url, data=data, method=method)
    request_obj.add_header("Authorization", f"App {Config.INFOBIP_API_KEY}")
    request_obj.add_header("Content-Type", "application/json")
    request_obj.add_header("Accept", "application/json")

    try:
        with urllib.request.urlopen(request_obj, timeout=30) as response:
            body = response.read()
            if not expect_json:
                return body
            return json.loads(body.decode("utf-8")) if body else {}
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"Infobip API request failed: HTTP {exc.code} {detail}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Infobip API request failed: {exc.reason}") from exc


def infobip_download_media(media_url):
    if not media_url:
        raise ValueError("Missing Infobip media URL.")

    request_obj = urllib.request.Request(media_url, method="GET")
    if Config.INFOBIP_API_KEY:
        request_obj.add_header("Authorization", f"App {Config.INFOBIP_API_KEY}")

    try:
        with urllib.request.urlopen(request_obj, timeout=30) as response:
            return response.read()
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"Infobip media download failed: HTTP {exc.code} {detail}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Infobip media download failed: {exc.reason}") from exc


def send_infobip_text_message(phone, text):
    if not Config.INFOBIP_WHATSAPP_SENDER:
        raise RuntimeError("INFOBIP_WHATSAPP_SENDER is not configured.")

    payload = {
        "messages": [
            {
                "channel": "WHATSAPP",
                "sender": Config.INFOBIP_WHATSAPP_SENDER,
                "destinations": [{"to": phone}],
                "content": {
                    "body": {
                        "type": "TEXT",
                        "text": text,
                    }
                },
            }
        ]
    }
    return infobip_api_request("messages-api/1/messages", payload=payload, method="POST")


def send_infobip_image_message(phone, image_url, caption=None):
    if not Config.INFOBIP_WHATSAPP_SENDER:
        raise RuntimeError("INFOBIP_WHATSAPP_SENDER is not configured.")

    body = {
        "type": "IMAGE",
        "url": image_url,
    }
    if caption:
        body["text"] = caption

    payload = {
        "messages": [
            {
                "channel": "WHATSAPP",
                "sender": Config.INFOBIP_WHATSAPP_SENDER,
                "destinations": [{"to": phone}],
                "content": {
                    "body": body
                },
            }
        ]
    }
    return infobip_api_request("messages-api/1/messages", payload=payload, method="POST")


def iter_infobip_incoming_messages(payload):
    for result in payload.get("results", []) or []:
        yield result


def extract_infobip_message_content(message_payload):
    message = message_payload.get("message", {}) or {}
    message_type = (message.get("type") or message_payload.get("messageType") or "").strip().lower()

    if not message_type:
        if message.get("text"):
            message_type = "text"
        elif message.get("url") or message.get("mediaUrl"):
            message_type = "image"

    incoming_text = (
        message.get("text")
        or message.get("caption")
        or message_payload.get("text")
        or ""
    ).strip()
    media_url = (
        message.get("url")
        or message.get("mediaUrl")
        or message_payload.get("url")
        or ""
    ).strip()
    return message_type, incoming_text, media_url


def get_endpoint_manifest():
    manifest = []
    allowed_methods = {"GET", "POST", "PUT", "PATCH", "DELETE"}

    for rule in sorted(app.url_map.iter_rules(), key=lambda item: item.rule):
        if rule.endpoint == "static":
            continue

        view_func = app.view_functions.get(rule.endpoint)
        manifest.append(
            {
                "endpoint": rule.endpoint,
                "path": rule.rule,
                "methods": sorted(method for method in rule.methods if method in allowed_methods),
                "authRequired": bool(getattr(view_func, "_auth_required", False)),
            }
        )

    return manifest


def print_endpoint_manifest():
    print("Registered backend endpoints:")
    for item in get_endpoint_manifest():
        methods = ",".join(item["methods"])
        auth_flag = "auth" if item["authRequired"] else "public"
        print(f"  {methods:<12} {item['path']:<40} {auth_flag}  [{item['endpoint']}]")


def public_user(user):
    payload = serialize_document(user)
    payload.pop("password_hash", None)
    payload.pop("password", None)
    if "_id" in payload and "id" not in payload:
        payload["id"] = payload["_id"]
    return payload


def verify_user_password(user, password):
    password_hash = user.get("password_hash")
    if password_hash:
        try:
            return check_password_hash(password_hash, password)
        except (ValueError, TypeError):
            return False

    legacy_password = user.get("password")
    if isinstance(legacy_password, str) and legacy_password == password:
        db.users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {"password_hash": generate_password_hash(password)},
                "$unset": {"password": ""},
            },
        )
        return True

    return False


def frontend_index_path():
    return FRONTEND_BUILD_DIR / "index.html"


def frontend_is_available():
    return frontend_index_path().exists()


@app.route("/")
def root():
    if frontend_is_available():
        return send_from_directory(FRONTEND_BUILD_DIR, "index.html")
    return jsonify({"message": "Brain Tumor Detection API is running"})


@app.route("/health", methods=["GET"])
def health():
    legacy_model_loaded = get_keras_model() is not None
    return jsonify(
        {
            "status": "ok",
            "database": db.name,
            "model_loaded": legacy_model_loaded,
            "pipeline": models_status(),
        }
    )


@app.route("/api/endpoints", methods=["GET"])
def endpoints_manifest():
    return jsonify(get_endpoint_manifest())


@app.route("/media/generated/<path:filename>", methods=["GET"])
def generated_media(filename):
    return send_from_directory(GENERATED_MEDIA_DIR, filename)


@app.route("/static/<path:filename>", methods=["GET"])
def frontend_static(filename):
    return send_from_directory(FRONTEND_BUILD_DIR / "static", filename)


@app.route("/webhooks/whatsapp", methods=["GET"])
def whatsapp_webhook_status():
    return jsonify(
        {
            "status": "ok",
            "channel": "whatsapp",
            "provider": "twilio-compatible",
        }
    )


@app.route("/webhooks/whatsapp/meta", methods=["GET"])
def whatsapp_meta_webhook_verify():
    return meta_verify_webhook_request()


@app.route("/webhooks/whatsapp/meta", methods=["POST"])
def whatsapp_meta_webhook():
    if not is_valid_meta_signature():
        log_audit_event(
            "diagnosis.whatsapp_meta_rejected",
            None,
            {"reason": "invalid_meta_signature"},
            status="error",
        )
        return jsonify({"error": "Invalid Meta webhook signature"}), 403

    payload = request.get_json(silent=True) or {}
    processed = 0

    try:
        for message in iter_meta_incoming_messages(payload):
            phone = normalize_whatsapp_phone(message.get("from"))
            if not phone:
                continue

            message_type = (message.get("type") or "").strip().lower()
            incoming_text = ""
            image_bytes = None

            if message_type == "text":
                incoming_text = ((message.get("text") or {}).get("body") or "").strip()
            elif message_type == "image":
                image_id = ((message.get("image") or {}).get("id") or "").strip()
                incoming_text = ((message.get("image") or {}).get("caption") or "").strip()
                image_bytes = meta_download_media(image_id)
            else:
                send_meta_text_message(
                    phone,
                    "Unsupported message type. Send FAST or DEEP, then upload the scan image.",
                )
                processed += 1
                continue

            result = process_whatsapp_interaction(
                phone,
                incoming_text=incoming_text,
                image_bytes=image_bytes,
                source="whatsapp_meta",
            )
            send_meta_text_message(phone, result["text"])
            if result.get("media_url"):
                send_meta_image_message(
                    phone,
                    result["media_url"],
                    caption="Annotated scan result",
                )
            processed += 1
    except Exception as exc:
        log_audit_event(
            "diagnosis.whatsapp_meta_failed",
            None,
            {"error": str(exc)},
            status="error",
        )
        return jsonify({"error": str(exc)}), 500

    return jsonify({"status": "ok", "processed": processed}), 200


@app.route("/webhooks/whatsapp/infobip", methods=["GET"])
def whatsapp_infobip_webhook_status():
    return jsonify(
        {
            "status": "ok",
            "channel": "whatsapp",
            "provider": "infobip",
        }
    )


@app.route("/webhooks/whatsapp/infobip", methods=["POST"])
def whatsapp_infobip_webhook():
    if not is_valid_infobip_webhook():
        log_audit_event(
            "diagnosis.whatsapp_infobip_rejected",
            None,
            {"reason": "invalid_infobip_webhook_secret"},
            status="error",
        )
        return jsonify({"error": "Invalid Infobip webhook secret"}), 403

    payload = request.get_json(silent=True) or {}
    processed = 0

    try:
        for item in iter_infobip_incoming_messages(payload):
            phone = normalize_whatsapp_phone(item.get("from"))
            if not phone:
                continue

            message_type, incoming_text, media_url = extract_infobip_message_content(item)

            if message_type == "text":
                image_bytes = None
            elif message_type == "image":
                image_bytes = infobip_download_media(media_url)
            else:
                send_infobip_text_message(
                    phone,
                    "Unsupported message type. Send FAST or DEEP, then upload the scan image.",
                )
                processed += 1
                continue

            result = process_whatsapp_interaction(
                phone,
                incoming_text=incoming_text,
                image_bytes=image_bytes,
                source="whatsapp_infobip",
            )
            send_infobip_text_message(phone, result["text"])
            if result.get("media_url"):
                send_infobip_image_message(
                    phone,
                    result["media_url"],
                    caption="Annotated scan result",
                )
            processed += 1
    except Exception as exc:
        log_audit_event(
            "diagnosis.whatsapp_infobip_failed",
            None,
            {"error": str(exc)},
            status="error",
        )
        return jsonify({"error": str(exc)}), 500

    return jsonify({"status": "ok", "processed": processed}), 200


@app.route("/webhooks/whatsapp", methods=["POST"])
def whatsapp_webhook():
    if not is_valid_twilio_signature():
        log_audit_event(
            "diagnosis.whatsapp_rejected",
            None,
            {"reason": "invalid_twilio_signature"},
            status="error",
        )
        return whatsapp_reply("Invalid webhook signature.", status_code=403)

    phone = normalize_whatsapp_phone(request.form.get("From"))
    incoming_text = (request.form.get("Body") or "").strip()
    media_count = int(request.form.get("NumMedia", "0") or "0")
    media_url = request.form.get("MediaUrl0")

    if not phone:
        return whatsapp_reply("Unable to identify the WhatsApp sender.", status_code=400)

    session_state = get_whatsapp_session(phone) or {}
    selected_model = session_state.get("selected_model")

    try:
        image_bytes = download_twilio_media(media_url) if media_count > 0 else None
        result = process_whatsapp_interaction(
            phone,
            incoming_text=incoming_text,
            image_bytes=image_bytes,
            source="whatsapp",
        )
        return whatsapp_reply(result["text"], media_url=result.get("media_url"))
    except ValueError as exc:
        return whatsapp_reply(str(exc), status_code=400)
    except Exception as exc:
        log_audit_event(
            "diagnosis.whatsapp_failed",
            phone,
            {
                "phone": phone,
                "error": str(exc),
            },
            status="error",
        )
        return whatsapp_reply(f"Failed to process the scan: {exc}", status_code=500)


@app.route("/create_user", methods=["POST"])
def create_user():
    try:
        data = request.get_json(silent=True) or {}
        username = data.get("username", "").strip()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        if not username or not email or not password:
            return jsonify({"error": "Username, email, and password are required"}), 400

        if db.users.find_one({"$or": [{"username": username}, {"email": email}]}):
            return jsonify({"error": "Username or email already exists"}), 409

        default_role = db.roles.find_one({"name": "Doctor"})
        user = {
            "username": username,
            "email": email,
            "password_hash": generate_password_hash(password),
            "roles": [default_role["name"]] if default_role else ["Doctor"],
            "createdAt": datetime.now(timezone.utc),
        }
        inserted = db.users.insert_one(user)
        user["_id"] = inserted.inserted_id
        return jsonify({"message": "User created successfully", "user": public_user(user)}), 201
    except DuplicateKeyError:
        return jsonify({"error": "Username or email already exists"}), 409
    except PyMongoError as exc:
        return jsonify({"error": f"Database error while creating user: {exc}"}), 500
    except Exception as exc:
        return jsonify({"error": f"Failed to create user: {exc}"}), 500


@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json(silent=True) or {}
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        user = db.users.find_one({"email": email})
        if not user or not verify_user_password(user, password):
            return jsonify({"error": "Invalid email or password"}), 401

        token = create_access_token(user["_id"])
        roles = user.get("roles", [])
        return jsonify(
            {
                "access_token": token,
                "user": public_user(user),
                "userRole": roles[0] if roles else None,
            }
        )
    except PyMongoError as exc:
        return jsonify({"error": f"Database error while logging in: {exc}"}), 500
    except Exception as exc:
        return jsonify({"error": f"Failed to log in: {exc}"}), 500


@app.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully"})


@app.route("/me", methods=["GET"])
@token_required
def me(current_user):
    return jsonify(public_user(current_user))


@app.route("/me", methods=["PUT"])
@token_required
def update_me(current_user):
    data = request.get_json(silent=True) or {}
    profile_updates = {
        "qualifications": data.get("qualifications", ""),
        "department": data.get("department", ""),
        "phone": data.get("phone", ""),
    }

    db.users.update_one(
        {"_id": object_id(current_user["id"])},
        {"$set": profile_updates},
    )
    updated_user = db.users.find_one({"_id": object_id(current_user["id"])})
    return jsonify(public_user(updated_user))


@app.route("/api/permissions", methods=["GET"])
@token_required
def permissions(current_user):
    items = list(db.permissions.find({}, {"_id": 0}).sort("name", 1))
    return jsonify(
        [{"id": item["name"], "name": item["name"]} for item in items]
    )


@app.route("/api/roles", methods=["GET"])
@token_required
def get_roles(current_user):
    roles = list(db.roles.find({}, {"_id": 0}).sort("name", 1))
    return jsonify(
        [
            {
                "id": role["name"],
                "name": role["name"],
                "permissions": [
                    {"id": permission, "name": permission}
                    for permission in role.get("permissions", [])
                ],
            }
            for role in roles
        ]
    )


@app.route("/api/roles", methods=["POST"])
@token_required
def create_role(current_user):
    data = request.get_json(force=True)
    name = data.get("name", "").strip()
    permissions = sorted(set(data.get("permissions", [])))
    if not name:
        return jsonify({"error": "Role name is required"}), 400

    db.roles.update_one(
        {"name": name},
        {"$set": {"name": name, "permissions": permissions}},
        upsert=True,
    )
    return jsonify({"message": "Role saved successfully"}), 201


@app.route("/api/roles/<role_id>", methods=["PUT"])
@token_required
def update_role(current_user, role_id):
    data = request.get_json(force=True)
    name = data.get("name", role_id).strip()
    permissions = sorted(set(data.get("permissions", [])))

    db.roles.update_one(
        {"name": role_id},
        {"$set": {"name": name, "permissions": permissions}},
    )
    db.users.update_many(
        {"roles": role_id},
        {"$set": {"roles.$[role]": name}},
        array_filters=[{"role": role_id}],
    )
    return jsonify({"message": "Role updated successfully"})


@app.route("/api/users", methods=["GET"])
@token_required
def get_users(current_user):
    users = list(
        db.users.find({}, {"password_hash": 0}).sort("createdAt", -1)
    )
    return jsonify(
        [
            {
                "id": str(user["_id"]),
                "email": user["email"],
                "username": user["username"],
                "roles": user.get("roles", []),
            }
            for user in users
        ]
    )


@app.route("/api/users/assign-role", methods=["POST"])
@token_required
def assign_role(current_user):
    data = request.get_json(force=True)
    user_id = data.get("userId")
    role_id = data.get("roleId")
    role = db.roles.find_one({"name": role_id})
    if not user_id or not role:
        return jsonify({"error": "Valid user and role are required"}), 400

    db.users.update_one(
        {"_id": object_id(user_id)},
        {"$set": {"roles": [role["name"]]}},
    )
    return jsonify({"message": "Role assigned successfully"})


@app.route("/api/patient/register", methods=["POST"])
@token_required
def register_patient(current_user):
    data = request.get_json(force=True)
    patient_id = f"PAT-{next_sequence('patients'):05d}"
    patient = {
        "patientId": patient_id,
        "fullName": data.get("fullName", "").strip(),
        "age": data.get("age"),
        "gender": data.get("gender"),
        "contactNumber": data.get("contactNumber"),
        "medicalHistory": data.get("medicalHistory", ""),
        "radiologyNotes": data.get("radiologyNotes", ""),
        "latestMRI": data.get("latestMRI", "No MRI uploaded yet"),
        "specialistRecommendations": data.get(
            "specialistRecommendations",
            "Pending specialist review",
        ),
        "createdBy": current_user["email"],
        "createdAt": datetime.now(timezone.utc),
    }

    if not patient["fullName"]:
        return jsonify({"error": "Patient full name is required"}), 400

    db.patients.insert_one(patient)
    return jsonify({"message": "Patient registered successfully", "patientId": patient_id}), 201


@app.route("/api/patient-history/<patient_id>", methods=["GET"])
@token_required
def patient_history(current_user, patient_id):
    patient = db.patients.find_one({"patientId": patient_id}, {"_id": 0})
    if not patient:
        return jsonify({"error": "Patient not found"}), 404
    return jsonify(
        {
            "patientId": patient["patientId"],
            "patientName": patient["fullName"],
            "medicalHistory": patient.get("medicalHistory", ""),
            "latestMRI": patient.get("latestMRI", "No MRI uploaded yet"),
            "specialistRecommendations": patient.get(
                "specialistRecommendations",
                "Pending specialist review",
            ),
            "radiologyNotes": patient.get("radiologyNotes", ""),
            "age": patient.get("age"),
            "gender": patient.get("gender"),
            "contactNumber": patient.get("contactNumber"),
        }
    )


@app.route("/api/patient/<patient_id>", methods=["GET"])
@token_required
def patient_details(current_user, patient_id):
    patient = db.patients.find_one({"patientId": patient_id}, {"_id": 0})
    if not patient:
        return jsonify({"error": "Patient not found"}), 404
    return jsonify(patient)


@app.route("/diagnose", methods=["POST"])
@app.route("/diagnoses", methods=["POST"])
@token_required
def diagnoses(current_user):
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]

    try:
        model_type = resolve_model_type(request.form.get("model_type"))
        image_bytes = file.read()
        record = persist_diagnosis(
            image_bytes,
            model_type=model_type,
            actor_email=current_user["email"],
            source="web",
        )
        return jsonify(format_scan_response(record))
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": f"Failed to process image: {exc}"}), 500


@app.route("/<path:path>", methods=["GET"])
def frontend_fallback(path):
    api_prefixes = ("api/", "media/", "webhooks/")
    if path in {"health", "create_user", "login", "logout", "me", "diagnose", "diagnoses"} or path.startswith(api_prefixes):
        return jsonify({"error": "Not found"}), 404
    if frontend_is_available():
        return send_from_directory(FRONTEND_BUILD_DIR, "index.html")
    return jsonify({"error": "Frontend build is not available"}), 404


if __name__ == "__main__":
    print_endpoint_manifest()
    try:
        app.run(debug=True, use_reloader=False)
    finally:
        shutdown_backend()
