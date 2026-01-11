import axios from "axios";

const LOUDLY_API_KEY = process.env.LOUDLY_API_KEY;
const LOUDLY_API_BASE_URL = "https://api.loudly.com";

interface LoudlyGenerateResponse {
  songs?: Array<{
    id: string;
    url: string;
    duration: number;
    title?: string;
  }>;
  error?: string;
}

interface LoudlyTrackResponse {
  id: string;
  url: string;
  duration: number;
  title?: string;
  status?: string;
}

export function isLoudlyConfigured(): boolean {
  return !!LOUDLY_API_KEY;
}

/**
 * Map genre to Loudly-compatible style/genre parameters
 */
function mapGenreToLoudly(genre: string): { genre: string; mood: string } {
  const genreLower = genre.toLowerCase();
  
  if (genreLower.includes("gospel") || genreLower.includes("worship")) {
    return { genre: "gospel", mood: "uplifting" };
  }
  if (genreLower.includes("r&b") || genreLower.includes("rnb") || genreLower.includes("soul")) {
    return { genre: "r&b", mood: "romantic" };
  }
  if (genreLower.includes("hip-hop") || genreLower.includes("hip hop") || genreLower.includes("rap")) {
    return { genre: "hip-hop", mood: "energetic" };
  }
  if (genreLower.includes("pop")) {
    return { genre: "pop", mood: "happy" };
  }
  if (genreLower.includes("country")) {
    return { genre: "country", mood: "nostalgic" };
  }
  if (genreLower.includes("rock")) {
    return { genre: "rock", mood: "powerful" };
  }
  if (genreLower.includes("jazz")) {
    return { genre: "jazz", mood: "relaxed" };
  }
  if (genreLower.includes("electronic") || genreLower.includes("edm")) {
    return { genre: "electronic", mood: "energetic" };
  }
  if (genreLower.includes("classical")) {
    return { genre: "classical", mood: "peaceful" };
  }
  if (genreLower.includes("reggae")) {
    return { genre: "reggae", mood: "relaxed" };
  }
  
  // Default to pop with happy mood
  return { genre: "pop", mood: "happy" };
}

/**
 * Map tone/occasion to Loudly mood
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
    return "relaxed";
  }
  if (toneLower.includes("inspirational") || toneLower.includes("uplifting") || toneLower.includes("motivational")) {
    return "uplifting";
  }
  if (toneLower.includes("nostalgic") || toneLower.includes("sentimental")) {
    return "nostalgic";
  }
  
  return "happy";
}

/**
 * Generate a song using Loudly API as a backup service
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

  const genreMapping = params.genre ? mapGenreToLoudly(params.genre) : { genre: "pop", mood: "happy" };
  const mood = params.tone ? mapToneToMood(params.tone) : genreMapping.mood;
  
  // Build text prompt for Loudly
  const textPrompt = `${mood} ${genreMapping.genre} song, ${params.prompt}`;
  
  console.log(`[Loudly] Generating song: "${params.title}" with prompt: ${textPrompt.substring(0, 100)}...`);

  try {
    // Try text-to-music endpoint first
    const response = await axios.post<LoudlyGenerateResponse>(
      `${LOUDLY_API_BASE_URL}/v1/songs/generate`,
      {
        prompt: textPrompt,
        duration: params.duration || 60,
        genre: genreMapping.genre,
        mood: mood,
      },
      {
        headers: {
          "Authorization": `Bearer ${LOUDLY_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 120000, // 2 minute timeout
      }
    );

    if (response.data.error) {
      throw new Error(response.data.error);
    }

    if (!response.data.songs || response.data.songs.length === 0) {
      throw new Error("No songs returned from Loudly API");
    }

    const song = response.data.songs[0];
    console.log(`[Loudly] Song generated successfully: ${song.url}`);

    return {
      audioUrl: song.url,
      title: params.title,
      duration: song.duration || params.duration || 60,
    };
  } catch (error: any) {
    // Try alternative endpoint structure if first fails
    if (error.response?.status === 404 || error.response?.status === 400) {
      console.log(`[Loudly] Trying alternative API endpoint...`);
      return await tryAlternativeLoudlyEndpoint(params, textPrompt, genreMapping, mood);
    }
    
    console.error(`[Loudly] Error generating song: ${error.message}`);
    throw new Error(`Loudly generation failed: ${error.message}`);
  }
}

/**
 * Try alternative Loudly API endpoint structure
 */
async function tryAlternativeLoudlyEndpoint(
  params: { title: string; prompt: string; duration?: number },
  textPrompt: string,
  genreMapping: { genre: string; mood: string },
  mood: string
): Promise<{ audioUrl: string; title: string; duration: number }> {
  
  // Try the songs/create endpoint
  const response = await axios.post(
    `${LOUDLY_API_BASE_URL}/api/songs`,
    {
      text: textPrompt,
      genre: genreMapping.genre,
      energy: mood === "energetic" ? "high" : mood === "relaxed" ? "low" : "medium",
      duration: params.duration || 60,
    },
    {
      headers: {
        "Authorization": `Bearer ${LOUDLY_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 120000,
    }
  );

  const data = response.data;
  
  if (data.url) {
    return {
      audioUrl: data.url,
      title: params.title,
      duration: data.duration || params.duration || 60,
    };
  }
  
  // If we get a task/job ID, poll for completion
  if (data.id || data.taskId || data.jobId) {
    const trackId = data.id || data.taskId || data.jobId;
    return await pollLoudlyTrack(trackId, params.title, params.duration || 60);
  }

  throw new Error("Unexpected response from Loudly API");
}

/**
 * Poll Loudly for track completion
 */
async function pollLoudlyTrack(
  trackId: string,
  title: string,
  expectedDuration: number
): Promise<{ audioUrl: string; title: string; duration: number }> {
  const maxAttempts = 60; // 5 minutes max (5s * 60)
  
  for (let i = 0; i < maxAttempts; i++) {
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    try {
      const response = await axios.get<LoudlyTrackResponse>(
        `${LOUDLY_API_BASE_URL}/api/songs/${trackId}`,
        {
          headers: {
            "Authorization": `Bearer ${LOUDLY_API_KEY}`,
          },
          timeout: 30000,
        }
      );

      const track = response.data;
      
      if (track.url && track.status !== "processing") {
        console.log(`[Loudly] Track ready: ${track.url}`);
        return {
          audioUrl: track.url,
          title: title,
          duration: track.duration || expectedDuration,
        };
      }
      
      console.log(`[Loudly Poll ${i + 1}/${maxAttempts}] Status: ${track.status || "processing"}`);
    } catch (error: any) {
      console.warn(`[Loudly] Poll error: ${error.message}`);
    }
  }

  throw new Error("Loudly track generation timed out");
}

/**
 * Check if Loudly API is available
 */
export async function checkLoudlyHealth(): Promise<boolean> {
  if (!LOUDLY_API_KEY) {
    return false;
  }

  try {
    const response = await axios.get(`${LOUDLY_API_BASE_URL}/health`, {
      headers: {
        "Authorization": `Bearer ${LOUDLY_API_KEY}`,
      },
      timeout: 10000,
    });
    return response.status === 200;
  } catch {
    // Even if health check fails, we can still try to use the API
    return true;
  }
}
