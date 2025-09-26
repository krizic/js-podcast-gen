#!/bin/bash

# Podcast generation script with error checking
if [ $# -ne 2 ]; then
    echo "📚 Usage: $0 <input-file> <output-file>"
    echo ""
    echo "Examples:"
    echo "  $0 content.txt my-podcast.mp3"
    echo "  $0 story.txt bedtime-story.mp3"
    echo ""
    exit 1
fi

INPUT_FILE="$1"
OUTPUT_FILE="$2"

# Check if input file exists
if [[ ! -f "$INPUT_FILE" ]]; then
    echo "❌ Error: Input file '$INPUT_FILE' not found"
    exit 1
fi

# Check if TTS server is running
echo "🔍 Checking TTS server connection..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ TTS server is running"
else
    echo "❌ TTS server not responding at http://localhost:8000"
    echo "   Please start the server with: ./start-tts-server.sh"
    exit 1
fi

# Check server device
DEVICE=$(curl -s http://localhost:8000/health | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('device', 'unknown'))
except:
    print('unknown')
" 2>/dev/null)

if [[ "$DEVICE" == "mps" ]]; then
    echo "🚀 Server using Metal Performance Shaders (optimized)"
elif [[ "$DEVICE" == "cpu" ]]; then
    echo "⚙️  Server using CPU mode"
else
    echo "🔄 Server device: $DEVICE"
fi

echo ""
echo "🎙️  Generating podcast from '$INPUT_FILE'..."
echo "📝 Content preview:"
head -c 100 "$INPUT_FILE"
if [[ $(wc -c < "$INPUT_FILE") -gt 100 ]]; then
    echo "..."
fi
echo ""

# Build if needed
if [[ ! -f "dist/index.js" ]] || [[ "src/index.ts" -nt "dist/index.js" ]]; then
    echo "🔨 Building project..."
    npm run build
    if [[ $? -ne 0 ]]; then
        echo "❌ Build failed"
        exit 1
    fi
fi

# Generate podcast with masculine voice preset (to avoid feminine-sounding voice)
echo "🎵 Generating audio with masculine voice..."
START_TIME=$(date +%s)

node dist/index.js --file "$INPUT_FILE" --output "$OUTPUT_FILE" --voice masculine

if [[ $? -eq 0 ]]; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    # Get file size
    if [[ -f "$OUTPUT_FILE" ]]; then
        FILE_SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')
        echo ""
        echo "✅ Podcast generated successfully!"
        echo "   📁 Output: $OUTPUT_FILE ($FILE_SIZE)"
        echo "   ⏱️  Time: ${DURATION}s"
        echo "   🎧 Ready to play!"
    else
        echo "❌ Output file not created"
        exit 1
    fi
else
    echo "❌ Podcast generation failed"
    exit 1
fi