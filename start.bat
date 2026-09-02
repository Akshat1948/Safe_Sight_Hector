@echo off
setlocal enabledelayedexpansion
title SafeSight Startup Manager

echo =================================================================
echo   SafeSight Mission Control Services (Windows)
echo =================================================================

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

:: 1. Clear any stale processes on ports 3001, 8000, 3000
echo [1/6] Clearing existing processes on ports 3000, 3001, 8000...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000, 3001, 8000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"

:: 2. Check and start Docker / PostgreSQL if needed
echo [2/6] Checking Database & Redis infrastructure...
powershell -NoProfile -Command "$dockerOk = $false; try { $res = docker info 2>&1; if ($LASTEXITCODE -eq 0) { $dockerOk = $true } } catch {}; if (-not $dockerOk) { $paths = @(\"$env:LOCALAPPDATA\Programs\DockerDesktop\Docker Desktop.exe\", \"C:\Program Files\Docker\Docker\Docker Desktop.exe\"); $found = $false; foreach ($p in $paths) { if (Test-Path $p) { Write-Host '   🐳 Starting Docker Desktop (please wait)...' -ForegroundColor Cyan; Start-Process $p; $found = $true; break } }; if ($found) { for ($i=0; $i -lt 30; $i++) { Start-Sleep -Seconds 2; try { docker info >$null 2>&1; if ($LASTEXITCODE -eq 0) { $dockerOk = $true; break } } catch {} } } }; if ($dockerOk) { Write-Host '   🐳 Docker is running. Starting PostgreSQL & Redis...' -ForegroundColor Green; docker compose up -d 2>$null; if ($LASTEXITCODE -ne 0) { docker start safesight-postgres safesight-redis 2>$null } } else { Write-Host '   ⚠️ Docker Desktop not detected or slow to start. If backend fails, please open Docker Desktop.' -ForegroundColor Yellow }"

:: 3. Ensure backend build
echo [3/6] Checking Backend build...
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

:: 4. Start NestJS Backend (Port 3001)
echo [4/6] Starting Backend API Gateway on port 3001...
start "SafeSight-Backend" /min cmd /c "cd /d ""%SCRIPT_DIR%backend"" && node dist/main > ""%SCRIPT_DIR%backend.log"" 2>&1"

:: 5. Start AI/ML Service (Port 8000)
if exist "%SCRIPT_DIR%ai-ml" (
    echo [5/6] Starting AI/ML Service on port 8000...
    start "SafeSight-AIML" /min cmd /c "cd /d ""%SCRIPT_DIR%ai-ml"" && python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 > ""%SCRIPT_DIR%aiml.log"" 2>&1"
)

:: 6. Start Frontend (Port 3000)
echo [6/6] Starting Frontend Web App on port 3000...
start "SafeSight-Frontend" /min cmd /c "cd /d ""%SCRIPT_DIR%frontend"" && npm run dev > ""%SCRIPT_DIR%frontend.log"" 2>&1"

:: 7. Wait for services to be ready
echo.
echo Waiting for SafeSight services to initialize...
powershell -NoProfile -Command "$backendReady = $false; for ($i=0; $i -lt 25; $i++) { try { $res = Invoke-WebRequest -Uri 'http://localhost:3001/api/zones' -UseBasicParsing -TimeoutSec 1; if ($res.StatusCode -eq 200 -or $res.StatusCode -eq 401) { $backendReady = $true; break } } catch { Start-Sleep -Seconds 1 } }; if ($backendReady) { Write-Host '   ✅ Backend API is LIVE on port 3001' -ForegroundColor Green } else { Write-Host '   ⚠️ Backend is still initializing or encountered an issue. Check backend.log.' -ForegroundColor Yellow }"

powershell -NoProfile -Command "$aimlReady = $false; for ($i=0; $i -lt 25; $i++) { try { $res = Invoke-WebRequest -Uri 'http://localhost:8000/ml/health' -UseBasicParsing -TimeoutSec 1; if ($res.StatusCode -eq 200) { $aimlReady = $true; break } } catch { Start-Sleep -Seconds 1 } }; if ($aimlReady) { Write-Host '   ✅ AI/ML Vision & Intelligence Service is LIVE on port 8000' -ForegroundColor Green } else { Write-Host '   ⚠️ AI/ML Service is still initializing. Check aiml.log.' -ForegroundColor Yellow }"

powershell -NoProfile -Command "$feReady = $false; for ($i=0; $i -lt 30; $i++) { try { $res = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 2; if ($res.StatusCode -eq 200) { $feReady = $true; break } } catch { Start-Sleep -Seconds 1 } }; if ($feReady) { Write-Host '   ✅ Frontend UI is LIVE on port 3000' -ForegroundColor Green; Start-Process 'http://localhost:3000' } else { Write-Host '   Frontend is still compiling. Opening browser...' -ForegroundColor Yellow; Start-Process 'http://localhost:3000' }"

echo =================================================================
echo   SafeSight Platform is READY!
echo   Frontend Web App:   http://localhost:3000
echo   Swagger API Docs:   http://localhost:3001/api/docs
echo   API Gateway:        http://localhost:3001/api
echo   AI/ML Engine:       http://localhost:8000/ml
echo =================================================================
echo   To run live simulation:
echo     cd backend ^&^& npm run simulate:step
echo   To stop all services:
echo     stop.bat
echo =================================================================
