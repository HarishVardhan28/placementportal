from flask import Blueprint, request, jsonify, send_file
from models import db, Student, PlacementDrive, Application, Interview, InterviewRound
from routes.auth import token_required
from datetime import datetime
from werkzeug.utils import secure_filename
import csv
import io
import os

student_bp = Blueprint('student', __name__)

def student_required(f):
    from functools import wraps
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user.role != 'student':
            return jsonify({'error': 'Student access required'}), 403
        return f(current_user, *args, **kwargs)
    return decorated

@student_bp.route('/profile', methods=['GET'])
@token_required
@student_required
def get_profile(current_user):
    student = Student.query.filter_by(user_id=current_user.id).first()
    return jsonify({
        'id': student.id,
        'full_name': student.full_name,
        'roll_number': student.roll_number,
        'branch': student.branch,
        'cgpa': student.cgpa,
        'year': student.year,
        'phone': student.phone,
        'email': current_user.email,
        'resume_filename': student.resume_filename
    })

@student_bp.route('/profile', methods=['PUT'])
@token_required
@student_required
def update_profile(current_user):
    student = Student.query.filter_by(user_id=current_user.id).first()
    data = request.json
    student.full_name = data.get('full_name', student.full_name)
    student.phone = data.get('phone', student.phone)
    student.branch = data.get('branch', student.branch)
    student.cgpa = float(data.get('cgpa', student.cgpa))
    student.year = int(data.get('year', student.year))
    db.session.commit()
    return jsonify({'message': 'Profile updated'})

@student_bp.route('/dashboard', methods=['GET'])
@token_required
@student_required
def dashboard(current_user):
    student = Student.query.filter_by(user_id=current_user.id).first()
    applications = Application.query.filter_by(student_id=student.id).all()
    return jsonify({
        'student_name': student.full_name,
        'total_applications': len(applications),
        'applications': [{
            'id': a.id,
            'company_name': a.drive.company.company_name,
            'job_title': a.drive.job_title,
            'status': a.status,
            'application_date': a.application_date.isoformat()
        } for a in applications]
    })

@student_bp.route('/applications', methods=['GET'])
@token_required
@student_required
def get_applications(current_user):
    import redis
    import json

    student = Student.query.filter_by(user_id=current_user.id).first()
    cache_key = f'student_apps:{student.id}'

    try:
        r = redis.Redis(host='localhost', port=6380, db=1, decode_responses=True)
        cached = r.get(cache_key)
        if cached:
            print(f"Cache HIT: {cache_key}")
            return jsonify(json.loads(cached))
    except Exception as e:
        print(f"Cache error: {e}")

    print(f"Cache MISS: {cache_key}")

    applications = Application.query.filter_by(student_id=student.id).all()

    result = []
    for a in applications:
        app_data = {
            'id': a.id,
            'drive_id': a.drive_id,
            'company_name': a.drive.company.company_name,
            'job_title': a.drive.job_title,
            'status': a.status,
            'final_result': a.final_result,
            'application_date': a.application_date.isoformat(),
            'interviews': [{
                'id': i.id,
                'interview_date': i.interview_date.isoformat(),
                'interview_mode': i.interview_mode,
                'location': i.location,
                'notes': i.notes,
                'status': i.status,
                'rounds': [{
                    'round_number': r.round_number,
                    'round_name': r.round_name,
                    'round_date': r.round_date.isoformat() if r.round_date else None,
                    'result': r.result,
                    'feedback': r.feedback
                } for r in i.rounds]
            } for i in a.interviews if i.status == 'approved']
        }
        result.append(app_data)

    try:
        r.setex(cache_key, 30, json.dumps(result))
    except Exception as e:
        print(f"Cache store error: {e}")

    return jsonify(result)

@student_bp.route('/applications/export', methods=['GET'])
@token_required
@student_required
def export_applications(current_user):
    student = Student.query.filter_by(user_id=current_user.id).first()
    applications = Application.query.filter_by(student_id=student.id).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Student ID', 'Company Name', 'Drive Title', 'Application Status', 'Final Result', 'Applied Date'])

    for a in applications:
        writer.writerow([
            student.roll_number,
            a.drive.company.company_name,
            a.drive.job_title,
            a.status,
            a.final_result or 'Pending',
            a.application_date.strftime('%Y-%m-%d')
        ])

    output.seek(0)
    return send_file(
        io.BytesIO(output.getvalue().encode()),
        mimetype='text/csv',
        as_attachment=True,
        download_name='applications.csv'
    )

@student_bp.route('/applications/export/async', methods=['POST'])
@token_required
@student_required
def export_applications_async(current_user):
    from tasks import export_student_applications_csv
    student = Student.query.filter_by(user_id=current_user.id).first()
    try:
        task = export_student_applications_csv.delay(student.id)
        return jsonify({'task_id': task.id})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@student_bp.route('/applications/export/status/<task_id>', methods=['GET'])
@token_required
@student_required
def export_task_status(current_user, task_id):
    from celery.result import AsyncResult
    from tasks import celery
    task = AsyncResult(task_id, app=celery)
    if task.state == 'SUCCESS':
        return jsonify({'state': 'SUCCESS', 'result': task.result})
    elif task.state == 'FAILURE':
        return jsonify({'state': 'FAILURE', 'error': str(task.info)})
    return jsonify({'state': task.state})

@student_bp.route('/resume/upload', methods=['POST'])
@token_required
@student_required
def upload_resume(current_user):
    if 'resume' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['resume']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not file.filename.lower().endswith('.pdf'):
        return jsonify({'error': 'Only PDF files allowed'}), 400

    student = Student.query.filter_by(user_id=current_user.id).first()
    student.resume_data = file.read()
    student.resume_filename = secure_filename(file.filename)
    db.session.commit()

    return jsonify({'message': 'Resume uploaded successfully', 'filename': student.resume_filename})

@student_bp.route('/resume/download/<int:student_id>', methods=['GET'])
def download_resume(student_id):
    student = Student.query.get_or_404(student_id)

    if not student.resume_data:
        return jsonify({'error': 'No resume uploaded'}), 404

    return send_file(
        io.BytesIO(student.resume_data),
        mimetype='application/pdf',
        as_attachment=False,
        download_name=f"{student.roll_number}_resume.pdf"
    )
