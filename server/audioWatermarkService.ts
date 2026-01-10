import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import OpenAI from 'openai';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);

const WATERMARK_TEXT = "Heartbeat Studio Preview";
const WATERMARK_INTERVAL_SECONDS = 15;
const WATERMARK_VOLUME = 0.7; // 70% volume for watermark

// OpenAI client for TTS
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

const TEMP_DIR = '/tmp/watermarks';
const WATERMARK_FILE = path.join(TEMP_DIR, 'heartbeat_preview_watermark.mp3');

/**
 * Ensure temp directory exists
 */
async function ensureTempDir(): Promise<void> {
  try {
    await mkdir(TEMP_DIR, { recursive: true });
  } catch (err: any) {
    if (err.code !== 'EEXIST') throw err;
  }
}

/**
 * Generate the watermark audio file using OpenAI TTS
 */
async function generateWatermarkAudio(): Promise<string> {
  await ensureTempDir();
  
  // Check if watermark file already exists
  if (fs.existsSync(WATERMARK_FILE)) {
    console.log('[Watermark] Using cached watermark audio file');
    return WATERMARK_FILE;
  }
  
  console.log('[Watermark] Generating watermark audio with TTS...');
  
  try {
    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'nova', // Clear, professional female voice
      input: WATERMARK_TEXT,
      speed: 1.0,
    });
    
    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(WATERMARK_FILE, buffer);
    
    console.log('[Watermark] Watermark audio generated successfully');
    return WATERMARK_FILE;
  } catch (error: any) {
    console.error('[Watermark] TTS generation failed:', error.message);
    throw new Error('Failed to generate watermark audio');
  }
}

/**
 * Get the duration of an audio file in seconds
 */
function getAudioDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      const duration = metadata.format.duration || 0;
      resolve(duration);
    });
  });
}

/**
 * Download audio from URL to a temporary file
 */
