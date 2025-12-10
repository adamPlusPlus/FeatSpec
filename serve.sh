#!/bin/bash
# Simple HTTP server to run the feature spec app
# Since the app uses fetch() to load docs, it needs to run from the project root

PORT="${1:-8050}"

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Get project root (parent of feat-spec)
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Check if port is already in use
if command -v netstat &> /dev/null; then
    if netstat -an 2>/dev/null | grep -q ":$PORT " || netstat -an 2>/dev/null | grep -q "LISTENING.*:$PORT"; then
        echo "Warning: Port $PORT is already in use"
        echo "Please stop the service using that port or use a different port"
        exit 1
    fi
elif command -v lsof &> /dev/null; then
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "Warning: Port $PORT is already in use"
        echo "Please stop the service using that port or use a different port"
        exit 1
    fi
fi

# Get local IP address for LAN access
LOCAL_IP=""
if command -v ipconfig &> /dev/null; then
    # Windows
    LOCAL_IP=$(ipconfig | grep -i "IPv4" | head -1 | sed 's/.*: *//' | tr -d '\r')
elif command -v hostname &> /dev/null && hostname -I &> /dev/null; then
    # Linux
    LOCAL_IP=$(hostname -I | awk '{print $1}')
elif command -v ifconfig &> /dev/null; then
    # macOS/Linux fallback
    LOCAL_IP=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -1)
fi

echo "Starting server from project root: $PROJECT_ROOT"
echo "Server will be available at: http://localhost:$PORT/feat-spec"
if [ -n "$LOCAL_IP" ]; then
    echo "Accessible on LAN at http://$LOCAL_IP:$PORT/feat-spec"
fi
echo "Press Ctrl+C to stop"
echo ""

# Change to feat-spec directory
cd "$SCRIPT_DIR"

# Try Node.js server first (has file watching capabilities)
if command -v node &> /dev/null; then
    echo "Starting Node.js server with file watching..."
    PORT=$PORT node server.js
# Fallback to Python's built-in HTTP server
elif command -v python3 &> /dev/null; then
    echo "Starting Python server (no file watching - use Node.js for automation features)..."
    cd "$PROJECT_ROOT"
    python3 -m http.server $PORT --bind 0.0.0.0
elif command -v python &> /dev/null; then
    echo "Starting Python server (no file watching - use Node.js for automation features)..."
    cd "$PROJECT_ROOT"
    python -m http.server $PORT --bind 0.0.0.0
else
    echo "Error: Neither Node.js nor Python found."
    echo "Please install Node.js (recommended for automation) or Python."
    exit 1
fi

