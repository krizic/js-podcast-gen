import { ITTSProvider } from '../../interfaces/ITTSProvider.js';
import { VoiceConfig, TTSResponse, HealthStatus, TTSError } from '../../interfaces/types.js';
import { ILogger } from '../../interfaces/ILogger.js';
import { ConfigUtils } from '../../utilities/configUtils.js';

/**
 * Chatterbox TTS Provider - Native JSON API
 * 
 * Integrates with Chatterbox TTS server using native /synthesize endpoint
 * which provides comprehensive response metadata and progress logging.
 * 
 * Key Features:
 * - Native /synthesize endpoint with full JSON response
 * - Server-side intelligent chunking (no 2000 char limit)
 * - Real-time progress logging during synthesis
 * - Voice library management (upload, delete, fetch)
 * - Comprehensive performance metrics and audio analysis
 * 
 * Architecture Changes:
 * - Switched from OpenAI-compatible endpoint to native /synthesize
 * - Removed client-side chunking (server handles all text processing)
 * - Added TTSResponse interface for comprehensive metadata
 * 
 * @example
 * ```typescript
 * const provider = new ChatterboxProvider('http://localhost:8000');
 * const audio = await provider.synthesize('Hello world', { voice: 'masculine' });
 * ```
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

  /**
   * Synthesize speech from text using native endpoint with progress logging
   * 
   * Uses /synthesize endpoint which provides:
   * - Comprehensive metadata and performance metrics
   * - Server-side intelligent chunking (no text length limits)
   * - Audio analysis and quality metrics
   * - Base64-encoded WAV audio data
   * 
   * @param {string} text - Text to convert to speech (any length - server handles chunking)
   * @param {VoiceConfig} [config] - Optional voice configuration parameters
   * @returns {Promise<Buffer>} WAV audio data as Buffer
   * @throws {TTSError} If synthesis fails or server is unavailable
   * 
   * @example
   * ```typescript
   * const audio = await provider.synthesize('Hello world', {
   *   voice_preset: 'professional',
   *   temperature: 0.7,
   *   exaggeration: 0.3
   * });
   * ```
   */
  async synthesize(text: string, config?: VoiceConfig): Promise<Buffer> {
    try {
      this.logger.info(`🎙️ Starting synthesis (${text.length} characters)`);
      this.logger.debug('Starting speech synthesis', { textLength: text.length, config });

      // Build JSON request for native endpoint
      const requestBody = this.buildSynthesisRequest(text, config);

      const startTime = Date.now();
      const response = await fetch(`${this.serverURL}/synthesize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new TTSError(
          `TTS synthesis failed with status ${response.status}: ${errorText}`,
          'SYNTHESIS_FAILED'
        );
      }

      // Response includes comprehensive metadata
      const result: TTSResponse = await response.json();
      
      if (!result.success || !result.audio) {
        throw new TTSError(
          'No audio data returned from TTS server',
          'NO_AUDIO_DATA'
        );
      }

      // Decode base64 audio data
      const audioBuffer = Buffer.from(result.audio, 'base64');
      
      const totalTime = Date.now() - startTime;
      
      // Log comprehensive progress information
      this.logger.info(`✅ Synthesis completed in ${(totalTime / 1000).toFixed(2)}s`);
      this.logger.info(`   📊 Performance: ${result.performance_metrics?.chars_per_second?.toFixed(1)} chars/s, ${result.performance_metrics?.realtime_factor?.toFixed(2)}x realtime`);
      this.logger.info(`   🎵 Audio: ${result.audio_analysis?.duration_seconds}s, ${audioBuffer.length.toLocaleString()} bytes`);
      this.logger.info(`   🎭 Voice: ${result.synthesis_info?.voice_preset} (${result.synthesis_info?.preset_description})`);
      
      if (result.performance_metrics) {
        this.logger.debug('Performance metrics', result.performance_metrics);
      }
      
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

  /**
   * Synthesize speech using a custom voice file upload
   * 
   * @param {string} text - Text to convert to speech
   * @param {File} voiceFile - Audio file containing voice sample (WAV, MP3, FLAC, M4A, OGG)
   * @param {VoiceConfig} [config] - Optional voice configuration parameters
   * @returns {Promise<Buffer>} WAV audio data as Buffer
   * @throws {TTSError} If synthesis or upload fails
   * 
   * @example
   * ```typescript
   * const voiceFile = new File([audioData], 'voice_sample.wav', { type: 'audio/wav' });
   * const audio = await provider.synthesizeWithVoiceFile('Hello', voiceFile, {
   *   temperature: 0.7
   * });
   * ```
   */
  async synthesizeWithVoiceFile(text: string, voiceFile: File, config?: VoiceConfig): Promise<Buffer> {
    try {
      this.logger.debug('Starting speech synthesis with voice file upload', { 
        textLength: text.length, 
        voiceFileName: voiceFile.name, 
        voiceFileSize: voiceFile.size,
        config 
      });

      // Build FormData with voice file using helper
      const formData = this.buildFormData(text, config);
      formData.append('voice_file', voiceFile);

      // Use voice upload endpoint matching reference repository pattern
      const response = await fetch(`${this.serverURL}/v1/audio/speech/upload`, {
        method: 'POST',
        body: formData, // No Content-Type header - let browser set multipart boundary
      });

      if (!response.ok) {
        throw new TTSError(
          `TTS voice upload synthesis failed with status ${response.status} ${response.statusText}`,
          'SYNTHESIS_FAILED'
        );
      }

      // Response is direct WAV binary data
      const audioBuffer = Buffer.from(await response.arrayBuffer());
      
      if (audioBuffer.length === 0) {
        throw new TTSError(
          'No audio data returned from TTS server with voice upload',
          'NO_AUDIO_DATA'
        );
      }

      this.logger.info(`🎙️ Generated WAV audio with custom voice (${audioBuffer.length} bytes)`);
      this.logger.debug('Voice file synthesis completed', { 
        audioSize: audioBuffer.length,
        voiceFile: voiceFile.name 
      });
      
      return audioBuffer;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Speech synthesis with voice file failed', errorMessage);
      
      if (error instanceof TTSError) {
        throw error;
      }
      
      throw new TTSError(
        `Failed to generate speech with voice file: ${errorMessage}`,
        'SYNTHESIS_ERROR'
      );
    }
  }

  /**
   * Get the voice library containing available presets and custom voices
   * 
   * @returns {Promise<any>} Voice library object with presets and custom voices
   * @throws {TTSError} If fetching library fails
   * 
   * @example
   * ```typescript
   * const library = await provider.getVoiceLibrary();
   * console.log('Available presets:', Object.keys(library.presets));
   * console.log('Custom voices:', library.custom_voices);
   * ```
   */
  async getVoiceLibrary(): Promise<any> {
    try {
      this.logger.debug('Fetching voice library from server');
      
      const response = await fetch(`${this.serverURL}/voices`);
      if (!response.ok) {
        throw new TTSError(
          `Failed to fetch voice library with status ${response.status}`,
          'VOICE_LIBRARY_FETCH_FAILED'
        );
      }

      const voiceLibrary = await response.json();
      this.logger.debug('Voice library fetched successfully', voiceLibrary);
      
      return voiceLibrary;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to fetch voice library', errorMessage);
      
      if (error instanceof TTSError) {
        throw error;
      }
      
      throw new TTSError(
        `Failed to fetch voice library: ${errorMessage}`,
        'VOICE_LIBRARY_ERROR'
      );
    }
  }

  /**
   * Upload a voice sample to the server voice library
   * 
   * @param {string} voiceName - Unique name for the voice in the library
   * @param {File} voiceFile - Audio file containing voice sample
   * @param {string} [language='en'] - Language code for the voice
   * @param {string} [description] - Optional description of the voice
   * @returns {Promise<any>} Upload result with voice details
   * @throws {TTSError} If upload fails
   * 
   * @example
   * ```typescript
   * const voiceFile = new File([audioData], 'my_voice.wav');
   * await provider.uploadVoiceToLibrary('my_custom_voice', voiceFile, 'en', 'My personal voice');
   * ```
   */
  async uploadVoiceToLibrary(voiceName: string, voiceFile: File, language: string = 'en', description?: string): Promise<any> {
    try {
      this.logger.debug('Uploading voice to library', { voiceName, fileName: voiceFile.name, language });

      const formData = new FormData();
      formData.append('voice_name', voiceName);
      formData.append('voice_file', voiceFile);
      formData.append('language', language);
      if (description) {
        formData.append('description', description);
      }

      const response = await fetch(`${this.serverURL}/voices`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new TTSError(
          `Voice upload failed: ${errorData.detail || response.statusText}`,
          'VOICE_UPLOAD_FAILED'
        );
      }

      const uploadResult = await response.json();
      this.logger.info(`🎵 Voice '${voiceName}' uploaded successfully to library`);
      
      return uploadResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Voice upload failed', errorMessage);
      
      if (error instanceof TTSError) {
        throw error;
      }
      
      throw new TTSError(
        `Failed to upload voice: ${errorMessage}`,
        'VOICE_UPLOAD_ERROR'
      );
    }
  }

  /**
   * Delete a voice from the server voice library
   * 
   * @param {string} voiceName - Name of the voice to delete
   * @returns {Promise<any>} Deletion result
   * @throws {TTSError} If deletion fails
   * 
   * @example
   * ```typescript
   * await provider.deleteVoiceFromLibrary('my_custom_voice');
   * ```
   */
  async deleteVoiceFromLibrary(voiceName: string): Promise<any> {
    try {
      this.logger.debug('Deleting voice from library', { voiceName });

      const response = await fetch(`${this.serverURL}/voices/${encodeURIComponent(voiceName)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new TTSError(
          `Voice deletion failed: ${errorData.detail || response.statusText}`,
          'VOICE_DELETE_FAILED'
        );
      }

      const deleteResult = await response.json();
      this.logger.info(`🗑️ Voice '${voiceName}' deleted successfully from library`);
      
      return deleteResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Voice deletion failed', errorMessage);
      
      if (error instanceof TTSError) {
        throw error;
      }
      
      throw new TTSError(
        `Failed to delete voice: ${errorMessage}`,
        'VOICE_DELETE_ERROR'
      );
    }
  }

  async getVoicePresets(): Promise<string[]> {
    // Enhanced to fetch from server voice library
    try {
      const library = await this.getVoiceLibrary();
      const presetNames = Object.keys(library.presets || {});
      
      this.logger.debug(`Found ${presetNames.length} voice presets on server`);
      return presetNames;
    } catch (error) {
      this.logger.error('Failed to fetch presets from server, using fallback', error);
      // Fallback to known presets
      return ['masculine', 'professional', 'energetic', 'deep_male', 'feminine'];
    }
  }

  /**
   * Build JSON request for /synthesize endpoint
   * 
   * @private
   * @param {string} text - Text to synthesize
   * @param {VoiceConfig} [config] - Voice configuration parameters
   * @returns {Object} JSON request object
   */
  private buildSynthesisRequest(text: string, config?: VoiceConfig): Record<string, any> {
    const request: Record<string, any> = {
      text: text
    };
    
    // Add voice configuration parameters if provided
    if (config?.voice_preset) request.voice_preset = config.voice_preset;
    if (config?.exaggeration !== undefined) request.exaggeration = config.exaggeration;
    if (config?.cfg_weight !== undefined) request.cfg_weight = config.cfg_weight;
    if (config?.temperature !== undefined) request.temperature = config.temperature;
    if (config?.top_p !== undefined) request.top_p = config.top_p;
    if (config?.top_k !== undefined) request.top_k = config.top_k;
    if (config?.min_p !== undefined) request.min_p = config.min_p;
    if (config?.repetition_penalty !== undefined) request.repetition_penalty = config.repetition_penalty;
    
    return request;
  }

  /**
   * Build FormData object from text and voice configuration
   * Helper method for voice upload endpoints
   * 
   * @private
   * @param {string} text - Text to synthesize
   * @param {VoiceConfig} [config] - Voice configuration parameters
   * @returns {FormData} Populated FormData object
   */
  private buildFormData(text: string, config?: VoiceConfig): FormData {
    const formData = new FormData();
    formData.append('input', text);
    
    // Add voice configuration parameters if provided
    if (config?.voice_preset) formData.append('voice_preset', config.voice_preset);
    if (config?.exaggeration !== undefined) formData.append('exaggeration', config.exaggeration.toString());
    if (config?.cfg_weight !== undefined) formData.append('cfg_weight', config.cfg_weight.toString());
    if (config?.temperature !== undefined) formData.append('temperature', config.temperature.toString());
    if (config?.top_p !== undefined) formData.append('top_p', config.top_p.toString());
    if (config?.top_k !== undefined) formData.append('top_k', config.top_k.toString());
    if (config?.min_p !== undefined) formData.append('min_p', config.min_p.toString());
    if (config?.repetition_penalty !== undefined) formData.append('repetition_penalty', config.repetition_penalty.toString());
    
    return formData;
  }
}