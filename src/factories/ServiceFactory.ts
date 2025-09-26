import { TTSService } from '../services/tts/TTSService.js';
import { LLMService } from '../services/llm/LLMService.js';
import { AudioService } from '../services/audio/AudioService.js';
import { ChatterboxProvider } from '../services/tts/ChatterboxProvider.js';
import { OllamaProvider } from '../services/llm/OllamaProvider.js';
import { FFmpegConcatenator } from '../services/audio/FFmpegConcatenator.js';
import { ILogger } from '../interfaces/ILogger.js';
import { ConfigUtils } from '../utilities/configUtils.js';

/**
 * Service Factory - Creates services with dynamic configuration
 * Follows Factory Pattern - encapsulates service creation logic
 */
export class ServiceFactory {
  private logger: ILogger;

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  /**
   * Create TTS Service
   */
  createTTSService(): TTSService {
    const ttsServerURL = ConfigUtils.getTTSServerURL();
    const ttsProvider = new ChatterboxProvider(ttsServerURL, this.logger);
    return new TTSService(ttsProvider, this.logger);
  }

  /**
   * Create LLM Service with configurable parameters
   */
  createLLMService(ollamaUrl?: string, ollamaModel?: string): LLMService {
    const ollamaConfig = ConfigUtils.getOllamaConfig(ollamaUrl, ollamaModel);
    const llmProvider = new OllamaProvider(ollamaConfig.host, ollamaConfig.model, this.logger);
    return new LLMService(llmProvider, this.logger);
  }

  /**
   * Create Audio Service
   */
  createAudioService(): AudioService {
    const audioProcessor = new FFmpegConcatenator(this.logger);
    return new AudioService(audioProcessor, this.logger);
  }
}