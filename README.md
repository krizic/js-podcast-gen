# 🎙️ Podcast Generator with Chatterbox TTS

A professional podcast generation tool featuring clean modular architecture, Apple S#### Advanced voice control
node dist/index.js generate \
  -f content.txt \
  -o podcast.mp3 \
  --voice deep_male \
  --temperature 0.1 \
  --exaggeration 0.2 \
  --cfg-scale 0.3

# Configurable LLM and Prompt Parameters (New!)
node dist/index.js generate \
  -f input.txt \
  -o output.mp3 \
  --voice masculine \
  --ollama-url "http://custom-server:11434" \
  --ollama-model "llama3.1:8b" \
  --podcast-prompt "Convert this to an engaging conversation between two hosts: {INPUT_TEXT}"
```

#### Configurable Parameters

**LLM Configuration:**
- `--ollama-url <url>`: Ollama server URL (default: http://localhost:11434)
- `--ollama-model <model>`: Model name (default: llama3.2:3b)
- `--podcast-prompt <template>`: Custom prompt (use `{INPUT_TEXT}` as placeholder)

**Voice Parameters:**
- `--voice <preset>`: Voice preset (masculine, deep_male, professional, default, feminine)
- `--temperature <0.0-1.0>`: Voice randomness (lower = more consistent)
- `--exaggeration <0.0-1.0>`: Voice character emphasis (default: 0.3)
- `--cfg-scale <0.0-1.0>`: Voice generation control (default: 0.4)
- `--top-p <0.0-1.0>`: Nucleus sampling for voice generation
- `--top-k <number>`: Top-k sampling for voice generation

#### Convenience Scriptsmization, and intelligent voice customization.

## ✨ Key Features

### 🏗️ **Modern Architecture**
- **SOLID Principles** - Clean, maintainable, and testable codebase
- **Modular Design** - Separated services, controllers, and utilities
- **Dependency Injection** - Easy testing and extensibility
- **TypeScript** - Full type safety and excellent developer experience

### 🚀 **Performance & Quality**
- **Apple Silicon Optimized** - Metal Performance Shaders (MPS) acceleration 
- **High-quality TTS** - Chatterbox TTS with 24kHz audio output
- **Intelligent Segmentation** - Natural text splitting for optimal speech flow
- **Professional Audio** - FFmpeg concatenation for seamless MP3 output

### 🎤 **Voice Control**
- **5 Voice Presets** - Masculine, deep_male, professional, feminine, default
- **Advanced Parameters** - Temperature, top_p, top_k fine-tuning
- **Masculine Default** - Addresses feminine-sounding voice issues
- **Real-time Testing** - Voice preset comparison tools

### 🤖 **AI Integration**
- **Ollama LLM** - Intelligent podcast script generation
- **System/User Prompts** - Proper LLM prompt engineering for better results
- **Configurable Models** - Custom Ollama URL and model selection

### 👤 **User Experience**
- **Interactive Confirmation** - Preview generated script before synthesis
- **Auto-Approval Mode** - Skip confirmation with `-y` flag for automation
- **Progress Feedback** - Clear status updates throughout the process
- **Graceful Cancellation** - Easy exit at script approval stage
- **Local Processing** - Privacy-focused, no external API calls
- **Flexible Models** - Support for various Ollama models
- **Smart Prompting** - Optimized prompts for natural speech

## Prerequisites

- **Apple Silicon Mac** (M1/M2/M3 for optimal performance)
- **Node.js 18+** (for built-in fetch support)
- **Python 3.11** (required for Metal PyTorch compatibility)
- **FFmpeg** (for audio concatenation) - `brew install ffmpeg`
- **Ollama server** running locally or remotely
- **8GB+ RAM** (for model loading)

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd js-podcast-gen
npm install
```

### 2. Setup Services
```bash
# Install TTS server with Apple Silicon optimization
./setup_chatterbox.sh
./setup_metal_pytorch.sh

# Start the TTS server
./start-tts-server.sh
```

