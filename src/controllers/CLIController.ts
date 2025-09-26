import { Command } from 'commander';
import { PodcastController } from './PodcastController.js';
import { PodcastOptions } from '../interfaces/types.js';
import { ILogger } from '../interfaces/ILogger.js';
import { ConfigUtils } from '../utilities/configUtils.js';

/**
 * CLI Controller - Handles command line interface
 * Follows SRP - only handles CLI parsing and user interaction
 */
export class CLIController {
  private podcastController: PodcastController;
  private logger: ILogger;
  private program: Command;

  constructor(podcastController: PodcastController, logger: ILogger) {
    this.podcastController = podcastController;
    this.logger = logger;
    this.program = new Command();
    this.setupCommands();
  }

  /**
   * Setup CLI commands and options
   */
  private setupCommands(): void {
    this.program
      .version('1.0.0')
      .description('A CLI tool to convert text to a podcast using Ollama and open-source TTS.')
      .option('--debug', 'Enable debug logging', false);

    // Generate command (default command)
    this.program
      .command('generate')
      .description('Generate a podcast from text file')
      .requiredOption('-f, --file <path>', 'Path to the input text file.')
      .requiredOption('-o, --output <path>', 'Path to the output MP3 file.')
      .option('-v, --voice <preset>', 'Voice preset (default, masculine, deep_male, professional, feminine)', 'masculine')
      .option('-y, --auto-approve', 'Auto-approve generated script without confirmation', false)
      .option('--ollama-url <url>', 'Ollama server URL (default: http://localhost:11434)')
      .option('--ollama-model <model>', 'Ollama model name (default: gpt-oss:latest)')
      .option('--podcast-prompt <prompt>', 'Custom podcast prompt template')
      .option('--exaggeration <level>', 'Voice exaggeration level (0.0-1.0)', parseFloat, 0.3)
      .option('--cfg-scale <scale>', 'CFG scale for voice generation (0.0-1.0)', parseFloat, 0.4)
      .option('--temperature <temp>', 'Voice temperature for randomness (0.0-1.0)', parseFloat)
      .option('--top-p <p>', 'Top-p sampling for voice (0.0-1.0)', parseFloat)
      .option('--top-k <k>', 'Top-k sampling for voice (integer)', parseInt)
      .option('--video', 'Generate video output in addition to audio', false)
      .option('--image <path>', 'Path to static image file for video generation (required if --video is used)')
      .option('--video-output <path>', 'Path to output video file (defaults to audio path with .mp4 extension)')
      .option('--aspect-ratio <ratio>', 'Video aspect ratio: 16:9, 4:3, 1:1, 9:16 (default: 16:9)', '16:9')
      .option('--video-quality <quality>', 'Video quality: low, medium, high, ultra (default: medium)', 'medium')
      .action(async (options) => {
        await this.handleGenerateCommand(options);
      });



    // Add status command
    this.program
      .command('status')
      .description('Check service availability and configuration')
      .action(async () => {
        await this.handleStatusCommand();
      });

    // Add voice presets command
    this.program
      .command('voices')
      .description('List available voice presets')
      .action(async () => {
        await this.handleVoicesCommand();
      });
  }

  /**
   * Handle podcast generation command
   */
  private async handleGenerateCommand(options: any): Promise<void> {
    try {
      // Validate video options
      if (options.video && !options.image) {
        throw new Error('--image option is required when --video is specified');
      }

      // Build video output path if not specified
      let videoOutputPath = options.videoOutput;
      if (options.video && !videoOutputPath) {
        const audioExt = options.output.split('.').pop();
        videoOutputPath = options.output.replace(`.${audioExt}`, '.mp4');
      }

      // Build podcast options from CLI arguments
      const podcastOptions: PodcastOptions = {
        inputFile: options.file,
        outputFile: options.output,
        voice: options.voice,
        autoApprove: options.autoApprove,
        ollamaUrl: options.ollamaUrl,
        ollamaModel: options.ollamaModel,
        podcastPrompt: options.podcastPrompt,
        exaggeration: options.exaggeration,
        cfgScale: options.cfgScale,
        temperature: options.temperature,
        topP: options.topP,
        topK: options.topK,
        // Video options
        generateVideo: options.video,
        imagePath: options.image,
        videoOutputPath: videoOutputPath,
        aspectRatio: options.aspectRatio,
        videoQuality: options.videoQuality,
      };

      // Generate podcast
      await this.podcastController.generatePodcast(podcastOptions);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Command failed', errorMessage);
      process.exit(1);
    }
  }

  /**
   * Handle status command
   */
  private async handleStatusCommand(): Promise<void> {
    try {
      console.log('🔍 Checking service status...\n');
      
      const status = await this.podcastController.getServiceStatus();
      
      console.log('Service Status:');
      console.log(`  TTS Server:      ${status.tts ? '✅ Healthy' : '❌ Unavailable'}`);
      console.log(`  LLM Service:     ${status.llm ? '✅ Available' : '⚠️  Unavailable'}`);
      console.log(`  Audio Processing: ${status.audio ? '✅ Available' : '❌ Unavailable'}`);
      
      console.log('\nConfiguration:');
      console.log(`  TTS URL:         ${ConfigUtils.getTTSServerURL()}`);
      
      const ollamaConfig = ConfigUtils.getOllamaConfig();
      console.log(`  Ollama Host:     ${ollamaConfig.host}`);
      console.log(`  Default Model:   ${ollamaConfig.model}`);
      
      const appSettings = ConfigUtils.getAppSettings();
      console.log(`  Max Segment:     ${appSettings.maxSegmentLength} chars`);
      console.log(`  Segment Delay:   ${appSettings.segmentDelay}ms`);
      
      if (status.voicePresets.length > 0) {
        console.log('\nAvailable Voice Presets:');
        status.voicePresets.forEach(preset => {
          console.log(`  • ${preset}`);
        });
      }
      
      console.log();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Status check failed', errorMessage);
      process.exit(1);
    }
  }

  /**
   * Handle voices command
   */
  private async handleVoicesCommand(): Promise<void> {
    try {
      console.log('🎙️  Available Voice Presets:\n');
      
      const presets = ConfigUtils.getAvailableVoicePresets();
      const defaultConfig = ConfigUtils.getDefaultVoiceConfig();
      
      presets.forEach(preset => {
        const isDefault = preset === defaultConfig.voice_preset;
        const marker = isDefault ? '(default)' : '';
        
        let description = '';
        switch (preset) {
          case 'masculine':
            description = 'Balanced male voice - recommended for podcasts';
            break;
          case 'deep_male':
            description = 'Deeper, more stable characteristics';
            break;
          case 'professional':
            description = 'Corporate/news anchor style';
            break;
          case 'feminine':
            description = 'Explicitly feminine characteristics';
            break;
          case 'default':
            description = 'Original settings (may sound feminine)';
            break;
        }
        
        console.log(`  ${preset.padEnd(12)} ${marker}`);
        if (description) {
          console.log(`    ${description}`);
        }
        console.log();
      });
      
      console.log('Usage examples:');
      console.log('  --voice masculine       (recommended)');
      console.log('  --voice deep_male       (stable, deep)');
      console.log('  --voice professional    (news style)');
      console.log();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Voice presets command failed', errorMessage);
      process.exit(1);
    }
  }

  /**
   * Parse command line arguments and execute
   */
  async parseAndExecute(argv: string[]): Promise<void> {
    await this.program.parseAsync(argv);
  }

  /**
   * Show help information
   */
  showHelp(): void {
    this.program.help();
  }
}