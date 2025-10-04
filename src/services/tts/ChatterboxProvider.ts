import { ITTSProvider } from '../../interfaces/ITTSProvider.js';
import { VoiceConfig, TTSResponse, HealthStatus, TTSError } from '../../interfaces/types.js';
import { ILogger } from '../../interfaces/ILogger.js';

/**
 * Chatterbox TTS Provider Implementation
 * Follows SRP - only handles Chatterbox-specific TTS operations
 */
export class ChatterboxProvider implements ITTSProvider {
  private serverURL: string;
  private logger: ILogger;

  constructor(serverURL: string, logger: ILogger) {
    this.serverURL = serverURL;
    this.logger = logger;
  }

  async checkHealth(): Promise<HealthStatus> {
    try {
      this.logger.debug(`Checking TTS server health at ${this.serverURL}/health`);
      
      const response = await fetch(`${this.serverURL}/health`);
      if (!response.ok) {
        throw new TTSError(
          `Health check failed with status ${response.status}`,
          'HEALTH_CHECK_FAILED'
        );
      }

      const health: HealthStatus = await response.json();
      this.logger.debug('TTS server health check successful', health);
      
      return health;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('TTS server health check failed', errorMessage);
      
      throw new TTSError(
        `TTS server health check failed: ${errorMessage}`,
        'HEALTH_CHECK_ERROR'
      );
    }
  }

  async synthesize(text: string, config?: VoiceConfig): Promise<Buffer> {
    try {
      this.logger.debug('Starting speech synthesis', { textLength: text.length, config });

      const requestBody = {
        text: text,
        ...config
      };

      // Use direct WAV endpoint for proper audio format
      const response = await fetch(`${this.serverURL}/synthesize-wav`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new TTSError(
          `TTS synthesis failed with status ${response.status} ${response.statusText}`,
          'SYNTHESIS_FAILED'
        );
      }

      // Response is direct WAV binary data
      const audioBuffer = Buffer.from(await response.arrayBuffer());
      
      if (audioBuffer.length === 0) {
        throw new TTSError(
          'No audio data returned from TTS server',
          'NO_AUDIO_DATA'
        );
      }

      this.logger.info(`🎙️ Generated WAV audio (${audioBuffer.length} bytes)`);
      this.logger.debug('Speech synthesis completed', { audioSize: audioBuffer.length });
      
      return audioBuffer;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Speech synthesis failed', errorMessage);
      
      if (error instanceof TTSError) {
        throw error;
      }
      
      throw new TTSError(
        `Failed to generate speech: ${errorMessage}`,
        'SYNTHESIS_ERROR'
      );
    }
  }

  async getVoicePresets(): Promise<string[]> {
    // For now, return known presets. Could be enhanced to fetch from server
    return ['default', 'masculine', 'deep_male', 'professional', 'feminine'];
  }
}