// import axios from 'axios';

// const SUNO_API_KEY = process.env.SUNO_API_KEY;
// const SUNO_API_BASE_URL = 'https://api.sunoapi.org';

// interface GenerateSongParams {
//   recipientName: string;
//   relationship: string;
//   occasion?: string;
//   tone: string;
//   genre?: string;
//   interests?: string;
//   insideJokes?: string;
//   customLyrics?: string;
//   customTitle?: string;
// }

// interface SunoGenerateResponse {
//   code: number;
//   msg: string;
//   data: {
//     taskId: string;
//   };
// }

// interface SunoTaskResponse {
//   code: number;
//   msg: string;
//   data: {
//     taskId: string;
//     status: 'SUCCESS' | 'GENERATING' | 'FAILED' | 'WAITING' | 'IN_QUEUE' | 'CREATED' | 'TEXT_SUCCESS' | 'FIRST_SUCCESS' | 'PENDING' | 'GENERATE_AUDIO_FAILED';
//     response?: {
//       sunoData: Array<{
//         id: string;
//         audioUrl: string;
//         title: string;
//         tags: string;
//         duration: number;
//         prompt?: string;
//         imageUrl?: string;
//       }>;
//     };
//     errorMessage?: string;
//     errorCode?: number;
//   };
// }

// interface SunoConcatResponse {
//   code: number;
//   msg: string;
//   data: {
//     taskId: string;
//   };
// }

// async function pollTaskStatus(taskId: string, maxAttempts = 90): Promise<SunoTaskResponse['data']['response']> {
//   let lastStatus: string = 'UNKNOWN';
//   let lastError: string | undefined;

//   for (let i = 0; i < maxAttempts; i++) {
//     if (i > 0) {
//       await new Promise(resolve => setTimeout(resolve, 10000));
//     }

//     const response = await axios.get<SunoTaskResponse>(
//       `${SUNO_API_BASE_URL}/api/v1/generate/record-info`,
//       {
//         params: { taskId },
//         headers: {
//           'Authorization': `Bearer ${SUNO_API_KEY}`,
//         }
//       }
//     );

//     if (response.data.code !== 200) {
//       throw new Error(response.data.msg || 'Failed to query task status');
//     }

//     if (i === 0 || i === 8) {
//       console.log(`[Suno Debug] Full response at poll ${i + 1}:`, JSON.stringify(response.data, null, 2));
//     }

//     const { status, response: taskResponse, errorMessage } = response.data.data;
//     lastStatus = status;
//     lastError = errorMessage;

//     const dataCount = taskResponse?.sunoData?.length || 0;
//     const hasAudioUrl = taskResponse?.sunoData?.[0]?.audioUrl ? 'YES' : 'NO';
//     console.log(`[Suno Poll ${i + 1}/${maxAttempts}] Status: ${status}, Data items: ${dataCount}, Audio URL: ${hasAudioUrl} for taskId: ${taskId}`);

//     if (status === 'SUCCESS' && taskResponse?.sunoData && taskResponse.sunoData.length > 0) {
//       const firstTrack = taskResponse.sunoData[0];
//       if (firstTrack.audioUrl) {
//         console.log(`[Suno] Song generation completed successfully with audio URL!`);
//         return taskResponse;
//       } else {
//         console.log(`[Suno] Status is SUCCESS but audioUrl not ready yet, continuing to poll...`);
//       }
//     }

//     if (status === 'FAILED' || status === 'GENERATE_AUDIO_FAILED') {
//       console.error(`[Suno] Song generation failed: ${errorMessage}`);
//       throw new Error(errorMessage || 'Song generation failed');
//     }
//   }

//   const timeoutMessage = `Song generation timed out after 15 minutes. Last status: ${lastStatus}${lastError ? `. Error: ${lastError}` : ''}`;
//   console.error(`[Suno] ${timeoutMessage}`);
//   throw new Error(timeoutMessage);
// }

// async function extendSong(params: {
//   audioId: string;
//   continueAt: number;
//   prompt: string;
//   style: string;
//   title: string;
// }): Promise<{ audioId: string; audioUrl: string; duration: number }> {
//   console.log(`[Suno Extend] Starting extension from ${params.continueAt}s for audioId: ${params.audioId}`);

//   const callbackUrl = process.env.REPL_SLUG
//     ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/suno-callback`
//     : 'https://example.com/callback';

//   const response = await axios.post<SunoGenerateResponse>(
//     `${SUNO_API_BASE_URL}/api/v1/generate/extend`,
//     {
//       audioId: params.audioId,
//       model: 'V4',
//       continueAt: params.continueAt,
//       prompt: params.prompt,
//       style: params.style,
//       title: params.title,
//       defaultParamFlag: true,
//       callBackUrl: callbackUrl
//     },
//     {
//       headers: {
//         'Authorization': `Bearer ${SUNO_API_KEY}`,
//         'Content-Type': 'application/json'
//       }
//     }
//   );

//   if (response.data.code !== 200) {
//     throw new Error(response.data.msg || 'Failed to extend song');
//   }

//   const taskId = response.data.data.taskId;
//   console.log(`[Suno Extend] Extension started with taskId: ${taskId}`);

//   const result = await pollTaskStatus(taskId);

//   if (!result || !result.sunoData || result.sunoData.length === 0) {
//     throw new Error('No audio data returned from Suno extend API');
//   }

//   const track = result.sunoData[0];
//   console.log(`[Suno Extend] Extension completed: ${track.duration}s`);

//   return {
//     audioId: track.id,
//     audioUrl: track.audioUrl,
//     duration: track.duration
//   };
// }

// async function concatenateClips(clipIds: string[]): Promise<string> {
//   console.log(`[Suno Concat] Concatenating ${clipIds.length} clips:`, clipIds);

//   const response = await axios.post<SunoConcatResponse>(
//     `${SUNO_API_BASE_URL}/api/v1/generate/concat`,
//     {
//       clipId: clipIds[0],
//     },
//     {
//       headers: {
//         'Authorization': `Bearer ${SUNO_API_KEY}`,
//         'Content-Type': 'application/json'
//       }
//     }
//   );

//   if (response.data.code !== 200) {
//     throw new Error(response.data.msg || 'Failed to concatenate clips');
//   }

//   const taskId = response.data.data.taskId;
//   console.log(`[Suno Concat] Concatenation started with taskId: ${taskId}`);

//   const result = await pollTaskStatus(taskId, 60);

//   if (!result || !result.sunoData || result.sunoData.length === 0) {
//     throw new Error('No audio data returned from Suno concat API');
//   }

//   const finalTrack = result.sunoData[0];
//   console.log(`[Suno Concat] Final song duration: ${finalTrack.duration}s`);

//   return finalTrack.audioUrl;
// }

// // Map genres to more descriptive style strings for better AI music generation
// // Note: Suno has a tag length limit, so keep styles concise
// // Genre comes FIRST to ensure it's the dominant style influence
// function getDetailedStyle(genre: string, tone: string): string {
//   // For gospel genres, we use very specific tags without mixing in generic tones
//   // that might confuse the AI (like "heartfelt" which can sound country)
//   const genreStyles: Record<string, string> = {
//     'gospel': 'gospel choir, church organ, spiritual, uplifting',
//     'black-gospel': 'BLACK GOSPEL CHOIR, female African American vocals, 12/8 worship groove, call and response, Hammond B3, tambourine, praise break',
//     'christmas': 'Christmas carol, holiday bells, festive choir',
//     'pop': `${tone} pop, catchy, modern`,
//     'rock': `${tone} rock, electric guitar, drums`,
//     'country': `${tone} country, acoustic guitar, Nashville`,
//     'r&b': `${tone} R&B, smooth, neo-soul`,
//     'rap': `${tone} hip hop, rap, 808 beats`,
//     'ballad': `${tone} ballad, piano, emotional, slow`
//   };

