import OpenAI from 'openai';

// Sora 2 requires direct OpenAI API access (not through Replit AI Integrations proxy)
// The user must provide their own OPENAI_API_KEY with Sora access
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured. Sora video generation requires an OpenAI API key with Sora access.');
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

export function isSoraConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

interface VideoGenerationParams {
  prompt: string;
  duration?: number;
  aspectRatio?: '16:9' | '9:16' | '1:1';
}

export async function generateVideo(params: VideoGenerationParams): Promise<Buffer> {
  const { prompt, duration = 6, aspectRatio = '16:9' } = params;

  console.log(`[Sora] Starting video generation with prompt: ${prompt.substring(0, 100)}...`);
  console.log(`[Sora] Duration: ${duration}s, Aspect Ratio: ${aspectRatio}`);

  const sizeMap: Record<string, string> = {
    '16:9': '1280x720',
    '9:16': '720x1280',
    '1:1': '1024x1024',
  };

  try {
    const openai = getOpenAIClient();
    const video = await (openai as any).videos.createAndPoll({
      model: 'sora-2',
      prompt,
      size: sizeMap[aspectRatio] || '1280x720',
      seconds: duration,
    });

    console.log(`[Sora] Video status: ${video.status}`);

    if (video.status === 'failed') {
      const errorMessage = video.error?.message || 'Video generation failed';
      throw new Error(errorMessage);
    }

    if (video.status !== 'completed') {
      throw new Error(`Unexpected video status: ${video.status}`);
    }

    console.log('[Sora] Video generation completed, downloading...');
    
    const content = await (openai as any).videos.downloadContent(video.id);
    const arrayBuffer = await content.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`[Sora] Video downloaded, size: ${buffer.length} bytes`);
    return buffer;
  } catch (error: any) {
    console.error('[Sora] Error generating video:', error.message || error);
    
    if (error.status === 404 || error.message?.includes('not found')) {
      throw new Error('Sora video generation is not available. The API endpoint may not be enabled for this account.');
    }
    
    throw new Error(error.message || 'Failed to generate video');
  }
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
${description ? `Scene: ${description}` : `A festive scene with celebration elements like confetti, hearts, or sparkles`}
This is a personalized animation for ${recipientName}.
Visual Style: ${styleDesc}
The animation should feel personal, warm, and celebratory. Include smooth camera movements and dynamic visual elements.
High quality, emotionally engaging animation suitable for sharing with a loved one.`;

  return generateVideo({
    prompt,
    duration: 6,
    aspectRatio: '16:9',
  });
}
