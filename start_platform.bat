@echo off
echo ===================================================
echo Starting OU RESULTS INTELLIGENCE Platform
echo ===================================================

echo Starting FastAPI Backend on port 8000...
start "OU Results Intelligence - Backend" cmd /k "python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000"

timeout /t 2 >nul

echo Starting Next.js Frontend on port 3000...
start "OU Results Intelligence - Frontend" cmd /k "cd frontend && npm run start"

echo ===================================================
echo Platform launched!
echo Open your browser at: http://localhost:3000
echo Backend API docs at:  http://127.0.0.1:8000/docs
echo ===================================================
pause
