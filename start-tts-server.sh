#!/bin/bash

echo "🚀 Starting Chatterbox TTS Server with Metal acceleration..."

# Check if chatterbox_env exists
if [[ ! -d "chatterbox_env" ]]; then
    echo "❌ Error: chatterbox_env not found"
    echo "   Please run setup_chatterbox.sh first"
    exit 1
fi

# Activate environment
source chatterbox_env/bin/activate

# Check if Metal PyTorch is installed
echo "🔍 Checking PyTorch Metal support..."
python -c "
import torch
if hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
    print('✅ Metal Performance Shaders ready!')
elif hasattr(torch.backends, 'mps'):
    print('⚠️  MPS built but not available - check macOS version')
else:
    print('⚠️  MPS not available - using CPU mode')
    print('   Run ./setup_metal_pytorch.sh to upgrade')
"

echo ""
echo "🎙️  Starting Chatterbox TTS Server..."
echo "   Server will be available at http://localhost:8000"
echo "   Press Ctrl+C to stop"
echo ""

python chatterbox_server.py