//   // For gospel genres, don't mix in the tone as it can override the gospel sound
//   if (genre === 'gospel' || genre === 'black-gospel') {
//     return genreStyles[genre];
//   }

//   return genreStyles[genre] || `${tone} pop, catchy`;
// }

// // Generate song with provided lyrics (no OpenAI lyrics generation) - Extended version (~3 minutes)
// export async function generateSongWithLyrics(params: {
//   title: string;
//   lyrics: string;
//   tone: string;
//   genre?: string;
//   additionalNotes?: string;
// }): Promise<{ audioUrl: string; lyrics: string; title: string; coverImage?: string }> {
//   if (!SUNO_API_KEY) {
//     throw new Error('SUNO_API_KEY is not configured. Please add it to Replit Secrets.');
//   }

//   try {
//     const callbackUrl = process.env.REPL_SLUG
//       ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/suno-callback`
//       : 'https://example.com/callback';

//     // Check if additional notes contain style override (look for "style:" prefix)
//     let style: string;
//     const styleMatch = params.additionalNotes?.match(/style:\s*(.+?)(?:\n|$)/i);

//     if (styleMatch && styleMatch[1]) {
//       // Use the custom style from notes, trim to avoid tag length issues
//       style = styleMatch[1].trim().substring(0, 100);
//       console.log(`[Suno] Using CUSTOM style from notes: ${style}`);
//     } else {
//       // Use detailed style based on genre
//       style = getDetailedStyle(params.genre || 'pop', params.tone);
//       console.log(`[Suno] Using auto-generated style: ${style}`);
//     }

//     // Step 1: Generate initial clip (uses V4 for longer initial output)
//     console.log(`[Suno] Starting extended song generation (~3 minutes) for: ${params.title}`);

//     const response = await axios.post<SunoGenerateResponse>(
//       `${SUNO_API_BASE_URL}/api/v1/generate`,
//       {
//         prompt: params.lyrics,
//         style: style,
//         title: params.title,
//         customMode: true,
//         instrumental: false,
//         model: 'V4',
//         callBackUrl: callbackUrl
//       },
//       {
//         headers: {
//           'Authorization': `Bearer ${SUNO_API_KEY}`,
//           'Content-Type': 'application/json'
//         }
//       }
//     );

//     if (response.data.code !== 200) {
//       throw new Error(response.data.msg || 'Failed to generate song');
//     }

//     const taskId = response.data.data.taskId;
//     console.log(`[Suno] Initial clip generation started with taskId: ${taskId}`);

//     const initialResult = await pollTaskStatus(taskId);

//     if (!initialResult || !initialResult.sunoData || initialResult.sunoData.length === 0) {
//       throw new Error('No audio data returned from Suno API');
//     }

//     const initialTrack = initialResult.sunoData[0];
//     const initialDuration = initialTrack.duration || 60;
//     console.log(`[Suno] Initial clip completed: ${initialDuration}s, ID: ${initialTrack.id}`);

//     // Target: ~180 seconds (3 minutes)
//     const targetDuration = 180;
//     let currentDuration = initialDuration;
//     let currentAudioId = initialTrack.id;
//     let clipIds = [initialTrack.id];
//     let extensionCount = 0;
//     const maxExtensions = 3;

//     // Step 2: Extend until we reach target duration
//     while (currentDuration < targetDuration && extensionCount < maxExtensions) {
//       extensionCount++;
//       const continueAt = Math.max(currentDuration - 10, 30);

//       console.log(`[Suno] Extension ${extensionCount}: Current duration ${currentDuration}s, continuing from ${continueAt}s`);

//       try {
//         const extension = await extendSong({
//           audioId: currentAudioId,
//           continueAt: continueAt,
//           prompt: `Continue the song with the same style and energy. ${params.lyrics.slice(0, 200)}...`,
//           style: style,
//           title: `${params.title} Part ${extensionCount + 1}`
//         });

//         currentAudioId = extension.audioId;
//         currentDuration += extension.duration - (currentDuration - continueAt);
//         clipIds.push(extension.audioId);

//         console.log(`[Suno] Extension ${extensionCount} completed. New total duration: ~${currentDuration}s`);
//       } catch (extendError: any) {
//         console.error(`[Suno] Extension ${extensionCount} failed:`, extendError.message);
//         break;
//       }
//     }

//     // Step 3: Get final audio URL
//     let finalAudioUrl = initialTrack.audioUrl;

//     if (clipIds.length > 1) {
//       try {
//         console.log(`[Suno] Concatenating ${clipIds.length} clips into final song...`);
//         finalAudioUrl = await concatenateClips(clipIds);
//       } catch (concatError: any) {
//         console.error(`[Suno] Concatenation failed, using last extension:`, concatError.message);
//         const lastResult = await pollTaskStatus(taskId);
//         if (lastResult?.sunoData?.[0]?.audioUrl) {
//           finalAudioUrl = lastResult.sunoData[0].audioUrl;
//         }
//       }
//     }

//     console.log(`[Suno] Extended song generation completed! Final URL ready.`);

//     return {
//       audioUrl: finalAudioUrl,
//       lyrics: params.lyrics,
//       title: params.title,
//       coverImage: initialTrack.imageUrl
//     };
//   } catch (error: any) {
//     console.error('Suno API error:', error.response?.data || error.message);

//     if (error.response?.status === 401) {
//       throw new Error('Invalid Suno API key. Please check your SUNO_API_KEY in Replit Secrets.');
//     }

//     if (error.response?.status === 429) {
//       throw new Error('Insufficient credits or rate limit exceeded.');
//     }

//     throw new Error(error.response?.data?.msg || error.message || 'Failed to generate song with Suno API');
//   }
// }

// export async function generateSong(params: GenerateSongParams): Promise<{ audioUrl: string; lyrics: string; title: string; coverImage?: string }> {
//   if (!SUNO_API_KEY) {
//     throw new Error('SUNO_API_KEY is not configured. Please add it to Replit Secrets.');
//   }

//   // If custom lyrics provided, use them directly
//   if (params.customLyrics && params.customTitle) {
//     console.log(`[Suno] Using custom lyrics provided by user for: ${params.customTitle}`);
//     return generateSongWithLyrics({
//       title: params.customTitle,
//       lyrics: params.customLyrics,
//       tone: params.tone,
//       genre: params.genre,
//     });
//   }

//   // Otherwise, generate lyrics using OpenAI
//   const { generateSongLyrics } = await import('./openaiService');

//   const songLyrics = await generateSongLyrics({
//     recipientName: params.recipientName,
//     relationship: params.relationship,
//     occasion: params.occasion,
//     tone: params.tone,
//     genre: params.genre || 'pop',
//     interests: params.interests,
//     insideJokes: params.insideJokes,
//   });

