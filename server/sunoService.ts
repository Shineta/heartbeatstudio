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
  interests?: string;
  insideJokes?: string;
  customLyrics?: string;
  customTitle?: string;
  additionalNotes?: string;
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

  if (g === "r&b" || g === "rnb" || g === "r and b" || g === "r n b") {
    return "r&b";
  }

  if (g === "lofi" || g === "lo-fi") return "lofi";
  if (g === "dance pop" || g === "dance-pop") return "dance-pop";
  if (g === "indie pop" || g === "indie-pop") return "indie-pop";
  if (g === "classic rock" || g === "classic-rock") return "classic-rock";

  // Otherwise use the lowercased string as-is
  return g;
}

/**
 * Style builder specifically tuned for authentic Black gospel.
 */
function buildBlackGospelStyle(): string {
  // Keep this reasonably short; Suno can be sensitive to very long tag strings
  return [
    "BLACK GOSPEL CHOIR",
    "African American lead vocals",
    "Hammond B3 organ",
    "live church band",
    "call and response",
    "12/8 worship groove",
    "tambourine",
    "praise break energy",
  ].join(", ");
}

// Map genres to style strings with detailed musical characteristics.
function getDetailedStyle(rawGenre: string | undefined, tone: string): string {
  const genre = resolveGenre(rawGenre);

  // IMPORTANT: Do NOT include artist names - describe the STYLE characteristics instead
  const genreStyles: Record<string, string> = {
    // Gospel styles
    "black-gospel": buildBlackGospelStyle(),
    gospel: buildBlackGospelStyle(),

    // R&B / Soul
    "r&b":
      "R&B, smooth vocals, 808 bass, lush synth pads, melodic hooks, sensual groove, mid-tempo bounce",
    rnb: "R&B, smooth vocals, 808 bass, lush synth pads, melodic hooks, sensual groove, mid-tempo bounce",
    soul: "classic soul, Motown feel, horn section, warm bass, emotional vocals, 60s soul revival",
    "neo-soul":
      "neo-soul, jazzy chords, warm rhodes piano, laid-back groove, organic drums, spiritual undertones",

    // Pop styles
    pop: `${tone} pop, synth-driven, catchy hooks, polished production, radio-friendly, bright melody`,
    "dance-pop":
      "dance pop, EDM elements, four-on-the-floor beat, synth drops, club energy, euphoric",
    "indie-pop":
      "indie pop, dreamy guitars, lo-fi aesthetic, alternative vocals, quirky melody",

    // Rock styles
    rock: `${tone} rock, electric guitar riffs, live drums, bass groove, powerful vocals`,
    alternative:
      "alternative rock, grunge influence, distorted guitars, emotional intensity, 90s vibe",
    indie:
      "indie rock, jangly guitars, DIY aesthetic, melodic vocals, garage band energy",
    "classic-rock":
      "classic rock, 70s style, blues-influenced guitar, analog warmth, big riffs",

    // Country & folk
    country:
      "modern country, acoustic and electric guitars, steel guitar, Nashville production, storytelling lyrics",
    folk: "folk, acoustic guitar, fingerpicking, warm vocals, narrative storytelling, organic sound",

    // Hip-hop / Rap
    rap: "hip hop, melodic rap flow, 808 bass, modern trap drums, ambient pads, introspective delivery",
    "hip-hop":
      "hip hop, boom bap drums, jazz samples, strong groove, storytelling verses, conscious lyrics",
    hiphop:
      "hip hop, boom bap drums, jazz samples, strong groove, storytelling verses, conscious lyrics",
    trap: "trap music, heavy 808s, triplet hi-hats, dark synths, Atlanta-inspired rhythm, energetic ad-libs",

    // Electronic styles
    electronic:
      "electronic, synth-heavy, digital production, futuristic sounds, dance beats",
    edm: "EDM, build-ups, drops, festival energy, synth leads, four-on-the-floor",
    house:
      "house music, four-on-the-floor, deep bass, repetitive vocal chops, club vibe",
    lofi: "lo-fi hip hop, vinyl crackle, jazzy samples, chill beats, mellow and laid-back",

    // Jazz / Blues
    jazz: "jazz, swing or smooth groove, piano chords, upright or electric bass, brass or saxophone lines",
    blues:
      "blues, 12-bar feel, expressive guitar, soulful vocals, Hammond organ, gritty tone",

    // Latin styles
    latin:
      "latin pop, syncopated percussion, tropical flavor, danceable rhythm, spanish-influenced melodies",
    reggaeton:
      "reggaeton, dembow beat, latin trap flavor, urban latino energy, club-ready",
    salsa:
      "salsa, Afro-Cuban rhythm, brass section, congas, piano montuno, dance floor feel",

    // Other styles
    christmas:
      "Christmas carol, sleigh bells, holiday warmth, festive choir, winter atmosphere",
    ballad: `${tone} ballad, piano-driven, emotional strings, slow tempo, heartfelt vocals`,
    acoustic:
      "acoustic, unplugged, guitar-driven, intimate vocals, warm and natural sound",
    reggae:
      "reggae, off-beat rhythm, bass-heavy, island vibes, one drop beat, laid-back groove",
    funk: "funk, slap bass, wah guitar, groovy drums, tight pocket, syncopated rhythm",
    disco:
      "disco, four-on-the-floor, funky bassline, string stabs, 70s dance energy",
    metal:
      "heavy metal, distorted guitars, double bass drums, aggressive vocals, power chords",
    punk: "punk rock, fast tempo, power chords, raw energy, DIY aesthetic",
    classical:
      "classical crossover, orchestral arrangement, strings, piano, elegant composition",
  };

  // For gospel of any kind, force Black gospel style
  if (genre === "black-gospel" || genre === "gospel") {
    return buildBlackGospelStyle();
  }

  // Exact match
  if (genreStyles[genre]) {
    console.log(
      `[Suno] Genre "${genre}" matched to style: ${genreStyles[genre]}`,
    );
    return genreStyles[genre];
  }

  // Partial match for fuzzy cases
  const genreLower = genre.toLowerCase();
  for (const [key, value] of Object.entries(genreStyles)) {
    if (genreLower.includes(key) || key.includes(genreLower)) {
      console.log(
        `[Suno] Genre "${genre}" partially matched to "${key}" style: ${value}`,
      );
      return value;
    }
  }

  // Default fallback
  console.log(`[Suno] Genre "${genre}" not found, using pop fallback`);
  return `${tone} pop, synth-driven, catchy hooks, polished production`;
}

