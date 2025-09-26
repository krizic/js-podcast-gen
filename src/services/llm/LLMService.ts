import { ILLMProvider } from '../../interfaces/ILLMProvider.js';
import { ILogger } from '../../interfaces/ILogger.js';
import { ValidationUtils } from '../../utilities/validationUtils.js';
import { ConfigUtils } from '../../utilities/configUtils.js';

/**
 * LLM Service - Orchestrates language model operations
 * Follows SRP - handles LLM business logic and content generation workflow
 */
export class LLMService {
  private provider: ILLMProvider;
  private logger: ILogger;

  constructor(provider: ILLMProvider, logger: ILogger) {
    this.provider = provider;
    this.logger = logger;
  }

  /**
   * Check if LLM service is available
   */
  async isServiceAvailable(): Promise<boolean> {
    try {
      return await this.provider.isAvailable();
    } catch (error) {
      this.logger.error('LLM service availability check failed', error);
      return false;
    }
  }

  /**
   * Generate podcast script from input text
   */
  async generatePodcastScript(inputText: string, model?: string, customPrompt?: string): Promise<string> {
    // Validate input text
    const validation = ValidationUtils.validateTextContent(inputText);
    if (!validation.isValid) {
      throw new Error(`Invalid input text: ${validation.error}`);
    }

    // Log warnings if any
    if (validation.warnings) {
      validation.warnings.forEach(warning => this.logger.warn(warning));
    }

    this.logger.info('Generating podcast script with LLM');

    const prompt = ConfigUtils.buildPodcastPrompt(inputText, customPrompt);
    
    try {
      const script = await this.provider.generate(prompt, model);
      
      this.logger.info(`Podcast script generated (${script.length} characters)`);
      
      // Validate generated script
      const scriptValidation = ValidationUtils.validateTextContent(script);
      if (!scriptValidation.isValid) {
        this.logger.warn(`Generated script validation issues: ${scriptValidation.error}`);
      }

      if (scriptValidation.warnings) {
        scriptValidation.warnings.forEach(warning => 
          this.logger.warn(`Generated script warning: ${warning}`)
        );
      }

      return script;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to generate podcast script', errorMessage);
      throw new Error(`Podcast script generation failed: ${errorMessage}`);
    }
  }



  /**
   * Generate custom content with a specific prompt
   */
  async generateCustomContent(prompt: string, model?: string): Promise<string> {
    // Validate prompt
    const validation = ValidationUtils.validateTextContent(prompt);
    if (!validation.isValid) {
      throw new Error(`Invalid prompt: ${validation.error}`);
    }

    this.logger.info('Generating custom content with LLM');

    try {
      const content = await this.provider.generate(prompt, model);
      this.logger.info(`Custom content generated (${content.length} characters)`);
      return content;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to generate custom content', errorMessage);
      throw new Error(`Custom content generation failed: ${errorMessage}`);
    }
  }

  /**
   * Get available models from the provider
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      return await this.provider.getAvailableModels();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to get available models', errorMessage);
      throw new Error(`Failed to get available models: ${errorMessage}`);
    }
  }
}