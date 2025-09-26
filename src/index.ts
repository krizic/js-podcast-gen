#!/usr/bin/env node

import { Command } from 'commander';
import { promises as fs } from 'fs';
import { Ollama } from 'ollama';
import { WaveFile } from 'wavefile';
import { spawn } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as os from 'os';

// TTS Server Configuration
const TTS_SERVER_URL = process.env.TTS_SERVER_URL || 'http://localhost:8000';

// Function to check if TTS server is running
async function checkTTSServer(): Promise<boolean> {
  try {
    const response = await fetch(`${TTS_SERVER_URL}/health`);
    if (response.ok) {
      const health = await response.json();
      return health.status === 'healthy';
    }
    return false;
  } catch (error) {
    return false;
  }
}

// Function to run ffmpeg and concatenate audio segments
async function concatenateAudioWithFFmpeg(segmentPaths: string[], outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Create ffmpeg command for concatenation
    const inputArgs: string[] = [];
    const filterParts: string[] = [];
    
    segmentPaths.forEach((segmentPath, index) => {
      inputArgs.push('-i', segmentPath);
      filterParts.push(`[${index}:0]`);
    });
    
    const filterComplex = `${filterParts.join('')}concat=n=${segmentPaths.length}:v=0:a=1[out]`;
    
    const ffmpegArgs = [
      ...inputArgs,
      '-filter_complex', filterComplex,
      '-map', '[out]',
      '-y', // Overwrite output file
      outputPath
    ];
    
    const ffmpeg = spawn('ffmpeg', ffmpegArgs);
    
    let stderr = '';
    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg failed with code ${code}. Error: ${stderr}`));
      }
    });
    
    ffmpeg.on('error', (error) => {
      reject(new Error(`Failed to start ffmpeg: ${error.message}`));
    });
  });
}

// Function to check if ffmpeg is available
async function checkFFmpegAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const ffmpeg = spawn('ffmpeg', ['-version']);
    ffmpeg.on('close', (code) => {
      resolve(code === 0);
    });
    ffmpeg.on('error', () => {
      resolve(false);
    });
  });
}

// Function to generate speech using local TTS server
async function generateSpeechWithTTS(text: string): Promise<Buffer> {
  try {
    const response = await fetch(`${TTS_SERVER_URL}/synthesize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        exaggeration: 0.5,
        cfg_scale: 0.5
      }),
    });

    if (!response.ok) {
      throw new Error(`TTS server error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success || !result.audio) {
      throw new Error('No audio data returned from TTS server');
    }

    // Decode the base64 audio data
    return Buffer.from(result.audio, 'base64');
  } catch (error) {
    throw new Error(`Failed to generate speech: ${error}`);
  }
}

// Check for Node.js fetch (built-in from Node 18+)
if (typeof fetch === 'undefined') {
  console.error('Error: fetch is not available. Please use Node.js 18+ or install node-fetch.');
  process.exit(1);
}

const program = new Command();

program
  .version('1.0.0')
  .description('A CLI tool to convert text to a podcast using Ollama and open-source TTS.')
  .requiredOption('-f, --file <path>', 'Path to the input text file.')
  .requiredOption('-o, --output <path>', 'Path to the output MP3 file.');

program.parse(process.argv);

const options = program.opts();

async function main() {
  try {
    console.log('Starting podcast generation...');

    // 1. Read the input file
    const text = await fs.readFile(options.file, 'utf-8');

    // 2. Generate podcast script using Ollama
    console.log('Generating podcast script with Ollama...');
    const ollama = new Ollama({ host: 'http://10.69.1.200:11434' });
    const prompt = `You are a podcast host. Your task is to convert the following text into an engaging podcast script. Add a brief introduction and a concluding summary. The tone should be conversational and informative. Do not add annotations since everything you output will be directly read by speecht5_tts model. Punktation is very important for natural speech. Here is the text:

---
${text}
---`;

    const response = await ollama.generate({
      model: 'gpt-oss:latest', // Or your preferred model
      prompt: prompt,
    });

    const script = response.response;
    console.log('Podcast script generated.');
    console.log(`Script length: ${script.length} characters`);

    // 3. Convert script to speech
    console.log('Converting script to speech...');

    // Check if TTS server is running
    console.log('Checking TTS server connection...');
    const isServerHealthy = await checkTTSServer();
    
    if (!isServerHealthy) {
      console.error('Error: TTS server is not running or not healthy.');
      console.error('Please start the TTS server first:');
      console.error('1. Run: source tts_env/bin/activate');
      console.error('2. Run: python alternative_tts_server.py');
      console.error(`3. Server should be available at: ${TTS_SERVER_URL}`);
      process.exit(1);
    }
    
    console.log('TTS server is ready!');

    // Split text into natural segments (paragraphs or logical sections)
    // This maintains natural flow while staying within model limits
    const splitIntoSegments = (text: string): string[] => {
      // First try splitting by double newlines (paragraphs)
      let segments = text.split(/\n\s*\n/).filter(segment => segment.trim().length > 0);
      
      // If segments are still too long (>600 chars), split them further
      const maxSegmentLength = 600;
      const finalSegments: string[] = [];
      
      for (const segment of segments) {
        if (segment.length <= maxSegmentLength) {
          finalSegments.push(segment.trim());
        } else {
          // Split long segments at sentence boundaries
          const sentences = segment.split(/(?<=[.!?])\s+/);
          let currentSegment = '';
          
          for (const sentence of sentences) {
            if (currentSegment.length + sentence.length + 1 <= maxSegmentLength) {
              currentSegment += (currentSegment ? ' ' : '') + sentence;
            } else {
              if (currentSegment) finalSegments.push(currentSegment.trim());
              currentSegment = sentence;
            }
          }
          if (currentSegment) finalSegments.push(currentSegment.trim());
        }
      }
      
      return finalSegments;
    };

    const segments = splitIntoSegments(script);
    console.log(`Processing script in ${segments.length} natural segments...`);
    
    let allAudioBuffers: Buffer[] = [];

    for (let i = 0; i < segments.length; i++) {
      console.log(`Processing segment ${i + 1}/${segments.length} (${segments[i].length} chars)...`);
      
      try {
        const audioBuffer = await generateSpeechWithTTS(segments[i]);
        allAudioBuffers.push(audioBuffer);
        console.log(`Segment ${i + 1} processed successfully (${audioBuffer.length} bytes)`);
        
        // Add a small delay between requests to be nice to the server
        if (i < segments.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
        }
      } catch (segmentError) {
        console.warn(`Warning: Failed to process segment ${i + 1}:`, segmentError);
        // Continue with other segments
      }
    }

    if (allAudioBuffers.length === 0) {
      throw new Error('No audio data was generated from any segments.');
    }

    console.log('Combining audio segments...');
    
    const outputPath = options.output.replace(/\.(wav|mp3)$/i, '.mp3');
    
    if (allAudioBuffers.length === 1) {
      // Single segment - save directly as MP3
      console.log('Saving single audio segment...');
      await fs.writeFile(outputPath, allAudioBuffers[0]);
      console.log(`Podcast saved to ${outputPath}`);
    } else {
      // Multiple segments - use ffmpeg for proper concatenation
      console.log(`Concatenating ${allAudioBuffers.length} audio segments with ffmpeg...`);
      
      // Check if ffmpeg is available
      const ffmpegAvailable = await checkFFmpegAvailable();
      if (!ffmpegAvailable) {
        console.warn('FFmpeg not found. Saving segments individually instead.');
        // Fallback: save first segment as main file and others as separate files
        await fs.writeFile(outputPath, allAudioBuffers[0]);
        console.log(`Main segment saved to ${outputPath}`);
        
        for (let i = 1; i < allAudioBuffers.length; i++) {
          const segmentPath = outputPath.replace('.mp3', `_segment_${i + 1}.mp3`);
          await fs.writeFile(segmentPath, allAudioBuffers[i]);
          console.log(`Additional segment saved to ${segmentPath}`);
        }
        return;
      }
      
      // Create temporary directory for segment files
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'podcast-segments-'));
      const segmentPaths: string[] = [];
      
      try {
        // Save all segments as temporary WAV files
        for (let i = 0; i < allAudioBuffers.length; i++) {
          const segmentPath = path.join(tempDir, `segment_${i + 1}.wav`);
          await fs.writeFile(segmentPath, allAudioBuffers[i]);
          segmentPaths.push(segmentPath);
        }
        
        // Concatenate using ffmpeg
        await concatenateAudioWithFFmpeg(segmentPaths, outputPath);
        console.log(`Successfully concatenated ${allAudioBuffers.length} segments into ${outputPath}`);
        
      } finally {
        // Clean up temporary files
        try {
          for (const segmentPath of segmentPaths) {
            await fs.unlink(segmentPath);
          }
          await fs.rmdir(tempDir);
        } catch (cleanupError) {
          console.warn('Warning: Failed to clean up temporary files:', cleanupError);
        }
      }
    }

    console.log(`Podcast saved to ${options.output}`);
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

main();
