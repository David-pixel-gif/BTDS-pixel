from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from config import Config

# Initialize serializer with secret key
serializer = URLSafeTimedSerializer(Config.SECRET_KEY)

def generate_reset_token(user_id):
    """
    Generate a time-limited reset token for a user.
    
    :param user_id: The ID of the user requesting password reset
    :return: A secure, serialized token
    """
    return serializer.dumps(user_id, salt='reset-password')

def verify_reset_token(token, expiration=3600):
    """
    Verify and decode a password reset token.
    
    :param token: The token received from the user
    :param expiration: Token validity period in seconds (default: 1 hour)
    :return: The user ID if valid, None if invalid or expired
    """
    try:
        user_id = serializer.loads(token, salt='reset-password', max_age=expiration)
        return user_id
    except SignatureExpired:
        print("Error: Token has expired.")  # Log for debugging
        return None
    except BadSignature:
        print("Error: Invalid token signature.")  # Log for debugging
        return None
