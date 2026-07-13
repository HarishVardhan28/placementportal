from flask import Blueprint, request, jsonify
from models import db, User, Student, Company, PlacementDrive, Application, Interview, InterviewRound
from routes.auth import token_required
from sqlalchemy import func, case
from flask_cors import cross_origin
from datetime import datetime
from cache import cache_result, clear_cache

admin_bp = Blueprint('admin', __name__)

def admin_required(f):
    from functools import wraps
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(current_user, *args, **kwargs)
    return decorated

@admin_bp.route('/dashboard', methods=['GET'])
@token_required
@admin_required
def dashboard(current_user):
    total_students = Student.query.count()
    total_companies = Company.query.count()
    total_drives = PlacementDrive.query.count()
    return jsonify({
        'total_students': total_students,
        'total_companies': total_companies,
        'total_drives': total_drives
    })

@admin_bp.route('/companies', methods=['GET'])
@token_required
@admin_required
def get_companies(current_user):
    search = request.args.get('search', '')
    companies = Company.query.join(User).filter(
        Company.company_name.contains(search) | User.email.contains(search)
    ).all()
    return jsonify([{
        'id': c.id,
        'company_name': c.company_name,
        'hr_name': c.hr_name,
        'hr_contact': c.hr_contact,
        'website': c.website,
        'approval_status': c.approval_status,
        'email': c.user.email,
        'is_active': c.user.is_active
    } for c in companies])

@admin_bp.route('/companies/<int:company_id>/approve', methods=['PUT'])
@token_required
@admin_required
def approve_company(current_user, company_id):
    company = Company.query.get_or_404(company_id)
    company.approval_status = 'approved'
    db.session.commit()
    return jsonify({'message': 'Company approved'})

@admin_bp.route('/companies/<int:company_id>/reject', methods=['PUT'])
@token_required
@admin_required
def reject_company(current_user, company_id):
    company = Company.query.get_or_404(company_id)
    company.approval_status = 'rejected'
    db.session.commit()
    return jsonify({'message': 'Company rejected'})

@admin_bp.route('/companies/<int:company_id>/toggle', methods=['PUT'])
@token_required
@admin_required
def toggle_company(current_user, company_id):
    company = Company.query.get_or_404(company_id)
    company.user.is_active = not company.user.is_active
    db.session.commit()
    return jsonify({'message': 'Company status updated'})

@admin_bp.route('/students', methods=['GET'])
@token_required
@admin_required
def get_students(current_user):
    search = request.args.get('search', '')
    students = Student.query.join(User).filter(
        Student.full_name.contains(search) |
        Student.roll_number.contains(search) |
        User.email.contains(search)
    ).all()
    return jsonify([{
        'id': s.id,
        'full_name': s.full_name,
        'roll_number': s.roll_number,
        'branch': s.branch,
        'cgpa': s.cgpa,
        'year': s.year,
        'email': s.user.email,
        'is_active': s.user.is_active,
        'resume_filename': s.resume_filename
    } for s in students])

@admin_bp.route('/students/<int:student_id>/toggle', methods=['PUT'])
@token_required
@admin_required
def toggle_student(current_user, student_id):
    student = Student.query.get_or_404(student_id)
    student.user.is_active = not student.user.is_active
    db.session.commit()
    return jsonify({'message': 'Student status updated'})

