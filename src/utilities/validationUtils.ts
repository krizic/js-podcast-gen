import { FileUtils } from './fileUtils.js';

/**
 * Validation utilities following SRP
 * Handles all input validation and constraint checking
 */
export class ValidationUtils {
  
  /**
   * Validate file paths for input operations
   */
  static async validateInputFile(filePath: string): Promise<{ isValid: boolean; error?: string }> {
    if (!filePath || typeof filePath !== 'string') {
      return { isValid: false, error: 'File path is required and must be a string' };
    }

    if (!await FileUtils.fileExists(filePath)) {
      return { isValid: false, error: `Input file does not exist: ${filePath}` };
    }

    // Check if file is readable and has content
    try {
      const content = await FileUtils.readTextFile(filePath);
      if (content.trim().length === 0) {
        return { isValid: false, error: 'Input file is empty' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { isValid: false, error: `Cannot read input file: ${errorMessage}` };
    }

    return { isValid: true };
  }

  /**
   * Validate output file path
   */
  static validateOutputFile(filePath: string): { isValid: boolean; error?: string } {
    if (!filePath || typeof filePath !== 'string') {
      return { isValid: false, error: 'Output file path is required and must be a string' };
    }

    // Check file extension
    const validExtensions = ['.mp3', '.wav'];
    const hasValidExtension = validExtensions.some(ext => 
      filePath.toLowerCase().endsWith(ext)
    );

    if (!hasValidExtension) {
      return { 
        isValid: false, 
        error: `Output file must have one of these extensions: ${validExtensions.join(', ')}` 
      };
    }

    return { isValid: true };
  }

  /**
   * Validate numeric parameters with ranges
   */
  static validateNumericParameter(
    value: any, 
    name: string, 
    min?: number, 
    max?: number
  ): { isValid: boolean; error?: string } {
    if (value === undefined || value === null) {
      return { isValid: true }; // Optional parameters are valid when undefined
    }

    if (typeof value !== 'number' || isNaN(value)) {
      return { isValid: false, error: `${name} must be a valid number` };
    }

    if (min !== undefined && value < min) {
      return { isValid: false, error: `${name} must be >= ${min}` };
    }

    if (max !== undefined && value > max) {
      return { isValid: false, error: `${name} must be <= ${max}` };
    }

    return { isValid: true };
  }

  /**
   * Validate text content for TTS processing
   */
  static validateTextContent(text: string): { isValid: boolean; error?: string; warnings?: string[] } {
    const warnings: string[] = [];

    if (!text || typeof text !== 'string') {
      return { isValid: false, error: 'Text content is required and must be a string' };
    }

    const trimmedText = text.trim();
    
    if (trimmedText.length === 0) {
      return { isValid: false, error: 'Text content cannot be empty' };
    }

    if (trimmedText.length < 10) {
      warnings.push('Text content is very short, may not generate meaningful audio');
    }

    if (trimmedText.length > 10000) {
      warnings.push('Text content is very long, processing may take significant time');
    }

    // Check for potential TTS issues
    const specialCharacterPattern = /[^\w\s.,!?;:'"()-]/g;
    const specialCharacters = trimmedText.match(specialCharacterPattern);
    if (specialCharacters && specialCharacters.length > 0) {
      warnings.push(`Text contains special characters that may affect speech quality: ${[...new Set(specialCharacters)].join(', ')}`);
    }

    return { 
      isValid: true, 
      warnings: warnings.length > 0 ? warnings : undefined 
    };
  }

  /**
   * Validate voice preset name
   */
  static validateVoicePreset(preset: string): { isValid: boolean; error?: string } {
    const validPresets = ['default', 'masculine', 'deep_male', 'professional', 'feminine'];
    
    if (!preset || typeof preset !== 'string') {
      return { isValid: false, error: 'Voice preset must be a string' };
    }

    if (!validPresets.includes(preset)) {
      return { 
        isValid: false, 
        error: `Invalid voice preset. Must be one of: ${validPresets.join(', ')}` 
      };
    }

    return { isValid: true };
  }

  /**
   * Validate URL format
   */
  static validateURL(url: string, name: string = 'URL'): { isValid: boolean; error?: string } {
    if (!url || typeof url !== 'string') {
      return { isValid: false, error: `${name} is required and must be a string` };
    }

    try {
      new URL(url);
      return { isValid: true };
    } catch {
      return { isValid: false, error: `${name} must be a valid URL format` };
    }
  }
}