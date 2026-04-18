from flask import Blueprint, jsonify


legacy_bp = Blueprint("legacy", __name__)


@legacy_bp.route("/legacy-status", methods=["GET"])
def legacy_status():
    return jsonify(
        {
            "message": "Legacy Flask route module retained for compatibility.",
            "active_backend": "backend/app.py",
            "database": "mysql",
        }
    )
