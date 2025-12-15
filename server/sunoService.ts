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
  if (g === "old school rap" || g === "old school hip hop" || g === "80s hip hop") return "old-school-rap";

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
function getDetailedStyle(rawGenre: string | undefined, tone: string, voice?: string): string {
  const genre = resolveGenre(rawGenre);

  // Build voice descriptor prefix
  let voicePrefix = '';
  if (voice === 'male') {
    voicePrefix = 'deep male vocals, baritone singer, ';
  } else if (voice === 'female') {
    voicePrefix = 'soulful female vocals, alto singer, ';
  } else if (voice === 'duet') {
    voicePrefix = 'male and female duet vocals, harmonies, ';
  }

  // IMPORTANT: Do NOT include artist names - describe the STYLE characteristics instead
  // Use SPECIFIC instrumentation, era references, and production styles for authentic sounds
  // Tone is appended at end to avoid diluting genre characteristics
  const genreStyles: Record<string, string> = {
    // Gospel styles
    "black-gospel": buildBlackGospelStyle(),
    gospel: buildBlackGospelStyle(),

    // R&B / Soul - AUTHENTIC instrumentation, NO synth/808 for classic styles
    "r&b":
      "contemporary R&B, live drums with snap, warm bass guitar, Rhodes electric piano, lush strings, sensual groove, slow jam feel",
    rnb: "contemporary R&B, live drums with snap, warm bass guitar, Rhodes electric piano, lush strings, sensual groove, slow jam feel",
    soul: "CLASSIC SOUL, Stax Records sound, live horn section, walking bass, analog tape warmth, gritty B3 Hammond organ, rimshot snare backbeat, raw emotional vocals, 1960s Memphis soul",
    "southern-soul": "SOUTHERN SOUL, Stax-style horns, walking bass, analog tape saturation, B3 organ, live drums, call-and-response vocals, chitlin circuit feel",
    motown: "MOTOWN SOUND, 1960s Detroit, tambourine on 2 and 4, walking bass, string arrangements, hand claps, upbeat groove, classic vocal harmonies",
    "neo-soul":
      "NEO-SOUL, soulful Black R&B vocals with ad-libs, Fender Rhodes, J Dilla drums with swing, Moog bass, vinyl warmth, head-nodding groove, late 90s golden era vibe",

    // Pop styles - these CAN use synths
    pop: `modern pop production, catchy hooks, polished mix, radio-friendly, bright melody, ${tone} mood`,
    "dance-pop":
      "dance pop, EDM elements, four-on-the-floor beat, synth drops, club energy, euphoric build",
    "indie-pop":
      "indie pop, dreamy jangly guitars, lo-fi bedroom aesthetic, alternative vocals, quirky melody",

    // Rock styles - live instruments only
    rock: `live rock band, electric guitar riffs, real drums, bass groove, powerful vocals, ${tone} energy`,
    alternative:
      "alternative rock, 90s grunge influence, distorted guitars, emotional intensity, analog recording",
    indie:
      "indie rock, jangly Telecaster guitars, DIY aesthetic, melodic vocals, garage band energy, lo-fi warmth",
    "classic-rock":
      "CLASSIC ROCK, 1970s analog recording, blues-influenced guitar solos, warm tube amp distortion, live drums, big riffs",

    // Country & folk - acoustic focus
    country:
      "COUNTRY MUSIC, acoustic guitar, pedal steel guitar, fiddle, upright bass, Nashville studio sound, storytelling vocals",
    folk: "FOLK MUSIC, fingerpicked acoustic guitar, warm vocals, narrative storytelling, organic sound, minimal production",
    bluegrass: "BLUEGRASS, banjo, mandolin, fiddle, upright bass, fast picking, high lonesome harmonies",

    // Hip-hop / Rap - different eras have different sounds
    rap: "modern hip hop, melodic rap flow, 808 sub bass, trap hi-hats, ambient pads, introspective delivery",
    "hip-hop":
      "BOOM BAP HIP HOP, 90s East Coast, MPC drums, jazz piano samples, scratching, head-nodding groove, lyrical focus",
    hiphop:
      "BOOM BAP HIP HOP, 90s East Coast, MPC drums, jazz piano samples, scratching, head-nodding groove, lyrical focus",
    trap: "TRAP MUSIC, heavy 808 sub bass, triplet hi-hats, dark synth pads, Atlanta sound, energetic ad-libs",
    "old-school-rap": "OLD SCHOOL HIP HOP, 1980s breakbeat drums, DJ scratching, boom box sound, party energy",

    // Electronic styles
    electronic:
      "electronic music, synth-heavy, digital production, futuristic sounds, pulsing beats",
    edm: "EDM, massive build-ups, drops, festival energy, synth leads, four-on-the-floor",
    house:
      "DEEP HOUSE, four-on-the-floor kick, deep rolling bass, vocal chops, Chicago house warmth",
    lofi: "LO-FI HIP HOP, vinyl crackle and hiss, dusty jazz piano samples, mellow beats, late night study vibe",

    // Jazz / Blues - live acoustic instruments
    jazz: "JAZZ, live combo, swing feel, piano comping, upright bass walking, brushed drums, saxophone or trumpet solos",
    blues:
      "ELECTRIC BLUES, 12-bar progression, expressive guitar bends, Hammond B3 organ, shuffling drums, raw gritty vocals",
    "smooth-jazz": "SMOOTH JAZZ, soft saxophone lead, electric piano, mellow groove, late night radio feel",

    // Latin styles - authentic percussion
    latin:
      "LATIN MUSIC, congas, timbales, syncopated rhythms, tropical flavor, danceable groove",
    reggaeton:
      "REGGAETON, dembow beat, perreo rhythm, urban latino energy, club-ready bounce",
    salsa:
      "SALSA, Afro-Cuban clave rhythm, brass section, congas and bongos, piano montuno, dance floor energy",
    bachata: "BACHATA, romantic guitar, bongos, bass guitar, Dominican rhythm, passionate vocals",

    // Other authentic styles
    christmas:
      "CHRISTMAS MUSIC, sleigh bells, orchestral strings, warm choir, holiday nostalgia, classic arrangement",
    ballad: `emotional ballad, piano-driven, string orchestra, slow tempo, heartfelt vocals, ${tone} mood`,
    acoustic:
      "ACOUSTIC, unplugged instruments, fingerpicked guitar, intimate vocals, natural room sound",
    reggae:
      "REGGAE, off-beat guitar skank, deep dub bass, one drop drums, island vibes, laid-back groove",
    funk: "FUNK, slap bass, wah-wah guitar, tight pocket drums, horn stabs, syncopated groove, get up and dance",
    disco:
      "DISCO, four-on-the-floor kick, funky bass line, string arrangements, 1970s dance floor energy",
    metal:
      "HEAVY METAL, distorted guitars, double bass drum, aggressive vocals, power chords, high gain amps",
    punk: "PUNK ROCK, fast tempo, power chords, raw energy, DIY aesthetic, rebellious attitude",
    classical:
      "CLASSICAL, orchestral arrangement, strings, piano, elegant composition, concert hall sound",
    afrobeat: "AFROBEAT, polyrhythmic drums, horn section, funky guitar, West African groove, extended jam",
  };

  // For gospel of any kind, force Black gospel style
  if (genre === "black-gospel" || genre === "gospel") {
    return voicePrefix + buildBlackGospelStyle();
  }

  // Exact match
  if (genreStyles[genre]) {
    console.log(
      `[Suno] Genre "${genre}" matched to style: ${voicePrefix + genreStyles[genre]}`,
    );
    return voicePrefix + genreStyles[genre];
  }

  // Partial match for fuzzy cases
  const genreLower = genre.toLowerCase();
  for (const [key, value] of Object.entries(genreStyles)) {
    if (genreLower.includes(key) || key.includes(genreLower)) {
      console.log(
        `[Suno] Genre "${genre}" partially matched to "${key}" style: ${voicePrefix + value}`,
      );
      return voicePrefix + value;
    }
  }

  // Default fallback
  console.log(`[Suno] Genre "${genre}" not found, using pop fallback`);
  return voicePrefix + `${tone} pop, synth-driven, catchy hooks, polished production`;
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
  voice?: string;
  additionalNotes?: string;
  duration?: 'quick' | 'extended';
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
      style = getDetailedStyle(resolvedGenre, params.tone, params.voice);
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

    // Duration-based settings:
    // - quick (~60 seconds): faster generation, 1 extension max
    // - extended (~3 minutes): longer song, up to 3 extensions
    const isExtended = params.duration === 'extended';
    const targetDuration = isExtended ? 180 : 60;
    const maxExtensions = isExtended ? 3 : 1;
    
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
