import axios from 'axios';

const NANO_BANANA_API_KEY = process.env.NANO_BANANA_API_KEY;
const NANO_BANANA_BASE_URL = 'https://api.nanobananaapi.ai/api/v1/nanobanana';

// Use Pro endpoint for higher quality images
const USE_PRO_MODEL = false; // Using standard model for faster generation

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
    'hip-hop-crew': 'wearing classic hip hop fashion, Adidas tracksuit, gold chain, Kangol hat, fresh Jordans, B-boy style',
    'album-cover-90s': 'wearing sleek 90s R&B fashion, leather jacket, stylish urban wear, album cover ready',
    'rap-group-pose': 'wearing matching hip hop crew outfits, coordinated colors, gold chains, iconic streetwear',
    'soul-train': 'wearing funky Soul Train fashion, bell bottoms, platform shoes, disco glam, 70s dance show style',
    'music-video-set': 'wearing 90s music video fashion, stylish urban wear, leather, bold accessories, MTV ready',
    'school-photo-day': 'wearing classic school photo attire, neat collared shirt, school-appropriate formal wear',
    'mall-photo-booth': 'wearing 80s-90s mall fashion, denim jacket, colorful patterns, Glamour Shots ready style',
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
  
  // TV Show character descriptions - only used when includeCharacters is true
  const tvShowCharacters: Record<string, string> = {
    'tv-fresh-prince': 'Include the Banks family characters from Fresh Prince of Bel-Air: Carlton Banks (short, preppy, energetic), Uncle Phil (large, distinguished man in suit), Aunt Vivian (elegant Black woman), Hillary (fashionable young woman), Ashley (teenage girl), and Geoffrey the butler (British, formal attire). They should be interacting naturally with the person in the scene.',
    'tv-family-matters': 'Include the Winslow family characters from Family Matters: Carl Winslow (large friendly police officer), Harriette Winslow (warm mother figure), Eddie (teenage son), Laura (teenage daughter), and most importantly Steve Urkel (nerdy neighbor with suspenders, large glasses, and high-pitched personality). They should be interacting naturally with the person in the scene.',
    'tv-cosby-show': 'Include the Huxtable family characters from The Cosby Show: Cliff Huxtable (father in colorful sweater), Claire Huxtable (elegant mother, lawyer), Denise, Theo, Vanessa, Rudy, and Sondra as family members. They should be interacting naturally with the person in the scene.',
    'tv-good-times': 'Include the Evans family characters from Good Times: Florida Evans (strong mother figure), James Evans Sr (hardworking father), J.J. Evans (tall, artistic son known for "Dy-no-mite!"), Thelma (smart daughter), Michael (youngest, politically aware). They should be interacting naturally with the person in the scene.',
    'tv-martin': 'Include characters from Martin: Martin Payne (energetic host), Gina Waters (beautiful girlfriend), Tommy (laid-back friend), Cole (simple friend), Pam (Gina\'s sassy friend). They should be interacting naturally with the person in the scene.',
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
