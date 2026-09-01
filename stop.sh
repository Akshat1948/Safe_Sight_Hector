#!/bin/bash

# ==============================================================================
# SafeSight — Universal Graceful Shutdown Script
# ==============================================================================

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "================================================================="
echo "  🛑 Stopping SafeSight Services..."
echo "================================================================="

# 1. Stop Backend
if [ -f "$SCRIPT_DIR/.backend.pid" ]; then
    BACKEND_PID=$(cat "$SCRIPT_DIR/.backend.pid" 2>/dev/null)
    if [ -n "$BACKEND_PID" ] && ps -p "$BACKEND_PID" > /dev/null 2>&1; then
        echo "   🛑 Stopping Backend (PID: $BACKEND_PID)..."
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    rm -f "$SCRIPT_DIR/.backend.pid"
fi

# 2. Stop AI/ML
if [ -f "$SCRIPT_DIR/.aiml.pid" ]; then
    AIML_PID=$(cat "$SCRIPT_DIR/.aiml.pid" 2>/dev/null)
    if [ -n "$AIML_PID" ] && ps -p "$AIML_PID" > /dev/null 2>&1; then
        echo "   🛑 Stopping AI/ML Service (PID: $AIML_PID)..."
        kill "$AIML_PID" 2>/dev/null || true
    fi
    rm -f "$SCRIPT_DIR/.aiml.pid"
fi

# 3. Stop Frontend
if [ -f "$SCRIPT_DIR/.frontend.pid" ]; then
    FRONTEND_PID=$(cat "$SCRIPT_DIR/.frontend.pid" 2>/dev/null)
    if [ -n "$FRONTEND_PID" ] && ps -p "$FRONTEND_PID" > /dev/null 2>&1; then
        echo "   🛑 Stopping Frontend (PID: $FRONTEND_PID)..."
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    rm -f "$SCRIPT_DIR/.frontend.pid"
fi

# 4. Clean up any remaining processes on relevant ports (cross-platform)
echo "   🧹 Clearing ports 3001, 8000, 3000..."
if command -v lsof >/dev/null 2>&1; then
    lsof -ti :3001 | xargs kill -9 2>/dev/null || true
    lsof -ti :8000 | xargs kill -9 2>/dev/null || true
    lsof -ti :3000 | xargs kill -9 2>/dev/null || true
elif command -v fuser >/dev/null 2>&1; then
    fuser -k 3001/tcp 2>/dev/null || true
    fuser -k 8000/tcp 2>/dev/null || true
    fuser -k 3000/tcp 2>/dev/null || true
elif command -v powershell.exe >/dev/null 2>&1; then
    powershell.exe -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000, 3001, 8000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id \$_.OwningProcess -Force -ErrorAction SilentlyContinue }" 2>/dev/null || true
fi

echo "================================================================="
echo "  ✅ All SafeSight services have been stopped successfully."
echo "================================================================="
