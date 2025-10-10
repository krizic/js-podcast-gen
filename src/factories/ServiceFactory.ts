import { TTSService } from '../services/tts/TTSService.js';
import { LLMService } from '../services/llm/LLMService.js';
import { AudioService } from '../services/audio/AudioService.js';
import { ChatterboxProvider } from '../services/tts/ChatterboxProvider.js';
import { OllamaProvider } from '../services/llm/OllamaProvider.js';
import { FFmpegConcatenator } from '../services/audio/FFmpegConcatenator.js';
import { ILogger } from '../interfaces/ILogger.js';
import { ConfigUtils } from '../utilities/configUtils.js';

/**
 * Service Factory
 * 
 * Creates and configures service instances with proper dependency injection.
 * Follows Factory Pattern to encapsulate service creation logic and manage dependencies.
 * Ensures consistent service configuration across the application.
 * 
 * @example
 * ```typescript
 * const factory = new ServiceFactory(logger);
 * const ttsService = factory.createTTSService();
 * const llmService = factory.createLLMService('http://localhost:11434', 'llama2');
 * ```
 */
export class ServiceFactory {
  private logger: ILogger;

  /**
   * Create a new ServiceFactory
   * 
   * @param {ILogger} logger - Logger instance for all created services
   */
  constructor(logger: ILogger) {
    this.logger = logger;
  }

  /**
   * Create TTS Service with Chatterbox provider
   * 
   * @returns {TTSService} Configured TTS service instance
   * @example
   * ```typescript
   * const ttsService = factory.createTTSService();
   * const audio = await ttsService.generateSpeech('Hello world');
   * ```
   */
  createTTSService(): TTSService {
    const ttsServerURL = ConfigUtils.getTTSServerURL();
    const ttsProvider = new ChatterboxProvider(ttsServerURL, this.logger);
    return new TTSService(ttsProvider, this.logger);
  }

  /**
   * Create LLM Service with Ollama provider
   * 
   * @param {string} [ollamaUrl] - Optional custom Ollama server URL
   * @param {string} [ollamaModel] - Optional custom model name
   * @returns {LLMService} Configured LLM service instance
   * @example
   * ```typescript
   * const llmService = factory.createLLMService('http://localhost:11434', 'llama2');
   * const script = await llmService.generatePodcastScript('content...');
   * ```
   */
  createLLMService(ollamaUrl?: string, ollamaModel?: string): LLMService {
    const ollamaConfig = ConfigUtils.getOllamaConfig(ollamaUrl, ollamaModel);
    const llmProvider = new OllamaProvider(ollamaConfig.host, ollamaConfig.model, this.logger);
    return new LLMService(llmProvider, this.logger);
  }

  /**
   * Create Audio Service with FFmpeg processor
   * 
   * @returns {AudioService} Configured audio service instance
   * @example
   * ```typescript
   * const audioService = factory.createAudioService();
   * await audioService.concatenateAudio([buffer1, buffer2], 'output.mp3');
   * ```
   */
  createAudioService(): AudioService {
    const audioProcessor = new FFmpegConcatenator(this.logger);
    return new AudioService(audioProcessor, this.logger);
  }
}