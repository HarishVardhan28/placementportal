from flask import Blueprint, request, jsonify
from models import db, User, Student, Company
from functools import wraps
import jwt
from datetime import datetime, timedelta

auth_bp = Blueprint('auth', __name__)
SECRET_KEY = 'jwt-secret-key-placement-2024'

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token missing'}), 401
        try:
            token = token.split(' ')[1] if ' ' in token else token
            data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
            if not current_user or not current_user.is_active:
                return jsonify({'error': 'Invalid token'}), 401
        except:
            return jsonify({'error': 'Invalid token'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data.get('email')).first()
    
    if not user or not user.verify_password(data.get('password')):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    if not user.is_active:
        return jsonify({'error': 'Account deactivated'}), 403
    
    token = jwt.encode({
        'user_id': user.id,
        'role': user.role,
        'exp': datetime.utcnow() + timedelta(hours=24)
    }, SECRET_KEY, algorithm='HS256')
    
    return jsonify({
        'token': token,
        'role': user.role,
        'user_id': user.id
    })

@auth_bp.route('/register/student', methods=['POST'])
def register_student():
    data = request.json
    
    if User.query.filter_by(email=data.get('email')).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    user = User(email=data['email'], role='student')
    user.set_password(data['password'])
    db.session.add(user)
    db.session.flush()
    
    student = Student(
        user_id=user.id,
        full_name=data['full_name'],
        roll_number=data['roll_number'],
        branch=data['branch'],
        cgpa=float(data['cgpa']),
        year=int(data['year']),
        phone=data.get('phone', '')
    )
    db.session.add(student)
    db.session.commit()
    
    return jsonify({'message': 'Student registered successfully'}), 201

@auth_bp.route('/register/company', methods=['POST'])
def register_company():
    data = request.json
    
    if User.query.filter_by(email=data.get('email')).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    user = User(email=data['email'], role='company')
    user.set_password(data['password'])
    db.session.add(user)
    db.session.flush()
    
    company = Company(
        user_id=user.id,
        company_name=data['company_name'],
        hr_name=data['hr_name'],
        hr_contact=data['hr_contact'],
        website=data.get('website', ''),
        description=data.get('description', '')
    )
    db.session.add(company)
    db.session.commit()
    
    return jsonify({'message': 'Company registered successfully'}), 201