### 3. Generate Your First Podcast
```bash
# Create sample content
echo "Welcome to my podcast about artificial intelligence and machine learning." > sample.txt

# Generate podcast with default masculine voice
node dist/index.js generate -f sample.txt -o my-podcast.mp3

# Or use the convenience script
./generate-podcast.sh sample.txt my-podcast.mp3
```

## 📋 Prerequisites

- **Apple Silicon Mac** (M1/M2/M3/M4 for optimal performance)
- **Node.js 18+** (for built-in fetch support)
- **Python 3.11** (required for Metal PyTorch compatibility)
- **FFmpeg** - `brew install ffmpeg`
- **Ollama** (for script generation)
- **8GB+ RAM** (recommended for model loading)

## ⚙️ Installation & Setup

### Automated Setup
```bash
# Complete setup in one command
./setup_chatterbox.sh && ./setup_metal_pytorch.sh
```

### Manual Setup
```bash
# 1. Node.js dependencies
npm install

# 2. Python environment
python3 -m venv chatterbox_env
source chatterbox_env/bin/activate

# 3. Python dependencies with Metal support
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt

# 4. Build TypeScript
npm run build
```

### Environment Configuration
```bash
# Optional environment variables
export TTS_SERVER_URL="http://localhost:8000"
export OLLAMA_HOST="http://localhost:11434"
export OLLAMA_MODEL="llama2:latest"
export DEBUG="true"  # Enable debug logging
```
## 🎯 Usage

### Command Line Interface

The application provides multiple ways to generate podcasts:

#### New Modular CLI (Recommended)
```bash
# Generate podcast with explicit command
node dist/index.js generate -f input.txt -o output.mp3 --voice masculine

# Check system status
node dist/index.js status

# List available voice presets
node dist/index.js voices

# Advanced voice control
node dist/index.js generate \
  -f content.txt \
  -o podcast.mp3 \
  --voice deep_male \
  --temperature 0.1 \
  --exaggeration 0.2 \
  --cfg-scale 0.3

# Interactive script confirmation (default behavior)
node dist/index.js generate -f input.txt -o output.mp3

# Auto-approve script without confirmation
node dist/index.js generate -f input.txt -o output.mp3 -y

# Custom LLM configuration with confirmation
node dist/index.js generate \
  -f content.txt \
  -o podcast.mp3 \
  --ollama-url "http://remote:11434" \
  --ollama-model "llama3.1:8b" \
  --podcast-prompt "Create an engaging tech podcast segment"
```

#### Convenience Scripts
```bash
# Quick generation with default settings (masculine voice)
./generate-podcast.sh input.txt output.mp3

# Start TTS server
./start-tts-server.sh
```

#### Legacy Syntax (Still Supported)
```bash
# Original CLI format continues to work
node dist/index.js -f input.txt -o output.mp3 --voice masculine
```

### Service Management

#### Check Service Status
```bash
node dist/index.js status
```

**Example Output:**
```
Service Status:
  TTS Server:      ✅ Healthy
  LLM Service:     ✅ Available  
  Audio Processing: ✅ Available

Configuration:
  TTS URL:         http://localhost:8000
  Ollama Host:     http://localhost:11434
  Default Model:   gpt-oss:latest
```

#### Start Services
```bash
# Start TTS server (Terminal 1)
./start-tts-server.sh

# Or manually
source chatterbox_env/bin/activate
python chatterbox_server.py
```
```bash
# Quick generation with convenience script (uses masculine voice by default)
./generate-podcast.sh content.txt my-podcast.mp3

# Or build and run manually
npm run build
node dist/index.js --file content.txt --output my-podcast.mp3
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

## 🎙️ Voice Customization

Professional voice presets designed to eliminate feminine-sounding output and provide masculine, professional audio:

### Available Voice Presets

View all presets with descriptions:
```bash
node dist/index.js voices
```

| Preset | Description | Use Case |
|--------|-------------|----------|
| `masculine` | **Default** - Balanced male voice | General podcasts, tech content |
| `deep_male` | Deeper, more stable characteristics | News, documentaries |
| `professional` | Corporate/news anchor style | Business content, presentations |
| `default` | Original settings | Testing only (may sound feminine) |
| `feminine` | Explicitly feminine characteristics | Specific requirements |

### Voice Control Examples

#### Basic Voice Selection
```bash
# Recommended masculine voice (default)
node dist/index.js generate -f content.txt -o podcast.mp3 --voice masculine