@admin_bp.route('/drives', methods=['GET'])
@token_required
@admin_required
def get_drives(current_user):
    try:
        search = request.args.get('search', '')
        query = PlacementDrive.query.join(Company)
        if search:
            query = query.filter(
                PlacementDrive.job_title.contains(search) |
                Company.company_name.contains(search)
            )
        drives = query.all()
        result = []
        for d in drives:
            try:
                result.append({
                    'id': d.id,
                    'job_title': d.job_title,
                    'company_name': d.company.company_name if d.company else 'N/A',
                    'status': d.status,
                    'application_deadline': d.application_deadline.isoformat(),
                    'applicants': len(d.applications) if d.applications else 0
                })
            except Exception as e:
                print(f"Error processing drive {d.id}: {str(e)}")
                continue
        return jsonify(result)
    except Exception as e:
        print(f"Error in get_drives: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/drives/<int:drive_id>/approve', methods=['PUT'])
@token_required
@admin_required
def approve_drive(current_user, drive_id):
    drive = PlacementDrive.query.get_or_404(drive_id)
    drive.status = 'approved'
    db.session.commit()
    clear_cache('admin_stats:*')
    return jsonify({'message': 'Drive approved'})

@admin_bp.route('/drives/<int:drive_id>/reject', methods=['PUT'])
@token_required
@admin_required
def reject_drive(current_user, drive_id):
    drive = PlacementDrive.query.get_or_404(drive_id)
    drive.status = 'rejected'
    db.session.commit()
    return jsonify({'message': 'Drive rejected'})

@admin_bp.route('/drives/<int:drive_id>/deactivate', methods=['PUT'])
@token_required
@admin_required
def deactivate_drive(current_user, drive_id):
    drive = PlacementDrive.query.get_or_404(drive_id)
    drive.status = 'deactivated'
    db.session.commit()
    return jsonify({'message': 'Drive deactivated'})

@admin_bp.route('/applications', methods=['GET'])
@token_required
@admin_required
def get_all_applications(current_user):
    applications = Application.query.all()
    return jsonify([{
        'id': a.id,
        'student_name': a.student.full_name,
        'company_name': a.drive.company.company_name,
        'job_title': a.drive.job_title,
        'status': a.status,
        'application_date': a.application_date.isoformat()
    } for a in applications])

@admin_bp.route('/drives/<int:drive_id>/applications', methods=['GET'])
@token_required
@admin_required
def get_drive_applications(current_user, drive_id):
    applications = Application.query.filter_by(drive_id=drive_id).all()
    result = []
    for a in applications:
        app_data = {
            'id': a.id,
            'student_id': a.student.id,
            'student_name': a.student.full_name,
            'roll_number': a.student.roll_number,
            'branch': a.student.branch,
            'cgpa': a.student.cgpa,
            'status': a.status,
            'final_result': a.final_result,
            'application_date': a.application_date.isoformat(),
            'resume_filename': a.student.resume_filename,
            'interviews': [{
                'id': i.id,
                'interview_date': i.interview_date.isoformat(),
                'interview_mode': i.interview_mode,
                'location': i.location,
                'notes': i.notes,
                'status': i.status,
                'rounds': [{
                    'id': r.id,
                    'round_number': r.round_number,
                    'round_name': r.round_name,
                    'round_date': r.round_date.isoformat() if r.round_date else None,
                    'result': r.result,
                    'feedback': r.feedback
                } for r in i.rounds]
            } for i in a.interviews]
        }
        result.append(app_data)
    return jsonify(result)

@admin_bp.route('/applications/<int:app_id>/final-result', methods=['PUT'])
@token_required
@admin_required
def update_final_result_admin(current_user, app_id):
    data = request.get_json()
    application = Application.query.get_or_404(app_id)
    application.final_result = data['final_result']
    if data['final_result'] == 'selected':
        application.status = 'selected'
    db.session.commit()
    return jsonify({'message': 'Final result updated'})

@admin_bp.route('/applications/<int:app_id>/schedule-interview', methods=['POST'])
@token_required
@admin_required
def schedule_interview(current_user, app_id):
    data = request.get_json()
    application = Application.query.get_or_404(app_id)
    interview = Interview(
        application_id=app_id,
        interview_date=datetime.fromisoformat(data['interview_date']),
        interview_mode=data['interview_mode'],
        location=data.get('location'),
        notes=data.get('notes'),
        status='approved'
    )
    db.session.add(interview)
    db.session.commit()
    return jsonify({'message': 'Interview scheduled successfully'})

@admin_bp.route('/interviews/pending', methods=['GET'])
@token_required
@admin_required
def get_pending_interviews(current_user):
    interviews = Interview.query.filter_by(status='pending').all()
    return jsonify([{
        'id': i.id,
        'student_name': i.application.student.full_name,
        'company_name': i.application.drive.company.company_name,
        'job_title': i.application.drive.job_title,
        'interview_date': i.interview_date.isoformat(),
        'interview_mode': i.interview_mode,
        'location': i.location,
        'notes': i.notes
    } for i in interviews])

@admin_bp.route('/interviews/<int:interview_id>/approve', methods=['PUT'])
@token_required
@admin_required
def approve_interview(current_user, interview_id):
    interview = Interview.query.get_or_404(interview_id)
    interview.status = 'approved'
    db.session.commit()
    return jsonify({'message': 'Interview approved'})

@admin_bp.route('/interviews/<int:interview_id>/reject', methods=['PUT'])
@token_required
@admin_required
def reject_interview(current_user, interview_id):
    interview = Interview.query.get_or_404(interview_id)
    interview.status = 'rejected'
    db.session.commit()
    return jsonify({'message': 'Interview rejected'})

@admin_bp.route('/interviews/all', methods=['GET'])
@token_required
@admin_required
def get_all_interviews(current_user):
    interviews = Interview.query.all()
    return jsonify([{
        'id': i.id,
        'application_id': i.application_id,
        'student_name': i.application.student.full_name,
        'student_roll': i.application.student.roll_number,
        'company_name': i.application.drive.company.company_name,
        'job_title': i.application.drive.job_title,
        'interview_date': i.interview_date.isoformat(),
        'interview_mode': i.interview_mode,
        'location': i.location,
        'notes': i.notes,
        'status': i.status,
        'application_status': i.application.status,
        'final_result': i.application.final_result,
        'rounds': [{
            'id': r.id,
            'round_number': r.round_number,
            'round_name': r.round_name,
            'round_date': r.round_date.isoformat() if r.round_date else None,
            'result': r.result,
            'feedback': r.feedback
        } for r in i.rounds]
    } for i in interviews])

@admin_bp.route('/reports/statistics', methods=['GET'])
@cross_origin()
@token_required
@admin_required
def get_statistics(current_user):
    import redis
    import json

    try:
        r = redis.Redis(host='localhost', port=6380, db=1, decode_responses=True)
        cache_key = 'admin_stats'
        cached = r.get(cache_key)
        if cached:
            print(f"Cache HIT: {cache_key}")
            return jsonify(json.loads(cached))
    except Exception as e:
        print(f"Cache error: {e}")

    print(f"Cache MISS: admin_stats")

    total_students = Student.query.count()
    total_companies = Company.query.count()
    approved_companies = Company.query.filter_by(approval_status='approved').count()
    pending_companies = Company.query.filter_by(approval_status='pending').count()

    total_drives = PlacementDrive.query.count()
    approved_drives = PlacementDrive.query.filter_by(status='approved').count()
    pending_drives = PlacementDrive.query.filter_by(status='pending').count()
    deactivated_drives = PlacementDrive.query.filter_by(status='deactivated').count()

    total_applications = Application.query.count()
    applied = Application.query.filter_by(status='applied').count()
    shortlisted = Application.query.filter_by(status='shortlisted').count()
    selected = Application.query.filter_by(status='selected').count()
    rejected = Application.query.filter_by(status='rejected').count()

    total_interviews = Interview.query.count()
    pending_interviews = Interview.query.filter_by(status='pending').count()
    approved_interviews = Interview.query.filter_by(status='approved').count()

    branch_stats = db.session.query(
        Student.branch,
        func.count(Application.id).label('applications'),
        func.sum(case((Application.status == 'selected', 1), else_=0)).label('placements')
    ).outerjoin(Application, Student.id == Application.student_id).group_by(Student.branch).all()

    top_companies = []
    if total_applications > 0:
        top_companies = db.session.query(
            Company.company_name,
            func.count(Application.id).label('total_applications')
        ).select_from(Company).join(PlacementDrive, Company.id == PlacementDrive.company_id).join(Application, PlacementDrive.id == Application.drive_id).group_by(Company.company_name).order_by(func.count(Application.id).desc()).limit(5).all()

    result = {
        'overview': {
            'total_students': total_students,
            'total_companies': total_companies,
            'approved_companies': approved_companies,
            'pending_companies': pending_companies,
            'total_drives': total_drives,
            'approved_drives': approved_drives,
            'pending_drives': pending_drives,
            'deactivated_drives': deactivated_drives,
            'total_applications': total_applications,
            'total_interviews': total_interviews,
            'pending_interviews': pending_interviews,
            'approved_interviews': approved_interviews
        },
        'application_status': {
            'applied': applied,
            'shortlisted': shortlisted,
            'selected': selected,
            'rejected': rejected
        },
        'branch_statistics': [{
            'branch': b.branch,
            'applications': int(b.applications or 0),
            'placements': int(b.placements or 0)
        } for b in branch_stats],
        'top_companies': [{
            'company_name': c.company_name,
            'applications': c.total_applications
        } for c in top_companies]
    }

    try:
        r.setex(cache_key, 60, json.dumps(result))
    except Exception as e:
        print(f"Cache store error: {e}")

    return jsonify(result)

@admin_bp.route('/tasks/generate-report', methods=['POST'])
@token_required
@admin_required
def trigger_generate_report(current_user):
    from tasks import generate_placement_report
    try:
        task = generate_placement_report.delay()
        return jsonify({'status': 'success', 'message': 'Report generation task queued', 'task_id': task.id})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@admin_bp.route('/tasks/send-reminders', methods=['POST'])
@token_required
@admin_required
def trigger_send_reminders(current_user):
    from tasks import send_google_chat_reminder
    try:
        task = send_google_chat_reminder.delay()
        return jsonify({'status': 'success', 'message': 'Daily reminder task queued', 'task_id': task.id})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@admin_bp.route('/tasks/monthly-report', methods=['POST'])
@token_required
@admin_required
def trigger_monthly_report(current_user):
    from tasks import generate_monthly_report
    try:
        task = generate_monthly_report.delay()
        return jsonify({'status': 'success', 'message': 'Monthly report task queued', 'task_id': task.id})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@admin_bp.route('/tasks/status/<task_id>', methods=['GET'])
@token_required
@admin_required
def get_task_status(current_user, task_id):
    from celery.result import AsyncResult
    from tasks import celery
    try:
        task = AsyncResult(task_id, app=celery)
        if task.state == 'PENDING':
            response = {'state': task.state, 'status': 'Task is waiting...'}
        elif task.state == 'SUCCESS':
            response = {'state': task.state, 'result': task.result}
        elif task.state == 'FAILURE':
            response = {'state': task.state, 'error': str(task.info)}
        else:
            response = {'state': task.state, 'status': str(task.info)}
        return jsonify(response)
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@admin_bp.route('/notifications', methods=['GET'])
@token_required
@admin_required
def get_admin_notifications(current_user):
    notifs = []

    for c in Company.query.all():
        notifs.append({
            'id': f'company-reg-{c.id}',
            'title': f'Company Registered: {c.company_name}',
            'message': f'{c.company_name} registered - status: {c.approval_status}',
            'timestamp': c.user.created_at.isoformat()
        })

    for d in PlacementDrive.query.all():
        notifs.append({
            'id': f'drive-{d.id}',
            'title': f'Drive Posted: {d.job_title}',
            'message': f'{d.company.company_name} posted "{d.job_title}" - status: {d.status}',
            'timestamp': d.created_at.isoformat()
        })

    for a in Application.query.all():
        notifs.append({
            'id': f'app-{a.id}',
            'title': f'New Application: {a.student.full_name}',
            'message': f'{a.student.full_name} applied to "{a.drive.job_title}" at {a.drive.company.company_name}',
            'timestamp': a.application_date.isoformat()
        })

    for i in Interview.query.all():
        notifs.append({
            'id': f'interview-{i.id}',
            'title': f'Interview Request: {i.application.student.full_name}',
            'message': f'{i.application.drive.company.company_name} requested interview for {i.application.student.full_name} - {i.status}',
            'timestamp': i.created_at.isoformat()
        })

    for a in Application.query.filter(Application.final_result != None).all():
        notifs.append({
            'id': f'result-{a.id}',
            'title': f'Final Result Set: {a.student.full_name}',
            'message': f'{a.student.full_name} - {a.drive.job_title} at {a.drive.company.company_name}: {a.final_result}',
            'timestamp': a.application_date.isoformat()
        })

    notifs.sort(key=lambda x: x['timestamp'], reverse=True)
    return jsonify(notifs[:50])

@admin_bp.route('/cache/stats', methods=['GET'])
@token_required
@admin_required
def get_cache_stats(current_user):
    from cache import get_cache_stats
    try:
        stats = get_cache_stats()
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/cache/clear', methods=['POST'])
@token_required
@admin_required
def clear_all_cache(current_user):
    try:
        clear_cache('*')
        return jsonify({'message': 'Cache cleared successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
