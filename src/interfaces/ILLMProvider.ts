import { LLMResponse, LLMConfig } from './types.js';

/**
 * Interface for Large Language Model providers
 * Follows ISP - only LLM-specific operations
 */
export interface ILLMProvider {
  /**
   * Generate text content using the LLM
   */
  generate(prompt: string, model?: string): Promise<string>;

  /**
   * Check if the LLM service is available
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get available models
   */
  getAvailableModels(): Promise<string[]>;
}