#!/bin/bash

# RESTART SCRIPT - Start both frontend and backend cleanly

echo "═══════════════════════════════════════════════════════════"
echo "🔄 MATATUCONNECT - FRESH RESTART"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Kill any existing processes
echo "🛑 Stopping existing services..."
pkill -9 -f "node" 2>/dev/null
pkill -9 -f "npm" 2>/dev/null
sleep 2

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Start backend
echo -e "${BLUE}📡 Starting Backend...${NC}"
cd "$PROJECT_DIR/backend"

if [ ! -d "node_modules" ]; then
  echo "📦 Installing backend dependencies..."
  npm install --silent
fi

npm start &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
sleep 3

# Start frontend
echo -e "${BLUE}🎨 Starting Frontend...${NC}"
cd "$PROJECT_DIR/frontend"

if [ ! -d "node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  npm install --silent
fi

npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"
sleep 3

echo ""
echo "═══════════════════════════════════════════════════════════"
echo -e "${GREEN}✨ PROJECT RESTARTED SUCCESSFULLY${NC}"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo -e "${BLUE}📱 ACCESS URLS:${NC}"
echo "   Local:   https://localhost:8080"
echo "   Network: https://YOUR_IP:8080"
echo ""
echo -e "${BLUE}🔧 SERVICES:${NC}"
echo "   Backend:  http://localhost:5000/api"
echo "   Frontend: https://localhost:8080"
echo ""
echo -e "${BLUE}🛑 TO STOP:${NC}"
echo "   Press Ctrl+C to stop all services"
echo ""
echo "═══════════════════════════════════════════════════════════"

# Wait for processes
wait

# Cleanup on exit
echo ""
echo "🛑 Cleaning up..."
kill $BACKEND_PID 2>/dev/null
kill $FRONTEND_PID 2>/dev/null
echo "✅ All services stopped"
