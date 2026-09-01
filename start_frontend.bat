@echo off
echo ==========================================
echo  PaarakhMetric - Starting Frontend
echo ==========================================
cd /d "%~dp0frontend"
if not exist "node_modules" npm install
echo Starting Vite on http://localhost:5543
echo Proxy: /api -> http://localhost:8000
npm run dev
pause
