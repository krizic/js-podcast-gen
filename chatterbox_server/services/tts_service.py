"""
🎙️ TTS Service Layer

This module provides the core text-to-speech synthesis functionality
including model management, audio generation, and processing.
"""

import torch
import torchaudio as ta
import hashlib
import time
import numpy as np
from typing import Optional, Dict, Any, Tuple
from io import BytesIO
import base64
import tempfile
import subprocess
import os

from chatterbox import ChatterboxTTS
from chatterbox_server.models.tts_models import TTSRequest
from chatterbox_server.config.voice_config import VOICE_PRESETS, get_voice_preset
from chatterbox_server.utilities.device_utils import get_optimal_device, clear_device_cache
from chatterbox_server.utilities.logging_utils import setup_logger


class TTSModelManager:
    """
    🧠 TTS Model Management Service
    
    Handles loading, initialization, and management of the ChatterboxTTS model
    with device optimization and performance tracking.
    
    Attributes:
        model: The loaded ChatterboxTTS model instance
        device: Computing device being used ("mps", "cuda", or "cpu")
        load_time: Time taken to load the model in seconds
        logger: Logger instance for tracking operations
    """
    
    def __init__(self):
        """Initialize the model manager with optimal device detection."""
        self.model: Optional[ChatterboxTTS] = None
        self.device = get_optimal_device()
        self.load_time: Optional[float] = None
        self.logger = setup_logger(__name__)
    
    def load_model(self) -> None:
        """
        Load the ChatterboxTTS model with comprehensive logging and optimization.
        
        Raises:
            Exception: If model loading fails
            
        Example:
            ```python
            manager = TTSModelManager()
            await manager.load_model()
            ```
        """
        self.logger.info("📦 Loading Chatterbox TTS model...")
        self.logger.info("   ⏳ This may take 30-120 seconds on first run (downloading ~2GB)")
        self.logger.info("   🔄 Subsequent starts will be much faster...")
        
        start_time = time.time()
        
        try:
            self.model = ChatterboxTTS.from_pretrained(device=self.device)
            self.load_time = time.time() - start_time
            
            self.logger.info(f"✅ Model loaded successfully in {self.load_time:.2f} seconds!")
            self.logger.info(f"🎵 Model Details:")
            self.logger.info(f"   📊 Sample Rate: {self.model.sr} Hz")
            self.logger.info(f"   🎛️  Device: {self.model.device}")
            self.logger.info(f"   🧠 Model Type: ChatterboxTTS")
            
            # Optimize memory usage
            self._optimize_memory()
            
        except Exception as e:
            self.logger.error(f"💥 Model loading failed: {str(e)}")
            raise
    
    def _optimize_memory(self) -> None:
        """Optimize memory usage based on the current device."""
        self.logger.info("🧹 Optimizing memory usage...")
        clear_device_cache(self.device)
        
        if self.device == "mps":
            self.logger.info("   🍃 MPS cache cleared")
        elif self.device == "cuda":
            self.logger.info("   🍃 CUDA cache cleared")
    
    def is_loaded(self) -> bool:
        """
        Check if the model is loaded and ready.
        
        Returns:
            True if model is loaded, False otherwise
        """
        return self.model is not None
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Get comprehensive model information.
        
        Returns:
            Dictionary containing model metadata and capabilities
        """
        if not self.is_loaded():
            return {
                "model_loaded": False,
                "device": self.device,
                "load_time": None
            }
        
        return {
            "model_loaded": True,
            "device": str(self.model.device),
            "sample_rate": self.model.sr,
            "load_time_seconds": self.load_time,
            "device_optimal": self.device
        }


class AudioProcessor:
    """
    🎵 Audio Processing Service
    
    Handles audio generation, format conversion, and quality analysis
    for TTS synthesis operations.
    """
    
    def __init__(self, model_manager: TTSModelManager):
        """
        Initialize the audio processor with a model manager.
        
        Args:
            model_manager: TTSModelManager instance for audio generation
        """
        self.model_manager = model_manager
        self.logger = setup_logger(__name__)
    
    def generate_audio(
        self, 
        text: str, 
        voice_params: Dict[str, Any],
        audio_prompt_path: Optional[str] = None
    ) -> torch.Tensor:
        """
        Generate audio tensor from text using the TTS model.
        
        Args:
            text: Text to synthesize
            voice_params: Voice parameter configuration
            audio_prompt_path: Optional path to audio prompt for voice cloning
            
        Returns:
            Generated audio tensor
            
        Raises:
            RuntimeError: If model is not loaded or generation fails
        """
        if not self.model_manager.is_loaded():
            raise RuntimeError("🚫 Model not loaded")
        
        self.logger.info(f"🚀 Generating audio on {self.model_manager.device}...")
        
        with torch.inference_mode():
            wav_tensor = self.model_manager.model.generate(
                text=text,
                temperature=voice_params['temperature'],
                top_p=voice_params['top_p'],
                min_p=voice_params['min_p'],
                repetition_penalty=voice_params['repetition_penalty'],
                exaggeration=voice_params['exaggeration'],
                cfg_weight=voice_params['cfg_weight'],
                audio_prompt_path=audio_prompt_path
            )
        
        return self._process_audio_tensor(wav_tensor)
    
    def _process_audio_tensor(self, wav_tensor: torch.Tensor) -> torch.Tensor:
        """
        Process and validate the generated audio tensor.
        
        Args:
            wav_tensor: Raw audio tensor from model
            
        Returns:
            Processed and validated audio tensor
            
        Raises:
            ValueError: If audio tensor is invalid or empty
        """
        if wav_tensor is None or (torch.is_tensor(wav_tensor) and wav_tensor.numel() == 0):
            raise ValueError("🚫 Audio generation failed - empty output")
        
        # Move to CPU and ensure tensor format
        if hasattr(wav_tensor, 'cpu'):
            wav_tensor = wav_tensor.cpu()
        
        if not torch.is_tensor(wav_tensor):
            wav_tensor = torch.tensor(wav_tensor)
        
        # Ensure proper audio format (channels, samples)
        if wav_tensor.dim() == 1:
            wav_tensor = wav_tensor.unsqueeze(0)  # Add channel dimension
        elif wav_tensor.dim() > 2:
            wav_tensor = wav_tensor.squeeze()
            if wav_tensor.dim() == 1:
                wav_tensor = wav_tensor.unsqueeze(0)
        
        # Validate audio content
        if wav_tensor.shape[1] == 0:
            raise ValueError("🚫 Generated audio has no content")
        
        peak_amplitude = torch.max(torch.abs(wav_tensor)).item()
        if peak_amplitude == 0:
            raise ValueError("🚫 Generated audio is silent")
        
        return wav_tensor
    
    def analyze_audio(self, wav_tensor: torch.Tensor) -> Dict[str, Any]:
        """
        Perform comprehensive audio quality analysis.
        
        Args:
            wav_tensor: Audio tensor to analyze
            
        Returns:
            Dictionary containing audio analysis metrics
        """
        sample_rate = self.model_manager.model.sr
        duration = wav_tensor.shape[1] / sample_rate
        peak_amplitude = torch.max(torch.abs(wav_tensor)).item()
        rms_level = torch.sqrt(torch.mean(wav_tensor**2)).item()
        dynamic_range = 20 * np.log10(peak_amplitude / (rms_level + 1e-8))
        
        analysis = {
            "duration_seconds": round(duration, 2),
            "sample_rate": sample_rate,
            "channels": wav_tensor.shape[0],
            "samples": wav_tensor.shape[1],
            "peak_amplitude": round(peak_amplitude, 4),
            "rms_level": round(rms_level, 4),
            "dynamic_range_db": round(dynamic_range, 1)
        }
        
        self.logger.info(f"🎵 Audio analysis complete:")
        self.logger.info(f"   📏 Shape: {wav_tensor.shape}")
        self.logger.info(f"   ⏰ Duration: {duration:.2f}s at {sample_rate}Hz")
        self.logger.info(f"   📊 Peak amplitude: {peak_amplitude:.4f}")
        self.logger.info(f"   📈 RMS level: {rms_level:.4f}")
        self.logger.info(f"   🎚️  Dynamic range: {dynamic_range:.1f}dB")
        
        return analysis
    
    def tensor_to_wav_bytes(self, wav_tensor: torch.Tensor) -> bytes:
        """
        Convert audio tensor to WAV format bytes.
        
        Args:
            wav_tensor: Audio tensor to convert
            
        Returns:
            WAV format audio bytes
        """
        sample_rate = self.model_manager.model.sr
        buffer = BytesIO()
        ta.save(buffer, wav_tensor, sample_rate, format='wav')
        buffer.seek(0)
        return buffer.getvalue()
    
    def tensor_to_mp3_bytes(self, wav_tensor: torch.Tensor) -> bytes:
        """
        Convert audio tensor to MP3 format bytes using FFmpeg.
        
        Args:
            wav_tensor: Audio tensor to convert
            
        Returns:
            MP3 format audio bytes
            
        Raises:
            RuntimeError: If FFmpeg is not available or conversion fails
        """
        # Check FFmpeg availability
        try:
            subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            raise RuntimeError("🚫 FFmpeg not available for MP3 conversion")
        
        sample_rate = self.model_manager.model.sr
        temp_wav_path = None
        temp_mp3_path = None
        
        try:
            # Save tensor to temporary WAV file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_wav:
                temp_wav_path = temp_wav.name
                ta.save(temp_wav_path, wav_tensor, sample_rate, format='wav')
            
            # Create temporary MP3 file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as temp_mp3:
                temp_mp3_path = temp_mp3.name
            
            # Convert WAV to MP3 using FFmpeg
            ffmpeg_cmd = [
                'ffmpeg', '-y',  # Overwrite output files
                '-i', temp_wav_path,  # Input WAV file
                '-codec:a', 'libmp3lame',  # Use LAME MP3 encoder
                '-b:a', '128k',  # 128kbps bitrate
                '-ar', str(sample_rate),  # Preserve sample rate
                temp_mp3_path  # Output MP3 file
            ]
            
            result = subprocess.run(ffmpeg_cmd, capture_output=True, text=True)
            if result.returncode != 0:
                raise RuntimeError(f"🚫 MP3 conversion failed: {result.stderr}")
            
            # Read MP3 bytes
            with open(temp_mp3_path, 'rb') as mp3_file:
                mp3_bytes = mp3_file.read()
            
            if len(mp3_bytes) == 0:
                raise RuntimeError("🚫 MP3 conversion produced empty output")
            
            return mp3_bytes
            
        finally:
            # Clean up temporary files
            for temp_path in [temp_wav_path, temp_mp3_path]:
                if temp_path and os.path.exists(temp_path):
                    try:
                        os.unlink(temp_path)
                    except Exception as e:
                        self.logger.warning(f"⚠️  Failed to clean temp file {temp_path}: {e}")


class TTSSynthesisService:
    """
    🎤 Main TTS Synthesis Service
    
    High-level service that orchestrates the complete TTS synthesis pipeline
    from text input to audio output with comprehensive error handling and logging.
    """
    
    def __init__(self, model_manager: TTSModelManager):
        """
        Initialize the synthesis service.
        
        Args:
            model_manager: TTSModelManager instance for model operations
        """
        self.model_manager = model_manager
        self.audio_processor = AudioProcessor(model_manager)
        self.logger = setup_logger(__name__)
    
    def prepare_synthesis_parameters(self, request: TTSRequest) -> Tuple[Dict[str, Any], str]:
        """
        Prepare and validate synthesis parameters from request.
        
        Args:
            request: TTS synthesis request
            
        Returns:
            Tuple of (final_parameters_dict, request_id)
        """
        # Generate unique request ID
        request_id = hashlib.md5(f"{request.text[:50]}{time.time()}".encode()).hexdigest()[:6]
        
        # Get voice preset configuration
        preset = get_voice_preset(request.voice_preset)
        
        # Prepare final parameters with overrides
        final_params = {}
        for param in ['temperature', 'top_p', 'min_p', 'repetition_penalty', 'exaggeration', 'cfg_weight']:
            request_val = getattr(request, param, None)
            final_params[param] = request_val if request_val is not None else preset[param]
        
        self.logger.info(f"🎭 Voice: {request.voice_preset} ({preset['personality']})")
        self.logger.info(f"⚙️  Parameters: temp={final_params['temperature']:.3f}, top_p={final_params['top_p']:.3f}")
        
        return final_params, request_id
    
    async def synthesize_to_tensor(self, request: TTSRequest) -> Tuple[torch.Tensor, Dict[str, Any], str]:
        """
        Synthesize text to audio tensor with full analysis.
        
        Args:
            request: TTS synthesis request
            
        Returns:
            Tuple of (audio_tensor, analysis_dict, request_id)
        """
        final_params, request_id = self.prepare_synthesis_parameters(request)
        
        self.logger.info(f"🎵 Synthesis #{request_id}: \"{request.text[:80]}{'...' if len(request.text) > 80 else ''}\"")
        
        # Generate audio
        wav_tensor = self.audio_processor.generate_audio(
            text=request.text,
            voice_params=final_params,
            audio_prompt_path=request.audio_prompt_path
        )
        
        # Analyze audio quality
        analysis = self.audio_processor.analyze_audio(wav_tensor)
        
        return wav_tensor, analysis, request_id