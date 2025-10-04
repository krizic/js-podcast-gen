"""
📊 Enhanced Logging Utilities

This module provides colored, emoji-enhanced logging functionality
for better readability and user experience in the Chatterbox TTS server.
"""

import logging
from datetime import datetime
from typing import Optional
import warnings


class ColoredFormatter(logging.Formatter):
    """
    🎨 Custom logging formatter with colors and emojis for enhanced readability.
    
    This formatter adds color coding and emoji icons to log messages based on
    their severity level, making logs more visually appealing and easier to scan.
    
    Attributes:
        COLORS: Dictionary mapping log levels to ANSI color codes
        ICONS: Dictionary mapping log levels to emoji icons
        
    Example:
        ```python
        logger = setup_logger("my_logger")
        logger.info("This will be green with a 💬 icon")
        logger.error("This will be red with a ❌ icon")
        ```
    """
    
    COLORS = {
        'DEBUG': '\033[36m',     # Cyan
        'INFO': '\033[32m',      # Green  
        'WARNING': '\033[33m',   # Yellow
        'ERROR': '\033[31m',     # Red
        'CRITICAL': '\033[35m',  # Magenta
        'RESET': '\033[0m'       # Reset
    }
    
    ICONS = {
        'DEBUG': '🔍',
        'INFO': '💬',
        'WARNING': '⚠️',
        'ERROR': '❌',
        'CRITICAL': '🚨'
    }
    
    def format(self, record: logging.LogRecord) -> str:
        """
        Format a log record with colors and emojis.
        
        Args:
            record: The log record to format
            
        Returns:
            Formatted log message string with colors and emojis
        """
        color = self.COLORS.get(record.levelname, self.COLORS['RESET'])
        icon = self.ICONS.get(record.levelname, '📝')
        reset = self.COLORS['RESET']
        
        # Format timestamp with milliseconds
        timestamp = datetime.fromtimestamp(record.created).strftime('%H:%M:%S.%f')[:-3]
        
        # Create formatted message
        formatted = f"{color}{icon} [{timestamp}] {record.levelname}{reset}: {record.getMessage()}"
        return formatted


def setup_logger(
    name: str, 
    level: str = "INFO",
    enable_colors: bool = True
) -> logging.Logger:
    """
    Set up a logger with enhanced formatting and optional color support.
    
    Args:
        name: Logger name (usually __name__ or module name)
        level: Logging level ("DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL")
        enable_colors: Whether to enable colored output (default: True)
        
    Returns:
        Configured logger instance
        
    Example:
        ```python
        logger = setup_logger(__name__, level="DEBUG")
        logger.info("🚀 Server starting up...")
        logger.error("💥 Something went wrong!")
        ```
    """
    logger = logging.getLogger(name)
    
    # Clear any existing handlers to avoid duplicates
    logger.handlers.clear()
    
    # Set logging level
    numeric_level = getattr(logging, level.upper(), logging.INFO)
    logger.setLevel(numeric_level)
    
    # Create console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(numeric_level)
    
    # Apply formatter
    if enable_colors:
        formatter = ColoredFormatter()
    else:
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
    
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    return logger


def suppress_warnings() -> None:
    """
    Suppress common warnings for cleaner console output.
    
    Filters out UserWarning and FutureWarning messages that can clutter
    the console during normal operation.
    
    Example:
        ```python
        suppress_warnings()  # Call once at startup
        ```
    """
    warnings.filterwarnings("ignore", category=UserWarning)
    warnings.filterwarnings("ignore", category=FutureWarning)


def create_startup_banner(
    title: str, 
    version: str = "2.0.0",
    width: int = 60
) -> str:
    """
    Create a formatted startup banner for the application.
    
    Args:
        title: Application title
        version: Version string
        width: Banner width in characters
        
    Returns:
        Formatted banner string
        
    Example:
        ```python
        banner = create_startup_banner("Chatterbox TTS Server", "2.0.0")
        logger.info(banner)
        ```
    """
    separator = "🎙️ " + "=" * (width - 4)
    
    return f"""
{separator}
🎙️ {title.upper()}
🎙️ Version {version} - Professional Edition
{separator}
"""


def log_system_startup(logger: logging.Logger, system_info: dict) -> None:
    """
    Log comprehensive system startup information.
    
    Args:
        logger: Logger instance to use
        system_info: System information dictionary from device_utils.get_system_info()
        
    Example:
        ```python
        from chatterbox.utilities.device_utils import get_system_info
        
        logger = setup_logger(__name__)
        system_info = get_system_info()
        log_system_startup(logger, system_info)
        ```
    """
    logger.info("🔍 Analyzing system capabilities...")
    logger.info(f"💻 System Information:")
    logger.info(f"   🖥️  Total Memory: {system_info['memory']['total_gb']} GB")
    logger.info(f"   💾 Available Memory: {system_info['memory']['available_gb']} GB")
    logger.info(f"   🔥 CPU Usage: {system_info['cpu']['usage_percent']}%")
    logger.info(f"   🐍 PyTorch Version: {system_info['pytorch']['version']}")


def log_model_loading(
    logger: logging.Logger, 
    device: str, 
    load_time: float,
    model_info: Optional[dict] = None
) -> None:
    """
    Log model loading completion with timing and device information.
    
    Args:
        logger: Logger instance to use
        device: Device used for model loading
        load_time: Time taken to load model in seconds
        model_info: Optional model information dictionary
        
    Example:
        ```python
        logger = setup_logger(__name__)
        log_model_loading(logger, "mps", 9.61, {"sample_rate": 24000})
        ```
    """
    logger.info(f"✅ Model loaded successfully in {load_time:.2f} seconds!")
    
    if model_info:
        logger.info(f"🎵 Model Details:")
        for key, value in model_info.items():
            icon = "📊" if "rate" in key else "🎛️" if "device" in key else "🧠"
            logger.info(f"   {icon} {key.replace('_', ' ').title()}: {value}")