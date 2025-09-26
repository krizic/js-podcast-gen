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

def get_optimal_device():
    """Get the best available device for the current hardware"""
    if hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
        return "mps"
    elif torch.cuda.is_available():
        return "cuda"
    else:
        return "cpu"

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Chatterbox TTS Server", version="1.0.0")

# Global model instance
model = None

# Voice presets for different characteristics
VOICE_PRESETS = {
    "default": {
        "temperature": 0.3,
        "top_p": 0.7,
        "top_k": 20,
        "prompt": "[oral_2][laugh_0][break_6]"
    },
    "masculine": {
        "temperature": 0.2,  # Lower for deeper, more stable voice
        "top_p": 0.6,        # More focused sampling
        "top_k": 15,         # More conservative choices
        "prompt": "[oral_1][laugh_0][break_4]"  # Less oral, more controlled
    },
    "deep_male": {
        "temperature": 0.1,  # Very stable
        "top_p": 0.5,        # Conservative
        "top_k": 10,         # Very focused
        "prompt": "[oral_0][laugh_0][break_8]"  # Minimal orality, longer pauses
    },
    "professional": {
        "temperature": 0.25,
        "top_p": 0.65,
        "top_k": 18,
        "prompt": "[oral_1][laugh_0][break_5]"
    },
    "feminine": {
        "temperature": 0.4,  # More variation
        "top_p": 0.8,        # More diverse sampling
        "top_k": 25,         # More choices
        "prompt": "[oral_3][laugh_1][break_4]"  # More expressive
    }
}

class TTSRequest(BaseModel):
    text: str
    audio_prompt_path: Optional[str] = None
    exaggeration: float = 0.3  # Lower default for more masculine sound
    cfg_scale: float = 0.4     # Lower default for more controlled speech
    voice_preset: str = "masculine"  # Default to masculine voice
    temperature: Optional[float] = None  # Override preset temperature
    top_p: Optional[float] = None        # Override preset top_p
    top_k: Optional[int] = None          # Override preset top_k

@app.on_event("startup")
async def startup_event():
    """Initialize the Chatterbox model on server startup."""
    global model
    try:
        logger.info("Loading Chatterbox TTS model...")
        
        # Get the optimal device for this hardware
        device = get_optimal_device()
        
        if device == "mps":
            logger.info("🚀 Using Metal Performance Shaders (MPS) for acceleration")
        elif device == "cuda":
            logger.info("🚀 Using CUDA for acceleration")
        else:
            logger.info("⚠️  Using CPU (consider Metal/CUDA for better performance)")
        
        logger.info(f"Device: {device}")
        logger.info("Note: First run will download model files (~2GB). This may take several minutes...")
        
        model = ChatterboxTTS.from_pretrained(device=device)
        logger.info(f"✅ Chatterbox TTS model loaded successfully on {device}!")
        
        # Clear any cached memory
        if device == "mps":
            torch.mps.empty_cache()
        elif device == "cuda":
            torch.cuda.empty_cache()
            
    except Exception as e:
        logger.error(f"Failed to load Chatterbox model: {e}")
        raise e

@app.get("/")
def read_root():
    """Health check endpoint."""
    return {
        "status": "Chatterbox TTS Server is running", 
        "model_loaded": model is not None,
        "available_presets": list(VOICE_PRESETS.keys())
    }

@app.get("/health")
def health_check():
    """Detailed health check."""
    current_device = get_optimal_device()
    return {
        "status": "healthy" if model is not None else "unhealthy",
        "model_loaded": model is not None,
        "device": current_device,
        "mps_available": hasattr(torch.backends, 'mps') and torch.backends.mps.is_available(),
        "cuda_available": torch.cuda.is_available(),
        "pytorch_version": torch.__version__
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
        logger.info(f"🎙️  Synthesizing: '{request.text[:50]}{'...' if len(request.text) > 50 else ''}'")
        
        current_device = get_optimal_device()
        
        # Get voice preset configuration
        preset = VOICE_PRESETS.get(request.voice_preset, VOICE_PRESETS["masculine"])
        
        # Use request overrides if provided, otherwise use preset values
        temperature = request.temperature if request.temperature is not None else preset["temperature"]
        top_p = request.top_p if request.top_p is not None else preset["top_p"]
        top_k = request.top_k if request.top_k is not None else preset["top_k"]
        
        logger.info(f"Voice: {request.voice_preset}, Device: {current_device}")
        logger.info(f"Params: temp={temperature:.2f}, top_p={top_p:.2f}, top_k={top_k}")
        
        # Configure generation parameters for voice characteristics
        params_infer_code = {
            'spk_emb': None,
            'temperature': temperature,
            'top_P': top_p,
            'top_K': top_k,
        }
        
        params_refine_text = {
            'prompt': preset["prompt"]
        }
        
        # Use inference mode for better performance
        with torch.inference_mode():
            # Generate speech waveform using Chatterbox TTS with voice controls
            wavs = model.infer(
                [request.text], 
                params_refine_text=params_refine_text,
                params_infer_code=params_infer_code,
                use_decoder=True
            )
        
        # Extract audio data
        if wavs and len(wavs) > 0:
            wav = wavs[0]
        else:
            raise HTTPException(status_code=500, detail="No audio generated")
        
        # Move tensor to CPU for audio processing if it's on GPU
        if hasattr(wav, 'cpu'):
            wav = wav.cpu()
        
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
        
        logger.info(f"✅ Generated {len(audio_base64)} bytes of audio ({wav.shape})")
        
        return {
            "audio": audio_base64,
            "sample_rate": sample_rate,
            "format": "wav", 
            "success": True,
            "device_used": current_device,
            "voice_preset": request.voice_preset,
            "voice_params": {
                "temperature": temperature,
                "top_p": top_p,
                "top_k": top_k
            }
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