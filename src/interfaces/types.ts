// Core types and interfaces for the podcast generation system

export interface VoiceConfig {
  voice_preset?: string;
  exaggeration?: number;
  cfg_weight?: number;  // Updated to match reference repository naming
  temperature?: number;
  top_p?: number;
  min_p?: number;       // Added to match reference repository
  repetition_penalty?: number;  // Added to match reference repository
  top_k?: number;
}

export interface TTSResponse {
  success: boolean;
  audio?: string; // Base64 encoded audio
  sample_rate?: number;
  format?: string;
  synthesis_info?: {
    request_id: string;
    text_length: number;
    voice_preset: string;
    preset_description: string;
    use_case: string;
    personality: string;
    audio_prompt_used: boolean;
  };
  performance_metrics?: {
    total_time_seconds: number;
    generation_time_seconds: number;
    chars_per_second: number;
    realtime_factor: number;
    memory_usage_before: number;
    memory_usage_after: number;
    device_used: string;
  };
  voice_characteristics?: VoiceConfig;
  audio_analysis?: {
    duration_seconds: number;
    sample_rate: number;
    channels: number;
    samples: number;
    peak_amplitude: number;
    rms_level: number;
    dynamic_range_db: number;
    file_size_bytes: number;
    compression_ratio: number;
  };
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
  autoApprove?: boolean;
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