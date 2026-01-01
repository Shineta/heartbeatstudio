// // From blueprint:javascript_openai_ai_integrations
// import OpenAI from "openai";
// import { Buffer } from "node:buffer";

// // This is using Replit's AI Integrations service
// const openai = new OpenAI({
//   baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
//   apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
// });

// export async function generateCardContent(params: {
//   recipientName: string;
//   relationship: string;
//   occasion?: string;
//   tone: string;
//   interests?: string;
//   insideJokes?: string;
// }): Promise<{ message: string; title: string }> {
//   const prompt = `Create a heartfelt ${params.tone} greeting card message for ${params.recipientName}, my ${params.relationship}.
// ${params.occasion ? `Occasion: ${params.occasion}` : ''}
// ${params.interests ? `Their interests: ${params.interests}` : ''}
// ${params.insideJokes ? `Inside jokes we share: ${params.insideJokes}` : ''}

// Generate a warm, personalized message (2-4 sentences) and a short title (3-5 words).
// Return as JSON with 'message' and 'title' fields.`;

//   const response = await openai.chat.completions.create({
//     model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
//     messages: [{ role: "user", content: prompt }],
//     response_format: { type: "json_object" },
//     max_completion_tokens: 8192,
//   });

//   const content = JSON.parse(response.choices[0]?.message?.content || '{"message": "", "title": ""}');
//   return content;
// }

// export async function generateCardImage(params: {
//   recipientName: string;
//   occasion?: string;
//   tone: string;
// }): Promise<string> {
//   const prompt = `Create a beautiful, ${params.tone} greeting card illustration for ${params.recipientName}. ${params.occasion ? `For: ${params.occasion}.` : ''} Watercolor style with hearts, flowers, and celebratory elements. Warm, joyful, colorful, professional card design.`;

//   const response = await openai.images.generate({
//     model: "gpt-image-1",
//     prompt,
//     size: "1024x1024",
//   });

//   const imageUrl = response.data?.[0]?.url;
//   const b64Json = response.data?.[0]?.b64_json;

//   if (b64Json) {
//     return b64Json;
//   }

//   if (!imageUrl) {
//     throw new Error("No image URL or b64_json returned from AI service");
//   }

//   const imageResponse = await fetch(imageUrl);
//   const arrayBuffer = await imageResponse.arrayBuffer();
//   const base64 = Buffer.from(arrayBuffer).toString('base64');
//   return base64;
// }

// export async function generateSongLyrics(params: {
//   recipientName: string;
//   relationship: string;
//   occasion?: string;
//   tone: string;
//   genre?: string;
//   interests?: string;
//   insideJokes?: string;
//   additionalNotes?: string;
// }): Promise<{ lyrics: string; title: string; description: string }> {
//   const prompt = `Write ${params.tone} song lyrics (30-60 seconds when sung) for ${params.recipientName}, my ${params.relationship}.
// ${params.occasion ? `Occasion: ${params.occasion}` : ''}
// ${params.genre ? `Genre: ${params.genre}` : ''}
// ${params.interests ? `Their interests: ${params.interests}` : ''}
// ${params.insideJokes ? `Inside jokes: ${params.insideJokes}` : ''}
// ${params.additionalNotes ? `Special context: ${params.additionalNotes}` : ''}

// Create personalized, heartfelt lyrics with:
// - A catchy title (3-5 words)
// - 2 verses and a chorus
// - Personal touches that celebrate them
// - ${params.tone} and ${params.genre || 'upbeat'} style
// - A brief description of the song's vibe
// ${params.additionalNotes ? `- Incorporate the special context/situation mentioned above` : ''}

// Return as JSON with 'lyrics', 'title', and 'description' fields.`;

//   const response = await openai.chat.completions.create({
//     model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
//     messages: [{ role: "user", content: prompt }],
//     response_format: { type: "json_object" },
//     max_completion_tokens: 8192,
//   });

//   const content = JSON.parse(response.choices[0]?.message?.content || '{"lyrics": "", "title": "", "description": ""}');
//   return content;
// }

// export async function generateSongCover(params: {
//   title: string;
//   tone: string;
//   genre?: string;
// }): Promise<string> {
//   const prompt = `Create album cover art for a ${params.tone} ${params.genre || 'pop'} song titled "${params.title}". Vibrant, colorful, modern design with musical elements, hearts, and celebration motifs. Professional music album artwork style.`;

