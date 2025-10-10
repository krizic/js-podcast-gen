"""
📊 System Information Controllers

This module contains FastAPI route handlers for system health,
performance metrics, and server information endpoints.
"""

import time
from typing import Dict, Any
from fastapi import HTTPException

import json
from pathlib import Path
from chatterbox_server.services.performance_service import performance_tracker
from chatterbox_server.services.tts_service import TTSModelManager
from chatterbox_server.config.voice_config import VOICE_PRESETS, SERVER_CONFIG
from chatterbox_server.utilities.device_utils import get_optimal_device, get_system_info
from chatterbox_server.utilities.logging_utils import setup_logger


class SystemController:
    """
    💚 System Information Controller
    
    Handles HTTP requests for server health checks, performance metrics,
    voice preset information, and system status endpoints.
    
    Attributes:
        model_manager: TTS model manager for checking model status
        logger: Logger instance for request tracking
    """
    
    def __init__(self, model_manager: TTSModelManager):
        """
        Initialize the system controller.
        
        Args:
            model_manager: TTSModelManager instance for model status checks
        """
        self.model_manager = model_manager
        self.logger = setup_logger(__name__)
    
    def get_root_info(self) -> Dict[str, Any]:
        """
        🏠 Get server welcome information and quick status overview.
        
        Returns:
            Dictionary containing server information, features, and quick status
        """
        return {
            "message": "🎙️ Chatterbox TTS Server - Professional Edition",
            "version": SERVER_CONFIG["version"],
            "status": "🚀 Ready for high-quality speech synthesis" if self.model_manager.is_loaded() else "🔄 Initializing...",
            "features": [
                "🎭 Multiple professional voice presets",
                "⚡ Apple Silicon MPS acceleration", 
                "📊 Real-time performance monitoring",
                "🔧 Advanced parameter control",
                "📈 Audio quality analysis"
            ],
            "endpoints": {
                "/synthesize": "🎤 Main synthesis endpoint (JSON response)",
                "/synthesize-wav": "🎵 Direct WAV file download",
                "/synthesize-mp3": "🎶 Direct MP3 file download",
                "/health": "💚 Health and status check", 
                "/voices": "🎭 List available voice presets",
                "/performance": "📊 Server performance metrics",
                "/docs": "📚 Interactive API documentation"
            },
            "quick_status": {
                "model_loaded": self.model_manager.is_loaded(),
                "available_presets": list(VOICE_PRESETS.keys()),
                "uptime_seconds": round(time.time() - performance_tracker.metrics.start_time, 2)
            }
        }
    
    def get_health_check(self) -> Dict[str, Any]:
        """
        💚 Get comprehensive health check with system information.
        
        Returns:
            Dictionary containing server health status, system resources,
            capabilities, voice system info, and performance summary
        """
        # Get system information
        system_info = get_system_info()
        current_device = get_optimal_device()
        
        # Model status with emoji
        model_status = "✅ Loaded and Ready" if self.model_manager.is_loaded() else "❌ Not Loaded"
        status_emoji = "💚" if self.model_manager.is_loaded() else "🔄"
        
        return {
            "status": "healthy" if self.model_manager.is_loaded() else "initializing",
            "status_emoji": status_emoji,
            "server_info": {
                "version": f"{SERVER_CONFIG['version']} Professional Edition",
                "model_status": model_status,
                "device": current_device,
                "uptime_seconds": round(time.time() - performance_tracker.metrics.start_time, 2),
                "model_load_time": round(self.model_manager.load_time, 2) if self.model_manager.load_time else None
            },
            "system_resources": {
                "memory_usage_percent": system_info["memory"]["usage_percent"],
                "memory_available_gb": system_info["memory"]["available_gb"],
                "cpu_usage_percent": system_info["cpu"]["usage_percent"],
                "total_memory_gb": system_info["memory"]["total_gb"]
            },
            "capabilities": {
                "mps_available": system_info["pytorch"]["mps_available"],
                "cuda_available": system_info["pytorch"]["cuda_available"],
                "pytorch_version": system_info["pytorch"]["version"],
                "device_optimal": current_device
            },
            "voice_system": {
                "total_presets": len(VOICE_PRESETS),
                "preset_names": list(VOICE_PRESETS.keys()),
                "default_preset": "masculine",
                "advanced_parameters": ["temperature", "top_p", "min_p", "repetition_penalty", "exaggeration", "cfg_weight"]
            },
            "performance_summary": performance_tracker.get_stats()
        }
    
    def get_voices_info(self) -> Dict[str, Any]:
        """
        🎭 Get detailed information about available voice presets.
        
        Returns:
            Dictionary containing all voice presets with descriptions,
            use cases, personalities, and parameter information
        """
        voice_info = {}
        
        for preset_name, preset_config in VOICE_PRESETS.items():
            voice_info[preset_name] = {
                "name": preset_name,
                "description": preset_config["description"],
                "use_case": preset_config["use_case"],
                "personality": preset_config["personality"],
                "parameters": {
                    "temperature": preset_config["temperature"],
                    "top_p": preset_config["top_p"],
                    "min_p": preset_config["min_p"],
                    "repetition_penalty": preset_config["repetition_penalty"],
                    "exaggeration": preset_config["exaggeration"],
                    "cfg_weight": preset_config["cfg_weight"]
                }
            }
        
        return {
            "total_presets": len(VOICE_PRESETS),
            "default_preset": "masculine",
            "presets": voice_info,
            "parameter_info": {
                "temperature": "Controls creativity/randomness (0.1-1.0). Lower = more stable",
                "top_p": "Nucleus sampling threshold (0.1-1.0). Lower = more focused",
                "min_p": "Minimum probability threshold (0.01-0.2). Lower = more conservative",
                "repetition_penalty": "Reduces repetition (1.0-2.0). Higher = less repetitive",
                "exaggeration": "Voice expression level (0.0-1.0). Higher = more dramatic",
                "cfg_weight": "Configuration strength (0.0-1.0). Higher = more guided"
            }
        }
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """
        📊 Get comprehensive server performance statistics.
        
        Returns:
            Dictionary containing server performance, system status,
            model information, and efficiency metrics
        """
        stats = performance_tracker.get_stats()
        system_info = get_system_info()
        
        return {
            "server_performance": stats,
            "system_status": {
                "memory_usage_percent": system_info["memory"]["usage_percent"],
                "memory_used_gb": system_info["memory"]["used_gb"],
                "memory_total_gb": system_info["memory"]["total_gb"],
                "cpu_usage_percent": system_info["cpu"]["usage_percent"],
                "uptime_hours": round(stats["uptime_seconds"] / 3600, 2)
            },
            "model_info": self.model_manager.get_model_info(),
            "efficiency_metrics": performance_tracker.get_efficiency_metrics()
        }
    
    def get_voice_library(self) -> Dict[str, Any]:
        """
        📋 Get voice library information including presets and custom voices
        
        Returns:
            Dictionary containing voice presets and custom voice library
        """
        try:
            self.logger.info("📋 Fetching voice library information")
            
            # Get built-in voice presets
            presets_info = {}
            for preset_name, preset_config in VOICE_PRESETS.items():
                presets_info[preset_name] = {
                    "type": "preset",
                    "name": preset_name,
                    "description": preset_config["description"],
                    "personality": preset_config["personality"],
                    "use_case": preset_config["use_case"],
                    "parameters": {
                        "temperature": preset_config["temperature"],
                        "exaggeration": preset_config["exaggeration"],
                        "cfg_weight": preset_config["cfg_weight"]
                    }
                }
            
            # Get custom voices from library
            custom_voices = {}
            voices_dir = Path("voices")
            
            if voices_dir.exists():
                for metadata_file in voices_dir.glob("*.json"):
                    try:
                        with open(metadata_file, "r") as f:
                            voice_data = json.load(f)
                            voice_data["type"] = "custom"
                            custom_voices[voice_data["safe_name"]] = voice_data
                    except Exception as e:
                        self.logger.warning(f"⚠️ Failed to load voice metadata from {metadata_file}: {e}")
            
            library_info = {
                "total_voices": len(presets_info) + len(custom_voices),
                "presets": presets_info,
                "custom_voices": custom_voices,
                "voice_library_path": str(voices_dir.absolute()) if voices_dir.exists() else None,
                "supported_formats": [".wav", ".mp3", ".flac", ".m4a", ".ogg"],
                "usage": {
                    "presets": "Use 'voice_preset' parameter in synthesis requests",
                    "custom_voices": "Upload via POST /voices, then use 'audio_prompt_path' parameter",
                    "upload_endpoint": "POST /voices with form data (voice_name, voice_file, language, description)"
                }
            }
            
            self.logger.info(f"📋 Voice library: {len(presets_info)} presets, {len(custom_voices)} custom voices")
            return library_info
            
        except Exception as e:
            self.logger.error(f"💥 Failed to fetch voice library: {str(e)}")
            raise HTTPException(status_code=500, detail=f"🚫 Failed to fetch voice library: {str(e)}")
    
    def get_test_endpoint(self) -> Dict[str, Any]:
        """
        🧪 Get test endpoint information and usage examples.
        
        Returns:
            Dictionary containing server readiness status, available endpoints,
            test suggestions, and example curl commands
        """
        if not self.model_manager.is_loaded():
            return {
                "status": "❌ Not Ready",
                "message": "Model not loaded yet",
                "ready": False
            }
        
        return {
            "status": "✅ Ready for Testing", 
            "message": "Server is ready for speech synthesis",
            "ready": True,
            "endpoints_available": [
                "/synthesize - JSON response with base64 audio + metadata",
                "/synthesize-wav - Direct WAV file download",  
                "/synthesize-mp3 - Direct MP3 file download (requires FFmpeg)",
                "/voices - List all voice presets",
                "/health - Server health check",
                "/performance - Performance metrics"
            ],
            "test_suggestions": [
                "POST /synthesize-wav to download WAV files directly",
                "POST /synthesize-mp3 to download MP3 files directly", 
                "Try different voice presets: masculine, professional, energetic",
                "Check /voices for all available options"
            ],
            "quick_test_commands": {
                "wav_download": 'curl -X POST "http://localhost:8000/synthesize-wav" -H "Content-Type: application/json" -d \'{"text": "Hello world", "voice_preset": "masculine"}\' -o test.wav',
                "mp3_download": 'curl -X POST "http://localhost:8000/synthesize-mp3" -H "Content-Type: application/json" -d \'{"text": "Hello world", "voice_preset": "masculine"}\' -o test.mp3',
                "json_response": 'curl -X POST "http://localhost:8000/synthesize" -H "Content-Type: application/json" -d \'{"text": "Hello world", "voice_preset": "masculine"}\''
            }
        }