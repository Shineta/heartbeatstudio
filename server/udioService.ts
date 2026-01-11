import axios from "axios";

const UDIO_API_KEY = process.env.UDIO_API_KEY;
const UDIO_API_BASE_URL = "https://udioapi.pro/api/v2";

interface UdioGenerateResponse {
  code: number;
  message?: string;
  msg?: string;
  data?: {
    workId?: string;
    task_id?: string;
  };
  workId?: string;
}

interface UdioQueryResponse {
  code: number;
  message?: string;
  msg?: string;
  data?: {
    status: string;
    songs?: Array<{
      song_path?: string;
      audio_url?: string;
      title?: string;
      duration?: number;
      image_path?: string;
    }>;
    output?: {
      songs?: Array<{
        song_path?: string;
        audio_url?: string;
        title?: string;
        duration?: number;
      }>;
    };
  };
}

export function isUdioConfigured(): boolean {
  return !!UDIO_API_KEY;
}

function mapGenreToUdioStyle(genre?: string, tone?: string): string {
  const genreMap: Record<string, string> = {
    "pop": "pop, catchy, modern",
    "rock": "rock, electric guitar, drums",
    "r&b": "R&B, smooth, neo-soul",
    "hip-hop": "hip hop, rap, 808 beats",
    "rap": "hip hop, rap, 808 beats",
    "country": "country, acoustic guitar, Nashville",
    "gospel": "gospel, choir, spiritual, uplifting",
    "black-gospel": "black gospel, church choir, Hammond organ, praise",
    "jazz": "jazz, smooth, saxophone",
    "electronic": "electronic, synth, EDM",
    "ballad": "ballad, piano, emotional, slow",
    "christmas": "Christmas, holiday, festive, bells",
  };

  const baseStyle = genreMap[genre?.toLowerCase() || "pop"] || "pop, catchy";
  return tone ? `${tone} ${baseStyle}` : baseStyle;
}

async function pollUdioStatus(
  workId: string,
  maxAttempts = 90
): Promise<{ audioUrl: string; title?: string; duration?: number }> {
  console.log(`[Udio] Starting to poll for workId: ${workId}`);

  for (let i = 0; i < maxAttempts; i++) {
    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, 10000)); // 10 second intervals
    }

    try {
      const response = await axios.get<UdioQueryResponse>(
        `${UDIO_API_BASE_URL}/feed`,
        {
          params: { workId },
          headers: {
            Authorization: `Bearer ${UDIO_API_KEY}`,
          },
          timeout: 30000,
        }
      );

      const { data } = response;
      
      if (data.code !== 200) {
        console.warn(`[Udio Poll ${i + 1}] API error: ${data.message || data.msg}`);
        continue;
      }

      const status = data.data?.status?.toLowerCase();
      console.log(`[Udio Poll ${i + 1}/${maxAttempts}] Status: ${status}`);

      if (status === "complete" || status === "success" || status === "completed") {
        const songs = data.data?.songs || data.data?.output?.songs || [];
        if (songs.length > 0) {
          const song = songs[0];
          const audioUrl = song.song_path || song.audio_url;
          if (audioUrl) {
            console.log(`[Udio] Song generation completed!`);
            return {
              audioUrl,
              title: song.title,
              duration: song.duration,
            };
          }
        }
        console.warn(`[Udio] Status complete but no audio URL found, continuing...`);
      }

      if (status === "failed" || status === "error") {
        throw new Error(`Udio generation failed: ${data.message || data.msg || "Unknown error"}`);
      }

    } catch (error: any) {
      if (error.code === "ECONNRESET" || error.code === "ETIMEDOUT") {
        console.warn(`[Udio Poll ${i + 1}] Connection error, retrying...`);
        continue;
      }
      throw error;
    }
  }

  throw new Error("Udio generation timed out after 15 minutes");
}

export async function generateSongWithUdio(params: {
  title: string;
  prompt: string;
  lyrics?: string;
  genre?: string;
  tone?: string;
  duration?: number;
}): Promise<{
  audioUrl: string;
  title: string;
  duration?: number;
  generatedBy: string;
}> {
  if (!UDIO_API_KEY) {
    throw new Error("UDIO_API_KEY is not configured");
  }

  console.log(`[Udio] Starting song generation for: ${params.title}`);

  const style = mapGenreToUdioStyle(params.genre, params.tone);

  try {
    const requestBody: Record<string, any> = {
      prompt: params.lyrics || params.prompt,
      title: params.title,
      tags: style,
      make_instrumental: false,
    };

    console.log(`[Udio] Generating with style: ${style}`);

    const response = await axios.post<UdioGenerateResponse>(
      `${UDIO_API_BASE_URL}/generate`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${UDIO_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 60000,
      }
    );

    if (response.data.code !== 200) {
      throw new Error(response.data.message || response.data.msg || "Failed to start Udio generation");
    }

    const workId = response.data.data?.workId || response.data.data?.task_id || response.data.workId;
    if (!workId) {
      throw new Error("No work ID returned from Udio API");
    }

    console.log(`[Udio] Generation started with workId: ${workId}`);

    const result = await pollUdioStatus(workId);

    console.log(`[Udio] Song generated successfully!`);
    console.log(`[Song Service] Song created with: BACKUP SERVICE`);

    return {
      audioUrl: result.audioUrl,
      title: params.title,
      duration: result.duration,
      generatedBy: "Udio",
    };

  } catch (error: any) {
    console.error("[Udio] Generation error:", error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      throw new Error("Invalid Udio API key");
    }
    
    if (error.response?.status === 429) {
      throw new Error("Udio rate limit exceeded");
    }

    throw new Error(error.message || "Udio generation failed");
  }
}
