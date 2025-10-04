"""
🎭 Voice Presets and Configuration Settings

This module defines the voice presets and server configuration settings
for the Chatterbox TTS server.

Constants:
    VOICE_PRESETS: Dictionary containing all available voice presets with parameters
    SERVER_CONFIG: Server configuration settings
"""

from typing import Dict, Any


# Enhanced voice presets with comprehensive parameter sets
VOICE_PRESETS: Dict[str, Dict[str, Any]] = {
    "default": {
        "temperature": 0.8,
        "top_p": 1.0,
        "min_p": 0.05,
        "repetition_penalty": 1.2,
        "exaggeration": 0.5,
        "cfg_weight": 0.5,
        "description": "📢 Balanced default voice with natural characteristics",
        "use_case": "General purpose, conversational content",
        "personality": "neutral"
    },
    
    "masculine": {
        "temperature": 0.2,
        "top_p": 0.6,
        "min_p": 0.03,
        "repetition_penalty": 1.15,
        "exaggeration": 0.3,
        "cfg_weight": 0.35,
        "description": "👨 Strong masculine voice with controlled characteristics",
        "use_case": "Professional podcasts, tech content, authoritative narration",
        "personality": "confident"
    },
    
    "deep_male": {
        "temperature": 0.15,
        "top_p": 0.5,
        "min_p": 0.02,
        "repetition_penalty": 1.1,
        "exaggeration": 0.2,
        "cfg_weight": 0.3,
        "description": "🎯 Deep, stable male voice with minimal variation",
        "use_case": "News, documentaries, serious content",
        "personality": "authoritative"
    },
    
    "professional": {
        "temperature": 0.1,
        "top_p": 0.4,
        "min_p": 0.01,
        "repetition_penalty": 1.05,
        "exaggeration": 0.1,
        "cfg_weight": 0.25,
        "description": "💼 Corporate presenter style with clear diction",
        "use_case": "Business presentations, formal announcements",
        "personality": "formal"
    },
    
    "conversational": {
        "temperature": 0.6,
        "top_p": 0.9,
        "min_p": 0.08,
        "repetition_penalty": 1.3,
        "exaggeration": 0.7,
        "cfg_weight": 0.6,
        "description": "💬 Natural conversational style with expressive variation",
        "use_case": "Casual podcasts, storytelling, interviews",
        "personality": "friendly"
    },
    
    "energetic": {
        "temperature": 0.9,
        "top_p": 1.0,
        "min_p": 0.1,
        "repetition_penalty": 1.4,
        "exaggeration": 0.8,
        "cfg_weight": 0.7,
        "description": "⚡ High-energy, enthusiastic delivery",
        "use_case": "Marketing content, product demos, entertainment",
        "personality": "enthusiastic"
    },
    
    "feminine": {
        "temperature": 0.4,
        "top_p": 0.8,
        "min_p": 0.06,
        "repetition_penalty": 1.25,
        "exaggeration": 0.4,
        "cfg_weight": 0.45,
        "description": "👩 Feminine voice characteristics",
        "use_case": "When specifically requested for female voice content",
        "personality": "expressive"
    }
}


# Server configuration settings
SERVER_CONFIG = {
    "title": "🎙️ Chatterbox TTS Server - Professional Edition",
    "description": """
    Advanced Text-to-Speech synthesis server with professional voice presets,
    Apple Silicon optimization, and comprehensive performance monitoring.
    
    Features:
    • 🎭 Professional voice presets (masculine, deep_male, professional, etc.)
    • ⚡ Apple Silicon MPS acceleration  
    • 📊 Real-time performance metrics
    • 🔧 Advanced parameter control
    • 📈 Audio quality analysis
    • 🎯 Dynamic voice characteristic tuning
    """,
    "version": "2.0.0",
    "contact": {
        "name": "Chatterbox TTS Professional",
        "url": "https://github.com/your-repo/js-podcast-gen",
    },
    "host": "0.0.0.0",
    "port": 8000,
    "log_level": "info"
}


def get_voice_preset(preset_name: str) -> Dict[str, Any]:
    """
    Get voice preset configuration by name.
    
    Args:
        preset_name: Name of the voice preset
        
    Returns:
        Voice preset configuration dictionary
        
    Raises:
        KeyError: If preset_name is not found
    """
    if preset_name not in VOICE_PRESETS:
        raise KeyError(f"Voice preset '{preset_name}' not found. Available presets: {list(VOICE_PRESETS.keys())}")
    
    return VOICE_PRESETS[preset_name]


def get_available_presets() -> list[str]:
    """
    Get list of all available voice preset names.
    
    Returns:
        List of voice preset names
    """
    return list(VOICE_PRESETS.keys())


def get_default_preset() -> str:
    """
    Get the default voice preset name.
    
    Returns:
        Default preset name
    """
    return "masculine"