from flask import Blueprint, request, jsonify
from models import db, Company, PlacementDrive, Application, Interview, InterviewRound
from routes.auth import token_required
from datetime import datetime

company_bp = Blueprint('company', __name__)

def company_required(f):
    from functools import wraps
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user.role != 'company':
            return jsonify({'error': 'Company access required'}), 403
        return f(current_user, *args, **kwargs)
    return decorated

@company_bp.route('/profile', methods=['GET'])
@token_required
@company_required
def get_profile(current_user):
    company = Company.query.filter_by(user_id=current_user.id).first()
    return jsonify({
        'id': company.id,
        'company_name': company.company_name,
        'hr_name': company.hr_name,
        'hr_contact': company.hr_contact,
        'website': company.website,
        'description': company.description,
        'approval_status': company.approval_status
    })

@company_bp.route('/profile', methods=['PUT'])
@token_required
@company_required
def update_profile(current_user):
    company = Company.query.filter_by(user_id=current_user.id).first()
    data = request.json
    company.hr_name = data.get('hr_name', company.hr_name)
    company.hr_contact = data.get('hr_contact', company.hr_contact)
    company.website = data.get('website', company.website)
    company.description = data.get('description', company.description)
    db.session.commit()
    return jsonify({'message': 'Profile updated'})

@company_bp.route('/dashboard', methods=['GET'])
@token_required
@company_required
def dashboard(current_user):
    company = Company.query.filter_by(user_id=current_user.id).first()
    drives = PlacementDrive.query.filter_by(company_id=company.id).all()
    
    drive_data = [{
        'id': d.id,
        'job_title': d.job_title,
        'status': d.status,
        'applicants': len(d.applications),
        'deadline': d.application_deadline.isoformat()
    } for d in drives]
    
    return jsonify({
        'company_name': company.company_name,
        'approval_status': company.approval_status,
        'total_drives': len(drives),
        'drives': drive_data
    })

@company_bp.route('/drives', methods=['POST'])
@token_required
@company_required
def create_drive(current_user):
    company = Company.query.filter_by(user_id=current_user.id).first()
    
    if company.approval_status != 'approved':
        return jsonify({'error': 'Company not approved'}), 403
    
    data = request.json
    drive = PlacementDrive(
        company_id=company.id,
        job_title=data['job_title'],
        job_description=data['job_description'],
        required_branch=data.get('required_branch', ''),
        min_cgpa=float(data.get('min_cgpa', 0)),
        required_year=data.get('required_year', ''),
        salary_package=data.get('salary_package', ''),
        application_deadline=datetime.fromisoformat(data['application_deadline'])
    )
    db.session.add(drive)
    db.session.commit()
    
    return jsonify({'message': 'Drive created successfully', 'id': drive.id}), 201

@company_bp.route('/drives/<int:drive_id>/applications', methods=['GET'])
@token_required
@company_required
def get_applications(current_user, drive_id):
    company = Company.query.filter_by(user_id=current_user.id).first()
    drive = PlacementDrive.query.get_or_404(drive_id)
    
    if drive.company_id != company.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    applications = Application.query.filter_by(drive_id=drive_id).all()
    return jsonify([{
        'id': a.id,
        'student_id': a.student.id,
        'student_name': a.student.full_name,
        'roll_number': a.student.roll_number,
        'branch': a.student.branch,
        'cgpa': a.student.cgpa,
        'year': a.student.year,
        'status': a.status,
        'application_date': a.application_date.isoformat(),
        'resume_filename': a.student.resume_filename
    } for a in applications])

@company_bp.route('/applications/<int:app_id>/status', methods=['PUT'])
@token_required
@company_required
def update_application_status(current_user, app_id):
    company = Company.query.filter_by(user_id=current_user.id).first()
    application = Application.query.get_or_404(app_id)
    
    if application.drive.company_id != company.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.json
    application.status = data['status']
    db.session.commit()
    
    return jsonify({'message': 'Status updated'})

@company_bp.route('/applications/<int:app_id>/request-interview', methods=['POST'])
@token_required
@company_required
def request_interview(current_user, app_id):
    company = Company.query.filter_by(user_id=current_user.id).first()
    application = Application.query.get_or_404(app_id)
    
    if application.drive.company_id != company.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.json
    interview = Interview(
        application_id=app_id,
        interview_date=datetime.fromisoformat(data['interview_date']),
        interview_mode=data['interview_mode'],
        location=data.get('location'),
        notes=data.get('notes'),
        status='pending'
    )
    db.session.add(interview)
    db.session.commit()
    return jsonify({'message': 'Interview request submitted for admin approval'})

@company_bp.route('/interviews', methods=['GET'])
@token_required
@company_required
def get_company_interviews(current_user):
    company = Company.query.filter_by(user_id=current_user.id).first()
    interviews = Interview.query.join(Application).join(PlacementDrive).filter(
        PlacementDrive.company_id == company.id,
        Interview.status == 'approved'
    ).all()
    return jsonify([{
        'id': i.id,
        'application_id': i.application_id,
        'student_name': i.application.student.full_name,
        'student_roll': i.application.student.roll_number,
        'job_title': i.application.drive.job_title,
        'interview_date': i.interview_date.isoformat(),
        'interview_mode': i.interview_mode,
        'location': i.location,
        'status': i.status,
        'rounds': [{
            'id': r.id,
            'round_number': r.round_number,
            'round_name': r.round_name,
            'round_date': r.round_date.isoformat() if r.round_date else None,
            'result': r.result,
            'feedback': r.feedback
        } for r in i.rounds]
    } for i in interviews])

@company_bp.route('/interviews/<int:interview_id>/rounds', methods=['POST'])
@token_required
@company_required
def add_interview_round(current_user, interview_id):
    company = Company.query.filter_by(user_id=current_user.id).first()
    interview = Interview.query.get_or_404(interview_id)
    
    if interview.application.drive.company_id != company.id or interview.status != 'approved':
        return jsonify({'error': 'Unauthorized or interview not approved'}), 403
    
    data = request.json
    round = InterviewRound(
        interview_id=interview_id,
        round_number=data['round_number'],
        round_name=data['round_name'],
        round_date=datetime.fromisoformat(data['round_date']) if data.get('round_date') else None
    )
    db.session.add(round)
    db.session.commit()
    return jsonify({'message': 'Round added', 'id': round.id}), 201

@company_bp.route('/rounds/<int:round_id>/result', methods=['PUT'])
@token_required
@company_required
def update_round_result(current_user, round_id):
    company = Company.query.filter_by(user_id=current_user.id).first()
    round = InterviewRound.query.get_or_404(round_id)
    
    if round.interview.application.drive.company_id != company.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.json
    round.result = data['result']
    round.feedback = data.get('feedback')
    
    if data['result'] == 'rejected':
        round.interview.application.status = 'rejected'
        round.interview.application.final_result = 'rejected'
    
    db.session.commit()
    return jsonify({'message': 'Round result updated'})

@company_bp.route('/applications/<int:app_id>/final-result', methods=['PUT'])
@token_required
@company_required
def update_final_result(current_user, app_id):
    company = Company.query.filter_by(user_id=current_user.id).first()
    application = Application.query.get_or_404(app_id)
    
    if application.drive.company_id != company.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.json
    application.final_result = data['final_result']
    application.status = data['final_result']
    db.session.commit()
    return jsonify({'message': 'Final result updated'})
