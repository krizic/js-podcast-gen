# 🏗️ Architecture Documentation

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Core Architecture Patterns](#core-architecture-patterns)
3. [Service Layer Design](#service-layer-design)
4. [Data Flow & Service Communication](#data-flow--service-communication)
5. [Dependency Injection System](#dependency-injection-system)
6. [Configuration Management](#configuration-management)
7. [Error Handling Strategy](#error-handling-strategy)
8. [Performance Optimizations](#performance-optimizations)

---

## 🎯 System Overview

The **js-podcast-gen** application follows a clean, modular architecture based on SOLID principles, implementing a layered service-oriented design with dependency injection. The system transforms text content into high-quality podcasts through a coordinated pipeline of AI services.

### 🎪 High-Level Architecture

```mermaid
graph TB
    %% User Interface Layer
    CLI[CLI Interface]
    
    %% Controller Layer
    CLIController[CLI Controller]
    PodcastController[Podcast Controller]
    
    %% Service Factory
    ServiceFactory[Service Factory]
    
    %% Service Layer
    TTSService[TTS Service]
    LLMService[LLM Service]
    AudioService[Audio Service]
    
    %% Provider Layer
    ChatterboxProvider[Chatterbox TTS Provider]
    OllamaProvider[Ollama LLM Provider]
    FFmpegProcessor[FFmpeg Audio Processor]
    
    %% Utility Layer
    ConfigUtils[Config Utils]
    FileUtils[File Utils]
    ValidationUtils[Validation Utils]
    LoggerUtils[Logger Utils]
    
    %% External Services
    ChatterboxServer[Chatterbox TTS Server<br/>Apple Silicon MPS]
    OllamaServer[Ollama LLM Server]
    FFmpeg[FFmpeg Binary]
    
    %% Flow
    CLI --> CLIController
    CLIController --> PodcastController
    PodcastController --> ServiceFactory
    ServiceFactory --> TTSService
    ServiceFactory --> LLMService
    ServiceFactory --> AudioService
    
    TTSService --> ChatterboxProvider
    LLMService --> OllamaProvider
    AudioService --> FFmpegProcessor
    
    ChatterboxProvider --> ChatterboxServer
    OllamaProvider --> OllamaServer
    FFmpegProcessor --> FFmpeg
    
    TTSService --> ConfigUtils
    LLMService --> ConfigUtils
    AudioService --> FileUtils
    PodcastController --> ValidationUtils
    CLIController --> LoggerUtils
    
    classDef controller fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef service fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef provider fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef utility fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef external fill:#ffebee,stroke:#c62828,stroke-width:2px
    
    class CLIController,PodcastController controller
    class ServiceFactory,TTSService,LLMService,AudioService service
    class ChatterboxProvider,OllamaProvider,FFmpegProcessor provider
    class ConfigUtils,FileUtils,ValidationUtils,LoggerUtils utility
    class ChatterboxServer,OllamaServer,FFmpeg external
```

---

## 🛠 Core Architecture Patterns

### 1. **Layered Architecture**

The application is organized into distinct layers, each with specific responsibilities:

```mermaid
graph LR
    subgraph "Presentation Layer"
        CLI[CLI Interface]
        CLIController[CLI Controller]
    end
    
    subgraph "Business Logic Layer"
        PodcastController[Podcast Controller]
        ServiceFactory[Service Factory]
    end
    
    subgraph "Service Layer"
        TTSService[TTS Service]
        LLMService[LLM Service]
        AudioService[Audio Service]
    end
    
    subgraph "Data Access Layer"
        ChatterboxProvider[TTS Provider]
        OllamaProvider[LLM Provider]
        FFmpegProcessor[Audio Processor]
    end
    
    subgraph "Infrastructure Layer"
        ConfigUtils[Configuration]
        FileUtils[File Operations]
        ValidationUtils[Validation]
        LoggerUtils[Logging]
    end
    
    CLI --> CLIController
    CLIController --> PodcastController
    PodcastController --> ServiceFactory
    ServiceFactory --> TTSService
    ServiceFactory --> LLMService
    ServiceFactory --> AudioService
    TTSService --> ChatterboxProvider
    LLMService --> OllamaProvider
    AudioService --> FFmpegProcessor
    
    TTSService --> ConfigUtils
    LLMService --> ConfigUtils
    AudioService --> FileUtils
    PodcastController --> ValidationUtils
    CLIController --> LoggerUtils
```

### 2. **SOLID Principles Implementation**

#### **Single Responsibility Principle (SRP)**
- **TTSService**: Handles only text-to-speech operations and segmentation
- **LLMService**: Manages only language model interactions and script generation
- **AudioService**: Responsible only for audio processing and file operations
- **ConfigUtils**: Manages only configuration and settings

#### **Open/Closed Principle (OCP)**
- Services are open for extension via interfaces
- New TTS providers can be added without modifying existing code
- Audio processors can be swapped through the `IAudioProcessor` interface

#### **Liskov Substitution Principle (LSP)**
- All providers implement their respective interfaces completely
- `ChatterboxProvider` can be substituted with any `ITTSProvider`
- `FFmpegConcatenator` can be replaced with any `IAudioProcessor`

#### **Interface Segregation Principle (ISP)**
- Small, focused interfaces: `ITTSProvider`, `IAudioProcessor`, `ILLMProvider`
- Clients depend only on methods they actually use

#### **Dependency Inversion Principle (DIP)**
- High-level modules depend on abstractions (interfaces)
- Dependencies are injected rather than created directly
- ServiceFactory manages all dependency creation

---

## 🎛 Service Layer Design

### Service Factory Pattern

The `ServiceFactory` implements a factory pattern to create services with dynamic configuration:

```mermaid
classDiagram
    class ServiceFactory {
        -logger: ILogger
        +createTTSService(): TTSService
        +createLLMService(url?, model?): LLMService
        +createAudioService(): AudioService
    }
    
    class TTSService {
        -provider: ITTSProvider
        -logger: ILogger
        +isServiceHealthy(): boolean
        +splitIntoSegments(): string[]
        +processSegments(): Buffer[]
    }
    
    class LLMService {
        -provider: ILLMProvider
        -logger: ILogger
        +isServiceAvailable(): boolean
        +generatePodcastScript(): string
    }
    
    class AudioService {
        -processor: IAudioProcessor
        -logger: ILogger
        +isProcessingAvailable(): boolean
        +combineAudioBuffers(): void
    }
    
    class ITTSProvider {
        <<interface>>
        +synthesize(): Buffer
        +checkHealth(): HealthStatus
    }
    
    class ILLMProvider {
        <<interface>>
        +generate(): string
        +isAvailable(): boolean
    }
    
    class IAudioProcessor {
        <<interface>>
        +process(): Buffer
        +concatenate(): void
    }
    
    ServiceFactory --> TTSService
    ServiceFactory --> LLMService
    ServiceFactory --> AudioService
    TTSService --> ITTSProvider
    LLMService --> ILLMProvider
    AudioService --> IAudioProcessor
```

---

## 🔄 Data Flow & Service Communication

### Complete Podcast Generation Flow

```mermaid
sequenceDiagram
    participant User
    participant CLI as CLI Controller
    participant PC as Podcast Controller
    participant SF as Service Factory
    participant LLM as LLM Service
    participant TTS as TTS Service
    participant Audio as Audio Service
    participant Ollama as Ollama Server
    participant Chatterbox as Chatterbox TTS
    participant FFmpeg as FFmpeg
    
    User->>CLI: generate command with options
    CLI->>PC: generatePodcast(options)
    
    Note over PC: Parse and validate options
    PC->>SF: createLLMService(url, model)
    SF->>LLM: new LLMService(provider, logger)
    PC->>SF: createTTSService()
    SF->>TTS: new TTSService(provider, logger)
    PC->>SF: createAudioService()
    SF->>Audio: new AudioService(processor, logger)
    
    Note over PC: 1. Read input file
    PC->>PC: FileUtils.readTextFile()
    
    Note over PC: 2. Generate podcast script
    PC->>LLM: generatePodcastScript(text, model, prompt)
    LLM->>Ollama: HTTP POST /api/generate
    Ollama-->>LLM: Generated script
    LLM-->>PC: Enhanced podcast script
    
    Note over PC: 3. Check service availability
    PC->>TTS: isServiceHealthy()
    TTS->>Chatterbox: GET /health
    Chatterbox-->>TTS: Health status
    PC->>Audio: isProcessingAvailable()
    Audio->>FFmpeg: ffmpeg -version
    
    Note over PC: 4. Convert to speech
    PC->>TTS: processSegments(script, voiceConfig)
    
    loop For each text segment
        TTS->>Chatterbox: POST /synthesize
        Note over Chatterbox: Apple Silicon MPS<br/>Acceleration
        Chatterbox-->>TTS: Audio buffer
    end
    
    TTS-->>PC: Array of audio buffers
    
    Note over PC: 5. Combine audio segments
    PC->>Audio: combineAudioBuffers(buffers, outputPath)
    Audio->>FFmpeg: ffmpeg concat operation
    FFmpeg-->>Audio: Final MP3 file
    
    PC-->>CLI: Success message
    CLI-->>User: Podcast generated successfully
```

### Service Health Check Flow

```mermaid
sequenceDiagram
    participant CLI as CLI Controller
    participant PC as Podcast Controller
    participant SF as Service Factory
    participant TTS as TTS Service
    participant LLM as LLM Service
    participant Audio as Audio Service
    participant Chatterbox as Chatterbox Server
    participant Ollama as Ollama Server
    participant FFmpeg as FFmpeg Binary
    
    CLI->>PC: getServiceStatus()
    PC->>SF: createTTSService()
    PC->>SF: createLLMService()
    PC->>SF: createAudioService()
    
    par Health Checks
        PC->>TTS: isServiceHealthy()
        TTS->>Chatterbox: GET /health
        Chatterbox-->>TTS: {status: "healthy"}
        TTS-->>PC: true
    and
        PC->>LLM: isServiceAvailable()
        LLM->>Ollama: GET /api/tags
        Ollama-->>LLM: Available models
        LLM-->>PC: true
    and
        PC->>Audio: isProcessingAvailable()
        Audio->>FFmpeg: ffmpeg -version
        FFmpeg-->>Audio: Version info
        Audio-->>PC: true
    end
    
    PC-->>CLI: {tts: true, llm: true, audio: true}
    CLI-->>CLI: Display status report
```

---

## 🔌 Dependency Injection System

### Service Creation and Injection

The application uses a centralized dependency injection pattern through the `ServiceFactory`:

```mermaid
graph TB
    subgraph "Application Layer"
        App[Application]
        CLI[CLI Controller]
    end
    
    subgraph "Dependency Container"
        SF[Service Factory]
        Logger[Logger Instance]
    end
    
    subgraph "Service Instances"
        TTS[TTS Service]
        LLM[LLM Service]
        Audio[Audio Service]
    end
    
    subgraph "Provider Implementations"
        ChatterboxProvider[Chatterbox Provider]
        OllamaProvider[Ollama Provider]
        FFmpegProcessor[FFmpeg Processor]
    end
    
    subgraph "Configuration Sources"
        EnvVars[Environment Variables]
        Defaults[Default Values]
        CLIArgs[CLI Arguments]
    end
    
    %% Dependency Flow
    App -->|creates| SF
    App -->|creates| Logger
    CLI -->|requests services via| SF
    
    SF -->|injects config & logger| TTS
    SF -->|injects config & logger| LLM
    SF -->|injects config & logger| Audio
    
    TTS -->|uses| ChatterboxProvider
    LLM -->|uses| OllamaProvider
    Audio -->|uses| FFmpegProcessor
    
    %% Configuration Flow
    CLIArgs -->|overrides| SF
    EnvVars -->|fallback| SF
    Defaults -->|final fallback| SF
    
    classDef app fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef container fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef service fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef provider fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef config fill:#fff8e1,stroke:#f9a825,stroke-width:2px
    
    class App,CLI app
    class SF,Logger container
    class TTS,LLM,Audio service
    class ChatterboxProvider,OllamaProvider,FFmpegProcessor provider
    class EnvVars,Defaults,CLIArgs config
```

### Configuration Hierarchy

```mermaid
graph LR
    subgraph "Configuration Priority (Highest to Lowest)"
        A[CLI Arguments]
        B[Environment Variables]
        C[Default Values]
    end
    
    A -->|overrides| B
    B -->|overrides| C
    
    subgraph "Configuration Examples"
        D["--ollama-url http://custom:11434<br/>--ollama-model llama3.1:8b<br/>--voice deep_male"]
        E["OLLAMA_HOST=10.69.1.200:11434<br/>OLLAMA_MODEL=gpt-oss:latest<br/>DEBUG=true"]
        F["http://localhost:11434<br/>llama3.2:3b<br/>masculine voice"]
    end
    
    A -.-> D
    B -.-> E
    C -.-> F
```

---

## ⚙️ Configuration Management

### Dynamic Configuration System

The configuration system supports runtime customization with intelligent fallbacks:

```typescript
// Configuration Resolution Example
class ConfigUtils {
  static getOllamaConfig(customUrl?: string, customModel?: string) {
    return {
      host: customUrl || process.env.OLLAMA_HOST || 'http://localhost:11434',
      model: customModel || process.env.OLLAMA_MODEL || 'llama3.2:3b'
    };
  }
  
  static buildPodcastPrompt(inputText: string, customPrompt?: string): string {
    const prompt = customPrompt || this.getDefaultPodcastPrompt();
    return prompt.replace('{INPUT_TEXT}', inputText);
  }
}
```

### Voice Configuration Matrix

```mermaid
graph TD
    subgraph "Voice Preset System"
        A[User Selection] -->|voice preset| B[Base Configuration]
        C[CLI Parameters] -->|fine-tuning| D[Voice Configuration]
        B --> D
        D --> E[TTS Service]
    end
    
    subgraph "Voice Presets"
        F[masculine<br/>- temperature: 0.1<br/>- exaggeration: 0.3<br/>- cfg_scale: 0.4]
        G[deep_male<br/>- temperature: 0.05<br/>- exaggeration: 0.2<br/>- cfg_scale: 0.35]
        H[professional<br/>- temperature: 0.03<br/>- exaggeration: 0.15<br/>- cfg_scale: 0.3]
    end
    
    subgraph "CLI Overrides"
        I[--temperature 0.2]
        J[--exaggeration 0.4]
        K[--cfg-scale 0.5]
    end
    
    B --> F
    B --> G
    B --> H
    C --> I
    C --> J
    C --> K
```

---

## 🛡️ Error Handling Strategy

### Comprehensive Error Management

```mermaid
graph TB
    subgraph "Error Sources"
        A[Network Failures]
        B[Service Unavailable]
        C[Invalid Input]
        D[File System Errors]
        E[Audio Processing Errors]
    end
    
    subgraph "Error Handling Layers"
        F[Provider Level<br/>- Connection retry<br/>- Timeout handling<br/>- API error mapping]
        G[Service Level<br/>- Business logic validation<br/>- Error transformation<br/>- Fallback strategies]
        H[Controller Level<br/>- User-friendly messages<br/>- Graceful degradation<br/>- Progress reporting]
    end
    
    subgraph "Error Recovery"
        I[Automatic Retry]
        J[Fallback Options]
        K[User Notification]
        L[Graceful Exit]
    end
    
    A --> F
    B --> F
    C --> G
    D --> G
    E --> G
    
    F --> I
    G --> J
    H --> K
    H --> L
    
    classDef error fill:#ffebee,stroke:#c62828,stroke-width:2px
    classDef handling fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef recovery fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    
    class A,B,C,D,E error
    class F,G,H handling
    class I,J,K,L recovery
```

### Error Flow Example

```mermaid
sequenceDiagram
    participant PC as Podcast Controller
    participant LLM as LLM Service
    participant Provider as Ollama Provider
    participant Server as Ollama Server
    
    PC->>LLM: generatePodcastScript()
    LLM->>Provider: generate(prompt, model)
    Provider->>Server: POST /api/generate
    
    alt Server Available
        Server-->>Provider: Generated content
        Provider-->>LLM: Parsed response
        LLM-->>PC: Podcast script
    else Server Unavailable
        Server--xProvider: Connection refused
        Provider->>Provider: Retry with exponential backoff
        Provider->>Server: POST /api/generate (retry)
        
        alt Retry Successful
            Server-->>Provider: Generated content
            Provider-->>LLM: Parsed response
            LLM-->>PC: Podcast script
        else Max Retries Exceeded
            Provider-->>LLM: LLMError("Service unavailable")
            LLM-->>PC: Error("LLM generation failed")
            PC->>PC: Log error and exit gracefully
        end
    end
```

---

## ⚡ Performance Optimizations

### Apple Silicon MPS Acceleration

```mermaid
graph LR
    subgraph "Input Processing"
        A[Text Segments]
        B[Voice Configuration]
    end
    
    subgraph "Chatterbox TTS Pipeline"
        C[Text Preprocessing]
        D[Model Loading<br/>PyTorch MPS]
        E[Inference Acceleration<br/>Metal Performance Shaders]
        F[Audio Synthesis]
    end
    
    subgraph "Output Processing"
        G[Audio Buffers]
        H[FFmpeg Concatenation]
        I[Final MP3]
    end
    
    A --> C
    B --> D
    C --> E
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    
    classDef input fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef processing fill:#fff3e0,stroke:#f57c00,stroke-width:3px
    classDef output fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    
    class A,B input
    class C,D,E,F processing
    class G,H,I output
```

### Concurrent Processing Architecture

```mermaid
graph TB
    subgraph "Parallel Service Operations"
        A[Health Check Coordination]
        B[TTS Health Check]
        C[LLM Availability Check]
        D[Audio Processing Check]
    end
    
    subgraph "Segment Processing Pipeline"
        E[Text Segmentation]
        F[Parallel TTS Processing]
        G[Audio Buffer Collection]
        H[Sequential Concatenation]
    end
    
    A -->|Promise.all| B
    A -->|Promise.all| C
    A -->|Promise.all| D
    
    E --> F
    F -->|Segment 1| G
    F -->|Segment 2| G
    F -->|Segment N| G
    G --> H
    
    classDef parallel fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef sequential fill:#fff8e1,stroke:#f9a825,stroke-width:2px
    
    class A,B,C,D,F parallel
    class E,G,H sequential
```

---

## 🔧 Service Interface Contracts

### TTS Provider Interface

```typescript
interface ITTSProvider {
  synthesize(text: string, config?: VoiceConfig): Promise<Buffer>;
  checkHealth(): Promise<HealthStatus>;
  getVoicePresets(): Promise<string[]>;
}

// Implementation ensures consistent behavior
class ChatterboxProvider implements ITTSProvider {
  async synthesize(text: string, config?: VoiceConfig): Promise<Buffer> {
    // Apple Silicon optimized synthesis
  }
  
  async checkHealth(): Promise<HealthStatus> {
    // Health endpoint validation
  }
}
```

### Audio Processor Interface

```typescript
interface IAudioProcessor {
  process(segments: Buffer[]): Promise<Buffer>;
  concatenate(paths: string[], output: string): Promise<void>;
  supports(format: string): boolean;
  isAvailable(): Promise<boolean>;
}

// FFmpeg implementation
class FFmpegConcatenator implements IAudioProcessor {
  async concatenate(paths: string[], output: string): Promise<void> {
    // High-quality MP3 concatenation with fade effects
  }
}
```

---

## 🚀 Scalability Considerations

### Horizontal Scaling Potential

```mermaid
graph TB
    subgraph "Current Single-Node Architecture"
        A[CLI Application]
        B[Local Services]
        C[External APIs]
    end
    
    subgraph "Future Distributed Architecture"
        D[API Gateway]
        E[Load Balancer]
        F[TTS Service Cluster]
        G[LLM Service Cluster]
        H[Audio Processing Cluster]
        I[Shared Storage]
    end
    
    A --> B
    B --> C
    
    D --> E
    E --> F
    E --> G
    E --> H
    F --> I
    G --> I
    H --> I
    
    classDef current fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef future fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px,stroke-dasharray: 5 5
    
    class A,B,C current
    class D,E,F,G,H,I future
```

### Performance Metrics

- **TTS Processing**: ~2-3 seconds per 100-character segment with MPS acceleration
- **LLM Generation**: ~5-10 seconds for script generation (varies by model size)
- **Audio Concatenation**: ~1-2 seconds for 10-minute podcast
- **Memory Usage**: ~500MB peak during processing (model loading)
- **Apple Silicon Optimization**: 3-4x faster than CPU-only processing

---

## 📊 Monitoring and Observability

### Service Health Monitoring

```mermaid
graph LR
    subgraph "Health Check System"
        A[Service Factory] --> B[Health Coordinator]
        B --> C[TTS Health Check]
        B --> D[LLM Health Check]  
        B --> E[Audio Health Check]
    end
    
    subgraph "Status Reporting"
        F[Console Output]
        G[Log Files]
        H[Error Metrics]
    end
    
    C --> F
    D --> F
    E --> F
    
    C --> G
    D --> G
    E --> G
    
    C --> H
    D --> H
    E --> H
```

This architecture provides a robust, scalable, and maintainable foundation for high-quality podcast generation while maintaining clean separation of concerns and extensibility for future enhancements.
