#!/bin/bash
# 🎙️ Chatterbox TTS Server Starter
# Manages the TTS server as a background daemon process

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/tmp/chatterbox_server.pid"
LOG_FILE="$SCRIPT_DIR/tmp/logs/chatterbox_server.log"
VENV_PATH="$SCRIPT_DIR/chatterbox_env"

# Ensure tmp directories exist
mkdir -p "$SCRIPT_DIR/tmp/logs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if server is running
is_running() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        else
            # PID file exists but process is dead
            rm -f "$PID_FILE"
            return 1
        fi
    fi
    return 1
}

# Function to get server status
get_status() {
    if is_running; then
        local pid=$(cat "$PID_FILE")
        print_success "Server is running (PID: $pid)"
        print_info "Log file: $LOG_FILE"
        print_info "PID file: $PID_FILE"
        
        # Try to get health status
        if command -v curl > /dev/null 2>&1; then
            echo ""
            print_info "Server health check:"
            curl -s http://localhost:8000/health 2>/dev/null | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    print(f\"  Status: {data.get('status', 'unknown')}\")
    print(f\"  Device: {data.get('system_resources', {}).get('device', 'unknown')}\")
    print(f\"  Uptime: {data.get('system_resources', {}).get('uptime_seconds', 0):.0f}s\")
except:
    print('  Unable to fetch health status')
" || print_warning "Server not responding to health checks yet"
        fi
        return 0
    else
        print_warning "Server is not running"
        return 1
    fi
}

# Function to start the server
start_server() {
    if is_running; then
        print_warning "Server is already running (PID: $(cat $PID_FILE))"
        print_info "Use 'npm run server:stop' to stop it first"
        return 1
    fi
    
    print_info "Starting Chatterbox TTS Server as daemon..."
    
    # Activate virtual environment and start server in background
    cd "$SCRIPT_DIR"
    source "$VENV_PATH/bin/activate"
    export PYTHONWARNINGS="ignore::UserWarning:perth.perth_net,ignore::DeprecationWarning"
    
    # Start server in background and save PID
    nohup python -m chatterbox_server "$@" > "$LOG_FILE" 2>&1 &
    local pid=$!
    echo $pid > "$PID_FILE"
    
    print_success "Server started in background (PID: $pid)"
    print_info "Log file: $LOG_FILE"
    print_info "Use 'npm run server:stop' to stop the server"
    print_info "Use 'npm run server:logs' to view logs"
    print_info "Use 'npm run server:status' to check status"
    
    # Wait a moment and verify it started
    sleep 2
    if is_running; then
        print_success "Server is running successfully"
    else
        print_error "Server failed to start. Check logs: $LOG_FILE"
        return 1
    fi
}

# Function to stop the server
stop_server() {
    if ! is_running; then
        print_warning "Server is not running"
        return 1
    fi
    
    local pid=$(cat "$PID_FILE")
    print_info "Stopping Chatterbox TTS Server (PID: $pid)..."
    
    # Send SIGTERM for graceful shutdown
    kill "$pid" 2>/dev/null || true
    
    # Wait up to 10 seconds for graceful shutdown
    local count=0
    while ps -p "$pid" > /dev/null 2>&1 && [ $count -lt 10 ]; do
        sleep 1
        count=$((count + 1))
    done
    
    # Force kill if still running
    if ps -p "$pid" > /dev/null 2>&1; then
        print_warning "Graceful shutdown failed, forcing termination..."
        kill -9 "$pid" 2>/dev/null || true
        sleep 1
    fi
    
    # Clean up PID file
    rm -f "$PID_FILE"
    
    if ! ps -p "$pid" > /dev/null 2>&1; then
        print_success "Server stopped successfully"
    else
        print_error "Failed to stop server"
        return 1
    fi
}

# Function to restart the server
restart_server() {
    print_info "Restarting Chatterbox TTS Server..."
    stop_server || true
    sleep 2
    start_server "$@"
}

# Function to show logs
show_logs() {
    if [ ! -f "$LOG_FILE" ]; then
        print_warning "No log file found at: $LOG_FILE"
        return 1
    fi
    
    print_info "Showing last 50 lines of server logs (Ctrl+C to exit):"
    echo ""
    tail -n 50 -f "$LOG_FILE"
}

# Function to show help
show_help() {
    cat << EOF
🎙️  Chatterbox TTS Server Management Script

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    start           Start the server as a daemon (default)
    stop            Stop the running server
    restart         Restart the server
    status          Show server status
    logs            Show server logs (tail -f)
    help            Show this help message

Options (for start/restart):
    --port PORT     Specify port (default: 8000)
    --debug         Enable debug mode
    --help          Show help

Examples:
    $0 start              Start server on default port 8000
    $0 start --port 9000  Start server on port 9000
    $0 stop               Stop the server
    $0 restart            Restart the server
    $0 status             Check if server is running
    $0 logs               View server logs in real-time

NPM Scripts (recommended):
    npm run server:start   Start the server
    npm run server:stop    Stop the server
    npm run server:restart Restart the server
    npm run server:status  Check server status
    npm run server:logs    View server logs
    npm run server:health  Get server health info

Files:
    PID file: $PID_FILE
    Log file: $LOG_FILE

EOF
}

# Main script logic
COMMAND="${1:-start}"

case "$COMMAND" in
    start)
        shift
        start_server "$@"
        ;;
    stop)
        stop_server
        ;;
    restart)
        shift
        restart_server "$@"
        ;;
    status)
        get_status
        ;;
    logs)
        show_logs
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        # Default behavior for backward compatibility
        start_server "$@"
        ;;
esac
