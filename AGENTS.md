# AGENTS.md - Development Guidelines for AI Coding Assistants

## 🎯 Project Overview

**Podcast Generator with Chatterbox TTS** - A professional-grade podcast generation tool featuring clean modular architecture, Apple Silicon optimization, and intelligent voice customization.

### Project Mission
Transform text content into high-quality podcasts using local AI services while maintaining clean, maintainable, and scalable code architecture.

## 🎯 Project Organization Philosophy

**Keep the project root CLEAN and PROFESSIONAL at all times.**

This project demonstrates SOLID principles, clean architecture, and professional development practices. All temporary files, test scripts, experiments, and debug outputs must be properly organized to prevent clutter and maintain production readiness.

## 📁 Directory Structure Rules

### ✅ REQUIRED: Use `tmp/` for ALL Temporary Content

```
tmp/
├── audio/
│   ├── segments/     # Intermediate audio segments during processing
│   ├── tests/        # Voice preset tests and samples
│   └── output/       # Temporary audio outputs
├── scripts/          # ALL temporary and test scripts
├── data/            # Sample text files, test content
└── logs/            # Debug logs, performance data, benchmarks
```

### ❌ FORBIDDEN: Root Directory Pollution

**NEVER create these in project root:**
- `test_*.py`, `test_*.sh`, `experiment_*.js`
- `voice_test_*.wav`, `sample_*.mp3`  
- `debug_*.txt`, `temp_*.json`
- `benchmark_*.log`, `performance_*.txt`
- Any file starting with `test_`, `temp_`, `debug_`, `sample_`

## 🛠 Development Workflow Standards

### When Creating Test Scripts

```bash
# ✅ CORRECT - Always in tmp/scripts/
tmp/scripts/test_voice_presets.py
tmp/scripts/benchmark_performance.sh
tmp/scripts/experiment_new_feature.js

# ❌ WRONG - Never in root
test_voice_presets.py
benchmark.sh
experiment.js
```

### When Generating Audio Files

```bash
# ✅ CORRECT - Organized by purpose
tmp/audio/tests/voice_test_masculine.wav
tmp/audio/segments/segment_001.wav
tmp/audio/output/test_podcast.mp3

# ❌ WRONG - Clutters root directory
voice_test_masculine.wav
segment_001.wav
test_podcast.mp3
```

### When Creating Sample Data

```bash
# ✅ CORRECT - Clear organization
tmp/data/sample_tech_content.txt
tmp/data/test_script_generated.txt
tmp/data/benchmark_input.json

# ❌ WRONG - Mixed with production files
sample.txt
test.txt
input.json
```

## 📜 Script Development Guidelines

### 1. Location Rules
- **ALL test scripts** → `tmp/scripts/`
- **ALL temporary utilities** → `tmp/scripts/`
- **ALL experimental code** → `tmp/scripts/`

### 2. Naming Conventions
```bash
tmp/scripts/test_voice_presets.py      # Testing functionality
tmp/scripts/benchmark_metal_perf.py    # Performance testing
tmp/scripts/experiment_new_tts.sh      # Experimental features
tmp/scripts/debug_audio_segments.py    # Debug utilities
tmp/scripts/util_cleanup_files.sh      # Temporary utilities
```

### 3. Script Headers
Always include purpose and cleanup instructions:

```python
#!/usr/bin/env python3
"""
Temporary script: Voice preset testing
Purpose: Compare different TTS voice characteristics
Location: tmp/scripts/ (DO NOT move to root)
Cleanup: Safe to delete after testing
"""
```

```bash
#!/bin/bash
# Temporary script: Performance benchmark
# Purpose: Test Metal vs CPU performance  
# Location: tmp/scripts/ (temporary use only)
# Output: tmp/logs/performance_YYYYMMDD.log
```

### 4. Output Redirection
Scripts must output to appropriate tmp subdirectories:

```python
# ✅ CORRECT - Outputs to tmp/
output_file = "tmp/audio/tests/voice_sample.wav"
log_file = "tmp/logs/test_results.json"

# ❌ WRONG - Outputs to root
output_file = "voice_sample.wav"
log_file = "results.json"
```

## 🔧 Code Modification Rules

### When Updating Existing Scripts

1. **Check current file locations** - move temporary scripts to `tmp/scripts/`
2. **Update output paths** - redirect all temp files to appropriate `tmp/` subdirs
3. **Maintain functionality** - preserve existing behavior while organizing better
4. **Add cleanup notes** - document what can be safely deleted

### When Creating New Features

