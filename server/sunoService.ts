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
    status: 'SUCCESS' | 'GENERATING' | 'FAILED';
    response?: {
      data: Array<{
        id: string;
        audio_url: string;
        title: string;
        tags: string;
        duration: number;
        lyric?: string;
        image_url?: string;
      }>;
    };
    errorMessage?: string;
  };
}

async function pollTaskStatus(taskId: string, maxAttempts = 20): Promise<SunoTaskResponse['data']['response']> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 30000));
    
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

    const { status, response: taskResponse, errorMessage } = response.data.data;
    
    if (status === 'SUCCESS' && taskResponse?.data && taskResponse.data.length > 0) {
      return taskResponse;
    }
    
    if (status === 'FAILED') {
      throw new Error(errorMessage || 'Song generation failed');
    }
  }
  
  throw new Error('Song generation timed out after 10 minutes');
}

export async function generateSong(params: GenerateSongParams): Promise<{ audioUrl: string; lyrics: string; title: string; coverImage?: string }> {
  if (!SUNO_API_KEY) {
    throw new Error('SUNO_API_KEY is not configured. Please add it to Replit Secrets.');
  }

  const songTitle = `${params.occasion || 'Special Song'} for ${params.recipientName}`;
  
  const lyricsPrompt = [
    `Write ${params.tone} song lyrics for ${params.recipientName}, my ${params.relationship}.`
  ];

  if (params.occasion) {
    lyricsPrompt.push(`Occasion: ${params.occasion}.`);
  }

  if (params.interests) {
    lyricsPrompt.push(`Their interests: ${params.interests}.`);
  }

  if (params.insideJokes) {
    lyricsPrompt.push(`Inside jokes: ${params.insideJokes}.`);
  }

  lyricsPrompt.push('Make it warm, loving, and family-friendly.');

  const prompt = lyricsPrompt.join(' ');

  try {
    const callbackUrl = process.env.REPL_SLUG 
      ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/suno-callback`
      : 'https://example.com/callback';
      
    const response = await axios.post<SunoGenerateResponse>(
      `${SUNO_API_BASE_URL}/api/v1/generate`,
      {
        prompt,
        style: `${params.tone} ${params.genre || 'pop'}`,
        title: songTitle,
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
    
    if (!result || !result.data || result.data.length === 0) {
      throw new Error('No audio data returned from Suno API');
    }

    const firstTrack = result.data[0];
    
    return {
      audioUrl: firstTrack.audio_url,
      lyrics: firstTrack.lyric || prompt,
      title: firstTrack.title || songTitle,
      coverImage: firstTrack.image_url
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
