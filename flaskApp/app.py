from flask import Flask, request, jsonify, send_file, Response, session
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_migrate import Migrate
from flask_session import Session
from models import db, Permission, Role, User, RolePermissions, ScanResult, ActivityLog, ScanLog
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.utils import img_to_array
import numpy as np
from PIL import Image
import time
import traceback
from datetime import datetime, timedelta
from io import StringIO
import csv
import jwt
import os

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = 'cairocoders-ednalan'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///flaskdb.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SESSION_TYPE'] = 'filesystem'  # Ensure SESSION_TYPE is set correctly

# Initialize Bcrypt, CORS, and Migrate
bcrypt = Bcrypt(app)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})
db.init_app(app)
migrate = Migrate(app, db)
Session(app)

# Load the Keras model with corrected path handling
MODEL_PATH = "D:/MySecondOpinion/BrainTumor10Epo.h5"
try:
    keras_model = load_model(MODEL_PATH)
    print("Model loaded successfully.")
except Exception as e:
    print(f"Error loading model: {e}")
    keras_model = None

# Utility Function for database commits
def log_and_commit(instance):
    db.session.add(instance)
    db.session.commit()

# Create tables within the application context
with app.app_context():
    db.create_all()

# Home route
@app.route("/")
def hello_world():
    return jsonify(message="Hello, World!")

# ---------------- User Registration Route ----------------

@app.route('/create_user', methods=['POST'])
def create_user():
    data = request.json
    username = data.get('username')  # ✅ Ensure username is included
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({"error": "Username, email, and password are required"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 400

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    new_user = User(username=username, email=email, password_hash=hashed_password)  # ✅ Include `username`
    log_and_commit(new_user)

    return jsonify({"message": "User created successfully!"}), 201



# ---------------- Login Route ----------------
JWT_SECRET = "your_jwt_secret_key"
JWT_ALGORITHM = "HS256"
JWT_EXP_DELTA_SECONDS = 3600

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        user = User.query.filter_by(email=email).first()
        
        if user and bcrypt.check_password_hash(user.password_hash, password):  # ✅ Fix attribute reference
            token = jwt.encode({"user_id": user.id, "exp": datetime.utcnow() + timedelta(seconds=JWT_EXP_DELTA_SECONDS)}, JWT_SECRET, algorithm=JWT_ALGORITHM)
            return jsonify({"access_token": token, "message": "Login successful"}), 200
        return jsonify({"error": "Invalid email or password"}), 401
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500

@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully"}), 200

# ---------------- Diagnosis Route ----------------
@app.route('/diagnoses', methods=['POST'], endpoint='diagnoses_unique')
def diagnoses():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    try:
        start_time = time.time()
        image = Image.open(file.stream).convert("RGB")
        image = image.resize((64, 64))
        image_array = img_to_array(image) / 255.0
        image_array = np.expand_dims(image_array, axis=0)

        if keras_model is None:
            return jsonify({"error": "Model not loaded. Please contact support."}), 500

        predictions = keras_model.predict(image_array)
        confidence = float(predictions[0][0])
        label = "Tumor Detected" if confidence > 0.5 else "No Tumor Detected"
        processing_time = time.time() - start_time

        scan_result = ScanResult(diagnosis=label, confidence=confidence, processing_time=processing_time)
        log_and_commit(scan_result)

        return jsonify({
            "diagnosis": label,
            "confidence": f"{confidence * 100:.2f}%",
            "processing_time": f"{processing_time:.2f} seconds"
        })
    except Exception as e:
        return jsonify({"error": f"Failed to process the image. Details: {str(e)}"}), 500

# ---------------- Print Routes ----------------
print(app.url_map)

# ---------------- Run Application ----------------
if __name__ == "__main__":
    app.run(debug=True)
