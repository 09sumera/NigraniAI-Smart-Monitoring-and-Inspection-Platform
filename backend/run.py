import os
from app import create_app, db

app = create_app(os.getenv('FLASK_ENV', 'development'))

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print("Database tables initialized.")
        from app.utils.auth_utils import ensure_demo_accounts
        ensure_demo_accounts()
        print("Demo accounts and roles verified.")
    app.run(host='0.0.0.0', port=5000, debug=True)