//   // Use generateSongWithLyrics for extended song generation
//   return generateSongWithLyrics({
//     title: songLyrics.title,
//     lyrics: songLyrics.lyrics,
//     tone: params.tone,
//     genre: params.genre,
//   });
// }

// sunoService.ts




import axios from "axios";

const SUNO_API_KEY = process.env.SUNO_API_KEY;
const SUNO_API_BASE_URL = "https://api.sunoapi.org";

interface GenerateSongParams {
  recipientName: string;
  relationship: string;
  occasion?: string;
  tone: string;
  genre?: string;
  voice?: string;
  interests?: string;
  insideJokes?: string;
  customLyrics?: string;
  customTitle?: string;
  additionalNotes?: string;
  customMessage?: string;
  duration?: 'quick' | 'extended';
}

interface SunoGenerateResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
  };
}

interface SunoTaskResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    status:
      | "SUCCESS"
      | "GENERATING"
      | "FAILED"
      | "WAITING"
      | "IN_QUEUE"
      | "CREATED"
      | "TEXT_SUCCESS"
      | "FIRST_SUCCESS"
      | "PENDING"
      | "GENERATE_AUDIO_FAILED";
    response?: {
      sunoData: Array<{
        id: string;
        audioUrl: string;
        title: string;
        tags: string;
        duration: number;
        prompt?: string;
        imageUrl?: string;
      }>;
    };
    errorMessage?: string;
    errorCode?: number;
  };
}

interface SunoConcatResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
  };
}

interface SunoBoostStyleResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    param: string;
    result: string;
    creditsConsumed: number;
    creditsRemaining: number;
    successFlag: string;
    errorCode?: number;
    errorMessage?: string;
    createTime: string;
  };
}

// Detailed descriptions for rap sub-genres to be boosted by V4.5
const rapSubGenreDescriptions: Record<string, string> = {
  "trap": "140 BPM trap with heavy 808 sub bass, triplet hi-hat rolls, dark synths, aggressive MC rap verses with no melodic singing, Future/Young Thug style",
  "boom-bap": "92 BPM boom bap with punchy MPC drums, soul sample chops, vinyl scratches, lyrical MC rap verses with no singing, 90s NYC golden era style",
  "conscious-rap": "88 BPM conscious hip-hop with live jazz samples, soulful production, thoughtful MC rap verses with no singing, Common/Talib Kweli style",
  "gangsta-rap": "94 BPM gangsta rap with G-funk synths, hard drums, deep bass, deep aggressive street-hardened voice, intimidating gangsta flow, West Coast drawl, no melodic singing, Ice Cube/Eazy-E style",
  "melodic-rap": "130 BPM melodic rap with auto-tune, emotional melodies, lush pads, trap beats, singing-rap hybrid delivery, Drake/Juice WRLD style",
  "old-school-rap": "98 BPM old school hip-hop with breakbeats, turntable scratches, 808 drums, classic MC rap verses with no singing, Run DMC style",
  "southern-rap": "SOUTHERN HIP HOP 85 BPM, heavy trunk-rattling 808 bass, snappy snare, bouncy rhythmic drums, synth stabs and brass hits, crunk energy, CONFIDENT SOUTHERN MALE RAPPER with drawled delivery and regional slang, call-response chant hooks, laid-back but hard-hitting flow, NO SINGING NO MELODIC HOOKS NO AUTO-TUNE, dirty south Atlanta Houston Memphis style, Outkast UGK Three 6 Mafia inspired",
  "east-coast-rap": "90s EAST COAST BOOM BAP 92 BPM classic swing, hard punchy kick, hard snare on 2 and 4, tight minimal hi-hats NO ROLLS, sampled upright bass steady NO SLIDES, jazz soul vinyl loops minor-key piano chops low-pass filtered with vinyl crackle, DJ scratches and vocal cuts, CONFIDENT GRITTY ARTICULATE NYC MALE RAPPER dry vocals no reverb, bar-heavy punchline-driven cadence controlled intensity, dense uninterrupted rap verses minimal hook, NO TRAP DRUMS NO DRILL BASS NO SINGING NO MELODIC HOOKS NO AUTO-TUNE NO POP STRUCTURE, raw East Coast lyricism boom bap cypher energy",
  "west-coast-rap": "90 BPM West Coast G-funk with Moog synths, talk-box, Parliament bass, laid-back MC rap verses with no melodic singing, Dr. Dre production style",
  "drill": "140 BPM DRILL RAP, heavy sliding 808 bass, dark minimal production in minor key, sparse eerie piano and bell melodies, aggressive punchy drums, monotone deadpan cold delivery, talk-rap with NO SINGING, ad-libs grunts and threats, simple repetitive hook, short punchy verses, raw gritty street energy",
};

// Cache for boosted styles to avoid redundant API calls
const boostedStyleCache: Map<string, { style: string; timestamp: number }> = new Map();
const CACHE_DURATION_MS = 1000 * 60 * 60; // 1 hour cache

/**
 * Boost Music Style using V4.5's enhanced style capability.
 * Takes a style description and returns an enhanced, more detailed version.
 */
