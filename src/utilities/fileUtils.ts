import { promises as fs } from 'fs';
import * as path from 'path';
import { FileOperationError } from '../interfaces/types.js';

/**
 * File operations utility following SRP
 * Handles all file system operations with proper error handling
 */
export class FileUtils {
  
  /**
   * Read text file with error handling
   */
  static async readTextFile(filePath: string): Promise<string> {
    try {
      const absolutePath = path.resolve(filePath);
      return await fs.readFile(absolutePath, 'utf-8');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new FileOperationError(
        `Failed to read file ${filePath}: ${errorMessage}`,
        'FILE_READ_ERROR'
      );
    }
  }

  /**
   * Write buffer to file with directory creation
   */
  static async writeBufferToFile(filePath: string, buffer: Buffer): Promise<void> {
    try {
      const absolutePath = path.resolve(filePath);
      const directory = path.dirname(absolutePath);
      
      // Ensure directory exists
      await fs.mkdir(directory, { recursive: true });
      await fs.writeFile(absolutePath, buffer);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new FileOperationError(
        `Failed to write buffer to ${filePath}: ${errorMessage}`,
        'FILE_WRITE_ERROR'
      );
    }
  }

  /**
   * Check if file exists
   */
  static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(path.resolve(filePath));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create directory if it doesn't exist
   */
  static async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(path.resolve(dirPath), { recursive: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new FileOperationError(
        `Failed to create directory ${dirPath}: ${errorMessage}`,
        'DIRECTORY_CREATE_ERROR'
      );
    }
  }

  /**
   * Get temporary file path in tmp directory
   */
  static getTempFilePath(filename: string, subdir: string = ''): string {
    const basePath = path.join(process.cwd(), 'tmp');
    return subdir 
      ? path.join(basePath, subdir, filename)
      : path.join(basePath, filename);
  }

  /**
   * Clean up temporary files matching pattern
   */
  static async cleanupTempFiles(pattern: string, maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const tmpDir = path.join(process.cwd(), 'tmp');
      const files = await fs.readdir(tmpDir, { recursive: true });
      const now = Date.now();

      for (const file of files) {
        if (typeof file === 'string' && file.includes(pattern)) {
          const filePath = path.join(tmpDir, file);
          const stats = await fs.stat(filePath);
          
          if (now - stats.mtime.getTime() > maxAge) {
            await fs.unlink(filePath);
          }
        }
      }
    } catch (error) {
      // Non-critical operation, log but don't throw
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`Cleanup warning: ${errorMessage}`);
    }
  }
}