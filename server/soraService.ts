import axios from "axios";

const OPENAI_API_KEY = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
const OPENAI_API_BASE = "https://api.openai.com/v1";

export interface SoraVideoParams {
  prompt: string;
  duration?: number; // 4-20 seconds, default 8
  size?: "1280x720" | "720x1280" | "1792x1024"; // landscape, portrait, cinematic
  model?: "sora-2" | "sora-2-pro";
}

export interface SoraVideoResult {
  videoUrl: string;
  duration: number;
  status: string;
}

interface SoraCreateResponse {
  id: string;
  object: string;
  status: string;
  progress?: number;
}

interface SoraRetrieveResponse {
  id: string;
  object: string;
  status: string;
  progress?: number;
  url?: string;
  output?: { url: string };
}

// Valid values for Sora 2 API
const VALID_SIZES = ["1280x720", "720x1280", "1792x1024"] as const;
const VALID_MODELS = ["sora-2", "sora-2-pro"] as const;
const MIN_DURATION = 4;
const MAX_DURATION = 20;

/**
 * Validate and normalize duration to valid range
 */
function validateDuration(duration: number): number {
  const d = Math.max(MIN_DURATION, Math.min(MAX_DURATION, duration));
  if (d !== duration) {
    console.log(`[Sora] Duration ${duration}s clamped to ${d}s (valid range: ${MIN_DURATION}-${MAX_DURATION})`);
  }
  return d;
}

/**
 * Generate a video using OpenAI's Sora 2 API
 */
export async function generateVideo(params: SoraVideoParams): Promise<SoraVideoResult> {
  const {
    prompt,
    duration: rawDuration = 8,
    size = "1280x720",
    model = "sora-2",
  } = params;

  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not configured for Sora video generation");
  }

  // Validate inputs
  const duration = validateDuration(rawDuration);
  const validSize = VALID_SIZES.includes(size as any) ? size : "1280x720";
  const validModel = VALID_MODELS.includes(model as any) ? model : "sora-2";

  console.log(`[Sora] Starting video generation with ${validModel}`);
  console.log(`[Sora] Prompt: ${prompt.substring(0, 100)}...`);
  console.log(`[Sora] Duration: ${duration}s, Size: ${validSize}`);

  try {
    // Create video generation job
    const createResponse = await axios.post<SoraCreateResponse>(
      `${OPENAI_API_BASE}/videos`,
      {
        model: validModel,
        prompt,
        size: validSize,
        seconds: duration,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 60000, // 60s timeout for creation request
      }
    );

    const videoId = createResponse.data.id;
    console.log(`[Sora] Video job created with ID: ${videoId}`);

    // Poll for completion with exponential backoff
    let videoResult: SoraRetrieveResponse | null = null;
    let attempts = 0;
    const maxAttempts = 60; // ~15 minutes max with backoff
    let pollInterval = 5000; // Start with 5 seconds

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
      attempts++;
      
      // Exponential backoff up to 30 seconds
      pollInterval = Math.min(pollInterval * 1.2, 30000);
      
      console.log(`[Sora] Polling status (attempt ${attempts}/${maxAttempts})...`);
      
      const retrieveResponse = await axios.get<SoraRetrieveResponse>(
        `${OPENAI_API_BASE}/videos/${videoId}`,
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          timeout: 30000,
        }
      );
      
      videoResult = retrieveResponse.data;
      const status = videoResult.status;
      
      if (videoResult.progress !== undefined) {
        console.log(`[Sora] Progress: ${videoResult.progress}%`);
      }

      // Check for error field in response
      if ((videoResult as any).error) {
        const errorMsg = (videoResult as any).error?.message || "Unknown error";
        console.error(`[Sora] API returned error: ${errorMsg}`);
        throw new Error(`Video generation error: ${errorMsg}`);
      }

      if (status === "failed") {
        throw new Error("Video generation failed");
      }

      if (status === "completed") {
        break;
      }
    }

    if (!videoResult || videoResult.status !== "completed") {
      throw new Error("Video generation timed out after maximum polling attempts");
    }

    // Get the video URL
    const videoUrl = videoResult.url || videoResult.output?.url;
    
    if (!videoUrl) {
      throw new Error("No video URL returned from Sora API");
    }

    console.log(`[Sora] Video generation completed: ${videoUrl}`);

    return {
      videoUrl,
      duration,
      status: "completed",
    };
  } catch (error: any) {
    console.error("[Sora] Error generating video:", error);
    
    // Check for specific error types
    if (error.response?.status === 429) {
      throw new Error("Sora API rate limit exceeded. Please try again later.");
    }
    if (error.response?.status === 403) {
      throw new Error("Sora API access denied. Organization verification may be required.");
    }
    if (error.response?.status === 404) {
      throw new Error("Sora 2 API endpoint not found. The API may not be available yet.");
    }
    if (error.message?.includes("not available")) {
      throw new Error("Sora 2 API is not available with your current OpenAI plan.");
    }
    
    throw new Error(error.response?.data?.error?.message || error.message || "Failed to generate video with Sora API");
  }
}

/**
 * Build a detailed prompt for animation generation
 */
export function buildAnimationPrompt(params: {
  recipientName: string;
  occasion: string;
  tone: string;
  style?: string;
  description?: string;
}): string {
  const { recipientName, occasion, tone, style, description } = params;

  let prompt = `Create a heartfelt, ${tone} celebration animation video for ${recipientName}`;
  
  if (occasion) {
    prompt += ` celebrating ${occasion}`;
  }

  prompt += ". ";

  // Add style guidance
  if (style) {
    prompt += `Visual style: ${style}. `;
  } else {
    // Default style based on tone
    const styleMap: Record<string, string> = {
      sweet: "Warm, soft colors with gentle animations and floating hearts",
      playful: "Bright, vibrant colors with bouncy animations and confetti",
      heartfelt: "Emotional, intimate atmosphere with soft lighting and subtle movements",
      romantic: "Dreamy, rose-tinted visuals with flowing movements and sparkles",
      celebratory: "Festive, energetic with balloons, fireworks, and joyful motion",
      nostalgic: "Vintage film aesthetic with warm sepia tones and gentle transitions",
    };
    const defaultStyle = styleMap[tone] || styleMap.sweet;
    prompt += `Visual style: ${defaultStyle}. `;
  }

  // Add user description if provided
  if (description) {
    prompt += `Additional details: ${description}. `;
  }

  // Add quality and safety guidance
  prompt += "The video should be high quality, family-friendly, and emotionally resonant. ";
  prompt += "Include smooth camera movements and professional transitions.";

  return prompt;
}
