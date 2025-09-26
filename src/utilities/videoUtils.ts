import * as path from 'path';
import { AspectRatio, VideoQuality } from '../interfaces/IVideoProcessor.js';

/**
 * Video utilities for validation and processing helpers
 * Follows SRP - handles only video-related utility functions
 */
export class VideoUtils {
  
  /**
   * Supported image file extensions
   */
  private static readonly SUPPORTED_IMAGE_EXTENSIONS = [
    '.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.webp', '.gif'
  ];

  /**
   * Supported video file extensions
   */
  private static readonly SUPPORTED_VIDEO_EXTENSIONS = [
    '.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'
  ];

  /**
   * Validate image file extension
   */
  static isValidImageExtension(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return this.SUPPORTED_IMAGE_EXTENSIONS.includes(ext);
  }

  /**
   * Validate video file extension
   */
  static isValidVideoExtension(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return this.SUPPORTED_VIDEO_EXTENSIONS.includes(ext);
  }

  /**
   * Get supported image extensions
   */
  static getSupportedImageExtensions(): string[] {
    return [...this.SUPPORTED_IMAGE_EXTENSIONS];
  }

  /**
   * Get supported video extensions
   */
  static getSupportedVideoExtensions(): string[] {
    return [...this.SUPPORTED_VIDEO_EXTENSIONS];
  }

  /**
   * Parse aspect ratio string to enum
   */
  static parseAspectRatio(aspectRatio: string): AspectRatio | null {
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
        return null;
    }
  }

  /**
   * Parse video quality string to enum
   */
  static parseVideoQuality(quality: string): VideoQuality | null {
    const normalized = quality.toLowerCase().trim();
    
    switch (normalized) {
      case 'low':
      case 'fast':
      case 'draft':
        return VideoQuality.LOW;
        
      case 'medium':
      case 'balanced':
      case 'standard':
      case 'normal':
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
        return null;
    }
  }

  /**
   * Generate video output path from audio path if not provided
   */
  static generateVideoOutputPath(audioPath: string): string {
    const pathInfo = path.parse(audioPath);
    return path.join(pathInfo.dir, `${pathInfo.name}.mp4`);
  }

  /**
   * Validate video generation options
   */
  static validateVideoOptions(options: {
    imagePath?: string;
    videoOutputPath?: string;
    aspectRatio?: string;
    videoQuality?: string;
  }): { isValid: boolean; error?: string } {
    
    if (!options.imagePath) {
      return { isValid: false, error: 'Image path is required for video generation' };
    }

    if (!this.isValidImageExtension(options.imagePath)) {
      return { 
        isValid: false, 
        error: `Unsupported image format. Supported: ${this.SUPPORTED_IMAGE_EXTENSIONS.join(', ')}` 
      };
    }

    if (!options.videoOutputPath) {
      return { isValid: false, error: 'Video output path is required' };
    }

    if (!this.isValidVideoExtension(options.videoOutputPath)) {
      return { 
        isValid: false, 
        error: `Unsupported video format. Supported: ${this.SUPPORTED_VIDEO_EXTENSIONS.join(', ')}` 
      };
    }

    if (options.aspectRatio && !this.parseAspectRatio(options.aspectRatio)) {
      return { 
        isValid: false, 
        error: `Invalid aspect ratio: ${options.aspectRatio}. Supported: 16:9, 4:3, 1:1, 9:16` 
      };
    }

    if (options.videoQuality && !this.parseVideoQuality(options.videoQuality)) {
      return { 
        isValid: false, 
        error: `Invalid video quality: ${options.videoQuality}. Supported: low, medium, high, ultra` 
      };
    }

    return { isValid: true };
  }

  /**
   * Get aspect ratio display name
   */
  static getAspectRatioDisplayName(aspectRatio: AspectRatio): string {
    switch (aspectRatio) {
      case AspectRatio.LANDSCAPE_16_9:
        return 'Landscape (16:9) - YouTube/TV standard';
      case AspectRatio.TRADITIONAL_4_3:
        return 'Traditional (4:3) - Classic format';
      case AspectRatio.SQUARE_1_1:
        return 'Square (1:1) - Social media';
      case AspectRatio.PORTRAIT_9_16:
        return 'Portrait (9:16) - Mobile/vertical';
      default:
        return 'Unknown aspect ratio';
    }
  }

  /**
   * Get video quality display name
   */
  static getVideoQualityDisplayName(quality: VideoQuality): string {
    switch (quality) {
      case VideoQuality.LOW:
        return 'Low - Fast encoding, smaller file';
      case VideoQuality.MEDIUM:
        return 'Medium - Balanced quality/size';
      case VideoQuality.HIGH:
        return 'High - Better quality, larger file';
      case VideoQuality.ULTRA:
        return 'Ultra - Maximum quality, largest file';
      default:
        return 'Unknown quality level';
    }
  }

  /**
   * Calculate estimated file size multiplier based on quality
   */
  static getFileSizeMultiplier(quality: VideoQuality): number {
    switch (quality) {
      case VideoQuality.LOW:
        return 0.5;
      case VideoQuality.MEDIUM:
        return 1.0;
      case VideoQuality.HIGH:
        return 2.0;
      case VideoQuality.ULTRA:
        return 4.0;
      default:
        return 1.0;
    }
  }
}