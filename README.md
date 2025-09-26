# 🎙️ Podcast Generator with Chatterbox TTS

> **Professional podcast generation tool featuring clean modular architecture, Apple Silicon optimization, and intelligent voice customization.**

Transform text content into high-quality podcasts using local AI services while maintaining clean, maintainable, and scalable code architecture.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![Apple Silicon](https://img.shields.io/badge/Apple%20Silicon-Optimized-orange)](https://developer.apple.com/documentation/metalperformanceshaders)

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
- **Interactive Confirmation** - Preview generated script before synthesis

## 📋 Prerequisites

- **Apple Silicon Mac** (M1/M2/M3/M4 for optimal performance)
- **Node.js 18+** (for built-in fetch support)
- **Python 3.11** (required for Metal PyTorch compatibility)
- **FFmpeg** - `brew install ffmpeg`
- **Ollama** (for script generation)
- **8GB+ RAM** (recommended for model loading)

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

## 🎯 Usage

### Command Line Interface

#### Basic Commands
```bash
# Check system status
node dist/index.js status

# List available voice presets
node dist/index.js voices

# Generate podcast with confirmation (default)
node dist/index.js generate -f input.txt -o output.mp3

# Auto-approve script without confirmation
node dist/index.js generate -f input.txt -o output.mp3 -y
```

#### Advanced Voice Control
```bash
# Use specific voice preset
node dist/index.js generate \
  -f content.txt \
  -o podcast.mp3 \
  --voice deep_male \
  --temperature 0.1 \
  --exaggeration 0.2 \
  --cfg-scale 0.3

# Custom LLM configuration
node dist/index.js generate \
  -f input.txt \
  -o output.mp3 \
  --ollama-url "http://remote:11434" \
  --ollama-model "llama3.1:8b" \
  --podcast-prompt "Create an engaging tech podcast segment"
```

#### Convenience Scripts
```bash
# Quick generation with default settings
./generate-podcast.sh input.txt output.mp3

# Start TTS server
./start-tts-server.sh
```

### Configuration Parameters

#### LLM Configuration
| Parameter | Description | Default |
|-----------|-------------|---------|
| `--ollama-url <url>` | Ollama server URL | `http://localhost:11434` |
| `--ollama-model <model>` | Model name | `llama3.2:3b` |
| `--podcast-prompt <template>` | Custom prompt (use `{INPUT_TEXT}`) | Built-in template |

#### Voice Parameters
| Parameter | Range | Description | Default |
|-----------|-------|-------------|---------|
| `--voice <preset>` | See presets below | Voice preset | `masculine` |
| `--temperature` | 0.0-1.0 | Voice randomness (lower = consistent) | Auto-optimized |
| `--exaggeration` | 0.0-1.0 | Voice character emphasis | 0.3 |
| `--cfg-scale` | 0.0-1.0 | Voice generation control | 0.4 |
| `--top-p` | 0.0-1.0 | Nucleus sampling | Auto-optimized |
| `--top-k` | number | Top-k sampling | Auto-optimized |

## 🎙️ Voice Presets

Professional voice presets designed to eliminate feminine-sounding output:

| Preset | Description | Best For |
|--------|-------------|----------|
| `masculine` | **Default** - Balanced male voice | General podcasts, tech content |
| `deep_male` | Deeper, more stable characteristics | News, documentaries |
| `professional` | Corporate/news anchor style | Business content, presentations |
| `default` | Original settings | Testing only (may sound feminine) |
| `feminine` | Explicitly feminine characteristics | Specific requirements |

### Voice Testing
```bash
# List all presets with descriptions
node dist/index.js voices

# Quick test using shell script
./tmp/scripts/test_voice_quick.sh

# Comprehensive testing (requires aiohttp)
pip install aiohttp
python tmp/scripts/test_voice_presets.py
```

## 📁 Project Structure

```
src/
├── controllers/              # User interface and workflow orchestration
│   ├── CLIController.ts     # Command-line interface handling
│   └── PodcastController.ts # Podcast generation workflow
├── services/                # Business logic layer
│   ├── tts/                # Text-to-speech services
│   │   ├── TTSService.ts           # TTS orchestration
│   │   └── ChatterboxProvider.ts   # Chatterbox implementation
│   ├── llm/                # Large language model services
│   │   ├── LLMService.ts           # LLM orchestration
│   │   └── OllamaProvider.ts       # Ollama implementation
│   └── audio/              # Audio processing services
│       ├── AudioService.ts         # Audio orchestration
│       └── FFmpegConcatenator.ts   # FFmpeg implementation
├── utilities/               # Reusable helper functions
│   ├── fileUtils.ts        # File operations
│   ├── configUtils.ts      # Configuration management
│   ├── validationUtils.ts  # Input validation
│   └── loggerUtils.ts      # Logging utilities
├── interfaces/              # TypeScript contracts and types
│   ├── types.ts            # Core types and custom errors
│   ├── ITTSProvider.ts     # TTS provider contract
│   ├── IAudioProcessor.ts  # Audio processor contract
│   ├── ILLMProvider.ts     # LLM provider contract
│   └── ILogger.ts          # Logger contract
└── index.ts                # Application entry point

tmp/                        # Temporary files (organized structure)
├── audio/
│   ├── segments/          # Intermediate audio processing
│   ├── tests/             # Voice preset test samples
│   └── output/            # Generated podcasts
├── scripts/               # Test and utility scripts
├── data/                  # Sample content and test data
└── logs/                  # Debug and application logs
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

### Service Status Check
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

## 💡 Examples

### Basic Usage
```bash
# Simple podcast generation
echo "Welcome to Tech Talk Today." > sample.txt
node dist/index.js generate -f sample.txt -o tech-talk.mp3
```

### Advanced Configuration
```bash
# Create tech content
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
```

### Batch Processing
```bash
# Generate multiple podcasts
for file in content/*.txt; do
    output="podcasts/$(basename "$file" .txt).mp3"
    echo "Processing $file -> $output"
    
    node dist/index.js generate \
      -f "$file" \
      -o "$output" \
      --voice masculine \
      -y  # Auto-approve
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

#### FFmpeg Issues
```bash
# Install/reinstall FFmpeg
brew install ffmpeg

# Check availability
ffmpeg -version
node dist/index.js status
```

### Debug Mode
```bash
# Enable detailed logging
export DEBUG=true
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
```

#### Memory Management
```bash
# Adjust segment processing for large files
export MAX_SEGMENT_LENGTH=300  # Smaller segments
export SEGMENT_DELAY=2000      # Longer delays between requests
```

## 🚀 Performance Notes

### Apple Silicon Optimization
- **First run**: Downloads ~3GB models (2-3 minutes)
- **MPS Acceleration**: ~2-3x faster than CPU on M1/M2/M3/M4
- **Memory Usage**: ~4-6GB RAM during processing
- **Audio Quality**: 24kHz output with professional voice presets

### Processing Speed
- **Short text** (< 500 chars): ~10-15 seconds
- **Medium text** (500-2000 chars): ~30-60 seconds  
- **Long text** (> 2000 chars): ~1-3 minutes

### Best Practices
1. **Use masculine presets** to avoid feminine-sounding output
2. **Monitor memory** during long processing sessions
3. **Test voice presets** before batch processing
4. **Keep segments reasonable** (300-600 characters)
5. **Use debug mode** for troubleshooting issues

## 🏗️ Development

### Building & Development
```bash
# Development mode with auto-rebuild
npm run dev

# Build TypeScript
npm run build

# Lint code
npm run lint
```

### Architecture Guidelines
This project demonstrates clean architecture principles with SOLID design patterns. See [AGENTS.md](./AGENTS.md) and [ARCHITECTURE.md](./ARCHITECTURE.md) for comprehensive development guidelines.

### Key Architectural Features
- **Modular Services** - Independent TTS, LLM, and Audio processing
- **Dependency Injection** - Testable, mockable components  
- **Interface Segregation** - Small, focused contracts
- **Error Handling** - Custom error types with detailed messages
- **Temporary File Management** - Organized `tmp/` directory structure

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Review Guidelines**: Read [AGENTS.md](./AGENTS.md) for development standards
2. **Fork & Branch**: Create a feature branch from main
3. **Follow Architecture**: Maintain SOLID principles and clean code
4. **Update Documentation**: Keep README.md and ARCHITECTURE.md current
5. **Test Thoroughly**: Include voice presets and Apple Silicon compatibility
6. **Submit PR**: With clear description and rationale

### Development Standards
- **File Organization**: Follow the established `src/` structure
- **Temporary Files**: Always use `tmp/` directory with proper subdirectories
- **Error Handling**: Use custom error types with descriptive messages
- **Testing**: Place test files in `tmp/tests/` with clear naming
- **Documentation**: Update both README.md and relevant code comments

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### License Summary
- ✅ **Free to use** for personal and commercial projects
- ✅ **Fork and modify** as needed for your use case  
- ✅ **Distribute and sell** derivative works
- ⚠️ **Attribution required** - include copyright notice and license
- ❌ **No warranty** - use at your own risk

---

**🎉 Happy podcast generating! 🎙️**

> For detailed architecture documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md)
> 
> For development guidelines, see [AGENTS.md](./AGENTS.md)