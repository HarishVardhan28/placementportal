from celery import Celery
from celery.schedules import crontab
from datetime import datetime, timedelta

celery = Celery('tasks')
celery.conf.update(
    broker_url='redis://localhost:6380/0',
    result_backend='redis://localhost:6380/0',
    task_track_started=True,
    task_serializer='json',
    result_serializer='json',
    accept_content=['json'],
    broker_connection_retry_on_startup=True,
    worker_prefetch_multiplier=1,
    task_always_eager=False,
    worker_pool='solo',
    worker_concurrency=1,
)

@celery.task
def send_daily_reminders():
    import sys
    import os
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from app import create_app
    from models import PlacementDrive

    app = create_app()
    with app.app_context():
        tomorrow = datetime.utcnow() + timedelta(days=1)
        drives = PlacementDrive.query.filter(
            PlacementDrive.application_deadline <= tomorrow,
            PlacementDrive.application_deadline > datetime.utcnow(),
            PlacementDrive.status == 'approved'
        ).all()
        for drive in drives:
            print(f"Reminder: {drive.job_title} deadline approaching")
        return f"Sent reminders for {len(drives)} drives"

@celery.task
def generate_monthly_report():
    import sys, os
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from app import create_app
    from models import PlacementDrive, Application, Student, Company

    app = create_app()
    with app.app_context():
        now = datetime.utcnow()
        last_month = now - timedelta(days=30)

        drives = PlacementDrive.query.filter(PlacementDrive.created_at >= last_month).count()
        applications = Application.query.filter(Application.application_date >= last_month).count()
        selected = Application.query.filter(
            Application.application_date >= last_month,
            Application.status == 'selected'
        ).count()
        total_students = Student.query.count()
        approved_companies = Company.query.filter_by(approval_status='approved').count()

        html = f"""
        <!DOCTYPE html><html><head><meta charset="UTF-8">
        <style>
            body {{ font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }}
            .container {{ background: white; border-radius: 8px; padding: 30px; max-width: 600px; margin: auto; }}
            h1 {{ color: #0066cc; border-bottom: 2px solid #0066cc; padding-bottom: 10px; }}
            .stat {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }}
            .stat-value {{ font-size: 1.4rem; font-weight: bold; color: #0066cc; }}
            .footer {{ margin-top: 20px; font-size: 0.85rem; color: #888; }}
        </style></head><body>
        <div class="container">
            <h1>Monthly Placement Report</h1>
            <p>Period: {last_month.strftime('%d %b %Y')} - {now.strftime('%d %b %Y')}</p>
            <div class="stat"><span>Drives Conducted</span><span class="stat-value">{drives}</span></div>
            <div class="stat"><span>Applications Received</span><span class="stat-value">{applications}</span></div>
            <div class="stat"><span>Students Selected</span><span class="stat-value">{selected}</span></div>
            <div class="stat"><span>Total Students</span><span class="stat-value">{total_students}</span></div>
            <div class="stat"><span>Active Companies</span><span class="stat-value">{approved_companies}</span></div>
            <div class="stat"><span>Placement Rate</span><span class="stat-value">{f"{(selected/total_students*100):.1f}%" if total_students > 0 else "0%"}</span></div>
            <div class="footer">Generated automatically on {now.strftime('%d %b %Y at %H:%M')} UTC by Placement Portal</div>
        </div></body></html>
        """

        import smtplib, os
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText
        from config import Config
        admin_email = Config.ADMIN_EMAIL
        smtp_host = Config.SMTP_HOST
        smtp_port = int(Config.SMTP_PORT)
        smtp_user = Config.SMTP_USER
        smtp_pass = Config.SMTP_PASS
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f'Monthly Placement Report - {now.strftime("%B %Y")}'
        msg['From'] = 'Admin@theiitm'
        msg['To'] = admin_email
        msg.attach(MIMEText(html, 'html'))
        for attempt in range(3):
            try:
                with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                    server.starttls()
                    server.login(smtp_user, smtp_pass)
                    server.send_message(msg)
                print(f'Monthly report emailed to {admin_email}')
                break
            except Exception as e:
                print(f'Email error (attempt {attempt+1}/3): {e}')
                if attempt < 2:
                    import time; time.sleep(3)

        return f'Monthly report generated - {drives} drives, {applications} applications, {selected} selected'

