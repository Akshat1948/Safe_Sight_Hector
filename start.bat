@echo off
setlocal enabledelayedexpansion
title SafeSight Startup Manager

echo =================================================================
echo   SafeSight Mission Control Services (Windows)
echo =================================================================

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

:: 1. Clear any stale processes on ports 3001, 8000, 3000
echo Clearing existing processes on ports 3000, 3001, 8000...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000, 3001, 8000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"

:: 2. Ensure backend dependencies and build
if exist "%SCRIPT_DIR%backend" (
    if not exist "%SCRIPT_DIR%backend\node_modules" (
        echo Installing backend dependencies...
        cd /d "%SCRIPT_DIR%backend" && call npm install
        cd /d "%SCRIPT_DIR%"
    )
    if not exist "%SCRIPT_DIR%backend\dist\main.js" (
        echo Compiling backend TypeScript...
        cd /d "%SCRIPT_DIR%backend" && call npm run build
        cd /d "%SCRIPT_DIR%"
    )
)

:: 3. Ensure frontend dependencies
if exist "%SCRIPT_DIR%frontend" (
    if not exist "%SCRIPT_DIR%frontend\node_modules" (
        echo Installing frontend dependencies...
        cd /d "%SCRIPT_DIR%frontend" && call npm install
        cd /d "%SCRIPT_DIR%"
    )
)

:: 4. Start NestJS Backend (Port 3001)
echo Starting Backend API Gateway on port 3001...
start "SafeSight-Backend" /min cmd /c "cd /d ""%SCRIPT_DIR%backend"" && node dist/main > ""%SCRIPT_DIR%backend.log"" 2>&1"

:: 5. Start AI/ML Service (Port 8000)
if exist "%SCRIPT_DIR%ai-ml" (
    echo Starting AI/ML Service on port 8000...
    start "SafeSight-AIML" /min cmd /c "cd /d ""%SCRIPT_DIR%ai-ml"" && python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 > ""%SCRIPT_DIR%aiml.log"" 2>&1"
)

:: 6. Start Frontend (Port 3000)
echo Starting Frontend Web App on port 3000...
start "SafeSight-Frontend" /min cmd /c "cd /d ""%SCRIPT_DIR%frontend"" && npm run dev > ""%SCRIPT_DIR%frontend.log"" 2>&1"

:: 7. Wait for Frontend to be healthy
echo Waiting for SafeSight services to initialize (please wait ~15-20s)...
powershell -NoProfile -Command "$ready = $false; for ($i=0; $i -lt 35; $i++) { try { $res = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 2; if ($res.StatusCode -eq 200) { $ready = $true; break } } catch { Start-Sleep -Seconds 1 } }; if ($ready) { Write-Host '   All SafeSight services are LIVE!' -ForegroundColor Green; Start-Process 'http://localhost:3000' } else { Write-Host '   Frontend is still compiling. Opening browser...' -ForegroundColor Yellow; Start-Process 'http://localhost:3000' }"

echo =================================================================
echo   SafeSight Platform is LIVE!
echo   Frontend Web App:   http://localhost:3000
echo   Swagger API Docs:   http://localhost:3001/api/docs
echo   API Gateway:        http://localhost:3001/api
echo   AI/ML Engine:       http://localhost:8000/ml
echo =================================================================
echo   To stop all services, run: stop.bat
echo =================================================================
