import { ITTSProvider } from '../../interfaces/ITTSProvider.js';
import { VoiceConfig, AudioSegment } from '../../interfaces/types.js';
import { ILogger } from '../../interfaces/ILogger.js';
import { ValidationUtils } from '../../utilities/validationUtils.js';

/**
 * TTS Service - Orchestrates text-to-speech operations
 * Follows SRP - handles TTS business logic and workflow
 */
export class TTSService {
  private provider: ITTSProvider;
  private logger: ILogger;

  constructor(provider: ITTSProvider, logger: ILogger) {
    this.provider = provider;
    this.logger = logger;
  }

  /**
   * Check if TTS service is available and healthy
   */
  async isServiceHealthy(): Promise<boolean> {
    try {
      const health = await this.provider.checkHealth();
      return health.status === 'healthy';
    } catch (error) {
      this.logger.error('TTS service health check failed', error);
      return false;
    }
  }

  /**
   * Generate speech from text with validation and error handling
   */
  async generateSpeech(text: string, voiceConfig?: VoiceConfig): Promise<Buffer> {
    // Validate text content
    const textValidation = ValidationUtils.validateTextContent(text);
    if (!textValidation.isValid) {
      throw new Error(`Invalid text content: ${textValidation.error}`);
    }

    // Log warnings if any
    if (textValidation.warnings) {
      textValidation.warnings.forEach(warning => this.logger.warn(warning));
    }

    this.logger.info(`Generating speech for text (${text.length} characters)`);

    return await this.provider.synthesize(text, voiceConfig);
  }

  /**
   * Split text into chunks respecting server's character limit
   * Uses sentence boundaries for natural-sounding splits
   */
  splitTextIntoChunks(text: string, maxChars: number = 1800): string[] {
    // Use 1800 to have buffer below 2000 char server limit
    const chunks: string[] = [];
    
    // Split by sentences (periods, exclamation marks, question marks followed by space or end)
    const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)/g) || [text];
    
    let currentChunk = '';
    
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      
      // If single sentence exceeds limit, split by commas or words
      if (trimmedSentence.length > maxChars) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
        
        // Split long sentence by commas
        const parts = trimmedSentence.split(/,\s+/);
        let longChunk = '';
        
        for (const part of parts) {
          if ((longChunk + part).length > maxChars) {
            if (longChunk) {
              chunks.push(longChunk.trim());
            }
            longChunk = part;
          } else {
            longChunk += (longChunk ? ', ' : '') + part;
          }
        }
        
        if (longChunk) {
          currentChunk = longChunk;
        }
      } else if ((currentChunk + trimmedSentence).length > maxChars) {
        // Current chunk would exceed limit, save it and start new one
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = trimmedSentence;
      } else {
        // Add sentence to current chunk
        currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
      }
    }
    
    // Add remaining chunk
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  /**
   * Process multiple text segments into audio buffers
   * Automatically chunks text if segments exceed server limits
   */
  async processSegments(
    segments: AudioSegment[], 
    voiceConfig?: VoiceConfig,
    delayBetweenRequests: number = 500
  ): Promise<Buffer[]> {
    this.logger.info(`Processing ${segments.length} text segments`);
    
    const audioBuffers: Buffer[] = [];

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      
      try {
        // Check if segment needs chunking (server has 2000 char limit)
        const chunks = segment.text.length > 1800 
          ? this.splitTextIntoChunks(segment.text, 1800)
          : [segment.text];
        
        if (chunks.length > 1) {
          this.logger.info(`Segment ${i + 1}/${segments.length} split into ${chunks.length} chunks`);
        }
        
        for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
          const chunk = chunks[chunkIndex];
          this.logger.info(`Processing segment ${i + 1}/${segments.length}, chunk ${chunkIndex + 1}/${chunks.length} (${chunk.length} chars)`);
          
          const audioBuffer = await this.generateSpeech(chunk, voiceConfig);
          audioBuffers.push(audioBuffer);
          
          this.logger.info(`Chunk processed successfully (${audioBuffer.length} bytes)`);
          
          // Add delay between requests
          if (i < segments.length - 1 || chunkIndex < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Failed to process segment ${i + 1}: ${errorMessage}`);
        // Continue with other segments rather than failing completely
      }
    }

    if (audioBuffers.length === 0) {
      throw new Error('No audio data was generated from any segments');
    }

    this.logger.info(`Successfully processed ${audioBuffers.length} total audio chunks`);
    return audioBuffers;
  }

  /**
   * Get available voice presets from the provider
   */
  async getAvailableVoicePresets(): Promise<string[]> {
    return await this.provider.getVoicePresets();
  }
}