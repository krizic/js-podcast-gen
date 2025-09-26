import { IAudioProcessor } from '../../interfaces/IAudioProcessor.js';
import { ILogger } from '../../interfaces/ILogger.js';
import { FileUtils } from '../../utilities/fileUtils.js';

/**
 * Audio Service - Orchestrates audio processing operations
 * Follows SRP - handles audio processing business logic
 */
export class AudioService {
  private processor: IAudioProcessor;
  private logger: ILogger;

  constructor(processor: IAudioProcessor, logger: ILogger) {
    this.processor = processor;
    this.logger = logger;
  }

  /**
   * Check if audio processing is available
   */
  async isProcessingAvailable(): Promise<boolean> {
    try {
      return await this.processor.isAvailable();
    } catch (error) {
      this.logger.error('Audio processing availability check failed', error);
      return false;
    }
  }

  /**
   * Combine multiple audio buffers into a single output file
   */
  async combineAudioBuffers(audioBuffers: Buffer[], outputPath: string): Promise<void> {
    if (audioBuffers.length === 0) {
      throw new Error('No audio buffers provided for combination');
    }

    this.logger.info('Combining audio segments');

    // Ensure output directory exists
    await FileUtils.ensureDirectory(require('path').dirname(outputPath));

    if (audioBuffers.length === 1) {
      // Single buffer - just write directly
      this.logger.info('Single audio segment, writing directly to output');
      await FileUtils.writeBufferToFile(outputPath, audioBuffers[0]);
    } else {
      // Multiple buffers - use audio processor
      this.logger.info(`Combining ${audioBuffers.length} audio segments`);
      
      if (outputPath.toLowerCase().endsWith('.mp3')) {
        // For MP3 output, concatenate and save directly to path
        const tempFiles: string[] = [];
        
        try {
          // Write buffers to temporary files
          for (let i = 0; i < audioBuffers.length; i++) {
            const tempPath = FileUtils.getTempFilePath(`segment_${i}_${Date.now()}.wav`, 'audio/segments');
            await FileUtils.writeBufferToFile(tempPath, audioBuffers[i]);
            tempFiles.push(tempPath);
          }
          
          // Use processor to concatenate directly to output path
          await this.processor.concatenate(tempFiles, outputPath);
          
          // Cleanup temp files
          await this.cleanupFiles(tempFiles);
        } catch (error) {
          // Cleanup on error
          await this.cleanupFiles(tempFiles);
          throw error;
        }
      } else {
        // For other formats, process and write buffer
        const combinedBuffer = await this.processor.process(audioBuffers);
        await FileUtils.writeBufferToFile(outputPath, combinedBuffer);
      }
    }

    this.logger.info(`Audio combination completed: ${outputPath}`);
  }

  /**
   * Validate audio format support
   */
  validateOutputFormat(filePath: string): boolean {
    return this.processor.supports(filePath);
  }

  /**
   * Get supported audio formats
   */
  getSupportedFormats(): string[] {
    // Common formats - could be enhanced to query processor
    return ['.mp3', '.wav', '.m4a', '.ogg'];
  }

  /**
   * Save individual audio buffer to file
   */
  async saveAudioBuffer(buffer: Buffer, outputPath: string): Promise<void> {
    this.logger.info(`Saving audio buffer to ${outputPath}`);
    
    if (!this.validateOutputFormat(outputPath)) {
      throw new Error(`Unsupported audio format: ${outputPath}`);
    }
    
    await FileUtils.writeBufferToFile(outputPath, buffer);
    this.logger.info('Audio buffer saved successfully');
  }

  /**
   * Clean up temporary audio files
   */
  private async cleanupFiles(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        const fs = await import('fs/promises');
        await fs.unlink(filePath);
        this.logger.debug(`Cleaned up temp file: ${filePath}`);
      } catch (error) {
        // Non-critical - log but don't throw
        this.logger.warn(`Failed to cleanup file ${filePath}`, error);
      }
    }
  }
}