async function downloadAudio(url: string): Promise<string> {
  await ensureTempDir();
  
  const tempFile = path.join(TEMP_DIR, `input_${Date.now()}.mp3`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download audio: ${response.statusText}`);
  }
  
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(tempFile, buffer);
  
  return tempFile;
}

/**
 * Add watermark to audio file at regular intervals
 */
export async function addWatermarkToAudio(audioUrl: string): Promise<string> {
  console.log('[Watermark] Starting watermark process...');
  
  await ensureTempDir();
  
  // Generate or get cached watermark audio
  const watermarkFile = await generateWatermarkAudio();
  
  // Download the source audio
  const inputFile = await downloadAudio(audioUrl);
  const outputFile = path.join(TEMP_DIR, `watermarked_${Date.now()}.mp3`);
  
  try {
    // Get durations
    const [inputDuration, watermarkDuration] = await Promise.all([
      getAudioDuration(inputFile),
      getAudioDuration(watermarkFile),
    ]);
    
    console.log(`[Watermark] Input duration: ${inputDuration}s, Watermark duration: ${watermarkDuration}s`);
    
    // Calculate how many watermarks we need
    const numWatermarks = Math.floor(inputDuration / WATERMARK_INTERVAL_SECONDS);
    
    if (numWatermarks === 0) {
      // Song is too short, just add one watermark at the beginning
      console.log('[Watermark] Short audio, adding single watermark');
      return await overlayWatermarkOnce(inputFile, watermarkFile, outputFile, 0);
    }
    
    // Create filter complex for multiple watermark overlays
    const delays: number[] = [];
    for (let i = 0; i < numWatermarks; i++) {
      delays.push(i * WATERMARK_INTERVAL_SECONDS * 1000); // Convert to milliseconds
    }
    
    console.log(`[Watermark] Adding ${numWatermarks} watermarks at ${WATERMARK_INTERVAL_SECONDS}s intervals`);
    
    return await overlayMultipleWatermarks(inputFile, watermarkFile, outputFile, delays, inputDuration);
  } finally {
    // Clean up input file (keep watermark file cached)
    try {
      await unlink(inputFile);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

/**
 * Overlay watermark once at a specific position
 */
function overlayWatermarkOnce(
  inputFile: string,
  watermarkFile: string,
  outputFile: string,
  delayMs: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(inputFile)
      .input(watermarkFile)
      .complexFilter([
        `[1:a]adelay=${delayMs}|${delayMs},volume=${WATERMARK_VOLUME}[wm]`,
        `[0:a][wm]amix=inputs=2:duration=first:dropout_transition=0[out]`
      ])
      .outputOptions(['-map', '[out]'])
      .audioCodec('libmp3lame')
      .audioBitrate('192k')
      .save(outputFile)
      .on('end', () => {
        console.log('[Watermark] Single watermark applied successfully');
        resolve(outputFile);
      })
      .on('error', (err) => {
        console.error('[Watermark] FFmpeg error:', err.message);
        reject(err);
      });
  });
}

/**
 * Overlay watermarks at multiple positions
 */
function overlayMultipleWatermarks(
  inputFile: string,
  watermarkFile: string,
  outputFile: string,
  delaysMs: number[],
  inputDuration: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Create delayed copies of the watermark and mix them together
    const filterParts: string[] = [];
    const mixInputs: string[] = [];
    
    // First, create delayed versions of the watermark for each interval
    delaysMs.forEach((delay, index) => {
      filterParts.push(
        `[1:a]adelay=${delay}|${delay},volume=${WATERMARK_VOLUME}[wm${index}]`
      );
      mixInputs.push(`[wm${index}]`);
    });
    
    // Mix all watermarks together
    filterParts.push(
      `${mixInputs.join('')}amix=inputs=${delaysMs.length}:duration=longest:dropout_transition=0[allwm]`
    );
    
    // Mix the combined watermarks with the original audio
    filterParts.push(
      `[0:a][allwm]amix=inputs=2:duration=first:dropout_transition=0[out]`
    );
    
    ffmpeg()
      .input(inputFile)
      .input(watermarkFile)
      .complexFilter(filterParts)
      .outputOptions(['-map', '[out]'])
      .audioCodec('libmp3lame')
      .audioBitrate('192k')
      .save(outputFile)
      .on('end', () => {
        console.log(`[Watermark] ${delaysMs.length} watermarks applied successfully`);
        resolve(outputFile);
      })
      .on('error', (err) => {
        console.error('[Watermark] FFmpeg error:', err.message);
        reject(err);
      });
  });
}

/**
 * Upload watermarked audio to object storage and return URL
 */
export async function uploadWatermarkedAudio(localFilePath: string): Promise<string> {
  const { Storage } = await import('@google-cloud/storage');
  
  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  if (!bucketId) {
    throw new Error('Object storage not configured');
  }
  
  const storage = new Storage();
  const bucket = storage.bucket(bucketId);
  
  const fileName = `previews/watermarked_${Date.now()}.mp3`;
  const file = bucket.file(fileName);
  
  const fileBuffer = fs.readFileSync(localFilePath);
  
  await file.save(fileBuffer, {
    contentType: 'audio/mpeg',
    metadata: {
      cacheControl: 'public, max-age=3600', // Cache for 1 hour
    },
  });
  
  // Make the file publicly accessible
  await file.makePublic();
  
  const publicUrl = `https://storage.googleapis.com/${bucketId}/${fileName}`;
  
  // Clean up local file
  try {
    await unlink(localFilePath);
  } catch (e) {
    // Ignore cleanup errors
  }
  
  console.log(`[Watermark] Uploaded watermarked audio: ${publicUrl}`);
  return publicUrl;
}

/**
 * Main function: Add watermark to audio URL and return new URL
 */
export async function watermarkAudioFromUrl(audioUrl: string): Promise<string> {
  console.log(`[Watermark] Processing audio from: ${audioUrl.substring(0, 50)}...`);
  
  const watermarkedFile = await addWatermarkToAudio(audioUrl);
  const publicUrl = await uploadWatermarkedAudio(watermarkedFile);
  
  return publicUrl;
}
