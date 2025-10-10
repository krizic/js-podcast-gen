"""
🎤 TTS API Controllers

This module contains FastAPI route handlers for TTS synthesis operations,
including JSON responses and direct audio file downloads.
"""

import time
import base64
import psutil
import os
import tempfile
import shutil
from typing import Dict, Any, Optional
from fastapi import HTTPException, File, UploadFile, Form
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
    
    async def openai_speech_endpoint(
        self,
        input: str = Form(...),
        voice: str = Form("alloy"), 
        model: str = Form("tts-1"),
        response_format: str = Form("wav"),
        speed: float = Form(1.0),
        # Chatterbox-specific parameters
        voice_preset: Optional[str] = Form("masculine"),
        exaggeration: Optional[float] = Form(None),
        cfg_weight: Optional[float] = Form(None),
        temperature: Optional[float] = Form(None),
        # Voice file upload support (matching reference repository pattern)
        voice_file: UploadFile = File(None)
    ) -> Response:
        """
        🎙️ OpenAI-compatible speech generation with custom voice upload support
        
        This endpoint matches the OpenAI TTS API format while providing Chatterbox-specific
        functionality including custom voice uploads. Follows the reference repository's 
        pattern for handling audio_prompt_path parameter.
        
        Args:
            input: Text to convert to speech
            voice: Voice name (OpenAI compatibility - mapped to voice_preset)
            model: Model name (OpenAI compatibility - ignored)
            response_format: Audio format (only WAV supported)
            speed: Playback speed (ignored - use temperature instead)
            voice_preset: Chatterbox voice preset name
            exaggeration: Voice expression level (0.0-1.0)
            cfg_weight: Configuration guidance strength (0.0-1.0)
            temperature: Sampling randomness (0.1-1.0)
            voice_file: Optional custom voice sample file
            
        Returns:
            WAV audio file as Response
            
        Raises:
            HTTPException: If synthesis fails or model not loaded
        """
        voice_file_path = None
        
        try:
            self.logger.info(f"🌍 OpenAI-compatible synthesis request: '{input[:50]}...'")
            
            # Handle voice file upload if provided
            if voice_file and voice_file.filename:
                self.logger.info(f"📁 Processing uploaded voice file: {voice_file.filename}")
                
                # Validate file type
                allowed_extensions = {'.wav', '.mp3', '.flac', '.m4a', '.ogg'}
                file_extension = Path(voice_file.filename).suffix.lower()
                
                if file_extension not in allowed_extensions:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"🚫 Unsupported audio format: {file_extension}. Supported: {', '.join(allowed_extensions)}"
                    )
                
                # Create temporary file for uploaded voice
                with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
                    shutil.copyfileobj(voice_file.file, temp_file)
                    voice_file_path = temp_file.name
                    self.logger.info(f"💾 Saved voice file to: {voice_file_path}")
            
            # Map OpenAI voice names to our presets if no custom preset specified
            if voice_preset == "masculine" and voice != "alloy":
                voice_mapping = {
                    "alloy": "masculine",
                    "echo": "professional", 
                    "fable": "energetic",
                    "onyx": "deep_male",
                    "nova": "feminine",
                    "shimmer": "warm"
                }
                voice_preset = voice_mapping.get(voice, "masculine")
                self.logger.info(f"🗺️  Mapped OpenAI voice '{voice}' to preset '{voice_preset}'")
            
            # Build synthesis request matching our internal format
            synthesis_request = TTSRequest(
                text=input,
                voice_preset=voice_preset,
                exaggeration=exaggeration,
                cfg_weight=cfg_weight,
                temperature=temperature,
                audio_prompt_path=voice_file_path  # Key parameter matching reference repository
            )
            
            # Generate audio using our existing synthesis logic
            self.logger.info(f"🚀 Starting synthesis with preset '{voice_preset}'")
            
            # Use internal synthesis but return raw audio
            synthesis_result = await self._synthesize_internal(synthesis_request)
            
            # Return WAV format directly (most compatible with OpenAI API)
            return Response(
                content=synthesis_result["audio_bytes"],
                media_type="audio/wav",
                headers={
                    "Content-Disposition": "attachment; filename=speech.wav",
                    "Content-Length": str(len(synthesis_result["audio_bytes"])),
                    "X-Audio-Duration": f"{synthesis_result['duration_seconds']:.2f}",
                    "X-Sample-Rate": str(synthesis_result["sample_rate"]),
                    "X-Synthesis-Time": f"{synthesis_result['generation_time']:.2f}",
                    "X-Voice-Preset": voice_preset,
                    "X-Custom-Voice": "true" if voice_file_path else "false"
                }
            )
            
        except HTTPException:
            raise
        except Exception as e:
            self.logger.error(f"💥 OpenAI-compatible synthesis failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"🚫 Speech generation failed: {str(e)}")
        
        finally:
            # Clean up temporary voice file
            if voice_file_path and os.path.exists(voice_file_path):
                try:
                    os.unlink(voice_file_path)
                    self.logger.info(f"🗑️  Cleaned up temporary voice file")
                except Exception as e:
                    self.logger.warning(f"⚠️  Failed to clean up voice file: {e}")
    
    async def openai_speech_upload_endpoint(
        self,
        input: str = Form(...),
        voice_preset: str = Form("masculine"),
        exaggeration: Optional[float] = Form(None),
        cfg_weight: Optional[float] = Form(None), 
        temperature: Optional[float] = Form(None),
        voice_file: UploadFile = File(...)
    ) -> Response:
        """
        🎙️ OpenAI-compatible speech generation with required voice upload
        
        Dedicated endpoint for custom voice synthesis that requires a voice file.
        This matches the reference repository's /v1/audio/speech/upload pattern.
        
        Args:
            input: Text to convert to speech
            voice_preset: Chatterbox voice preset for base characteristics  
            exaggeration: Voice expression level (0.0-1.0)
            cfg_weight: Configuration guidance strength (0.0-1.0)
            temperature: Sampling randomness (0.1-1.0)
            voice_file: Required custom voice sample file
            
        Returns:
            WAV audio file as Response
            
        Raises:
            HTTPException: If synthesis fails or no voice file provided
        """
        self.logger.info(f"📤 Voice upload synthesis request: '{input[:50]}...'")
        
        # This endpoint requires a voice file
        if not voice_file or not voice_file.filename:
            raise HTTPException(
                status_code=400,
                detail="🚫 Voice file is required for this endpoint"
            )
        
        # Delegate to main OpenAI endpoint with required voice file
        return await self.openai_speech_endpoint(
            input=input,
            voice="custom",  # Use custom mapping
            voice_preset=voice_preset,
            exaggeration=exaggeration,
            cfg_weight=cfg_weight,
            temperature=temperature,
            voice_file=voice_file
        )
    
    async def _synthesize_internal(self, request: TTSRequest) -> Dict[str, Any]:
        """
        Internal synthesis helper that returns structured audio data.
        
        This is a refactored version of the synthesis logic that can be reused
        by different endpoints (JSON, WAV, MP3, OpenAI-compatible).
        
        Args:
            request: TTSRequest with all synthesis parameters
            
        Returns:
            Dict containing audio_bytes, duration_seconds, sample_rate, generation_time, etc.
            
        Raises:
            HTTPException: If synthesis fails
        """
        # Check if model is loaded
        if not self.synthesis_service.model_manager.is_loaded():
            raise HTTPException(status_code=503, detail="🚫 TTS model not loaded yet")
        
        synthesis_start = time.time()
        request_id = int(time.time() * 1000000) % 1000000
        
        self.logger.info(f"🎯 Internal synthesis #{request_id}: '{request.text[:100]}{'...' if len(request.text) > 100 else ''}'")
        
        try:
            # Generate audio using synthesis service
            wav_tensor, analysis, _ = await self.synthesis_service.synthesize_to_tensor(request)
            
            # Convert to audio bytes
            audio_bytes = self.synthesis_service.audio_processor.tensor_to_wav_bytes(wav_tensor)
            
            # Build synthesis result matching expected format
            synthesis_result = {
                "audio_bytes": audio_bytes,
                "duration_seconds": analysis["duration_seconds"],
                "sample_rate": analysis["sample_rate"],
                "generation_time": analysis["generation_time"],
                "audio_analysis": analysis
            }
            
            total_time = time.time() - synthesis_start
            
            # Add timing information to result
            synthesis_result["total_time"] = total_time
            synthesis_result["request_id"] = request_id
            
            self.logger.info(f"✅ Internal synthesis #{request_id} complete: {synthesis_result['duration_seconds']:.2f}s audio in {total_time:.2f}s")
            
            return synthesis_result
            
        except Exception as e:
            self.logger.error(f"💥 Internal synthesis #{request_id} failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"🚫 Synthesis failed: {str(e)}")
    
    async def upload_voice_to_library(
        self,
        voice_name: str = Form(...),
        voice_file: UploadFile = File(...),
        language: Optional[str] = Form("en"),
        description: Optional[str] = Form(None)
    ) -> Dict[str, Any]:
        """
        📤 Upload a voice sample to the voice library
        
        Args:
            voice_name: Unique name for the voice
            voice_file: Voice sample audio file
            language: Language code (default: "en")
            description: Optional description of the voice
            
        Returns:
            Upload confirmation with voice metadata
            
        Raises:
            HTTPException: If upload fails or voice name exists
        """
        try:
            self.logger.info(f"📤 Uploading voice '{voice_name}' to library")
            
            # Validate file type
            allowed_extensions = {'.wav', '.mp3', '.flac', '.m4a', '.ogg'}
            file_extension = Path(voice_file.filename).suffix.lower()
            
            if file_extension not in allowed_extensions:
                raise HTTPException(
                    status_code=400,
                    detail=f"🚫 Unsupported audio format: {file_extension}. Supported: {', '.join(allowed_extensions)}"
                )
            
            # Create voices directory if it doesn't exist
            voices_dir = Path("voices")
            voices_dir.mkdir(exist_ok=True)
            
            # Generate safe filename
            safe_voice_name = "".join(c for c in voice_name if c.isalnum() or c in ('-', '_')).lower()
            voice_filepath = voices_dir / f"{safe_voice_name}{file_extension}"
            
            # Check if voice already exists
            if voice_filepath.exists():
                raise HTTPException(
                    status_code=400,
                    detail=f"🚫 Voice '{voice_name}' already exists in library"
                )
            
            # Save voice file
            with open(voice_filepath, "wb") as buffer:
                shutil.copyfileobj(voice_file.file, buffer)
            
            # Create voice metadata
            voice_metadata = {
                "name": voice_name,
                "safe_name": safe_voice_name,
                "filename": voice_filepath.name,
                "filepath": str(voice_filepath),
                "language": language,
                "description": description or f"Custom voice: {voice_name}",
                "upload_date": time.time(),
                "file_size": voice_filepath.stat().st_size,
                "file_format": file_extension[1:]  # Remove the dot
            }
            
            # Save metadata to JSON file
            metadata_file = voices_dir / f"{safe_voice_name}.json"
            import json
            with open(metadata_file, "w") as f:
                json.dump(voice_metadata, f, indent=2)
            
            self.logger.info(f"✅ Voice '{voice_name}' uploaded successfully ({voice_metadata['file_size']} bytes)")
            
            return {
                "success": True,
                "message": f"Voice '{voice_name}' uploaded successfully",
                "voice": voice_metadata
            }
            
        except HTTPException:
            raise
        except Exception as e:
            self.logger.error(f"💥 Voice upload failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"🚫 Voice upload failed: {str(e)}")
    
    async def delete_voice_from_library(self, voice_name: str) -> Dict[str, Any]:
        """
        🗑️ Delete a voice from the voice library
        
        Args:
            voice_name: Name of the voice to delete
            
        Returns:
            Deletion confirmation
            
        Raises:
            HTTPException: If voice not found or deletion fails
        """
        try:
            self.logger.info(f"🗑️ Deleting voice '{voice_name}' from library")
            
            voices_dir = Path("voices")
            safe_voice_name = "".join(c for c in voice_name if c.isalnum() or c in ('-', '_')).lower()
            
            # Find voice files (audio and metadata)
            audio_files = list(voices_dir.glob(f"{safe_voice_name}.*"))
            metadata_file = voices_dir / f"{safe_voice_name}.json"
            
            if not audio_files and not metadata_file.exists():
                raise HTTPException(
                    status_code=404,
                    detail=f"🚫 Voice '{voice_name}' not found in library"
                )
            
            # Delete files
            deleted_files = []
            for file_path in audio_files + [metadata_file]:
                if file_path.exists():
                    file_path.unlink()
                    deleted_files.append(file_path.name)
            
            self.logger.info(f"✅ Voice '{voice_name}' deleted successfully")
            
            return {
                "success": True,
                "message": f"Voice '{voice_name}' deleted successfully",
                "deleted_files": deleted_files
            }
            
        except HTTPException:
            raise
        except Exception as e:
            self.logger.error(f"💥 Voice deletion failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"🚫 Voice deletion failed: {str(e)}")