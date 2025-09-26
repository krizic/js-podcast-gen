#!/bin/bash

echo "🚀 Setting up PyTorch with Metal Performance Shaders for Apple Silicon..."

# Check if we're on Apple Silicon
if [[ $(uname -m) != "arm64" ]]; then
    echo "⚠️  Warning: This optimization is designed for Apple Silicon Macs"
    echo "   Continuing with standard PyTorch installation..."
fi

# Activate the existing environment
if [[ -d "chatterbox_env" ]]; then
    source chatterbox_env/bin/activate
    echo "✅ Activated existing chatterbox_env"
else
    echo "❌ Error: chatterbox_env not found. Please run setup_chatterbox.sh first"
    exit 1
fi

echo "📦 Uninstalling current PyTorch to avoid conflicts..."
pip uninstall torch torchvision torchaudio -y

echo "🔧 Installing PyTorch with Metal support..."
# Install stable version with MPS support (available in PyTorch 1.12+)
pip3 install torch torchvision torchaudio

echo "🧪 Testing Metal Performance Shaders availability..."
python << EOF
import torch
import sys

print(f"Python version: {sys.version}")
print(f"PyTorch version: {torch.__version__}")

if hasattr(torch.backends, 'mps'):
    print(f"MPS available: {torch.backends.mps.is_available()}")
    print(f"MPS built: {torch.backends.mps.is_built()}")
    
    if torch.backends.mps.is_available():
        print("✅ Metal Performance Shaders ready!")
        try:
            # Test tensor creation on MPS
            x = torch.randn(5, 3).to('mps')
            print(f"✅ MPS tensor test successful: {x.device}")
            
            # Test basic operation
            y = x * 2
            print(f"✅ MPS computation test successful")
        except Exception as e:
            print(f"⚠️  MPS test failed: {e}")
    else:
        print("❌ MPS not available on this system")
else:
    print("❌ MPS backend not found in this PyTorch version")
    print("   Consider updating PyTorch for Metal support")

# Test basic PyTorch functionality
try:
    x = torch.randn(5, 3)
    print(f"✅ CPU tensor test successful: {x.device}")
except Exception as e:
    print(f"❌ Basic PyTorch test failed: {e}")
EOF

echo ""
echo "✅ Metal PyTorch setup complete!"
echo "💡 Run 'python test_metal_performance.py' to benchmark performance"