import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'placement-portal-secret-key-2024'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///placement_portal.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = 'jwt-secret-key-placement-2024'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    UPLOAD_FOLDER = 'uploads'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024
    REDIS_URL = 'redis://localhost:6380/0'
    CELERY_BROKER_URL = 'redis://localhost:6380/0'
    CELERY_RESULT_BACKEND = 'redis://localhost:6380/0'
    SMTP_HOST = os.environ.get('SMTP_HOST', 'sandbox.smtp.mailtrap.io')
    SMTP_PORT = os.environ.get('SMTP_PORT', '2525')
    SMTP_USER = os.environ.get('SMTP_USER', 'a600b3683bf863')
    SMTP_PASS = os.environ.get('SMTP_PASS', 'eae07880f1930e')
    ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@institute.edu')
