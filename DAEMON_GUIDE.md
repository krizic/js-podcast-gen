# 🎙️ Chatterbox Server Daemon Management Guide

## Overview

The Chatterbox TTS Server now runs as a background daemon process, allowing you to start the server without blocking your console. The server can be easily managed using npm scripts or the shell script directly.

## Quick Start

### Start the Server
```bash
npm run server:start
```

The server will start in the background and you'll immediately get your console back.

### Check Server Status
```bash
npm run server:status
```

### Stop the Server
```bash
npm run server:stop
```

### View Server Logs
```bash
npm run server:logs
```
Press `Ctrl+C` to stop viewing logs (server keeps running).

### Restart the Server
```bash
npm run server:restart
```

## Complete Command Reference

### NPM Scripts (Recommended)

| Command | Description |
|---------|-------------|
| `npm run server:start` | Start server as daemon on port 8000 |
| `npm run server:stop` | Stop the running server gracefully |
| `npm run server:restart` | Restart the server |
| `npm run server:status` | Check if server is running + health info |
| `npm run server:logs` | View live server logs (tail -f) |
| `npm run server:health` | Get detailed health status (JSON) |
| `npm run server:voices` | List available voice presets (JSON) |
| `npm run server:help` | Show detailed help information |

### Direct Shell Script Usage

```bash
./start-server.sh [COMMAND] [OPTIONS]
```

**Commands:**
- `start` - Start the server as daemon (default)
- `stop` - Stop the running server
- `restart` - Restart the server
- `status` - Show server status and health
- `logs` - Show live server logs
- `help` - Show detailed help

**Options (for start/restart):**
- `--port PORT` - Specify custom port
- `--debug` - Enable debug mode

**Examples:**
```bash
./start-server.sh start              # Start on default port 8000
./start-server.sh start --port 9000  # Start on custom port
./start-server.sh stop               # Stop the server
./start-server.sh status             # Check status
./start-server.sh logs               # View logs
```

## Server Files

### PID File
**Location:** `tmp/chatterbox_server.pid`

Contains the process ID of the running server. Used to manage the daemon.

### Log File
**Location:** `tmp/logs/chatterbox_server.log`

Contains all server output including:
- Startup messages
- Model loading progress
- Request logs
- Error messages
- Shutdown logs

## Common Workflows

### Development Workflow

```bash
# 1. Start the server
npm run server:start

# 2. Check it's running
npm run server:status

# 3. Work on your code

# 4. If you need to update the server, restart it
npm run server:restart

# 5. When done, stop the server
npm run server:stop
```

### Debugging Issues

```bash
# 1. Check server status
npm run server:status

# 2. View logs to see what's happening
npm run server:logs

# 3. If server isn't responding, force stop and restart
npm run server:stop
npm run server:start

# 4. Check health endpoint
npm run server:health
```

### Running Podcast Generation

```bash
# 1. Ensure server is running
npm run server:status

# 2. Generate podcast (server runs in background)
npm start generate -- -f input.txt -o output.mp3 --voice masculine --auto-approve

# 3. Server keeps running for next generation
npm start generate -- -f another-file.txt -o output2.mp3
```

## Daemon Management Features

### Graceful Shutdown
The server receives SIGTERM signal and has 10 seconds to shut down gracefully:
- Saves state
- Completes current requests
- Cleans up resources

If it doesn't stop within 10 seconds, it's force-killed (SIGKILL).

### Automatic PID Management
- PID file created on start
- Automatically removed on stop
- Checks if process is actually running (not just PID file exists)
- Cleans up stale PID files

### Log Rotation
Logs are appended to the same file. To rotate logs manually:

```bash
# Stop server
npm run server:stop

# Rotate log file
mv tmp/logs/chatterbox_server.log tmp/logs/chatterbox_server.log.old

# Start server (creates new log file)
npm run server:start
```

### Multiple Instances
⚠️ **Warning:** Only one server instance should run at a time on the same port.

The script automatically detects if a server is already running and prevents starting a second instance.

## Troubleshooting

### Server Won't Start

**Check if another instance is running:**
```bash
npm run server:status
```

**View logs for errors:**
```bash
npm run server:logs
```

**Common issues:**
- Port 8000 already in use (change with `--port`)
- Virtual environment not activated (script handles this)
- Model files not downloaded (first run takes longer)

### Server Stops Unexpectedly

**Check system resources:**
```bash
npm run server:health
```

**View logs for errors:**
```bash
tail -50 tmp/logs/chatterbox_server.log
```

**Common causes:**
- Out of memory (Apple Silicon uses significant RAM)
- Python errors (check logs)
- Port conflict

### Can't Connect to Server

**Verify server is running:**
```bash
npm run server:status
```

**Test health endpoint:**
```bash
curl http://localhost:8000/health
```

**Check if port is correct:**
```bash
lsof -i :8000
```

### PID File Issues

**Stale PID file (process not running):**
```bash
# Remove stale PID file
rm -f tmp/chatterbox_server.pid

# Start fresh
npm run server:start
```

## Integration with Development

### Updated `dev` Script

The `dev` npm script now starts the server as a daemon:

```bash
npm run dev
```

This will:
1. Start the server in background
2. Start the TypeScript development environment
3. Both run simultaneously without blocking

### CI/CD Considerations

For automated environments:

```bash
# Start server in CI
npm run server:start

# Wait for server to be ready
sleep 15

# Run tests
npm test

# Always cleanup
npm run server:stop
```

## Advanced Usage

### Custom Port

```bash
./start-server.sh start --port 9000
```

Update your `.env` or code to use the custom port:
```bash
export TTS_SERVER_URL=http://localhost:9000
```

### Debug Mode

```bash
./start-server.sh start --debug
```

### Running in Production

For production, consider using a process manager like PM2 or systemd:

**PM2 Example:**
```bash
pm2 start "npm run server:start" --name chatterbox-tts
pm2 status
pm2 logs chatterbox-tts
pm2 stop chatterbox-tts
```

**Systemd Service Example:**
```ini
[Unit]
Description=Chatterbox TTS Server
After=network.target

[Service]
Type=forking
User=youruser
WorkingDirectory=/path/to/js-podcast-gen
ExecStart=/path/to/js-podcast-gen/start-server.sh start
ExecStop=/path/to/js-podcast-gen/start-server.sh stop
PIDFile=/path/to/js-podcast-gen/tmp/chatterbox_server.pid
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

## Benefits of Daemon Mode

✅ **Non-Blocking**: Console returns immediately after starting  
✅ **Background Execution**: Server runs independently  
✅ **Persistent**: Survives terminal closures (when properly managed)  
✅ **Easy Management**: Simple start/stop/status commands  
✅ **Log Separation**: All output goes to log file  
✅ **Development Friendly**: Work on multiple terminals simultaneously  
✅ **Clean Shutdown**: Graceful termination with fallback force-kill  

## Migration from Old Script

### Old Behavior (Blocking)
```bash
./start-server.sh
# Terminal blocked, Ctrl+C needed to stop
```

### New Behavior (Daemon)
```bash
npm run server:start
# Terminal immediately available
# Server runs in background
npm run server:stop  # Clean shutdown
```

### Backward Compatibility

The script maintains backward compatibility:
```bash
./start-server.sh          # Still works, starts as daemon
./start-server.sh start    # Explicit daemon start (recommended)
```

---

**Happy podcast generating! 🎙️✨**

For more information, run: `npm run server:help`