//   const response = await openai.images.generate({
//     model: "gpt-image-1",
//     prompt,
//     size: "1024x1024",
//   });

//   console.log("Image generation response:", JSON.stringify(response.data?.[0], null, 2));

//   const imageUrl = response.data?.[0]?.url;
//   const b64Json = response.data?.[0]?.b64_json;

//   if (b64Json) {
//     return b64Json;
//   }

//   if (!imageUrl) {
//     throw new Error("No image URL or b64_json returned from AI service");
//   }

//   const imageResponse = await fetch(imageUrl);
//   const arrayBuffer = await imageResponse.arrayBuffer();
//   const base64 = Buffer.from(arrayBuffer).toString('base64');
//   return base64;
// }

// openaiService.ts
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

export interface GenerateSongLyricsParams {
  recipientName: string;
  relationship: string;
  occasion?: string;
  tone: string;
  genre?: string;
  interests?: string;
  insideJokes?: string;
  additionalNotes?: string;
}

export interface GeneratedSongLyrics {
  title: string;
  lyrics: string;
}

/**
 * Normalize genre the same way we did on the Suno side.
 * Any gospel-ish input becomes "black-gospel" so the prompt is consistent.
 */
function normalizeGenre(input?: string): string {
  if (!input) return "black-gospel";

  const g = input.toLowerCase().trim();

  const gospelLike = [
    "gospel",
    "black-gospel",
    "black gospel",
    "worship",
    "praise",
    "praise & worship",
    "praise and worship",
    "church",
    "choir",
  ];

  if (gospelLike.some((x) => g.includes(x))) {
    return "black-gospel";
  }

  return g;
}

/**
 * Build a strong, explicit instructions block for Black gospel lyrics,
 * including a target LENGTH so it feels like a 3-minute song.
 */
function buildBlackGospelInstructionBlock(): string {
  return `
Write this as an AUTHENTIC BLACK GOSPEL worship song, as if it is being sung in a Black church TODAY.

STYLE & SOUND:
- Feel like a Black church service with a live choir, band, and Hammond B3 organ.
- Use call-and-response structure between LEAD and CHOIR in some lines. For example:
  LEAD: ...
  CHOIR: ...
- Capture praise break energy in at least one section (repeated short lines of praise).
- Use contemporary but church-centered language (e.g., "hallelujah", "thank You, Lord", "You made a way", "You kept me", "You never left me").
- Do NOT copy or closely imitate any specific existing gospel song or lyrics.

STRUCTURE & LENGTH (IMPORTANT):
- Aim for lyrics suitable for a ~3-minute song.
- Include AT LEAST:
  - Verse 1
  - Verse 2
  - Verse 3
  - Chorus
  - Bridge or Vamp
- Each Verse should be 4–6 lines.
- The Chorus should be 4–6 lines that are easy to repeat; you may mark it like:
  [Chorus]
  ...
  (Repeat Chorus)
- The Bridge or Vamp should feel like a praise break or build-up section with short, repeatable lines.
- OVERALL LENGTH: at least 220 words of lyrics (you may go longer if it still feels singable).

THEOLOGY & TONE:
- Keep lyrics biblically and spiritually sound, but do not quote long Bible passages word-for-word.
- Center on God's character (faithful, loving, way-maker, healer, protector) and what He has done.
- Be uplifting, hopeful, and worshipful, not condemning.
`.trim();
}

/**
 * Helper to build the core prompt content from user params.
 */
function buildBasePrompt(
  params: GenerateSongLyricsParams,
  normalizedGenre: string,
): string {
  const {
    recipientName,
    relationship,
    occasion,
    tone,
    interests,
    insideJokes,
    additionalNotes,
  } = params;

  const occasionText = occasion
    ? `Occasion / context: ${occasion}.`
    : "Occasion / context: general encouragement and love.";

  const interestsText = interests
    ? `Relevant interests, details, or themes to weave into the song: ${interests}.`
    : "Relevant interests: none given. Focus on their life, journey, and faith.";

  const jokesText = insideJokes
    ? `Optional playful or personal inside jokes to tastefully reference (without being corny): ${insideJokes}.`
    : "No explicit inside jokes were provided.";

  const notesText = additionalNotes
    ? `IMPORTANT SPECIAL INSTRUCTIONS FROM USER (must incorporate these): ${additionalNotes}`
    : "";

  return `
Recipient: ${recipientName}
Relationship to sender: ${relationship}
Tone: ${tone}
Genre target (normalized): ${normalizedGenre}
${occasionText}
${interestsText}
${jokesText}
${notesText}
`.trim();
}