async function pollTaskStatus(
  taskId: string,
  maxAttempts = 90,
): Promise<SunoTaskResponse["data"]["response"]> {
  let lastStatus: string = "UNKNOWN";
  let lastError: string | undefined;

  for (let i = 0; i < maxAttempts; i++) {
    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }

    const response = await axios.get<SunoTaskResponse>(
      `${SUNO_API_BASE_URL}/api/v1/generate/record-info`,
      {
        params: { taskId },
        headers: {
          Authorization: `Bearer ${SUNO_API_KEY}`,
        },
      },
    );

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
  }

  const timeoutMessage = `Song generation timed out after 15 minutes. Last status: ${lastStatus}${
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
      model: "V4",
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
  additionalNotes?: string;
}): Promise<{
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

    if (styleMatch && styleMatch[1]) {
      style = styleMatch[1].trim().substring(0, 100);
      console.log(`[Suno] Using CUSTOM style from notes: ${style}`);
    } else {
      style = getDetailedStyle(resolvedGenre, params.tone);
      console.log(`[Suno] Using auto-generated style: ${style}`);
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
        model: "V4",
        callBackUrl: callbackUrl,
      },
      {
        headers: {
          Authorization: `Bearer ${SUNO_API_KEY}`,
          "Content-Type": "application/json",
        },
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

    // Target: ~180 seconds (3 minutes)
    const targetDuration = 180;
    let currentDuration = initialDuration;
    let currentAudioId = initialTrack.id;
    const clipIds = [initialTrack.id];
    let extensionCount = 0;
    const maxExtensions = 3;

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

    return {
      audioUrl: finalAudioUrl,
      lyrics: params.lyrics,
      title: params.title,
      coverImage: initialTrack.imageUrl,
    };
  } catch (error: any) {
    console.error("Suno API error:", error.response?.data || error.message);

    if (error.response?.status === 401) {
      throw new Error(
        "Invalid Suno API key. Please check your SUNO_API_KEY environment variable.",
      );
    }

    if (error.response?.status === 429) {
      throw new Error("Insufficient credits or rate limit exceeded.");
    }

    throw new Error(
      error.response?.data?.msg ||
        error.message ||
        "Failed to generate song with Suno API",
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
      additionalNotes: params.additionalNotes,
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
  });

  return generateSongWithLyrics({
    title: songLyrics.title,
    lyrics: songLyrics.lyrics,
    tone: params.tone,
    genre: resolvedGenre,
    additionalNotes: params.additionalNotes,
  });
}
