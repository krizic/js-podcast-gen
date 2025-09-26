import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { 
  IVideoProcessor, 
  VideoOptions, 
  AspectRatio, 
  VideoQuality, 
  AspectRatioDimensions,
  VideoCodec,
  VideoProcessingError 
} from '../../interfaces/IVideoProcessor.js';
import { ILogger } from '../../interfaces/ILogger.js';
import { FileUtils } from '../../utilities/fileUtils.js';

/**
 * FFmpeg-based video processor for combining static images with audio
 * Follows SRP - handles only video generation using FFmpeg
 */
export class FFmpegVideoProcessor implements IVideoProcessor {
  private logger: ILogger;

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  /**
   * Generate video from static image and audio using FFmpeg
   */
  async generateVideo(options: VideoOptions): Promise<void> {
    this.logger.info('🎬 Starting video generation...');
    
    // Validate inputs
    await this.validateInputs(options);
    
    // Get dimensions for the aspect ratio
    const dimensions = this.getDimensions(options.config.aspectRatio, options.config.quality);
    
    // Prepare FFmpeg command
    const ffmpegArgs = this.buildFFmpegCommand(options, dimensions);
    
    // Execute FFmpeg
    await this.executeFFmpeg(ffmpegArgs);
    
    this.logger.info(`✅ Video generated successfully: ${options.outputPath}`);
  }

  /**
   * Get dimensions based on aspect ratio and quality
   */
  getDimensions(aspectRatio: AspectRatio, quality: VideoQuality): AspectRatioDimensions {
    const qualityMultiplier = this.getQualityMultiplier(quality);
    
    switch (aspectRatio) {
      case AspectRatio.LANDSCAPE_16_9:
        return {
          width: Math.round(1920 * qualityMultiplier),
          height: Math.round(1080 * qualityMultiplier)
        };
      case AspectRatio.TRADITIONAL_4_3:
        return {
          width: Math.round(1024 * qualityMultiplier),
          height: Math.round(768 * qualityMultiplier)
        };
      case AspectRatio.SQUARE_1_1:
        return {
          width: Math.round(1080 * qualityMultiplier),
          height: Math.round(1080 * qualityMultiplier)
        };
      case AspectRatio.PORTRAIT_9_16:
        return {
          width: Math.round(1080 * qualityMultiplier),
          height: Math.round(1920 * qualityMultiplier)
        };
      default:
        throw new VideoProcessingError(`Unsupported aspect ratio: ${aspectRatio}`, 'INVALID_ASPECT_RATIO');
    }
  }