```typescript
// ✅ CORRECT - Temporary files in tmp/
const tempSegmentPath = path.join('tmp', 'audio', 'segments', `segment_${i}.wav`);
const debugLogPath = path.join('tmp', 'logs', 'tts_debug.log');

// ❌ WRONG - Clutters root directory  
const tempSegmentPath = `segment_${i}.wav`;
const debugLogPath = 'debug.log';
```

### When Debugging Issues

```python
# ✅ CORRECT - Organized debug output
debug_dir = "tmp/logs"
os.makedirs(debug_dir, exist_ok=True)
with open(f"{debug_dir}/debug_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log", 'w') as f:
    f.write(debug_info)

# ❌ WRONG - Debug files in root
with open('debug.log', 'w') as f:
    f.write(debug_info)
```

## 🧹 Cleanup & Maintenance

### Automated Cleanup Patterns

Create cleanup utilities in `tmp/scripts/`:

```bash
#!/bin/bash
# tmp/scripts/cleanup_old_tests.sh
# Remove test files older than 7 days

find tmp/audio/tests -name "*.wav" -mtime +7 -delete
find tmp/logs -name "*.log" -mtime +30 -delete
echo "Cleanup completed: $(date)"
```

### Manual Cleanup Guidelines

**Safe to delete anytime:**
- `tmp/audio/tests/*` - Voice test samples
- `tmp/audio/segments/*` - Intermediate processing files  
- `tmp/logs/*` - Debug and performance logs (keep recent ones)

**Review before deleting:**
- `tmp/data/*` - May contain important test cases
- `tmp/scripts/*` - May contain useful utilities

## 🚫 Common Mistakes to Avoid

### 1. Root Directory Pollution
```bash
# ❌ NEVER DO THIS
echo "test" > test_file.txt
python test_script.py
./benchmark.sh > results.log
```

### 2. Hardcoded Paths
```python
# ❌ BAD - Hardcoded to root
audio_file = "test_audio.wav"

# ✅ GOOD - Proper tmp organization
audio_file = os.path.join("tmp", "audio", "tests", "test_audio.wav")
```

### 3. Missing Directory Creation
```python
# ❌ BAD - Assumes directories exist
with open("tmp/logs/debug.log", "w") as f:
    f.write(data)

# ✅ GOOD - Ensures directory exists
os.makedirs("tmp/logs", exist_ok=True)
with open("tmp/logs/debug.log", "w") as f:
    f.write(data)
```

## 📋 Pre-Commit Checklist

Before submitting any code changes:

- [ ] No temporary files in project root
- [ ] All test scripts in `tmp/scripts/`
- [ ] All temporary audio in `tmp/audio/`
- [ ] All debug logs in `tmp/logs/`
- [ ] Updated `.gitignore` if needed
- [ ] Documentation reflects new file organization
- [ ] Cleanup instructions provided for temporary files

## 🎯 Quality Standards

### Production Code (Root Directory)
- Clean, documented, production-ready
- No temporary or experimental files
- Professional structure and naming
- Comprehensive error handling

### Temporary Code (tmp/ Directory)
- Clearly marked as temporary
- Descriptive filenames with purpose
- Include cleanup instructions
- Organized by type and purpose

## 🔄 Migration Strategy

When encountering existing temporary files in root:

1. **Identify** - Find all temporary/test files
2. **Categorize** - Determine appropriate `tmp/` subdirectory
3. **Move** - Relocate files with proper organization
4. **Update** - Modify any scripts that reference moved files
5. **Document** - Note changes in commit messages
6. **Clean** - Remove original files after verification

---

# 🏗️ Software Architecture Guidelines

## SOLID Principles Implementation

### Single Responsibility Principle (SRP)
- Each module should have ONE reason to change
- Services handle business logic for their domain
- Utilities perform specific, reusable operations
- Controllers orchestrate workflows without business logic

### Open/Closed Principle (OCP)  
- Classes open for extension, closed for modification
- Use interfaces and dependency injection
- Plugin architecture for voice presets and audio processors

### Liskov Substitution Principle (LSP)
- Implementations must be substitutable for interfaces
- Audio processors, TTS providers should be interchangeable

### Interface Segregation Principle (ISP)
- Small, focused interfaces over large ones
- Separate concerns: ITTSProvider, IAudioProcessor, IFileManager

### Dependency Inversion Principle (DIP)
- Depend on abstractions, not concretions
- Inject dependencies rather than creating them directly

## 📁 Recommended Project Structure

