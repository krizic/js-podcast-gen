"""
📦 Chatterbox Controllers Package

This package contains FastAPI route controllers for the Chatterbox TTS server.

Controllers:
- TTSController: Main TTS synthesis endpoints (JSON, WAV, MP3)
- SystemController: Health checks, voice info, performance metrics

Import Examples:
    from chatterbox_server.controllers.tts_controller import TTSController
    from chatterbox_server.controllers.system_controller import SystemController
"""

from .tts_controller import TTSController
from .system_controller import SystemController

__all__ = [
    'TTSController',
    'SystemController'
]