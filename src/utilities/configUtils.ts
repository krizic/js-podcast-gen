import { VoiceConfig } from '../interfaces/types.js';

/**
 * Configuration management utility following SRP
 * Handles all application configuration concerns
 */
export class ConfigUtils {
  
  /**
   * Get TTS server URL from environment or default
   */
  static getTTSServerURL(): string {
    return process.env.TTS_SERVER_URL || 'http://localhost:8000';
  }

  /**
   * Get Ollama server configuration
   */
  static getOllamaConfig(customUrl?: string, customModel?: string): { host: string; model: string } {
    return {
      host: customUrl || process.env.OLLAMA_HOST || 'http://localhost:11434',
      model: customModel || process.env.OLLAMA_MODEL || 'gpt-oss:latest'
    };
  }

  /**
   * Get default voice configuration
   */
  static getDefaultVoiceConfig(): VoiceConfig {
    return {
      voice_preset: 'masculine',
      exaggeration: 0.3,
      cfg_scale: 0.4
    };
  }

  /**
   * Merge user voice config with defaults
   */
  static mergeVoiceConfig(userConfig: Partial<VoiceConfig>): VoiceConfig {
    return {
      ...this.getDefaultVoiceConfig(),
      ...userConfig
    };
  }

  /**
   * Validate voice configuration parameters
   */
  static validateVoiceConfig(config: VoiceConfig): boolean {
    const validPresets = ['default', 'masculine', 'deep_male', 'professional', 'feminine'];
    
    if (config.voice_preset && !validPresets.includes(config.voice_preset)) {
      return false;
    }

    if (config.exaggeration !== undefined && (config.exaggeration < 0 || config.exaggeration > 1)) {
      return false;
    }

    if (config.cfg_scale !== undefined && (config.cfg_scale < 0 || config.cfg_scale > 1)) {
      return false;
    }

    if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 1)) {
      return false;
    }

    if (config.top_p !== undefined && (config.top_p < 0 || config.top_p > 1)) {
      return false;
    }

    if (config.top_k !== undefined && config.top_k < 1) {
      return false;
    }

    return true;
  }

  /**
   * Get application settings
   */
  static getAppSettings(): {
    maxSegmentLength: number;
    segmentDelay: number;
    enableDebugLogging: boolean;
    tempDirectory: string;
  } {
    return {
      maxSegmentLength: parseInt(process.env.MAX_SEGMENT_LENGTH || '600'),
      segmentDelay: parseInt(process.env.SEGMENT_DELAY || '500'),
      enableDebugLogging: process.env.DEBUG === 'true',
      tempDirectory: process.env.TEMP_DIR || 'tmp'
    };
  }

  /**
   * Get available voice presets
   */
  static getAvailableVoicePresets(): string[] {
    return ['default', 'masculine', 'deep_male', 'professional', 'feminine'];
  }

  /**
   * Get default podcast system prompt (instructions for the LLM)
   */
  static getDefaultPodcastSystemPrompt(): string {
    return `You are a professional podcast host. Your task is to convert text content into an engaging podcast script. Follow these guidelines:

1. Add a brief, engaging introduction that sets up the topic
2. Transform the content into conversational, spoken language
3. Add natural transitions between topics
4. Include a concluding summary that wraps up the key points
5. Use punctuation carefully for natural speech synthesis
6. Avoid annotations, stage directions, or text that shouldn't be spoken
7. Maintain an informative yet conversational tone throughout.
8. Avoid formatting, special characters, or markdown.

The output should be ready for direct text-to-speech conversion.`;
  }

  /**
   * Get default podcast prompt template (legacy method for backward compatibility)
   */
  static getDefaultPodcastPrompt(): string {
    return `You are a podcast host. Your task is to convert the following text into an engaging podcast script. Add a brief introduction and a concluding summary. The tone should be conversational and informative. Do not add annotations since everything you output will be directly read by speech synthesis. Punctuation is very important for natural speech. Here is the text:

---
{INPUT_TEXT}
---`;
  }

  /**
   * Get system prompt for podcast generation
   */
  static getPodcastSystemPrompt(customPrompt?: string): string {
    if (customPrompt) {
      // If custom prompt contains {INPUT_TEXT}, it's a legacy format, extract system part
      if (customPrompt.includes('{INPUT_TEXT}')) {
        return customPrompt.split('{INPUT_TEXT}')[0].trim();
      }
      // Otherwise, use as system prompt directly
      return customPrompt;
    }
    return this.getDefaultPodcastSystemPrompt();
  }

  /**
   * Build podcast prompt with input text (legacy method for backward compatibility)
   */
  static buildPodcastPrompt(inputText: string, customPrompt?: string): string {
    const prompt = customPrompt || this.getDefaultPodcastPrompt();
    return prompt.replace('{INPUT_TEXT}', inputText);
  }
}