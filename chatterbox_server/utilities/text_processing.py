"""
📝 Text Processing Utilities for Streaming-Optimized Chunking

This module implements streaming-optimized text chunking strategies based on the
reference repository analysis to prevent fixed-duration audio padding issues.

Key findings from reference repository:
- Quality presets: fast (100 chars/word), balanced (200 chars/sentence), high (300 chars/paragraph)  
- Strategies: sentence, paragraph, word, fixed
- Prevents ChatterboxTTS fixed-duration padding through intelligent pre-processing
"""

import re
from typing import List, Optional, Tuple, Dict, Any
from enum import Enum


class ChunkingStrategy(Enum):
    """Text chunking strategies matching reference repository"""
    SENTENCE = "sentence"
    PARAGRAPH = "paragraph" 
    WORD = "word"
    FIXED = "fixed"


class QualityPreset(Enum):
    """Quality presets with optimal chunk sizes from reference repository"""
    FAST = "fast"      # 100 chars, word-based
    BALANCED = "balanced"  # 200 chars, sentence-based  
    HIGH = "high"      # 300 chars, paragraph-based


def get_streaming_settings(
    chunk_size: Optional[int] = None,
    strategy: Optional[str] = None, 
    quality: Optional[str] = None
) -> Dict[str, Any]:
    """
    Get streaming settings based on quality preset and overrides.
    Matches reference repository's get_streaming_settings function.
    
    Args:
        chunk_size: Optional override for chunk size
        strategy: Optional override for chunking strategy  
        quality: Quality preset (fast/balanced/high)
        
    Returns:
        Dictionary with chunk_size, strategy, and quality settings
    """
    # Default to balanced quality if not specified
    quality = quality or QualityPreset.BALANCED.value
    
    # Quality preset defaults from reference repository
    quality_defaults = {
        QualityPreset.FAST.value: {
            "chunk_size": 100,
            "strategy": ChunkingStrategy.WORD.value
        },
        QualityPreset.BALANCED.value: {
            "chunk_size": 200, 
            "strategy": ChunkingStrategy.SENTENCE.value
        },
        QualityPreset.HIGH.value: {
            "chunk_size": 300,
            "strategy": ChunkingStrategy.PARAGRAPH.value
        }
    }
    
    # Get defaults for quality preset
    defaults = quality_defaults.get(quality, quality_defaults[QualityPreset.BALANCED.value])
    
    # Apply overrides
    final_chunk_size = chunk_size or defaults["chunk_size"]
    final_strategy = strategy or defaults["strategy"]
    
    return {
        "chunk_size": final_chunk_size,
        "strategy": final_strategy,
        "quality": quality
    }


def split_text_for_streaming(
    text: str,
    chunk_size: Optional[int] = None,
    strategy: Optional[str] = None,
    quality: Optional[str] = None
) -> List[str]:
    """
    Split text for streaming-optimized TTS generation.
    Matches reference repository's split_text_for_streaming function.
    
    Args:
        text: Text to split
        chunk_size: Maximum characters per chunk
        strategy: Chunking strategy (sentence/paragraph/word/fixed)
        quality: Quality preset (fast/balanced/high)
        
    Returns:
        List of text chunks optimized for streaming TTS
    """
    if not text or not text.strip():
        return []
    
    text = text.strip()
    
    # Get streaming settings
    settings = get_streaming_settings(chunk_size, strategy, quality)
    max_length = settings["chunk_size"]
    strategy_name = settings["strategy"]
    
    # If text is shorter than max length, return as single chunk
    if len(text) <= max_length:
        return [text]
    
    # Apply appropriate chunking strategy
    if strategy_name == ChunkingStrategy.PARAGRAPH.value:
        return _split_by_paragraphs(text, max_length)
    elif strategy_name == ChunkingStrategy.SENTENCE.value:
        return _split_by_sentences(text, max_length)
    elif strategy_name == ChunkingStrategy.WORD.value:
        return _split_by_words(text, max_length)
    elif strategy_name == ChunkingStrategy.FIXED.value:
        return _split_by_fixed_size(text, max_length)
    else:
        # Default to sentence-based splitting
        return _split_by_sentences(text, max_length)


def _split_by_paragraphs(text: str, max_length: int) -> List[str]:
    """Split text by paragraph breaks, respecting max length"""
    # Split by double newlines (paragraph breaks)
    paragraphs = re.split(r'\n\s*\n', text)
    chunks = []
    
    for paragraph in paragraphs:
        paragraph = paragraph.strip()
        if not paragraph:
            continue
            
        if len(paragraph) <= max_length:
            chunks.append(paragraph)
        else:
            # If paragraph is too long, split by sentences
            chunks.extend(_split_by_sentences(paragraph, max_length))
    
    return [chunk for chunk in chunks if chunk.strip()]


