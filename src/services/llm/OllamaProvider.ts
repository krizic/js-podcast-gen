import { ILLMProvider } from '../../interfaces/ILLMProvider.js';
import { LLMError } from '../../interfaces/types.js';
import { ILogger } from '../../interfaces/ILogger.js';
import { Ollama } from 'ollama';

/**
 * Ollama LLM Provider Implementation
 * Follows SRP - handles only Ollama-specific operations
 */
export class OllamaProvider implements ILLMProvider {
  private client: Ollama;
  private logger: ILogger;
  private defaultModel: string;

  constructor(host: string, defaultModel: string, logger: ILogger) {
    this.client = new Ollama({ host });
    this.defaultModel = defaultModel;
    this.logger = logger;
  }

  async generate(prompt: string, model?: string): Promise<string> {
    const modelToUse = model || this.defaultModel;
    
    try {
      this.logger.debug(`Generating content with model ${modelToUse}`, { 
        promptLength: prompt.length 
      });

      const response = await this.client.generate({
        model: modelToUse,
        prompt: prompt,
      });

      if (!response.response) {
        throw new LLMError(
          'No response received from Ollama',
          'NO_RESPONSE'
        );
      }

      this.logger.debug('LLM generation completed', { 
        responseLength: response.response.length 
      });

      return response.response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('LLM generation failed', errorMessage);
      
      if (error instanceof LLMError) {
        throw error;
      }
      
      throw new LLMError(
        `Failed to generate content with Ollama: ${errorMessage}`,
        'GENERATION_ERROR'
      );
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Try to list models to check if Ollama is available
      await this.client.list();
      return true;
    } catch (error) {
      this.logger.debug('Ollama availability check failed', error);
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await this.client.list();
      return response.models.map(model => model.name);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to get available models', errorMessage);
      throw new LLMError(
        `Failed to get available models: ${errorMessage}`,
        'LIST_MODELS_ERROR'
      );
    }
  }
}