async function boostMusicStyle(styleDescription: string): Promise<string> {
  // Check cache first
  const cacheKey = styleDescription.toLowerCase().trim();
  const cached = boostedStyleCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    console.log(`[Suno] Using cached boosted style for: ${cacheKey.substring(0, 30)}...`);
    return cached.style;
  }

  try {
    console.log(`[Suno Boost] Boosting style: ${styleDescription.substring(0, 50)}...`);
    
    const response = await axios.post<SunoBoostStyleResponse>(
      `${SUNO_API_BASE_URL}/api/v1/style/generate`,
      {
        content: styleDescription,
      },
      {
        headers: {
          Authorization: `Bearer ${SUNO_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 60000, // 60 second timeout
      }
    );

    if (response.data.code !== 200) {
      console.error(`[Suno Boost] API returned error: ${response.data.msg}`);
      return styleDescription; // Fall back to original
    }

    const boostedStyle = response.data.data.result;
    if (!boostedStyle) {
      console.warn(`[Suno Boost] No result returned, using original`);
      return styleDescription;
    }

    console.log(`[Suno Boost] Success! Boosted style: ${boostedStyle.substring(0, 80)}...`);
    
    // Cache the result
    boostedStyleCache.set(cacheKey, { style: boostedStyle, timestamp: Date.now() });
    
    return boostedStyle;
  } catch (error: any) {
    console.error(`[Suno Boost] Error boosting style: ${error.message}`);
    return styleDescription; // Fall back to original on error
  }
}

/**
 * Get a detailed style description for rap sub-genres.
 * Returns null if the genre is not a recognized rap sub-genre.
 */
function getRapSubGenreStyle(genre: string): string | null {
  const normalized = genre.toLowerCase().trim();
  
  // Direct key lookup for resolved genres like "trap-rap", "boom-bap-rap", etc.
  const resolvedKeyMatch = normalized.match(/^(.+?)-rap$/);
  if (resolvedKeyMatch) {
    const subGenreKey = resolvedKeyMatch[1];
    if (rapSubGenreDescriptions[subGenreKey]) {
      return rapSubGenreDescriptions[subGenreKey];
    }
  }
  
  // Check for rap sub-genre patterns in the key names
  for (const [key, description] of Object.entries(rapSubGenreDescriptions)) {
    if (normalized.includes(key) || normalized.includes(key.replace('-', ' '))) {
      return description;
    }
  }
  
  // Check for specific formatted patterns like "Trap Rap", "Old School Rap"
  const subGenreMatch = normalized.match(/^(.+?)\s*rap$/);
  if (subGenreMatch) {
    const subGenre = subGenreMatch[1].trim().replace(/\s+/g, '-');
    if (rapSubGenreDescriptions[subGenre]) {
      return rapSubGenreDescriptions[subGenre];
    }
  }
  
  return null;
}

/**
 * Check if a genre is any type of rap sub-genre.
 */
function isRapSubGenre(genre: string): boolean {
  const normalized = genre.toLowerCase().trim();
  return normalized.includes('rap') || 
         normalized.includes('hip-hop') || 
         normalized.includes('hip hop') ||
         normalized.includes('trap') ||
         normalized.includes('drill') ||
         normalized.includes('boom-bap') ||
         normalized.includes('boom bap');
}

/**
 * Resolve the genre into a canonical key that matches our style map.
 * - Any "gospel-like" genre → "black-gospel"
 * - Normalizes things like "hip hop" → "hiphop", "RNB" → "r&b", etc.
 * - If nothing is passed, default to "pop" (you can change this to "black-gospel"
 *   if you want your app default to always be gospel).
 */
function resolveGenre(input?: string): string {
  if (!input) return "pop";

  let g = input.toLowerCase().trim();

  // Detect gospel-ish phrases FIRST
  const gospelLike = [
    "gospel",
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

  // Canonicalize common synonyms / variations
  if (g === "black gospel" || g === "black-gospel") return "black-gospel";
  if (g === "hip hop" || g === "hip-hop") return "hiphop";
  if (g === "hiphop") return "hiphop";
  if (g === "rap") return "rap";
  
  // Handle all rap sub-genres - preserve the sub-genre for boost feature
  // These match the frontend's rapSubGenres configuration
  if (g.includes("trap") && g.includes("rap")) return "trap-rap";
  if (g.includes("boom bap") || g.includes("boom-bap")) return "boom-bap-rap";
  if (g.includes("conscious")) return "conscious-rap";
  if (g.includes("gangsta")) return "gangsta-rap";
  if (g.includes("melodic") && g.includes("rap")) return "melodic-rap";
  if (g.includes("old school") && (g.includes("rap") || g.includes("hip hop"))) return "old-school-rap";
  if (g.includes("southern") && g.includes("rap")) return "southern-rap";
  if (g.includes("east coast")) return "east-coast-rap";
  if (g.includes("west coast")) return "west-coast-rap";
  if (g.includes("drill")) return "drill-rap";

  if (g === "r&b" || g === "rnb" || g === "r and b" || g === "r n b" || g === "rhythm and blues") {
    return "r&b";
  }

  // Soul variations - route to authentic soul sound
  if (g === "soul" || g === "soul music" || g === "classic soul" || g === "60s soul") return "soul";
  if (g === "southern soul" || g === "stax" || g === "memphis soul") return "southern-soul";
  if (g === "motown" || g === "detroit soul" || g === "60s motown") return "motown";
  if (g === "neo soul" || g === "neo-soul" || g === "modern soul") return "neo-soul";

  if (g === "lofi" || g === "lo-fi" || g === "lo fi") return "lofi";
  if (g === "dance pop" || g === "dance-pop") return "dance-pop";
  if (g === "indie pop" || g === "indie-pop") return "indie-pop";
  if (g === "classic rock" || g === "classic-rock" || g === "70s rock") return "classic-rock";
  if (g === "smooth jazz" || g === "smooth-jazz") return "smooth-jazz";
  if (g === "blue grass" || g === "bluegrass") return "bluegrass";
  if (g === "afro beat" || g === "afrobeat" || g === "afro-beat") return "afrobeat";

  // Otherwise use the lowercased string as-is
  return g;
}

/**
 * Style builder specifically tuned for authentic Black gospel.
 */
function buildBlackGospelStyle(): string {
  // Keep under 60 chars so voice + style < 95
  return "BLACK GOSPEL, B3 organ, choir, call and response, praise break";
}

// Map genres to style strings with detailed musical characteristics.
// ALL genres now feature Black African American vocals and Black-centric production styles
function getDetailedStyle(rawGenre: string | undefined, tone: string, voice?: string): string {
  const genre = resolveGenre(rawGenre);

  // Get genre-appropriate Black voice tag - BLACK VOCALS ARE DEFAULT FOR ALL GENRES
  function getBlackVoiceTag(genreType: string, voiceChoice?: string): string {
    // Determine voice gender - default to female if not specified
    const isMale = voiceChoice === 'male';
    const isDuet = voiceChoice === 'duet';

    // Genre-specific Black voice tags (keep short for Suno - under 35 chars)
    // Hip-hop / Rap genres - includes all sub-genres
    const rapGenres = ['rap', 'hip-hop', 'hiphop', 'trap', 'trap-rap', 'boom-bap', 'boom-bap-rap', 
      'conscious-rap', 'gangsta-rap', 'melodic-rap', 'old-school-rap', 'southern-rap', 
      'east-coast-rap', 'west-coast-rap', 'drill', 'drill-rap'];
    if (rapGenres.includes(genreType) || genreType.includes('rap')) {
      if (isDuet) return 'BLACK RAP DUET, ';
      return isMale ? 'BLACK MALE RAP VOCALS, ' : 'BLACK FEMALE RAP VOCALS, ';
    }
    // Gospel
    if (genreType === 'gospel' || genreType === 'black-gospel') {
      if (isDuet) return 'BLACK GOSPEL DUET, ';
      return isMale ? 'BLACK MALE GOSPEL VOCALS, ' : 'BLACK FEMALE GOSPEL VOCALS, ';
    }
    // Jazz
    if (genreType === 'jazz' || genreType === 'smooth-jazz') {
      if (isDuet) return 'BLACK JAZZ DUET, ';
      return isMale ? 'BLACK MALE JAZZ VOCALS, ' : 'BLACK FEMALE JAZZ VOCALS, ';
    }
    // Blues
    if (genreType === 'blues') {
      if (isDuet) return 'BLACK BLUES DUET, ';
      return isMale ? 'BLACK MALE BLUES VOCALS, ' : 'BLACK FEMALE BLUES VOCALS, ';
    }
    // Reggae
    if (genreType === 'reggae') {
      if (isDuet) return 'BLACK REGGAE DUET, ';
      return isMale ? 'BLACK MALE REGGAE VOCALS, ' : 'BLACK FEMALE REGGAE VOCALS, ';
    }
    // Afrobeat
    if (genreType === 'afrobeat') {
      if (isDuet) return 'AFROBEAT DUET, ';
      return isMale ? 'BLACK MALE AFROBEAT, ' : 'BLACK FEMALE AFROBEAT, ';
    }
    // Funk / Disco
    if (genreType === 'funk' || genreType === 'disco') {
      if (isDuet) return 'BLACK FUNK DUET, ';
      return isMale ? 'BLACK MALE FUNK VOCALS, ' : 'BLACK FEMALE FUNK VOCALS, ';
    }
    // Rock / Alternative / Metal / Punk
    if (genreType === 'rock' || genreType === 'classic-rock' || genreType === 'alternative' || genreType === 'metal' || genreType === 'punk') {
      if (isDuet) return 'BLACK ROCK DUET, ';
      return isMale ? 'BLACK MALE ROCK VOCALS, ' : 'BLACK FEMALE ROCK VOCALS, ';
    }
    // Indie
    if (genreType === 'indie' || genreType === 'indie-pop') {
      if (isDuet) return 'BLACK INDIE DUET, ';
      return isMale ? 'BLACK MALE INDIE VOCALS, ' : 'BLACK FEMALE INDIE VOCALS, ';
    }
    // Pop / Dance-pop
    if (genreType === 'pop' || genreType === 'dance-pop') {
      if (isDuet) return 'BLACK POP DUET, ';
      return isMale ? 'BLACK MALE POP VOCALS, ' : 'BLACK FEMALE POP VOCALS, ';
    }
    // Country / Folk / Bluegrass
    if (genreType === 'country' || genreType === 'folk' || genreType === 'bluegrass') {
      if (isDuet) return 'BLACK COUNTRY DUET, ';
      return isMale ? 'BLACK MALE COUNTRY VOCALS, ' : 'BLACK FEMALE COUNTRY VOCALS, ';
    }
    // Christmas
    if (genreType === 'christmas') {
      if (isDuet) return 'BLACK GOSPEL DUET, ';
      return isMale ? 'BLACK MALE GOSPEL, ' : 'BLACK FEMALE GOSPEL, ';
    }
    // Electronic / EDM / House / Lofi
    if (genreType === 'electronic' || genreType === 'edm' || genreType === 'house' || genreType === 'lofi') {
      if (isDuet) return 'BLACK HOUSE DUET, ';
      return isMale ? 'BLACK MALE HOUSE VOCALS, ' : 'BLACK FEMALE HOUSE VOCALS, ';
    }
    // Latin / Reggaeton / Salsa / Bachata
    if (genreType === 'latin' || genreType === 'reggaeton' || genreType === 'salsa' || genreType === 'bachata') {
      if (isDuet) return 'AFRO-LATIN DUET, ';
      return isMale ? 'BLACK MALE LATIN VOCALS, ' : 'BLACK FEMALE LATIN VOCALS, ';
    }
    // Classical
    if (genreType === 'classical') {
      if (isDuet) return 'BLACK CLASSICAL DUET, ';
      return isMale ? 'BLACK MALE CLASSICAL, ' : 'BLACK FEMALE CLASSICAL, ';
    }
    // Ballad / Acoustic
    if (genreType === 'ballad' || genreType === 'acoustic') {
      if (isDuet) return 'BLACK SOUL DUET, ';
      return isMale ? 'BLACK MALE BALLAD VOCALS, ' : 'BLACK FEMALE BALLAD VOCALS, ';
    }
    // Default: Soul vocals for R&B, Soul, Neo-Soul, Motown, and everything else
    if (isDuet) return 'BLACK SOUL DUET, ';
    return isMale ? 'BLACK MALE SOUL VOCALS, ' : 'BLACK FEMALE SOUL VOCALS, ';
  }

  // Get the genre-appropriate Black voice tag (ALWAYS applied)
  const voiceTag = getBlackVoiceTag(genre, voice);

  // ALL genre styles are now Black-centric with authentic Black production
  // Keep styles under 55 chars so voice + style < 95
  const genreStyles: Record<string, string> = {
    // Gospel styles - authentic Black gospel
    "black-gospel": "BLACK GOSPEL, B3 organ, choir, call and response",
    gospel: "BLACK GOSPEL, B3 organ, choir, praise break, choir",

    // R&B / Soul - Black R&B and Soul classics
    "r&b": "BLACK R&B, Rhodes piano, live drums, slow jam groove",
    rnb: "BLACK R&B, Rhodes piano, live drums, slow jam groove",
    soul: "BLACK SOUL, Stax horns, B3 organ, Memphis feel",
    "southern-soul": "SOUTHERN SOUL, Stax horns, B3 organ, call-response",
    motown: "BLACK MOTOWN, 60s Detroit, tambourine, walking bass",
    "neo-soul": "BLACK NEO-SOUL, Rhodes, J Dilla drums, Moog bass",

    // Pop styles - Black pop production (Beyoncé, Bruno Mars style)
    pop: "BLACK POP, R&B influenced, catchy hooks, urban sound",
    "dance-pop": "BLACK DANCE POP, club energy, R&B vocals, urban beat",
    "indie-pop": "BLACK INDIE, alternative R&B, dreamy, soulful",

    // Rock styles - Black rock (Lenny Kravitz, Living Colour)
    rock: "BLACK ROCK, funk-influenced guitar, powerful vocals",
    alternative: "BLACK ALTERNATIVE, rock soul fusion, raw power",
    indie: "BLACK INDIE ROCK, soulful vocals, guitar driven",
    "classic-rock": "BLACK CLASSIC ROCK, blues rock, powerful riffs",

    // Country - Black country (Darius Rucker, Beyoncé Cowboy Carter)
    country: "BLACK COUNTRY, soul-influenced, acoustic guitar, twang",
    folk: "BLACK FOLK, acoustic soul, storytelling, warm vocals",
    bluegrass: "BLACK BLUEGRASS, banjo, soulful harmonies, roots",

    // Hip-hop / Rap - authentic Black hip-hop with all sub-genres (explicit rap vocals, no singing)
    rap: "BLACK HIP HOP, 808 bass, MC rap verses, no singing",
    "hip-hop": "BLACK BOOM BAP, MPC drums, rap verses, no singing",
    hiphop: "BLACK BOOM BAP, MPC drums, rap verses, no singing",
    trap: "BLACK TRAP, 808s, hi-hats, rap verses, no singing",
    "trap-rap": "BLACK TRAP, 808s, hi-hats, rap verses, no singing",
    "boom-bap-rap": "BOOM BAP, soul samples, rap verses, no singing",
    "conscious-rap": "CONSCIOUS RAP, soulful, rap verses, no singing",
    "gangsta-rap": "GANGSTA RAP, G-funk, aggressive street voice, no singing",
    "melodic-rap": "MELODIC RAP, auto-tune, singing-rap hybrid",
    "old-school-rap": "OLD SCHOOL RAP, breakbeats, rap verses, no singing",
    "southern-rap": "SOUTHERN RAP, crunk 808s, rap verses, no singing",
    "east-coast-rap": "EAST COAST RAP, boom bap, rap verses, no singing",
    "west-coast-rap": "WEST COAST RAP, G-funk, rap verses, no singing",
    "drill-rap": "DRILL RAP, 140 BPM, heavy sliding 808s, dark minimal minor key, monotone deadpan cold talk-rap, NO SINGING, raw gritty street energy",
    drill: "DRILL RAP, 140 BPM, heavy sliding 808s, dark minimal minor key, monotone deadpan cold talk-rap, NO SINGING, raw gritty street energy",

    // Electronic styles - Black electronic (Chicago house, Detroit techno)
    electronic: "BLACK ELECTRONIC, Detroit techno, synth soul",
    edm: "BLACK EDM, Chicago house influence, soulful drops",
    house: "BLACK HOUSE, Chicago house, deep bass, soul vocals",
    lofi: "BLACK LO-FI, jazz samples, mellow beats, soul chops",

    // Jazz / Blues - authentic Black jazz and blues
    jazz: "BLACK JAZZ, swing, piano, upright bass, sax, bebop",
    blues: "BLACK BLUES, 12-bar, guitar bends, B3 organ, gritty",
    "smooth-jazz": "BLACK SMOOTH JAZZ, saxophone, electric piano",

    // Latin styles - Afro-Latin influence
    latin: "AFRO-LATIN, congas, timbales, Black Latin groove",
    reggaeton: "BLACK REGGAETON, dembow, urban latino, R&B flow",
    salsa: "AFRO-CUBAN SALSA, clave rhythm, brass, congas",
    bachata: "AFRO-BACHATA, romantic, bongos, soulful vocals",

    // Other styles - all Black-centric versions
    christmas: "BLACK GOSPEL CHRISTMAS, Donny Hathaway style, choir",
    ballad: "BLACK BALLAD, soulful, piano, heartfelt, emotional",
    acoustic: "BLACK ACOUSTIC, soulful guitar, intimate vocals",
    reggae: "BLACK REGGAE, off-beat skank, dub bass, one drop",
    funk: "BLACK FUNK, slap bass, wah guitar, horn stabs, groove",
    disco: "BLACK DISCO, funky bass, strings, dance floor groove",
    metal: "BLACK METAL, heavy riffs, powerful Black vocals",
    punk: "BLACK PUNK, Bad Brains style, fast, raw energy",
    classical: "BLACK CLASSICAL, orchestral soul, elegant strings",
    afrobeat: "AFROBEAT, polyrhythmic drums, horns, funky guitar",

    // New genres - added per user request
    kpop: "K-POP, polished production, catchy hooks, dance beat",
    christian: "CONTEMPORARY CHRISTIAN, uplifting, worship band, inspiring",
    world: "WORLD MUSIC, global rhythms, ethnic instruments, fusion",
    ambient: "AMBIENT, atmospheric pads, ethereal textures, dreamy",
    experimental: "EXPERIMENTAL, avant-garde, unconventional, eclectic",
    dance: "DANCE MUSIC, club beat, energetic, synth-driven",
    techno: "TECHNO, Detroit style, driving beat, 4/4 kick, synths",
    trance: "TRANCE, uplifting synths, arpeggios, euphoric builds",
    ska: "SKA, upbeat offbeat, brass section, punk energy",
    grunge: "GRUNGE, Seattle sound, distorted guitar, raw angst",
    emo: "EMO, emotional lyrics, dynamic guitar, passionate vocals",
    americana: "AMERICANA, roots rock, storytelling, folk-country blend",
  };

  // For gospel of any kind, force Black gospel style
  if (genre === "black-gospel" || genre === "gospel") {
    return voiceTag + genreStyles["black-gospel"];
  }

  // Exact match
  if (genreStyles[genre]) {
    console.log(
      `[Suno] Genre "${genre}" matched to Black-centric style: ${voiceTag + genreStyles[genre]}`,
    );
    return voiceTag + genreStyles[genre];
  }

  // Partial match for fuzzy cases
  const genreLower = genre.toLowerCase();
  for (const [key, value] of Object.entries(genreStyles)) {
    if (genreLower.includes(key) || key.includes(genreLower)) {
      console.log(
        `[Suno] Genre "${genre}" partially matched to "${key}" Black-centric style: ${voiceTag + value}`,
      );
      return voiceTag + value;
    }
  }

  // Default fallback - Black R&B pop
  console.log(`[Suno] Genre "${genre}" not found, using Black R&B pop fallback`);
  return voiceTag + "BLACK R&B POP, soulful, catchy hooks, urban sound";
}

async function pollTaskStatus(
  taskId: string,
  maxAttempts = 180, // Default 30 minutes (180 * 10s)
): Promise<SunoTaskResponse["data"]["response"]> {
  let lastStatus: string = "UNKNOWN";
  let lastError: string | undefined;
  let consecutiveErrors = 0;
  const maxConsecutiveErrors = 10; // Allow up to 10 consecutive API errors before giving up

  for (let i = 0; i < maxAttempts; i++) {
    if (i > 0) {
      // Exponential backoff on errors, normal 10s wait otherwise
      const waitTime = consecutiveErrors > 0 
        ? Math.min(10000 * Math.pow(1.5, consecutiveErrors), 60000) // Max 60s wait
        : 10000;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    try {
      const response = await axios.get<SunoTaskResponse>(
        `${SUNO_API_BASE_URL}/api/v1/generate/record-info`,
        {
          params: { taskId },
          headers: {
            Authorization: `Bearer ${SUNO_API_KEY}`,
          },
          timeout: 90000, // 90 second timeout for poll requests
        },
      );

      // Reset error counter on successful response
      consecutiveErrors = 0;

      if (response.data.code !== 200) {
        throw new Error(response.data.msg || "Failed to query task status");
      }

      if (i === 0 || i === 8) {
        console.log(
          `[Suno Debug] Full response at poll ${i + 1}:`,
          JSON.stringify(response.data, null, 2),
        );
      }

      const { status, response: taskResponse, errorMessage } = response.data.data;
      lastStatus = status;
      lastError = errorMessage;

      const dataCount = taskResponse?.sunoData?.length || 0;
      const hasAudioUrl = taskResponse?.sunoData?.[0]?.audioUrl ? "YES" : "NO";
      console.log(
        `[Suno Poll ${i + 1}/${maxAttempts}] Status: ${status}, Data items: ${dataCount}, Audio URL: ${hasAudioUrl} for taskId: ${taskId}`,
      );

      if (
        status === "SUCCESS" &&
        taskResponse?.sunoData &&
        taskResponse.sunoData.length > 0
      ) {
        const firstTrack = taskResponse.sunoData[0];
        if (firstTrack.audioUrl) {
          console.log(
            `[Suno] Song generation completed successfully with audio URL!`,
          );
          return taskResponse;
        } else {
          console.log(
            `[Suno] Status is SUCCESS but audioUrl not ready yet, continuing to poll...`,
          );
        }
      }

      if (status === "FAILED" || status === "GENERATE_AUDIO_FAILED") {
        console.error(`[Suno] Song generation failed: ${errorMessage}`);
        throw new Error(errorMessage || "Song generation failed");
      }
    } catch (error: any) {
      // Check if it's a retryable error (5xx, network error, timeout)
      const isRetryable = 
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ECONNABORTED' ||
        (error.response?.status >= 500 && error.response?.status < 600);

      if (isRetryable) {
        consecutiveErrors++;
        console.warn(
          `[Suno] Temporary API error (attempt ${consecutiveErrors}/${maxConsecutiveErrors}): ${error.message || error.response?.status}`
        );

        if (consecutiveErrors >= maxConsecutiveErrors) {
          console.error(`[Suno] Too many consecutive API errors, giving up`);
          throw new Error(`Music service temporarily unavailable. Please try again in a few minutes.`);
        }
        // Continue to next iteration to retry
        continue;
      }

      // Non-retryable error, throw immediately
      throw error;
    }
  }

  const timeoutMessage = `Song generation timed out after 30 minutes. Last status: ${lastStatus}${
    lastError ? `. Error: ${lastError}` : ""
  }`;
  console.error(`[Suno] ${timeoutMessage}`);
  throw new Error(timeoutMessage);
}

async function extendSong(params: {
  audioId: string;
  continueAt: number;
  prompt: string;
  style: string;
  title: string;
}): Promise<{ audioId: string; audioUrl: string; duration: number }> {
  console.log(
    `[Suno Extend] Starting extension from ${params.continueAt}s for audioId: ${params.audioId}`,
  );

  const callbackUrl = process.env.REPL_SLUG
    ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/suno-callback`
    : "https://example.com/callback";

  const response = await axios.post<SunoGenerateResponse>(
    `${SUNO_API_BASE_URL}/api/v1/generate/extend`,
    {
      audioId: params.audioId,
      model: "V5",
      continueAt: params.continueAt,
      prompt: params.prompt,
      style: params.style,
      title: params.title,
      defaultParamFlag: true,
      callBackUrl: callbackUrl,
    },
    {
      headers: {
        Authorization: `Bearer ${SUNO_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 60000, // 60 second timeout for extension API call
    },
  );

  if (response.data.code !== 200) {
    throw new Error(response.data.msg || "Failed to extend song");
  }

  const taskId = response.data.data.taskId;
  console.log(`[Suno Extend] Extension started with taskId: ${taskId}`);

  const result = await pollTaskStatus(taskId);

  if (!result || !result.sunoData || result.sunoData.length === 0) {
    throw new Error("No audio data returned from Suno extend API");
  }

  const track = result.sunoData[0];
  console.log(`[Suno Extend] Extension completed: ${track.duration}s`);

  return {
    audioId: track.id,
    audioUrl: track.audioUrl,
    duration: track.duration,
  };
}

async function concatenateClips(clipIds: string[]): Promise<string> {
  console.log(`[Suno Concat] Concatenating ${clipIds.length} clips:`, clipIds);

  const response = await axios.post<SunoConcatResponse>(
    `${SUNO_API_BASE_URL}/api/v1/generate/concat`,
    {
      // NOTE: API currently takes a single clipId in your original code.
      // If they later support arrays, update this accordingly.
      clipId: clipIds[0],
    },
    {
      headers: {
        Authorization: `Bearer ${SUNO_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 60000, // 60 second timeout for concat API call
    },
  );

  if (response.data.code !== 200) {
    throw new Error(response.data.msg || "Failed to concatenate clips");
  }

  const taskId = response.data.data.taskId;
  console.log(`[Suno Concat] Concatenation started with taskId: ${taskId}`);

  const result = await pollTaskStatus(taskId, 60);

  if (!result || !result.sunoData || result.sunoData.length === 0) {
    throw new Error("No audio data returned from Suno concat API");
  }

  const finalTrack = result.sunoData[0];
  console.log(`[Suno Concat] Final song duration: ${finalTrack.duration}s`);

  return finalTrack.audioUrl;
}

/**
 * Generate song with provided lyrics (no OpenAI lyrics generation) - Extended version (~3 minutes).
 */
export async function generateSongWithLyrics(params: {
  title: string;
  lyrics: string;
  tone: string;
  genre?: string;
  voice?: string;
  additionalNotes?: string;
  duration?: 'quick' | 'extended';
}): Promise<{
  audioUrl: string;
  lyrics: string;
  title: string;
  coverImage?: string;
  generatedBy?: 'primary' | 'backup';
}> {
  if (!SUNO_API_KEY) {
    throw new Error(
      "SUNO_API_KEY is not configured. Please add it to environment variables.",
    );
  }

  try {
    const callbackUrl = process.env.REPL_SLUG
      ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/suno-callback`
      : "https://example.com/callback";

    const resolvedGenre = resolveGenre(params.genre);
    const isGospel =
      resolvedGenre === "black-gospel" || resolvedGenre === "gospel";

    // Check if additional notes contain style override (look for "style:" prefix)
    let style: string;
    const styleMatch = params.additionalNotes?.match(/style:\s*(.+?)(?:\n|$)/i);
    
    // Extract artist inspiration from notes (patterns: "like [artist]", "inspired by [artist]", "[artist] style", "sound like [artist]")
    let artistInspiration = '';
    if (params.additionalNotes) {
      const artistPatterns = [
        /(?:like|inspired by|sound(?:s)? like|in the style of|similar to|channeling|channel|vibes? (?:of|like))\s+([A-Z][a-zA-Z0-9\s\-'\.]+?)(?:\s*(?:style|vibe|sound|energy|flow|,|\.|$))/i,
        /([A-Z][a-zA-Z0-9\s\-'\.]+?)\s+(?:style|inspired|vibe|sound|energy|flow)(?:\s|,|\.|$)/i,
      ];
      for (const pattern of artistPatterns) {
        const match = params.additionalNotes.match(pattern);
        if (match && match[1] && match[1].trim().length > 2 && match[1].trim().length < 40) {
          artistInspiration = match[1].trim();
          console.log(`[Suno] Detected artist inspiration: ${artistInspiration}`);
          break;
        }
      }
    }

    if (styleMatch && styleMatch[1]) {
      style = styleMatch[1].trim().substring(0, 100);
      console.log(`[Suno] Using CUSTOM style from notes: ${style}`);
    } else {
      // Check if this is a rap sub-genre that needs boosting
      const rapSubGenreStyle = getRapSubGenreStyle(params.genre || '');
      const isRapGenre = isRapSubGenre(params.genre || '') || isRapSubGenre(resolvedGenre);
      
      if (rapSubGenreStyle) {
        // Use V4.5 Boost Style API for rap sub-genres
        console.log(`[Suno] Detected rap sub-genre in: ${params.genre}`);
        try {
          style = await boostMusicStyle(rapSubGenreStyle);
          console.log(`[Suno] Using BOOSTED rap sub-genre style: ${style.substring(0, 80)}...`);
        } catch (err) {
          // Fall back to the detailed description without boost
          style = rapSubGenreStyle.substring(0, 200);
          console.log(`[Suno] Boost failed, using fallback rap style: ${style.substring(0, 80)}...`);
        }
      } else {
        style = getDetailedStyle(resolvedGenre, params.tone, params.voice);
        console.log(`[Suno] Using auto-generated style: ${style}`);
      }
      
      // CRITICAL: For ALL rap genres (except melodic-rap), append rap directive at END
      // Suno prioritizes the last vocal instruction, so this ensures spoken rap delivery
      if (isRapGenre && !params.genre?.toLowerCase().includes('melodic')) {
        // Remove any conflicting vocal descriptors and append strong rap directive
        style = style.replace(/,?\s*(vocals?|singing|melodic|sung)\b/gi, '');
        style = `${style}, MC RAP VERSES ONLY, SPOKEN FLOW, NO SINGING`;
        console.log(`[Suno] Final rap style with directive: ${style.substring(0, 100)}...`);
      }
    }
    
    // Append artist inspiration to style if detected
    if (artistInspiration) {
      style = `${style}, ${artistInspiration} inspired, ${artistInspiration} style`;
      console.log(`[Suno] Added artist inspiration to style: ${artistInspiration}`);
    }

    // Step 1: Generate initial clip (uses V4 for longer initial output)
    console.log(
      `[Suno] Starting extended song generation (~3 minutes) for: ${params.title} [genre=${resolvedGenre}]`,
    );

    const response = await axios.post<SunoGenerateResponse>(
      `${SUNO_API_BASE_URL}/api/v1/generate`,
      {
        prompt: params.lyrics, // lyrics in custom mode
        style,
        title: params.title,
        customMode: true,
        instrumental: false,
        model: "V5",
        callBackUrl: callbackUrl,
      },
      {
        headers: {
          Authorization: `Bearer ${SUNO_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 60000, // 60 second timeout for initial API call
      },
    );

    if (response.data.code !== 200) {
      throw new Error(response.data.msg || "Failed to generate song");
    }

    const taskId = response.data.data.taskId;
    console.log(
      `[Suno] Initial clip generation started with taskId: ${taskId}`,
    );

    const initialResult = await pollTaskStatus(taskId);

    if (
      !initialResult ||
      !initialResult.sunoData ||
      initialResult.sunoData.length === 0
    ) {
      throw new Error("No audio data returned from Suno API");
    }

    const initialTrack = initialResult.sunoData[0];
    const initialDuration = initialTrack.duration || 60;
    console.log(
      `[Suno] Initial clip completed: ${initialDuration}s, ID: ${initialTrack.id}`,
    );

    // Duration-based settings:
    // - quick (~60 seconds): faster generation, 1 extension max
    // - extended (~3 minutes): longer song, up to 3 extensions
    // DEFAULT to extended if not specified
    const isExtended = params.duration !== 'quick';
    const targetDuration = isExtended ? 180 : 60;
    const maxExtensions = isExtended ? 3 : 1;
    console.log(`[Suno] Duration mode: ${isExtended ? 'extended' : 'quick'}, target: ${targetDuration}s, max extensions: ${maxExtensions}`);
    
    let currentDuration = initialDuration;
    let currentAudioId = initialTrack.id;
    const clipIds = [initialTrack.id];
    let extensionCount = 0;

    // Build a continuation prompt base that respects the actual genre
    const continuationBase = isGospel
      ? "Continue this BLACK GOSPEL worship song with the same church choir energy, Hammond organ, and call-and-response feel."
      : `Continue this ${resolvedGenre} song with the same style, groove, and energy.`;

    // Step 2: Extend until we reach target duration
    while (currentDuration < targetDuration && extensionCount < maxExtensions) {
      extensionCount++;
      const continueAt = Math.max(currentDuration - 10, 30);

      console.log(
        `[Suno] Extension ${extensionCount}: Current duration ${currentDuration}s, continuing from ${continueAt}s`,
      );

      try {
        const extension = await extendSong({
          audioId: currentAudioId,
          continueAt,
          prompt: `${continuationBase} Use similar themes and flow as these lyrics: ${params.lyrics.slice(
            0,
            200,
          )}...`,
          style,
          title: `${params.title} Part ${extensionCount + 1}`,
        });

        currentAudioId = extension.audioId;
        currentDuration += extension.duration - (currentDuration - continueAt);
        clipIds.push(extension.audioId);

        console.log(
          `[Suno] Extension ${extensionCount} completed. New total duration: ~${currentDuration}s`,
        );
      } catch (extendError: any) {
        console.error(
          `[Suno] Extension ${extensionCount} failed:`,
          extendError.message,
        );
        break;
      }
    }

    // Step 3: Get final audio URL
    let finalAudioUrl = initialTrack.audioUrl;

    if (clipIds.length > 1) {
      try {
        console.log(
          `[Suno] Concatenating ${clipIds.length} clips into final song...`,
        );
        finalAudioUrl = await concatenateClips(clipIds);
      } catch (concatError: any) {
        console.error(
          `[Suno] Concatenation failed, using last extension:`,
          concatError.message,
        );
        const lastResult = await pollTaskStatus(taskId);
        if (lastResult?.sunoData?.[0]?.audioUrl) {
          finalAudioUrl = lastResult.sunoData[0].audioUrl;
        }
      }
    }

    console.log(`[Suno] Extended song generation completed! Final URL ready.`);
    console.log(`[Song Service] Song created with: PRIMARY SERVICE`);

    return {
      audioUrl: finalAudioUrl,
      lyrics: params.lyrics,
      title: params.title,
      coverImage: initialTrack.imageUrl,
      generatedBy: "primary",
    };
  } catch (error: any) {
    console.error("Suno API error:", error.response?.data || error.message);

    // Try Loudly as a fallback for certain errors
    const isRetryableError = 
      error.response?.status >= 500 ||
      error.message?.includes("temporarily unavailable") ||
      error.message?.includes("timed out") ||
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT';

    if (isRetryableError) {
      console.log("[Song Service] Primary service failed, attempting backup...");
      
      try {
        const { generateSongWithUdio, isUdioConfigured } = await import("./udioService");
        
        if (isUdioConfigured()) {
          console.log("[Udio] Attempting backup song generation...");
          const udioResult = await generateSongWithUdio({
            title: params.title,
            prompt: params.lyrics.substring(0, 500),
            lyrics: params.lyrics,
            genre: params.genre,
            tone: params.tone,
            duration: params.duration === 'quick' ? 60 : 180,
          });
          
          console.log("[Udio] Backup generation successful!");
          console.log(`[Song Service] Song created with: BACKUP SERVICE`);
          return {
            audioUrl: udioResult.audioUrl,
            lyrics: params.lyrics,
            title: params.title,
            coverImage: undefined,
            generatedBy: "backup",
          };
        } else {
          console.log("[Udio] Backup not configured, skipping fallback");
        }
      } catch (udioError: any) {
        console.error("[Udio] Backup also failed:", udioError.message);
      }
    }

    if (error.response?.status === 401) {
      throw new Error(
        "Invalid API key. Please check your configuration.",
      );
    }

    if (error.response?.status === 429) {
      throw new Error("Insufficient credits or rate limit exceeded.");
    }

    throw new Error(
      error.response?.data?.msg ||
        error.message ||
        "Failed to generate song. Please try again.",
    );
  }
}

/**
 * High-level helper that either:
 *  - uses custom lyrics & title directly, OR
 *  - calls OpenAI to generate lyrics and then passes them into the genre-aware generator.
 */
export async function generateSong(
  params: GenerateSongParams,
): Promise<{
  audioUrl: string;
  lyrics: string;
  title: string;
  coverImage?: string;
}> {
  if (!SUNO_API_KEY) {
    throw new Error(
      "SUNO_API_KEY is not configured. Please add it to environment variables.",
    );
  }

  const resolvedGenre = resolveGenre(params.genre);

  // If custom lyrics provided, use them directly
  if (params.customLyrics && params.customTitle) {
    console.log(
      `[Suno] Using custom lyrics provided by user for: ${params.customTitle} [genre=${resolvedGenre}]`,
    );
    return generateSongWithLyrics({
      title: params.customTitle,
      lyrics: params.customLyrics,
      tone: params.tone,
      genre: resolvedGenre,
      voice: params.voice,
      additionalNotes: params.additionalNotes,
      duration: params.duration,
    });
  }

  const { generateSongLyrics } = await import("./openaiService");

  const songLyrics = await generateSongLyrics({
    recipientName: params.recipientName,
    relationship: params.relationship,
    occasion: params.occasion,
    tone: params.tone,
    genre: resolvedGenre,
    interests: params.interests,
    insideJokes: params.insideJokes,
    customMessage: params.customMessage,
  });

  return generateSongWithLyrics({
    title: songLyrics.title,
    lyrics: songLyrics.lyrics,
    tone: params.tone,
    genre: resolvedGenre,
    voice: params.voice,
    additionalNotes: params.additionalNotes,
    duration: params.duration,
  });
}