/**
 * Main lyric generator.
 * Returns a JSON-parsed { title, lyrics } object.
 */
export async function generateSongLyrics(
  params: GenerateSongLyricsParams,
): Promise<GeneratedSongLyrics> {
  const normalizedGenre = normalizeGenre(params.genre);

  // Base prompt body describing the situation + recipient
  const basePrompt = buildBasePrompt(params, normalizedGenre);

  // If it's Black gospel, use the heavy gospel instruction block.
  // Otherwise, we can still encourage a decent length.
  const styleBlock =
    normalizedGenre === "black-gospel"
      ? buildBlackGospelInstructionBlock()
      : `
Write this as a modern, radio-ready ${normalizedGenre || "pop"} song.

STRUCTURE & LENGTH:
- Aim for lyrics suitable for a ~3-minute song.
- Include at least: Verse 1, Verse 2, Chorus, and a Bridge or Middle 8.
- Each Verse should be 4–6 lines.
- The Chorus should be 4–6 lines and clearly labeled as [Chorus].
- OVERALL LENGTH: at least 180–220 words of lyrics.

GENERAL:
- Keep it singable and emotionally aligned with the tone.
- Do NOT copy any existing songs or lyrics.
`.trim();

  const systemPrompt = `
You are a professional songwriter who specializes in writing fully structured lyrics.
You return ONLY valid JSON that my code can parse.

When the genre is "black-gospel", you write for an authentic contemporary Black church context.
You respect the culture and voice: no stereotypes, no parody, no mockery.
`.trim();

  const userPrompt = `
${basePrompt}

${styleBlock}

RETURN FORMAT (IMPORTANT):

Return ONLY a JSON object with this exact shape (no extra commentary):

{
  "title": "Short, powerful song title here",
  "lyrics": "Full song lyrics here with line breaks and section labels (e.g., [Verse 1], [Chorus], [Bridge], [Vamp])."
}
`.trim();

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.9, // some creativity for lyrics
  });

  const raw = completion.choices[0]?.message?.content || "{}";

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error("Failed to parse OpenAI lyrics JSON:", raw);
    throw new Error("Failed to parse lyrics response from OpenAI");
  }

  if (!parsed.title || !parsed.lyrics) {
    console.error("Lyrics JSON missing required fields:", parsed);
    throw new Error("Lyrics response missing title or lyrics");
  }

  const result: GeneratedSongLyrics = {
    title: parsed.title,
    lyrics: parsed.lyrics,
  };

  return result;
}

