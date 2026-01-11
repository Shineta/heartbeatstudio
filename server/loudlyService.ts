import axios from "axios";

const LOUDLY_API_KEY = process.env.LOUDLY_API_KEY;
const LOUDLY_API_BASE_URL = "https://soundtracks.loudly.com";

interface LoudlySong {
  id: string;
  title: string;
  duration: number;
  music_file_path: string;
  genres?: Array<{ id: number; name: string }>;
  moods?: Array<{ id: number; name: string }>;
  has_vocal?: boolean;
  tempo_bpm?: number;
}

interface LoudlyCatalogResponse {
  items: LoudlySong[];
  pagination_data: {
    current_page: number;
    total_items: number;
  };
}

export function isLoudlyConfigured(): boolean {
  return !!LOUDLY_API_KEY;
}

/**
 * Map genre to Loudly-compatible genre filter
 */
function mapGenreToLoudly(genre: string): string {
  const genreLower = genre.toLowerCase();
  
  if (genreLower.includes("gospel") || genreLower.includes("worship")) {
    return "gospel";
  }
  if (genreLower.includes("r&b") || genreLower.includes("rnb") || genreLower.includes("soul")) {
    return "r&b";
  }
  if (genreLower.includes("hip-hop") || genreLower.includes("hip hop") || genreLower.includes("rap")) {
    return "hip-hop";
  }
  if (genreLower.includes("pop")) {
    return "pop";
  }
  if (genreLower.includes("country")) {
    return "country";
  }
  if (genreLower.includes("rock")) {
    return "rock";
  }
  if (genreLower.includes("jazz")) {
    return "jazz";
  }
  if (genreLower.includes("electronic") || genreLower.includes("edm")) {
    return "electronic";
  }
  if (genreLower.includes("classical")) {
    return "classical";
  }
  if (genreLower.includes("reggae")) {
    return "reggae";
  }
  
  return "pop";
}

/**
 * Map tone/occasion to Loudly mood filter
 */
function mapToneToMood(tone: string): string {
  const toneLower = tone.toLowerCase();
  
  if (toneLower.includes("romantic") || toneLower.includes("love")) {
    return "romantic";
  }
  if (toneLower.includes("happy") || toneLower.includes("joyful") || toneLower.includes("celebration")) {
    return "happy";
  }
  if (toneLower.includes("sad") || toneLower.includes("melancholy")) {
    return "sad";
  }
  if (toneLower.includes("energetic") || toneLower.includes("upbeat")) {
    return "energetic";
  }
  if (toneLower.includes("calm") || toneLower.includes("peaceful") || toneLower.includes("relaxing")) {
    return "calm";
  }
  if (toneLower.includes("inspirational") || toneLower.includes("uplifting") || toneLower.includes("motivational")) {
    return "uplifting";
  }
  
  return "happy";
}

/**
 * Get a song from Loudly's catalog matching the requested genre/mood
 */
export async function generateSongWithLoudly(params: {
  title: string;
  prompt: string;
  genre?: string;
  tone?: string;
  duration?: number;
}): Promise<{
  audioUrl: string;
  title: string;
  duration: number;
}> {
  if (!LOUDLY_API_KEY) {
    throw new Error("Loudly API key is not configured");
  }

  const genre = params.genre ? mapGenreToLoudly(params.genre) : "pop";
  const mood = params.tone ? mapToneToMood(params.tone) : "happy";
  
  console.log(`[Loudly] Searching catalog for: genre="${genre}", mood="${mood}"`);

  try {
    const response = await axios.get<LoudlyCatalogResponse>(
      `${LOUDLY_API_BASE_URL}/api/songs`,
      {
        headers: {
          "API-KEY": LOUDLY_API_KEY,
          "Accept": "application/json",
        },
        params: {
          genre: genre,
          mood: mood,
          limit: 10,
          page: 1,
        },
        timeout: 30000,
      }
    );

    if (!response.data.items || response.data.items.length === 0) {
      console.log(`[Loudly] No songs found with genre="${genre}", mood="${mood}". Trying genre only...`);
      
      const genreOnlyResponse = await axios.get<LoudlyCatalogResponse>(
        `${LOUDLY_API_BASE_URL}/api/songs`,
        {
          headers: {
            "API-KEY": LOUDLY_API_KEY,
            "Accept": "application/json",
          },
          params: {
            genre: genre,
            limit: 10,
            page: 1,
          },
          timeout: 30000,
        }
      );
      
      if (!genreOnlyResponse.data.items || genreOnlyResponse.data.items.length === 0) {
        throw new Error("No matching songs found in Loudly catalog");
      }
      
      response.data = genreOnlyResponse.data;
    }

    const songs = response.data.items;
    const randomIndex = Math.floor(Math.random() * songs.length);
    const song = songs[randomIndex];
    
    console.log(`[Loudly] Found song: "${song.title}" (${song.duration}ms, ${song.has_vocal ? 'with vocals' : 'instrumental'})`);

    return {
      audioUrl: song.music_file_path,
      title: params.title || song.title,
      duration: Math.round(song.duration / 1000),
    };
  } catch (error: any) {
    console.error(`[Loudly] Error fetching from catalog:`, error.response?.data || error.message);
    throw new Error(`Loudly catalog error: ${error.response?.data?.message || error.message}`);
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
    const response = await axios.get(`${LOUDLY_API_BASE_URL}/api/songs`, {
      headers: {
        "API-KEY": LOUDLY_API_KEY,
        "Accept": "application/json",
      },
      params: {
        limit: 1,
      },
      timeout: 10000,
    });
    return response.status === 200 && response.data.items?.length > 0;
  } catch {
    return false;
  }
}
