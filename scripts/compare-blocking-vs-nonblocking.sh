#!/usr/bin/env bash
# compare-blocking-vs-nonblocking.sh
# 
# Purpose: Run side-by-side load tests comparing blocking vs. non-blocking apps
# Usage: ./compare-blocking-vs-nonblocking.sh
# 
# Requirements:
# - Both apps in blocking/ and non-blocking/ directories
# - npm installed
# - autocannon installed globally or npx available
# - Node.js 25.0.0+

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CONCURRENCY=10
DURATION=30
WARMUP_DURATION=10
WARMUP_CONNECTIONS=5

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Blocking vs. Non-Blocking Performance Comparison            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if both directories exist
if [ ! -d "blocking" ]; then
  echo -e "${RED}Error: blocking/ directory not found${NC}"
  exit 1
fi

if [ ! -d "non-blocking" ]; then
  echo -e "${RED}Error: non-blocking/ directory not found${NC}"
  exit 1
fi

# Function to start app
start_app() {
  local app_dir=$1
  local port=$2
  local app_name=$3
  
  echo -e "${YELLOW}Starting $app_name on port $port...${NC}"
  cd "$app_dir"
  npm start > /dev/null 2>&1 &
  local pid=$!
  cd ..
  
  # Wait for app to start
  sleep 3
  
  # Verify it's running
  if ! kill -0 $pid 2>/dev/null; then
    echo -e "${RED}Failed to start $app_name${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}✓ $app_name started (PID: $pid)${NC}"
  echo $pid
}

# Function to stop app
stop_app() {
  local pid=$1
  local app_name=$2
  
  if kill -0 $pid 2>/dev/null; then
    kill $pid 2>/dev/null || true
    sleep 1
    echo -e "${GREEN}✓ $app_name stopped${NC}"
  fi
}

# Function to run load test
run_load_test() {
  local port=$1
  local app_name=$2
  local warmup=$3
  local concurrency=$4
  local duration=$5
  
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${YELLOW}Testing $app_name${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  
  if [ "$warmup" = true ]; then
    echo -e "${YELLOW}Running warmup (${WARMUP_CONNECTIONS}c/${WARMUP_DURATION}s)...${NC}"
    if command -v autocannon &> /dev/null; then
      autocannon -c ${WARMUP_CONNECTIONS} -d ${WARMUP_DURATION} http://localhost:${port} > /dev/null 2>&1 || true
    else
      npx autocannon -c ${WARMUP_CONNECTIONS} -d ${WARMUP_DURATION} http://localhost:${port} > /dev/null 2>&1 || true
    fi
    
    sleep 2
    echo -e "${GREEN}Warmup complete${NC}"
  fi
  
  echo ""
  echo -e "${YELLOW}Running main test (${concurrency}c/${duration}s)...${NC}"
  
  if command -v autocannon &> /dev/null; then
    autocannon -c ${concurrency} -d ${duration} http://localhost:${port}
  else
    npx autocannon -c ${concurrency} -d ${duration} http://localhost:${port}
  fi
}

# Trap to cleanup on exit
cleanup() {
  echo ""
  echo -e "${YELLOW}Cleaning up...${NC}"
  
  if [ ! -z "${BLOCKING_PID}" ]; then
    stop_app ${BLOCKING_PID} "Blocking app"
  fi
  
  if [ ! -z "${NONBLOCKING_PID}" ]; then
    stop_app ${NONBLOCKING_PID} "Non-blocking app"
  fi
  
  echo -e "${GREEN}Cleanup complete${NC}"
}

trap cleanup EXIT

# Start apps
echo ""
echo -e "${YELLOW}Starting applications...${NC}"
BLOCKING_PID=$(start_app "blocking" "3000" "Blocking app")
NONBLOCKING_PID=$(start_app "non-blocking" "3001" "Non-blocking app")

echo ""
echo -e "${GREEN}Both apps running. Ready to test.${NC}"
echo ""

# Run tests
run_load_test 3000 "Blocking App" true ${CONCURRENCY} ${DURATION}

# Give apps time to settle
sleep 5

run_load_test 3001 "Non-Blocking App" true ${CONCURRENCY} ${DURATION}

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Comparison Complete!                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✓ Check the results above${NC}"
echo -e "${YELLOW}Non-blocking app should show:${NC}"
echo "  • ~2-3x higher throughput"
echo "  • ~40-50% lower p99 latency"
echo "  • Stable performance across concurrency levels"
echo ""
