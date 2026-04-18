import json
import os
from datetime import date, datetime
from threading import RLock
from types import SimpleNamespace

import mysql.connector
from mysql.connector import errorcode


_connection = None
_db = None
_db_lock = RLock()


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


TABLE_COLUMNS = {
    "counters": {"name", "value"},
    "permissions": {"id", "name"},
    "roles": {"id", "name", "permissions"},
    "users": {
        "id",
        "username",
        "email",
        "password_hash",
        "password",
        "roles",
        "qualifications",
        "department",
        "phone",
        "createdAt",
    },
    "patients": {
        "id",
        "patientId",
        "fullName",
        "age",
        "gender",
        "contactNumber",
        "medicalHistory",
        "radiologyNotes",
        "latestMRI",
        "specialistRecommendations",
        "createdBy",
        "createdAt",
    },
    "scan_results": {
        "id",
        "diagnosis",
        "confidence",
        "processing_time",
        "recommendations",
        "userEmail",
        "createdAt",
        "tumor_detected",
        "tumor_type",
        "tumor_type_confidence",
        "detections",
        "model_type",
        "model_used",
        "source",
        "phone",
        "patientId",
        "generated_media_filename",
    },
    "audit_trail": {"id", "action", "actorEmail", "status", "details", "createdAt"},
    "whatsapp_sessions": {"phone", "state", "selected_model", "updatedAt"},
}


JSON_COLUMNS = {
    "roles": {"permissions"},
    "users": {"roles"},
    "scan_results": {"detections"},
    "audit_trail": {"details"},
}


FIELD_ALIASES = {
    "_id": "id",
    "userEmail": "userEmail",
    "actorEmail": "actorEmail",
    "patientId": "patientId",
    "createdAt": "createdAt",
}


def _env(name, default=""):
    return os.getenv(name, default).strip()


def _mysql_config():
    config = {
        "host": _env("MYSQL_HOST", "127.0.0.1"),
        "port": int(_env("MYSQL_PORT", "3306")),
        "user": _env("MYSQL_USER", "root"),
        "password": os.getenv("MYSQL_PASSWORD", ""),
        "database": _env("MYSQL_DATABASE", "brain_tumor_detection"),
        "autocommit": True,
    }
    if _env("MYSQL_SSL_CA"):
        config["ssl_ca"] = _env("MYSQL_SSL_CA")
    if _env("MYSQL_SSL_DISABLED"):
        config["ssl_disabled"] = _env("MYSQL_SSL_DISABLED").lower() in {"1", "true", "yes"}
    return config


def _server_config():
    config = _mysql_config()
    config.pop("database", None)
    return config


