import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { ObjectStorageService } from './objectStorage';
import { randomUUID } from 'crypto';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);
const readFile = promisify(fs.readFile);

const WATERMARK_INTERVAL_SECONDS = 15;
const WATERMARK_VOLUME = 0.6; // 60% volume for watermark (audible but not overwhelming)

const TEMP_DIR = '/tmp/watermarks';

// Pre-generated watermark audio file path (generated once and cached)
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
 * Generate a simple tone watermark using FFmpeg's built-in synthesizer
 * This creates a distinctive "beep-beep" pattern that signals it's a preview
 */
async function generateToneWatermark(): Promise<string> {
  await ensureTempDir();
  
  if (fs.existsSync(WATERMARK_FILE)) {
    console.log('[Watermark] Using cached tone watermark');
    return WATERMARK_FILE;
  }
  
  console.log('[Watermark] Generating tone watermark...');
  
  return new Promise((resolve, reject) => {
    // Generate a distinctive 3-beep pattern: beep-pause-beep-pause-beep
    // Each beep is 150ms at 880Hz (high A note), with 100ms pauses
    // Total duration ~1 second
    ffmpeg()
      .input('anullsrc=r=44100:cl=stereo')
      .inputFormat('lavfi')
      .complexFilter([
        // Create three short beeps with the Heartbeat rhythm pattern
        'sine=frequency=880:duration=0.15[b1]',
        'sine=frequency=880:duration=0.15[b2]',
        'sine=frequency=660:duration=0.2[b3]',
        // Add silence between beeps
        'aevalsrc=0:d=0.1[s1]',
        'aevalsrc=0:d=0.1[s2]',
        // Concatenate: beep, silence, beep, silence, lower beep
        '[b1][s1][b2][s2][b3]concat=n=5:v=0:a=1[out]'
      ])
      .outputOptions(['-map', '[out]'])
      .audioCodec('libmp3lame')
      .audioBitrate('128k')
      .duration(1) // Safety limit
      .save(WATERMARK_FILE)
      .on('end', () => {
        console.log('[Watermark] Tone watermark generated');
        resolve(WATERMARK_FILE);
      })
      .on('error', (err) => {
        console.error('[Watermark] Tone generation error:', err.message);
        reject(err);
      });
  });
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
  
  const tempFile = path.join(TEMP_DIR, `input_${Date.now()}_${randomUUID().slice(0, 8)}.mp3`);
  
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
  const watermarkFile = await generateToneWatermark();
  
  // Download the source audio
  const inputFile = await downloadAudio(audioUrl);
  const outputFile = path.join(TEMP_DIR, `watermarked_${Date.now()}_${randomUUID().slice(0, 8)}.mp3`);
  
  try {
    // Get durations
    const [inputDuration, watermarkDuration] = await Promise.all([
      getAudioDuration(inputFile),
      getAudioDuration(watermarkFile),
    ]);
    
    console.log(`[Watermark] Input duration: ${inputDuration}s, Watermark duration: ${watermarkDuration}s`);
    
    // Calculate watermark positions: t=0, t=15, t=30, etc.
    // Use ceil to ensure we cover the full duration with watermarks
    const numWatermarks = Math.max(1, Math.ceil(inputDuration / WATERMARK_INTERVAL_SECONDS));
    
    // Create filter for overlaying watermarks at t=0, t=15s, t=30s, etc.
    const delays: number[] = [];
    for (let i = 0; i < numWatermarks; i++) {
      const delaySeconds = i * WATERMARK_INTERVAL_SECONDS;
      // Don't add watermark if it would be past the audio end
      if (delaySeconds < inputDuration) {
        delays.push(delaySeconds * 1000); // Convert to milliseconds
      }
    }
    
    console.log(`[Watermark] Adding ${delays.length} watermarks at positions: ${delays.map(d => d/1000 + 's').join(', ')}`);
    
    return await overlayMultipleWatermarks(inputFile, watermarkFile, outputFile, delays);
  } catch (err) {
    // Clean up on error
    try { await unlink(inputFile); } catch (e) { /* ignore */ }
    throw err;
  }
}

/**
 * Overlay watermarks at multiple positions
 */
function overlayMultipleWatermarks(
  inputFile: string,
  watermarkFile: string,
  outputFile: string,
  delaysMs: number[]
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (delaysMs.length === 1) {
      // Simple case: single watermark at the beginning
      ffmpeg()
        .input(inputFile)
        .input(watermarkFile)
        .complexFilter([
          `[1:a]adelay=${delaysMs[0]}|${delaysMs[0]},volume=${WATERMARK_VOLUME}[wm]`,
          `[0:a][wm]amix=inputs=2:duration=first:dropout_transition=0[out]`
        ])
        .outputOptions(['-map', '[out]'])
        .audioCodec('libmp3lame')
        .audioBitrate('192k')
        .save(outputFile)
        .on('end', async () => {
          console.log('[Watermark] Single watermark applied');
          // Clean up input file
          try { await unlink(inputFile); } catch (e) { /* ignore */ }
          resolve(outputFile);
        })
        .on('error', async (err) => {
          try { await unlink(inputFile); } catch (e) { /* ignore */ }
          reject(err);
        });
      return;
    }
    
    // Multiple watermarks: create delayed copies and mix them
    const filterParts: string[] = [];
    const mixInputLabels: string[] = [];
    
    // Create delayed versions of the watermark for each interval
    delaysMs.forEach((delay, index) => {
      filterParts.push(
        `[1:a]adelay=${delay}|${delay},volume=${WATERMARK_VOLUME}[wm${index}]`
      );
      mixInputLabels.push(`[wm${index}]`);
    });
    
    // Mix all watermarks together (use comma separator for proper FFmpeg syntax)
    filterParts.push(
      `${mixInputLabels.join('')}amix=inputs=${delaysMs.length}:duration=longest:dropout_transition=0[allwm]`
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
      .on('end', async () => {
        console.log(`[Watermark] ${delaysMs.length} watermarks applied successfully`);
        // Clean up input file
        try { await unlink(inputFile); } catch (e) { /* ignore */ }
        resolve(outputFile);
      })
      .on('error', async (err) => {
        console.error('[Watermark] FFmpeg error:', err.message);
        try { await unlink(inputFile); } catch (e) { /* ignore */ }
        reject(err);
      });
  });
}

/**
 * Upload watermarked audio to object storage and return URL
 * Uses the project's ObjectStorageService for proper Replit integration
 */
export async function uploadWatermarkedAudio(localFilePath: string): Promise<string> {
  const objectStorageService = new ObjectStorageService();
  
  // Read the file buffer
  const fileBuffer = await readFile(localFilePath);
  
  // Use the existing uploadBuffer helper which handles proper Replit object storage integration
  const objectPath = await objectStorageService.uploadBuffer(
    fileBuffer,
    'previews/watermarked',
    'audio/mpeg'
  );
  
  // Clean up local file
  try {
    await unlink(localFilePath);
  } catch (e) {
    // Ignore cleanup errors
  }
  
  console.log(`[Watermark] Uploaded watermarked audio: ${objectPath}`);
  return objectPath;
}

/**
 * Main function: Add watermark to audio URL and return new URL
 */
export async function watermarkAudioFromUrl(audioUrl: string): Promise<string> {
  console.log(`[Watermark] Processing audio from URL...`);
  
  const watermarkedFile = await addWatermarkToAudio(audioUrl);
  const publicUrl = await uploadWatermarkedAudio(watermarkedFile);
  
  return publicUrl;
}