# Deep, stable voice for serious content
node dist/index.js generate -f content.txt -o podcast.mp3 --voice deep_male

# Professional news anchor style
node dist/index.js generate -f content.txt -o podcast.mp3 --voice professional
```

#### Advanced Voice Tuning
```bash
# Fine-tune voice characteristics
node dist/index.js generate -f content.txt -o podcast.mp3 \
  --voice masculine \
  --exaggeration 0.2 \
  --cfg-scale 0.3 \
  --temperature 0.15

# Maximum stability and consistency
node dist/index.js generate -f content.txt -o podcast.mp3 \
  --voice deep_male \
  --temperature 0.1 \
  --top-p 0.4 \
  --top-k 10
```

#### Voice Parameter Reference

| Parameter | Range | Description | Recommended |
|-----------|-------|-------------|-------------|
| `--temperature` | 0.0-1.0 | Voice randomness (lower = more stable) | 0.1-0.2 |
| `--top-p` | 0.0-1.0 | Nucleus sampling (lower = more focused) | 0.4-0.6 |
| `--top-k` | 1+ | Top-k sampling (lower = more consistent) | 10-15 |
| `--exaggeration` | 0.0-1.0 | Voice expressiveness | 0.2-0.3 |
| `--cfg-scale` | 0.0-1.0 | Classifier guidance | 0.3-0.4 |

### Voice Testing Tools

```bash
# Quick test using curl
./test_voice_quick.sh

# Or test with Python (requires aiohttp)
pip install aiohttp
python3 test_voice_presets.py
```

Generate audio samples for all voice presets:
```bash
# Quick test using shell script
./tmp/scripts/test_voice_quick.sh

# Or comprehensive Python testing (requires aiohttp)
pip install aiohttp
python tmp/scripts/test_voice_presets.py
```

## 📁 Project Structure

The application follows clean architecture principles with clear separation of concerns:

```
src/
├── controllers/           # User interface and workflow orchestration
│   ├── CLIController.ts   # Command-line interface handling
│   └── PodcastController.ts # Podcast generation workflow
├── services/             # Business logic layer
│   ├── tts/             # Text-to-speech services
│   │   ├── TTSService.ts        # TTS orchestration
│   │   └── ChatterboxProvider.ts # Chatterbox implementation
│   ├── llm/             # Large language model services
│   │   ├── LLMService.ts        # LLM orchestration
│   │   └── OllamaProvider.ts    # Ollama implementation
│   └── audio/           # Audio processing services
│       ├── AudioService.ts          # Audio orchestration
│       └── FFmpegConcatenator.ts    # FFmpeg implementation
├── utilities/           # Reusable helper functions
│   ├── fileUtils.ts     # File operations
│   ├── configUtils.ts   # Configuration management
│   ├── validationUtils.ts # Input validation
│   └── loggerUtils.ts   # Logging utilities
├── interfaces/          # TypeScript contracts and types
│   ├── types.ts         # Core types and custom errors
│   ├── ITTSProvider.ts  # TTS provider contract
│   ├── IAudioProcessor.ts # Audio processor contract
│   ├── ILLMProvider.ts  # LLM provider contract
│   └── ILogger.ts       # Logger contract
└── index.ts            # Application entry point with dependency injection

tmp/                    # Temporary files (organized per AGENTS.md)
├── audio/
│   ├── segments/       # Intermediate audio processing
│   ├── tests/          # Voice preset test samples
│   └── output/         # Generated podcasts
├── scripts/            # Test and utility scripts
├── data/              # Sample content and test data
└── logs/              # Debug and application logs
```

## ⚙️ Configuration

### Environment Variables

```bash
# TTS Server
export TTS_SERVER_URL="http://localhost:8000"

# LLM Configuration  
export OLLAMA_HOST="http://localhost:11434"
export OLLAMA_MODEL="llama2:latest"

