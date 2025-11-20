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

interface SunoResponse {
  status: string;
  track_url?: string;
  audio_url?: string;
  cover_image?: string;
  lyrics_used?: string;
  model?: string;
  duration?: number;
  error?: string;
}

export async function generateSong(params: GenerateSongParams): Promise<{ audioUrl: string; lyrics: string; title: string; coverImage?: string }> {
  if (!SUNO_API_KEY) {
    throw new Error('SUNO_API_KEY is not configured. Please add it to Replit Secrets.');
  }

  const songTitle = `${params.occasion || 'Special Song'} for ${params.recipientName}`;
  
  const promptParts = [
    `Create a ${params.tone} ${params.genre || 'pop'} song for ${params.recipientName}, my ${params.relationship}.`
  ];

  if (params.occasion) {
    promptParts.push(`Occasion: ${params.occasion}.`);
  }

  if (params.interests) {
    promptParts.push(`Their interests: ${params.interests}.`);
  }

  if (params.insideJokes) {
    promptParts.push(`Inside jokes: ${params.insideJokes}.`);
  }

  promptParts.push('Make the song feel warm, loving, and positive. Keep the lyrics simple and family-friendly.');

  const prompt = promptParts.join(' ');

  try {
    const response = await axios.post<SunoResponse>(
      `${SUNO_API_BASE_URL}/suno-api/generate-music`,
      {
        prompt,
        style: `${params.tone} ${params.genre || 'pop'}`,
        model: 'v4_5PLUS',
        duration: 45,
        audio_format: 'mp3'
      },
      {
        headers: {
          'Authorization': `Bearer ${SUNO_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000
      }
    );

    if (response.data.status !== 'success') {
      throw new Error(response.data.error || 'Failed to generate song');
    }

    const audioUrl = response.data.track_url || response.data.audio_url;
    if (!audioUrl) {
      throw new Error('No audio URL returned from Suno API');
    }

    return {
      audioUrl,
      lyrics: response.data.lyrics_used || 'Lyrics not available',
      title: songTitle,
      coverImage: response.data.cover_image
    };
  } catch (error: any) {
    console.error('Suno API error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      throw new Error('Invalid Suno API key. Please check your SUNO_API_KEY in Replit Secrets.');
    }
    
    if (error.response?.status === 429) {
      throw new Error('Suno API rate limit exceeded. Please try again later.');
    }

    throw new Error(error.response?.data?.message || error.message || 'Failed to generate song with Suno API');
  }
}
