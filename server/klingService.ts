import jwt from 'jsonwebtoken';

const KLING_API_BASE = 'https://api.klingai.com/v1';

let cachedToken: { token: string; expiry: number } | null = null;

function getAccessKey(): string {
  const key = process.env.KLING_ACCESS_KEY;
  if (!key) {
    throw new Error('KLING_ACCESS_KEY is not configured');
  }
  return key;
}

function getSecretKey(): string {
  const key = process.env.KLING_SECRET_KEY;
  if (!key) {
    throw new Error('KLING_SECRET_KEY is not configured');
  }
  return key;
}

export function isKlingConfigured(): boolean {
  return !!(process.env.KLING_ACCESS_KEY && process.env.KLING_SECRET_KEY);
}

function generateJwtToken(): string {
  const now = Math.floor(Date.now() / 1000);
  
  if (cachedToken && cachedToken.expiry > now + 60) {
    return cachedToken.token;
  }

  const accessKey = getAccessKey();
  const secretKey = getSecretKey();

  const payload = {
    iss: accessKey,
    exp: now + 1800,
    nbf: now - 5,
  };

  const token = jwt.sign(payload, secretKey, {
    algorithm: 'HS256',
    header: { alg: 'HS256', typ: 'JWT' },
  });

  cachedToken = { token, expiry: payload.exp };
  return token;
}

async function makeRequest(endpoint: string, method: 'GET' | 'POST', body?: any): Promise<any> {
  const token = generateJwtToken();
  
  const response = await fetch(`${KLING_API_BASE}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Kling] API error: ${response.status} - ${errorText}`);
    throw new Error(`Kling API error: ${response.status}`);
  }

  return response.json();
}

interface VideoGenerationParams {
  prompt: string;
  negativePrompt?: string;
  duration?: 5 | 10;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  mode?: 'std' | 'pro';
  cfgScale?: number;
}

interface TaskStatus {
  taskId: string;
  status: 'submitted' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  errorMessage?: string;
}

export async function createVideoTask(params: VideoGenerationParams): Promise<string> {
  const {
    prompt,
    negativePrompt = '',
    duration = 5,
    aspectRatio = '16:9',
    mode = 'std',
    cfgScale = 0.5,
  } = params;

  console.log(`[Kling] Creating video task: ${prompt.substring(0, 100)}...`);
  console.log(`[Kling] Duration: ${duration}s, Aspect: ${aspectRatio}, Mode: ${mode}`);

  const response = await makeRequest('/videos/text2video', 'POST', {
    model_name: 'kling-v1-5',
    prompt,
    negative_prompt: negativePrompt,
    cfg_scale: cfgScale,
    duration: String(duration),
    aspect_ratio: aspectRatio,
    mode,
  });

  if (response.code !== 0 && response.code !== 200) {
    throw new Error(response.message || 'Failed to create video task');
  }

  const taskId = response.data?.task_id;
  if (!taskId) {
    throw new Error('No task ID returned from Kling API');
  }

  console.log(`[Kling] Task created: ${taskId}`);
  return taskId;
}

export async function checkTaskStatus(taskId: string): Promise<TaskStatus> {
  const response = await makeRequest(`/videos/text2video/${taskId}`, 'GET');

  if (response.code !== 0 && response.code !== 200) {
    throw new Error(response.message || 'Failed to check task status');
  }

  const taskData = response.data?.task_result;
  const taskStatus = response.data?.task_status;
  
  let videoUrl: string | undefined;
  if (taskData?.videos && taskData.videos.length > 0) {
    videoUrl = taskData.videos[0].url;
  }

  return {
    taskId,
    status: taskStatus === 'succeed' ? 'completed' : taskStatus,
    videoUrl,
    errorMessage: taskStatus === 'failed' ? response.data?.task_status_msg : undefined,
  };
}

export async function waitForVideo(taskId: string, maxWaitMs: number = 300000, pollIntervalMs: number = 5000): Promise<string> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const status = await checkTaskStatus(taskId);
    
    console.log(`[Kling] Task ${taskId} status: ${status.status}`);

    if (status.status === 'completed' && status.videoUrl) {
      console.log(`[Kling] Video ready: ${status.videoUrl}`);
      return status.videoUrl;
    }

    if (status.status === 'failed') {
      throw new Error(status.errorMessage || 'Video generation failed');
    }

    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error('Video generation timed out');
}

export async function downloadVideo(videoUrl: string): Promise<Buffer> {
  console.log(`[Kling] Downloading video from: ${videoUrl}`);
  
  const response = await fetch(videoUrl);
  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  console.log(`[Kling] Video downloaded, size: ${buffer.length} bytes`);
  return buffer;
}

export async function generateAnimationVideo(params: {
  recipientName: string;
  occasion: string;
  tone?: string;
  style?: string;
  description?: string;
}): Promise<Buffer> {
  const { recipientName, occasion, tone, style, description } = params;

  const styleDescriptions: Record<string, string> = {
    cartoon: 'colorful cartoon animation style, expressive characters, smooth movements',
    anime: 'beautiful anime style with dynamic action, vibrant colors, Japanese animation aesthetic',
    '3d': 'high-quality 3D rendered animation, realistic lighting, cinematic depth',
    watercolor: 'dreamy watercolor animation with soft colors, artistic brush strokes, gentle movement',
    pixar: 'Pixar-style 3D animation, charming characters, warm lighting, emotional storytelling',
    realistic: 'photorealistic animation, natural movement, cinematic quality',
  };

  const styleDesc = style && styleDescriptions[style] 
    ? styleDescriptions[style] 
    : 'joyful animated style with smooth movement and vibrant colors';

  const toneDescriptions: Record<string, string> = {
    sweet: 'heartwarming and tender',
    funny: 'playful and humorous',
    romantic: 'loving and intimate',
    heartfelt: 'deeply emotional and sincere',
    playful: 'fun and lighthearted',
  };

  const toneDesc = tone && toneDescriptions[tone] 
    ? toneDescriptions[tone] 
    : 'warm and celebratory';

  const prompt = `Create a ${toneDesc} celebration animation for ${occasion}.
${description ? `Scene: ${description}` : `A festive scene with celebration elements like confetti, hearts, or sparkles.`}
This is a personalized animation for someone named ${recipientName}.
Visual Style: ${styleDesc}
The animation should feel personal, warm, and celebratory. Include smooth camera movements and dynamic visual elements.
High quality, emotionally engaging animation suitable for sharing with a loved one.`;

  const negativePrompt = 'blurry, low quality, distorted, ugly, text, watermark, logo';

  const taskId = await createVideoTask({
    prompt,
    negativePrompt,
    duration: 5,
    aspectRatio: '16:9',
    mode: 'std',
  });

  const videoUrl = await waitForVideo(taskId);
  return downloadVideo(videoUrl);
}
