import axios from "axios";
import FormData from "form-data";

const LOUDLY_API_KEY = process.env.LOUDLY_API_KEY;
const LOUDLY_API_BASE_URL = "https://soundtracks.loudly.com";

interface LoudlyAISongResponse {
  id: string;
  title: string;
  duration: number;
  music_file_path: string;
  wave_form_file_path?: string;
  created_at?: string;
  bpm?: number;
  key?: {
    id: number;
    name: string;
  };
  error?: string;
  error_description?: string;
}

export function isLoudlyConfigured(): boolean {
  return !!LOUDLY_API_KEY;
}

/**
 * Build a descriptive prompt for Loudly text-to-music
 */
function buildMusicPrompt(params: {
  genre?: string;
  tone?: string;
  duration?: number;
}): string {
  const genre = params.genre || "pop";
  const tone = params.tone || "happy";
  const durationSecs = params.duration || 60;
  
  const genreLower = genre.toLowerCase();
  const toneLower = tone.toLowerCase();
  
  let style = "";
  
  if (genreLower.includes("gospel") || genreLower.includes("worship")) {
    style = "uplifting gospel track with soulful harmonies and inspirational feel";
  } else if (genreLower.includes("r&b") || genreLower.includes("rnb") || genreLower.includes("soul")) {
    style = "smooth R&B track with warm melodies and romantic groove";
  } else if (genreLower.includes("hip-hop") || genreLower.includes("hip hop") || genreLower.includes("rap")) {
    style = "modern hip-hop beat with crisp drums and bass";
  } else if (genreLower.includes("pop")) {
    style = "catchy pop track with upbeat energy and memorable melody";
  } else if (genreLower.includes("country")) {
    style = "country track with acoustic guitars and heartfelt feel";
  } else if (genreLower.includes("rock")) {
    style = "rock track with driving guitars and powerful energy";
  } else if (genreLower.includes("jazz")) {
    style = "smooth jazz track with sophisticated harmonies";
  } else if (genreLower.includes("electronic") || genreLower.includes("edm")) {
    style = "electronic dance track with pulsing beats and synths";
  } else if (genreLower.includes("classical")) {
    style = "classical-inspired orchestral piece with elegant strings";
  } else {
    style = "pop track with pleasant melody";
  }
  
  let mood = "";
  if (toneLower.includes("romantic") || toneLower.includes("love")) {
    mood = "romantic and tender";
  } else if (toneLower.includes("happy") || toneLower.includes("joyful")) {
    mood = "joyful and celebratory";
  } else if (toneLower.includes("energetic") || toneLower.includes("upbeat")) {
    mood = "energetic and exciting";
  } else if (toneLower.includes("calm") || toneLower.includes("peaceful")) {
    mood = "calm and peaceful";
  } else if (toneLower.includes("inspirational") || toneLower.includes("uplifting")) {
    mood = "inspirational and uplifting";
  } else {
    mood = "positive and warm";
  }
  
  return `A ${durationSecs}-second ${mood} ${style}`;
}

/**
 * Generate AI music using Loudly's text-to-music API
 */
export async function generateSongWithLoudly(params: {
  title: string;
  prompt: string;
  genre?: string;
  tone?: string;
  duration?: number;
  test?: boolean;
}): Promise<{
  audioUrl: string;
  title: string;
  duration: number;
}> {
  if (!LOUDLY_API_KEY) {
    throw new Error("Loudly API key is not configured");
  }

  const musicPrompt = buildMusicPrompt({
    genre: params.genre,
    tone: params.tone,
    duration: params.duration,
  });
  
  const durationSecs = Math.min(Math.max(params.duration || 60, 30), 420);
  
  console.log(`[Loudly] Generating AI music: "${musicPrompt.substring(0, 80)}..."`);
  console.log(`[Loudly] Duration: ${durationSecs}s, Test mode: ${params.test || false}`);

  try {
    const formData = new FormData();
    formData.append('prompt', musicPrompt);
    formData.append('duration', durationSecs.toString());
    if (params.test) {
      formData.append('test', 'true');
    }

    const response = await axios.post<LoudlyAISongResponse>(
      `${LOUDLY_API_BASE_URL}/api/ai/prompt/songs`,
      formData,
      {
        headers: {
          "API-KEY": LOUDLY_API_KEY,
          "Accept": "application/json",
          ...formData.getHeaders(),
        },
        timeout: 120000,
      }
    );

    if (response.data.error) {
      throw new Error(response.data.error_description || response.data.error);
    }

    if (!response.data.music_file_path) {
      throw new Error("No audio URL returned from Loudly");
    }
    
    const durationMs = response.data.duration || (durationSecs * 1000);
    
    console.log(`[Loudly] Song generated: "${response.data.title}" (${Math.round(durationMs / 1000)}s)`);
    console.log(`[Loudly] Audio URL: ${response.data.music_file_path}`);

    return {
      audioUrl: response.data.music_file_path,
      title: params.title || response.data.title,
      duration: Math.round(durationMs / 1000),
    };
  } catch (error: any) {
    const errorMsg = error.response?.data?.error_description || 
                     error.response?.data?.error || 
                     error.message;
    console.error(`[Loudly] Error generating song:`, errorMsg);
    throw new Error(`Loudly generation failed: ${errorMsg}`);
  }
}

/**
 * Check available Loudly credits
 */
export async function checkLoudlyCredits(): Promise<{ used: number; limit: number } | null> {
  if (!LOUDLY_API_KEY) {
    return null;
  }

  try {
    const response = await axios.get(`${LOUDLY_API_BASE_URL}/api/account/limit`, {
      headers: {
        "API-KEY": LOUDLY_API_KEY,
        "Accept": "application/json",
      },
      timeout: 10000,
    });
    return {
      used: response.data.used || 0,
      limit: response.data.limit || 0,
    };
  } catch {
    return null;
  }
}

/**
 * Check if Loudly API is available
 */
export async function checkLoudlyHealth(): Promise<boolean> {
  if (!LOUDLY_API_KEY) {
    return false;
  }

  try {
    const response = await axios.get(`${LOUDLY_API_BASE_URL}/api/ai/genres`, {
      headers: {
        "API-KEY": LOUDLY_API_KEY,
        "Accept": "application/json",
      },
      timeout: 10000,
    });
    return response.status === 200;
  } catch {
    return false;
  }
}
