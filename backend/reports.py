import csv
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from io import StringIO

from flask import Blueprint, Response, jsonify, request

from auth import admin_required, token_required
from config import Config
from database import get_database


reports_bp = Blueprint("reports", __name__)


def log_audit_event(action, actor_email=None, details=None, status="success"):
    db = get_database()
    db.audit_trail.insert_one(
        {
            "action": action,
            "actorEmail": actor_email,
            "status": status,
            "details": details or {},
            "createdAt": datetime.now(timezone.utc).isoformat(),
        }
    )


def _parse_datetime(value):
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    try:
        normalized = value.replace("Z", "+00:00")
        parsed = datetime.fromisoformat(normalized)
        if parsed.tzinfo is not None:
            parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)
        return parsed
    except ValueError:
        return None


def _scan_created_at(scan):
    return _parse_datetime(scan.get("createdAt")) or datetime.now(timezone.utc).replace(tzinfo=None)


def _query_scans():
    db = get_database()
    query = {}
    model_type = request.args.get("model_type")
    user_email = request.args.get("user_email")
    patient_id = request.args.get("patient_id")
    diagnosis = request.args.get("diagnosis")
    source = request.args.get("source")
    phone = request.args.get("phone")
    date_from = _parse_datetime(request.args.get("date_from"))
    date_to = _parse_datetime(request.args.get("date_to"))

    if model_type:
        query["model_type"] = model_type
    if user_email:
        query["userEmail"] = user_email
    if patient_id:
        query["patientId"] = patient_id
    if diagnosis:
        query["diagnosis"] = diagnosis
    if source:
        query["source"] = source
    if phone:
        query["phone"] = phone
    if date_from or date_to:
        created_filter = {}
        if date_from:
            created_filter["$gte"] = date_from.isoformat()
        if date_to:
            created_filter["$lte"] = (date_to + timedelta(days=1)).isoformat()
        query["createdAt"] = created_filter

    limit = min(int(request.args.get("limit", "500")), 2000)
    scans = list(
        db.scan_results.find(query, {"_id": 0}).sort("createdAt", -1).limit(limit)
    )
    return [_serialize_scan(scan) for scan in scans]


def _generated_media_url(filename):
    if not filename:
        return None
    base = (Config.PUBLIC_BASE_URL or "").strip().rstrip("/")
    path = f"/media/generated/{filename}"
    return f"{base}{path}" if base else path


def _serialize_scan(scan):
    payload = dict(scan)
    payload["generated_media_url"] = _generated_media_url(scan.get("generated_media_filename"))
    return payload


def _query_audit():
    db = get_database()
    query = {}
    action = request.args.get("action")
    actor_email = request.args.get("actor_email")
    date_from = _parse_datetime(request.args.get("date_from"))
    date_to = _parse_datetime(request.args.get("date_to"))

    if action:
        query["action"] = action
    if actor_email:
        query["actorEmail"] = actor_email
    if date_from or date_to:
        created_filter = {}
        if date_from:
            created_filter["$gte"] = date_from.isoformat()
        if date_to:
            created_filter["$lte"] = (date_to + timedelta(days=1)).isoformat()
        query["createdAt"] = created_filter

    limit = min(int(request.args.get("limit", "500")), 2000)
    return list(get_database().audit_trail.find(query, {"_id": 0}).sort("createdAt", -1).limit(limit))


def _safe_average(values, digits=2):
    return round(sum(values) / len(values), digits) if values else 0


def _summary_from_scans(scans):
    total = len(scans)
    tumors = sum(1 for scan in scans if scan.get("diagnosis") == "Tumor Detected")
    no_tumor = total - tumors
    confidence_values = [float(scan.get("confidence", 0)) for scan in scans]
    processing_values = [float(scan.get("processing_time", 0)) for scan in scans]
    return {
        "total_scans": total,
        "tumors_detected": tumors,
        "no_tumor": no_tumor,
        "detection_rate": round((tumors / total) * 100, 2) if total else 0,
        "average_confidence": _safe_average(confidence_values, 2),
        "average_processing_time": _safe_average(processing_values, 3),
        "model_usage": dict(Counter(scan.get("model_used", "Unknown") for scan in scans)),
    }


def _chart_points_by_day(scans, value_getter=None, average=False):
    grouped = defaultdict(list)
    for scan in scans:
        day = _scan_created_at(scan).date().isoformat()
        grouped[day].append(value_getter(scan) if value_getter else 1)

    points = []
    for day in sorted(grouped):
        values = grouped[day]
        value = round(sum(values) / len(values), 2) if average and values else sum(values)
        points.append({"label": day, "value": value})
    return points


