import axios from 'axios';

const NANO_BANANA_API_KEY = process.env.NANO_BANANA_API_KEY;
const NANO_BANANA_BASE_URL = 'https://api.nanobananaapi.ai/api/v1/nanobanana';

// Use Pro endpoint for higher quality images
const USE_PRO_MODEL = true; // Using Pro model for better face preservation

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
    // Using 4K for maximum detail in both faces and backgrounds
    requestBody.resolution = '4K'; // Options: 1K, 2K, 4K
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

async function pollTaskStatus(taskId: string, maxAttempts: number = 120): Promise<string[]> {
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

// Generate multiple images concurrently (since Pro model only returns 1 image per request)
export async function generateMultipleImages(params: {
  prompt: string;
  numImages: number;
  imageUrls?: string[];
}): Promise<string[]> {
  const { prompt, numImages, imageUrls } = params;
  
  console.log(`[NanoBanana] Generating ${numImages} images concurrently...`);
  
  // Create array of promises for concurrent generation
  const promises = Array.from({ length: numImages }, (_, i) => 
    generateImage({
      prompt,
      numImages: 1,
      imageUrls,
    }).then(urls => {
      console.log(`[NanoBanana] Concurrent image ${i + 1}/${numImages} completed`);
      return urls[0];
    }).catch(err => {
      console.error(`[NanoBanana] Concurrent image ${i + 1}/${numImages} failed:`, err.message);
      return null; // Return null for failed generations
    })
  );
  
  // Wait for all to complete
  const results = await Promise.all(promises);
  
  // Filter out any null results from failed generations
  const successfulImages = results.filter((url): url is string => url !== null);
  
  console.log(`[NanoBanana] Concurrent generation complete: ${successfulImages.length}/${numImages} successful`);
  
  if (successfulImages.length === 0) {
    throw new Error('All image generations failed');
  }
  
  return successfulImages;
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

/**
 * Transform a single person's photo into a festive scene
 */
export async function generateFestiveTransform(params: {
  imageUrl: string;
  scene: string;
  style: string;
  instructions?: string;
  changeOutfit?: boolean;
  removeGlasses?: boolean;
  removeBraces?: boolean;
  includeCharacters?: boolean;
}): Promise<string> {
  const { imageUrl, scene, style, instructions, changeOutfit = true, removeGlasses = false, removeBraces = false, includeCharacters = false } = params;
  
  // Scene-specific descriptions - expanded to match all frontend options
  const sceneDescriptions: Record<string, string> = {
    // Major Holidays
    'christmas': 'a warm Christmas scene with decorated tree, twinkling lights, wrapped presents, cozy fireplace, snow visible through window, holiday ornaments',
    'hanukkah': 'a beautiful Hanukkah celebration with lit menorah, dreidels, gelt coins, blue and white decorations, warm candlelight glow',
    'kwanzaa': 'a vibrant Kwanzaa celebration with kinara candles, African-inspired patterns, red black and green decorations, unity cup, cultural elements',
    'new-years': 'a glamorous New Year\'s Eve celebration with confetti, sparklers, balloons, midnight countdown clock showing 11:59, festive streamers, party hats',
    'thanksgiving': 'a warm Thanksgiving scene with autumn harvest decorations, pumpkins, fall leaves, cornucopia, cozy dining atmosphere',
    'easter': 'a cheerful Easter scene with colorful eggs, spring flowers, Easter baskets, pastel decorations, soft spring lighting',
    'passover': 'an elegant Passover seder scene with ceremonial plate, matzah, candlelight, Star of David decorations, family gathering atmosphere',
    'halloween': 'a fun Halloween scene with jack-o-lanterns, fall decorations, candy, friendly spooky atmosphere, autumn colors',
    'valentines': 'a romantic Valentine\'s Day scene with red roses, hearts, soft pink lighting, love-themed decorations',
    'fourth-of-july': 'a patriotic Fourth of July scene with American flags, red white and blue decorations, fireworks in background, summer celebration',
    'st-patricks': 'a festive St. Patrick\'s Day scene with shamrocks, green decorations, pot of gold, rainbow, Irish-themed elements',
    'cinco-de-mayo': 'a vibrant Cinco de Mayo celebration with colorful papel picado, mariachi elements, Mexican flags, festive atmosphere',
    'diwali': 'a beautiful Diwali celebration with diyas (oil lamps), rangoli patterns, colorful lanterns, sparkling lights, festive Indian decorations',
    'eid': 'an elegant Eid celebration with crescent moon, lanterns, beautiful mosque architecture in background, festive decorations',
    'lunar-new-year': 'a festive Lunar New Year scene with red lanterns, gold decorations, cherry blossoms, dragon elements, lucky symbols',
    // Life Events
    'birthday': 'a joyful birthday party scene with colorful balloons, birthday cake with candles, streamers, presents, celebration atmosphere',
    'graduation': 'a proud graduation celebration scene with cap and gown elements, diploma, balloons, achievement decorations, celebratory atmosphere',
    'wedding': 'an elegant wedding celebration with white flowers, romantic decorations, soft lighting, wedding cake, love and joy atmosphere',
    'baby-shower': 'a sweet baby shower scene with pastel colors, baby-themed decorations, balloons, gifts, soft and joyful atmosphere',
    'anniversary': 'a romantic anniversary celebration with elegant decorations, roses, candlelight, love and celebration, heart decorations',
    'retirement': 'a celebratory retirement scene with congratulatory decorations, balloons, achievement recognition, joyful atmosphere, gold and silver accents',
    // Special Days
    'mothers-day': 'a beautiful Mother\'s Day scene with elegant flowers, spring garden, soft warm lighting, loving atmosphere',
    'fathers-day': 'a warm Father\'s Day scene with classic decorations, ties, tools, masculine touches, family celebration atmosphere',
    // Classic Scenes
    'winter-wonderland': 'a magical winter wonderland with sparkling snow, frosted trees, soft winter light, cozy atmosphere',
    'spring-garden': 'a beautiful spring garden with blooming flowers, butterflies, soft sunlight, fresh green leaves',
    'summer-beach': 'a sunny summer beach scene with ocean waves, palm trees, seashells, warm golden light',
    'autumn-harvest': 'a cozy autumn harvest scene with pumpkins, hay bales, fall foliage, warm amber lighting, rustic farm atmosphere',
    // Professional headshots and portraits
    'corporate-headshot': 'a professional corporate photography studio with clean neutral gray backdrop, perfect studio lighting, executive portrait setting, high-end business photo aesthetic',
    'linkedin-profile': 'a professional headshot studio with soft natural lighting, clean modern office or neutral backdrop, approachable business portrait setting',
    'business-casual': 'a modern professional setting with contemporary office background, glass windows, natural light, relaxed professional atmosphere',
    'executive-portrait': 'an elegant executive portrait studio with dark sophisticated backdrop, dramatic professional lighting, luxury business aesthetic, corner office feel',
    'realtor-photo': 'a professional real estate agent photo setting with beautiful home exterior or elegant interior backdrop, warm welcoming atmosphere, trustworthy professional look',
    'author-photo': 'an artistic author portrait setting with bookshelf backdrop, warm library lighting, intellectual atmosphere, creative professional aesthetic',
    'speaker-portrait': 'a professional speaker and presenter photo setting with stage or conference backdrop, dynamic lighting, confident leadership presence',
    'medical-professional': 'a clean professional medical setting with clinic or hospital backdrop, white coat atmosphere, trustworthy healthcare professional environment',
    'legal-professional': 'an elegant legal professional setting with law library or office backdrop, prestigious wood paneling, sophisticated attorney portrait atmosphere',
    'creative-professional': 'an artistic creative professional studio with colorful modern design backdrop, creative workspace elements, innovative and dynamic atmosphere',
    'tech-startup': 'a modern tech startup environment with contemporary open office backdrop, casual innovation culture, Silicon Valley aesthetic, dynamic and fresh',
    'academic-portrait': 'a distinguished academic setting with university library or campus backdrop, scholarly atmosphere, intellectual and professional environment',
    // Nostalgic
    'blast-from-past': 'a nostalgic retro scene from the 1970s-1980s era, vintage living room with wood paneling, shag carpet, old TV set, rotary phone, classic decor, warm nostalgic sepia-toned atmosphere, old family photo vibe',
  };
  
  // Style-specific instructions
  const styleInstructions: Record<string, string> = {
    'festive-photo': 'photorealistic, professional photography, natural lighting, high quality portrait',
    'cartoon': 'stylized cartoon illustration style, vibrant colors, playful artistic interpretation',
    'watercolor': 'beautiful watercolor painting style, soft edges, artistic color washes, delicate brushwork',
    'oil-painting': 'classical oil painting style, rich textures, dramatic lighting, fine art aesthetic',
    'digital-art': 'modern digital art style, crisp lines, vibrant colors, contemporary illustration',
    'vintage': 'vintage photography style, warm sepia tones, soft vignette, nostalgic film grain aesthetic',
    // Blast from the Past era-specific styles
    'retro-70s': '1970s groovy photography style, warm orange and brown tones, soft focus, film grain, disco era aesthetic, earth tones, wood paneling vibes',
    'retro-80s': '1980s neon photography style, vibrant pink and blue tones, VHS aesthetic, synth wave colors, bright contrasts, Miami Vice vibes',
    'retro-90s': '1990s throwback style, slightly desaturated colors, disposable camera look, grunge aesthetic, casual snapshot feel',
    // TV Show Sets
    'tv-sitcom-living-room': 'classic 80s-90s TV sitcom living room set, warm studio lighting, cozy couch, family photos on wall, sitcom aesthetic, TV show production quality',
    'tv-fresh-prince': 'Fresh Prince of Bel-Air style mansion living room, luxurious colorful 90s decor, grand staircase, bright vibrant colors, hip 90s aesthetic',
    'tv-family-matters': 'Family Matters style cozy Chicago home living room, warm family atmosphere, 90s suburban decor, welcoming home feeling',
    'tv-cosby-show': 'Cosby Show style elegant brownstone living room, refined 80s decor, warm earth tones, sophisticated family home aesthetic',
    'tv-good-times': 'Good Times style Chicago apartment, 70s urban decor, warm community feeling, classic 70s furniture and colors',
    'tv-martin': 'Martin style 90s Detroit apartment, funky 90s decor, urban bachelor pad vibes, colorful and fun atmosphere',
    'tv-old-western': 'classic Old West frontier town scene, wooden saloon, dusty main street, horses tied to hitching posts, desert landscape, 1800s Wild West aesthetic, sepia-toned vintage western photography',
    // Music & Hip Hop
    'hip-hop-crew': 'classic hip hop crew photo style, urban backdrop, graffiti wall, boombox, gold chains, Adidas tracksuits, confident poses, 80s-90s hip hop aesthetic',
    'album-cover-90s': '90s R&B/Hip Hop album cover style, dramatic studio lighting, cool confident poses, sleek urban aesthetic, record label quality',
    'rap-group-pose': 'iconic rap group photo pose, arms crossed, matching outfits, urban cityscape background, confident expressions, legendary hip hop photo vibes',
    'soul-train': 'Soul Train stage and dance floor, disco lights, 70s-80s dance show aesthetic, funky colorful backdrop, groove and style',
    'music-video-set': '90s music video set aesthetic, dramatic lighting, smoke effects, stylish urban backdrop, MTV era production quality',
    // Photo styles
    'polaroid': 'classic Polaroid instant photo style, white border frame, slightly washed out colors, soft vintage tones, iconic square format',
    'sepia-classic': 'deep sepia tone photography, antique photo aesthetic, rich brown tones, classic portrait feel, timeless elegance',
    'faded-film': 'faded film photography style, washed out colors, light leaks, expired film aesthetic, nostalgic and dreamy',
    'vintage-portrait': 'classic vintage portrait photography, soft focus, muted colors, old family photo album feel, gentle vignette',
    'school-photo-day': 'classic school photo day backdrop, blue or gray gradient background, studio portrait lighting, yearbook photo aesthetic, posed smile',
    'mall-photo-booth': '80s-90s mall photo booth style, fun colorful backdrop, silly props available, nostalgic mall memories, Glamour Shots aesthetic',
    'awkward-portrait': 'classic 1980s-90s department store portrait studio style, cheesy laser beam or gradient backdrop in blue purple and pink, soft diffused lighting, slightly awkward stiff poses, JCPenney Sears portrait aesthetic, vintage mall photography studio feel',
  };
  
  // For "Blast from the Past" scene, the style IS the scene (TV shows, music themes, etc.)
  // These styles define both the background AND the visual style
  const blastFromPastSceneOverrides: Record<string, string> = {
    // TV Show Sets - these become the actual scene/background
    'tv-sitcom-living-room': 'a classic 1980s-90s TV sitcom living room set with studio lighting, plush couch, coffee table, family photos on wall, warm sitcom atmosphere',
    'tv-fresh-prince': 'the Fresh Prince of Bel-Air mansion living room with grand staircase, luxurious colorful 90s decor, pool table, bright vibrant colors, wealthy Bel-Air aesthetic',
    'tv-family-matters': 'the Family Matters Winslow family living room in Chicago, cozy 90s suburban home with plaid couch, warm wood tones, family photos, welcoming atmosphere',
    'tv-cosby-show': 'the Cosby Show brownstone living room with elegant 80s decor, earth tones, artwork on walls, sophisticated Brooklyn family home aesthetic',
    'tv-good-times': 'the Good Times apartment in the Chicago projects, 1970s urban apartment with modest furnishings, African art on walls, warm community feeling, vintage 70s decor',
    'tv-martin': 'Martin Lawrence show 90s Detroit apartment with funky colorful decor, bachelor pad vibes, bright walls, urban 90s style, fun energetic atmosphere',
    'tv-old-western': 'a dusty Old West frontier town main street with wooden saloon building, swinging doors, hitching posts with horses, water trough, sheriff office, desert mountains in background, 1800s Wild West atmosphere',
    // Era styles
    'retro-70s': 'a groovy 1970s living room with orange shag carpet, wood paneling, lava lamps, beaded curtains, earth tones, disco era aesthetic',
    'retro-80s': 'a vibrant 1980s room with neon colors, geometric patterns, MTV posters, VHS tapes, synth wave aesthetic, Miami Vice vibes',
    'retro-90s': 'a 1990s room with grunge posters, bean bag chairs, CD player, desaturated colors, casual 90s aesthetic',
    // Music & Hip Hop
    'hip-hop-crew': 'an urban street scene with graffiti-covered brick wall, boombox on ground, city skyline in background, classic 80s-90s hip hop photo shoot location',
    'album-cover-90s': 'a professional 90s R&B/Hip Hop album cover photo studio with dramatic lighting, smoke effects, sleek urban backdrop',
    'rap-group-pose': 'an iconic urban cityscape with skyscrapers, rooftop setting, golden hour lighting, legendary hip hop photo location',
    'soul-train': 'the Soul Train dance floor and stage with disco ball, colorful lights, 70s-80s dance show set, funky backdrop with Soul Train logo style',
    'music-video-set': 'a 90s music video set with dramatic lighting, smoke machines, stylish urban warehouse backdrop, MTV era production aesthetic',
    // Photo styles
    'polaroid': 'a nostalgic scene captured in classic Polaroid instant photo style with white border',
    'sepia-classic': 'a timeless antique setting with warm sepia tones',
    'faded-film': 'a dreamy vintage scene with faded colors and light leaks',
    'vintage-portrait': 'a classic family portrait studio from the 1970s-80s with soft backdrop',
    'school-photo-day': 'a classic school photo day studio with blue or gray gradient backdrop, professional portrait lighting',
    'mall-photo-booth': 'a fun 80s-90s mall photo booth or Glamour Shots studio with colorful props and backdrops',
    'awkward-portrait': 'a classic 1980s-90s department store portrait studio with cheesy laser beam or gradient backdrop in blue purple and pink colors, soft diffused studio lighting, fake nature props or abstract geometric shapes, JCPenney Sears portrait studio aesthetic',
  };
  
  // Determine the actual scene description
  let sceneDesc: string;
  if (scene === 'blast-from-past' && blastFromPastSceneOverrides[style]) {
    // For blast-from-past, the style defines the scene
    sceneDesc = blastFromPastSceneOverrides[style];
  } else {
    sceneDesc = sceneDescriptions[scene] || sceneDescriptions['christmas'];
  }
  
  const styleInstr = styleInstructions[style] || styleInstructions['festive-photo'];
  
  // Scene-appropriate outfits when changeOutfit is enabled
  const sceneOutfits: Record<string, string> = {
    'christmas': 'wearing a cozy Christmas sweater or festive red and green holiday attire',
    'hanukkah': 'wearing elegant blue and white festive clothing',
    'kwanzaa': 'wearing beautiful African-inspired clothing in red, black, and green colors',
    'new-years': 'wearing glamorous formal attire, sparkly evening wear',
    'thanksgiving': 'wearing comfortable autumn-colored clothing, cozy sweater',
    'easter': 'wearing pastel-colored spring attire, light and cheerful clothing',
    'passover': 'wearing elegant formal attire suitable for a traditional celebration',
    'halloween': 'wearing a fun Halloween costume or festive orange and black attire',
    'valentines': 'wearing romantic red or pink elegant clothing',
    'fourth-of-july': 'wearing patriotic red, white, and blue summer attire',
    'st-patricks': 'wearing festive green clothing with Irish-inspired style',
    'cinco-de-mayo': 'wearing colorful traditional Mexican-inspired festive clothing',
    'diwali': 'wearing beautiful traditional Indian festive clothing, sari or kurta',
    'eid': 'wearing elegant traditional festive attire',
    'lunar-new-year': 'wearing beautiful red and gold traditional Chinese festive clothing',
    'birthday': 'wearing party attire with a birthday hat or festive accessories',
    'graduation': 'wearing a graduation cap and gown with diploma',
    'wedding': 'wearing elegant formal wedding attire, suit or beautiful dress',
    'baby-shower': 'wearing soft, elegant pastel-colored party attire',
    'anniversary': 'wearing romantic elegant formal attire',
    'retirement': 'wearing celebratory formal attire',
    'mothers-day': 'wearing elegant spring attire with floral touches',
    'fathers-day': 'wearing smart casual or classic formal attire',
    'winter-wonderland': 'wearing cozy winter clothing, warm sweater and scarf',
    'spring-garden': 'wearing light floral spring dress or casual spring attire',
    'summer-beach': 'wearing casual summer beach attire, tropical shirt or sundress',
    'autumn-harvest': 'wearing cozy autumn clothing in warm earth tones',
    // Professional attire
    'corporate-headshot': 'wearing professional business attire, tailored suit or blazer, crisp shirt, polished executive look',
    'linkedin-profile': 'wearing smart professional attire, blazer or dress shirt, approachable business casual look',
    'business-casual': 'wearing business casual attire, neat button-up shirt or blouse, professional yet relaxed look',
    'executive-portrait': 'wearing high-end executive attire, premium tailored suit, luxury tie or accessories, powerful professional presence',
    'realtor-photo': 'wearing polished real estate professional attire, smart blazer, welcoming and trustworthy appearance',
    'author-photo': 'wearing intellectual casual attire, thoughtful sweater or blazer, creative professional look',
    'speaker-portrait': 'wearing confident speaker attire, professional suit or blazer, dynamic presence',
    'medical-professional': 'wearing clean white medical coat over professional attire, stethoscope, healthcare professional appearance',
    'legal-professional': 'wearing distinguished legal attire, dark professional suit, prestigious attorney appearance',
    'creative-professional': 'wearing modern creative professional attire, stylish and contemporary look, artistic flair',
    'tech-startup': 'wearing casual tech professional attire, smart casual hoodie or button-up, modern startup culture look',
    'academic-portrait': 'wearing scholarly professional attire, tweed jacket or academic robes, intellectual appearance',
    'blast-from-past': 'wearing classic retro 1970s-1980s fashion, vintage clothing style like polyester shirts, bell bottoms, or classic sweaters',
  };

  // Style-specific outfit overrides for Blast from the Past styles
  const blastFromPastOutfits: Record<string, string> = {
    'retro-70s': 'wearing groovy 1970s fashion, bell bottoms, platform shoes, earth tones, disco era style',
    'retro-80s': 'wearing bold 1980s fashion, bright neon colors, shoulder pads, Members Only jacket, leg warmers',
    'retro-90s': 'wearing 1990s hip hop fashion, baggy jeans, Jordans, oversized t-shirt, snapback cap',
    'tv-sitcom-living-room': 'wearing casual 90s family sitcom attire, cozy sweaters, comfortable family-friendly clothing',
    'tv-fresh-prince': 'wearing Fresh Prince style 90s fashion, colorful bold patterns, high-top sneakers, funky urban style',
    'tv-family-matters': 'wearing wholesome 90s family attire, colorful sweaters, clean-cut suburban style',
    'tv-cosby-show': 'wearing stylish 80s professional casual attire, colorful sweaters, refined family fashion',
    'tv-good-times': 'wearing 1970s urban fashion, bell bottoms, dashikis, Afrocentric style, colorful 70s patterns',
    'tv-martin': 'wearing 90s hip casual style, colorful button-up shirts, fresh urban fashion, Detroit style',
    'tv-old-western': 'wearing authentic Old West frontier clothing, cowboy hat, leather vest, bandana, boots with spurs, gun belt, rugged pioneer attire',
    'hip-hop-crew': 'wearing classic hip hop fashion, Adidas tracksuit, gold chain, Kangol hat, fresh Jordans, B-boy style',
    'album-cover-90s': 'wearing sleek 90s R&B fashion, leather jacket, stylish urban wear, album cover ready',
    'rap-group-pose': 'wearing matching hip hop crew outfits, coordinated colors, gold chains, iconic streetwear',
    'soul-train': 'wearing funky Soul Train fashion, bell bottoms, platform shoes, disco glam, 70s dance show style',
    'music-video-set': 'wearing 90s music video fashion, stylish urban wear, leather, bold accessories, MTV ready',
    'school-photo-day': 'wearing classic school photo attire, neat collared shirt, school-appropriate formal wear',
    'mall-photo-booth': 'wearing 80s-90s mall fashion, denim jacket, colorful patterns, Glamour Shots ready style',
    'awkward-portrait': 'wearing awkward matching family outfits from the 1980s-90s, turtleneck sweaters or denim shirts, matching color-coordinated outfits, puffy sleeves, permed hair styles, classic department store portrait fashion',
  };
  
  // Build outfit instruction - use style-specific outfit for Blast from the Past scene
  const getOutfitDescription = () => {
    if (scene === 'blast-from-past' && blastFromPastOutfits[style]) {
      return blastFromPastOutfits[style];
    }
    return sceneOutfits[scene] || 'wearing festive clothing appropriate for the occasion';
  };
  
  const outfitInstr = changeOutfit 
    ? `\nIMPORTANT: The person must be ${getOutfitDescription()}. Replace their original clothing completely with scene-appropriate attire.`
    : '';
  
  // Build glasses/braces removal instructions
  const removalInstructions: string[] = [];
  if (removeGlasses) {
    removalInstructions.push('Remove any glasses or eyewear from the person - show their natural face without glasses');
  }
  if (removeBraces) {
    removalInstructions.push('Remove any braces from the person\'s teeth - show natural teeth without orthodontic braces');
  }
  const removalInstr = removalInstructions.length > 0 
    ? `\nIMPORTANT MODIFICATIONS: ${removalInstructions.join('. ')}.`
    : '';
  
  // TV Show character descriptions - generic archetypes that fit each show's vibe
  const tvShowCharacters: Record<string, string> = {
    'tv-fresh-prince': 'Include a wealthy 90s African American family: a distinguished large Black father figure in a suit, an elegant Black mother, a short preppy Black young man doing a silly dance, a fashionable Black older daughter, a Black younger teenage girl, and a formal British butler. All family members are African American. They are welcoming and interacting naturally with the person in the scene, warm family gathering vibe.',
    'tv-family-matters': 'Include a warm 90s Black suburban family: a large friendly Black father in a police uniform, a loving Black mother, Black teenage son and daughter, and a young Black nerdy neighbor character with suspenders, large glasses, high-waisted plaid pants, and a goofy smile. Everyone in the scene is African American. They are all interacting naturally with the person, cozy family sitcom vibe.',
    'tv-cosby-show': 'Include an upscale 80s African American family: a Black father wearing a colorful patterned sweater, an elegant Black professional mother, and several Black children of various ages. All family members are African American. Warm, sophisticated brownstone family atmosphere. They are interacting naturally with the person in the scene.',
    'tv-good-times': 'Include a 1970s African American working-class family: a strong Black mother figure, a hardworking Black father, a tall artistic Black young man with a big smile, a smart Black teenage daughter, and a younger politically-aware Black son. All family members are African American. Modest apartment setting with warm community feeling. They are interacting naturally with the person.',
    'tv-martin': 'Include a group of 90s African American friends: an energetic short Black man who is the center of attention, his beautiful Black girlfriend, a tall laid-back Black friend, a goofy Black friend, and a sassy Black woman friend. All characters are African American. Urban Detroit apartment vibe, fun and lively atmosphere. They are interacting naturally with the person.',
    'tv-sitcom-living-room': 'Include a friendly diverse 90s sitcom family - parents, kids, and maybe a quirky neighbor - all in casual 90s attire, interacting naturally with the person in the scene.',
  };
  
  // Build character instruction if requested
  const characterInstr = includeCharacters && tvShowCharacters[style]
    ? `\nINCLUDE CHARACTERS: ${tvShowCharacters[style]}`
    : '';
  
  // Build custom instructions part - make prohibitions more prominent
  let customInstr = '';
  if (instructions) {
    // Check if it contains "no" or "without" to treat as a prohibition
    const lowerInstr = instructions.toLowerCase();
    if (lowerInstr.includes('no ') || lowerInstr.includes('without') || lowerInstr.includes("don't") || lowerInstr.includes('avoid')) {
      customInstr = `\nCRITICAL RESTRICTION - DO NOT INCLUDE: ${instructions}. This is a strict requirement.`;
    } else {
      customInstr = `\nAdditional requirements: ${instructions}.`;
    }
  }
  
  const prompt = `Transform this person's photo into ${sceneDesc}. 
Keep the person as the main focus, clearly recognizable with their face prominently featured.
Place them naturally within the scene.${outfitInstr}${removalInstr}${characterInstr}${customInstr}
${styleInstr}.
The person should look happy and engaged.
High quality, visually appealing result suitable for a greeting card cover.`;

  console.log(`[NanoBanana] Generating festive transform: ${scene} in ${style} style`);

  const images = await generateImage({
    prompt,
    numImages: 1,
    imageSize: '3:4', // Card cover aspect ratio
    imageUrls: [imageUrl]
  });

  return images[0];
}
