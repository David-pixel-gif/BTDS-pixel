import os
from datetime import datetime

import certifi
from bson import ObjectId
from pymongo import MongoClient


_client = None
_db = None


DEFAULT_PERMISSIONS = [
    {"name": "view_reports"},
    {"name": "manage_roles"},
    {"name": "manage_patients"},
    {"name": "run_diagnosis"},
]


DEFAULT_ROLES = [
    {
        "name": "Admin",
        "permissions": [
            "view_reports",
            "manage_roles",
            "manage_patients",
            "run_diagnosis",
        ],
    },
    {
        "name": "Doctor",
        "permissions": [
            "view_reports",
            "manage_patients",
            "run_diagnosis",
        ],
    },
    {
        "name": "Radiologist",
        "permissions": [
            "view_reports",
            "run_diagnosis",
        ],
    },
]


def get_database():
    global _client, _db

    if _db is not None:
        return _db

    mongo_uri = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017")
    database_name = os.getenv("MONGO_DB_NAME", "brain_tumor_detection")
    client_kwargs = {}

    if mongo_uri.startswith("mongodb+srv://"):
        client_kwargs["tlsCAFile"] = certifi.where()

    _client = MongoClient(mongo_uri, **client_kwargs)
    _db = _client[database_name]
    ensure_indexes()
    seed_defaults()
    return _db


def close_database():
    global _client, _db

    if _client is not None:
        _client.close()

    _client = None
    _db = None


def ensure_indexes():
    db = _client[os.getenv("MONGO_DB_NAME", "brain_tumor_detection")]
    db.users.create_index("email", unique=True)
    db.users.create_index("username", unique=True)
    db.roles.create_index("name", unique=True)
    db.permissions.create_index("name", unique=True)
    db.patients.create_index("patientId", unique=True)
    db.scan_results.create_index("createdAt")
    db.scan_results.create_index("userEmail")
    db.scan_results.create_index("model_type")
    db.scan_results.create_index("patientId")
    db.audit_trail.create_index("createdAt")
    db.audit_trail.create_index("actorEmail")
    db.audit_trail.create_index("action")
    db.whatsapp_sessions.create_index("phone", unique=True)
    db.whatsapp_sessions.create_index("updatedAt")


def seed_defaults():
    db = _client[os.getenv("MONGO_DB_NAME", "brain_tumor_detection")]

    for permission in DEFAULT_PERMISSIONS:
        db.permissions.update_one(
            {"name": permission["name"]},
            {"$setOnInsert": permission},
            upsert=True,
        )

    for role in DEFAULT_ROLES:
        db.roles.update_one(
            {"name": role["name"]},
            {"$setOnInsert": role},
            upsert=True,
        )


def serialize_document(document):
    if document is None:
        return None

    if isinstance(document, list):
        return [serialize_document(item) for item in document]

    if isinstance(document, dict):
        serialized = {}
        for key, value in document.items():
            if isinstance(value, ObjectId):
                serialized[key] = str(value)
            elif isinstance(value, datetime):
                serialized[key] = value.isoformat()
            elif isinstance(value, list):
                serialized[key] = [
                    str(item) if isinstance(item, ObjectId) else item
                    for item in value
                ]
            else:
                serialized[key] = value
        return serialized

    return document


def object_id(value):
    if isinstance(value, ObjectId):
        return value
    return ObjectId(value)
