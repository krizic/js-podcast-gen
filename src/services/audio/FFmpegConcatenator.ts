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
    
    // Use simpler file-based concatenation for better reliability
    const concatListFile = FileUtils.getTempFilePath(`concat_list_${Date.now()}.txt`, 'audio/segments');
    const concatContent = segmentPaths.map(path => `file '${path.replace(/'/g, "'\\''")}'`).join('\n');
    
    // Write concat file list
    const fs = await import('fs/promises');
    await fs.writeFile(concatListFile, concatContent);
    
    const ffmpegArgs = [
      '-f', 'concat',
      '-safe', '0',
      '-i', concatListFile,
      '-ar', '24000', // Ensure consistent sample rate (24kHz from ChatterboxTTS)
      '-ac', '1',     // Mono audio
      '-c:a', 'libmp3lame', // Use LAME MP3 encoder for best quality
      '-b:a', '128k', // Audio bitrate for MP3
      '-y', // Overwrite output file
      outputPath
    ];
    
    // Clean up concat file after use
    const cleanupConcatFile = async () => {
      try {
        await fs.unlink(concatListFile);
      } catch (error) {
        this.logger.warn(`Failed to cleanup concat file: ${concatListFile}`);
      }
    };
    
    return new Promise((resolve, reject) => {
      
      this.logger.debug('Running ffmpeg with args:', ffmpegArgs);
      
      const ffmpeg = spawn('ffmpeg', ffmpegArgs);
      
      let stderr = '';
      
      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      ffmpeg.on('close', async (code) => {
        await cleanupConcatFile(); // Clean up concat file
        
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
      
      ffmpeg.on('error', async (error) => {
        await cleanupConcatFile(); // Clean up concat file on error too
        
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