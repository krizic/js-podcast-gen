import { ILogger } from '../interfaces/ILogger.js';

/**
 * Console-based logger implementation
 * Follows SRP - only handles logging operations
 */
export class ConsoleLogger implements ILogger {
  protected enableDebug: boolean;

  constructor(enableDebug: boolean = false) {
    this.enableDebug = enableDebug;
  }

  info(message: string, ...args: any[]): void {
    console.log(`ℹ️  ${message}`, ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`⚠️  ${message}`, ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(`❌ ${message}`, ...args);
  }

  debug(message: string, ...args: any[]): void {
    if (this.enableDebug) {
      console.debug(`🔍 ${message}`, ...args);
    }
  }
}

/**
 * File-based logger that also writes to tmp/logs/
 * Extends console logger with file output capability
 */
export class FileLogger extends ConsoleLogger {
  private logFilePath: string;

  constructor(logFilePath: string = 'tmp/logs/app.log', enableDebug: boolean = false) {
    super(enableDebug);
    this.logFilePath = logFilePath;
  }

  private async writeToFile(level: string, message: string, ...args: any[]): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const timestamp = new Date().toISOString();
      const logLine = `[${timestamp}] ${level}: ${message} ${args.length ? JSON.stringify(args) : ''}\n`;
      
      // Ensure log directory exists
      const logDir = path.dirname(this.logFilePath);
      await fs.mkdir(logDir, { recursive: true });
      
      // Append to log file
      await fs.appendFile(this.logFilePath, logLine);
    } catch (error) {
      // Don't throw - logging should not break the application
      console.error('Logging error:', error);
    }
  }

  info(message: string, ...args: any[]): void {
    super.info(message, ...args);
    this.writeToFile('INFO', message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    super.warn(message, ...args);
    this.writeToFile('WARN', message, ...args);
  }

  error(message: string, ...args: any[]): void {
    super.error(message, ...args);
    this.writeToFile('ERROR', message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    super.debug(message, ...args);
    if (this.enableDebug) {
      this.writeToFile('DEBUG', message, ...args);
    }
  }
}