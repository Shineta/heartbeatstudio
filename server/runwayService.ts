const RUNWAY_API_BASE = 'https://api.dev.runwayml.com/v1';

interface RunwayTaskResponse {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  output?: string[];
  error?: {
    message: string;
  };
}

function getApiKey(): string {
  const apiKey = process.env.RUNWAY_API_KEY;
  if (!apiKey) {
    throw new Error('RUNWAY_API_KEY environment variable is not set');
  }
  return apiKey;
}

export async function generateAnimation(options: {
  recipientName: string;
  occasion: string;
  tone: string;
  style: string;
  description?: string;
}): Promise<{ videoUrl: string; videoBuffer: Buffer }> {
  const apiKey = getApiKey();

  const styleModifiers: Record<string, string> = {
    cartoon: 'colorful cartoon animation style, playful and vibrant',
    anime: 'anime style animation, expressive and dynamic',
    '3d': '3D rendered animation, cinematic lighting',
    watercolor: 'soft watercolor animation style, gentle and artistic',
    pixar: 'Pixar-style 3D animation, warm and emotive',
    realistic: 'photorealistic animation, high quality cinematic'
  };

  const toneModifiers: Record<string, string> = {
    heartfelt: 'warm and emotional atmosphere',
    funny: 'playful and humorous mood',
    inspirational: 'uplifting and motivating energy',
    romantic: 'romantic and intimate ambiance',
    celebratory: 'festive and joyful celebration'
  };

  const styleDesc = styleModifiers[options.style] || 'animated celebration';
  const toneDesc = toneModifiers[options.tone] || 'warm and celebratory';

  const promptText = `Create a beautiful ${options.occasion} celebration animation for ${options.recipientName}. ${styleDesc}, ${toneDesc}. ${options.description || 'Festive elements like confetti, balloons, sparkles, and celebratory decorations.'}`;

  console.log('[Runway] Creating animation with prompt:', promptText);

  const createResponse = await fetch(`${RUNWAY_API_BASE}/text_to_video`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Runway-Version': '2024-11-06'
    },
    body: JSON.stringify({
      model: 'veo3.1_fast',
      promptText,
      ratio: '1280:720',
      duration: 10,
      audio: false
    })
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    console.error('[Runway] Task creation failed:', errorText);
    throw new Error(`Failed to create animation job: ${createResponse.status} ${errorText}`);
  }

  const taskData = await createResponse.json() as RunwayTaskResponse;
  console.log('[Runway] Task created:', taskData.id);

  const videoUrl = await pollForCompletion(taskData.id, apiKey);

  console.log('[Runway] Downloading video from:', videoUrl);
  const videoResponse = await fetch(videoUrl);
  if (!videoResponse.ok) {
    throw new Error(`Failed to download video: ${videoResponse.status}`);
  }
  const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

  return { videoUrl, videoBuffer };
}

async function pollForCompletion(taskId: string, apiKey: string): Promise<string> {
  const maxAttempts = 60;
  let delay = 5000;
  const maxDelay = 60000;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    console.log(`[Runway] Polling task ${taskId}, attempt ${attempt + 1}/${maxAttempts}`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    const statusResponse = await fetch(`${RUNWAY_API_BASE}/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-Runway-Version': '2024-11-06'
      }
    });

    if (!statusResponse.ok) {
      console.error('[Runway] Status check failed:', statusResponse.status);
      continue;
    }

    const status = await statusResponse.json() as RunwayTaskResponse;
    console.log(`[Runway] Task status: ${status.status}`);

    if (status.status === 'SUCCEEDED') {
      if (status.output && status.output[0]) {
        return status.output[0];
      }
      throw new Error('Task succeeded but no video output found');
    }

    if (status.status === 'FAILED') {
      throw new Error(`Animation generation failed: ${status.error?.message || 'Unknown error'}`);
    }

    delay = Math.min(delay * 1.5, maxDelay);
  }

  throw new Error('Animation generation timed out after 5 minutes');
}

export function isConfigured(): boolean {
  return !!process.env.RUNWAY_API_KEY;
}
