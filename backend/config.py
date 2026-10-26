import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()
basedir = os.path.abspath(os.path.dirname(__file__))

_upload_env = os.getenv('UPLOAD_FOLDER', 'uploads')
_upload_path = _upload_env if os.path.isabs(_upload_env) else os.path.abspath(os.path.join(basedir, _upload_env))

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'nigraniai-dev-secret-key-32bytes-secure-2026')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'nigraniai-jwt-secret-key-32bytes-secure-2026')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = _upload_path
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 52428800))
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')

class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///nigraniai.db')

class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig,
}
