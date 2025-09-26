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
   * Split long text into manageable segments for TTS processing
   */
  splitIntoSegments(text: string, maxLength: number = 600): AudioSegment[] {
    this.logger.debug(`Splitting text into segments (max length: ${maxLength})`);
    
    // First try splitting by double newlines (paragraphs)
    let segments = text.split(/\n\s*\n/).filter(segment => segment.trim().length > 0);
    
    // If segments are still too long, split them further
    const finalSegments: AudioSegment[] = [];
    let segmentIndex = 0;
    
    for (const segment of segments) {
      if (segment.length <= maxLength) {
        finalSegments.push({
          text: segment.trim(),
          index: segmentIndex++
        });
      } else {
        // Split long segments at sentence boundaries
        const sentences = segment.split(/(?<=[.!?])\s+/);
        let currentSegment = '';
        
        for (const sentence of sentences) {
          if (currentSegment.length + sentence.length + 1 <= maxLength) {
            currentSegment += (currentSegment ? ' ' : '') + sentence;
          } else {
            if (currentSegment) {
              finalSegments.push({
                text: currentSegment.trim(),
                index: segmentIndex++
              });
            }
            currentSegment = sentence;
          }
        }
        
        // Add remaining content
        if (currentSegment.trim()) {
          finalSegments.push({
            text: currentSegment.trim(),
            index: segmentIndex++
          });
        }
      }
    }

    this.logger.info(`Text split into ${finalSegments.length} segments`);
    return finalSegments;
  }

  /**
   * Process multiple text segments into audio buffers
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
        this.logger.info(`Processing segment ${i + 1}/${segments.length} (${segment.text.length} chars)`);
        
        const audioBuffer = await this.generateSpeech(segment.text, voiceConfig);
        audioBuffers.push(audioBuffer);
        
        this.logger.info(`Segment ${i + 1} processed successfully (${audioBuffer.length} bytes)`);
        
        // Add delay between requests to be nice to the server
        if (i < segments.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
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

    this.logger.info(`Successfully processed ${audioBuffers.length}/${segments.length} segments`);
    return audioBuffers;
  }

  /**
   * Get available voice presets from the provider
   */
  async getAvailableVoicePresets(): Promise<string[]> {
    return await this.provider.getVoicePresets();
  }
}