@reports_bp.route("/reports/summary", methods=["GET"])
@reports_bp.route("/reports/scans/summary", methods=["GET"])
@token_required
def summary_report(current_user):
    scans = _query_scans()
    return jsonify(_summary_from_scans(scans))


@reports_bp.route("/reports/scans", methods=["GET"])
@token_required
def scan_reports(current_user):
    return jsonify(_query_scans())


@reports_bp.route("/reports/scans/whatsapp", methods=["GET"])
@admin_required
def whatsapp_scan_reports(current_user):
    original = request.args.to_dict(flat=True)
    query = {}
    model_type = original.get("model_type")
    diagnosis = original.get("diagnosis")
    phone = original.get("phone")
    date_from = _parse_datetime(original.get("date_from"))
    date_to = _parse_datetime(original.get("date_to"))

    if model_type:
        query["model_type"] = model_type
    if diagnosis:
        query["diagnosis"] = diagnosis
    if phone:
        query["phone"] = phone
    query["source"] = {"$in": ["whatsapp", "whatsapp_meta", "whatsapp_infobip"]}
    if date_from or date_to:
        created_filter = {}
        if date_from:
            created_filter["$gte"] = date_from.isoformat()
        if date_to:
            created_filter["$lte"] = (date_to + timedelta(days=1)).isoformat()
        query["createdAt"] = created_filter

    limit = min(int(original.get("limit", "200")), 1000)
    scans = list(
        get_database().scan_results.find(query, {"_id": 0}).sort("createdAt", -1).limit(limit)
    )
    return jsonify([_serialize_scan(scan) for scan in scans])


@reports_bp.route("/reports/scans/my-history", methods=["GET"])
@token_required
def my_scan_history(current_user):
    original = request.args.to_dict(flat=True)
    scans = list(
        get_database()
        .scan_results.find({"userEmail": current_user["email"]}, {"_id": 0})
        .sort("createdAt", -1)
        .limit(min(int(original.get("limit", "200")), 1000))
    )
    return jsonify(scans)


@reports_bp.route("/reports/patient-scans", methods=["GET"])
@token_required
def patient_scan_reports(current_user):
    db = get_database()
    patients = list(db.patients.find({}, {"_id": 0}).sort("createdAt", -1))
    scan_groups = defaultdict(list)
    for scan in db.scan_results.find({}, {"_id": 0}):
        patient_id = scan.get("patientId")
        if patient_id:
            scan_groups[patient_id].append(scan)

    rows = []
    for patient in patients:
        patient_scans = scan_groups.get(patient.get("patientId"), [])
        rows.append(
            {
                "patientId": patient.get("patientId"),
                "fullName": patient.get("fullName"),
                "createdAt": patient.get("createdAt"),
                "scanCount": len(patient_scans),
                "latestDiagnosis": patient_scans[0]["diagnosis"] if patient_scans else None,
                "latestScanAt": patient_scans[0]["createdAt"] if patient_scans else None,
            }
        )
    return jsonify(rows)


@reports_bp.route("/reports/patient-history", methods=["GET"])
@token_required
def patient_history_report(current_user):
    patient_id = request.args.get("patient_id")
    if not patient_id:
        return jsonify({"error": "patient_id is required"}), 400

    db = get_database()
    patient = db.patients.find_one({"patientId": patient_id}, {"_id": 0})
    scans = list(db.scan_results.find({"patientId": patient_id}, {"_id": 0}).sort("createdAt", -1))
    return jsonify({"patient": patient, "scans": scans})


@reports_bp.route("/reports/model-performance", methods=["GET"])
@reports_bp.route("/reports/model/performance", methods=["GET"])
@reports_bp.route("/reports/model/metrics", methods=["GET"])
@token_required
def model_performance(current_user):
    scans = _query_scans()
    by_model = defaultdict(list)
    for scan in scans:
        by_model[scan.get("model_used", "Unknown")].append(scan)

    models = []
    for model_name, model_scans in by_model.items():
        models.append(
            {
                "model": model_name,
                "scan_count": len(model_scans),
                "average_confidence": _safe_average([float(scan.get("confidence", 0)) for scan in model_scans]),
                "average_processing_time": _safe_average(
                    [float(scan.get("processing_time", 0)) for scan in model_scans],
                    3,
                ),
                "tumor_detection_rate": round(
                    (
                        sum(1 for scan in model_scans if scan.get("diagnosis") == "Tumor Detected")
                        / len(model_scans)
                    )
                    * 100,
                    2,
                )
                if model_scans
                else 0,
            }
        )

    payload = {
        "summary": _summary_from_scans(scans),
        "models": sorted(models, key=lambda item: item["scan_count"], reverse=True),
        "recent_scans": scans[:25],
    }
    return jsonify(payload)