@celery.task
def test_task():
    return "Celery is working!"

@celery.task
def send_google_chat_reminder():
    import sys, os, json
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    try:
        import urllib.request
    except ImportError:
        pass

    from app import create_app
    from models import PlacementDrive

    WEBHOOK_URL = os.environ.get(
        'GOOGLE_CHAT_WEBHOOK',
        'https://chat.googleapis.com/v1/spaces/AAQAbRgTnUU/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=xiLT2koMmD_8aj2leMJilZLA38SRPVXQ3Sfm2IyxS_A'
    )

    app = create_app()
    with app.app_context():
        tomorrow = datetime.utcnow() + timedelta(days=1)
        drives = PlacementDrive.query.filter(
            PlacementDrive.application_deadline <= tomorrow,
            PlacementDrive.application_deadline > datetime.utcnow(),
            PlacementDrive.status == 'approved'
        ).all()

        if not drives:
            return 'No upcoming deadlines to remind about'

        lines = ['Placement Deadline Reminders']
        for d in drives:
            lines.append(f'- {d.job_title} - deadline: {d.application_deadline.strftime("%d %b %Y %H:%M")}')
        message = {'text': '\n'.join(lines)}

        try:
            data = json.dumps(message).encode('utf-8')
            req = urllib.request.Request(
                WEBHOOK_URL,
                data=data,
                headers={'Content-Type': 'application/json'}
            )
            urllib.request.urlopen(req, timeout=10)
            print(f'Google Chat reminder sent for {len(drives)} drives')
        except Exception as e:
            print(f'Webhook error (non-fatal): {e}')

        return f'Reminder sent for {len(drives)} drives'

@celery.task
def generate_placement_report():
    import sys
    import os
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from app import create_app
    from models import Application, PlacementDrive, Student, Company
    import time

    app = create_app()
    with app.app_context():
        time.sleep(3)
        total_students = Student.query.count()
        total_companies = Company.query.filter_by(approval_status='approved').count()
        total_drives = PlacementDrive.query.filter_by(status='approved').count()
        total_applications = Application.query.count()
        selected = Application.query.filter_by(status='selected').count()
        shortlisted = Application.query.filter_by(status='shortlisted').count()

        report = {
            'total_students': total_students,
            'total_companies': total_companies,
            'total_drives': total_drives,
            'total_applications': total_applications,
            'selected_students': selected,
            'shortlisted_students': shortlisted,
            'placement_rate': f"{(selected/total_students*100):.1f}%" if total_students > 0 else "0%",
            'timestamp': datetime.utcnow().isoformat()
        }

        print(f"\n=== PLACEMENT REPORT GENERATED ===")
        print(f"Total Students: {total_students}")
        print(f"Total Companies: {total_companies}")
        print(f"Total Drives: {total_drives}")
        print(f"Applications: {total_applications}")
        print(f"Selected: {selected}")
        print(f"Placement Rate: {report['placement_rate']}")
        print(f"==================================\n")

        return report

@celery.task
def export_student_applications_csv(student_id):
    import sys, os
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from app import create_app
    from models import Application, Student
    import csv, io

    app = create_app()
    with app.app_context():
        student = Student.query.get(student_id)
        applications = Application.query.filter_by(student_id=student_id).all()
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
        return {'csv': output.getvalue(), 'filename': f'{student.roll_number}_applications.csv'}


celery.conf.beat_schedule = {
    'daily-reminders': {
        'task': 'tasks.send_google_chat_reminder',
        'schedule': crontab(hour=9, minute=0)
    },
    'monthly-report': {
        'task': 'tasks.generate_monthly_report',
        'schedule': crontab(day_of_month=1, hour=0, minute=0)
    }
}
