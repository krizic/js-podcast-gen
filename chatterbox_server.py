#!/usr/bin/env python3
"""
Chatterbox TTS Server
A FastAPI server that provides text-to-speech synthesis using Chatterbox TTS.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torchaudio as ta
from chatterbox import ChatterboxTTS
import torch
import base64
from io import BytesIO
import io
import warnings

# Suppress warnings for cleaner output
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=FutureWarning)
import uvicorn
import logging
from typing import Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Chatterbox TTS Server", version="1.0.0")

# Global model instance
model = None

class TTSRequest(BaseModel):
    text: str
    audio_prompt_path: Optional[str] = None  # Optional path to a voice reference audio file
    exaggeration: float = 0.5  # Controls emotional expressiveness (0.25-2.0)
    cfg_scale: float = 0.5     # Controls pacing; lower values can slow down fast speakers

@app.on_event("startup")
async def startup_event():
    """Initialize the Chatterbox model on server startup."""
    global model
    try:
        logger.info("Loading Chatterbox TTS model...")
        # Use CPU for initial testing to avoid large model downloads
        device = "cpu"
        logger.info(f"Using device: {device}")
        logger.info("Note: First run will download model files (~2GB). This may take several minutes...")
        model = ChatterboxTTS.from_pretrained(device=device)
        logger.info(f"Chatterbox TTS model loaded successfully on {device}!")
    except Exception as e:
        logger.error(f"Failed to load Chatterbox model: {e}")
        raise e

@app.get("/")
def read_root():
    """Health check endpoint."""
    return {"status": "Chatterbox TTS Server is running", "model_loaded": model is not None}

@app.get("/health")
def health_check():
    """Detailed health check."""
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    return {
        "status": "healthy" if model is not None else "unhealthy",
        "model_loaded": model is not None,
        "device": device if model is not None else None
    }

@app.post("/synthesize")
def synthesize_speech(request: TTSRequest):
    """
    Synthesize speech from text using Chatterbox TTS.
    
    Args:
        request: TTSRequest containing text and optional parameters
        
    Returns:
        JSON response with base64-encoded audio data
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        logger.info(f"Synthesizing speech for text: {request.text[:50]}...")
        
        # Generate speech waveform using Chatterbox TTS
        wav = model.generate(request.text)
        
        # Chatterbox typically uses 24kHz sample rate
        sample_rate = 24000
        
        # Ensure wav is properly shaped for torchaudio
        if wav.dim() == 1:
            wav = wav.unsqueeze(0)  # Add channel dimension
        
        # Save to a bytes buffer and encode for JSON response  
        buffer = BytesIO()
        ta.save(buffer, wav, sample_rate, format='wav')
        buffer.seek(0)
        audio_base64 = base64.b64encode(buffer.read()).decode('utf-8')
        
        logger.info(f"Speech synthesis completed successfully")
        
        return {
            "audio": audio_base64,
            "sample_rate": sample_rate,
            "format": "wav", 
            "success": True
        }
        
    except Exception as e:
        logger.error(f"Error during speech synthesis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # Run the server
    uvicorn.run(
        "chatterbox_server:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=False,
        log_level="info"
    )