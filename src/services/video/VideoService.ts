import { IVideoProcessor, VideoOptions, AspectRatio, VideoQuality, VideoConfig } from '../../interfaces/IVideoProcessor.js';
import { ILogger } from '../../interfaces/ILogger.js';
import { VideoProcessingError } from '../../interfaces/IVideoProcessor.js';

/**
 * Video Service - Orchestrates video generation workflow
 * Follows SRP - handles video generation business logic
 */
export class VideoService {
  private videoProcessor: IVideoProcessor;
  private logger: ILogger;

  constructor(videoProcessor: IVideoProcessor, logger: ILogger) {
    this.videoProcessor = videoProcessor;
    this.logger = logger;
  }

  /**
   * Generate video from image and audio with specified configuration
   */
  async generateVideo(
    imagePath: string,
    audioPath: string,
    outputPath: string,
    aspectRatio: string = '16:9',
    quality: string = 'medium'
  ): Promise<void> {
    try {
      // Check processor availability
      const isAvailable = await this.videoProcessor.isAvailable();
      if (!isAvailable) {
        throw new VideoProcessingError(
          'Video processor (FFmpeg) is not available. Please install FFmpeg.',
          'PROCESSOR_UNAVAILABLE'
        );
      }

      // Parse and validate configuration
      const config = this.buildVideoConfig(aspectRatio, quality);
      
      // Log configuration
      this.logger.info(`🎬 Video Configuration:`);
      this.logger.info(`   Aspect Ratio: ${config.aspectRatio}`);
      this.logger.info(`   Quality: ${config.quality}`);
      this.logger.info(`   Framerate: ${config.framerate}fps`);
      this.logger.info(`   Codec: ${config.codec}`);

      const dimensions = this.videoProcessor.getDimensions(config.aspectRatio, config.quality);
      this.logger.info(`   Resolution: ${dimensions.width}x${dimensions.height}`);

      // Validate inputs
      await this.videoProcessor.validateImage(imagePath);

      // Create video options
      const videoOptions: VideoOptions = {
        imagePath,
        audioPath,
        outputPath,
        config
      };

      // Generate video
      await this.videoProcessor.generateVideo(videoOptions);

      this.logger.info('✅ Video generation completed successfully!');
    } catch (error) {
      if (error instanceof VideoProcessingError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new VideoProcessingError(
        `Video generation failed: ${errorMessage}`,
        'VIDEO_GENERATION_ERROR'
      );
    }
  }

  /**
   * Get available aspect ratios
   */
  getAvailableAspectRatios(): string[] {
    return Object.values(AspectRatio);
  }

  /**
   * Get available quality levels
   */
  getAvailableQualityLevels(): string[] {
    return Object.values(VideoQuality);
  }

  /**
   * Check if video processing is available
   */
  async checkAvailability(): Promise<boolean> {
    return await this.videoProcessor.isAvailable();
  }

  /**
   * Get supported video formats
   */
  getSupportedFormats(): string[] {
    return this.videoProcessor.getSupportedFormats();
  }

  /**
   * Build video configuration from string parameters
   */
  private buildVideoConfig(aspectRatio: string, quality: string): VideoConfig {
    // Parse aspect ratio
    const parsedAspectRatio = this.parseAspectRatio(aspectRatio);
    
    // Parse quality
    const parsedQuality = this.parseQuality(quality);

    return {
      aspectRatio: parsedAspectRatio,
      quality: parsedQuality,
      framerate: 30, // Default framerate
      codec: undefined // Use processor default
    };
  }

  /**
   * Parse aspect ratio string to enum value
   */
  private parseAspectRatio(aspectRatio: string): AspectRatio {
    const normalized = aspectRatio.toLowerCase().trim();
    
    switch (normalized) {
      case '16:9':
      case '16-9':
      case 'landscape':
      case 'widescreen':
        return AspectRatio.LANDSCAPE_16_9;
        
      case '4:3':
      case '4-3': 
      case 'traditional':
      case 'standard':
        return AspectRatio.TRADITIONAL_4_3;
        
      case '1:1':
      case '1-1':
      case 'square':
        return AspectRatio.SQUARE_1_1;
        
      case '9:16':
      case '9-16':
      case 'portrait':
      case 'vertical':
      case 'mobile':
        return AspectRatio.PORTRAIT_9_16;
        
      default:
        this.logger.warn(`Unknown aspect ratio '${aspectRatio}', defaulting to 16:9`);
        return AspectRatio.LANDSCAPE_16_9;
    }
  }

  /**
   * Parse quality string to enum value
   */
  private parseQuality(quality: string): VideoQuality {
    const normalized = quality.toLowerCase().trim();
    
    switch (normalized) {
      case 'low':
      case 'fast':
      case 'draft':
        return VideoQuality.LOW;
        
      case 'medium':
      case 'balanced':
      case 'standard':
        return VideoQuality.MEDIUM;
        
      case 'high':
      case 'good':
      case 'quality':
        return VideoQuality.HIGH;
        
      case 'ultra':
      case 'best':
      case 'maximum':
      case 'max':
        return VideoQuality.ULTRA;
        
      default:
        this.logger.warn(`Unknown quality level '${quality}', defaulting to medium`);
        return VideoQuality.MEDIUM;
    }
  }
}