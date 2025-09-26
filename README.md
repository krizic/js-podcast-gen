# Podcast Generator with Chatterbox TTS

A CLI tool that converts text to engaging podcasts using Ollama for script generation and Chatterbox TTS for high-quality speech synthesis.

## Features

- 🎙️ **High-quality speech synthesis** using Chatterbox TTS (24kHz audio)
- 🤖 **Intelligent script generation** using Ollama
- 🔧 **Local Chatterbox server** for privacy and control
- 📝 **Natural text segmentation** for better speech flow
- 🎵 **Automatic audio concatenation** with ffmpeg for seamless playback
- 🎧 **Professional MP3 output** ready for distribution

## Prerequisites

- **Node.js 18+** (for built-in fetch support)
- **Python 3.11** (recommended for Chatterbox TTS compatibility)
- **FFmpeg** (for audio concatenation) - `brew install ffmpeg` on macOS
- **Ollama server** running locally or remotely
- **8GB+ RAM** (for model loading)

## Setup

### 1. Install Node.js Dependencies

```bash
npm install
```

### 2. Set Up Chatterbox TTS Server

The setup script will create a Python virtual environment and install all required dependencies:

```bash
# Make sure you're in the project directory
cd /path/to/js-podcast-gen

# Run the setup script
./setup_chatterbox.sh
```

This will:
- Create a Python virtual environment (`chatterbox_env`)
- Install PyTorch with CUDA support
- Install Chatterbox TTS and other dependencies
- Set up FastAPI server

### 3. Start the Chatterbox Server

```bash
# Activate the Python environment
source chatterbox_env/bin/activate

# Start the Chatterbox TTS server (takes 2-3 minutes first time)
python chatterbox_server.py
```

The server will be available at `http://localhost:8000`. You can check the health at `http://localhost:8000/health`.

**Note**: First startup downloads ~3GB of models and takes 2-3 minutes to initialize.

### 4. Configure Ollama

Make sure Ollama is running and accessible. Update the host in `src/index.ts` if needed:

```typescript
const ollama = new Ollama({ host: 'http://your-ollama-host:11434' });
```

## Quick Start

### Start the Services

1. **Start Chatterbox TTS server** (in Terminal 1):
```bash
source chatterbox_env/bin/activate
python chatterbox_server.py
```

2. **Generate a podcast** (in Terminal 2):
```bash
# Build the project
npm run build

# Generate a podcast from text file
npm start -- --file your-text-file.txt --output my-podcast.mp3

# Or use the built version directly
node dist/index.js --file your-text-file.txt --output my-podcast.mp3
```

### Example Scripts

**Create a sample text file:**
```bash
echo "Welcome to Tech Talk Today. In this episode, we'll explore the latest developments in artificial intelligence and machine learning." > sample.txt
```

**Generate podcast:**
```bash
node dist/index.js --file sample.txt --output tech-talk.mp3
```

**One-liner for testing:**
```bash
echo "This is a test podcast generated with Chatterbox TTS." > test.txt && node dist/index.js --file test.txt --output test-podcast.mp3
```

## Configuration

### Environment Variables

- `CHATTERBOX_SERVER_URL`: URL of the Chatterbox server (default: `http://localhost:8000`)

### Speech Quality Parameters

You can modify the speech parameters in `src/index.ts`:

```javascript
body: JSON.stringify({
  text: text,
  exaggeration: 0.5,  // Emotional expressiveness (0.25-2.0)
  cfg_scale: 0.5      // Pacing control; lower = slower speech
})
```

**Parameter Guidelines:**
- `exaggeration: 0.3-0.7` - Natural speech
- `exaggeration: 0.8-1.2` - More expressive
- `cfg_scale: 0.3-0.5` - Slower, clearer speech  
- `cfg_scale: 0.6-1.0` - Faster speech

### Text Segmentation

The tool automatically splits long text into segments for better processing. You can adjust the segment length in the `splitIntoSegments` function:

```javascript
const maxSegmentLength = 600; // characters
```

## Server Management

### Starting the Server

```bash
source chatterbox_env/bin/activate
python chatterbox_server.py
```

### Checking Server Status

```bash
curl http://localhost:8000/health
```

### Server Endpoints

- `GET /`: Basic server status
- `GET /health`: Detailed health check
- `POST /synthesize`: Generate speech from text

## Troubleshooting

### Chatterbox Server Issues

1. **Memory Requirements**: Chatterbox needs 4-8GB RAM for model loading. Close other memory-intensive applications.

2. **First Startup**: Initial run downloads ~3GB of models. Be patient and ensure good internet connection.

3. **Server Not Starting**: Check logs for errors:
   ```bash
   python chatterbox_server.py
   # Look for model loading errors or port conflicts
   ```

4. **macOS Performance**: Uses CPU by default. For faster generation, consider using MPS (Metal Performance Shaders):
   ```python
   # In chatterbox_server.py, line 47:
   device = "mps" if torch.backends.mps.is_available() else "cpu"
   ```

### Audio Quality Issues

1. **Segmentation**: Very long text might need different segmentation. Adjust `maxSegmentLength` in `src/index.ts`.

2. **FFmpeg Not Found**: If ffmpeg is not available, segments will be saved separately:
   ```bash
   # Install ffmpeg
   brew install ffmpeg  # macOS
   sudo apt install ffmpeg  # Ubuntu
   ```

3. **Voice Quality**: Experiment with parameters for different voices:
   - **Clear narration**: `exaggeration: 0.4, cfg_scale: 0.4`
   - **Energetic host**: `exaggeration: 0.8, cfg_scale: 0.6`
   - **Calm meditation**: `exaggeration: 0.3, cfg_scale: 0.3`

## Development

### Project Structure

```
├── src/
│   └── index.ts          # Main Node.js application
├── chatterbox_server.py  # Python FastAPI server for TTS
├── chatterbox_env/       # Python virtual environment  
├── dist/                 # Compiled JavaScript output
├── requirements.txt      # Python dependencies
├── setup_chatterbox.sh   # Setup script
├── package.json          # Node.js dependencies
└── README.md
```

### Building

```bash
npm run build
```

### Testing Server Connection

```bash
# Check if server is running
curl http://localhost:8000/health

# Test speech synthesis
curl -X POST http://localhost:8000/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, this is a test."}' \
  | jq '.success'

# Should return: true
```

### Complete Workflow Example

```bash
# 1. Start TTS server (Terminal 1)
source chatterbox_env/bin/activate
python chatterbox_server.py

# 2. Create content (Terminal 2)
cat > episode1.txt << EOF
Welcome to AI Insights, the podcast where we explore cutting-edge artificial intelligence.
Today we discuss the latest breakthroughs in natural language processing.
Our guest expert shares insights on transformer models and their real-world applications.
Thank you for listening to AI Insights. Subscribe for more episodes.
EOF

# 3. Generate podcast
npm run build
node dist/index.js --file episode1.txt --output ai-insights-ep1.mp3

# 4. Verify output
ls -la ai-insights-ep1.mp3
# Should show a merged MP3 file ready for distribution
```

## License

This project is licensed under the ISC License.