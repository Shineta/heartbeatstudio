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
    requestBody.resolution = '2K'; // Options: 1K, 2K, 4K
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

// Theme-specific color palettes and visual elements for cassette tapes
const cassetteThemeStyles: Record<string, string> = {
  'romantic': 'pink and red color scheme, hearts, soft lighting, love theme',
  'nostalgic': 'warm sepia tones, retro gradients, vintage aesthetic, faded colors',
  'fun': 'bright neon colors, playful patterns, 80s Memphis style, confetti',
  'chill': 'cool blue and purple gradient, lo-fi aesthetic, relaxed vibes, starry',
  'hype': 'electric yellow and black, bold graphics, high energy, lightning bolts',
  'emotional': 'deep blue and silver, moody lighting, raindrop effects, melancholic',
};

export async function generateCassetteCaseImage(params: {
  title: string;
  recipientName: string;
  theme?: string;
  coverArtUrl?: string;
}): Promise<string> {
  const { title, recipientName, theme, coverArtUrl } = params;

  // Get theme-specific styling or default to romantic
  const themeKey = theme?.toLowerCase() || 'romantic';
  const themeStyle = cassetteThemeStyles[themeKey] || cassetteThemeStyles['romantic'];
  
  const prompt = `Product photography of a vintage audio cassette tape from the 1980s. 
Three-quarter angle view showing the PHYSICAL CASSETTE TAPE with:
- Two visible tape spools/reels with brown magnetic tape wound inside
- Clear plastic window showing the tape reels
- White label on the cassette body with handwritten text: "${title}" and "For ${recipientName}"
- Classic cassette design with screw holes in corners
- ${themeStyle}

The cassette is sitting on a wooden desk surface with soft studio lighting. 
Slight wear and nostalgic aging effects for authenticity.
Sharp focus, realistic textures, vintage 80s mixtape aesthetic.
NOT a CD, NOT vinyl, NOT a cassette case - this is the ACTUAL CASSETTE TAPE itself.`;

  const images = await generateImage({
    prompt,
    numImages: 1,
    imageSize: '1:1'
  });

  return images[0];
}
