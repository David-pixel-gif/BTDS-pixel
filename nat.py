
from flask import Flask, jsonify, request, session
from flask_pymongo import PyMongo
import bcrypt
from flask_jwt_extended import JWTManager, create_access_token
from flask_cors import CORS, cross_origin
import certifi

app = Flask(__name__)
app.secret_key = 'secret_key'
app.config['JWT_SECRET_KEY'] = 'this-is-secret_key'

# Initialize JWTManager and CORS
jwt = JWTManager(app)
CORS(app)

app.config['MONGO_URI'] = 'mongodb+srv://hacksterdusk:2020@cluster0.ocdhp.mongodb.net/EWebsiteFlask'

# Initialize PyMongo with SSL/TLS settings
try:
    mongo = PyMongo(app, tls=True, tlsCAFile=certifi.where())
    print("Successfully connected to MongoDB!")
except Exception as e:
    print("Failed to connect to MongoDB:", e)