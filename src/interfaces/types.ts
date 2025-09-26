// Core types and interfaces for the podcast generation system

export interface VoiceConfig {
  voice_preset?: string;
  exaggeration?: number;
  cfg_scale?: number;
  temperature?: number;
  top_p?: number;
  top_k?: number;
}

export interface TTSResponse {
  success: boolean;
  audio?: string; // Base64 encoded audio
  voice_params?: VoiceConfig;
  error?: string;
}

export interface PodcastOptions {
  inputFile: string;
  outputFile: string;
  voice: string;
  exaggeration: number;
  cfgScale: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  // New configurable parameters
  ollamaUrl?: string;
  ollamaModel?: string;
  podcastPrompt?: string;
}

export interface HealthStatus {
  status: string;
  device?: string;
  model_loaded?: boolean;
}

export interface AudioSegment {
  text: string;
  buffer?: Buffer;
  index: number;
}

export interface LLMResponse {
  response: string;
}

export interface LLMConfig {
  model: string;
  host: string;
}

// Error types
export class TTSError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'TTSError';
  }
}

export class AudioProcessingError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AudioProcessingError';
  }
}

export class LLMError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'LLMError';
  }
}

export class FileOperationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'FileOperationError';
  }
}