from pymongo import MongoClient
import certifi

# MongoDB URI
uri = 'mongodb+srv://hacksterdusk:yourpassword@cluster0.ocdhp.mongodb.net/EWebsiteFlask?retryWrites=true&w=majority'

try:
    print("Attempting to connect to MongoDB...")
    # Initialize MongoClient with basic TLS options
    client = MongoClient(
        uri,
        tls=True,
        tlsCAFile=certifi.where(),
        tlsAllowInvalidCertificates=True  # Bypass SSL verification
    )
    db_names = client.list_database_names()
    print("Connected to MongoDB! Databases:", db_names)
except Exception as e:
    print("Failed to connect:", e)
