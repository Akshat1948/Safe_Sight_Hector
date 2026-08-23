#!/bin/bash

# ==============================================================================
# SafeSight — One-Click Development Environment Startup Script
# ==============================================================================

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "================================================================="
echo "  🚀 Starting SafeSight Services..."
echo "================================================================="

# 1. Check & Ensure PostgreSQL is running
echo "📦 Checking Database..."
if pg_isready -h localhost -p 5432 -U safesight -d safesight >/dev/null 2>&1; then
    echo "   ✅ PostgreSQL is active and ready."
elif brew services list 2>/dev/null | grep -q "postgresql@15.*started"; then
    echo "   ✅ PostgreSQL (brew) is running."
else
    echo "   ⏳ Starting PostgreSQL via Homebrew..."
    brew services start postgresql@15 >/dev/null 2>&1 || true
    sleep 2
fi

# 2. Kill any stale processes on port 3001, 8000, 3000
echo "🧹 Checking for stale processes on ports 3001, 8000, 3000..."
lsof -ti :3001 | xargs kill -9 2>/dev/null || true
lsof -ti :8000 | xargs kill -9 2>/dev/null || true
lsof -ti :3000 | xargs kill -9 2>/dev/null || true

# 3. Start NestJS Backend (Port 3001)
echo "⚙️  Starting NestJS Backend API Gateway on port 3001..."
cd "$SCRIPT_DIR/backend"
npm run build > "$SCRIPT_DIR/backend.log" 2>&1
nohup node dist/main >> "$SCRIPT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$SCRIPT_DIR/.backend.pid"
echo "   ✅ Backend started (PID: $BACKEND_PID, logs: backend.log)"


# 4. Start AI/ML Service if virtualenv / python uvicorn is configured (Port 8000)
cd "$SCRIPT_DIR"
if [ -d "$SCRIPT_DIR/ai-ml/venv" ]; then
    echo "🧠 Starting AI/ML FastAPI Service on port 8000..."
    cd "$SCRIPT_DIR/ai-ml"
    nohup "$SCRIPT_DIR/ai-ml/venv/bin/uvicorn" api.main:app --host 0.0.0.0 --port 8000 > "$SCRIPT_DIR/aiml.log" 2>&1 &
    AIML_PID=$!
    echo $AIML_PID > "$SCRIPT_DIR/.aiml.pid"
    echo "   ✅ AI/ML Service started (PID: $AIML_PID, logs: aiml.log)"
elif command -v uvicorn >/dev/null 2>&1; then
    echo "🧠 Starting AI/ML FastAPI Service on port 8000..."
    cd "$SCRIPT_DIR/ai-ml"
    nohup uvicorn api.main:app --host 0.0.0.0 --port 8000 > "$SCRIPT_DIR/aiml.log" 2>&1 &
    AIML_PID=$!
    echo $AIML_PID > "$SCRIPT_DIR/.aiml.pid"
    echo "   ✅ AI/ML Service started (PID: $AIML_PID, logs: aiml.log)"
fi

# 5. Start Frontend if frontend/package.json exists (Port 3000)
cd "$SCRIPT_DIR"
if [ -f "$SCRIPT_DIR/frontend/package.json" ]; then
    echo "💻 Starting Frontend PWA on port 3000..."
    cd "$SCRIPT_DIR/frontend"
    nohup npm run dev > "$SCRIPT_DIR/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > "$SCRIPT_DIR/.frontend.pid"
    echo "   ✅ Frontend started (PID: $FRONTEND_PID, logs: frontend.log)"
fi

# 6. Wait for Backend to become ready
echo ""
echo "⏳ Waiting for SafeSight Backend to initialize..."
MAX_RETRIES=15
COUNT=0
while [ $COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:3001/api/docs >/dev/null 2>&1; then
        echo "   ✅ SafeSight Backend is healthy and ready!"
        break
    fi
    sleep 1
    COUNT=$((COUNT + 1))
done

echo ""
echo "================================================================="
echo "  🎉 SafeSight Platform is LIVE!"
echo "================================================================="
echo "  📚 Swagger API Docs:   http://localhost:3001/api/docs"
echo "  🔌 API Gateway Base:   http://localhost:3001/api"
echo "  ⚡ WebSocket Gateway:  ws://localhost:3001"
if [ -f "$SCRIPT_DIR/frontend/package.json" ]; then
echo "  💻 Frontend Web App:   http://localhost:3000"
fi
echo "================================================================="
echo "  🛑 To stop all services, run: ./stop.sh"
echo "================================================================="

# Automatically open Frontend Website in browser
if command -v open >/dev/null 2>&1; then
    open "http://localhost:3000"
fi
