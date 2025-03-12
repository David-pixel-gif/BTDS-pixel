from flask import Blueprint, request, jsonify
from models import db, User
from utils import generate_reset_token, verify_reset_token
from flask_jwt_extended import create_access_token, jwt_required
from flask_mail import Mail, Message

auth = Blueprint('auth', __name__)

@auth.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already in use'}), 400
    user = User(username=data['username'], email=data['email'])
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'User created successfully'}), 201

@auth.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    if user and user.check_password(data['password']):
        token = create_access_token(identity=user.id)
        return jsonify({'token': token}), 200
    return jsonify({'error': 'Invalid credentials'}), 401

@auth.route('/reset_password_request', methods=['POST'])
def reset_password_request():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    if user:
        token = generate_reset_token(user.id)
        # Send email logic here (use Flask-Mail)
        return jsonify({'message': 'Password reset email sent'}), 200
    return jsonify({'error': 'Email not found'}), 404

@auth.route('/reset_password/<token>', methods=['POST'])
def reset_password(token):
    user_id = verify_reset_token(token)
    if not user_id:
        return jsonify({'error': 'Invalid or expired token'}), 400
    data = request.get_json()
    user = User.query.get(user_id)
    user.set_password(data['password'])
    db.session.commit()
    return jsonify({'message': 'Password reset successful'}), 200
