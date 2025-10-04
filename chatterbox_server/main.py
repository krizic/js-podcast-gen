"""
🎙️ Chatterbox TTS Server - Modular Edition
=============================================

Professional Text-to-Speech server built with FastAPI and ChatterboxTTS.
This is the main application entry point that wires all modular components
together into a cohesive FastAPI application.

Features:
- 🎭 Multiple professional voice presets
- ⚡ Apple Silicon MPS acceleration
- 📊 Real-time performance monitoring
- 🔧 Advanced parameter control
- 📈 Audio quality analysis
- 🎵 Direct WAV/MP3 file downloads

Usage:
    python chatterbox_main.py [--port PORT] [--host HOST]

Architecture:
    - Models: Pydantic data models for validation
    - Services: Business logic for TTS, performance, audio processing
    - Controllers: FastAPI route handlers
    - Utilities: Logging, device detection, configuration
"""

# Suppress common deprecation warnings from dependencies
import warnings
warnings.filterwarnings("ignore", category=UserWarning, module="perth.perth_net")
warnings.filterwarnings("ignore", message="pkg_resources is deprecated")
warnings.filterwarnings("ignore", category=DeprecationWarning, message="on_event is deprecated")

import argparse
import asyncio
import contextlib
import signal
import sys
import time
from pathlib import Path
from typing import Any, Dict

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Import modular components
from .controllers.tts_controller import TTSController
from .controllers.system_controller import SystemController
from .services.tts_service import TTSModelManager, TTSSynthesisService
from .services.performance_service import performance_tracker, PerformanceTracker
from .config.voice_config import SERVER_CONFIG
from .utilities.logging_utils import setup_logger, create_startup_banner
from .utilities.device_utils import get_optimal_device, get_system_info


