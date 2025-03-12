from flaskApp import db
from flaskApp import User  # Adjust based on where the User model is located
from flaskApp import app   # If you need app context
from werkzeug.security import generate_password_hash

with app.app_context():
    users = User.query.all()
    for user in users:
        # Check if the password is already hashed
        if not user.password.startswith('$2b$'):
            user.password = generate_password_hash(user.password)
            print(f"Updated password for user: {user.email}")
    db.session.commit()