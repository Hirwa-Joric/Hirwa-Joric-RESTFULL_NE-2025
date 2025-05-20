#!/bin/bash

# Colors for console output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting XWZ Car Parking Management System...${NC}"

# Start the backend server in the background
echo -e "${BLUE}Starting Backend Server...${NC}"
cd backend && npm start &
BACKEND_PID=$!

# Give the backend a moment to start
sleep 2

# Start the frontend server in the background
echo -e "${BLUE}Starting Frontend Server...${NC}"
cd park-it-smart-view && npm run dev &
FRONTEND_PID=$!

# Function to handle script termination
function cleanup {
  echo -e "${GREEN}Shutting down servers...${NC}"
  kill $BACKEND_PID
  kill $FRONTEND_PID
  exit
}

# Trap SIGINT (Ctrl+C) and call cleanup
trap cleanup INT

# Keep the script running
echo -e "${GREEN}Both servers are running. Press Ctrl+C to stop both servers.${NC}"
wait 