import { PodcastOptions } from '../interfaces/types.js';
import { TTSService } from '../services/tts/TTSService.js';
import { LLMService } from '../services/llm/LLMService.js';
import { AudioService } from '../services/audio/AudioService.js';
import { ILogger } from '../interfaces/ILogger.js';
import { FileUtils } from '../utilities/fileUtils.js';
import { ValidationUtils } from '../utilities/validationUtils.js';
import { ConfigUtils } from '../utilities/configUtils.js';
import { InteractionUtils } from '../utilities/interactionUtils.js';
import { ServiceFactory } from '../factories/ServiceFactory.js';

/**
 * Podcast Controller - Orchestrates podcast generation workflow
 * Follows SRP - handles only podcast generation business logic
 */
export class PodcastController {
  private serviceFactory: ServiceFactory;
  private logger: ILogger;

  constructor(serviceFactory: ServiceFactory, logger: ILogger) {
    this.serviceFactory = serviceFactory;
    this.logger = logger;
  }

  /**
   * Generate a complete podcast from text
   */
  async generatePodcast(options: PodcastOptions): Promise<void> {
    this.logger.info('🚀 Starting podcast generation...');

    // Validate options
    await this.validateOptions(options);

    // Create services with dynamic configuration
    const ttsService = this.serviceFactory.createTTSService();
    const llmService = this.serviceFactory.createLLMService(options.ollamaUrl, options.ollamaModel);
    const audioService = this.serviceFactory.createAudioService();

    // Build voice configuration
    const voiceConfig = ConfigUtils.mergeVoiceConfig({
      voice_preset: options.voice,
      exaggeration: options.exaggeration,
      cfg_scale: options.cfgScale,
      temperature: options.temperature,
      top_p: options.topP,
      top_k: options.topK,
    });

    this.logger.info(`🎙️  Voice preset: ${voiceConfig.voice_preset}`);

    try {
      // 1. Read the input file
      this.logger.info('Reading input file...');
      const inputText = await FileUtils.readTextFile(options.inputFile);

      // 2. Generate podcast script using LLM
      this.logger.info('Generating podcast script with LLM...');
      const script = await llmService.generatePodcastScript(
        inputText, 
        options.ollamaModel, 
        options.podcastPrompt
      );
      this.logger.info(`Script generated: ${script.length} characters`);

      // 3. User confirmation (unless auto-approved)
      if (options.autoApprove) {
        InteractionUtils.displayAutoApproval(script);
      } else {
        const userApproved = await InteractionUtils.confirmScriptGeneration(script);
        if (!userApproved) {
          InteractionUtils.displayCancellation();
          return;
        }
      }

      // 4. Check service availability
      await this.checkServiceAvailability(ttsService, llmService, audioService);

      // 5. Convert script to speech
      this.logger.info('Converting script to speech...');
      const audioBuffers = await this.convertScriptToAudio(script, voiceConfig, ttsService);

      // 6. Combine audio segments
      this.logger.info('Combining audio segments...');
      await audioService.combineAudioBuffers(audioBuffers, options.outputFile);

      this.logger.info(`✅ Podcast saved to ${options.outputFile}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Podcast generation failed', errorMessage);
      throw new Error(`Podcast generation failed: ${errorMessage}`);
    }
  }

  /**
   * Validate podcast generation options
   */
  private async validateOptions(options: PodcastOptions): Promise<void> {
    // Validate input file
    const inputValidation = await ValidationUtils.validateInputFile(options.inputFile);
    if (!inputValidation.isValid) {
      throw new Error(`Input file validation failed: ${inputValidation.error}`);
    }

    // Validate output file
    const outputValidation = ValidationUtils.validateOutputFile(options.outputFile);
    if (!outputValidation.isValid) {
      throw new Error(`Output file validation failed: ${outputValidation.error}`);
    }

    // Validate voice preset
    const voiceValidation = ValidationUtils.validateVoicePreset(options.voice);
    if (!voiceValidation.isValid) {
      throw new Error(`Voice preset validation failed: ${voiceValidation.error}`);
    }

    // Validate numeric parameters
    const numericValidations = [
      ValidationUtils.validateNumericParameter(options.exaggeration, 'exaggeration', 0, 1),
      ValidationUtils.validateNumericParameter(options.cfgScale, 'cfg_scale', 0, 1),
      ValidationUtils.validateNumericParameter(options.temperature, 'temperature', 0, 1),
      ValidationUtils.validateNumericParameter(options.topP, 'top_p', 0, 1),
      ValidationUtils.validateNumericParameter(options.topK, 'top_k', 1),
    ];

    for (const validation of numericValidations) {
      if (!validation.isValid) {
        throw new Error(`Parameter validation failed: ${validation.error}`);
      }
    }

    // Create temporary audio service for validation
    const audioService = this.serviceFactory.createAudioService();
    
    // Validate audio format support
    if (!audioService.validateOutputFormat(options.outputFile)) {
      const supportedFormats = audioService.getSupportedFormats();
      throw new Error(
        `Unsupported audio format. Supported formats: ${supportedFormats.join(', ')}`
      );
    }
  }

  /**
   * Check that all required services are available
   */
  private async checkServiceAvailability(
    ttsService: TTSService, 
    llmService: LLMService, 
    audioService: AudioService
  ): Promise<void> {
    // Check TTS service
    const isTTSHealthy = await ttsService.isServiceHealthy();
    if (!isTTSHealthy) {
      throw new Error('TTS server is not healthy or not available');
    }

    // Check LLM service
    const isLLMAvailable = await llmService.isServiceAvailable();
    if (!isLLMAvailable) {
      this.logger.warn('LLM service not available - using input text directly');
    }

    // Check audio processing
    const isAudioAvailable = await audioService.isProcessingAvailable();
    if (!isAudioAvailable) {
      throw new Error('Audio processing (FFmpeg) is not available');
    }

    this.logger.info('All required services are available');
  }

  /**
   * Convert script text to audio buffers
   */
  private async convertScriptToAudio(script: string, voiceConfig: any, ttsService: TTSService): Promise<Buffer[]> {
    const appSettings = ConfigUtils.getAppSettings();
    
    // Split script into segments
    const segments = ttsService.splitIntoSegments(script, appSettings.maxSegmentLength);
    
    // Process segments into audio
    const audioBuffers = await ttsService.processSegments(
      segments, 
      voiceConfig, 
      appSettings.segmentDelay
    );

    if (audioBuffers.length === 0) {
      throw new Error('No audio data was generated from the script');
    }

    return audioBuffers;
  }

  /**
   * Get service status information
   */
  async getServiceStatus(): Promise<{
    tts: boolean;
    llm: boolean;
    audio: boolean;
    voicePresets: string[];
  }> {
    // Create services for status check
    const ttsService = this.serviceFactory.createTTSService();
    const llmService = this.serviceFactory.createLLMService();
    const audioService = this.serviceFactory.createAudioService();

    const [ttsHealthy, llmAvailable, audioAvailable, voicePresets] = await Promise.all([
      ttsService.isServiceHealthy(),
      llmService.isServiceAvailable(),
      audioService.isProcessingAvailable(),
      ttsService.getAvailableVoicePresets().catch(() => [])
    ]);

    return {
      tts: ttsHealthy,
      llm: llmAvailable,
      audio: audioAvailable,
      voicePresets
    };
  }
}