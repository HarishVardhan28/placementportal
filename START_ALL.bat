@echo off

echo [1/5] Starting Redis Server...
start "Redis Server" "C:\Program Files\Redis\redis-server.exe" --port 6380
timeout /t 3 /nobreak >nul

echo [2/5] Starting Flask Backend...
start "Flask Backend" cmd /k "cd /d e:\projects\placementportal\backend && python app.py"
timeout /t 5 /nobreak >nul

echo [3/5] Starting Celery Worker...
start "Celery Worker" cmd /k "cd /d e:\projects\placementportal\backend && set PYTHONPATH=e:\projects\placementportal\backend && celery -A tasks worker --loglevel=info --pool=solo --concurrency=1"
timeout /t 3 /nobreak >nul

echo [4/5] Starting Celery Beat...
start "Celery Beat" cmd /k "cd /d e:\projects\placementportal\backend && set PYTHONPATH=e:\projects\placementportal\backend && celery -A tasks beat --loglevel=info"
timeout /t 2 /nobreak >nul

echo [5/5] Starting Frontend Server...
start "Frontend Server" cmd /k "cd /d e:\projects\placementportal\frontend && python -m http.server 8080"
timeout /t 2 /nobreak >nul

echo.
echo Frontend: http://localhost:8080
echo Backend API: http://localhost:5000
echo.
echo Press any key to open frontend in browser...
pause >nul
start http://localhost:8080
