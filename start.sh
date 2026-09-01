#!/bin/bash

# ==============================================================================
# SafeSight — Universal One-Click Full Stack Startup Script
# Works on macOS, Linux, and Windows (WSL)
# ==============================================================================

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "================================================================="
echo "  🚀 Starting SafeSight Mission Control Services..."
echo "================================================================="

# 1. Ensure Dependencies are Installed
if [ -d "$SCRIPT_DIR/backend" ] && [ ! -d "$SCRIPT_DIR/backend/node_modules" ]; then
    echo "📦 Installing backend dependencies (npm install)..."
    cd "$SCRIPT_DIR/backend" && npm install
    cd "$SCRIPT_DIR"
fi

if [ -d "$SCRIPT_DIR/frontend" ] && [ ! -d "$SCRIPT_DIR/frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies (npm install)..."
    cd "$SCRIPT_DIR/frontend" && npm install
    cd "$SCRIPT_DIR"
fi

# 2. Check & Ensure PostgreSQL is running
echo "📦 Checking Database..."
if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    echo "   ✅ PostgreSQL is active and ready."
elif command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1 && [ -f "$SCRIPT_DIR/docker-compose.yml" ]; then
    echo "   🐳 Starting PostgreSQL & Redis via Docker Compose..."
    docker compose up -d 2>/dev/null || docker-compose up -d 2>/dev/null || true
    sleep 3
elif command -v brew >/dev/null 2>&1; then
    echo "   ⏳ Starting PostgreSQL via Homebrew..."
    brew services start postgresql@15 >/dev/null 2>&1 || brew services start postgresql >/dev/null 2>&1 || true
    sleep 2
elif command -v systemctl >/dev/null 2>&1; then
    echo "   ⏳ Starting PostgreSQL via systemctl..."
    sudo systemctl start postgresql >/dev/null 2>&1 || true
    sleep 2
fi

# 3. Kill any stale processes on port 3001, 8000, 3000
echo "🧹 Checking for stale processes on ports 3001, 8000, 3000..."
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

# 4. Start NestJS Backend (Port 3001)
echo "⚙️  Starting NestJS Backend API Gateway on port 3001..."
cd "$SCRIPT_DIR/backend"
if [ ! -f "$SCRIPT_DIR/backend/dist/main.js" ]; then
    echo "   ⚙️  Compiling backend TypeScript..."
    npm run build > "$SCRIPT_DIR/backend.log" 2>&1 || true
fi
nohup node dist/main > "$SCRIPT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$SCRIPT_DIR/.backend.pid"
echo "   ✅ Backend started (PID: $BACKEND_PID, logs: backend.log)"

# 5. Start AI/ML Service if configured (Port 8000)
cd "$SCRIPT_DIR"
if [ -d "$SCRIPT_DIR/ai-ml" ]; then
    if [ -f "$SCRIPT_DIR/ai-ml/venv/bin/uvicorn" ]; then
        echo "🧠 Starting AI/ML FastAPI Service on port 8000 (virtualenv)..."
        cd "$SCRIPT_DIR/ai-ml"
        nohup "$SCRIPT_DIR/ai-ml/venv/bin/uvicorn" api.main:app --host 0.0.0.0 --port 8000 > "$SCRIPT_DIR/aiml.log" 2>&1 &
        AIML_PID=$!
        echo $AIML_PID > "$SCRIPT_DIR/.aiml.pid"
        echo "   ✅ AI/ML Service started (PID: $AIML_PID, logs: aiml.log)"
    elif command -v uvicorn >/dev/null 2>&1; then
        echo "🧠 Starting AI/ML FastAPI Service on port 8000 (uvicorn)..."
        cd "$SCRIPT_DIR/ai-ml"
        nohup uvicorn api.main:app --host 0.0.0.0 --port 8000 > "$SCRIPT_DIR/aiml.log" 2>&1 &
        AIML_PID=$!
        echo $AIML_PID > "$SCRIPT_DIR/.aiml.pid"
        echo "   ✅ AI/ML Service started (PID: $AIML_PID, logs: aiml.log)"
    elif command -v python3 >/dev/null 2>&1; then
        echo "🧠 Starting AI/ML FastAPI Service on port 8000 (python3)..."
        cd "$SCRIPT_DIR/ai-ml"
        nohup python3 -m uvicorn api.main:app --host 0.0.0.0 --port 8000 > "$SCRIPT_DIR/aiml.log" 2>&1 &
        AIML_PID=$!
        echo $AIML_PID > "$SCRIPT_DIR/.aiml.pid"
        echo "   ✅ AI/ML Service started (PID: $AIML_PID, logs: aiml.log)"
    elif command -v python >/dev/null 2>&1; then
        echo "🧠 Starting AI/ML FastAPI Service on port 8000 (python)..."
        cd "$SCRIPT_DIR/ai-ml"
        nohup python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 > "$SCRIPT_DIR/aiml.log" 2>&1 &
        AIML_PID=$!
        echo $AIML_PID > "$SCRIPT_DIR/.aiml.pid"
        echo "   ✅ AI/ML Service started (PID: $AIML_PID, logs: aiml.log)"
    fi
fi

# 6. Start Frontend Web App (Port 3000)
cd "$SCRIPT_DIR"
if [ -f "$SCRIPT_DIR/frontend/package.json" ]; then
    echo "💻 Starting Frontend Web App on port 3000..."
    cd "$SCRIPT_DIR/frontend"
    nohup npm run dev > "$SCRIPT_DIR/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > "$SCRIPT_DIR/.frontend.pid"
    echo "   ✅ Frontend started (PID: $FRONTEND_PID, logs: frontend.log)"
fi

# 7. Wait for Backend & Frontend to initialize
echo ""
echo "⏳ Waiting for SafeSight services to initialize (this may take up to 30 seconds)..."
MAX_RETRIES=35
COUNT=0
FRONTEND_READY=0
BACKEND_READY=0

while [ $COUNT -lt $MAX_RETRIES ]; do
    if [ $FRONTEND_READY -eq 0 ]; then
        if curl -s -f http://localhost:3000 >/dev/null 2>&1; then
            FRONTEND_READY=1
            echo "   ✅ Frontend is ready (http://localhost:3000)"
        fi
    fi
    if [ $BACKEND_READY -eq 0 ]; then
        if curl -s -f http://localhost:3001/api/docs >/dev/null 2>&1; then
            BACKEND_READY=1
            echo "   ✅ Backend API is ready (http://localhost:3001)"
        fi
    fi
    if [ $FRONTEND_READY -eq 1 ] && [ $BACKEND_READY -eq 1 ]; then
        echo "   🎉 All SafeSight services are ready!"
        break
    fi
    sleep 1
    COUNT=$((COUNT + 1))
done

echo ""
echo "================================================================="
echo "  🎉 SafeSight Platform is LIVE!"
echo "================================================================="
echo "  💻 Frontend Web App:   http://localhost:3000"
echo "  📚 Swagger API Docs:   http://localhost:3001/api/docs"
echo "  🔌 API Gateway Base:   http://localhost:3001/api"
echo "  ⚡ WebSocket Gateway:  ws://localhost:3001"
echo "  🧠 AI/ML Engine:       http://localhost:8000/ml"
echo "================================================================="
echo "  🛑 To stop all services, run: ./stop.sh"
echo "================================================================="

# 8. Automatically open Frontend Website in browser (cross-platform)
if command -v open >/dev/null 2>&1; then
    open "http://localhost:3000"
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://localhost:3000" 2>/dev/null || true
elif command -v powershell.exe >/dev/null 2>&1; then
    powershell.exe -NoProfile -Command "Start-Process 'http://localhost:3000'" 2>/dev/null || true
fi
