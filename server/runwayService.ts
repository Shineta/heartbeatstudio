const RUNWAY_API_BASE = 'https://api.runwayml.com/v1';

interface RunwayJobRequest {
  task: 'text-to-video';
  prompt: string;
  avoid?: string;
  aspect_ratio?: '16:9' | '9:16' | '1:1';
  duration?: number;
}

interface RunwayJobResponse {
  id: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed';
  outputs?: {
    video?: string;
  }[];
  error?: {
    type: string;
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

  const prompt = `Create a beautiful ${options.occasion} celebration animation for ${options.recipientName}. ${styleDesc}, ${toneDesc}. ${options.description || 'Festive elements like confetti, balloons, sparkles, and celebratory decorations.'}`;

  console.log('[Runway] Creating animation with prompt:', prompt);

  const createResponse = await fetch(`${RUNWAY_API_BASE}/jobs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      task: 'text-to-video',
      prompt,
      aspect_ratio: '16:9',
      duration: 4
    } as RunwayJobRequest)
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    console.error('[Runway] Job creation failed:', errorText);
    throw new Error(`Failed to create animation job: ${createResponse.status} ${errorText}`);
  }

  const jobData = await createResponse.json() as RunwayJobResponse;
  console.log('[Runway] Job created:', jobData.id);

  const videoUrl = await pollForCompletion(jobData.id, apiKey);

  console.log('[Runway] Downloading video from:', videoUrl);
  const videoResponse = await fetch(videoUrl);
  if (!videoResponse.ok) {
    throw new Error(`Failed to download video: ${videoResponse.status}`);
  }
  const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

  return { videoUrl, videoBuffer };
}

async function pollForCompletion(jobId: string, apiKey: string): Promise<string> {
  const maxAttempts = 60;
  let delay = 5000;
  const maxDelay = 60000;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    console.log(`[Runway] Polling job ${jobId}, attempt ${attempt + 1}/${maxAttempts}`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    const statusResponse = await fetch(`${RUNWAY_API_BASE}/jobs/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!statusResponse.ok) {
      console.error('[Runway] Status check failed:', statusResponse.status);
      continue;
    }

    const status = await statusResponse.json() as RunwayJobResponse;
    console.log(`[Runway] Job status: ${status.status}`);

    if (status.status === 'succeeded') {
      if (status.outputs && status.outputs[0]?.video) {
        return status.outputs[0].video;
      }
      throw new Error('Job succeeded but no video output found');
    }

    if (status.status === 'failed') {
      throw new Error(`Animation generation failed: ${status.error?.message || 'Unknown error'}`);
    }

    delay = Math.min(delay * 1.5, maxDelay);
  }

  throw new Error('Animation generation timed out after 5 minutes');
}

export function isConfigured(): boolean {
  return !!process.env.RUNWAY_API_KEY;
}
