"""
🔧 Device Detection and System Utilities

This module provides utilities for detecting optimal computing devices
and system information for the Chatterbox TTS server.
"""

import torch
import psutil
from typing import Literal, Dict, Any


DeviceType = Literal["mps", "cuda", "cpu"]


def get_optimal_device() -> DeviceType:
    """
    Detect the best available computing device for TTS processing.
    
    Prioritizes devices in the following order:
    1. Metal Performance Shaders (MPS) - Apple Silicon
    2. CUDA - NVIDIA GPU
    3. CPU - Fallback
    
    Returns:
        DeviceType: The optimal device identifier ("mps", "cuda", or "cpu")
        
    Example:
        ```python
        device = get_optimal_device()
        print(f"Using device: {device}")
        # Output: "Using device: mps" (on Apple Silicon)
        ```
    """
    if hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
        return "mps"
    elif torch.cuda.is_available():
        return "cuda"
    else:
        return "cpu"


def get_device_info(device: DeviceType) -> Dict[str, Any]:
    """
    Get detailed information about the specified device.
    
    Args:
        device: Device type to get information about
        
    Returns:
        Dict containing device information and capabilities
        
    Example:
        ```python
        info = get_device_info("mps")
        print(info["description"])
        # Output: "Metal Performance Shaders (MPS)"
        ```
    """
    device_info = {
        "device": device,
        "available": False,
        "description": "",
        "optimization_note": ""
    }
    
    if device == "mps":
        device_info.update({
            "available": hasattr(torch.backends, 'mps') and torch.backends.mps.is_available(),
            "description": "Metal Performance Shaders (MPS)",
            "optimization_note": "⚡ Apple Silicon acceleration enabled! 🎯 Optimized for M1/M2/M3/M4 processors"
        })
    elif device == "cuda":
        device_info.update({
            "available": torch.cuda.is_available(),
            "description": "CUDA GPU Acceleration",
            "optimization_note": "⚡ NVIDIA GPU acceleration enabled!"
        })
    else:  # cpu
        device_info.update({
            "available": True,  # CPU is always available
            "description": "CPU Processing",
            "optimization_note": "💡 Consider Apple Silicon or NVIDIA GPU for better performance"
        })
    
    return device_info


def get_system_info() -> Dict[str, Any]:
    """
    Get comprehensive system resource information.
    
    Returns:
        Dict containing memory, CPU, and system statistics
        
    Example:
        ```python
        info = get_system_info()
        print(f"Total memory: {info['memory']['total_gb']:.1f} GB")
        print(f"CPU usage: {info['cpu']['usage_percent']:.1f}%")
        ```
    """
    memory = psutil.virtual_memory()
    cpu_percent = psutil.cpu_percent(interval=1.0)  # 1-second interval for accuracy
    
    return {
        "memory": {
            "total_gb": round(memory.total / (1024**3), 1),
            "available_gb": round(memory.available / (1024**3), 1),
            "used_gb": round((memory.total - memory.available) / (1024**3), 1),
            "usage_percent": round(memory.percent, 1)
        },
        "cpu": {
            "usage_percent": round(cpu_percent, 1),
            "count": psutil.cpu_count(),
            "count_logical": psutil.cpu_count(logical=True)
        },
        "pytorch": {
            "version": torch.__version__,
            "mps_available": hasattr(torch.backends, 'mps') and torch.backends.mps.is_available(),
            "cuda_available": torch.cuda.is_available()
        }
    }


def clear_device_cache(device: DeviceType) -> None:
    """
    Clear device-specific cache for memory optimization.
    
    Args:
        device: Device type to clear cache for
        
    Example:
        ```python
        clear_device_cache("mps")  # Clears MPS cache on Apple Silicon
        ```
    """
    if device == "mps" and hasattr(torch, 'mps'):
        torch.mps.empty_cache()
    elif device == "cuda" and torch.cuda.is_available():
        torch.cuda.empty_cache()
    # CPU doesn't have a cache to clear