# Application Settings
export MAX_SEGMENT_LENGTH="600"    # Characters per TTS segment
export SEGMENT_DELAY="500"         # Milliseconds between requests
export DEBUG="true"                # Enable debug logging
export TEMP_DIR="tmp"              # Temporary files directory
```

### Voice Configuration Defaults

The system uses masculine voice presets by default to avoid feminine-sounding output:

```typescript
// Default configuration in configUtils.ts
{
  voice_preset: 'masculine',  // Professional male voice
  exaggeration: 0.3,         // Moderate expressiveness  
  cfg_scale: 0.4,           // Balanced pacing
  temperature: undefined,    // Auto-optimized per preset
  top_p: undefined,         // Auto-optimized per preset
  top_k: undefined          // Auto-optimized per preset
}
```

## 💡 Complete Examples

### Example 1: Tech Podcast
```bash
# Create content
cat > tech-content.txt << EOF
Artificial intelligence is transforming how we work and live. Recent breakthroughs in 
large language models have made AI more accessible than ever. Today we'll explore the 
implications for software development and creative industries.
EOF

# Generate with professional voice
node dist/index.js generate \
  -f tech-content.txt \
  -o tech-podcast.mp3 \
  --voice professional \
  --temperature 0.15

# Check the result
ls -la tech-podcast.mp3
```

### Example 2: News Bulletin
```bash
# Create news content
echo "Breaking news: Scientists discover new method for renewable energy storage." > news.txt

# Generate with deep, authoritative voice
node dist/index.js generate \
  -f news.txt \
  -o news-bulletin.mp3 \
  --voice deep_male \
  --cfg-scale 0.3 \
  --exaggeration 0.2
