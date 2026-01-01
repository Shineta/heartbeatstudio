import axios from 'axios';

const NANO_BANANA_API_KEY = process.env.NANO_BANANA_API_KEY;
const NANO_BANANA_BASE_URL = 'https://api.nanobananaapi.ai/api/v1/nanobanana';

// Use Pro endpoint for higher quality images
const USE_PRO_MODEL = true;

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
    successFlag: number;  // 0=GENERATING, 1=SUCCESS, 2=CREATE_TASK_FAILED, 3=GENERATE_FAILED
    response?: {
      resultImageUrl?: string;
      resultImageUrls?: string[];
    } | null;
    errorCode?: number | null;
    errorMessage?: string | null;
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

  const endpoint = USE_PRO_MODEL ? 'generate-pro' : 'generate';
  console.log(`[NanoBanana] Using ${USE_PRO_MODEL ? 'PRO' : 'standard'} model`);
  console.log(`[NanoBanana] Generating image with prompt: ${prompt.substring(0, 100)}...`);

  // Build request body based on endpoint type
  const requestBody: Record<string, any> = {
    prompt,
    numImages,
    callBackUrl: callbackUrl,
  };

  if (USE_PRO_MODEL) {
    // Pro model uses 'resolution' instead of 'image_size' and 'type'
    requestBody.resolution = '4K'; // Options: 1K, 2K, 4K - using 4K for best quality
    // Pro model also supports image-to-image with reference images
    if (imageUrls && imageUrls.length > 0) {
      requestBody.imageUrls = imageUrls;
    }
  } else {
    // Standard model uses 'type' and 'image_size'
    requestBody.type = imageUrls && imageUrls.length > 0 ? 'IMAGETOIAMGE' : 'TEXTTOIAMGE';
    requestBody.image_size = imageSize;
    if (imageUrls && imageUrls.length > 0) {
      requestBody.imageUrls = imageUrls;
    }
  }

  try {
    const response = await axios.post<NanoBananaGenerateResponse>(
      `${NANO_BANANA_BASE_URL}/${endpoint}`,
      requestBody,
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

// Standard model version (faster, ~30-60 seconds)
export async function generateImageStandard(params: {
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

  console.log(`[NanoBanana] Using STANDARD model (faster)`);
  console.log(`[NanoBanana] Generating image with prompt: ${prompt.substring(0, 100)}...`);

  const requestBody: Record<string, any> = {
    prompt,
    numImages,
    callBackUrl: callbackUrl,
    type: imageUrls && imageUrls.length > 0 ? 'IMAGETOIAMGE' : 'TEXTTOIAMGE',
    image_size: imageSize,
  };

  if (imageUrls && imageUrls.length > 0) {
    requestBody.imageUrls = imageUrls;
  }

  try {
    const response = await axios.post<NanoBananaGenerateResponse>(
      `${NANO_BANANA_BASE_URL}/generate`,
      requestBody,
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
    console.log(`[NanoBanana Standard] Task started with ID: ${taskId}`);

    const result = await pollTaskStatus(taskId);
    return result;
  } catch (error: any) {
    console.error('[NanoBanana Standard] Error generating image:', error.response?.data || error.message);
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

      const { successFlag, response: taskResponse, errorMessage } = data;

      console.log(`[NanoBanana Poll ${attempt}/${maxAttempts}] Status: ${successFlag}`);

      switch (successFlag) {
        case 0:
          // Still generating
          continue;
        case 1:
          // Success - check for images in response
          if (taskResponse?.resultImageUrls && taskResponse.resultImageUrls.length > 0) {
            console.log(`[NanoBanana] Generation completed with ${taskResponse.resultImageUrls.length} images!`);
            return taskResponse.resultImageUrls;
          } else if (taskResponse?.resultImageUrl) {
            console.log(`[NanoBanana] Generation completed with 1 image!`);
            return [taskResponse.resultImageUrl];
          }
          throw new Error('No image URL in response');
        case 2:
          throw new Error(errorMessage || 'Failed to create task');
        case 3:
          throw new Error(errorMessage || 'Image generation failed');
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

const styleDescriptions: Record<string, string> = {
  watercolor: "soft watercolor painting style with flowing colors, gentle washes, and artistic brushstrokes",
  minimalist: "clean minimalist design with simple shapes, lots of white space, and elegant typography",
  vintage: "vintage retro style with aged textures, ornate borders, classic typography, and nostalgic colors",
  modern: "contemporary modern design with bold geometric shapes, vibrant colors, and sleek typography",
  floral: "beautiful floral design with flowers, leaves, botanical elements, and natural colors",
  illustrated: "hand-drawn illustration style with charming sketches, doodles, and artistic details",
  elegant: "sophisticated elegant design with gold accents, refined typography, and luxurious details",
  whimsical: "playful whimsical style with fun characters, bright colors, and imaginative elements",
  "photo-realistic": "photorealistic style with realistic textures, lighting, and 3D depth",
};

export async function generateGreetingCard(params: {
  recipientName: string;
  occasion: string;
  message: string;
  style?: string;
}): Promise<string> {
  const { recipientName, occasion, message, style } = params;

  const styleDescription = style && styleDescriptions[style] 
    ? styleDescriptions[style] 
    : styleDescriptions.watercolor;

  const prompt = `Create a beautiful greeting card design for ${occasion}. 
The card should include the message: "${message}"
For: ${recipientName}
Art Style: ${styleDescription}
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

export async function generateCassetteCaseImage(params: {
  title: string;
  recipientName: string;
  theme?: string;
  coverArtUrl?: string;
}): Promise<string> {
  const { title, recipientName, theme, coverArtUrl } = params;

  // Randomly select cassette style for variety
  const cassetteStyles = [
    'classic cream/white TDK style',
    'vintage gray Maxell style with red and black accents',
    'retro transparent clear cassette showing the tape reels',
    'classic black Sony style with silver accents',
    'vintage brown/tan colored with handwritten label look',
  ];
  const randomStyle = cassetteStyles[Math.floor(Math.random() * cassetteStyles.length)];
  
  // Randomly select background for variety
  const backgrounds = [
    'warm wooden table surface',
    'vintage record store counter',
    'nostalgic bedroom desk with music posters in background',
    'retro boombox next to it',
    'cozy coffee table with warm lighting',
  ];
  const randomBackground = backgrounds[Math.floor(Math.random() * backgrounds.length)];

  // If a custom cover art URL is provided, use image-to-image to stylize it
  if (coverArtUrl) {
    console.log(`[NanoBanana] Stylizing custom cover art as cassette for: ${title}`);
    
    const stylePrompt = `Transform this image into a vintage cassette tape album cover artwork.
A ${randomStyle} compact audio cassette tape on a ${randomBackground}.
The cassette has a paper label with handwritten-style text: "${title}" as the main title and "For ${recipientName}" below it.
The text should look like someone wrote on the cassette label with a marker or pen.
Apply warm vintage film tones, slight film grain, nostalgic 80s/90s aesthetic.
Photorealistic product photography, studio lighting, shallow depth of field.
This is a COMPACT AUDIO CASSETTE TAPE for Walkman/boombox.`;

    const images = await generateImageStandard({
      prompt: stylePrompt,
      numImages: 1,
      imageSize: '1:1',
      imageUrls: [coverArtUrl]
    });

    return images[0];
  }

  // Generate varied cassette tape with text on the label
  const prompt = `A ${randomStyle} vintage audio cassette tape photographed on a ${randomBackground}.
The cassette tape is a rectangular plastic cartridge with two circular tape reels visible through a transparent window.
The cassette has a paper label with handwritten-style text: "${title}" as the main title, and below it "For ${recipientName}".
The text looks like someone wrote on the cassette label with a black marker or pen - authentic handwritten feel.
Classic 1980s cassette design with the characteristic rectangular shape, rounded corners, tape spools with brown magnetic tape.
Photorealistic product photography, warm nostalgic lighting, slight film grain, shallow depth of field.
This must be a COMPACT CASSETTE TAPE - the audio format used with Walkman and boomboxes.
The handwritten text on the label is clearly readable: "${title}" and "For ${recipientName}".`;

  console.log(`[NanoBanana] Generating cassette with text for: ${title} (style: ${randomStyle})`);

  const images = await generateImage({
    prompt,
    numImages: 1,
    imageSize: '1:1'
  });

  return images[0];
}
