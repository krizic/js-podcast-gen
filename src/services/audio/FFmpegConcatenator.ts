import { IAudioProcessor } from '../../interfaces/IAudioProcessor.js';
import { AudioProcessingError } from '../../interfaces/types.js';
import { ILogger } from '../../interfaces/ILogger.js';
import { spawn } from 'child_process';
import { FileUtils } from '../../utilities/fileUtils.js';

/**
 * FFmpeg Audio Concatenation Implementation
 * Follows SRP - handles only FFmpeg-specific audio processing
 */
export class FFmpegConcatenator implements IAudioProcessor {
  private logger: ILogger;

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  async process(segments: Buffer[]): Promise<Buffer> {
    // For buffer processing, we need to write to temp files first
    const tempPaths: string[] = [];
    
    try {
      // Write buffers to temporary files
      for (let i = 0; i < segments.length; i++) {
        const tempPath = FileUtils.getTempFilePath(`segment_${i}_${Date.now()}.wav`, 'audio/segments');
        await FileUtils.writeBufferToFile(tempPath, segments[i]);
        tempPaths.push(tempPath);
      }

      // Create output path
      const outputPath = FileUtils.getTempFilePath(`concatenated_${Date.now()}.mp3`, 'audio/output');
      
      // Concatenate using file paths
      await this.concatenate(tempPaths, outputPath);
      
      // Read result back as buffer
      const fs = await import('fs/promises');
      const result = await fs.readFile(outputPath);
      
      // Cleanup temp files
      await this.cleanupTempFiles([...tempPaths, outputPath]);
      
      return result;
    } catch (error) {
      // Cleanup on error
      await this.cleanupTempFiles(tempPaths);
      throw error;
    }
  }

  async concatenate(segmentPaths: string[], outputPath: string): Promise<void> {
    this.logger.info(`Concatenating ${segmentPaths.length} audio segments with ffmpeg`);
    
    return new Promise((resolve, reject) => {
      // Create ffmpeg command for concatenation
      const inputArgs: string[] = [];
      const filterParts: string[] = [];
      
      segmentPaths.forEach((segmentPath, index) => {
        inputArgs.push('-i', segmentPath);
        filterParts.push(`[${index}:0]`);
      });
      
      const filterComplex = `${filterParts.join('')}concat=n=${segmentPaths.length}:v=0:a=1[out]`;
      
      const ffmpegArgs = [
        ...inputArgs,
        '-filter_complex', filterComplex,
        '-map', '[out]',
        '-y', // Overwrite output file
        outputPath
      ];
      
      this.logger.debug('Running ffmpeg with args:', ffmpegArgs);
      
      const ffmpeg = spawn('ffmpeg', ffmpegArgs);
      
      let stderr = '';
      
      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          this.logger.info(`Successfully concatenated ${segmentPaths.length} segments into ${outputPath}`);
          resolve();
        } else {
          this.logger.error('FFmpeg concatenation failed', { code, stderr });
          reject(new AudioProcessingError(
            `FFmpeg failed with exit code ${code}: ${stderr}`,
            'FFMPEG_ERROR'
          ));
        }
      });
      
      ffmpeg.on('error', (error) => {
        this.logger.error('FFmpeg process error', error);
        reject(new AudioProcessingError(
          `FFmpeg process error: ${error.message}`,
          'FFMPEG_PROCESS_ERROR'
        ));
      });
    });
  }

  supports(format: string): boolean {
    const supportedFormats = ['.mp3', '.wav', '.m4a', '.ogg'];
    return supportedFormats.some(ext => format.toLowerCase().endsWith(ext));
  }

  async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const ffmpeg = spawn('ffmpeg', ['-version']);
      
      ffmpeg.on('close', (code) => {
        resolve(code === 0);
      });
      
      ffmpeg.on('error', () => {
        resolve(false);
      });
    });
  }

  private async cleanupTempFiles(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        const fs = await import('fs/promises');
        await fs.unlink(filePath);
      } catch (error) {
        // Non-critical - log but don't throw
        this.logger.warn(`Failed to cleanup temp file ${filePath}`, error);
      }
    }
  }
}