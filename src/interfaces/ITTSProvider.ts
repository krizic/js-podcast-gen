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
   * @param text - Text to convert to speech
   * @param config - Voice configuration parameters
   * @param voiceFilePath - Optional path to custom voice sample file
   */
  synthesize(text: string, config?: VoiceConfig, voiceFilePath?: string): Promise<Buffer>;

  /**
   * Generate speech from text with custom voice file upload
   * @param text - Text to convert to speech
   * @param voiceFile - Voice sample file for voice cloning
   * @param config - Voice configuration parameters
   */
  synthesizeWithVoiceFile(text: string, voiceFile: File, config?: VoiceConfig): Promise<Buffer>;

  /**
   * Get available voice presets
   */
  getVoicePresets(): Promise<string[]>;

  /**
   * Get complete voice library including presets and custom voices
   */
  getVoiceLibrary(): Promise<any>;

  /**
   * Upload a voice sample to the voice library
   * @param voiceName - Unique name for the voice
   * @param voiceFile - Voice sample audio file
   * @param language - Language code (default: 'en')
   * @param description - Optional description of the voice
   */
  uploadVoiceToLibrary(voiceName: string, voiceFile: File, language?: string, description?: string): Promise<any>;

  /**
   * Delete a voice from the voice library
   * @param voiceName - Name of the voice to delete
   */
  deleteVoiceFromLibrary(voiceName: string): Promise<any>;
}