```
src/
├── controllers/        # Request handling and workflow orchestration
│   ├── PodcastController.ts
│   └── CLIController.ts
├── services/          # Business logic and external integrations  
│   ├── tts/
│   │   ├── TTSService.ts
│   │   ├── ChatterboxProvider.ts
│   │   └── VoicePresetManager.ts
│   ├── llm/
│   │   ├── LLMService.ts
│   │   └── OllamaProvider.ts
│   └── audio/
│       ├── AudioService.ts
│       ├── SegmentProcessor.ts
│       └── FFmpegConcatenator.ts
├── utilities/         # Reusable helper functions
│   ├── fileUtils.ts
│   ├── configUtils.ts
│   ├── validationUtils.ts
│   └── loggerUtils.ts
├── interfaces/        # TypeScript interfaces and types
│   ├── ITTSProvider.ts
│   ├── IAudioProcessor.ts
│   ├── ILLMProvider.ts
│   └── types.ts
├── config/           # Configuration management
│   ├── appConfig.ts
│   ├── voiceConfig.ts
│   └── serverConfig.ts
└── index.ts         # Entry point - minimal, delegates to controllers
```

## 🔧 Module Design Patterns

### Service Layer Pattern
```typescript
// services/tts/TTSService.ts
export class TTSService {
  constructor(
    private provider: ITTSProvider,
    private voiceManager: VoicePresetManager,
    private logger: ILogger
  ) {}
  
  async generateSpeech(text: string, config: VoiceConfig): Promise<Buffer> {
    // Business logic here
  }
}
```

### Repository Pattern for Configuration
```typescript
// config/voiceConfig.ts  
export class VoiceConfigRepository {
  getPreset(name: string): VoicePreset | null
  saveCustomPreset(preset: VoicePreset): void
  listAvailablePresets(): string[]
}
```

### Strategy Pattern for Audio Processing
```typescript
// interfaces/IAudioProcessor.ts
export interface IAudioProcessor {
  process(segments: Buffer[]): Promise<Buffer>
  supports(format: string): boolean
}

// services/audio/FFmpegConcatenator.ts
export class FFmpegConcatenator implements IAudioProcessor {
  async process(segments: Buffer[]): Promise<Buffer> {
    // FFmpeg-specific implementation
  }
}
```

### Factory Pattern for Providers
```typescript
// services/ProviderFactory.ts
export class TTSProviderFactory {
  static create(type: 'chatterbox' | 'elevenlabs'): ITTSProvider {
    switch(type) {
      case 'chatterbox': return new ChatterboxProvider()
      case 'elevenlabs': return new ElevenLabsProvider()
    }
  }
}
```

## 🎯 Development Guidelines

### Creating New Services
1. **Define interface first** - What contract should this fulfill?
2. **Single responsibility** - What ONE thing does this service do?
3. **Dependency injection** - What does this service need from others?
4. **Error handling** - How should failures be communicated?
5. **Testing strategy** - How will you verify this works?

### Modifying Existing Code
1. **Identify concerns** - What responsibilities are mixed together?
2. **Extract services** - Move business logic to dedicated services
3. **Create interfaces** - Define contracts between layers
4. **Inject dependencies** - Remove direct instantiation
5. **Preserve behavior** - Ensure functionality remains the same

### Adding New Features
1. **Service layer first** - Where does the business logic belong?
2. **Interface compliance** - Does this fit existing contracts?
3. **Configuration management** - How are settings handled?
4. **Error scenarios** - What can go wrong and how to handle it?
5. **Integration points** - How does this connect to existing services?

## 🧪 Testing Strategy

### Unit Tests
- Test services in isolation with mocked dependencies
- Test utilities with various input scenarios
- Test configuration validation and defaults

### Integration Tests  
- Test service interactions with real implementations
- Test audio processing pipeline end-to-end
- Test CLI commands with temporary files in `tmp/`

### Testing File Organization
```
tmp/tests/
├── unit/           # Unit test fixtures and outputs
├── integration/    # Integration test data and results  
├── fixtures/       # Reusable test data files
└── outputs/        # Generated test artifacts
```

## 🔍 Code Quality Standards

### TypeScript Best Practices
- Strict mode enabled
- Explicit return types for public methods
- Proper error types (not just `Error`)
- Comprehensive JSDoc comments

### Naming Conventions
- **Services**: `PascalCase` ending with `Service`
- **Interfaces**: `PascalCase` starting with `I`
- **Utilities**: `camelCase` descriptive names
- **Constants**: `UPPER_SNAKE_CASE`

### Error Handling
```typescript
// Custom error types
export class TTSError extends Error {
  constructor(message: string, public code: string) {
    super(message)
  }
}

// Service error handling
async generateSpeech(text: string): Promise<Buffer> {
  try {
    return await this.provider.synthesize(text)
  } catch (error) {
    throw new TTSError(`Speech generation failed: ${error.message}`, 'TTS_GENERATION_ERROR')
  }
}
```