class ChatterboxServer:
    """
    🎙️ Main Chatterbox TTS Server Application
    
    Orchestrates all modular components into a professional FastAPI application
    with proper dependency injection, lifecycle management, and error handling.
    
    Attributes:
        app: FastAPI application instance
        model_manager: TTS model manager service
        audio_processor: Audio processing service
        synthesis_service: TTS synthesis orchestrator
        tts_controller: TTS endpoint controller
        system_controller: System info endpoint controller
        logger: Application logger
        startup_time: Server startup timestamp
    """
    
    def __init__(self, host: str = "0.0.0.0", port: int = 8000):
        """
        Initialize the Chatterbox server with modular components.
        
        Args:
            host: Server host address
            port: Server port number
        """
        self.host = host
        self.port = port
        self.startup_time = time.time()
        self.logger = setup_logger(__name__)
        
        # Initialize FastAPI application
        self.app = self._create_app()
        
        # Initialize core services
        self.model_manager = TTSModelManager()
        self.synthesis_service = TTSSynthesisService(self.model_manager)
        
        # Initialize controllers with dependency injection
        self.tts_controller = TTSController(self.synthesis_service)
        self.system_controller = SystemController(self.model_manager)
        
        # Register routes
        self._register_routes()
        
        # Setup event handlers
        self._setup_event_handlers()
    
    def _create_app(self) -> FastAPI:
        """
        Create and configure the FastAPI application.
        
        Returns:
            Configured FastAPI application instance
        """
        app = FastAPI(
            title="🎙️ Chatterbox TTS Server",
            description="Professional Text-to-Speech API with Apple Silicon optimization",
            version=SERVER_CONFIG["version"],
            docs_url="/docs",
            redoc_url="/redoc"
        )
        
        # Add CORS middleware for web clients
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        
        return app
    
    def _register_routes(self) -> None:
        """Register all API routes with their controller handlers."""
        
        # Root endpoint
        self.app.get("/", summary="🏠 Server Information")(
            self.system_controller.get_root_info
        )
        
        # Main TTS endpoints
        self.app.post("/synthesize", summary="🎤 Synthesize Speech (JSON)")(
            self.tts_controller.synthesize_json
        )
        
        self.app.post("/synthesize-wav", summary="🎵 Synthesize Speech (WAV Download)")(
            self.tts_controller.synthesize_wav
        )
        
        self.app.post("/synthesize-mp3", summary="🎶 Synthesize Speech (MP3 Download)")(
            self.tts_controller.synthesize_mp3
        )
        
        # System information endpoints  
        self.app.get("/health", summary="💚 Health Check")(
            self.system_controller.get_health_check
        )
        
        self.app.get("/voices", summary="🎭 List Voice Presets")(
            self.system_controller.get_voices_info
        )
        
        self.app.get("/performance", summary="📊 Performance Metrics")(
            self.system_controller.get_performance_metrics
        )
        
        self.app.get("/test", summary="🧪 Test Endpoint")(
            self.system_controller.get_test_endpoint
        )
    
    def _setup_event_handlers(self) -> None:
        """Setup application lifecycle event handlers."""
        
        @self.app.on_event("startup")
        async def startup_event():
            """Handle server startup initialization."""
            self.logger.info("🚀 Starting Chatterbox TTS Server...")
            
            # Display startup banner
            banner = create_startup_banner("Chatterbox TTS Server", SERVER_CONFIG["version"])
            print(banner)
            
            # Performance tracking is initialized on import
            
            # Load TTS model asynchronously
            await self._load_model_async()
            
            startup_time = time.time() - self.startup_time
            self.logger.info(f"✅ Server startup completed in {startup_time:.2f} seconds")
        
        @self.app.on_event("shutdown")
        async def shutdown_event():
            """Handle graceful server shutdown."""
            self.logger.info("🛑 Shutting down Chatterbox TTS Server...")
            
            # Cleanup model resources (if needed)
            if self.model_manager.is_loaded():
                # Model cleanup happens automatically when Python exits
                self.logger.info("🧹 Model resources will be cleaned up automatically")
            
            # Performance tracking cleanup (if needed)
            
            self.logger.info("✅ Server shutdown completed")
    
    async def _load_model_async(self) -> None:
        """Load the TTS model asynchronously during startup."""
        try:
            self.logger.info("📦 Loading TTS model...")
            
            # Load model synchronously (it's designed to be fast after first run)
            self.model_manager.load_model()
            
            if self.model_manager.is_loaded():
                self.logger.info("✅ TTS model loaded successfully")
                model_info = self.model_manager.get_model_info()
                self.logger.info(f"🎯 Model: {model_info.get('model_name', 'Unknown')}")
                self.logger.info(f"🔧 Device: {model_info.get('device', 'Unknown')}")
            else:
                self.logger.error("❌ Failed to load TTS model")
                
        except Exception as e:
            self.logger.error(f"💥 Error loading TTS model: {e}")
    
    def run(self) -> None:
        """
        Start the server with uvicorn.
        
        Configures and starts the uvicorn ASGI server with appropriate
        settings for development and production use.
        """
        self.logger.info(f"🌐 Starting server on {self.host}:{self.port}")
        
        # Configure uvicorn settings
        config = uvicorn.Config(
            app=self.app,
            host=self.host,
            port=self.port,
            log_level="info",
            access_log=True,
            reload=False  # Set to True for development
        )
        
        server = uvicorn.Server(config)
        
        # Setup graceful shutdown
        self._setup_signal_handlers(server)
        
        try:
            server.run()
        except KeyboardInterrupt:
            self.logger.info("🛑 Server stopped by user")
        except Exception as e:
            self.logger.error(f"💥 Server error: {e}")
            sys.exit(1)
    
    def _setup_signal_handlers(self, server: uvicorn.Server) -> None:
        """Setup signal handlers for graceful shutdown."""
        
        def signal_handler(signum, frame):
            self.logger.info(f"📡 Received signal {signum}")
            server.should_exit = True
        
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)


def parse_arguments() -> argparse.Namespace:
    """
    Parse command line arguments.
    
    Returns:
        Parsed command line arguments
    """
    parser = argparse.ArgumentParser(
        description="🎙️ Chatterbox TTS Server - Professional Edition",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python chatterbox_main.py                    # Start with default settings
  python chatterbox_main.py --port 8080       # Start on port 8080
  python chatterbox_main.py --host 127.0.0.1  # Start on localhost only
        """
    )
    
    parser.add_argument(
        "--host",
        default="0.0.0.0",
        help="Host address to bind to (default: 0.0.0.0)"
    )
    
    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="Port number to bind to (default: 8000)"
    )
    
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug mode with hot reloading"
    )
    
    return parser.parse_args()


def main() -> None:
    """
    🎯 Main entry point for the Chatterbox TTS Server.
    
    Parses command line arguments, initializes the server,
    and starts the FastAPI application with uvicorn.
    """
    # Parse command line arguments
    args = parse_arguments()
    
    # Initialize and start server
    server = ChatterboxServer(host=args.host, port=args.port)
    server.run()


if __name__ == "__main__":
    main()