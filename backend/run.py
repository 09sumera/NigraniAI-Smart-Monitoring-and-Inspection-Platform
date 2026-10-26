
import os

from app import create_app, db

app = create_app(os.getenv("FLASK_ENV", "development"))


def initialize_database():
    with app.app_context():
        # Register all SQLAlchemy models before creating tables.
        from app import models as app_models # noqa: F401

        db.create_all()

        from app.utils.auth_utils import ensure_demo_accounts
        ensure_demo_accounts()

        print("Database tables and demo accounts initialized.")


if __name__ == "__main__":
    initialize_database()
    app.run(host="0.0.0.0", port=5000, debug=False)
