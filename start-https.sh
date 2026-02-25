#!/bin/bash

# Enable HTTPS for Vite development server with network access
# This script starts both backend and frontend with HTTPS enabled
# Access via: https://172.17.88.207:8080 (or your local IP)

echo "🔐 Starting MatatuConnect with HTTPS enabled..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to cleanup on exit
cleanup() {
  echo ""
  echo -e "${RED}Stopping services...${NC}"
  pkill -f "npm start" || true
  pkill -f "npm run dev" || true
  sleep 2
  echo -e "${GREEN}Services stopped${NC}"
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Ensure we're in the project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR" || exit 1

echo -e "${BLUE}Project Directory: $PROJECT_DIR${NC}"
echo ""

# Start Backend
echo -e "${BLUE}📡 Starting Backend Server...${NC}"
echo "   Location: http://0.0.0.0:5000"
cd "$PROJECT_DIR/backend" && npm start > /tmp/backend-https.log 2>&1 &
BACKEND_PID=$!
sleep 4

# Check backend is running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
  echo -e "${RED}❌ Backend failed to start${NC}"
  tail -20 /tmp/backend-https.log
  exit 1
fi
echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
tail -10 /tmp/backend-https.log
echo ""

# Start Frontend with HTTPS
echo -e "${BLUE}🔒 Starting Frontend Server (HTTPS)...${NC}"
cd "$PROJECT_DIR/frontend"

# Check certificates exist
if [ ! -f ".cert/cert.pem" ] || [ ! -f ".cert/key.pem" ]; then
  echo -e "${RED}❌ SSL certificates not found in .cert/${NC}"
  echo "   Run: mkcert -cert-file .cert/cert.pem -key-file .cert/key.pem localhost 127.0.0.1 ::1"
  exit 1
fi

# Set HTTPS environment variable and start
export VITE_HTTPS=true
export NODE_ENV=development
npm run dev > /tmp/frontend-https.log 2>&1 &
FRONTEND_PID=$!
sleep 6

# Check frontend is running
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
  echo -e "${RED}❌ Frontend failed to start${NC}"
  tail -20 /tmp/frontend-https.log
  exit 1
fi
echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"
tail -15 /tmp/frontend-https.log
echo ""

# Get local IP
LOCAL_IP=$(hostname -I | awk '{print $1}')
if [ -z "$LOCAL_IP" ]; then
  LOCAL_IP="172.17.88.207"  # Docker IP fallback
fi

# Display summary
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ MatatuConnect HTTPS Server Running${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📱 Access URLs:${NC}"
echo -e "   ${GREEN}Localhost:${NC}     https://localhost:8080"
echo -e "   ${GREEN}Local Network:${NC}  https://$LOCAL_IP:8080"
echo -e "   ${GREEN}Docker IP:${NC}      https://172.17.88.207:8080"
echo ""
echo -e "${BLUE}🔌 API Endpoints:${NC}"
echo -e "   Backend:  http://0.0.0.0:5000/api"
echo ""
echo -e "${BLUE}📝 Service Status:${NC}"
echo -e "   Backend PID:  $BACKEND_PID"
echo -e "   Frontend PID: $FRONTEND_PID"
echo ""
echo -e "${BLUE}🔒 Certificate Info:${NC}"
echo "   Cert:   .cert/cert.pem (mkcert)"
echo "   Key:    .cert/key.pem"
echo "   Valid:  Until May 21, 2028"
echo ""
echo -e "${BLUE}📋 Logs:${NC}"
echo "   Backend:  tail -f /tmp/backend-https.log"
echo "   Frontend: tail -f /tmp/frontend-https.log"
echo ""
echo -e "${BLUE}⚠️  Browser Warning:${NC}"
echo "   You may see 'Not Secure' warning in browser"
echo "   This is expected with mkcert - it's safe"
echo "   Click Advanced → Proceed to access"
echo ""
echo -e "${BLUE}🛑 To Stop Services:${NC}"
echo "   Press Ctrl+C or run: pkill -f 'npm start'; pkill -f 'npm run dev'"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Keep script running
wait
