"""
🎤 TTS API Controllers

This module contains FastAPI route handlers for TTS synthesis operations,
including JSON responses and direct audio file downloads.
"""

import time
import base64
import psutil
from typing import Dict, Any
from fastapi import HTTPException
from fastapi.responses import Response

from chatterbox_server.models.tts_models import TTSRequest, TTSResponse
from chatterbox_server.services.tts_service import TTSSynthesisService
from chatterbox_server.services.performance_service import performance_tracker
from chatterbox_server.config.voice_config import VOICE_PRESETS, get_voice_preset
from chatterbox_server.utilities.logging_utils import setup_logger


class TTSController:
    """
    🎙️ TTS Synthesis Controller
    
    Handles HTTP requests for text-to-speech synthesis operations,
    providing both JSON responses and direct audio file downloads.
    
    Attributes:
        synthesis_service: TTS synthesis service for audio generation
        logger: Logger instance for request tracking
    """
    
    def __init__(self, synthesis_service: TTSSynthesisService):
        """
        Initialize the TTS controller.
        
        Args:
            synthesis_service: TTSSynthesisService instance for audio operations
        """
        self.synthesis_service = synthesis_service
        self.logger = setup_logger(__name__)
    
    async def synthesize_json(self, request: TTSRequest) -> TTSResponse:
        """
        🎵 Synthesize text to speech with comprehensive JSON response.
        
        Main synthesis endpoint that returns audio data as base64-encoded JSON
        along with detailed metadata, performance metrics, and audio analysis.
        
        Args:
            request: TTSRequest containing text and voice parameters
            
        Returns:
            TTSResponse with audio data and comprehensive metadata
            
        Raises:
            HTTPException: If synthesis fails or model is not loaded
        """
        if not self.synthesis_service.model_manager.is_loaded():
            self.logger.error("Model not loaded - server not ready")
            raise HTTPException(
                status_code=503, 
                detail="🚫 Model not loaded. Please wait for server initialization."
            )
        
        synthesis_start_time = time.time()
        memory_before = psutil.virtual_memory().percent
        
        try:
            # Get synthesis parameters
            final_params, request_id = self.synthesis_service.prepare_synthesis_parameters(request)
            preset = get_voice_preset(request.voice_preset)
            
            self.logger.info(f"🎙️ Starting synthesis job #{request_id}")
            self.logger.info(f"📝 Text preview: \"{request.text[:100]}{'...' if len(request.text) > 100 else ''}\"")
            self.logger.info(f"📊 Character count: {len(request.text)} chars")
            
            # Synthesize audio
            generation_start = time.time()
            wav_tensor, analysis, _ = await self.synthesis_service.synthesize_to_tensor(request)
            generation_time = time.time() - generation_start
            
            # Convert to audio bytes and base64
            audio_bytes = self.synthesis_service.audio_processor.tensor_to_wav_bytes(wav_tensor)
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            
            # Calculate performance metrics
            total_time = time.time() - synthesis_start_time
            memory_after = psutil.virtual_memory().percent
            chars_per_second = len(request.text) / total_time
            audio_per_second = analysis["duration_seconds"] / total_time
            
            # Update performance tracker
            performance_tracker.add_synthesis(
                len(request.text), 
                analysis["duration_seconds"], 
                total_time
            )
            
            # Log completion
            self.logger.info(f"✅ Synthesis job #{request_id} completed successfully!")
            self.logger.info(f"⚡ Performance: {chars_per_second:.1f} chars/s, {audio_per_second:.2f}x realtime")
            self.logger.info(f"💾 Output: {len(audio_base64):,} bytes base64, {len(audio_bytes):,} bytes WAV")
            self.logger.info(f"🧠 Memory usage: {memory_before:.1f}% → {memory_after:.1f}%")
            
            # Prepare comprehensive response
            return TTSResponse(
                audio=audio_base64,
                sample_rate=analysis["sample_rate"],
                format="wav",
                success=True,
                synthesis_info={
                    "request_id": request_id,
                    "text_length": len(request.text),
                    "voice_preset": request.voice_preset,
                    "preset_description": preset["description"],
                    "use_case": preset["use_case"],
                    "personality": preset["personality"],
                    "audio_prompt_used": request.audio_prompt_path is not None
                },
                performance_metrics={
                    "total_time_seconds": round(total_time, 3),
                    "generation_time_seconds": round(generation_time, 3),
                    "chars_per_second": round(chars_per_second, 1),
                    "realtime_factor": round(audio_per_second, 2),
                    "memory_usage_before": memory_before,
                    "memory_usage_after": memory_after,
                    "device_used": str(self.synthesis_service.model_manager.device)
                },
                voice_characteristics=final_params,
                audio_analysis={
                    **analysis,
                    "file_size_bytes": len(audio_bytes),
                    "compression_ratio": round(len(audio_base64) / len(audio_bytes), 2)
                }
            )
            
        except HTTPException:
            raise
        except Exception as e:
            error_time = time.time() - synthesis_start_time
            self.logger.error(f"💥 Synthesis job failed after {error_time:.2f}s: {str(e)}")
            raise HTTPException(status_code=500, detail=f"🚫 Synthesis error: {str(e)}")
    
    async def synthesize_wav(self, request: TTSRequest) -> Response:
        """
        🎵 Synthesize text to speech with direct WAV file download.
        
        Returns raw WAV audio file that can be directly saved with curl -o or downloaded.
        This endpoint bypasses JSON wrapping and returns the audio file directly.
        
        Args:
            request: TTSRequest containing text and voice parameters
            
        Returns:
            FastAPI Response with WAV audio content
            
        Raises:
            HTTPException: If synthesis fails or model is not loaded
        """
        if not self.synthesis_service.model_manager.is_loaded():
            raise HTTPException(
                status_code=503, 
                detail="🚫 Model not loaded. Please wait for server initialization."
            )
        
        synthesis_start_time = time.time()
        
        try:
            # Synthesize audio
            wav_tensor, analysis, request_id = await self.synthesis_service.synthesize_to_tensor(request)
            
            # Convert to WAV bytes
            audio_bytes = self.synthesis_service.audio_processor.tensor_to_wav_bytes(wav_tensor)
            
            if len(audio_bytes) == 0:
                self.logger.error("💥 WAV encoding produced zero bytes!")
                raise HTTPException(status_code=500, detail="🚫 WAV encoding failed")
            
            total_time = time.time() - synthesis_start_time
            
            # Update performance tracker
            performance_tracker.add_synthesis(
                len(request.text), 
                analysis["duration_seconds"], 
                total_time
            )
            
            self.logger.info(f"🎉 WAV synthesis #{request_id} complete: {len(audio_bytes):,} bytes in {total_time:.2f}s")
            
            return Response(
                content=audio_bytes,
                media_type="audio/wav",
                headers={
                    "Content-Disposition": f"attachment; filename=synthesis_{request_id}.wav",
                    "Content-Length": str(len(audio_bytes)),
                    "X-Audio-Duration": f"{analysis['duration_seconds']:.2f}",
                    "X-Sample-Rate": str(analysis["sample_rate"]),
                    "X-Synthesis-Time": f"{total_time:.2f}"
                }
            )
            
        except HTTPException:
            raise
        except Exception as e:
            self.logger.error(f"💥 WAV synthesis failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"🚫 WAV synthesis error: {str(e)}")
    
    async def synthesize_mp3(self, request: TTSRequest) -> Response:
        """
        🎶 Synthesize text to speech with direct MP3 file download.
        
        Returns raw MP3 audio file using FFmpeg conversion for optimal compression.
        Requires FFmpeg to be installed on the system.
        
        Args:
            request: TTSRequest containing text and voice parameters
            
        Returns:
            FastAPI Response with MP3 audio content
            
        Raises:
            HTTPException: If synthesis fails, model is not loaded, or FFmpeg unavailable
        """
        if not self.synthesis_service.model_manager.is_loaded():
            raise HTTPException(
                status_code=503, 
                detail="🚫 Model not loaded. Please wait for server initialization."
            )
        
        synthesis_start_time = time.time()
        
        try:
            # Synthesize audio
            wav_tensor, analysis, request_id = await self.synthesis_service.synthesize_to_tensor(request)
            
            self.logger.info(f"🔄 Converting WAV to MP3 with FFmpeg...")
            
            # Convert to MP3 bytes
            mp3_bytes = self.synthesis_service.audio_processor.tensor_to_mp3_bytes(wav_tensor)
            
            total_time = time.time() - synthesis_start_time
            compression_ratio = len(mp3_bytes) / (wav_tensor.shape[1] * wav_tensor.shape[0] * 2)
            
            # Update performance tracker
            performance_tracker.add_synthesis(
                len(request.text), 
                analysis["duration_seconds"], 
                total_time
            )
            
            self.logger.info(f"🎉 MP3 synthesis #{request_id} complete: {len(mp3_bytes):,} bytes in {total_time:.2f}s")
            self.logger.info(f"📦 Compression ratio: {compression_ratio:.3f} (MP3 vs raw audio)")
            
            return Response(
                content=mp3_bytes,
                media_type="audio/mpeg",
                headers={
                    "Content-Disposition": f"attachment; filename=synthesis_{request_id}.mp3",
                    "Content-Length": str(len(mp3_bytes)),
                    "X-Audio-Duration": f"{analysis['duration_seconds']:.2f}",
                    "X-Sample-Rate": str(analysis["sample_rate"]),
                    "X-Synthesis-Time": f"{total_time:.2f}",
                    "X-Compression-Ratio": f"{compression_ratio:.3f}"
                }
            )
            
        except HTTPException:
            raise
        except Exception as e:
            self.logger.error(f"💥 MP3 synthesis failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"🚫 MP3 synthesis error: {str(e)}")