  /**
   * Check if FFmpeg is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const result = await this.executeCommand('ffmpeg', ['-version']);
      return result.includes('ffmpeg version');
    } catch (error) {
      this.logger.warn('FFmpeg not available for video generation');
      return false;
    }
  }

  /**
   * Validate image file
   */
  async validateImage(imagePath: string): Promise<boolean> {
    try {
      // Check file exists
      const exists = await FileUtils.fileExists(imagePath);
      if (!exists) {
        throw new VideoProcessingError(`Image file not found: ${imagePath}`, 'IMAGE_NOT_FOUND');
      }

      // Check file extension
      const supportedFormats = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp'];
      const ext = path.extname(imagePath).toLowerCase();
      
      if (!supportedFormats.includes(ext)) {
        throw new VideoProcessingError(
          `Unsupported image format: ${ext}. Supported: ${supportedFormats.join(', ')}`, 
          'UNSUPPORTED_IMAGE_FORMAT'
        );
      }

      return true;
    } catch (error) {
      if (error instanceof VideoProcessingError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new VideoProcessingError(`Image validation failed: ${errorMessage}`, 'IMAGE_VALIDATION_ERROR');
    }
  }

  /**
   * Get supported video formats
   */
  getSupportedFormats(): string[] {
    return ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
  }

  /**
   * Build FFmpeg command arguments
   */
  private buildFFmpegCommand(options: VideoOptions, dimensions: AspectRatioDimensions): string[] {
    const codec = options.config.codec || VideoCodec.H264;
    const framerate = options.config.framerate || 30;
    const crf = this.getQualityCRF(options.config.quality);

    const args = [
      '-loop', '1',                          // Loop the image
      '-i', options.imagePath,               // Input image
      '-i', options.audioPath,               // Input audio
      '-c:v', codec,                         // Video codec
      '-c:a', 'aac',                         // Audio codec
      '-b:a', '128k',                        // Audio bitrate
      '-r', framerate.toString(),            // Frame rate
      '-crf', crf.toString(),                // Quality (lower = better)
      '-vf', `scale=${dimensions.width}:${dimensions.height}:force_original_aspect_ratio=increase,crop=${dimensions.width}:${dimensions.height}`, // Scale and crop to exact dimensions
      '-shortest',                           // End when shortest input ends (audio)
      '-movflags', '+faststart',             // Optimize for streaming
      '-y',                                  // Overwrite output file
      options.outputPath                     // Output file
    ];

    return args;
  }

  /**
   * Get quality multiplier for resolution scaling
   */
  private getQualityMultiplier(quality: VideoQuality): number {
    switch (quality) {
      case VideoQuality.LOW:
        return 0.5;    // 50% of base resolution
      case VideoQuality.MEDIUM:
        return 0.75;   // 75% of base resolution  
      case VideoQuality.HIGH:
        return 1.0;    // 100% of base resolution
      case VideoQuality.ULTRA:
        return 1.5;    // 150% of base resolution
      default:
        return 1.0;
    }
  }

  /**
   * Get CRF (Constant Rate Factor) for quality
   * Lower CRF = better quality, larger file
   */
  private getQualityCRF(quality: VideoQuality): number {
    switch (quality) {
      case VideoQuality.LOW:
        return 28;     // Lower quality, faster encoding
      case VideoQuality.MEDIUM:
        return 23;     // Balanced quality
      case VideoQuality.HIGH:
        return 18;     // High quality
      case VideoQuality.ULTRA:
        return 15;     // Maximum quality
      default:
        return 23;
    }
  }

  /**
   * Validate input files and options
   */
  private async validateInputs(options: VideoOptions): Promise<void> {
    // Validate image
    await this.validateImage(options.imagePath);

    // Validate audio file exists
    const audioExists = await FileUtils.fileExists(options.audioPath);
    if (!audioExists) {
      throw new VideoProcessingError(`Audio file not found: ${options.audioPath}`, 'AUDIO_NOT_FOUND');
    }

    // Ensure output directory exists
    const outputDir = path.dirname(options.outputPath);
    await FileUtils.ensureDirectory(outputDir);
  }

  /**
   * Execute FFmpeg command
   */
  private async executeFFmpeg(args: string[]): Promise<void> {
    this.logger.info(`Executing FFmpeg with args: ${args.join(' ')}`);

    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', args);
      
      let stderr = '';

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
        // Log progress information
        const progressMatch = stderr.match(/time=(\d+:\d+:\d+\.\d+)/);
        if (progressMatch) {
          this.logger.info(`Video encoding progress: ${progressMatch[1]}`);
        }
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new VideoProcessingError(
            `FFmpeg failed with exit code ${code}: ${stderr}`, 
            'FFMPEG_EXECUTION_ERROR'
          ));
        }
      });

      ffmpeg.on('error', (error) => {
        reject(new VideoProcessingError(
          `FFmpeg execution error: ${error.message}`, 
          'FFMPEG_SPAWN_ERROR'
        ));
      });
    });
  }

  /**
   * Execute command and return output
   */
  private async executeCommand(command: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args);
      let output = '';
      
      process.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        output += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Command failed with exit code ${code}`));
        }
      });
      
      process.on('error', reject);
    });
  }
}