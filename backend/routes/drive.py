from flask import Blueprint, request, jsonify
from models import db, PlacementDrive, Application, Student
from routes.auth import token_required
from datetime import datetime

drive_bp = Blueprint('drive', __name__)

@drive_bp.route('', methods=['GET'])
@token_required
def get_drives(current_user):
    search = request.args.get('search', '')
    drives = PlacementDrive.query.filter(
        PlacementDrive.status == 'approved',
        PlacementDrive.application_deadline > datetime.utcnow()
    ).filter(
        PlacementDrive.job_title.contains(search)
    ).all()

    if current_user.role == 'student':
        student = Student.query.filter_by(user_id=current_user.id).first()
        eligible_drives = []
        for d in drives:
            if d.required_branch and d.required_branch.strip():
                allowed_branches = [b.strip().lower() for b in d.required_branch.split(',')]
                if student.branch.lower() not in allowed_branches:
                    continue
            if d.min_cgpa and student.cgpa < d.min_cgpa:
                continue
            if d.required_year and str(d.required_year).strip():
                allowed_years = [y.strip() for y in str(d.required_year).split(',')]
                if str(student.year) not in allowed_years:
                    continue
            eligible_drives.append(d)
        drives = eligible_drives

    result = [{
        'id': d.id,
        'job_title': d.job_title,
        'job_description': d.job_description,
        'company_name': d.company.company_name,
        'required_branch': d.required_branch,
        'min_cgpa': d.min_cgpa,
        'required_year': d.required_year,
        'salary_package': d.salary_package,
        'application_deadline': d.application_deadline.isoformat(),
        'status': d.status
    } for d in drives]

    return jsonify(result)

@drive_bp.route('/<int:drive_id>', methods=['GET'])
@token_required
def get_drive(current_user, drive_id):
    drive = PlacementDrive.query.get_or_404(drive_id)
    return jsonify({
        'id': drive.id,
        'job_title': drive.job_title,
        'job_description': drive.job_description,
        'company_name': drive.company.company_name,
        'required_branch': drive.required_branch,
        'min_cgpa': drive.min_cgpa,
        'required_year': drive.required_year,
        'salary_package': drive.salary_package,
        'application_deadline': drive.application_deadline.isoformat(),
        'status': drive.status
    })

@drive_bp.route('/<int:drive_id>/apply', methods=['POST'])
@token_required
def apply_to_drive(current_user, drive_id):
    if current_user.role != 'student':
        return jsonify({'error': 'Only students can apply'}), 403

    student = Student.query.filter_by(user_id=current_user.id).first()

    if not student.resume_filename:
        return jsonify({'error': 'Please upload your resume before applying'}), 400

    drive = PlacementDrive.query.get_or_404(drive_id)

    if drive.status != 'approved':
        return jsonify({'error': 'Drive not approved'}), 400

    if drive.application_deadline < datetime.utcnow():
        return jsonify({'error': 'Application deadline passed'}), 400

    existing = Application.query.filter_by(
        student_id=student.id,
        drive_id=drive_id
    ).first()

    if existing:
        return jsonify({'error': 'Already applied'}), 400

    if drive.required_branch and drive.required_branch.strip():
        allowed_branches = [b.strip().lower() for b in drive.required_branch.split(',')]
        if student.branch.lower() not in allowed_branches:
            return jsonify({'error': f'Branch requirement not met. Required: {drive.required_branch}'}), 400

    if drive.min_cgpa and student.cgpa < drive.min_cgpa:
        return jsonify({'error': f'CGPA requirement not met. Required: {drive.min_cgpa}'}), 400

    if drive.required_year and str(drive.required_year).strip():
        allowed_years = [y.strip() for y in str(drive.required_year).split(',')]
        if str(student.year) not in allowed_years:
            return jsonify({'error': f'Year requirement not met. Required: {drive.required_year}'}), 400

    application = Application(student_id=student.id, drive_id=drive_id)
    db.session.add(application)
    db.session.commit()

    try:
        import redis
        r = redis.Redis(host='localhost', port=6380, db=1, decode_responses=True)
        r.delete(f'student_apps:{student.id}')
    except Exception:
        pass

    return jsonify({'message': 'Application submitted successfully'}), 201
