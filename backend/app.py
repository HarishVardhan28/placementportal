from flask import Flask, jsonify
from flask_cors import CORS
from models import db, User
from config import Config
import os

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    CORS(app, resources={r"/api/*": {"origins": "*", "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"], "allow_headers": "*"}})
    
    db.init_app(app)
    
    with app.app_context():
        db.create_all()
        initialize_admin()
    
    from routes.auth import auth_bp
    from routes.admin import admin_bp
    from routes.company import company_bp
    from routes.student import student_bp
    from routes.drive import drive_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(company_bp, url_prefix='/api/company')
    app.register_blueprint(student_bp, url_prefix='/api/student')
    app.register_blueprint(drive_bp, url_prefix='/api/drives')
    
    @app.route('/')
    def index():
        return jsonify({'message': 'Placement Portal API'})
    
    @app.route('/api/test/celery')
    def test_celery():
        from tasks import test_task
        try:
            result = test_task.delay()
            return jsonify({
                'status': 'success',
                'message': 'Celery task queued',
                'task_id': result.id
            })
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 500
    
    @app.route('/api/test/redis')
    def test_redis():
        try:
            import redis
            r = redis.Redis(host='localhost', port=6380, db=0)
            r.set('test_key', 'Redis is working!')
            value = r.get('test_key').decode('utf-8')
            r.delete('test_key')
            return jsonify({
                'status': 'success',
                'message': value
            })
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 500
    
    return app

def initialize_admin():
    admin = User.query.filter_by(role='admin').first()
    if not admin:
        admin = User(email='admin@institute.edu', role='admin')
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()
        print('Admin user created successfully')

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
