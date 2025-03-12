# extensions.py
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_migrate import Migrate

# Initialize extensions without tying them to an app
db = SQLAlchemy()
bcrypt = Bcrypt()
migrate = Migrate()
