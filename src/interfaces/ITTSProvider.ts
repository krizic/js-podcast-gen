import { VoiceConfig, TTSResponse, HealthStatus } from './types.js';

/**
 * Interface for Text-to-Speech providers
 * Follows ISP - clients only depend on methods they use
 */
export interface ITTSProvider {
  /**
   * Check if the TTS service is healthy and available
   */
  checkHealth(): Promise<HealthStatus>;

  /**
   * Generate speech from text with voice configuration
   */
  synthesize(text: string, config?: VoiceConfig): Promise<Buffer>;

  /**
   * Get available voice presets
   */
  getVoicePresets(): Promise<string[]>;
}