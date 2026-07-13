# Placement Portal

A web application for managing campus placement activities. Three roles — Admin, Company, and Student — each get their own dashboard and set of actions.

## What each role can do

**Admin**
- Dashboard showing total students, companies, and drives
- Approve or reject company registrations
- Approve or reject placement drives
- Search students and companies
- Deactivate/reactivate any user account
- View all applications and interviews
- Trigger background jobs and view Redis cache stats

**Company**
- Register a company profile (goes live after admin approval)
- Create placement drives once approved
- View and manage student applications
- Shortlist students, request interviews, manage interview rounds
- Set final selection results

**Student**
- Self-register and log in
- Browse approved drives filtered by eligibility (branch, CGPA, year)
- Apply to drives (resume upload required)
- Track application status and interview schedules
- Export application history as CSV

## Tech stack

- Backend: Flask, SQLAlchemy, JWT
- Frontend: Vue.js 3 (CDN), Bootstrap 5
- Database: SQLite
- Background jobs: Celery + Redis (Redis for Windows)

## Running the project

This project uses Redis for Windows as the Redis server. Everything can be started with a single script.

### Prerequisites

- Python 3.8+
- Redis for Windows installed at `C:\Program Files\Redis\`
- pip dependencies installed

### Install dependencies

```
cd backend
pip install -r requirements.txt
```

### Start everything

From the project root, just run:

```
START_ALL.bat
```

This does the following in order:

1. Starts Redis server on port 6380
2. Starts the Flask backend at `http://localhost:5000`
3. Starts the Celery worker (solo pool, single concurrency)
4. Starts Celery Beat for scheduled tasks
5. Starts the frontend server at `http://localhost:8080`

If you want to start things manually instead:

```
"C:\Program Files\Redis\redis-server.exe" --port 6380
```

```
cd backend
python app.py
```

```
cd backend
set PYTHONPATH=e:\projects\placementportal\backend
celery -A tasks worker --loglevel=info --pool=solo --concurrency=1
```

```
cd backend
set PYTHONPATH=e:\projects\placementportal\backend
celery -A tasks beat --loglevel=info
```

```
cd frontend
python -m http.server 8080
```

### Database

The database is created automatically the first time you run `python app.py`. No manual setup needed. The admin account is also created on first run.

The `.gitignore` excludes `*.db` files so the database never gets committed.

## Default admin login

- Email: admin@institute.edu
- Password: admin123

## Project structure

```
placement-portal/
├── backend/
│   ├── app.py
│   ├── config.py
│   ├── models.py
│   ├── tasks.py
│   ├── cache.py
│   ├── requirements.txt
│   └── routes/
│       ├── auth.py
│       ├── admin.py
│       ├── company.py
│       ├── student.py
│       └── drive.py
└── frontend/
    ├── index.html
    └── src/
        ├── app.js
        ├── styles.css
        └── components/
            ├── CompanyDashboard.js
            └── StudentDashboard.js
```

## API endpoints

**Auth**
- POST `/api/auth/login`
- POST `/api/auth/register/student`
- POST `/api/auth/register/company`

**Admin**
- GET `/api/admin/dashboard`
- GET `/api/admin/companies`
- PUT `/api/admin/companies/:id/approve`
- PUT `/api/admin/companies/:id/reject`
- PUT `/api/admin/companies/:id/toggle`
- GET `/api/admin/students`
- PUT `/api/admin/students/:id/toggle`
- GET `/api/admin/drives`
- PUT `/api/admin/drives/:id/approve`
- PUT `/api/admin/drives/:id/reject`
- PUT `/api/admin/drives/:id/deactivate`
- GET `/api/admin/applications`
- GET `/api/admin/drives/:id/applications`
- PUT `/api/admin/applications/:id/final-result`
- GET `/api/admin/interviews/pending`
- PUT `/api/admin/interviews/:id/approve`
- PUT `/api/admin/interviews/:id/reject`
- GET `/api/admin/interviews/all`
- GET `/api/admin/reports/statistics`
- POST `/api/admin/tasks/generate-report`
- POST `/api/admin/tasks/send-reminders`
- POST `/api/admin/tasks/monthly-report`
- GET `/api/admin/tasks/status/:task_id`
- GET `/api/admin/cache/stats`
- POST `/api/admin/cache/clear`

**Company**
- GET `/api/company/profile`
- PUT `/api/company/profile`
- GET `/api/company/dashboard`
- POST `/api/company/drives`
- GET `/api/company/drives/:id/applications`
- PUT `/api/company/applications/:id/status`
- POST `/api/company/applications/:id/request-interview`
- GET `/api/company/interviews`
- POST `/api/company/interviews/:id/rounds`
- PUT `/api/company/rounds/:id/result`
- PUT `/api/company/applications/:id/final-result`

**Student**
- GET `/api/student/profile`
- PUT `/api/student/profile`
- GET `/api/student/dashboard`
- GET `/api/student/applications`
- GET `/api/student/applications/export`
- POST `/api/student/applications/export/async`
- GET `/api/student/applications/export/status/:task_id`
- POST `/api/student/resume/upload`
- GET `/api/student/resume/download/:student_id`

**Drives**
- GET `/api/drives`
- GET `/api/drives/:id`
- POST `/api/drives/:id/apply`
