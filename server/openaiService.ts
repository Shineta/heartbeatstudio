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
  customMessage?: string;
  language?: string;
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
    language,
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

  const languageText = language && language !== 'english'
    ? `LANGUAGE: Write all lyrics in ${language}. The entire song MUST be in ${language} language.`
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
${languageText}
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

  // Check if this is a Sung Prayer request (THREE-PART structure)
  const isSungPrayer = params.customMessage && 
    params.customMessage.includes('THREE-PART BIBLICAL PRAYER STRUCTURE');

  if (isSungPrayer && params.customMessage) {
    console.log('[OpenAI] Detected Sung Prayer request, using three-part prayer structure');
    
    // Extract the three parts from the customMessage
    const thanksgivingMatch = params.customMessage.match(/PART 1 - THANKSGIVING[^:]*:\s*([^\n]+(?:\n(?!PART 2)[^\n]+)*)/i);
    const declarationMatch = params.customMessage.match(/PART 2 - DECLARE[^:]*:\s*([^\n]+(?:\n(?!PART 3)[^\n]+)*)/i);
    const promiseMatch = params.customMessage.match(/PART 3 - CLAIMING[^:]*:\s*([^\n]+(?:\n(?!This prayer)[^\n]+)*)/i);
    const intentionMatch = params.customMessage.match(/Prayer intention:\s*([^\n]+)/i);
    
    const thanksgivingText = thanksgivingMatch ? thanksgivingMatch[1].trim() : "";
    const declarationText = declarationMatch ? declarationMatch[1].trim() : "";
    const promiseText = promiseMatch ? promiseMatch[1].trim() : "";
    const intentionText = intentionMatch ? intentionMatch[1].trim() : "";
    
    console.log('[OpenAI] Extracted prayer parts:', { 
      thanksgiving: thanksgivingText.substring(0, 50) + '...', 
      declaration: declarationText.substring(0, 50) + '...', 
      promise: promiseText.substring(0, 50) + '...',
      intention: intentionText 
    });

    const systemPrompt = `
You are a professional gospel songwriter specializing in sung prayers.
You create heartfelt prayer songs that SING the actual prayer words and scriptures provided.
You return ONLY valid JSON that my code can parse.
The scriptures and prayer words MUST be sung word-for-word - this is sacred text.
`.trim();

    const userPrompt = `
Create a SUNG PRAYER for ${params.recipientName} following this THREE-PART BIBLICAL PRAYER STRUCTURE.
Prayer intention: ${intentionText}
Genre style: ${normalizedGenre || "gospel"}

=== THE THREE PARTS (THESE EXACT WORDS MUST BE SUNG) ===

PART 1 - THANKSGIVING (Opening with Gratitude):
"${thanksgivingText}"

PART 2 - DECLARE GOD'S WORD (Speaking Scripture - MUST BE SUNG WORD-FOR-WORD):
"${declarationText}"

PART 3 - CLAIMING PROMISES (Standing on God's Promises - MUST BE SUNG WORD-FOR-WORD):
"${promiseText}"

=== CRITICAL INSTRUCTIONS ===

1. SING THE ACTUAL WORDS PROVIDED ABOVE - especially the scripture texts. Do NOT paraphrase or summarize.
2. Structure the song as:
   - [Intro/Thanksgiving]: Sing the thanksgiving text
   - [Verse 1/Declaration]: Sing the declaration scripture WORD-FOR-WORD
   - [Chorus]: A refrain based on the prayer intention
   - [Verse 2/Promise]: Sing the promise scripture WORD-FOR-WORD
   - [Outro/Vamp]: Praise break or repeated affirmation
3. You may repeat lines for musical emphasis
4. Keep the sacred integrity of the scripture text
5. Make it flow naturally when sung, maintaining the ${normalizedGenre} style
6. The Bible verses (declaration and promise) are the CENTERPIECE - sing them completely

RETURN FORMAT (IMPORTANT):
Return ONLY a JSON object with this exact shape:

{
  "title": "Create a meaningful title based on the prayer intention",
  "lyrics": "The full song lyrics with the thanksgiving, scriptures, and promises sung word-for-word, with section labels"
}
`.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error("Failed to parse Sung Prayer lyrics JSON:", raw);
      throw new Error("Failed to parse lyrics response from OpenAI");
    }

    if (!parsed.title || !parsed.lyrics) {
      throw new Error("Sung Prayer lyrics response missing title or lyrics");
    }

    console.log('[OpenAI] Sung Prayer lyrics generated:', parsed.title);
    console.log('[OpenAI] Lyrics preview:', parsed.lyrics.substring(0, 200) + '...');
    return { title: parsed.title, lyrics: parsed.lyrics };
  }

  // Check if this is a Bible verse singing request
  const isBibleVerseSong = params.customMessage && 
    (params.customMessage.includes('WORD-FOR-WORD') || 
     params.customMessage.includes('Bible verse') ||
     params.customMessage.includes('scripture'));

  if (isBibleVerseSong && params.customMessage) {
    console.log('[OpenAI] Detected Bible verse song request, using scripture as lyrics');
    
    // Extract the verse text from the customMessage
    const verseMatch = params.customMessage.match(/primary lyrics:\s*"([^"]+)"/i);
    const verseText = verseMatch ? verseMatch[1] : null;
    
    if (verseText) {
      const systemPrompt = `
You are a professional gospel songwriter. You take Bible verses and format them into singable song lyrics.
You return ONLY valid JSON that my code can parse.
You respect the sacred text while making it flow musically.
`.trim();

      const userPrompt = `
Create song lyrics for ${params.recipientName} using this Bible verse as the EXACT lyrics:

"${verseText}"

CRITICAL INSTRUCTIONS:
1. The verse text above MUST be sung WORD-FOR-WORD as the main lyrics
2. You may repeat lines for musical emphasis
3. Add section labels like [Verse], [Chorus], [Bridge] to structure it
4. You may add a brief intro line or closing, but the scripture is the centerpiece
5. Keep the sacred integrity of the text
6. Genre style: ${normalizedGenre || "gospel"}
7. Make it flow naturally when sung

RETURN FORMAT (IMPORTANT):
Return ONLY a JSON object with this exact shape:

{
  "title": "Create a meaningful title based on the verse",
  "lyrics": "The full song lyrics with the scripture sung word-for-word, with section labels"
}
`.trim();

      const completion = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      });

      const raw = completion.choices[0]?.message?.content || "{}";
      let parsed: any;
      try {
        parsed = JSON.parse(raw);
      } catch (err) {
        console.error("Failed to parse Bible verse lyrics JSON:", raw);
        throw new Error("Failed to parse lyrics response from OpenAI");
      }

      if (!parsed.title || !parsed.lyrics) {
        throw new Error("Bible verse lyrics response missing title or lyrics");
      }

      console.log('[OpenAI] Bible verse song lyrics generated:', parsed.title);
      return { title: parsed.title, lyrics: parsed.lyrics };
    }
  }

  // Base prompt body describing the situation + recipient
  const basePrompt = buildBasePrompt(params, normalizedGenre);

  // Extract artist inspiration from additionalNotes if present
  let artistInspiration = '';
  if (params.additionalNotes) {
    const artistPatterns = [
      /Artist Inspiration:\s*in the style of\s+(.+?)(?:\n|$)/i,
      /(?:like|inspired by|sound(?:s)? like|in the style of|similar to)\s+([a-zA-Z][a-zA-Z0-9\s\-'\.]+?)(?:\s*(?:style|vibe|sound|energy|flow|,|\.|$))/i,
    ];
    for (const pattern of artistPatterns) {
      const match = params.additionalNotes.match(pattern);
      if (match && match[1] && match[1].trim().length > 1) {
        artistInspiration = match[1].trim();
        console.log(`[OpenAI Lyrics] Detected artist inspiration: ${artistInspiration}`);
        break;
      }
    }
  }

  const artistStyleBlock = artistInspiration ? `
ARTIST INSPIRATION — THIS IS CRITICAL:
The user wants lyrics written in the style of ${artistInspiration}. You must deeply channel ${artistInspiration}'s signature lyrical approach:
- Study ${artistInspiration}'s songwriting patterns: their typical song structures, rhythmic cadence, vocabulary, emotional tone, and lyrical devices.
- If ${artistInspiration} is known for spoken word, conversational flow, or poetry-style lyrics, write in THAT style — NOT in standard verse/chorus format.
- If ${artistInspiration} uses natural speech patterns, pauses, repetition, interjections (like "you know?", "mmm", "baby"), parenthetical asides, or stream-of-consciousness flow, incorporate those elements authentically.
- If ${artistInspiration} uses non-traditional song structures (no rigid verse/chorus), follow THEIR structure instead of conventional pop/R&B structures.
- Match ${artistInspiration}'s emotional depth, imagery style, and vocal delivery cues.
- The lyrics should feel like ${artistInspiration} could have written them — capturing their artistic DNA, not just their genre.
`.trim() : '';

  // If it's Black gospel, use the heavy gospel instruction block.
  // Otherwise, we can still encourage a decent length.
  const styleBlock =
    normalizedGenre === "black-gospel"
      ? buildBlackGospelInstructionBlock()
      : artistInspiration ? `
Write this as a song inspired by ${artistInspiration}'s style within the ${normalizedGenre || "pop"} genre.

STRUCTURE & LENGTH:
- Match ${artistInspiration}'s typical song structure. If they use non-traditional structures (spoken word, poetry, jazz flow), use THAT instead of standard verse/chorus format.
- Aim for lyrics suitable for a ~3-minute song.
- OVERALL LENGTH: at least 180–220 words of lyrics.
- Include section labels that match the artist's style (e.g., [Spoken/Sung], [Interlude - Melodic], [Spoken word bridge] for spoken word artists, or [Verse 1], [Chorus] for traditional song artists).

GENERAL:
- Keep it singable/performable and emotionally aligned with the tone.
- Do NOT copy any existing songs or lyrics — capture the STYLE, not the words.
`.trim() : `
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
${artistInspiration ? `You are deeply familiar with ${artistInspiration}'s songwriting style, vocal delivery, lyrical patterns, and artistic identity. You can authentically channel their creative voice.` : ''}
When the genre is "black-gospel", you write for an authentic contemporary Black church context.
You respect the culture and voice: no stereotypes, no parody, no mockery.
`.trim();

  const userPrompt = `
${basePrompt}

${artistStyleBlock}

${styleBlock}

RETURN FORMAT (IMPORTANT):

Return ONLY a JSON object with this exact shape (no extra commentary):

{
  "title": "Short, powerful song title here",
  "lyrics": "Full song lyrics here with line breaks and section labels${artistInspiration ? ` (use section labels that match ${artistInspiration}'s style)` : ' (e.g., [Verse 1], [Chorus], [Bridge], [Vamp])'}.
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

// Generate personalized animation message
export async function generateAnimationMessage(params: {
  recipientName: string;
  occasion: string;
  tone?: string;
  description?: string;
}): Promise<string> {
  const occasionLabels: Record<string, string> = {
    birthday: 'birthday',
    anniversary: 'anniversary',
    just_because: 'thinking of you',
    congratulations: 'congratulations',
    thank_you: 'thank you',
    get_well: 'get well',
    holiday: 'holiday',
    valentine: "Valentine's Day",
    mother_day: "Mother's Day",
    father_day: "Father's Day",
    graduation: 'graduation',
    new_baby: 'new baby',
    wedding: 'wedding',
    missing_you: 'missing you',
    encouragement: 'encouragement',
    apology: 'apology',
  };

  const occasionText = occasionLabels[params.occasion] || params.occasion.replace(/_/g, ' ');
  
  const prompt = `Write a short, heartfelt message (1-2 sentences) to accompany a ${occasionText} animation created for ${params.recipientName}.
Tone: ${params.tone || 'sweet and loving'}
${params.description ? `The animation shows: ${params.description}` : ''}

Create a warm, personal message that the recipient would love to read. Do not include any greeting like "Dear" or signature. Just the heartfelt message itself.
Return as JSON with a 'message' field.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = JSON.parse(response.choices[0]?.message?.content || '{"message": "This was made with love, just for you."}');
  return content.message || "This was made with love, just for you.";
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

// Sung Prayer - Generate dynamic suggestions based on prayer intention
export interface PrayerSuggestion {
  thanksgiving: Array<{ id: string; label: string; text: string }>;
  declaration: Array<{ ref: string; text: string }>;
  promises: Array<{ ref: string; text: string }>;
}

export async function generatePrayerSuggestions(params: {
  intention: string;
  prayerFor?: "myself" | "someone";
  recipientName?: string;
}): Promise<PrayerSuggestion> {
  console.log(`[PrayerSuggestions] Generating suggestions for intention: "${params.intention}"`);

  const forWhom = params.prayerFor === "someone" && params.recipientName 
    ? params.recipientName 
    : "myself";

  const systemPrompt = `You are a knowledgeable Bible scholar and worship leader who helps people pray with scripture.
You return ONLY valid JSON that can be parsed.
You provide real, accurate Bible verses with correct references.`;

  const userPrompt = `Based on this prayer intention: "${params.intention}"
${params.prayerFor === "someone" ? `This prayer is for: ${params.recipientName || "someone else"}` : "This prayer is for myself"}

Generate personalized prayer content with REAL Bible verses that directly relate to this specific intention.

For a prayer about "${params.intention}", provide:

1. THANKSGIVING (3-5 options): Short gratitude statements that connect to this intention
   - Each should acknowledge God's character or past faithfulness related to the topic
   - Keep each to 1-2 sentences

2. DECLARATION SCRIPTURES (4-6 verses): Bible verses to declare/speak over the situation
   - Must be REAL verses with accurate references
   - Choose verses that directly address the prayer intention
   - These are "I AM" or "God IS" style declarations

3. PROMISE SCRIPTURES (4-6 verses): Bible verses that contain God's promises related to this need
   - Must be REAL verses with accurate references
   - Choose verses that offer hope, comfort, or assurance for this specific situation

Return JSON in this exact format:
{
  "thanksgiving": [
    { "id": "thank1", "label": "Short button label", "text": "Full thanksgiving sentence" },
    { "id": "thank2", "label": "Short button label", "text": "Full thanksgiving sentence" }
  ],
  "declaration": [
    { "ref": "Book Chapter:Verse", "text": "Exact scripture text" }
  ],
  "promises": [
    { "ref": "Book Chapter:Verse", "text": "Exact scripture text" }
  ]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    let parsed: any;
    
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error("[PrayerSuggestions] Failed to parse JSON:", raw);
      throw new Error("Failed to parse prayer suggestions");
    }

    // Validate the response structure
    if (!parsed.thanksgiving || !parsed.declaration || !parsed.promises) {
      console.error("[PrayerSuggestions] Invalid response structure:", parsed);
      throw new Error("Invalid prayer suggestions response");
    }

    console.log(`[PrayerSuggestions] Generated ${parsed.thanksgiving.length} thanksgiving, ${parsed.declaration.length} declaration, ${parsed.promises.length} promises`);
    
    return parsed as PrayerSuggestion;
  } catch (error: any) {
    console.error("[PrayerSuggestions] Error:", error.message);
    throw error;
  }
}

// Family Portrait Composer - Analyze photos for faces/subjects (people AND pets)
export interface DetectedFace {
  id: string;
  name: string; // Auto-generated like "Person 1", "Dog 1", "Cat 1"
  description: string; // Brief description for reference
  imageIndex: number; // Which uploaded image this face is from
  type?: 'person' | 'pet'; // Type of subject (person or pet)
}

export interface AnalyzedPhotos {
  faces: DetectedFace[];
  totalPeople: number;
  totalPets?: number;
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

  const prompt = `You are analyzing photos to identify PEOPLE and PETS for a family portrait.

Look at these ${imageContents.length} photos carefully and identify ALL people AND pets visible in each photo.

For each PERSON you see, provide:
- A descriptive name like "Person 1", "Person 2", etc.
- A brief description of OBSERVABLE PHYSICAL FEATURES ONLY: approximate age range, hair color/style/length, skin tone, glasses, and clothing/accessories visible
- Which image number (1-indexed) they appear in
- Type: "person"

For each PET you see (dogs, cats, etc.), provide:
- A descriptive name like "Dog 1", "Cat 1", etc.
- A brief description: breed (if identifiable), color, size, distinctive markings
- Which image number (1-indexed) they appear in
- Type: "pet"

CRITICAL RULES:
- DETECT BOTH PEOPLE AND PETS - include beloved family pets!
- DO NOT assume or mention gender for people - describe only what you can directly observe
- For pets: describe breed, color, fur type, size, and any distinctive markings or accessories (collars, bandanas)
- Focus on distinctive features that help identify the individual
- Every photo should have at least one subject detected unless it's truly empty
- Look carefully - subjects may be in the foreground, background, or partially visible

Return as JSON with this exact format:
{
  "faces": [
    { "name": "Person 1", "description": "Adult, approximately 25-30, with long brown hair in locs and round glasses, wearing a brown blazer", "imageIndex": 1, "type": "person" },
    { "name": "Person 2", "description": "Adult, approximately 50, with short gray hair and a beard, wearing a blue suit", "imageIndex": 1, "type": "person" },
    { "name": "Dog 1", "description": "German Shepherd mix, black and tan coloring, medium-large size, wearing a chain collar", "imageIndex": 2, "type": "pet" },
    { "name": "Dog 2", "description": "Blue Heeler/Australian Cattle Dog, gray with black spots, medium size, friendly expression", "imageIndex": 3, "type": "pet" }
  ],
  "totalPeople": 2,
  "totalPets": 2
}

If the same person or pet appears in multiple photos, list them only once with the first imageIndex where they appear.`;

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

    const peopleCount = result.totalPeople || 0;
    const petCount = result.totalPets || 0;
    console.log(`[FamilyPortrait] Detected ${peopleCount} people and ${petCount} pets in ${imageUrls.length} photos`);
    console.log(`[FamilyPortrait] Subjects found:`, JSON.stringify(result.faces, null, 2));
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
  removeBracesIds?: string[]; // IDs of people whose dental braces should be removed
  specialInstructions?: string; // Custom instructions for the portrait
  category?: 'loved-ones' | 'business' | 'education'; // Context for appropriate posing
}

export function buildFamilyPortraitPrompt(params: FamilyPortraitParams): string {
  const { selectedFaces, scene, style, keepOutfits, removeBracesIds = [], specialInstructions, category = 'loved-ones' } = params;

  // Separate people and pets
  const people = selectedFaces.filter(f => f.type !== 'pet');
  const pets = selectedFaces.filter(f => f.type === 'pet');

  // Build detailed per-person descriptions with emphasis on faithfulness
  // Add braces removal note directly to each person's description if applicable
  const peopleDetails = people.map((f, i) => {
    const needsBracesRemoved = removeBracesIds.includes(f.id);
    const bracesNote = needsBracesRemoved 
      ? ' - IMPORTANT: This person has dental braces in the photo - YOU MUST REMOVE THE BRACES and show them with natural, brace-free teeth'
      : '';
    return `Person ${i + 1}: ${f.description} - MUST reproduce this person EXACTLY as they appear in the reference photo${bracesNote}`;
  }).join('\n');
  
  // Festive accessories for pets based on scene
  const petAccessories: Record<string, string> = {
    // Classic Scenes - subtle accessories
    'studio': 'wearing a cute bow tie or bandana',
    'living-room': 'wearing a cozy pet sweater or bandana',
    'outdoors': 'wearing a colorful bandana',
    'beach': 'wearing a fun beach-themed bandana',
    'garden': 'wearing a floral bandana or flower collar',
    // Life Events - festive accessories
    'birthday': 'wearing a party hat and festive bandana',
    'graduation': 'wearing a tiny graduation cap or bow tie',
    'wedding': 'wearing an elegant bow tie, flower collar, or pet tuxedo/dress',
    'baby-shower': 'wearing a pastel bandana or cute bow',
    'anniversary': 'wearing an elegant bow tie or pearl collar',
    'retirement': 'wearing a festive bandana or party bow tie',
    // Major Holidays - holiday-themed accessories
    'christmas': 'wearing a Santa hat, reindeer antlers, or festive Christmas sweater and holiday collar with bells',
    'hanukkah': 'wearing a blue and silver festive bandana or Star of David collar charm',
    'kwanzaa': 'wearing a red, black, and green festive bandana',
    'new-years': 'wearing a sparkly New Year\'s party hat, bow tie, or festive gold/silver bandana',
    'thanksgiving': 'wearing an autumn-themed bandana or pilgrim hat',
    'easter': 'wearing bunny ears, a pastel bow, or spring flower collar',
    'passover': 'wearing an elegant blue or purple bandana',
    'halloween': 'wearing a fun Halloween costume (pumpkin, bat wings, witch hat, or skeleton bandana)',
    'fourth-of-july': 'wearing patriotic red, white, and blue bandana or bow tie',
    'valentines': 'wearing a cute heart-patterned bandana, bow tie, or cupid wings',
    'mothers-day': 'wearing a floral bandana or flower collar',
    'fathers-day': 'wearing a dapper bow tie or plaid bandana',
    'st-patricks': 'wearing a green leprechaun hat, shamrock bandana, or green bow tie',
    'cinco-de-mayo': 'wearing a colorful sombrero or festive Mexican-themed bandana',
    'diwali': 'wearing a colorful festive bandana with gold accents',
    'eid': 'wearing an elegant festive collar or bandana',
    'lunar-new-year': 'wearing a red and gold festive bandana or traditional-style pet costume',
    // Legacy fallback
    'holiday': 'wearing festive holiday accessories (bow tie, bandana, or festive collar)',
    // Blast from the Past - no special accessories, just natural pet appearance
    'blast-from-past': '',
  };
  
  // For blast-from-past scenes, don't add festive accessories - pets should look natural
  let petAccessory = '';
  if (scene === 'blast-from-past') {
    petAccessory = ''; // No accessory for retro/TV scenes
  } else {
    petAccessory = petAccessories[scene] || 'wearing a cute festive accessory';
  }
  
  // Build pet descriptions with optional festive accessories
  const petDetails = pets.map((f, i) => {
    const accessoryText = petAccessory ? `, ${petAccessory}` : '';
    return `Pet ${i + 1}: ${f.description} - MUST reproduce this pet EXACTLY as they appear in the reference photo (breed, coloring, size, markings)${accessoryText}`;
  }).join('\n');
  
  const sceneDescriptions: Record<string, string> = {
    // Classic Scenes
    'studio': 'professional photography studio with neutral gray background and soft studio lighting',
    'living-room': 'cozy living room with warm ambient lighting, comfortable furniture, and family-friendly decor',
    'outdoors': 'beautiful outdoor scene with natural lighting, trees, and blue sky',
    'beach': 'sunny beach setting with ocean waves, sand, and bright coastal atmosphere',
    'garden': 'beautiful garden with blooming flowers, lush greenery, and natural sunlight',
    // Life Events
    'birthday': 'birthday party setting with balloons, confetti, birthday cake, and festive decorations',
    'graduation': 'graduation ceremony backdrop with academic cap and gown elements, diploma, and celebratory atmosphere',
    'wedding': 'elegant wedding venue with romantic floral arrangements, soft lighting, and celebratory atmosphere',
    'baby-shower': 'sweet baby shower setting with pastel decorations, balloons, and baby-themed elements',
    'anniversary': 'romantic anniversary setting with elegant decorations, flowers, and celebratory atmosphere',
    'retirement': 'celebratory retirement party with elegant decorations, congratulations banners, and festive atmosphere',
    // Major Holidays
    'christmas': 'festive Christmas setting with decorated Christmas tree, twinkling lights, wrapped presents, stockings, and cozy holiday atmosphere',
    'hanukkah': 'warm Hanukkah celebration with lit menorah, dreidels, blue and silver decorations, and gelt',
    'kwanzaa': 'vibrant Kwanzaa setting with kinara candles, red/black/green decorations, and African-inspired elements',
    'new-years': 'glamorous New Year\'s Eve celebration with champagne, confetti, sparklers, and "Happy New Year" decorations',
    'thanksgiving': 'warm Thanksgiving setting with autumn leaves, pumpkins, harvest decorations, and family dinner table',
    'easter': 'bright Easter celebration with decorated eggs, spring flowers, pastel colors, and Easter baskets',
    'passover': 'elegant Passover Seder setting with traditional elements, candles, and festive table',
    'halloween': 'spooky Halloween setting with jack-o-lanterns, autumn leaves, costumes, and fun decorations',
    'fourth-of-july': 'patriotic Fourth of July celebration with American flags, red/white/blue decorations, and fireworks backdrop',
    'valentines': 'romantic Valentine\'s Day setting with hearts, red roses, pink decorations, and love-themed elements',
    'mothers-day': 'beautiful Mother\'s Day celebration with flowers, hearts, and warm family atmosphere',
    'fathers-day': 'warm Father\'s Day celebration with elegant masculine decorations and family atmosphere',
    'st-patricks': 'festive St. Patrick\'s Day setting with shamrocks, green decorations, and Irish-themed elements',
    'cinco-de-mayo': 'vibrant Cinco de Mayo fiesta with colorful papel picado, sombreros, maracas, and festive Mexican decorations',
    'diwali': 'beautiful Diwali celebration with diyas (oil lamps), rangoli patterns, colorful flowers, and warm festive lighting',
    'eid': 'elegant Eid celebration with crescent moon and star decorations, lanterns, and festive atmosphere',
    'lunar-new-year': 'festive Lunar New Year celebration with red lanterns, paper decorations, zodiac elements, and traditional decor',
    // Legacy fallback
    'holiday': 'festive holiday setting with decorations, twinkling lights, and celebratory atmosphere',
    // Seasons
    'winter-wonderland': 'magical winter wonderland with snow-covered trees, soft snowfall, cozy cabin setting, warm lighting through frosted windows',
    'spring-garden': 'beautiful spring garden with blooming cherry blossoms, tulips, fresh green grass, and soft morning sunlight',
    'summer-beach': 'sunny summer beach scene with palm trees, ocean waves, golden sand, and bright tropical atmosphere',
    'autumn-harvest': 'warm autumn harvest setting with colorful fall leaves, pumpkins, hay bales, and golden hour lighting',
    // Professional
    'corporate-headshot': 'professional corporate headshot studio with clean neutral background, perfect studio lighting, executive portrait setting',
    'linkedin-profile': 'professional LinkedIn photo studio with soft gray or blue gradient background, approachable business atmosphere',
    'business-casual': 'modern office environment with contemporary decor, natural lighting, professional yet relaxed atmosphere',
    'executive-portrait': 'premium executive portrait studio with elegant backdrop, dramatic lighting, powerful and distinguished setting',
    'realtor-photo': 'professional realtor headshot setting with warm welcoming atmosphere, clean modern background',
    'author-photo': 'thoughtful author portrait setting with subtle bookshelf or textured background, intellectual atmosphere',
    'speaker-portrait': 'dynamic speaker portrait setting with conference or stage backdrop, confident and engaging atmosphere',
    'medical-professional': 'clean medical professional portrait setting with subtle healthcare environment, trustworthy atmosphere',
    'legal-professional': 'distinguished legal professional portrait setting with elegant law office backdrop, prestigious atmosphere',
    'creative-professional': 'modern creative professional portrait setting with artistic backdrop, contemporary and stylish atmosphere',
    'tech-startup': 'casual tech startup portrait setting with modern office or workspace backdrop, innovative and approachable atmosphere',
    'academic-portrait': 'scholarly academic portrait setting with library or campus backdrop, intellectual and distinguished atmosphere',
    // Education Class Portrait Scenes
    'classroom-portrait': 'traditional classroom setting with student desks arranged in rows, green chalkboard with colorful chalk writing, educational posters on walls, alphabet chart, soft fluorescent lighting, welcoming school atmosphere',
    'formal-group': 'professional school portrait studio with clean neutral gray backdrop, balanced lighting, timeless yearbook-ready composition',
    'campus-outdoors': 'outdoor school campus courtyard with school building entrance visible, green grass, mature trees, natural sunlight, casual academic atmosphere',
    'grade-level-theme': 'age-appropriate school setting matching grade level, elementary with bright colors and alphabet decorations, or high school with mature academic decor',
    'teacher-and-class': 'warm classroom setting with teacher desk visible, students arranged around teacher, mentor and students together, collaborative learning atmosphere',
    'achievement-class': 'honor class achievement setting with gold star decorations, achievement banners, recognition ribbons, proud moment celebration, excellence atmosphere',
    'school-identity': 'school-branded setting with school colors prominently displayed, school crest or mascot visible, institutional pride, academic tradition atmosphere',
    'fun-friendly': 'bright fun elementary classroom with colorful decorations, friendly shapes on walls, rainbow elements, happy learning atmosphere, child-friendly environment',
    'minimal-portrait': 'clean minimal school portrait studio with simple white or soft gray backdrop, distraction-free, professional neutral lighting, gallery-ready quality',
  };

  // Blast from the Past scene overrides - when style IS the scene
  const blastFromPastSceneOverrides: Record<string, string> = {
    // TV Show Sets
    'tv-sitcom-living-room': 'classic 1980s-90s TV sitcom living room set with studio lighting, plush couch, coffee table, family photos on wall, warm sitcom atmosphere',
    'tv-fresh-prince': 'HYPER-DETAILED Fresh Prince of Bel-Air mansion interior: massive grand curved staircase with ornate colorful geometric patterned carpet runner, two-story open foyer with cream marble columns, vibrant pop art paintings on walls in gold frames, lush green tropical plants in large pots, professional pool table with green felt, luxurious teal velvet couch, ornate Persian area rug with intricate patterns, warm golden lighting, wealthy Bel-Air mansion aesthetic, 90s sitcom TV set quality production design',
    'tv-family-matters': 'Family Matters style Winslow family living room in Chicago, cozy 90s suburban home with plaid couch, warm wood tones, family photos, welcoming atmosphere',
    'tv-cosby-show': 'Cosby Show style elegant brownstone living room with 80s decor, earth tones, artwork on walls, sophisticated Brooklyn family home aesthetic',
    'tv-good-times': 'Good Times style Chicago apartment, 1970s urban apartment with modest furnishings, African art on walls, warm community feeling, vintage 70s decor',
    'tv-martin': 'Martin style 90s Detroit apartment with funky colorful decor, bachelor pad vibes, bright walls, urban 90s style, fun energetic atmosphere',
    'tv-old-western': 'dusty Old West frontier town main street with wooden saloon building, swinging doors, hitching posts with horses, desert mountains in background, 1800s Wild West atmosphere',
    // Era styles
    'retro-70s': 'groovy 1970s living room with orange shag carpet, wood paneling, lava lamps, beaded curtains, earth tones, disco era aesthetic',
    'retro-80s': 'vibrant 1980s room with neon colors, geometric patterns, MTV posters, VHS tapes, synth wave aesthetic, Miami Vice vibes',
    'retro-90s': '1990s room with grunge posters, bean bag chairs, CD player, desaturated colors, casual 90s aesthetic',
    // Music & Hip Hop
    'hip-hop-crew': 'urban street scene with graffiti-covered brick wall, boombox on ground, city skyline in background, classic 80s-90s hip hop photo shoot location',
    'album-cover-90s': 'professional 90s R&B/Hip Hop album cover photo studio with dramatic lighting, smoke effects, sleek urban backdrop',
    'rap-group-pose': 'iconic urban cityscape with skyscrapers, rooftop setting, golden hour lighting, legendary hip hop photo location',
    'soul-train': 'Soul Train dance floor and stage with disco ball, colorful lights, 70s-80s dance show set, funky backdrop',
    'music-video-set': '90s music video set with dramatic lighting, smoke machines, stylish urban warehouse backdrop, MTV era production aesthetic',
    // Photo styles
    'polaroid': 'nostalgic scene captured in classic Polaroid instant photo style with white border',
    'sepia-classic': 'timeless antique setting with warm sepia tones',
    'faded-film': 'dreamy vintage scene with faded colors and light leaks',
    'vintage-portrait': 'classic family portrait studio from the 1970s-80s with soft backdrop',
    'school-photo-day': 'classic school photo day studio with blue or gray gradient backdrop, professional portrait lighting',
    'mall-photo-booth': 'fun 80s-90s mall photo booth or Glamour Shots studio with colorful props and backdrops',
    'awkward-portrait': 'classic 1980s-90s department store portrait studio with cheesy laser beam or gradient backdrop in blue purple and pink colors, soft diffused studio lighting, fake nature props or abstract geometric shapes, JCPenney Sears portrait studio aesthetic',
  };

  // Blast from the Past style-specific outfit overrides
  const blastFromPastOutfits: Record<string, string> = {
    'retro-70s': 'groovy 1970s fashion, bell bottoms, platform shoes, earth tones, disco era style',
    'retro-80s': 'bold 1980s fashion, bright neon colors, shoulder pads, Members Only jacket, leg warmers',
    'retro-90s': '1990s hip hop fashion, baggy jeans, Jordans, oversized t-shirt, snapback cap',
    'tv-sitcom-living-room': 'casual 90s family sitcom attire, cozy sweaters, comfortable family-friendly clothing',
    'tv-fresh-prince': 'Fresh Prince style 90s fashion, colorful bold patterns, high-top sneakers, funky urban style',
    'tv-family-matters': 'wholesome 90s family attire, colorful sweaters, clean-cut suburban style',
    'tv-cosby-show': 'stylish 80s professional casual attire, colorful sweaters, refined family fashion',
    'tv-good-times': '1970s urban fashion, bell bottoms, dashikis, Afrocentric style, colorful 70s patterns',
    'tv-martin': '90s hip casual style, colorful button-up shirts, fresh urban fashion, Detroit style',
    'tv-old-western': 'authentic Old West frontier clothing, cowboy hat, leather vest, bandana, boots with spurs, rugged pioneer attire',
    'hip-hop-crew': 'classic hip hop fashion, Adidas tracksuit, gold chain, Kangol hat, fresh Jordans, B-boy style',
    'album-cover-90s': 'sleek 90s R&B fashion, leather jacket, stylish urban wear, album cover ready',
    'rap-group-pose': 'matching hip hop crew outfits, coordinated colors, gold chains, iconic streetwear',
    'soul-train': 'funky Soul Train fashion, bell bottoms, platform shoes, disco glam, 70s dance show style',
    'music-video-set': '90s music video fashion, stylish urban wear, leather, bold accessories, MTV ready',
    'school-photo-day': 'classic school photo attire, neat collared shirt, school-appropriate formal wear',
    'mall-photo-booth': '80s-90s mall fashion, denim jacket, colorful patterns, Glamour Shots ready style',
    'awkward-portrait': 'awkward matching family outfits from the 1980s-90s, turtleneck sweaters or denim shirts, matching color-coordinated outfits, puffy sleeves, permed hair styles, classic department store portrait fashion',
  };

  const styleDescriptions: Record<string, string> = {
    'watercolor': 'artistic watercolor painting style with soft edges and flowing colors',
    'cartoon': 'fun cartoon illustration style with bold outlines and vibrant colors',
    'studio-photo': 'professional studio photography with perfect lighting and high resolution',
    'oil-painting': 'classic oil painting style with rich textures and warm tones',
    'digital-art': 'modern digital art style with clean lines and vivid colors',
    'vintage': 'nostalgic vintage photograph style with warm sepia tones',
  };

  // Determine the actual scene description
  let sceneDesc: string;
  let styleDesc: string;
  
  if (scene === 'blast-from-past' && blastFromPastSceneOverrides[style]) {
    // For blast-from-past, the style defines the scene
    sceneDesc = blastFromPastSceneOverrides[style];
    // Use a photo-realistic style for blast-from-past scenes to preserve faces
    styleDesc = 'photorealistic family portrait with natural lighting, authentic faces exactly matching the reference photos';
  } else {
    sceneDesc = sceneDescriptions[scene] || sceneDescriptions['studio'];
    styleDesc = styleDescriptions[style] || styleDescriptions['studio-photo'];
  }

  // Build the subjects section based on what's selected
  let subjectsSection = '';
  if (people.length > 0) {
    subjectsSection += `PEOPLE TO INCLUDE (copy their exact appearance from the reference photos):
${peopleDetails}`;
  }
  if (pets.length > 0) {
    if (people.length > 0) subjectsSection += '\n\n';
    subjectsSection += `PETS TO INCLUDE (reproduce their exact appearance from the reference photos):
${petDetails}`;
  }

  // Check if any braces removal is needed
  const peopleNeedingBracesRemoval = people.filter(p => removeBracesIds.includes(p.id));
  const bracesRemovalCritical = peopleNeedingBracesRemoval.length > 0
    ? `\n- MANDATORY: Remove dental braces from teeth - show natural brace-free teeth`
    : '';

  // Build a simplified, direct prompt like Festive Transform uses (which produces better quality)
  const subjectCount = people.length + pets.length;
  const subjectDescription = [
    people.length > 0 ? `${people.length} ${people.length === 1 ? 'person' : 'people'}` : '',
    pets.length > 0 ? `${pets.length} ${pets.length === 1 ? 'pet' : 'pets'}` : ''
  ].filter(Boolean).join(' and ');

  // Context-appropriate language based on category
  let portraitType: string;
  let groupDescription: string;
  let posingInstruction: string;
  
  if (category === 'education') {
    portraitType = 'class portrait';
    groupDescription = 'students and classmates';
    posingInstruction = 'Place everyone as classmates standing or sitting naturally side by side with appropriate personal space between them, like a typical school class photo. They should look friendly but professional - no touching, holding hands, or romantic poses.';
  } else if (category === 'business') {
    portraitType = 'professional team portrait';
    groupDescription = 'colleagues and team members';
    posingInstruction = 'Place everyone as professional colleagues standing or sitting naturally side by side with appropriate personal space between them. They should look confident and professional - formal business poses without intimate contact.';
  } else {
    // loved-ones - family/romantic context is appropriate
    portraitType = 'family portrait';
    groupDescription = 'family members';
    posingInstruction = 'Place everyone naturally together in the scene as a warm family group.';
  }

  let prompt = `Transform these ${subjectCount} reference photos into a beautiful ${portraitType} in ${sceneDesc}.

Keep each person and pet as clearly recognizable with their faces prominently featured, exactly as they appear in their reference photos.
${posingInstruction}${bracesRemovalCritical}
${pets.length > 0 && petAccessory ? `Pets should ${petAccessory}.` : ''}

${styleDesc}.
High quality, photorealistic result with detailed background, professional lighting, and rich textures.
Suitable for printing and framing.`;

  if (keepOutfits) {
    prompt += `\n- Keep each person's original clothing and outfits from their source photos`;
  } else {
    // Scene-specific outfit recommendations
    const outfitSuggestions: Record<string, string> = {
      // Classic Scenes
      'studio': 'elegant matching formal wear (suits, dresses, or coordinated colors)',
      'living-room': 'comfortable matching casual wear (sweaters, nice shirts, coordinated colors)',
      'outdoors': 'casual coordinated outdoor wear (khakis, polo shirts, summer dresses)',
      'beach': 'casual beach attire (Hawaiian shirts, sundresses, swimwear coverups)',
      'garden': 'elegant garden party attire (floral dresses, linen suits, light colors)',
      // Life Events
      'birthday': 'festive party outfits (bright coordinated colors, party wear)',
      'graduation': 'formal graduation attire (caps and gowns, formal suits and dresses)',
      'wedding': 'formal wedding attire (elegant suits, formal dresses, wedding party colors)',
      'baby-shower': 'soft pastel coordinated outfits (light blues, pinks, yellows)',
      'anniversary': 'elegant romantic attire (matching formal wear, coordinated romantic colors)',
      'retirement': 'smart casual celebratory attire (blazers, elegant dresses, coordinated colors)',
      // Major Holidays
      'christmas': 'festive Christmas outfits (matching Christmas sweaters, red and green, holiday dresses)',
      'hanukkah': 'elegant Hanukkah attire (blue and silver colors, formal wear)',
      'kwanzaa': 'traditional Kwanzaa attire (African-inspired patterns, red/black/green colors)',
      'new-years': 'glamorous New Year\'s Eve attire (sparkly dresses, formal suits, gold/silver accents)',
      'thanksgiving': 'warm autumn coordinated outfits (earth tones, cozy sweaters, fall colors)',
      'easter': 'elegant Easter Sunday attire (pastel dresses, spring suits, light colors)',
      'passover': 'elegant formal attire for Seder (nice dresses, suits, traditional modest wear)',
      'halloween': 'fun Halloween costumes or festive orange and black outfits',
      'fourth-of-july': 'patriotic red, white and blue coordinated outfits',
      'valentines': 'romantic Valentine\'s attire (red, pink, and heart-themed outfits)',
      'mothers-day': 'elegant spring attire (floral dresses, nice blouses, soft colors)',
      'fathers-day': 'smart casual attire (polo shirts, blazers, coordinated family colors)',
      'st-patricks': 'festive green-themed outfits with shamrock accessories',
      'cinco-de-mayo': 'colorful festive Mexican-inspired attire with bright colors',
      'diwali': 'beautiful traditional Indian attire (sarees, kurtas, festive colors)',
      'eid': 'elegant traditional attire for Eid celebration',
      'lunar-new-year': 'festive red and gold traditional attire for Lunar New Year',
      // Legacy fallback
      'holiday': 'festive holiday outfits (matching sweaters, coordinated holiday colors)',
    };
    
    // Use Blast from the Past specific outfit if applicable
    let suggestedOutfit: string;
    if (scene === 'blast-from-past' && blastFromPastOutfits[style]) {
      suggestedOutfit = blastFromPastOutfits[style];
    } else {
      suggestedOutfit = outfitSuggestions[scene] || 'coordinated matching outfits appropriate for the scene';
    }
    
    prompt += `\nDress everyone in ${suggestedOutfit}. Complete outfits with proper tops and bottoms (pants, skirt, or dress).`;
  }

  // Add braces removal instruction if specified
  if (removeBracesIds.length > 0) {
    const peopleWithBracesRemoval = people.filter(p => removeBracesIds.includes(p.id));
    if (peopleWithBracesRemoval.length > 0) {
      const bracesNames = peopleWithBracesRemoval.map(p => p.name || p.description.split(',')[0]).join(', ');
      prompt += `

DENTAL BRACES REMOVAL:
- For the following people, remove any dental braces and show them with a natural, brace-free smile: ${bracesNames}
- Their teeth should look natural and healthy without any orthodontic hardware
- All other aspects of their appearance should remain exactly the same`;
    }
  }

  // Add special instructions if provided
  if (specialInstructions && specialInstructions.trim()) {
    prompt += `

SPECIAL INSTRUCTIONS FROM USER:
${specialInstructions.trim()}`;
  }

  return prompt;
}
