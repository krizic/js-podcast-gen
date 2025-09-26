#!/bin/bash

# Chatterbox TTS Server Setup Script
echo "Setting up Chatterbox TTS Server..."

# Check if Python 3.8+ is available
if ! python3 --version &> /dev/null; then
    echo "Error: Python 3.8+ is required but not found."
    exit 1
fi

# Create virtual environment
echo "Creating Python virtual environment..."
python3 -m venv chatterbox_env

# Activate virtual environment
echo "Activating virtual environment..."
source chatterbox_env/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install PyTorch with CUDA support (adjust based on your CUDA version)
echo "Installing PyTorch with CUDA support..."
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu118

# Install other requirements
echo "Installing other dependencies..."
pip install -r requirements.txt

echo "Setup complete!"
echo ""
echo "To start the Chatterbox TTS server:"
echo "1. Activate the environment: source chatterbox_env/bin/activate"
echo "2. Start the server: python chatterbox_server.py"
echo ""
echo "The server will be available at http://localhost:8000"
echo "You can check the health endpoint at http://localhost:8000/health"