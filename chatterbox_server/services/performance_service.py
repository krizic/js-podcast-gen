"""
📊 Performance Tracking Service

This module provides performance tracking and metrics collection
for the Chatterbox TTS server operations.
"""

import time
from typing import Dict, Any
from dataclasses import dataclass, field


@dataclass
class PerformanceMetrics:
    """
    📈 Performance metrics data class for TTS operations.
    
    Attributes:
        synthesis_count: Total number of synthesis requests processed
        total_characters: Total characters synthesized
        total_audio_duration: Total duration of generated audio in seconds
        total_processing_time: Total processing time in seconds
        start_time: Server start timestamp
    """
    synthesis_count: int = 0
    total_characters: int = 0
    total_audio_duration: float = 0.0
    total_processing_time: float = 0.0
    start_time: float = field(default_factory=time.time)


class PerformanceTracker:
    """
    🎯 Performance tracking service for monitoring TTS server operations.
    
    This class tracks synthesis operations, processing times, throughput metrics,
    and provides comprehensive statistics about server performance.
    
    Example:
        ```python
        tracker = PerformanceTracker()
        
        # Record a synthesis operation
        tracker.add_synthesis(
            chars=150, 
            duration=3.5, 
            processing_time=2.1
        )
        
        # Get current statistics
        stats = tracker.get_stats()
        print(f"Efficiency ratio: {stats['efficiency_ratio']}")
        ```
    """
    
    def __init__(self):
        """Initialize the performance tracker with zero metrics."""
        self.metrics = PerformanceMetrics()
    
    def add_synthesis(self, chars: int, duration: float, processing_time: float) -> None:
        """
        Record a completed synthesis operation.
        
        Args:
            chars: Number of characters in the synthesized text
            duration: Duration of generated audio in seconds
            processing_time: Time taken to process the request in seconds
            
        Example:
            ```python
            tracker.add_synthesis(chars=100, duration=2.5, processing_time=1.8)
            ```
        """
        self.metrics.synthesis_count += 1
        self.metrics.total_characters += chars
        self.metrics.total_audio_duration += duration
        self.metrics.total_processing_time += processing_time
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get comprehensive performance statistics.
        
        Returns:
            Dictionary containing all performance metrics and calculated ratios
            
        Example:
            ```python
            stats = tracker.get_stats()
            print(f"Total requests: {stats['total_requests']}")
            print(f"Average speed: {stats['avg_chars_per_second']} chars/sec")
            ```
        """
        uptime = time.time() - self.metrics.start_time
        
        # Calculate derived metrics
        avg_chars_per_sec = (
            self.metrics.total_characters / self.metrics.total_processing_time 
            if self.metrics.total_processing_time > 0 else 0
        )
        
        efficiency_ratio = (
            self.metrics.total_audio_duration / self.metrics.total_processing_time 
            if self.metrics.total_processing_time > 0 else 0
        )
        
        return {
            "total_requests": self.metrics.synthesis_count,
            "total_characters": self.metrics.total_characters,
            "total_audio_duration": round(self.metrics.total_audio_duration, 2),
            "total_processing_time": round(self.metrics.total_processing_time, 2),
            "uptime_seconds": round(uptime, 2),
            "avg_chars_per_second": round(avg_chars_per_sec, 2),
            "efficiency_ratio": round(efficiency_ratio, 2)
        }
    
    def get_efficiency_metrics(self) -> Dict[str, Any]:
        """
        Get detailed efficiency and performance ratios.
        
        Returns:
            Dictionary containing efficiency-specific metrics
            
        Example:
            ```python
            efficiency = tracker.get_efficiency_metrics()
            print(f"Audio/Processing ratio: {efficiency['realtime_factor']}")
            ```
        """
        stats = self.get_stats()
        
        return {
            "avg_chars_per_second": stats["avg_chars_per_second"],
            "efficiency_ratio": stats["efficiency_ratio"],
            "total_audio_minutes": round(stats["total_audio_duration"] / 60, 2),
            "total_processing_minutes": round(stats["total_processing_time"] / 60, 2),
            "realtime_factor": stats["efficiency_ratio"],  # Same as efficiency_ratio
            "requests_per_hour": round(
                stats["total_requests"] / (stats["uptime_seconds"] / 3600), 2
            ) if stats["uptime_seconds"] > 0 else 0
        }
    
    def reset_stats(self) -> None:
        """
        Reset all performance metrics to zero.
        
        Note: This preserves the start_time to maintain uptime tracking.
        
        Example:
            ```python
            tracker.reset_stats()  # Clear all metrics but keep uptime
            ```
        """
        start_time = self.metrics.start_time
        self.metrics = PerformanceMetrics()
        self.metrics.start_time = start_time
    
    def get_uptime_info(self) -> Dict[str, Any]:
        """
        Get detailed uptime information.
        
        Returns:
            Dictionary containing uptime in various units
            
        Example:
            ```python
            uptime = tracker.get_uptime_info()
            print(f"Server running for {uptime['hours']:.1f} hours")
            ```
        """
        uptime_seconds = time.time() - self.metrics.start_time
        
        return {
            "uptime_seconds": round(uptime_seconds, 2),
            "uptime_minutes": round(uptime_seconds / 60, 2),
            "uptime_hours": round(uptime_seconds / 3600, 2),
            "start_time": self.metrics.start_time,
            "start_time_formatted": time.strftime(
                "%Y-%m-%d %H:%M:%S", 
                time.localtime(self.metrics.start_time)
            )
        }


# Global performance tracker instance
performance_tracker = PerformanceTracker()