## 📋 Refactoring Checklist

### Before Starting Refactoring
- [ ] Current functionality fully working
- [ ] Tests covering existing behavior (or create them)
- [ ] Backup of working state created
- [ ] Clear understanding of current architecture

### During Refactoring
- [ ] One concern extracted at a time
- [ ] Interfaces defined before implementations
- [ ] Dependencies injected, not hardcoded
- [ ] Error handling preserved and improved
- [ ] Temporary files in `tmp/` during testing

### After Refactoring  
- [ ] All functionality preserved
- [ ] New architecture documented
- [ ] Build process updated for new structure
- [ ] Performance verified (no regressions)
- [ ] Code review completed

---

# � Project-Specific Implementation Guide

## 🎙️ Podcast Generator Architecture

### Current Implementation Status

**✅ Completed Modules:**
```
src/
├── controllers/
│   ├── CLIController.ts      # Command-line interface with status/voices commands
│   └── PodcastController.ts  # Main podcast generation workflow
├── services/
│   ├── tts/
│   │   ├── TTSService.ts     # TTS business logic and segmentation
│   │   └── ChatterboxProvider.ts # Chatterbox server integration
│   ├── llm/
│   │   ├── LLMService.ts     # LLM orchestration and script generation
│   │   └── OllamaProvider.ts # Ollama integration
│   └── audio/
│       ├── AudioService.ts   # Audio processing orchestration
│       └── FFmpegConcatenator.ts # FFmpeg-based audio concatenation
├── utilities/
│   ├── fileUtils.ts          # File operations with tmp/ organization
│   ├── configUtils.ts        # Configuration and voice presets
│   ├── validationUtils.ts    # Input validation and error checking
│   └── loggerUtils.ts        # Console and file logging
├── interfaces/
│   ├── types.ts              # Core types and custom errors
│   ├── ITTSProvider.ts       # TTS provider contract
│   ├── IAudioProcessor.ts    # Audio processor contract
│   ├── ILLMProvider.ts       # LLM provider contract
│   └── ILogger.ts            # Logger contract
└── index.ts                  # Dependency injection container
```

### Key Features Implemented

1. **Voice Customization System**
   - 5 professional voice presets (masculine default)
   - Advanced parameter control (temperature, top_p, top_k)
   - Voice testing tools and comparison utilities

2. **Modular CLI Interface**
   - `status` - Service health and configuration check
   - `voices` - List available presets with descriptions
   - `generate` - Main podcast generation with full parameter control

3. **Apple Silicon Optimization**
   - Metal Performance Shaders (MPS) acceleration
   - Chatterbox TTS with PyTorch Metal support
   - Memory-efficient audio processing

4. **Clean Architecture Implementation**
   - SOLID principles throughout codebase
   - Dependency injection with interfaces
   - Comprehensive error handling with custom types

## 🛠 Development Patterns for This Project

### Adding New TTS Providers

```typescript
// 1. Create provider implementation
// src/services/tts/ElevenLabsProvider.ts
export class ElevenLabsProvider implements ITTSProvider {
  async checkHealth(): Promise<HealthStatus> { /* implementation */ }
  async synthesize(text: string, config?: VoiceConfig): Promise<Buffer> { /* implementation */ }
  async getVoicePresets(): Promise<string[]> { /* implementation */ }
}

// 2. Update factory or dependency injection
// src/index.ts - Application constructor
const ttsProvider = providerId === 'elevenlabs' 
  ? new ElevenLabsProvider(apiKey, logger)
  : new ChatterboxProvider(serverURL, logger);
```

### Adding New Audio Processors

```typescript
// 1. Implement processor interface
// src/services/audio/SoxProcessor.ts  
export class SoxProcessor implements IAudioProcessor {
  async process(segments: Buffer[]): Promise<Buffer> { /* implementation */ }
  async concatenate(paths: string[], output: string): Promise<void> { /* implementation */ }
  supports(format: string): boolean { /* implementation */ }
  async isAvailable(): Promise<boolean> { /* implementation */ }
}

// 2. Register in service configuration
// src/controllers/PodcastController.ts
const audioProcessor = new SoxProcessor(logger);
const audioService = new AudioService(audioProcessor, logger);
```

### Adding New CLI Commands