def _split_by_sentences(text: str, max_length: int) -> List[str]:
    """Split text by sentence boundaries, respecting max length"""
    # Sentence boundary patterns
    sentence_endings = ['. ', '! ', '? ', '.\n', '!\n', '?\n', '.']
    
    chunks = []
    current_chunk = ""
    
    # Split into sentences using regex
    sentences = re.split(r'([.!?]+\s*)', text)
    
    # Rejoin sentence parts
    full_sentences = []
    for i in range(0, len(sentences) - 1, 2):
        if i + 1 < len(sentences):
            sentence = sentences[i] + (sentences[i + 1] if sentences[i + 1].strip() else '')
            full_sentences.append(sentence.strip())
        elif sentences[i].strip():
            full_sentences.append(sentences[i].strip())
    
    for sentence in full_sentences:
        if not sentence:
            continue
            
        # If adding this sentence would exceed max_length
        if current_chunk and len(current_chunk) + len(sentence) + 1 > max_length:
            chunks.append(current_chunk.strip())
            current_chunk = sentence
        else:
            current_chunk = (current_chunk + " " + sentence).strip()
    
    # Add remaining chunk
    if current_chunk.strip():
        chunks.append(current_chunk.strip())
    
    # Handle overly long sentences
    result_chunks = []
    for chunk in chunks:
        if len(chunk) <= max_length:
            result_chunks.append(chunk)
        else:
            # Split long sentence by words
            result_chunks.extend(_split_by_words(chunk, max_length))
    
    return result_chunks


def _split_by_words(text: str, max_length: int) -> List[str]:
    """Split text by word boundaries, respecting max length"""
    words = text.split()
    chunks = []
    current_chunk = ""
    
    for word in words:
        # If adding this word would exceed max_length
        if current_chunk and len(current_chunk) + len(word) + 1 > max_length:
            chunks.append(current_chunk.strip())
            current_chunk = word
        else:
            current_chunk = (current_chunk + " " + word).strip()
    
    # Add remaining chunk
    if current_chunk.strip():
        chunks.append(current_chunk.strip())
    
    return chunks


def _split_by_fixed_size(text: str, max_length: int) -> List[str]:
    """Split text into fixed-size chunks"""
    chunks = []
    
    for i in range(0, len(text), max_length):
        chunk = text[i:i + max_length]
        if chunk.strip():
            chunks.append(chunk.strip())
    
    return chunks


def _split_long_sentence(sentence: str, max_length: int) -> List[str]:
    """Split a long sentence at natural break points"""
    if len(sentence) <= max_length:
        return [sentence]
    
    # Try splitting at commas, semicolons, or other natural breaks
    break_points = [', ', '; ', ' - ', ' and ', ' or ', ' but ']
    
    for break_point in break_points:
        parts = sentence.split(break_point)
        if len(parts) > 1:
            chunks = []
            current_chunk = ""
            
            for i, part in enumerate(parts):
                part_with_break = part + (break_point if i < len(parts) - 1 else '')
                
                if current_chunk and len(current_chunk) + len(part_with_break) > max_length:
                    chunks.append(current_chunk.strip())
                    current_chunk = part_with_break.strip()
                else:
                    current_chunk = (current_chunk + part_with_break).strip()
            
            if current_chunk.strip():
                chunks.append(current_chunk.strip())
            
            if all(len(chunk) <= max_length for chunk in chunks):
                return chunks
    
    # Fall back to word-based splitting
    return _split_by_words(sentence, max_length)


def test_chunking_strategies():
    """Test different chunking strategies with sample text"""
    sample_text = """
    This is a test document with multiple paragraphs. It contains various sentences to test the chunking algorithms.
    
    The second paragraph has different sentence structures. Some are short. Others are much longer and contain multiple clauses that should be handled properly by the sentence-based chunking strategy.
    
    Finally, we have a third paragraph that will help us test how the paragraph-based chunking works when dealing with longer blocks of text.
    """
    
    print("🧪 Testing Chunking Strategies")
    print("=" * 50)
    
    for quality in [QualityPreset.FAST.value, QualityPreset.BALANCED.value, QualityPreset.HIGH.value]:
        print(f"\n📊 Quality: {quality.upper()}")
        chunks = split_text_for_streaming(sample_text, quality=quality)
        
        print(f"Chunks generated: {len(chunks)}")
        for i, chunk in enumerate(chunks, 1):
            print(f"  {i}. ({len(chunk)} chars) {chunk[:60]}...")


if __name__ == "__main__":
    test_chunking_strategies()