from database import DEFAULT_PERMISSIONS, DEFAULT_ROLES, object_id, serialize_document


COLLECTIONS = {
    "users": "users",
    "roles": "roles",
    "permissions": "permissions",
    "patients": "patients",
    "scan_results": "scan_results",
    "counters": "counters",
}


__all__ = [
    "COLLECTIONS",
    "DEFAULT_PERMISSIONS",
    "DEFAULT_ROLES",
    "object_id",
    "serialize_document",
]
