import axios from 'axios';

const SUNO_API_KEY = process.env.SUNO_API_KEY;
const SUNO_API_BASE_URL = 'https://api.sunoapi.org';

interface GenerateSongParams {
  recipientName: string;
  relationship: string;
  occasion?: string;
  tone: string;
  genre?: string;
  interests?: string;
  insideJokes?: string;
}

interface SunoGenerateResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
  };
}

interface SunoTaskResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    status: 'SUCCESS' | 'GENERATING' | 'FAILED' | 'WAITING' | 'IN_QUEUE' | 'CREATED' | 'TEXT_SUCCESS' | 'FIRST_SUCCESS' | 'PENDING' | 'GENERATE_AUDIO_FAILED';
    response?: {
      sunoData: Array<{
        id: string;
        audioUrl: string;
        title: string;
        tags: string;
        duration: number;
        prompt?: string;
        imageUrl?: string;
      }>;
    };
    errorMessage?: string;
    errorCode?: number;
  };
}

interface SunoConcatResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
  };
}

async function pollTaskStatus(taskId: string, maxAttempts = 90): Promise<SunoTaskResponse['data']['response']> {
  let lastStatus: string = 'UNKNOWN';
  let lastError: string | undefined;
  
  for (let i = 0; i < maxAttempts; i++) {
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
    
    const response = await axios.get<SunoTaskResponse>(
      `${SUNO_API_BASE_URL}/api/v1/generate/record-info`,
      {
        params: { taskId },
        headers: {
          'Authorization': `Bearer ${SUNO_API_KEY}`,
        }
      }
    );

    if (response.data.code !== 200) {
      throw new Error(response.data.msg || 'Failed to query task status');
    }

    if (i === 0 || i === 8) {
      console.log(`[Suno Debug] Full response at poll ${i + 1}:`, JSON.stringify(response.data, null, 2));
    }

    const { status, response: taskResponse, errorMessage } = response.data.data;
    lastStatus = status;
    lastError = errorMessage;
    
    const dataCount = taskResponse?.sunoData?.length || 0;
    const hasAudioUrl = taskResponse?.sunoData?.[0]?.audioUrl ? 'YES' : 'NO';
    console.log(`[Suno Poll ${i + 1}/${maxAttempts}] Status: ${status}, Data items: ${dataCount}, Audio URL: ${hasAudioUrl} for taskId: ${taskId}`);
    
    if (status === 'SUCCESS' && taskResponse?.sunoData && taskResponse.sunoData.length > 0) {
      const firstTrack = taskResponse.sunoData[0];
      if (firstTrack.audioUrl) {
        console.log(`[Suno] Song generation completed successfully with audio URL!`);
        return taskResponse;
      } else {
        console.log(`[Suno] Status is SUCCESS but audioUrl not ready yet, continuing to poll...`);
      }
    }
    
    if (status === 'FAILED' || status === 'GENERATE_AUDIO_FAILED') {
      console.error(`[Suno] Song generation failed: ${errorMessage}`);
      throw new Error(errorMessage || 'Song generation failed');
    }
  }
  
  const timeoutMessage = `Song generation timed out after 15 minutes. Last status: ${lastStatus}${lastError ? `. Error: ${lastError}` : ''}`;
  console.error(`[Suno] ${timeoutMessage}`);
  throw new Error(timeoutMessage);
}