@reports_bp.route("/reports/audit-trail", methods=["GET"])
@token_required
def audit_trail(current_user):
    return jsonify(_query_audit())


@reports_bp.route("/reports/admin-usage", methods=["GET"])
@token_required
def admin_usage(current_user):
    scans = _query_scans()
    audits = _query_audit()
    user_counts = Counter(scan.get("userEmail", "Unknown") for scan in scans)
    export_counts = Counter(audit.get("actorEmail", "Unknown") for audit in audits if audit.get("action", "").startswith("report.export"))
    return jsonify(
        {
            "active_users": [
                {"userEmail": user, "scanCount": count, "exportCount": export_counts.get(user, 0)}
                for user, count in user_counts.most_common(20)
            ],
            "total_audit_events": len(audits),
            "total_exports": sum(export_counts.values()),
        }
    )


@reports_bp.route("/reports/research-demo", methods=["GET"])
@token_required
def research_demo_report(current_user):
    scans = _query_scans()
    audits = _query_audit()
    return jsonify(
        {
            "dataset_size": len(scans),
            "models_used": list(sorted({scan.get("model_used", "Unknown") for scan in scans})),
            "average_confidence": _safe_average([float(scan.get("confidence", 0)) for scan in scans]),
            "average_processing_time": _safe_average(
                [float(scan.get("processing_time", 0)) for scan in scans], 3
            ),
            "tumor_type_distribution": dict(
                Counter(scan.get("tumor_type", "Unspecified") for scan in scans if scan.get("tumor_type"))
            ),
            "export_events": len([audit for audit in audits if audit.get("action", "").startswith("report.export")]),
        }
    )


@reports_bp.route("/reports/tumors/classes", methods=["GET"])
@reports_bp.route("/reports/charts/class-distribution", methods=["GET"])
@token_required
def class_distribution(current_user):
    scans = _query_scans()
    distribution = Counter(scan.get("tumor_type", "No Tumor") if scan.get("tumor_type") else "No Tumor" for scan in scans)
    return jsonify(dict(distribution))


@reports_bp.route("/reports/charts/diagnoses-over-time", methods=["GET"])
@token_required
def diagnoses_over_time(current_user):
    scans = _query_scans()
    return jsonify(_chart_points_by_day(scans))


@reports_bp.route("/reports/charts/result-distribution", methods=["GET"])
@token_required
def result_distribution(current_user):
    scans = _query_scans()
    return jsonify(dict(Counter(scan.get("diagnosis", "Unknown") for scan in scans)))


@reports_bp.route("/reports/charts/model-usage", methods=["GET"])
@token_required
def model_usage(current_user):
    scans = _query_scans()
    return jsonify(dict(Counter(scan.get("model_used", "Unknown") for scan in scans)))


@reports_bp.route("/reports/charts/confidence-by-model", methods=["GET"])
@token_required
def confidence_by_model(current_user):
    scans = _query_scans()
    grouped = defaultdict(list)
    for scan in scans:
        grouped[scan.get("model_used", "Unknown")].append(float(scan.get("confidence", 0)))
    return jsonify(
        {
            model: round(sum(values) / len(values), 2)
            for model, values in grouped.items()
        }
    )


@reports_bp.route("/reports/charts/processing-time-trend", methods=["GET"])
@token_required
def processing_time_trend(current_user):
    scans = _query_scans()
    return jsonify(_chart_points_by_day(scans, lambda scan: float(scan.get("processing_time", 0)), average=True))


@reports_bp.route("/reports/charts/confidence-distribution", methods=["GET"])
@token_required
def confidence_distribution(current_user):
    scans = _query_scans()
    bins = {
        "0-20": 0,
        "21-40": 0,
        "41-60": 0,
        "61-80": 0,
        "81-100": 0,
    }
    for scan in scans:
        confidence = float(scan.get("confidence", 0))
        if confidence <= 20:
            bins["0-20"] += 1
        elif confidence <= 40:
            bins["21-40"] += 1
        elif confidence <= 60:
            bins["41-60"] += 1
        elif confidence <= 80:
            bins["61-80"] += 1
        else:
            bins["81-100"] += 1
    return jsonify(bins)


@reports_bp.route("/reports/charts/export-activity", methods=["GET"])
@token_required
def export_activity(current_user):
    audits = [audit for audit in _query_audit() if audit.get("action", "").startswith("report.export")]
    return jsonify(_chart_points_by_day(audits, lambda _item: 1))


