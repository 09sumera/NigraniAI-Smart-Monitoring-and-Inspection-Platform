from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config import config
import os

db = SQLAlchemy()
jwt = JWTManager()

def create_app(env='development'):
    app = Flask(__name__)
    app.config.from_object(config[env])

    db.init_app(app)
    jwt.init_app(app)
    CORS(app, origins=[app.config['FRONTEND_URL'], 'http://localhost:3000', 'http://localhost:5173'], supports_credentials=True)

    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'photos'), exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'videos'), exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'documents'), exist_ok=True)

    # Import and register all models so SQLAlchemy sees them
    from app.models import user, project, inspection, evidence, alert, audit

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.projects import projects_bp
    from app.routes.inspections import inspections_bp
    from app.routes.assignments import assignments_bp
    from app.routes.evidence import evidence_bp
    from app.routes.analytics import analytics_bp
    from app.routes.alerts import alerts_bp
    from app.routes.users import users_bp
    from app.routes.reports import reports_bp
    from app.routes.monitoring import monitoring_bp
    from app.routes.audit import audit_bp
    from app.routes.settings import settings_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(projects_bp, url_prefix='/api/projects')
    app.register_blueprint(inspections_bp, url_prefix='/api/inspections')
    app.register_blueprint(assignments_bp, url_prefix='/api/assignments')
    app.register_blueprint(evidence_bp, url_prefix='/api/evidence')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(alerts_bp, url_prefix='/api/alerts')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(monitoring_bp, url_prefix='/api/monitoring')
    app.register_blueprint(audit_bp, url_prefix='/api/audit-logs')
    app.register_blueprint(settings_bp, url_prefix='/api/settings')

    @app.route('/')
    def index():
        return {'message': 'NigraniAI API v1.0', 'status': 'running', 'docs': '/api/docs'}

    @app.route('/api/health')
    def health_check():
        upload_folder = app.config.get('UPLOAD_FOLDER')
        return {
            'status': 'healthy',
            'upload_folder': upload_folder,
            'upload_folder_exists': os.path.isdir(upload_folder) if upload_folder else False,
            'photos_folder_exists': os.path.isdir(os.path.join(upload_folder, 'photos')) if upload_folder else False,
        }

    return app