async function extendSong(params: {
  audioId: string;
  continueAt: number;
  prompt: string;
  style: string;
  title: string;
}): Promise<{ audioId: string; audioUrl: string; duration: number }> {
  console.log(`[Suno Extend] Starting extension from ${params.continueAt}s for audioId: ${params.audioId}`);
  
  const callbackUrl = process.env.REPL_SLUG 
    ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/suno-callback`
    : 'https://example.com/callback';

  const response = await axios.post<SunoGenerateResponse>(
    `${SUNO_API_BASE_URL}/api/v1/generate/extend`,
    {
      audioId: params.audioId,
      model: 'V4',
      continueAt: params.continueAt,
      prompt: params.prompt,
      style: params.style,
      title: params.title,
      defaultParamFlag: true,
      callBackUrl: callbackUrl
    },
    {
      headers: {
        'Authorization': `Bearer ${SUNO_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (response.data.code !== 200) {
    throw new Error(response.data.msg || 'Failed to extend song');
  }

  const taskId = response.data.data.taskId;
  console.log(`[Suno Extend] Extension started with taskId: ${taskId}`);
  
  const result = await pollTaskStatus(taskId);
  
  if (!result || !result.sunoData || result.sunoData.length === 0) {
    throw new Error('No audio data returned from Suno extend API');
  }

  const track = result.sunoData[0];
  console.log(`[Suno Extend] Extension completed: ${track.duration}s`);
  
  return {
    audioId: track.id,
    audioUrl: track.audioUrl,
    duration: track.duration
  };
}

async function concatenateClips(clipIds: string[]): Promise<string> {
  console.log(`[Suno Concat] Concatenating ${clipIds.length} clips:`, clipIds);
  
  const response = await axios.post<SunoConcatResponse>(
    `${SUNO_API_BASE_URL}/api/v1/generate/concat`,
    {
      clipId: clipIds[0],
    },
    {
      headers: {
        'Authorization': `Bearer ${SUNO_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (response.data.code !== 200) {
    throw new Error(response.data.msg || 'Failed to concatenate clips');
  }

  const taskId = response.data.data.taskId;
  console.log(`[Suno Concat] Concatenation started with taskId: ${taskId}`);
  
  const result = await pollTaskStatus(taskId, 60);
  
  if (!result || !result.sunoData || result.sunoData.length === 0) {
    throw new Error('No audio data returned from Suno concat API');
  }

  const finalTrack = result.sunoData[0];
  console.log(`[Suno Concat] Final song duration: ${finalTrack.duration}s`);
  
  return finalTrack.audioUrl;
}

// Map genres to more descriptive style strings for better AI music generation
// Note: Suno has a tag length limit, so keep styles concise
// Genre comes FIRST to ensure it's the dominant style influence
function getDetailedStyle(genre: string, tone: string): string {
  // For gospel genres, we use very specific tags without mixing in generic tones
  // that might confuse the AI (like "heartfelt" which can sound country)
  const genreStyles: Record<string, string> = {
    'gospel': 'gospel choir, church organ, spiritual, uplifting',
    'black-gospel': 'traditional Black gospel, African American gospel choir, shouting, clapping, Hammond B3',
    'christmas': 'Christmas carol, holiday bells, festive choir',
    'pop': `${tone} pop, catchy, modern`,
    'rock': `${tone} rock, electric guitar, drums`,
    'country': `${tone} country, acoustic guitar, Nashville`,
    'r&b': `${tone} R&B, smooth, neo-soul`,
    'rap': `${tone} hip hop, rap, 808 beats`,
    'ballad': `${tone} ballad, piano, emotional, slow`
  };
  
  // For gospel genres, don't mix in the tone as it can override the gospel sound
  if (genre === 'gospel' || genre === 'black-gospel') {
    return genreStyles[genre];
  }
  
  return genreStyles[genre] || `${tone} pop, catchy`;
}

// Generate song with provided lyrics (no OpenAI lyrics generation) - Extended version (~3 minutes)
export async function generateSongWithLyrics(params: {
  title: string;
  lyrics: string;
  tone: string;
  genre?: string;
}): Promise<{ audioUrl: string; lyrics: string; title: string; coverImage?: string }> {
  if (!SUNO_API_KEY) {
    throw new Error('SUNO_API_KEY is not configured. Please add it to Replit Secrets.');
  }

  try {
    const callbackUrl = process.env.REPL_SLUG 
      ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/suno-callback`
      : 'https://example.com/callback';
    
    const style = getDetailedStyle(params.genre || 'pop', params.tone);
    console.log(`[Suno] Using style: ${style}`);
    
    // Step 1: Generate initial clip (uses V4 for longer initial output)
    console.log(`[Suno] Starting extended song generation (~3 minutes) for: ${params.title}`);
    
    const response = await axios.post<SunoGenerateResponse>(
      `${SUNO_API_BASE_URL}/api/v1/generate`,
      {
        prompt: params.lyrics,
        style: style,
        title: params.title,
        customMode: true,
        instrumental: false,
        model: 'V4',
        callBackUrl: callbackUrl
      },
      {
        headers: {
          'Authorization': `Bearer ${SUNO_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.code !== 200) {
      throw new Error(response.data.msg || 'Failed to generate song');
    }

    const taskId = response.data.data.taskId;
    console.log(`[Suno] Initial clip generation started with taskId: ${taskId}`);
    
    const initialResult = await pollTaskStatus(taskId);
    
    if (!initialResult || !initialResult.sunoData || initialResult.sunoData.length === 0) {
      throw new Error('No audio data returned from Suno API');
    }

    const initialTrack = initialResult.sunoData[0];
    const initialDuration = initialTrack.duration || 60;
    console.log(`[Suno] Initial clip completed: ${initialDuration}s, ID: ${initialTrack.id}`);
    
    // Target: ~180 seconds (3 minutes)
    const targetDuration = 180;
    let currentDuration = initialDuration;
    let currentAudioId = initialTrack.id;
    let clipIds = [initialTrack.id];
    let extensionCount = 0;
    const maxExtensions = 3;
    
    // Step 2: Extend until we reach target duration
    while (currentDuration < targetDuration && extensionCount < maxExtensions) {
      extensionCount++;
      const continueAt = Math.max(currentDuration - 10, 30);
      
      console.log(`[Suno] Extension ${extensionCount}: Current duration ${currentDuration}s, continuing from ${continueAt}s`);
      
      try {
        const extension = await extendSong({
          audioId: currentAudioId,
          continueAt: continueAt,
          prompt: `Continue the song with the same style and energy. ${params.lyrics.slice(0, 200)}...`,
          style: style,
          title: `${params.title} Part ${extensionCount + 1}`
        });
        
        currentAudioId = extension.audioId;
        currentDuration += extension.duration - (currentDuration - continueAt);
        clipIds.push(extension.audioId);
        
        console.log(`[Suno] Extension ${extensionCount} completed. New total duration: ~${currentDuration}s`);
      } catch (extendError: any) {
        console.error(`[Suno] Extension ${extensionCount} failed:`, extendError.message);
        break;
      }
    }
    
    // Step 3: Get final audio URL
    let finalAudioUrl = initialTrack.audioUrl;
    
    if (clipIds.length > 1) {
      try {
        console.log(`[Suno] Concatenating ${clipIds.length} clips into final song...`);
        finalAudioUrl = await concatenateClips(clipIds);
      } catch (concatError: any) {
        console.error(`[Suno] Concatenation failed, using last extension:`, concatError.message);
        const lastResult = await pollTaskStatus(taskId);
        if (lastResult?.sunoData?.[0]?.audioUrl) {
          finalAudioUrl = lastResult.sunoData[0].audioUrl;
        }
      }
    }
    
    console.log(`[Suno] Extended song generation completed! Final URL ready.`);
    
    return {
      audioUrl: finalAudioUrl,
      lyrics: params.lyrics,
      title: params.title,
      coverImage: initialTrack.imageUrl
    };
  } catch (error: any) {
    console.error('Suno API error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      throw new Error('Invalid Suno API key. Please check your SUNO_API_KEY in Replit Secrets.');
    }
    
    if (error.response?.status === 429) {
      throw new Error('Insufficient credits or rate limit exceeded.');
    }

    throw new Error(error.response?.data?.msg || error.message || 'Failed to generate song with Suno API');
  }
}

export async function generateSong(params: GenerateSongParams): Promise<{ audioUrl: string; lyrics: string; title: string; coverImage?: string }> {
  if (!SUNO_API_KEY) {
    throw new Error('SUNO_API_KEY is not configured. Please add it to Replit Secrets.');
  }

  const songTitle = `${params.occasion || 'Special Song'} for ${params.recipientName}`;
  
  // First, generate actual lyrics using OpenAI
  const { generateSongLyrics } = await import('./openaiService');
  
  const songLyrics = await generateSongLyrics({
    recipientName: params.recipientName,
    relationship: params.relationship,
    occasion: params.occasion,
    tone: params.tone,
    genre: params.genre || 'pop',
    interests: params.interests,
    insideJokes: params.insideJokes,
  });

  // Use generateSongWithLyrics for extended song generation
  return generateSongWithLyrics({
    title: songLyrics.title,
    lyrics: songLyrics.lyrics,
    tone: params.tone,
    genre: params.genre,
  });
}