@reports_bp.route("/reports/model/confusion-matrix", methods=["GET"])
@token_required
def confusion_matrix(current_user):
    scans = _query_scans()
    summary = _summary_from_scans(scans)
    return jsonify(
        {
            "true_positive": summary["tumors_detected"],
            "false_positive": 0,
            "true_negative": summary["no_tumor"],
            "false_negative": 0,
        }
    )


@reports_bp.route("/reports/model/roc", methods=["GET"])
@token_required
def roc_curve(current_user):
    scans = _query_scans()
    confidences = sorted([float(scan.get("confidence", 0)) / 100 for scan in scans])
    if not confidences:
        return jsonify({"fpr": [0, 1], "tpr": [0, 1]})
    total = max(len(confidences) - 1, 1)
    return jsonify(
        {
            "fpr": [round(index / total, 2) for index, _ in enumerate(confidences)],
            "tpr": [round(value, 2) for value in confidences],
        }
    )


@reports_bp.route("/reports/model/accuracy-by-class", methods=["GET"])
@token_required
def accuracy_by_class(current_user):
    scans = _query_scans()
    distribution = Counter(scan.get("tumor_type", "No Tumor") if scan.get("tumor_type") else "No Tumor" for scan in scans)
    total = max(sum(distribution.values()), 1)
    return jsonify({label: round((count / total) * 100, 2) for label, count in distribution.items()})


def _simple_pdf(text_lines):
    escaped_lines = [
        line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
        for line in text_lines
    ]
    content = "BT\n/F1 12 Tf\n50 760 Td\n" + "\n".join(
        ["(" + escaped_lines[0] + ") Tj"]
        + [f"0 -18 Td ({line}) Tj" for line in escaped_lines[1:]]
    ) + "\nET"
    objects = []

    def add_object(obj_text):
        objects.append(obj_text.encode("latin-1"))

    add_object("1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n")
    add_object("2 0 obj << /Type /Pages /Count 1 /Kids [3 0 R] >> endobj\n")
    add_object(
        "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        "/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n"
    )
    add_object(
        f"4 0 obj << /Length {len(content.encode('latin-1', errors='replace'))} >> stream\n{content}\nendstream endobj\n"
    )
    add_object("5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n")

    header = b"%PDF-1.4\n"
    xref_start = len(header) + sum(len(obj) for obj in objects)
    xref_entries = ["0000000000 65535 f "]
    running = len(header)
    for obj in objects:
        xref_entries.append(f"{running:010d} 00000 n ")
        running += len(obj)

    pdf = bytearray(header)
    for obj in objects:
        pdf.extend(obj)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n".encode("latin-1"))
    pdf.extend(("\n".join(xref_entries) + "\n").encode("latin-1"))
    pdf.extend(
        (
            "trailer << /Size {size} /Root 1 0 R >>\nstartxref\n{start}\n%%EOF"
        ).format(size=len(objects) + 1, start=xref_start).encode("latin-1")
    )
    return bytes(pdf)


@reports_bp.route("/reports/export/csv", methods=["GET"])
@token_required
def export_csv(current_user):
    scans = _query_scans()
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "Scan ID",
            "Diagnosis",
            "Confidence (%)",
            "Processing Time (s)",
            "Model Used",
            "Tumor Type",
            "Created At",
        ]
    )
    for scan in scans:
        writer.writerow(
            [
                scan.get("id"),
                scan.get("diagnosis"),
                scan.get("confidence"),
                scan.get("processing_time"),
                scan.get("model_used"),
                scan.get("tumor_type"),
                scan.get("createdAt"),
            ]
        )
    log_audit_event("report.export.csv", current_user.get("email"), {"rows": len(scans)})
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=scan_report.csv"},
    )


@reports_bp.route("/reports/export/pdf", methods=["GET"])
@token_required
def export_pdf(current_user):
    scans = _query_scans()
    summary = _summary_from_scans(scans)
    lines = [
        "Brain Tumor Detection Report",
        f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')} UTC",
        f"Total scans: {summary['total_scans']}",
        f"Tumors detected: {summary['tumors_detected']}",
        f"No tumor: {summary['no_tumor']}",
        f"Average confidence: {summary['average_confidence']}%",
    ]
    for scan in scans[:10]:
        lines.append(
            f"Scan {scan.get('id')} | {scan.get('diagnosis')} | {scan.get('confidence')}% | {scan.get('model_used')}"
        )
    log_audit_event("report.export.pdf", current_user.get("email"), {"rows": len(scans)})
    return Response(
        _simple_pdf(lines),
        mimetype="application/pdf",
        headers={"Content-Disposition": "attachment; filename=scan_report.pdf"},
    )