```typescript
// src/controllers/CLIController.ts
private setupCommands(): void {
  // Add new command
  this.program
    .command('benchmark')
    .description('Run performance benchmarks')
    .option('--iterations <n>', 'Number of test iterations', parseInt, 5)
    .action(async (options) => {
      await this.handleBenchmarkCommand(options);
    });
}

private async handleBenchmarkCommand(options: any): Promise<void> {
  // Implementation using existing services
  const status = await this.podcastController.getServiceStatus();
  // Run benchmarks and output to tmp/logs/
}
```

### Voice Preset Development

```typescript
// src/utilities/configUtils.ts - Add new preset
static getDefaultVoiceConfig(): VoiceConfig {
  return {
    // Add new preset configuration
    'news_anchor': {
      temperature: 0.05,
      top_p: 0.3,
      top_k: 8,
      exaggeration: 0.15,
      cfg_scale: 0.35
    }
  };
}
```

### Temporary File Patterns for This Project

```typescript
// Voice testing outputs
const voiceTestPath = FileUtils.getTempFilePath(
  `voice_test_${preset}_${Date.now()}.wav`, 
  'audio/tests'
);

// Audio processing intermediates  
const segmentPath = FileUtils.getTempFilePath(
  `segment_${index}.wav`,
  'audio/segments'
);

// Generated podcasts (temporary)
const outputPath = FileUtils.getTempFilePath(
  `podcast_${sessionId}.mp3`,
  'audio/output'  
);

// Debug logs
const logPath = FileUtils.getTempFilePath(
  `debug_${Date.now()}.log`,
  'logs'
);
```

## 🧪 Testing Patterns for This Project

### Service Testing Template

```typescript
// tmp/tests/services/TTSService.test.ts
import { TTSService } from '../../src/services/tts/TTSService.js';
import { MockTTSProvider } from '../mocks/MockTTSProvider.js';
import { ConsoleLogger } from '../../src/utilities/loggerUtils.js';

describe('TTSService', () => {
  let service: TTSService;
  let mockProvider: MockTTSProvider;
  let logger: ConsoleLogger;

  beforeEach(() => {
    mockProvider = new MockTTSProvider();
    logger = new ConsoleLogger(false);
    service = new TTSService(mockProvider, logger);
  });

  test('should split text into appropriate segments', () => {
    const text = "Long text content...";
    const segments = service.splitIntoSegments(text, 100);
    expect(segments.length).toBeGreaterThan(1);
  });
});
```

### Integration Testing Template

```typescript
// tmp/tests/integration/PodcastGeneration.test.ts
describe('Podcast Generation Integration', () => {
  test('should generate complete podcast from text file', async () => {
    const inputPath = FileUtils.getTempFilePath('test_input.txt', 'data');
    const outputPath = FileUtils.getTempFilePath('test_output.mp3', 'audio/output');
    
    // Setup test data
    await FileUtils.writeTextFile(inputPath, 'Test podcast content');
    
    // Run generation
    const controller = new PodcastController(/* dependencies */);
    await controller.generatePodcast({
      inputFile: inputPath,
      outputFile: outputPath,
      voice: 'masculine'
    });
    
    // Verify results
    expect(await FileUtils.fileExists(outputPath)).toBe(true);
  });
});
```

## 📋 Project Maintenance Guidelines

### Code Quality Checklist

- [ ] **SOLID Compliance** - Single responsibility, dependency injection
- [ ] **Error Handling** - Custom error types, comprehensive try-catch
- [ ] **TypeScript** - Strict types, no `any` usage
- [ ] **Logging** - Appropriate log levels, structured messages
- [ ] **File Organization** - All temporary files in `tmp/` structure
- [ ] **Documentation** - JSDoc comments, README updates

### Performance Monitoring

```typescript
// Add performance tracking to services
export class TTSService {
  async generateSpeech(text: string, config?: VoiceConfig): Promise<Buffer> {
    const startTime = Date.now();
    
    try {
      const result = await this.provider.synthesize(text, config);
      
      this.logger.info(`TTS generation completed in ${Date.now() - startTime}ms`, {
        textLength: text.length,
        audioSize: result.length
      });
      
      return result;
    } catch (error) {
      this.logger.error(`TTS generation failed after ${Date.now() - startTime}ms`, error);
      throw error;
    }
  }
}
```

---

## 💡 Remember

**This project demonstrates production-ready TypeScript architecture with SOLID principles, comprehensive error handling, and professional temporary file organization. Every addition should maintain these standards while following the established patterns.**

**Key Success Factors:**
- ✅ Maintain clean architecture and SOLID principles
- ✅ Use dependency injection for testability
- ✅ Keep all temporary files organized in `tmp/` structure
- ✅ Provide comprehensive error handling and logging
- ✅ Follow established patterns for consistency
- ✅ Document architectural decisions and usage patterns
