from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

from config import Config


serializer = URLSafeTimedSerializer(Config.SECRET_KEY)


def generate_reset_token(user_id):
    return serializer.dumps({"user_id": user_id}, salt="reset-password")


def verify_reset_token(token, expiration=3600):
    try:
        payload = serializer.loads(
            token,
            salt="reset-password",
            max_age=expiration,
        )
        return payload["user_id"]
    except (SignatureExpired, BadSignature, KeyError):
        return None
