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
    status: 'SUCCESS' | 'GENERATING' | 'FAILED' | 'WAITING' | 'IN_QUEUE' | 'CREATED' | 'TEXT_SUCCESS' | 'FIRST_SUCCESS' | 'PENDING';
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
    
    if (status === 'FAILED') {
      console.error(`[Suno] Song generation failed: ${errorMessage}`);
      throw new Error(errorMessage || 'Song generation failed');
    }
  }
  
  const timeoutMessage = `Song generation timed out after 15 minutes. Last status: ${lastStatus}${lastError ? `. Error: ${lastError}` : ''}`;
  console.error(`[Suno] ${timeoutMessage}`);
  throw new Error(timeoutMessage);
}

// Generate song with provided lyrics (no OpenAI lyrics generation)
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
      
    const response = await axios.post<SunoGenerateResponse>(
      `${SUNO_API_BASE_URL}/api/v1/generate`,
      {
        prompt: params.lyrics,
        style: `${params.tone} ${params.genre || 'pop'}`,
        title: params.title,
        customMode: true,
        instrumental: false,
        model: 'V4_5PLUS',
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
    console.log(`Song generation (with custom lyrics) started with taskId: ${taskId}`);
    
    const result = await pollTaskStatus(taskId);
    
    if (!result || !result.sunoData || result.sunoData.length === 0) {
      throw new Error('No audio data returned from Suno API');
    }

    const firstTrack = result.sunoData[0];
    
    return {
      audioUrl: firstTrack.audioUrl,
      lyrics: params.lyrics,
      title: params.title,
      coverImage: firstTrack.imageUrl
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

  // Use the generated lyrics as the prompt for Suno
  const prompt = songLyrics.lyrics;

  try {
    const callbackUrl = process.env.REPL_SLUG 
      ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/suno-callback`
      : 'https://example.com/callback';
      
    const response = await axios.post<SunoGenerateResponse>(
      `${SUNO_API_BASE_URL}/api/v1/generate`,
      {
        prompt,
        style: `${params.tone} ${params.genre || 'pop'}`,
        title: songLyrics.title,
        customMode: true,
        instrumental: false,
        model: 'V4_5PLUS',
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
    console.log(`Song generation started with taskId: ${taskId}`);
    
    const result = await pollTaskStatus(taskId);
    
    if (!result || !result.sunoData || result.sunoData.length === 0) {
      throw new Error('No audio data returned from Suno API');
    }

    const firstTrack = result.sunoData[0];
    
    return {
      audioUrl: firstTrack.audioUrl,
      lyrics: songLyrics.lyrics,
      title: songLyrics.title,
      coverImage: firstTrack.imageUrl
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