def _json_default(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    return str(value)


def _json_dumps(value):
    return json.dumps(value, default=_json_default)


def _json_loads(value, fallback):
    if value is None:
        return fallback
    if isinstance(value, (dict, list)):
        return value
    try:
        return json.loads(value)
    except (TypeError, ValueError):
        return fallback


def _normalize_scalar(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, bool):
        return int(value)
    return value


def _column(table, field):
    if field == "_id" and table == "counters":
        return "name"

    column = FIELD_ALIASES.get(field, field)
    if column not in TABLE_COLUMNS[table]:
        return None
    return column


def _serialize_value(table, column, value):
    numeric_columns = {
        "id",
        "value",
        "age",
        "confidence",
        "processing_time",
        "tumor_type_confidence",
        "tumor_detected",
    }
    if column in numeric_columns and value == "":
        return None
    if column in JSON_COLUMNS.get(table, set()):
        return _json_dumps(value if value is not None else [])
    return _normalize_scalar(value)


def _deserialize_row(table, row):
    if row is None:
        return None

    payload = dict(row)
    for column in JSON_COLUMNS.get(table, set()):
        if column in payload:
            payload[column] = _json_loads(payload[column], [] if column != "details" else {})

    if "tumor_detected" in payload and payload["tumor_detected"] is not None:
        payload["tumor_detected"] = bool(payload["tumor_detected"])

    if "id" in payload:
        payload["_id"] = payload["id"]

    return serialize_document(payload)


def _apply_projection(row, projection):
    if not row or not projection:
        return row

    excluded = {key for key, value in projection.items() if value == 0}
    if not excluded:
        included = {key for key, value in projection.items() if value}
        return {key: value for key, value in row.items() if key in included}

    return {key: value for key, value in row.items() if key not in excluded}


def _build_where(table, query):
    if not query:
        return "", []

    parts = []
    params = []

    for field, value in query.items():
        if field == "$or":
            or_parts = []
            for item in value:
                clause, clause_params = _build_where(table, item)
                if clause:
                    or_parts.append(clause.removeprefix(" WHERE "))
                    params.extend(clause_params)
            if or_parts:
                parts.append("(" + " OR ".join(or_parts) + ")")
            continue

        column = _column(table, field)
        if not column:
            continue

        if isinstance(value, dict):
            for op, op_value in value.items():
                if op == "$gte":
                    parts.append(f"`{column}` >= %s")
                    params.append(_normalize_scalar(op_value))
                elif op == "$lte":
                    parts.append(f"`{column}` <= %s")
                    params.append(_normalize_scalar(op_value))
                elif op == "$in":
                    values = list(op_value or [])
                    if not values:
                        parts.append("1 = 0")
                    else:
                        placeholders = ", ".join(["%s"] * len(values))
                        parts.append(f"`{column}` IN ({placeholders})")
                        params.extend(_normalize_scalar(item) for item in values)
        else:
            if column in JSON_COLUMNS.get(table, set()):
                parts.append(f"JSON_CONTAINS(`{column}`, %s)")
                params.append(_json_dumps(value))
            else:
                parts.append(f"`{column}` = %s")
                params.append(_normalize_scalar(value))

    if not parts:
        return "", []

    return " WHERE " + " AND ".join(parts), params


class MySqlCursor:
    def __init__(self, collection, query=None, projection=None):
        self.collection = collection
        self.query = query or {}
        self.projection = projection
        self.sort_field = None
        self.sort_direction = -1
        self.limit_value = None

    def sort(self, field, direction=1):
        self.sort_field = field
        self.sort_direction = direction
        return self

    def limit(self, value):
        self.limit_value = int(value)
        return self

    def __iter__(self):
        return iter(self.collection._select(self.query, self.projection, self.sort_field, self.sort_direction, self.limit_value))


class MySqlCollection:
    def __init__(self, database, table):
        self.database = database
        self.table = table

    def create_index(self, *_args, **_kwargs):
        return None

    def find(self, query=None, projection=None):
        return MySqlCursor(self, query, projection)

    def find_one(self, query=None, projection=None):
        rows = self._select(query or {}, projection, limit_value=1)
        return rows[0] if rows else None

    def insert_one(self, document):
        payload = {key: value for key, value in dict(document).items() if _column(self.table, key)}
        columns = [_column(self.table, key) for key in payload]
        values = [_serialize_value(self.table, column, payload[key]) for key, column in zip(payload, columns)]
        placeholders = ", ".join(["%s"] * len(columns))
        names = ", ".join(f"`{column}`" for column in columns)

        with _db_lock:
            with self.database.connection.cursor() as cursor:
                cursor.execute(
                    f"INSERT INTO `{self.table}` ({names}) VALUES ({placeholders})",
                    values,
                )
                inserted_id = cursor.lastrowid

        return SimpleNamespace(inserted_id=inserted_id)

    def update_one(self, query, update, upsert=False, **_kwargs):
        existing = self.find_one(query)
        if existing:
            self._update_where(query, update)
            return SimpleNamespace(matched_count=1, modified_count=1, upserted_id=None)

        if not upsert:
            return SimpleNamespace(matched_count=0, modified_count=0, upserted_id=None)

        document = {}
        for key, value in (query or {}).items():
            if key.startswith("$") or isinstance(value, dict):
                continue
            document[key] = value
        document.update(update.get("$setOnInsert", {}))
        document.update(update.get("$set", {}))
        self.insert_one(document)
        return SimpleNamespace(matched_count=0, modified_count=0, upserted_id=document.get("id"))

    def update_many(self, query, update, array_filters=None, **_kwargs):
        if self.table == "users" and "roles.$[role]" in update.get("$set", {}):
            old_role = None
            if array_filters:
                old_role = array_filters[0].get("role")
            new_role = update["$set"]["roles.$[role]"]
            users = list(self.find(query))
            for user in users:
                roles = [new_role if role == old_role else role for role in user.get("roles", [])]
                self.update_one({"id": user["id"]}, {"$set": {"roles": roles}})
            return SimpleNamespace(matched_count=len(users), modified_count=len(users))

        self._update_where(query, update)
        return SimpleNamespace(matched_count=0, modified_count=0)

    def delete_one(self, query):
        where_sql, params = _build_where(self.table, query or {})
        with _db_lock:
            with self.database.connection.cursor() as cursor:
                cursor.execute(f"DELETE FROM `{self.table}`{where_sql} LIMIT 1", params)
                return SimpleNamespace(deleted_count=cursor.rowcount)

    def find_one_and_update(self, query, update, upsert=False, return_document=None, **_kwargs):
        existing = self.find_one(query)
        if existing:
            self._update_where(query, update)
        elif upsert:
            document = {
                key: value
                for key, value in (query or {}).items()
                if not key.startswith("$") and not isinstance(value, dict)
            }
            document.update(update.get("$setOnInsert", {}))
            if "$inc" in update:
                for key, value in update["$inc"].items():
                    document[key] = value
            self.insert_one(document)
        return self.find_one(query)

    def _select(self, query=None, projection=None, sort_field=None, sort_direction=-1, limit_value=None):
        where_sql, params = _build_where(self.table, query or {})
        order_sql = ""
        sort_column = _column(self.table, sort_field) if sort_field else None
        if sort_column:
            direction = "DESC" if int(sort_direction) < 0 else "ASC"
            order_sql = f" ORDER BY `{sort_column}` {direction}"

        limit_sql = ""
        if limit_value is not None:
            limit_sql = " LIMIT %s"
            params.append(int(limit_value))

        with _db_lock:
            with self.database.connection.cursor(dictionary=True) as cursor:
                cursor.execute(f"SELECT * FROM `{self.table}`{where_sql}{order_sql}{limit_sql}", params)
                rows = cursor.fetchall()

        return [_apply_projection(_deserialize_row(self.table, row), projection) for row in rows]

    def _update_where(self, query, update):
        assignments = []
        params = []

        for key, value in update.get("$set", {}).items():
            column = _column(self.table, key)
            if not column:
                continue
            assignments.append(f"`{column}` = %s")
            params.append(_serialize_value(self.table, column, value))

        for key in update.get("$unset", {}).keys():
            column = _column(self.table, key)
            if not column:
                continue
            assignments.append(f"`{column}` = NULL")

        for key, value in update.get("$inc", {}).items():
            column = _column(self.table, key)
            if not column:
                continue
            assignments.append(f"`{column}` = COALESCE(`{column}`, 0) + %s")
            params.append(value)

        if not assignments:
            return

        where_sql, where_params = _build_where(self.table, query or {})
        params.extend(where_params)
        with _db_lock:
            with self.database.connection.cursor() as cursor:
                cursor.execute(
                    f"UPDATE `{self.table}` SET {', '.join(assignments)}{where_sql}",
                    params,
                )


class MySqlDatabase:
    def __init__(self, connection, name):
        self.connection = connection
        self.name = name

    def __getattr__(self, table):
        if table not in TABLE_COLUMNS:
            raise AttributeError(table)
        return MySqlCollection(self, table)

    def __getitem__(self, table):
        return getattr(self, table)


def _connect(create_database=False):
    config = _server_config() if create_database else _mysql_config()
    return mysql.connector.connect(**config)


def _ensure_database_exists():
    config = _mysql_config()
    database_name = config["database"]
    try:
        connection = _connect()
        connection.close()
        return
    except mysql.connector.Error as exc:
        if exc.errno != errorcode.ER_BAD_DB_ERROR:
            if exc.errno == errorcode.ER_ACCESS_DENIED_ERROR:
                raise RuntimeError("MySQL access denied. Check MYSQL_USER and MYSQL_PASSWORD.") from exc
            raise

    try:
        connection = _connect(create_database=True)
        with connection.cursor() as cursor:
            cursor.execute(
                f"CREATE DATABASE IF NOT EXISTS `{database_name}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
        connection.close()
    except mysql.connector.Error as exc:
        if exc.errno == errorcode.ER_ACCESS_DENIED_ERROR:
            raise RuntimeError("MySQL access denied. Check MYSQL_USER and MYSQL_PASSWORD.") from exc
        raise


def get_database():
    global _connection, _db

    if _db is not None:
        try:
            _connection.ping(reconnect=True, attempts=1, delay=0)
        except mysql.connector.Error:
            close_database()
        else:
            return _db

    _ensure_database_exists()
    _connection = _connect()
    _db = MySqlDatabase(_connection, _mysql_config()["database"])
    ensure_schema()
    seed_defaults()
    return _db


def close_database():
    global _connection, _db

    if _connection is not None and _connection.is_connected():
        _connection.close()

    _connection = None
    _db = None


def ensure_schema():
    statements = [
        """
        CREATE TABLE IF NOT EXISTS counters (
            name VARCHAR(191) PRIMARY KEY,
            value INT NOT NULL DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS permissions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(191) NOT NULL UNIQUE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS roles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(191) NOT NULL UNIQUE,
            permissions JSON NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(191) NOT NULL UNIQUE,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash TEXT NULL,
            password TEXT NULL,
            roles JSON NOT NULL,
            qualifications TEXT NULL,
            department VARCHAR(191) NULL,
            phone VARCHAR(64) NULL,
            createdAt VARCHAR(64) NULL,
            INDEX idx_users_email (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS patients (
            id INT AUTO_INCREMENT PRIMARY KEY,
            patientId VARCHAR(64) NOT NULL UNIQUE,
            fullName VARCHAR(255) NOT NULL,
            age INT NULL,
            gender VARCHAR(64) NULL,
            contactNumber VARCHAR(64) NULL,
            medicalHistory TEXT NULL,
            radiologyNotes TEXT NULL,
            latestMRI TEXT NULL,
            specialistRecommendations TEXT NULL,
            createdBy VARCHAR(255) NULL,
            createdAt VARCHAR(64) NULL,
            INDEX idx_patients_createdAt (createdAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS scan_results (
            id INT PRIMARY KEY,
            diagnosis VARCHAR(191) NOT NULL,
            confidence DOUBLE NULL,
            processing_time DOUBLE NULL,
            recommendations TEXT NULL,
            userEmail VARCHAR(255) NULL,
            createdAt VARCHAR(64) NULL,
            tumor_detected TINYINT(1) NULL,
            tumor_type VARCHAR(191) NULL,
            tumor_type_confidence DOUBLE NULL,
            detections JSON NULL,
            model_type VARCHAR(64) NULL,
            model_used VARCHAR(191) NULL,
            source VARCHAR(64) NULL,
            phone VARCHAR(64) NULL,
            patientId VARCHAR(64) NULL,
            generated_media_filename VARCHAR(255) NULL,
            INDEX idx_scans_createdAt (createdAt),
            INDEX idx_scans_userEmail (userEmail),
            INDEX idx_scans_model_type (model_type),
            INDEX idx_scans_patientId (patientId),
            INDEX idx_scans_source (source),
            INDEX idx_scans_phone (phone)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS audit_trail (
            id INT AUTO_INCREMENT PRIMARY KEY,
            action VARCHAR(191) NOT NULL,
            actorEmail VARCHAR(255) NULL,
            status VARCHAR(64) NOT NULL,
            details JSON NULL,
            createdAt VARCHAR(64) NULL,
            INDEX idx_audit_createdAt (createdAt),
            INDEX idx_audit_actorEmail (actorEmail),
            INDEX idx_audit_action (action)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS whatsapp_sessions (
            phone VARCHAR(64) PRIMARY KEY,
            state VARCHAR(64) NULL,
            selected_model VARCHAR(64) NULL,
            updatedAt VARCHAR(64) NULL,
            INDEX idx_whatsapp_updatedAt (updatedAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
    ]

    with _db_lock:
        with _connection.cursor() as cursor:
            for statement in statements:
                cursor.execute(statement)


def ensure_indexes():
    ensure_schema()


def seed_defaults():
    db = get_database() if _db is None else _db

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
            if isinstance(value, (datetime, date)):
                serialized[key] = value.isoformat()
            elif isinstance(value, list):
                serialized[key] = [serialize_document(item) for item in value]
            elif isinstance(value, dict):
                serialized[key] = serialize_document(value)
            else:
                serialized[key] = value
        return serialized

    return document


def object_id(value):
    return int(value)
