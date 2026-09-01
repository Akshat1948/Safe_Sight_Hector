@echo off
title SafeSight Shutdown Manager

echo =================================================================
echo   Stopping SafeSight Services (Windows)...
echo =================================================================

powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000, 3001, 8000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"

echo =================================================================
echo   All SafeSight services have been stopped.
echo =================================================================
