"""
🎤 TTS Request and Response Models

This module defines the Pydantic models used for API request validation
and response formatting in the Chatterbox TTS server.

Classes:
    TTSRequest: Request model for text-to-speech synthesis operations
    TTSResponse: Response model containing audio data and comprehensive metadata
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any


class TTSRequest(BaseModel):
    """
    🎙️ Text-to-Speech Synthesis Request Model
    
    Defines the structure for TTS synthesis requests with comprehensive
    parameter validation and voice customization options.
    
    Attributes:
        text (str): Text to synthesize (required, 1-2000 characters)
        voice_preset (str): Voice preset identifier (default: "masculine")
        audio_prompt_path (Optional[str]): Path to audio prompt for voice cloning
        
    Optional Voice Parameters (override preset defaults):
        temperature (Optional[float]): Creativity/randomness (0.1-1.0)
        top_p (Optional[float]): Nucleus sampling threshold (0.1-1.0)
        min_p (Optional[float]): Minimum probability threshold (0.01-0.2)
        repetition_penalty (Optional[float]): Repetition penalty (1.0-2.0)
        exaggeration (Optional[float]): Voice exaggeration level (0.0-1.0)
        cfg_weight (Optional[float]): Configuration weight (0.0-1.0)
    
    Example:
        ```python
        request = TTSRequest(
            text="Hello, this is a professional announcement",
            voice_preset="professional",
            temperature=0.1,
            exaggeration=0.2
        )
        ```
    """
    
    text: str = Field(
        ..., 
        description="Text to synthesize (required)", 
        min_length=1, 
        max_length=2000,
        example="Hello, this is a test of the Chatterbox TTS system."
    )
    
    voice_preset: str = Field(
        "masculine", 
        description="Voice preset to use",
        example="professional"
    )
    
    audio_prompt_path: Optional[str] = Field(
        None, 
        description="Path to audio prompt file for voice cloning",
        example="/path/to/voice/sample.wav"
    )
    
    # Advanced voice parameter overrides (optional)
    temperature: Optional[float] = Field(
        None, 
        description="Creativity/randomness (0.1-1.0). Lower = more stable", 
        ge=0.1, 
        le=1.0,
        example=0.2
    )
    
    top_p: Optional[float] = Field(
        None, 
        description="Nucleus sampling threshold (0.1-1.0). Lower = more focused", 
        ge=0.1, 
        le=1.0,
        example=0.6
    )
    
    min_p: Optional[float] = Field(
        None, 
        description="Minimum probability threshold (0.01-0.2). Lower = more conservative", 
        ge=0.01, 
        le=0.2,
        example=0.03
    )
    
    repetition_penalty: Optional[float] = Field(
        None, 
        description="Repetition penalty (1.0-2.0). Higher = less repetitive", 
        ge=1.0, 
        le=2.0,
        example=1.15
    )
    
    exaggeration: Optional[float] = Field(
        None, 
        description="Voice exaggeration level (0.0-1.0). Higher = more dramatic", 
        ge=0.0, 
        le=1.0,
        example=0.3
    )
    
    cfg_weight: Optional[float] = Field(
        None, 
        description="Configuration weight (0.0-1.0). Higher = more guided", 
        ge=0.0, 
        le=1.0,
        example=0.35
    )


class TTSResponse(BaseModel):
    """
    🎵 Text-to-Speech Synthesis Response Model
    
    Comprehensive response model containing generated audio data and detailed
    metadata about the synthesis process, performance metrics, and audio analysis.
    
    Attributes:
        audio (str): Base64-encoded audio data
        sample_rate (int): Audio sample rate in Hz
        format (str): Audio format ("wav" or "mp3")
        success (bool): Whether synthesis was successful
        synthesis_info (Dict): Detailed synthesis information
        performance_metrics (Dict): Performance and timing metrics
        voice_characteristics (Dict): Applied voice parameters
        audio_analysis (Dict): Audio quality analysis
    
    Example:
        ```python
        response = TTSResponse(
            audio="UklGRiQAAABXQVZFZm10...",
            sample_rate=24000,
            format="wav",
            success=True,
            synthesis_info={
                "request_id": "abc123",
                "text_length": 45,
                "voice_preset": "professional"
            },
            performance_metrics={
                "total_time_seconds": 2.5,
                "chars_per_second": 18.0
            },
            voice_characteristics={
                "temperature": 0.1,
                "exaggeration": 0.2
            },
            audio_analysis={
                "duration_seconds": 3.2,
                "peak_amplitude": 0.85
            }
        )
        ```
    """
    
    audio: str = Field(
        ..., 
        description="Base64-encoded audio data",
        example="UklGRiQAAABXQVZFZm10IBAAAAABAAEA..."
    )
    
    sample_rate: int = Field(
        ..., 
        description="Audio sample rate in Hz",
        example=24000
    )
    
    format: str = Field(
        ..., 
        description="Audio format",
        example="wav"
    )
    
    success: bool = Field(
        ..., 
        description="Whether synthesis was successful",
        example=True
    )
    
    # Enhanced metadata sections
    synthesis_info: Dict[str, Any] = Field(
        ..., 
        description="Detailed synthesis information including request ID, text length, and voice preset used"
    )
    
    performance_metrics: Dict[str, Any] = Field(
        ..., 
        description="Performance and timing metrics including processing time and throughput"
    )
    
    voice_characteristics: Dict[str, Any] = Field(
        ..., 
        description="Applied voice parameters and configuration used for synthesis"
    )
    
    audio_analysis: Dict[str, Any] = Field(
        ..., 
        description="Audio quality analysis including duration, amplitude, and dynamic range"
    )