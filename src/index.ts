#!/usr/bin/env node

/**
 * Podcast Generator - Entry Point
 * Demonstrates SOLID principles and clean architecture
 * All temporary files are managed in tmp/ directory per AGENTS.md
 */

import { CLIController } from './controllers/CLIController.js';
import { PodcastController } from './controllers/PodcastController.js';
import { ConsoleLogger, FileLogger } from './utilities/loggerUtils.js';
import { ConfigUtils } from './utilities/configUtils.js';
import { ServiceFactory } from './factories/ServiceFactory.js';

/**
 * Dependency Injection Container
 * Follows DIP - depends on abstractions, not concretions
 */
class Application {
  private cliController: CLIController;

  constructor() {
    // Setup dependencies using dependency injection
    this.cliController = this.createCLIController();
  }

  private createCLIController(): CLIController {
    // Configuration
    const appSettings = ConfigUtils.getAppSettings();

    // Logging
    const logger = appSettings.enableDebugLogging 
      ? new FileLogger('tmp/logs/app.log', true)
      : new ConsoleLogger();

    // Service Factory (Dependency Injection Container)
    const serviceFactory = new ServiceFactory(logger);

    // Controller Layer (Orchestration)
    const podcastController = new PodcastController(serviceFactory, logger);

    // CLI Controller (User Interface)
    return new CLIController(podcastController, logger);
  }

  async run(): Promise<void> {
    try {
      await this.cliController.parseAndExecute(process.argv);
    } catch (error) {
      console.error('Application startup failed:', error);
      process.exit(1);
    }
  }
}

/**
 * Application Entry Point
 */
async function main(): Promise<void> {
  // Check Node.js fetch availability (Node 18+ required)
  if (typeof fetch === 'undefined') {
    console.error('❌ Error: fetch is not available. Please use Node.js 18+ or install node-fetch.');
    process.exit(1);
  }

  // Create and run application
  const app = new Application();
  await app.run();
}

// Run the application
main().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});