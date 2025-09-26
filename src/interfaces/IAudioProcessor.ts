import { AudioSegment } from './types.js';

/**
 * Interface for audio processing operations
 * Follows ISP - focused on audio processing concerns only
 */
export interface IAudioProcessor {
  /**
   * Process multiple audio segments into a single output
   */
  process(segments: Buffer[]): Promise<Buffer>;

  /**
   * Concatenate audio segments with specific format
   */
  concatenate(segmentPaths: string[], outputPath: string): Promise<void>;

  /**
   * Check if the processor supports a specific audio format
   */
  supports(format: string): boolean;

  /**
   * Validate that required dependencies are available
   */
  isAvailable(): Promise<boolean>;
}