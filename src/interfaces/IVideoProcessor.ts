/**
 * Video processor interface for generating videos from static images and audio
 * Follows ISP - focused interface for video generation only
 */

export interface VideoConfig {
  aspectRatio: AspectRatio;
  quality: VideoQuality;
  framerate?: number; // Default: 30fps
  codec?: VideoCodec; // Default: H.264
}

export enum AspectRatio {
  LANDSCAPE_16_9 = '16:9',      // 1920x1080 - YouTube standard
  TRADITIONAL_4_3 = '4:3',      // 1024x768 - Traditional format
  SQUARE_1_1 = '1:1',           // 1080x1080 - Social media
  PORTRAIT_9_16 = '9:16'        // 1080x1920 - Mobile/vertical
}

export enum VideoQuality {
  LOW = 'low',       // Fast encoding, smaller file
  MEDIUM = 'medium', // Balanced quality/size
  HIGH = 'high',     // Best quality, larger file
  ULTRA = 'ultra'    // Maximum quality
}

export enum VideoCodec {
  H264 = 'libx264',
  H265 = 'libx265',
  VP9 = 'libvpx-vp9'
}

export interface VideoOptions {
  imagePath: string;
  audioPath: string;
  outputPath: string;
  config: VideoConfig;
}

export interface AspectRatioDimensions {
  width: number;
  height: number;
}

/**
 * Interface for video processing services
 */
export interface IVideoProcessor {
  /**
   * Generate video from static image and audio
   * @param options Video generation options
   * @returns Promise that resolves when video is generated
   */
  generateVideo(options: VideoOptions): Promise<void>;

  /**
   * Get dimensions for aspect ratio
   * @param aspectRatio Target aspect ratio
   * @param quality Quality level affects resolution
   * @returns Width and height dimensions
   */
  getDimensions(aspectRatio: AspectRatio, quality: VideoQuality): AspectRatioDimensions;

  /**
   * Check if FFmpeg is available and supports required codecs
   * @returns Promise resolving to availability status
   */
  isAvailable(): Promise<boolean>;

  /**
   * Validate image file compatibility
   * @param imagePath Path to image file
   * @returns Promise resolving to validation result
   */
  validateImage(imagePath: string): Promise<boolean>;

  /**
   * Get supported video formats
   * @returns Array of supported output formats
   */
  getSupportedFormats(): string[];
}

/**
 * Video generation error type
 */
export class VideoProcessingError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'VideoProcessingError';
  }
}