```

### Example 3: Batch Processing
```bash
# Generate multiple podcasts
for file in content/*.txt; do
    output="podcasts/$(basename "$file" .txt).mp3"
    echo "Processing $file -> $output"
    
    node dist/index.js generate \
      -f "$file" \
      -o "$output" \
      --voice masculine
done
```

## 🔧 Troubleshooting

### Common Issues

#### TTS Server Not Starting
```bash
# Check Python environment
source chatterbox_env/bin/activate
python --version  # Should be 3.11+

# Check PyTorch Metal support
python -c "import torch; print(torch.backends.mps.is_available())"

# Reinstall with Metal support
./setup_metal_pytorch.sh
```

#### Memory Issues on Apple Silicon
```bash
# Monitor memory usage
activity monitor # Check Python process

# Reduce concurrent processing
export MAX_SEGMENT_LENGTH=400
export SEGMENT_DELAY=1000
```

#### Audio Quality Issues
```bash
# Test voice presets
node dist/index.js voices
./tmp/scripts/test_voice_quick.sh

# Use more conservative settings
node dist/index.js generate \
  -f content.txt \
  -o output.mp3 \
  --voice deep_male \
  --temperature 0.1 \
  --cfg-scale 0.3
```

#### FFmpeg Issues
```bash
# Install/reinstall FFmpeg
brew install ffmpeg

# Check availability
ffmpeg -version
node dist/index.js status
```

### Debug Mode

Enable detailed logging:
```bash
# Environment variable
export DEBUG=true

# Or CLI flag
node dist/index.js generate -f input.txt -o output.mp3 --debug

# Check logs
tail -f tmp/logs/app.log
```

### Performance Optimization

#### Apple Silicon (M1/M2/M3/M4)
```bash
# Verify Metal Performance Shaders
python -c "
import torch
print(f'MPS Available: {torch.backends.mps.is_available()}')
print(f'MPS Built: {torch.backends.mps.is_built()}')
"

# Monitor GPU usage
sudo powermetrics -s gpu_power -n 1
```

#### Memory Management
```bash
# Adjust segment processing
export MAX_SEGMENT_LENGTH=300  # Smaller segments
export SEGMENT_DELAY=2000      # Longer delays

# Monitor memory usage during processing
htop  # or Activity Monitor
```

## 🏗️ Architecture & Development

This project demonstrates clean architecture principles with SOLID design patterns. See [AGENTS.md](./AGENTS.md) for comprehensive development guidelines.

### Key Architectural Features

- **Modular Services** - Independent TTS, LLM, and Audio processing
- **Dependency Injection** - Testable, mockable components  
- **Interface Segregation** - Small, focused contracts
- **Error Handling** - Custom error types with detailed messages
- **Temporary File Management** - Organized `tmp/` directory structure

### Development Workflow

```bash
# Development mode with auto-rebuild
npm run dev

# Build TypeScript
npm run build

# Run tests (when implemented)
npm test

# Lint code
npm run lint
```

### Adding New Features

1. **Define interface** in `src/interfaces/`
2. **Implement service** in appropriate `src/services/` subdirectory
3. **Add utilities** in `src/utilities/` if needed
4. **Update controller** to orchestrate new functionality
5. **Follow AGENTS.md** guidelines for temporary files and testing

## 📜 License & Contributing

### License
MIT License - see LICENSE file for details.

### Contributing

1. Follow the architectural guidelines in [AGENTS.md](./AGENTS.md)
2. Keep temporary files in `tmp/` directory structure
3. Maintain SOLID principles and clean code
4. Add comprehensive error handling
5. Update documentation for new features

### Development Guidelines

- **File Organization**: Follow the established `src/` structure
- **Temporary Files**: Always use `tmp/` directory with proper subdirectories
- **Error Handling**: Use custom error types with descriptive messages
- **Testing**: Place test files in `tmp/tests/` with clear naming
- **Documentation**: Update both README.md and relevant code comments

## 🚀 Performance Notes

### Apple Silicon Optimization

- **First run**: Downloads ~3GB models (2-3 minutes)
- **MPS Acceleration**: ~2-3x faster than CPU on M1/M2/M3
- **Memory Usage**: ~4-6GB RAM during processing
- **Audio Quality**: 24kHz output with professional voice presets

### Processing Speed

- **Short text** (< 500 chars): ~10-15 seconds
- **Medium text** (500-2000 chars): ~30-60 seconds  
- **Long text** (> 2000 chars): ~1-3 minutes
- **Voice preset impact**: Minimal (<5% difference)

### Best Practices

1. **Use masculine presets** to avoid feminine-sounding output
2. **Monitor memory** during long processing sessions
3. **Test voice presets** before batch processing
4. **Keep segments reasonable** (300-600 characters)
5. **Use debug mode** for troubleshooting issues

---

**🎉 Happy podcast generating! 🎙️**
# Adjust segment processing
export MAX_SEGMENT_LENGTH=300  # Smaller segments
export SEGMENT_DELAY=2000      # Longer delays

# Monitor memory usage during processing
htop  # or Activity Monitor
```
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
# 1. Test Metal Performance (optional)
python test_metal_performance.py

# 2. Start TTS server with Metal acceleration
./start-tts-server.sh

# 3. Generate podcast (in new terminal)
echo "Welcome to my AI-powered podcast! Today we'll discuss the fascinating world of artificial intelligence and its impact on society." > content.txt
./generate-podcast.sh content.txt my-podcast.mp3
```

### Performance Testing

```bash
# Benchmark CPU vs Metal Performance Shaders
source chatterbox_env/bin/activate
python test_metal_performance.py

# Check current server device
curl -s http://localhost:8000/health | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'Device: {data[\"device\"]}')
print(f'MPS Available: {data[\"mps_available\"]}')
print(f'PyTorch: {data[\"pytorch_version\"]}')
"
```

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository** on GitHub
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)  
3. **Make your changes** following our coding standards in [AGENTS.md](AGENTS.md)
4. **Update documentation** (README.md, ARCHITECTURE.md) as needed
5. **Test thoroughly** including voice presets and Apple Silicon compatibility
6. **Commit with clear messages** (`git commit -m 'Add amazing feature'`)
7. **Push to your branch** (`git push origin feature/amazing-feature`)
8. **Open a Pull Request** with detailed description

### 📝 License Summary

- ✅ **Free to use** for personal and commercial projects
- ✅ **Fork and modify** as needed for your use case  
- ✅ **Distribute and sell** derivative works
- ⚠️ **Attribution required** - include copyright notice and license
- ⚠️ **Reference this repository** when using or distributing
- ❌ **No warranty** - use at your own risk

**Perfect for:** Open source projects, commercial applications, educational use, research, and development.