// Generate card content (message and title)
export async function generateCardContent(params: {
  recipientName: string;
  relationship: string;
  occasion?: string;
  tone: string;
  interests?: string;
  insideJokes?: string;
}): Promise<{ message: string; title: string }> {
  const prompt = `Create a heartfelt ${params.tone} greeting card message for ${params.recipientName}, my ${params.relationship}.
${params.occasion ? `Occasion: ${params.occasion}` : ''}
${params.interests ? `Their interests: ${params.interests}` : ''}
${params.insideJokes ? `Inside jokes we share: ${params.insideJokes}` : ''}

Generate a warm, personalized message (2-4 sentences) and a short title (3-5 words).
Return as JSON with 'message' and 'title' fields.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = JSON.parse(response.choices[0]?.message?.content || '{"message": "", "title": ""}');
  return content;
}

// Generate card image (returns base64)
export async function generateCardImage(params: {
  recipientName: string;
  occasion?: string;
  tone: string;
}): Promise<string> {
  const prompt = `Create a beautiful, ${params.tone} greeting card illustration for ${params.recipientName}. ${params.occasion ? `For: ${params.occasion}.` : ''} Watercolor style with hearts, flowers, and celebratory elements. Warm, joyful, colorful, professional card design.`;

  const response = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    size: "1024x1024",
  });

  const b64Json = response.data?.[0]?.b64_json;
  if (!b64Json) {
    throw new Error("No image data returned from AI service");
  }
  return b64Json;
}

// Generate personalized follow-up questions based on initial song details
// Used for the AI questionnaire feature to gather more context
export interface QuestionnaireParams {
  recipientName: string;
  relationship: string;
  occasion?: string;
  tone?: string;
  genre?: string;
  songDetails: string;
}

export interface GeneratedQuestions {
  intro: string;
  questions: Array<{
    id: string;
    question: string;
    hint?: string;
  }>;
}

export async function generateSongQuestionnaire(params: QuestionnaireParams): Promise<GeneratedQuestions> {
  const prompt = `You are helping create a personalized song for ${params.recipientName} (${params.relationship}).

The user has shared these initial details:
"${params.songDetails}"

${params.occasion ? `Occasion: ${params.occasion}` : ''}
${params.tone ? `Desired tone: ${params.tone}` : ''}
${params.genre ? `Genre: ${params.genre}` : ''}

Based on these details, generate 5-8 thoughtful follow-up questions to help make this song deeply personal. Your questions should:
1. Dig deeper into the story/context they mentioned
2. Ask about specific details that can be woven into lyrics (names, places, moments, inside jokes)
3. Explore what makes this person special
4. Understand what emotions or messages they want to convey
5. Clarify any terms or references they mentioned

Be conversational and warm in your question phrasing. Each question should help gather unique details for the lyrics.

Return JSON with:
- "intro": A short warm message acknowledging what they shared (1-2 sentences, e.g., "I'd love to write a song for Kurt! Let me ask some questions to make it personal:")
- "questions": Array of question objects with:
  - "id": Unique identifier (q1, q2, etc.)
  - "question": The follow-up question
  - "hint": Optional hint in parentheses to guide their answer`;

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = JSON.parse(response.choices[0]?.message?.content || '{"intro": "", "questions": []}');
  return content as GeneratedQuestions;
}

// Generate song cover art - Cassette tape style using Nano Banana Realistic
// Returns a URL to the generated image (not base64)
// If customImageUrl is provided, uses image-to-image to stylize it with retro cassette tape aesthetic
export async function generateSongCover(params: {
  title: string;
  tone: string;
  genre?: string;
  trackList?: string[];
  recipientName?: string;
  customImageUrl?: string;
}): Promise<string> {
  // Import Nano Banana service for cassette case generation
  const { generateCassetteCaseImage } = await import('./nanoBananaService');

  console.log(`[SongCover] Generating cassette cover for: ${params.title}${params.customImageUrl ? ' (with custom art)' : ''}`);

  // Use the unified cassette case generator which handles both custom images and scratch generation
  const imageUrl = await generateCassetteCaseImage({
    title: params.title,
    recipientName: params.recipientName || 'You',
    theme: `${params.genre || 'pop'} ${params.tone}`,
    coverArtUrl: params.customImageUrl,
  });

  return imageUrl;
}

// Family Portrait Composer - Analyze photos for faces/subjects
export interface DetectedFace {
  id: string;
  name: string; // Auto-generated like "Person 1", "Person 2"
  description: string; // Brief description for reference
  imageIndex: number; // Which uploaded image this face is from
}

export interface AnalyzedPhotos {
  faces: DetectedFace[];
  totalPeople: number;
}

export async function analyzePhotosForFaces(imageUrls: string[]): Promise<AnalyzedPhotos> {
  console.log(`[FamilyPortrait] Analyzing ${imageUrls.length} photos for faces...`);
  console.log(`[FamilyPortrait] Image URLs:`, imageUrls);

  // Fetch images and convert to base64 for reliable analysis
  // (OpenAI may not be able to access external URLs)
  const imageContents: Array<{ type: "image_url"; image_url: { url: string; detail: "high" } }> = [];
  
  for (const url of imageUrls) {
    try {
      console.log(`[FamilyPortrait] Fetching image: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`[FamilyPortrait] Failed to fetch image ${url}: ${response.status}`);
        continue;
      }
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const contentType = response.headers.get('content-type') || 'image/png';
      const dataUrl = `data:${contentType};base64,${base64}`;
      
      imageContents.push({
        type: "image_url" as const,
        image_url: { url: dataUrl, detail: "high" as const }
      });
      console.log(`[FamilyPortrait] Successfully converted image to base64 (${Math.round(base64.length / 1024)}KB)`);
    } catch (error: any) {
      console.error(`[FamilyPortrait] Error fetching image ${url}:`, error.message);
    }
  }

  if (imageContents.length === 0) {
    throw new Error('Could not load any images for analysis');
  }

  const prompt = `You are analyzing photos to identify people for a family portrait.

Look at these ${imageContents.length} photos carefully and identify ALL people visible in each photo.

For each person you see, provide:
- A descriptive name like "Person 1", "Person 2", etc.
- A brief description of OBSERVABLE PHYSICAL FEATURES ONLY: approximate age range, hair color/style/length, skin tone, glasses, and clothing/accessories visible
- Which image number (1-indexed) they appear in

CRITICAL RULES:
- DO NOT assume or mention gender - describe only what you can directly observe
- Focus on distinctive features: hairstyle, glasses, clothing, accessories
- Use neutral language like "person" or "adult" rather than gendered terms
- Every photo should have at least one person detected unless it's truly empty
- Look carefully - people may be in the foreground, background, or partially visible
- Include everyone you can see, even if partially obscured

Return as JSON with this exact format:
{
  "faces": [
    { "name": "Person 1", "description": "Adult, approximately 25-30, with long brown hair in locs and round glasses, wearing a brown blazer", "imageIndex": 1 },
    { "name": "Person 2", "description": "Adult, approximately 50, with short gray hair and a beard, wearing a blue suit", "imageIndex": 1 },
    { "name": "Person 3", "description": "Young person, approximately 8-10, with blonde curly hair, wearing a red shirt", "imageIndex": 2 }
  ],
  "totalPeople": 3
}

If the same person appears in multiple photos, list them only once with the first imageIndex where they appear.`;

  try {
    console.log('[FamilyPortrait] Sending request to OpenAI for face analysis...');
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            ...imageContents
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const rawContent = response.choices[0]?.message?.content || '{"faces": [], "totalPeople": 0}';
    console.log(`[FamilyPortrait] OpenAI raw response:`, rawContent);
    
    const result = JSON.parse(rawContent);
    
    // Add unique IDs to each face
    result.faces = result.faces.map((face: any, index: number) => ({
      ...face,
      id: `face-${index + 1}`,
    }));

    console.log(`[FamilyPortrait] Detected ${result.totalPeople} people in ${imageUrls.length} photos`);
    console.log(`[FamilyPortrait] Faces found:`, JSON.stringify(result.faces, null, 2));
    return result;
  } catch (error: any) {
    console.error('[FamilyPortrait] Error analyzing photos:', error.message);
    console.error('[FamilyPortrait] Full error:', error);
    throw new Error('Failed to analyze photos for faces');
  }
}

