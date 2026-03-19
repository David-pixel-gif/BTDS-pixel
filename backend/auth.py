from functools import wraps

from flask import jsonify, request

from config import Config
from database import get_database, object_id, serialize_document
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer


serializer = URLSafeTimedSerializer(Config.SECRET_KEY)


def create_access_token(user_id):
    return serializer.dumps({"user_id": str(user_id)}, salt="access-token")


def decode_access_token(token):
    return serializer.loads(
        token,
        salt="access-token",
        max_age=Config.TOKEN_MAX_AGE_SECONDS,
    )


def token_required(func):
    @wraps(func)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Token is missing"}), 401

        token = auth_header.split(" ", 1)[1].strip()

        try:
            payload = decode_access_token(token)
            user = get_database().users.find_one({"_id": object_id(payload["user_id"])})
            if not user:
                return jsonify({"error": "User not found"}), 401
        except (BadSignature, SignatureExpired, KeyError, ValueError):
            return jsonify({"error": "Invalid or expired token"}), 401

        return func(serialize_document(user), *args, **kwargs)

    decorated._auth_required = True
    return decorated


def admin_required(func):
    @wraps(func)
    @token_required
    def decorated(current_user, *args, **kwargs):
        roles = current_user.get("roles", [])
        if "Admin" not in roles:
            return jsonify({"error": "Admin access is required"}), 403
        return func(current_user, *args, **kwargs)

    decorated._auth_required = True
    return decorated
