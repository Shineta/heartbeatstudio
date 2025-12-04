import axios from 'axios';

const NANO_BANANA_API_KEY = process.env.NANO_BANANA_API_KEY;
const NANO_BANANA_BASE_URL = 'https://api.nanobananaapi.ai/api/v1/nanobanana';

interface NanoBananaGenerateResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
  };
}

interface NanoBananaTaskResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    status: number;  // 0=GENERATING, 1=SUCCESS, 2=CREATE_TASK_FAILED, 3=GENERATE_FAILED
    imageUrls?: string[];
  };
}

type ImageSize = '1:1' | '9:16' | '16:9' | '3:4' | '4:3' | '3:2' | '2:3' | '5:4' | '4:5' | '21:9';

export async function generateImage(params: {
  prompt: string;
  numImages?: number;
  imageSize?: ImageSize;
  imageUrls?: string[];
}): Promise<string[]> {
  if (!NANO_BANANA_API_KEY) {
    throw new Error('NANO_BANANA_API_KEY is not configured. Please add it to Replit Secrets.');
  }

  const { prompt, numImages = 1, imageSize = '1:1', imageUrls } = params;

  const callbackUrl = process.env.REPL_SLUG 
    ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/nanobanana-callback`
    : 'https://example.com/callback';

  console.log(`[NanoBanana] Generating image with prompt: ${prompt.substring(0, 100)}...`);

  try {
    const response = await axios.post<NanoBananaGenerateResponse>(
      `${NANO_BANANA_BASE_URL}/generate`,
      {
        prompt,
        type: imageUrls && imageUrls.length > 0 ? 'IMAGETOIAMGE' : 'TEXTTOIAMGE',
        numImages,
        image_size: imageSize,
        callBackUrl: callbackUrl,
        imageUrls: imageUrls || undefined,
      },
      {
        headers: {
          'Authorization': `Bearer ${NANO_BANANA_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.code !== 200) {
      throw new Error(response.data.msg || 'Failed to start image generation');
    }

    const taskId = response.data.data.taskId;
    console.log(`[NanoBanana] Task started with ID: ${taskId}`);

    const result = await pollTaskStatus(taskId);
    return result;
  } catch (error: any) {
    console.error('[NanoBanana] Error generating image:', error.response?.data || error.message);
    throw new Error(error.response?.data?.msg || error.message || 'Failed to generate image');
  }
}

async function pollTaskStatus(taskId: string, maxAttempts: number = 60): Promise<string[]> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
      const response = await axios.get<NanoBananaTaskResponse>(
        `${NANO_BANANA_BASE_URL}/record-info?taskId=${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${NANO_BANANA_API_KEY}`
          }
        }
      );

      // Debug: log full response on first few attempts
      if (attempt <= 3) {
        console.log(`[NanoBanana Debug] Full response:`, JSON.stringify(response.data, null, 2));
      }

      const { code, msg, data } = response.data;
      
      if (code !== 200) {
        throw new Error(msg || 'Failed to query task status');
      }

      const { status, imageUrls } = data;

      console.log(`[NanoBanana Poll ${attempt}/${maxAttempts}] Status: ${status}`);

      switch (status) {
        case 0:
          // Still generating
          continue;
        case 1:
          // Success
          if (imageUrls && imageUrls.length > 0) {
            console.log(`[NanoBanana] Generation completed with ${imageUrls.length} images!`);
            return imageUrls;
          }
          throw new Error('No image URL in response');
        case 2:
          throw new Error('Failed to create task');
        case 3:
          throw new Error('Image generation failed');
        default:
          // Unknown status, keep polling
          continue;
      }
    } catch (error: any) {
      if (error.message?.includes('generation failed') || error.message?.includes('No image URL') || error.message?.includes('Failed to create')) {
        throw error;
      }
      console.error(`[NanoBanana] Poll error at attempt ${attempt}:`, error.message);
    }
  }

  throw new Error('Image generation timed out');
}

export async function generateGreetingCard(params: {
  recipientName: string;
  occasion: string;
  message: string;
  style?: string;
}): Promise<string> {
  const { recipientName, occasion, message, style } = params;

  const prompt = `Create a beautiful greeting card design for ${occasion}. 
The card should include the message: "${message}"
For: ${recipientName}
Style: ${style || 'warm, celebratory, elegant design with decorative borders and festive elements'}
The text should be clearly visible and beautifully styled. High quality, professional greeting card design.`;

  const images = await generateImage({
    prompt,
    numImages: 1,
    imageSize: '4:3'
  });

  return images[0];
}

export async function generateAnimation(params: {
  recipientName: string;
  occasion: string;
  style?: string;
  description?: string;
}): Promise<string> {
  const { recipientName, occasion, style, description } = params;

  const prompt = `Create a vibrant, animated-style celebration image for ${occasion}.
${description ? `Scene: ${description}` : `Celebratory scene with confetti, balloons, and festive decorations`}
For: ${recipientName}
Style: ${style || 'colorful animation style, joyful, dynamic, cartoon-like with movement implied'}
High quality, cheerful celebration artwork suitable for an animated greeting.`;

  const images = await generateImage({
    prompt,
    numImages: 1,
    imageSize: '16:9'
  });

  return images[0];
}

export async function editImage(params: {
  imageUrl: string;
  editPrompt: string;
}): Promise<string> {
  const { imageUrl, editPrompt } = params;

  const images = await generateImage({
    prompt: editPrompt,
    numImages: 1,
    imageUrls: [imageUrl]
  });

  return images[0];
}