// Generate the compositing prompt for the family portrait
export interface FamilyPortraitParams {
  imageUrls: string[];
  selectedFaces: DetectedFace[];
  scene: string;
  style: string;
  keepOutfits: boolean;
}

export function buildFamilyPortraitPrompt(params: FamilyPortraitParams): string {
  const { selectedFaces, scene, style, keepOutfits } = params;

  const peopleDescriptions = selectedFaces.map(f => f.description).join(', ');
  
  const sceneDescriptions: Record<string, string> = {
    'studio': 'professional photography studio with neutral gray background and soft studio lighting',
    'living-room': 'cozy living room with warm ambient lighting, comfortable furniture, and family-friendly decor',
    'holiday': 'festive holiday setting with Christmas decorations, twinkling lights, and celebratory atmosphere',
    'outdoors': 'beautiful outdoor scene with natural lighting, trees, and blue sky',
    'graduation': 'graduation ceremony backdrop with academic colors and celebratory elements',
    'birthday': 'birthday party setting with balloons, decorations, and festive atmosphere',
  };

  const styleDescriptions: Record<string, string> = {
    'watercolor': 'artistic watercolor painting style with soft edges and flowing colors',
    'cartoon': 'fun cartoon illustration style with bold outlines and vibrant colors',
    'studio-photo': 'professional studio photography with perfect lighting and high resolution',
    'oil-painting': 'classic oil painting style with rich textures and warm tones',
    'digital-art': 'modern digital art style with clean lines and vivid colors',
    'vintage': 'nostalgic vintage photograph style with warm sepia tones',
  };

  const sceneDesc = sceneDescriptions[scene] || sceneDescriptions['studio'];
  const styleDesc = styleDescriptions[style] || styleDescriptions['studio-photo'];

  let prompt = `Create a beautiful family portrait photo combining the following people into one unified group photo:

People to include: ${peopleDescriptions}

Scene: ${sceneDesc}

Art style: ${styleDesc}

Requirements:
- All people should be posed together naturally as a family group
- Maintain consistent lighting and color grading across all subjects
- Make it look like everyone was photographed together at the same moment
- Professional quality suitable for printing and framing`;

  if (keepOutfits) {
    prompt += `\n- Keep each person's original clothing and outfits from their source photos`;
  } else {
    prompt += `\n- Dress everyone in coordinated, matching outfits appropriate for the scene`;
  }

  return prompt;
}
