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

// import axios from "axios";

// const SUNO_API_KEY = process.env.SUNO_API_KEY;
// const SUNO_API_BASE_URL = "https://api.sunoapi.org";

// interface GenerateSongParams {
//   recipientName: string;
//   relationship: string;
//   occasion?: string;
//   tone: string;
//   genre?: string;
//   voice?: string;
//   interests?: string;
//   insideJokes?: string;
//   customLyrics?: string;
//   customTitle?: string;
//   additionalNotes?: string;
//   duration?: 'quick' | 'extended';
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
//     status:
//       | "SUCCESS"
//       | "GENERATING"
//       | "FAILED"
//       | "WAITING"
//       | "IN_QUEUE"
//       | "CREATED"
//       | "TEXT_SUCCESS"
//       | "FIRST_SUCCESS"
//       | "PENDING"
//       | "GENERATE_AUDIO_FAILED";
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

// /**
//  * Resolve the genre into a canonical key that matches our style map.
//  * - Any "gospel-like" genre → "black-gospel"
//  * - Normalizes things like "hip hop" → "hiphop", "RNB" → "r&b", etc.
//  * - If nothing is passed, default to "pop" (you can change this to "black-gospel"
//  *   if you want your app default to always be gospel).
//  */
// function resolveGenre(input?: string): string {
//   if (!input) return "pop";

//   let g = input.toLowerCase().trim();

//   // Detect gospel-ish phrases FIRST
//   const gospelLike = [
//     "gospel",
//     "worship",
//     "praise",
//     "praise & worship",
//     "praise and worship",
//     "church",
//     "choir",
//   ];
//   if (gospelLike.some((x) => g.includes(x))) {
//     return "black-gospel";
//   }

//   // Canonicalize common synonyms / variations
//   if (g === "black gospel" || g === "black-gospel") return "black-gospel";
//   if (g === "hip hop" || g === "hip-hop") return "hiphop";
//   if (g === "hiphop") return "hiphop";
//   if (g === "rap") return "rap";
//   if (g === "old school rap" || g === "old school hip hop" || g === "80s hip hop") return "old-school-rap";

//   if (g === "r&b" || g === "rnb" || g === "r and b" || g === "r n b" || g === "rhythm and blues") {
//     return "r&b";
//   }

//   // Soul variations - route to authentic soul sound
//   if (g === "soul" || g === "soul music" || g === "classic soul" || g === "60s soul") return "soul";
//   if (g === "southern soul" || g === "stax" || g === "memphis soul") return "southern-soul";
//   if (g === "motown" || g === "detroit soul" || g === "60s motown") return "motown";
//   if (g === "neo soul" || g === "neo-soul" || g === "modern soul") return "neo-soul";

//   if (g === "lofi" || g === "lo-fi" || g === "lo fi") return "lofi";
//   if (g === "dance pop" || g === "dance-pop") return "dance-pop";
//   if (g === "indie pop" || g === "indie-pop") return "indie-pop";
//   if (g === "classic rock" || g === "classic-rock" || g === "70s rock") return "classic-rock";
//   if (g === "smooth jazz" || g === "smooth-jazz") return "smooth-jazz";
//   if (g === "blue grass" || g === "bluegrass") return "bluegrass";
//   if (g === "afro beat" || g === "afrobeat" || g === "afro-beat") return "afrobeat";

//   // Otherwise use the lowercased string as-is
//   return g;
// }

// /**
//  * Style builder specifically tuned for authentic Black gospel.
//  */
// function buildBlackGospelStyle(): string {
//   // Keep under 60 chars so voice + style < 95
//   return "BLACK GOSPEL, B3 organ, choir, call and response, praise break";
// }

// // Map genres to style strings with detailed musical characteristics.
// // ALL genres now feature Black African American vocals and Black-centric production styles
// function getDetailedStyle(rawGenre: string | undefined, tone: string, voice?: string): string {
//   const genre = resolveGenre(rawGenre);

//   // Get genre-appropriate Black voice tag - BLACK VOCALS ARE DEFAULT FOR ALL GENRES
//   function getBlackVoiceTag(genreType: string, voiceChoice?: string): string {
//     // Determine voice gender - default to female if not specified
//     const isMale = voiceChoice === 'male';
//     const isDuet = voiceChoice === 'duet';

//     // Genre-specific Black voice tags (keep short for Suno - under 35 chars)
//     // Hip-hop / Rap genres
//     if (genreType === 'rap' || genreType === 'hip-hop' || genreType === 'hiphop' || genreType === 'trap' || genreType === 'old-school-rap') {
//       if (isDuet) return 'BLACK RAP DUET, ';
//       return isMale ? 'BLACK MALE RAP VOCALS, ' : 'BLACK FEMALE RAP VOCALS, ';
//     }
//     // Gospel
//     if (genreType === 'gospel' || genreType === 'black-gospel') {
//       if (isDuet) return 'BLACK GOSPEL DUET, ';
//       return isMale ? 'BLACK MALE GOSPEL VOCALS, ' : 'BLACK FEMALE GOSPEL VOCALS, ';
//     }
//     // Jazz
//     if (genreType === 'jazz' || genreType === 'smooth-jazz') {
//       if (isDuet) return 'BLACK JAZZ DUET, ';
//       return isMale ? 'BLACK MALE JAZZ VOCALS, ' : 'BLACK FEMALE JAZZ VOCALS, ';
//     }
//     // Blues
//     if (genreType === 'blues') {
//       if (isDuet) return 'BLACK BLUES DUET, ';
//       return isMale ? 'BLACK MALE BLUES VOCALS, ' : 'BLACK FEMALE BLUES VOCALS, ';
//     }
//     // Reggae
//     if (genreType === 'reggae') {
//       if (isDuet) return 'BLACK REGGAE DUET, ';
//       return isMale ? 'BLACK MALE REGGAE VOCALS, ' : 'BLACK FEMALE REGGAE VOCALS, ';
//     }
//     // Afrobeat
//     if (genreType === 'afrobeat') {
//       if (isDuet) return 'AFROBEAT DUET, ';
//       return isMale ? 'BLACK MALE AFROBEAT, ' : 'BLACK FEMALE AFROBEAT, ';
//     }
//     // Funk / Disco
//     if (genreType === 'funk' || genreType === 'disco') {
//       if (isDuet) return 'BLACK FUNK DUET, ';
//       return isMale ? 'BLACK MALE FUNK VOCALS, ' : 'BLACK FEMALE FUNK VOCALS, ';
//     }
//     // Rock / Alternative / Metal / Punk
//     if (genreType === 'rock' || genreType === 'classic-rock' || genreType === 'alternative' || genreType === 'metal' || genreType === 'punk') {
//       if (isDuet) return 'BLACK ROCK DUET, ';
//       return isMale ? 'BLACK MALE ROCK VOCALS, ' : 'BLACK FEMALE ROCK VOCALS, ';
//     }
//     // Indie
//     if (genreType === 'indie' || genreType === 'indie-pop') {
//       if (isDuet) return 'BLACK INDIE DUET, ';
//       return isMale ? 'BLACK MALE INDIE VOCALS, ' : 'BLACK FEMALE INDIE VOCALS, ';
//     }
//     // Pop / Dance-pop
//     if (genreType === 'pop' || genreType === 'dance-pop') {
//       if (isDuet) return 'BLACK POP DUET, ';
//       return isMale ? 'BLACK MALE POP VOCALS, ' : 'BLACK FEMALE POP VOCALS, ';
//     }
//     // Country / Folk / Bluegrass
//     if (genreType === 'country' || genreType === 'folk' || genreType === 'bluegrass') {
//       if (isDuet) return 'BLACK COUNTRY DUET, ';
//       return isMale ? 'BLACK MALE COUNTRY VOCALS, ' : 'BLACK FEMALE COUNTRY VOCALS, ';
//     }
//     // Christmas
//     if (genreType === 'christmas') {
//       if (isDuet) return 'BLACK GOSPEL DUET, ';
//       return isMale ? 'BLACK MALE GOSPEL, ' : 'BLACK FEMALE GOSPEL, ';
//     }
//     // Electronic / EDM / House / Lofi
//     if (genreType === 'electronic' || genreType === 'edm' || genreType === 'house' || genreType === 'lofi') {
//       if (isDuet) return 'BLACK HOUSE DUET, ';
//       return isMale ? 'BLACK MALE HOUSE VOCALS, ' : 'BLACK FEMALE HOUSE VOCALS, ';
//     }
//     // Latin / Reggaeton / Salsa / Bachata
//     if (genreType === 'latin' || genreType === 'reggaeton' || genreType === 'salsa' || genreType === 'bachata') {
//       if (isDuet) return 'AFRO-LATIN DUET, ';
//       return isMale ? 'BLACK MALE LATIN VOCALS, ' : 'BLACK FEMALE LATIN VOCALS, ';
//     }
//     // Classical
//     if (genreType === 'classical') {
//       if (isDuet) return 'BLACK CLASSICAL DUET, ';
//       return isMale ? 'BLACK MALE CLASSICAL, ' : 'BLACK FEMALE CLASSICAL, ';
//     }
//     // Ballad / Acoustic
//     if (genreType === 'ballad' || genreType === 'acoustic') {
//       if (isDuet) return 'BLACK SOUL DUET, ';
//       return isMale ? 'BLACK MALE BALLAD VOCALS, ' : 'BLACK FEMALE BALLAD VOCALS, ';
//     }
//     // Default: Soul vocals for R&B, Soul, Neo-Soul, Motown, and everything else
//     if (isDuet) return 'BLACK SOUL DUET, ';
//     return isMale ? 'BLACK MALE SOUL VOCALS, ' : 'BLACK FEMALE SOUL VOCALS, ';
//   }

//   // Get the genre-appropriate Black voice tag (ALWAYS applied)
//   const voiceTag = getBlackVoiceTag(genre, voice);

//   // ALL genre styles are now Black-centric with authentic Black production
//   // Keep styles under 55 chars so voice + style < 95
//   const genreStyles: Record<string, string> = {
//     // Gospel styles - authentic Black gospel
//     "black-gospel": "BLACK GOSPEL, B3 organ, choir, call and response",
//     gospel: "BLACK GOSPEL, B3 organ, choir, praise break, choir",

//     // R&B / Soul - Black R&B and Soul classics
//     "r&b": "BLACK R&B, Rhodes piano, live drums, slow jam groove",
//     rnb: "BLACK R&B, Rhodes piano, live drums, slow jam groove",
//     soul: "BLACK SOUL, Stax horns, B3 organ, Memphis feel",
//     "southern-soul": "SOUTHERN SOUL, Stax horns, B3 organ, call-response",
//     motown: "BLACK MOTOWN, 60s Detroit, tambourine, walking bass",
//     "neo-soul": "BLACK NEO-SOUL, Rhodes, J Dilla drums, Moog bass",

//     // Pop styles - Black pop production (Beyoncé, Bruno Mars style)
//     pop: "BLACK POP, R&B influenced, catchy hooks, urban sound",
//     "dance-pop": "BLACK DANCE POP, club energy, R&B vocals, urban beat",
//     "indie-pop": "BLACK INDIE, alternative R&B, dreamy, soulful",

//     // Rock styles - Black rock (Lenny Kravitz, Living Colour)
//     rock: "BLACK ROCK, funk-influenced guitar, powerful vocals",
//     alternative: "BLACK ALTERNATIVE, rock soul fusion, raw power",
//     indie: "BLACK INDIE ROCK, soulful vocals, guitar driven",
//     "classic-rock": "BLACK CLASSIC ROCK, blues rock, powerful riffs",

//     // Country - Black country (Darius Rucker, Beyoncé Cowboy Carter)
//     country: "BLACK COUNTRY, soul-influenced, acoustic guitar, twang",
//     folk: "BLACK FOLK, acoustic soul, storytelling, warm vocals",
//     bluegrass: "BLACK BLUEGRASS, banjo, soulful harmonies, roots",

//     // Hip-hop / Rap - authentic Black hip-hop
//     rap: "BLACK HIP HOP, 808 bass, trap hi-hats, melodic flow",
//     "hip-hop": "BLACK BOOM BAP, 90s East Coast, MPC drums, jazz",
//     hiphop: "BLACK BOOM BAP, 90s East Coast, MPC drums, jazz",
//     trap: "BLACK TRAP, 808 sub bass, triplet hi-hats, Atlanta",
//     "old-school-rap": "OLD SCHOOL BLACK HIP HOP, breakbeats, 80s",

//     // Electronic styles - Black electronic (Chicago house, Detroit techno)
//     electronic: "BLACK ELECTRONIC, Detroit techno, synth soul",
//     edm: "BLACK EDM, Chicago house influence, soulful drops",
//     house: "BLACK HOUSE, Chicago house, deep bass, soul vocals",
//     lofi: "BLACK LO-FI, jazz samples, mellow beats, soul chops",

//     // Jazz / Blues - authentic Black jazz and blues
//     jazz: "BLACK JAZZ, swing, piano, upright bass, sax, bebop",
//     blues: "BLACK BLUES, 12-bar, guitar bends, B3 organ, gritty",
//     "smooth-jazz": "BLACK SMOOTH JAZZ, saxophone, electric piano",

//     // Latin styles - Afro-Latin influence
//     latin: "AFRO-LATIN, congas, timbales, Black Latin groove",
//     reggaeton: "BLACK REGGAETON, dembow, urban latino, R&B flow",
//     salsa: "AFRO-CUBAN SALSA, clave rhythm, brass, congas",
//     bachata: "AFRO-BACHATA, romantic, bongos, soulful vocals",

//     // Other styles - all Black-centric versions
//     christmas: "BLACK GOSPEL CHRISTMAS, Donny Hathaway style, choir",
//     ballad: "BLACK BALLAD, soulful, piano, heartfelt, emotional",
//     acoustic: "BLACK ACOUSTIC, soulful guitar, intimate vocals",
//     reggae: "BLACK REGGAE, off-beat skank, dub bass, one drop",
//     funk: "BLACK FUNK, slap bass, wah guitar, horn stabs, groove",
//     disco: "BLACK DISCO, funky bass, strings, dance floor groove",
//     metal: "BLACK METAL, heavy riffs, powerful Black vocals",
//     punk: "BLACK PUNK, Bad Brains style, fast, raw energy",
//     classical: "BLACK CLASSICAL, orchestral soul, elegant strings",
//     afrobeat: "AFROBEAT, polyrhythmic drums, horns, funky guitar",
//   };

//   // For gospel of any kind, force Black gospel style
//   if (genre === "black-gospel" || genre === "gospel") {
//     return voiceTag + genreStyles["black-gospel"];
//   }

//   // Exact match
//   if (genreStyles[genre]) {
//     console.log(
//       `[Suno] Genre "${genre}" matched to Black-centric style: ${voiceTag + genreStyles[genre]}`,
//     );
//     return voiceTag + genreStyles[genre];
//   }

//   // Partial match for fuzzy cases
//   const genreLower = genre.toLowerCase();
//   for (const [key, value] of Object.entries(genreStyles)) {
//     if (genreLower.includes(key) || key.includes(genreLower)) {
//       console.log(
//         `[Suno] Genre "${genre}" partially matched to "${key}" Black-centric style: ${voiceTag + value}`,
//       );
//       return voiceTag + value;
//     }
//   }

//   // Default fallback - Black R&B pop
//   console.log(`[Suno] Genre "${genre}" not found, using Black R&B pop fallback`);
//   return voiceTag + "BLACK R&B POP, soulful, catchy hooks, urban sound";
// }

// async function pollTaskStatus(
//   taskId: string,
//   maxAttempts = 90,
// ): Promise<SunoTaskResponse["data"]["response"]> {
//   let lastStatus: string = "UNKNOWN";
//   let lastError: string | undefined;

//   for (let i = 0; i < maxAttempts; i++) {
//     if (i > 0) {
//       await new Promise((resolve) => setTimeout(resolve, 10000));
//     }

//     const response = await axios.get<SunoTaskResponse>(
//       `${SUNO_API_BASE_URL}/api/v1/generate/record-info`,
//       {
//         params: { taskId },
//         headers: {
//           Authorization: `Bearer ${SUNO_API_KEY}`,
//         },
//       },
//     );

//     if (response.data.code !== 200) {
//       throw new Error(response.data.msg || "Failed to query task status");
//     }

//     if (i === 0 || i === 8) {
//       console.log(
//         `[Suno Debug] Full response at poll ${i + 1}:`,
//         JSON.stringify(response.data, null, 2),
//       );
//     }

//     const { status, response: taskResponse, errorMessage } = response.data.data;
//     lastStatus = status;
//     lastError = errorMessage;

//     const dataCount = taskResponse?.sunoData?.length || 0;
//     const hasAudioUrl = taskResponse?.sunoData?.[0]?.audioUrl ? "YES" : "NO";
//     console.log(
//       `[Suno Poll ${i + 1}/${maxAttempts}] Status: ${status}, Data items: ${dataCount}, Audio URL: ${hasAudioUrl} for taskId: ${taskId}`,
//     );

//     if (
//       status === "SUCCESS" &&
//       taskResponse?.sunoData &&
//       taskResponse.sunoData.length > 0
//     ) {
//       const firstTrack = taskResponse.sunoData[0];
//       if (firstTrack.audioUrl) {
//         console.log(
//           `[Suno] Song generation completed successfully with audio URL!`,
//         );
//         return taskResponse;
//       } else {
//         console.log(
//           `[Suno] Status is SUCCESS but audioUrl not ready yet, continuing to poll...`,
//         );
//       }
//     }

//     if (status === "FAILED" || status === "GENERATE_AUDIO_FAILED") {
//       console.error(`[Suno] Song generation failed: ${errorMessage}`);
//       throw new Error(errorMessage || "Song generation failed");
//     }
//   }

//   const timeoutMessage = `Song generation timed out after 15 minutes. Last status: ${lastStatus}${
//     lastError ? `. Error: ${lastError}` : ""
//   }`;
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
//   console.log(
//     `[Suno Extend] Starting extension from ${params.continueAt}s for audioId: ${params.audioId}`,
//   );

//   const callbackUrl = process.env.REPL_SLUG
//     ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/suno-callback`
//     : "https://example.com/callback";

//   const response = await axios.post<SunoGenerateResponse>(
//     `${SUNO_API_BASE_URL}/api/v1/generate/extend`,
//     {
//       audioId: params.audioId,
//       model: "V4",
//       continueAt: params.continueAt,
//       prompt: params.prompt,
//       style: params.style,
//       title: params.title,
//       defaultParamFlag: true,
//       callBackUrl: callbackUrl,
//     },
//     {
//       headers: {
//         Authorization: `Bearer ${SUNO_API_KEY}`,
//         "Content-Type": "application/json",
//       },
//     },
//   );

//   if (response.data.code !== 200) {
//     throw new Error(response.data.msg || "Failed to extend song");
//   }

//   const taskId = response.data.data.taskId;
//   console.log(`[Suno Extend] Extension started with taskId: ${taskId}`);

//   const result = await pollTaskStatus(taskId);

//   if (!result || !result.sunoData || result.sunoData.length === 0) {
//     throw new Error("No audio data returned from Suno extend API");
//   }

//   const track = result.sunoData[0];
//   console.log(`[Suno Extend] Extension completed: ${track.duration}s`);

//   return {
//     audioId: track.id,
//     audioUrl: track.audioUrl,
//     duration: track.duration,
//   };
// }

// async function concatenateClips(clipIds: string[]): Promise<string> {
//   console.log(`[Suno Concat] Concatenating ${clipIds.length} clips:`, clipIds);

//   const response = await axios.post<SunoConcatResponse>(
//     `${SUNO_API_BASE_URL}/api/v1/generate/concat`,
//     {
//       // NOTE: API currently takes a single clipId in your original code.
//       // If they later support arrays, update this accordingly.
//       clipId: clipIds[0],
//     },
//     {
//       headers: {
//         Authorization: `Bearer ${SUNO_API_KEY}`,
//         "Content-Type": "application/json",
//       },
//     },
//   );

//   if (response.data.code !== 200) {
//     throw new Error(response.data.msg || "Failed to concatenate clips");
//   }

//   const taskId = response.data.data.taskId;
//   console.log(`[Suno Concat] Concatenation started with taskId: ${taskId}`);

//   const result = await pollTaskStatus(taskId, 60);

//   if (!result || !result.sunoData || result.sunoData.length === 0) {
//     throw new Error("No audio data returned from Suno concat API");
//   }

//   const finalTrack = result.sunoData[0];
//   console.log(`[Suno Concat] Final song duration: ${finalTrack.duration}s`);

//   return finalTrack.audioUrl;
// }

// /**
//  * Generate song with provided lyrics (no OpenAI lyrics generation) - Extended version (~3 minutes).
//  */
// export async function generateSongWithLyrics(params: {
//   title: string;
//   lyrics: string;
//   tone: string;
//   genre?: string;
//   voice?: string;
//   additionalNotes?: string;
//   duration?: 'quick' | 'extended';
// }): Promise<{
//   audioUrl: string;
//   lyrics: string;
//   title: string;
//   coverImage?: string;
// }> {
//   if (!SUNO_API_KEY) {
//     throw new Error(
//       "SUNO_API_KEY is not configured. Please add it to environment variables.",
//     );
//   }

//   try {
//     const callbackUrl = process.env.REPL_SLUG
//       ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/suno-callback`
//       : "https://example.com/callback";

//     const resolvedGenre = resolveGenre(params.genre);
//     const isGospel =
//       resolvedGenre === "black-gospel" || resolvedGenre === "gospel";

//     // Check if additional notes contain style override (look for "style:" prefix)
//     let style: string;
//     const styleMatch = params.additionalNotes?.match(/style:\s*(.+?)(?:\n|$)/i);

//     if (styleMatch && styleMatch[1]) {
//       style = styleMatch[1].trim().substring(0, 100);
//       console.log(`[Suno] Using CUSTOM style from notes: ${style}`);
//     } else {
//       style = getDetailedStyle(resolvedGenre, params.tone, params.voice);
//       console.log(`[Suno] Using auto-generated style: ${style}`);
//     }

//     // Step 1: Generate initial clip (uses V4 for longer initial output)
//     console.log(
//       `[Suno] Starting extended song generation (~3 minutes) for: ${params.title} [genre=${resolvedGenre}]`,
//     );

//     const response = await axios.post<SunoGenerateResponse>(
//       `${SUNO_API_BASE_URL}/api/v1/generate`,
//       {
//         prompt: params.lyrics, // lyrics in custom mode
//         style,
//         title: params.title,
//         customMode: true,
//         instrumental: false,
//         model: "V4",
//         callBackUrl: callbackUrl,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${SUNO_API_KEY}`,
//           "Content-Type": "application/json",
//         },
//       },
//     );

//     if (response.data.code !== 200) {
//       throw new Error(response.data.msg || "Failed to generate song");
//     }

//     const taskId = response.data.data.taskId;
//     console.log(
//       `[Suno] Initial clip generation started with taskId: ${taskId}`,
//     );

//     const initialResult = await pollTaskStatus(taskId);

//     if (
//       !initialResult ||
//       !initialResult.sunoData ||
//       initialResult.sunoData.length === 0
//     ) {
//       throw new Error("No audio data returned from Suno API");
//     }

//     const initialTrack = initialResult.sunoData[0];
//     const initialDuration = initialTrack.duration || 60;
//     console.log(
//       `[Suno] Initial clip completed: ${initialDuration}s, ID: ${initialTrack.id}`,
//     );

//     // Duration-based settings:
//     // - quick (~60 seconds): faster generation, 1 extension max
//     // - extended (~3 minutes): longer song, up to 3 extensions
//     const isExtended = params.duration === 'extended';
//     const targetDuration = isExtended ? 180 : 60;
//     const maxExtensions = isExtended ? 3 : 1;

//     let currentDuration = initialDuration;
//     let currentAudioId = initialTrack.id;
//     const clipIds = [initialTrack.id];
//     let extensionCount = 0;

//     // Build a continuation prompt base that respects the actual genre
//     const continuationBase = isGospel
//       ? "Continue this BLACK GOSPEL worship song with the same church choir energy, Hammond organ, and call-and-response feel."
//       : `Continue this ${resolvedGenre} song with the same style, groove, and energy.`;

//     // Step 2: Extend until we reach target duration
//     while (currentDuration < targetDuration && extensionCount < maxExtensions) {
//       extensionCount++;
//       const continueAt = Math.max(currentDuration - 10, 30);

//       console.log(
//         `[Suno] Extension ${extensionCount}: Current duration ${currentDuration}s, continuing from ${continueAt}s`,
//       );

//       try {
//         const extension = await extendSong({
//           audioId: currentAudioId,
//           continueAt,
//           prompt: `${continuationBase} Use similar themes and flow as these lyrics: ${params.lyrics.slice(
//             0,
//             200,
//           )}...`,
//           style,
//           title: `${params.title} Part ${extensionCount + 1}`,
//         });

//         currentAudioId = extension.audioId;
//         currentDuration += extension.duration - (currentDuration - continueAt);
//         clipIds.push(extension.audioId);

//         console.log(
//           `[Suno] Extension ${extensionCount} completed. New total duration: ~${currentDuration}s`,
//         );
//       } catch (extendError: any) {
//         console.error(
//           `[Suno] Extension ${extensionCount} failed:`,
//           extendError.message,
//         );
//         break;
//       }
//     }

//     // Step 3: Get final audio URL
//     let finalAudioUrl = initialTrack.audioUrl;

//     if (clipIds.length > 1) {
//       try {
//         console.log(
//           `[Suno] Concatenating ${clipIds.length} clips into final song...`,
//         );
//         finalAudioUrl = await concatenateClips(clipIds);
//       } catch (concatError: any) {
//         console.error(
//           `[Suno] Concatenation failed, using last extension:`,
//           concatError.message,
//         );
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
//       coverImage: initialTrack.imageUrl,
//     };
//   } catch (error: any) {
//     console.error("Suno API error:", error.response?.data || error.message);

//     if (error.response?.status === 401) {
//       throw new Error(
//         "Invalid Suno API key. Please check your SUNO_API_KEY environment variable.",
//       );
//     }

//     if (error.response?.status === 429) {
//       throw new Error("Insufficient credits or rate limit exceeded.");
//     }

//     throw new Error(
//       error.response?.data?.msg ||
//         error.message ||
//         "Failed to generate song with Suno API",
//     );
//   }
// }

// /**
//  * High-level helper that either:
//  *  - uses custom lyrics & title directly, OR
//  *  - calls OpenAI to generate lyrics and then passes them into the genre-aware generator.
//  */
// export async function generateSong(
//   params: GenerateSongParams,
// ): Promise<{
//   audioUrl: string;
//   lyrics: string;
//   title: string;
//   coverImage?: string;
// }> {
//   if (!SUNO_API_KEY) {
//     throw new Error(
//       "SUNO_API_KEY is not configured. Please add it to environment variables.",
//     );
//   }

//   const resolvedGenre = resolveGenre(params.genre);

//   // If custom lyrics provided, use them directly
//   if (params.customLyrics && params.customTitle) {
//     console.log(
//       `[Suno] Using custom lyrics provided by user for: ${params.customTitle} [genre=${resolvedGenre}]`,
//     );
//     return generateSongWithLyrics({
//       title: params.customTitle,
//       lyrics: params.customLyrics,
//       tone: params.tone,
//       genre: resolvedGenre,
//       voice: params.voice,
//       additionalNotes: params.additionalNotes,
//       duration: params.duration,
//     });
//   }

//   const { generateSongLyrics } = await import("./openaiService");

//   const songLyrics = await generateSongLyrics({
//     recipientName: params.recipientName,
//     relationship: params.relationship,
//     occasion: params.occasion,
//     tone: params.tone,
//     genre: resolvedGenre,
//     interests: params.interests,
//     insideJokes: params.insideJokes,
//   });

//   return generateSongWithLyrics({
//     title: songLyrics.title,
//     lyrics: songLyrics.lyrics,
//     tone: params.tone,
//     genre: resolvedGenre,
//     voice: params.voice,
//     additionalNotes: params.additionalNotes,
//     duration: params.duration,
//   });
// }

/////////////////////////////////////////////////////////////////////////////////////////////////////////////

// // sunoService.ts (FULL, upgraded + tuned)
// // - Uses V4_5PLUS (or V5) to allow 1000-char style strings
// // - Adds negativeTags, styleWeight, weirdnessConstraint, vocalGender to /generate and /extend
// // - Removes identity/race-based tags and replaces them with SOUND-based delivery + production guidance
// // - Keeps your existing poll/extend/concat flow
// //
// // You can override per-request via additionalNotes:
// //   style: <your style>
// //   negative: <your negativeTags>
// //   styleWeight: 0.92
// //   weirdness: 0.10

// import axios from "axios";

// const SUNO_API_KEY = process.env.SUNO_API_KEY;
// const SUNO_API_BASE_URL = "https://api.sunoapi.org";

// // Upgraded model: V4_5PLUS or V5
// const DEFAULT_MODEL: "V4_5PLUS" | "V5" = "V4_5PLUS";

// // Tuned defaults (stronger adherence, less drift)
// const DEFAULT_STYLE_WEIGHT = 0.9;
// const DEFAULT_WEIRDNESS = 0.15;

// // Tighter “anti-pop/anti-EDM gloss” exclusions
// const DEFAULT_NEGATIVE_TAGS =
//   "radio pop, dance pop, glossy synth pop, shiny pop mix, bright synth lead, edm, EDM drops, sidechain pumping, heavy autotune, trap hats";

// interface GenerateSongParams {
//   recipientName: string;
//   relationship: string;
//   occasion?: string;
//   tone: string;
//   genre?: string;
//   voice?: string;
//   interests?: string;
//   insideJokes?: string;
//   customLyrics?: string;
//   customTitle?: string;
//   additionalNotes?: string;
//   duration?: "quick" | "extended";
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
//     status:
//       | "SUCCESS"
//       | "GENERATING"
//       | "FAILED"
//       | "WAITING"
//       | "IN_QUEUE"
//       | "CREATED"
//       | "TEXT_SUCCESS"
//       | "FIRST_SUCCESS"
//       | "PENDING"
//       | "GENERATE_AUDIO_FAILED";
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

// /**
//  * Resolve the genre into a canonical key that matches our style map.
//  */
// function resolveGenre(input?: string): string {
//   if (!input) return "pop";

//   const g = input.toLowerCase().trim();

//   // Treat gospel-like phrases as gospel
//   const gospelLike = [
//     "gospel",
//     "worship",
//     "praise",
//     "praise & worship",
//     "praise and worship",
//     "church",
//     "choir",
//   ];
//   if (gospelLike.some((x) => g.includes(x))) return "gospel";

//   if (g === "hip hop" || g === "hip-hop") return "hiphop";
//   if (g === "hiphop") return "hiphop";
//   if (g === "rap") return "rap";
//   if (
//     g === "old school rap" ||
//     g === "old school hip hop" ||
//     g === "80s hip hop"
//   )
//     return "old-school-rap";

//   if (["r&b", "rnb", "r and b", "r n b", "rhythm and blues"].includes(g))
//     return "r&b";

//   if (["soul", "soul music", "classic soul", "60s soul"].includes(g))
//     return "soul";
//   if (["southern soul", "stax", "memphis soul"].includes(g))
//     return "southern-soul";
//   if (["motown", "detroit soul", "60s motown"].includes(g)) return "motown";
//   if (["neo soul", "neo-soul", "modern soul"].includes(g)) return "neo-soul";

//   if (["lofi", "lo-fi", "lo fi"].includes(g)) return "lofi";
//   if (["dance pop", "dance-pop"].includes(g)) return "dance-pop";
//   if (["indie pop", "indie-pop"].includes(g)) return "indie-pop";
//   if (["classic rock", "classic-rock", "70s rock"].includes(g))
//     return "classic-rock";
//   if (["smooth jazz", "smooth-jazz"].includes(g)) return "smooth-jazz";
//   if (["blue grass", "bluegrass"].includes(g)) return "bluegrass";
//   if (["afro beat", "afrobeat", "afro-beat"].includes(g)) return "afrobeat";

//   return g;
// }

// /**
//  * Map your UI "voice" choice to Suno's vocalGender (m/f).
//  * If duet/unknown, omit vocalGender so the model picks.
//  */
// function resolveVocalGender(voice?: string): "m" | "f" | undefined {
//   const v = (voice || "").toLowerCase().trim();
//   if (v === "male" || v === "m") return "m";
//   if (v === "female" || v === "f") return "f";
//   return undefined;
// }

// /**
//  * Optional overrides via additionalNotes:
//  *   style: ...
//  *   negative: ...
//  *   styleWeight: 0.92
//  *   weirdness: 0.10
//  */
// function parseOverrides(additionalNotes?: string): {
//   styleOverride?: string;
//   negativeOverride?: string;
//   styleWeight?: number;
//   weirdness?: number;
// } {
//   if (!additionalNotes) return {};

//   const styleMatch = additionalNotes.match(/style:\s*(.+?)(?:\n|$)/i);
//   const negMatch = additionalNotes.match(/negative:\s*(.+?)(?:\n|$)/i);
//   const swMatch = additionalNotes.match(/styleweight:\s*([0-9.]+)(?:\n|$)/i);
//   const wMatch = additionalNotes.match(/weirdness:\s*([0-9.]+)(?:\n|$)/i);

//   const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

//   return {
//     styleOverride: styleMatch?.[1]?.trim()?.slice(0, 1000),
//     negativeOverride: negMatch?.[1]?.trim(),
//     styleWeight: swMatch?.[1] ? clamp01(Number(swMatch[1])) : undefined,
//     weirdness: wMatch?.[1] ? clamp01(Number(wMatch[1])) : undefined,
//   };
// }

// /**
//  * SOUND-based vocal delivery guidance (no identity targeting).
//  */
// function buildVocalDeliveryTag(genre: string, voice?: string): string {
//   const v = (voice || "").toLowerCase().trim();
//   const isDuet = v === "duet";

//   if (isDuet) return "lead + harmonies, call-and-response, stacked vocals";

//   if (["rap", "hiphop", "old-school-rap", "trap"].includes(genre)) {
//     return "confident rap delivery, tight rhythm, clear articulation";
//   }
//   if (["jazz", "smooth-jazz", "blues"].includes(genre)) {
//     return "warm intimate jazz vocal, expressive phrasing";
//   }
//   if (
//     ["rock", "classic-rock", "alternative", "punk", "metal"].includes(genre)
//   ) {
//     return "powerful rock vocal, raw edge, live take feel";
//   }
//   if (["country", "folk", "bluegrass"].includes(genre)) {
//     return "warm narrative vocal, natural tone";
//   }

//   // default: soul/gospel-friendly delivery
//   return "gritty soulful lead, churchy phrasing, melismatic runs";
// }

// /**
//  * Detailed style strings (up to 1000 chars on V4_5PLUS/V5).
//  * Focus: groove + instrumentation + production + delivery.
//  */
// function getDetailedStyle(
//   rawGenre: string | undefined,
//   tone: string,
//   voice?: string,
// ): string {
//   const genre = resolveGenre(rawGenre);
//   const delivery = buildVocalDeliveryTag(genre, voice);

//   const baseMix =
//     "live band feel, warm analog mix, dynamic vocal peaks, minimal autotune, avoid glossy pop polish";

//   const genreStyles: Record<string, string> = {
//     gospel:
//       "traditional gospel, Hammond B3 organ, church choir swells, call-and-response, handclaps, stomp groove, praise break energy, big dynamic builds",
//     "r&b":
//       "R&B slow jam pocket, Rhodes chords, warm bass, tight kick/snare, smooth harmonies, tasteful guitar licks",
//     soul: "70s soul, deep pocket groove, swung 16ths, live drums with ghost notes, warm electric bass, Rhodes + Hammond B3, horn stabs, analog tape warmth",
//     "southern-soul":
//       "southern soul / Stax feel, Memphis pocket, B3 organ, punchy horns, dry snare, gritty warmth",
//     motown:
//       "60s Motown feel, tambourine on backbeat, melodic bassline, handclaps, bright horns, energetic pocket",
//     "neo-soul":
//       "neo-soul pocket, behind-the-beat groove, tight kick/snare, rich Rhodes chords, jazzy extensions (7ths/9ths/13ths), warm bass, subtle vinyl texture",
//     pop: "modern pop with R&B influence, clean hooks, but keep warm mix and avoid EDM drops",
//     "dance-pop":
//       "dance-pop groove with tight drums, but avoid EDM drops and excessive synth sheen",
//     "indie-pop":
//       "indie-pop with soulful warmth, airy guitars, intimate vocal, minimal pop gloss",
//     rap: "hip-hop, solid drum pocket, strong low end, minimal pop melodies, emphasis on flow",
//     hiphop:
//       "boom bap, 90s pocket, MPC-style drums, jazzy samples, tight snare, head-nod groove",
//     trap: "trap groove, 808 sub, crisp percussion, but avoid pop chorus sheen",
//     "old-school-rap":
//       "old school hip-hop, breakbeats, 80s drum machine vibe, funky bassline",
//     jazz: "jazz combo, upright bass, piano, brushed drums, sax, intimate club room feel",
//     blues: "blues, 12-bar feel, guitar bends, B3 organ, gritty vocal emotion",
//     "smooth-jazz":
//       "smooth jazz, electric piano, sax lead, laid-back groove, warm polish",
//     lofi: "lo-fi, jazzy chords, mellow drums, vinyl texture, soft saturation",
//     rock: "rock with blues/soul influence, crunchy guitar, live drums, raw energy",
//     "classic-rock":
//       "classic rock, blues rock riffs, live band room sound, big chorus",
//     country:
//       "country with soul influence, acoustic guitar, steady pocket, storytelling delivery",
//     folk: "folk, acoustic warmth, intimate vocals, minimal processing",
//     bluegrass: "bluegrass, banjo + fiddle, tight harmonies, live room feel",
//     afrobeat:
//       "afrobeat, polyrhythmic drums, syncopated guitar, horn riffs, danceable groove",
//   };

//   const chosen = genreStyles[genre] || genreStyles["r&b"];

//   const toneHint = tone?.toLowerCase().includes("romantic")
//     ? "romantic, tender dynamics"
//     : tone?.toLowerCase().includes("hype")
//       ? "high energy, crowd-ready"
//       : tone?.toLowerCase().includes("sad")
//         ? "emotional, vulnerable, slow burn"
//         : "balanced dynamics";

//   const style = [
//     chosen,
//     delivery,
//     baseMix,
//     toneHint,
//     "no EDM drops, no bright synth lead, no shiny pop mix",
//   ].join(", ");

//   return style.slice(0, 1000);
// }

// async function pollTaskStatus(
//   taskId: string,
//   maxAttempts = 90,
// ): Promise<SunoTaskResponse["data"]["response"]> {
//   let lastStatus: string = "UNKNOWN";
//   let lastError: string | undefined;

//   for (let i = 0; i < maxAttempts; i++) {
//     if (i > 0) await new Promise((resolve) => setTimeout(resolve, 10000));

//     const response = await axios.get<SunoTaskResponse>(
//       `${SUNO_API_BASE_URL}/api/v1/generate/record-info`,
//       {
//         params: { taskId },
//         headers: { Authorization: `Bearer ${SUNO_API_KEY}` },
//       },
//     );

//     if (response.data.code !== 200) {
//       throw new Error(response.data.msg || "Failed to query task status");
//     }

//     const { status, response: taskResponse, errorMessage } = response.data.data;
//     lastStatus = status;
//     lastError = errorMessage;

//     const dataCount = taskResponse?.sunoData?.length || 0;
//     const hasAudioUrl = taskResponse?.sunoData?.[0]?.audioUrl ? "YES" : "NO";
//     console.log(
//       `[Suno Poll ${i + 1}/${maxAttempts}] Status: ${status}, Data items: ${dataCount}, Audio URL: ${hasAudioUrl} for taskId: ${taskId}`,
//     );

//     if (status === "SUCCESS" && taskResponse?.sunoData?.length) {
//       const firstTrack = taskResponse.sunoData[0];
//       if (firstTrack.audioUrl) return taskResponse;
//     }

//     if (status === "FAILED" || status === "GENERATE_AUDIO_FAILED") {
//       throw new Error(errorMessage || "Song generation failed");
//     }
//   }

//   throw new Error(
//     `Song generation timed out. Last status: ${lastStatus}${lastError ? `. Error: ${lastError}` : ""}`,
//   );
// }

// async function extendSong(params: {
//   audioId: string;
//   continueAt: number;
//   prompt: string;
//   style: string;
//   title: string;
//   negativeTags: string;
//   vocalGender?: "m" | "f";
//   styleWeight: number;
//   weirdnessConstraint: number;
// }): Promise<{ audioId: string; audioUrl: string; duration: number }> {
//   const callbackUrl = process.env.REPL_SLUG
//     ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/suno-callback`
//     : "https://example.com/callback";

//   const response = await axios.post<SunoGenerateResponse>(
//     `${SUNO_API_BASE_URL}/api/v1/generate/extend`,
//     {
//       audioId: params.audioId,
//       model: DEFAULT_MODEL,
//       continueAt: params.continueAt,
//       prompt: params.prompt,
//       style: params.style,
//       title: params.title,
//       negativeTags: params.negativeTags,
//       ...(params.vocalGender ? { vocalGender: params.vocalGender } : {}),
//       styleWeight: params.styleWeight,
//       weirdnessConstraint: params.weirdnessConstraint,
//       defaultParamFlag: true,
//       callBackUrl: callbackUrl,
//     },
//     {
//       headers: {
//         Authorization: `Bearer ${SUNO_API_KEY}`,
//         "Content-Type": "application/json",
//       },
//     },
//   );

//   if (response.data.code !== 200) {
//     throw new Error(response.data.msg || "Failed to extend song");
//   }

//   const taskId = response.data.data.taskId;
//   const result = await pollTaskStatus(taskId);

//   if (!result?.sunoData?.length) {
//     throw new Error("No audio data returned from Suno extend API");
//   }

//   const track = result.sunoData[0];
//   return {
//     audioId: track.id,
//     audioUrl: track.audioUrl,
//     duration: track.duration,
//   };
// }

// async function concatenateClips(clipIds: string[]): Promise<string> {
//   console.log(`[Suno Concat] Concatenating ${clipIds.length} clips:`, clipIds);

//   const response = await axios.post<SunoConcatResponse>(
//     `${SUNO_API_BASE_URL}/api/v1/generate/concat`,
//     {
//       // NOTE: API currently takes a single clipId in your original code.
//       // If they later support arrays, update this accordingly.
//       clipId: clipIds[0],
//     },
//     {
//       headers: {
//         Authorization: `Bearer ${SUNO_API_KEY}`,
//         "Content-Type": "application/json",
//       },
//     },
//   );

//   if (response.data.code !== 200) {
//     throw new Error(response.data.msg || "Failed to concatenate clips");
//   }

//   const taskId = response.data.data.taskId;
//   console.log(`[Suno Concat] Concatenation started with taskId: ${taskId}`);

//   const result = await pollTaskStatus(taskId, 60);

//   if (!result?.sunoData?.length) {
//     throw new Error("No audio data returned from Suno concat API");
//   }

//   const finalTrack = result.sunoData[0];
//   console.log(`[Suno Concat] Final song duration: ${finalTrack.duration}s`);

//   return finalTrack.audioUrl;
// }

// /**
//  * Generate song with provided lyrics (no OpenAI lyrics generation).
//  * Supports quick (~60s) and extended (~3m) via extensions.
//  */
// export async function generateSongWithLyrics(params: {
//   title: string;
//   lyrics: string;
//   tone: string;
//   genre?: string;
//   voice?: string;
//   additionalNotes?: string;
//   duration?: "quick" | "extended";
// }): Promise<{
//   audioUrl: string;
//   lyrics: string;
//   title: string;
//   coverImage?: string;
// }> {
//   if (!SUNO_API_KEY) {
//     throw new Error(
//       "SUNO_API_KEY is not configured. Please add it to environment variables.",
//     );
//   }

//   try {
//     const callbackUrl = process.env.REPL_SLUG
//       ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/suno-callback`
//       : "https://example.com/callback";

//     const resolvedGenre = resolveGenre(params.genre);

//     // Pull optional overrides
//     const overrides = parseOverrides(params.additionalNotes);

//     // Style (up to 1000 chars on V4_5PLUS/V5)
//     const style =
//       overrides.styleOverride ||
//       getDetailedStyle(resolvedGenre, params.tone, params.voice);

//     // Steering knobs
//     const negativeTags = overrides.negativeOverride || DEFAULT_NEGATIVE_TAGS;
//     const styleWeight = overrides.styleWeight ?? DEFAULT_STYLE_WEIGHT;
//     const weirdnessConstraint = overrides.weirdness ?? DEFAULT_WEIRDNESS;
//     const vocalGender = resolveVocalGender(params.voice);

//     console.log(`[Suno] Model: ${DEFAULT_MODEL}`);
//     console.log(`[Suno] Genre: ${resolvedGenre}`);
//     console.log(
//       `[Suno] StyleWeight: ${styleWeight} Weirdness: ${weirdnessConstraint}`,
//     );
//     console.log(`[Suno] NegativeTags: ${negativeTags}`);
//     console.log(`[Suno] Style (${style.length} chars): ${style}`);

//     // Step 1: Generate initial clip
//     console.log(
//       `[Suno] Starting generation for: ${params.title} [genre=${resolvedGenre}]`,
//     );

//     const response = await axios.post<SunoGenerateResponse>(
//       `${SUNO_API_BASE_URL}/api/v1/generate`,
//       {
//         prompt: params.lyrics, // In Custom Mode: prompt is treated strictly as lyrics
//         style: style.slice(0, 1000),
//         title: params.title.slice(0, 100),
//         customMode: true,
//         instrumental: false,
//         model: DEFAULT_MODEL,
//         negativeTags,
//         ...(vocalGender ? { vocalGender } : {}),
//         styleWeight,
//         weirdnessConstraint,
//         callBackUrl: callbackUrl,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${SUNO_API_KEY}`,
//           "Content-Type": "application/json",
//         },
//       },
//     );

//     if (response.data.code !== 200) {
//       throw new Error(response.data.msg || "Failed to generate song");
//     }

//     const taskId = response.data.data.taskId;
//     console.log(
//       `[Suno] Initial clip generation started with taskId: ${taskId}`,
//     );

//     const initialResult = await pollTaskStatus(taskId);

//     if (!initialResult?.sunoData?.length) {
//       throw new Error("No audio data returned from Suno API");
//     }

//     const initialTrack = initialResult.sunoData[0];
//     const initialDuration = initialTrack.duration || 60;

//     console.log(
//       `[Suno] Initial clip completed: ${initialDuration}s, ID: ${initialTrack.id}`,
//     );

//     // Duration-based settings
//     const isExtended = params.duration === "extended";
//     const targetDuration = isExtended ? 180 : 60;
//     const maxExtensions = isExtended ? 3 : 1;

//     let currentDuration = initialDuration;
//     let currentAudioId = initialTrack.id;
//     const clipIds = [initialTrack.id];
//     let extensionCount = 0;

//     // Continuation text: keep it short. In custom mode, prompt is lyrics-oriented.
//     const continuationBase =
//       resolvedGenre === "gospel"
//         ? "Continue with choir call-and-response, organ swells, and a strong praise-break lift."
//         : "Continue with the same groove, pocket, and arrangement choices.";

//     // Step 2: Extend
//     while (currentDuration < targetDuration && extensionCount < maxExtensions) {
//       extensionCount++;
//       const continueAt = Math.max(currentDuration - 10, 30);

//       console.log(
//         `[Suno] Extension ${extensionCount}: Current duration ${currentDuration}s, continuing from ${continueAt}s`,
//       );

//       try {
//         const extension = await extendSong({
//           audioId: currentAudioId,
//           continueAt,
//           prompt: `${continuationBase}\n\n${params.lyrics.slice(0, 400)}...`,
//           style: style.slice(0, 1000),
//           title: `${params.title} Part ${extensionCount + 1}`.slice(0, 100),
//           negativeTags,
//           vocalGender,
//           styleWeight,
//           weirdnessConstraint,
//         });

//         currentAudioId = extension.audioId;

//         // Approximate total duration progression
//         currentDuration += extension.duration - (currentDuration - continueAt);

//         clipIds.push(extension.audioId);

//         console.log(
//           `[Suno] Extension ${extensionCount} completed. New total duration: ~${currentDuration}s`,
//         );
//       } catch (extendError: any) {
//         console.error(
//           `[Suno] Extension ${extensionCount} failed:`,
//           extendError?.message || extendError,
//         );
//         break;
//       }
//     }

//     // Step 3: Final audio URL
//     let finalAudioUrl = initialTrack.audioUrl;

//     if (clipIds.length > 1) {
//       try {
//         console.log(
//           `[Suno] Concatenating ${clipIds.length} clips into final song...`,
//         );
//         finalAudioUrl = await concatenateClips(clipIds);
//       } catch (concatError: any) {
//         console.error(
//           `[Suno] Concatenation failed, using initial/last known:`,
//           concatError?.message || concatError,
//         );
//       }
//     }

//     console.log(`[Suno] Song generation completed! Final URL ready.`);

//     return {
//       audioUrl: finalAudioUrl,
//       lyrics: params.lyrics,
//       title: params.title,
//       coverImage: initialTrack.imageUrl,
//     };
//   } catch (error: any) {
//     console.error("Suno API error:", error.response?.data || error.message);

//     if (error.response?.status === 401) {
//       throw new Error(
//         "Invalid Suno API key. Please check your SUNO_API_KEY environment variable.",
//       );
//     }

//     if (error.response?.status === 429) {
//       throw new Error("Insufficient credits or rate limit exceeded.");
//     }

//     throw new Error(
//       error.response?.data?.msg ||
//         error.message ||
//         "Failed to generate song with Suno API",
//     );
//   }
// }

// /**
//  * High-level helper:
//  *  - uses custom lyrics & title directly, OR
//  *  - calls OpenAI to generate lyrics and then passes them into the generator.
//  */
// export async function generateSong(params: GenerateSongParams): Promise<{
//   audioUrl: string;
//   lyrics: string;
//   title: string;
//   coverImage?: string;
// }> {
//   if (!SUNO_API_KEY) {
//     throw new Error(
//       "SUNO_API_KEY is not configured. Please add it to environment variables.",
//     );
//   }

//   const resolvedGenre = resolveGenre(params.genre);

//   // If custom lyrics provided, use them directly
//   if (params.customLyrics && params.customTitle) {
//     console.log(
//       `[Suno] Using custom lyrics provided by user for: ${params.customTitle} [genre=${resolvedGenre}]`,
//     );
//     return generateSongWithLyrics({
//       title: params.customTitle,
//       lyrics: params.customLyrics,
//       tone: params.tone,
//       genre: resolvedGenre,
//       voice: params.voice,
//       additionalNotes: params.additionalNotes,
//       duration: params.duration,
//     });
//   }

//   const { generateSongLyrics } = await import("./openaiService");

//   const songLyrics = await generateSongLyrics({
//     recipientName: params.recipientName,
//     relationship: params.relationship,
//     occasion: params.occasion,
//     tone: params.tone,
//     genre: resolvedGenre,
//     interests: params.interests,
//     insideJokes: params.insideJokes,
//   });

//   return generateSongWithLyrics({
//     title: songLyrics.title,
//     lyrics: songLyrics.lyrics,
//     tone: params.tone,
//     genre: resolvedGenre,
//     voice: params.voice,
//     additionalNotes: params.additionalNotes,
//     duration: params.duration,
//   });
// }

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// // sunoService.ts (ENHANCED with stronger vocal styling)
// // - More specific vocal delivery descriptions
// // - Reference-based style guidance
// // - Tighter steering parameters
// // - Expanded negative tags for unwanted vocal styles

// import axios from "axios";

// const SUNO_API_KEY = process.env.SUNO_API_KEY;
// const SUNO_API_BASE_URL = "https://api.sunoapi.org";

// const DEFAULT_MODEL: "V4_5PLUS" | "V5" = "V4_5PLUS";

// // TIGHTER steering for stronger adherence
// const DEFAULT_STYLE_WEIGHT 1.00;  // Increased from 0.9
// const DEFAULT_WEIRDNESS = 0.08;     // Decreased from 0.15

// // EXPANDED negative tags to exclude unwanted vocal styles
// const DEFAULT_NEGATIVE_TAGS =
//   "pop vocals, breathy indie voice, light head voice, thin vocals, operatic style, musical theater vocals, radio pop, dance pop, glossy synth pop, shiny pop mix, bright synth lead, edm, EDM drops, sidechain pumping, heavy autotune, trap hats, whisper vocals, airy falsetto";

// interface GenerateSongParams {
//   recipientName: string;
//   relationship: string;
//   occasion?: string;
//   tone: string;
//   genre?: string;
//   voice?: string;
//   interests?: string;
//   insideJokes?: string;
//   customLyrics?: string;
//   customTitle?: string;
//   additionalNotes?: string;
//   duration?: "quick" | "extended";
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
//     status:
//       | "SUCCESS"
//       | "GENERATING"
//       | "FAILED"
//       | "WAITING"
//       | "IN_QUEUE"
//       | "CREATED"
//       | "TEXT_SUCCESS"
//       | "FIRST_SUCCESS"
//       | "PENDING"
//       | "GENERATE_AUDIO_FAILED";
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

// function resolveGenre(input?: string): string {
//   if (!input) return "pop";

//   const g = input.toLowerCase().trim();

//   const gospelLike = [
//     "gospel",
//     "worship",
//     "praise",
//     "praise & worship",
//     "praise and worship",
//     "church",
//     "choir",
//   ];
//   if (gospelLike.some((x) => g.includes(x))) return "gospel";

//   if (g === "hip hop" || g === "hip-hop") return "hiphop";
//   if (g === "hiphop") return "hiphop";
//   if (g === "rap") return "rap";
//   if (
//     g === "old school rap" ||
//     g === "old school hip hop" ||
//     g === "80s hip hop"
//   )
//     return "old-school-rap";

//   if (["r&b", "rnb", "r and b", "r n b", "rhythm and blues"].includes(g))
//     return "r&b";

//   if (["soul", "soul music", "classic soul", "60s soul"].includes(g))
//     return "soul";
//   if (["southern soul", "stax", "memphis soul"].includes(g))
//     return "southern-soul";
//   if (["motown", "detroit soul", "60s motown"].includes(g)) return "motown";
//   if (["neo soul", "neo-soul", "modern soul"].includes(g)) return "neo-soul";

//   if (["lofi", "lo-fi", "lo fi"].includes(g)) return "lofi";
//   if (["dance pop", "dance-pop"].includes(g)) return "dance-pop";
//   if (["indie pop", "indie-pop"].includes(g)) return "indie-pop";
//   if (["classic rock", "classic-rock", "70s rock"].includes(g))
//     return "classic-rock";
//   if (["smooth jazz", "smooth-jazz"].includes(g)) return "smooth-jazz";
//   if (["blue grass", "bluegrass"].includes(g)) return "bluegrass";
//   if (["afro beat", "afrobeat", "afro-beat"].includes(g)) return "afrobeat";

//   return g;
// }

// function resolveVocalGender(voice?: string): "m" | "f" | undefined {
//   const v = (voice || "").toLowerCase().trim();
//   if (v === "male" || v === "m") return "m";
//   if (v === "female" || v === "f") return "f";
//   return undefined;
// }

// function parseOverrides(additionalNotes?: string): {
//   styleOverride?: string;
//   negativeOverride?: string;
//   styleWeight?: number;
//   weirdness?: number;
// } {
//   if (!additionalNotes) return {};

//   const styleMatch = additionalNotes.match(/style:\s*(.+?)(?:\n|$)/i);
//   const negMatch = additionalNotes.match(/negative:\s*(.+?)(?:\n|$)/i);
//   const swMatch = additionalNotes.match(/styleweight:\s*([0-9.]+)(?:\n|$)/i);
//   const wMatch = additionalNotes.match(/weirdness:\s*([0-9.]+)(?:\n|$)/i);

//   const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

//   return {
//     styleOverride: styleMatch?.[1]?.trim()?.slice(0, 1000),
//     negativeOverride: negMatch?.[1]?.trim(),
//     styleWeight: swMatch?.[1] ? clamp01(Number(swMatch[1])) : undefined,
//     weirdness: wMatch?.[1] ? clamp01(Number(wMatch[1])) : undefined,
//   };
// }

// /**
//  * ENHANCED vocal delivery guidance with specific techniques and references
//  */
// function buildVocalDeliveryTag(genre: string, voice?: string): string {
//   const v = (voice || "").toLowerCase().trim();
//   const isDuet = v === "duet";

//   if (isDuet) {
//     return "powerful lead + rich harmonies, call-and-response, stacked vocals, full-bodied blend";
//   }

//   // Gospel/Soul family - strongest chest voice, emotional delivery
//   if (["gospel", "soul", "southern-soul", "motown"].includes(genre)) {
//     return "powerful chest voice belt, strong projection, heavy melisma, gospel runs and shouts, churchy vibrato, emotional grit, full-bodied tone, call-and-response phrasing, dynamic peaks and valleys";
//   }

//   // R&B / Neo-Soul - smooth but powerful
//   if (["r&b", "neo-soul"].includes(genre)) {
//     return "rich chest voice, smooth powerful delivery, controlled melisma, soulful runs, emotional nuance, full vocal presence, confident belt on climax";
//   }

//   // Hip-Hop / Rap - strong projection and rhythm
//   if (["rap", "hiphop", "old-school-rap", "trap"].includes(genre)) {
//     return "deep chest voice, strong projection, rhythmic flow precision, confident aggressive delivery, clear powerful enunciation, commanding presence";
//   }

//   // Jazz / Blues - warm and expressive
//   if (["jazz", "smooth-jazz", "blues"].includes(genre)) {
//     return "warm rich chest voice, intimate jazz phrasing, expressive dynamics, subtle vibrato, storytelling delivery, emotional depth";
//   }

//   // Rock - raw power
//   if (["rock", "classic-rock", "alternative", "punk", "metal"].includes(genre)) {
//     return "powerful rock vocal, raw gritty edge, strong chest voice, live energy, dynamic range, emotional intensity";
//   }

//   // Country / Folk - narrative warmth
//   if (["country", "folk", "bluegrass"].includes(genre)) {
//     return "warm narrative vocal, natural chest tone, storytelling delivery, emotional authenticity, country twang";
//   }

//   // Afrobeat - energetic and rhythmic
//   if (genre === "afrobeat") {
//     return "energetic rhythmic vocal, confident delivery, call-and-response style, percussive phrasing, strong projection";
//   }

//   // Default: soulful approach
//   return "powerful chest voice, soulful delivery, melismatic runs, emotional expression, full vocal presence";
// }

// /**
//  * ENHANCED style strings with reference artists/eras and specific techniques
//  */
// function getDetailedStyle(
//   rawGenre: string | undefined,
//   tone: string,
//   voice?: string,
// ): string {
//   const genre = resolveGenre(rawGenre);
//   const delivery = buildVocalDeliveryTag(genre, voice);

//   const baseMix =
//     "live band feel, warm analog mix, prominent vocal presence, dynamic vocal peaks, minimal autotune, avoid glossy pop polish, authentic performance feel";

//   const genreStyles: Record<string, string> = {
//     gospel:
//       "traditional Black gospel, Hammond B3 organ swells, church choir backing, powerful lead vocals with runs and shouts, call-and-response, handclaps on 2 and 4, stomp groove, praise break energy, big dynamic builds, emotional climax moments, full-bodied chest voice throughout",

//     "r&b":
//       "classic R&B slow jam, Rhodes electric piano chords, warm bass groove, tight kick and snare pocket, lush harmonies, smooth lead vocals with controlled melisma, tasteful guitar licks, intimate verses building to powerful chorus",

//     soul:
//       "70s soul, deep pocket groove with swung 16ths, live drums with ghost notes, warm electric bass, Rhodes + Hammond B3 layers, punchy horn stabs, analog tape warmth, powerful emotional vocal delivery, dynamic range from tender to explosive",

//     "southern-soul":
//       "southern soul / Stax Records (Otis Redding, Sam & Dave style), Memphis pocket, gritty Hammond B3 organ, punchy horn section, dry snare sound, warm tape saturation, raw emotional vocal, church-influenced phrasing",

//     motown:
//       "60s Motown (Temptations, Four Tops, Marvin Gaye style), tambourine on backbeat, melodic walking bassline, handclaps, bright horn arrangements, tight rhythm section, energetic vocal performance, sophisticated arrangement",

//     "neo-soul":
//       "neo-soul (D'Angelo, Erykah Badu, Jill Scott style), behind-the-beat groove, tight kick/snare with space, rich Rhodes chords, jazzy extensions (7ths/9ths/13ths), warm analog bass, subtle vinyl texture, conversational yet powerful vocal delivery, hip-hop influenced pocket",

//     rap:
//       "hip-hop (Nas, Jay-Z, Kendrick style), solid boom bap drum pocket, strong low end 808 or bass, minimal melodic elements, emphasis on rhythmic flow, confident vocal delivery, clear enunciation, hard-hitting snare",

//     hiphop:
//       "90s boom bap hip-hop (Wu-Tang, Tribe Called Quest style), MPC-style drums with swing, jazzy samples, vinyl crackle, tight snare, head-nod groove, strong bass presence, rhythmic vocal flow with personality",

//     "old-school-rap":
//       "old school hip-hop (Run-DMC, Grandmaster Flash style), breakbeats, 80s drum machine (808/909), funky bassline, turntable scratches, energetic delivery, party vibe, strong rhythmic emphasis",

//     trap:
//       "trap with soul influence, 808 sub bass, crisp hi-hats and rolls, but keep vocals prominent and avoid pop sheen, hard-hitting snare, spacious mix with vocal presence",

//     jazz:
//       "jazz combo (Ella Fitzgerald, Billie Holiday style), upright bass walking lines, piano comping, brushed drums, sax or trumpet leads, intimate club room feel, expressive vocal phrasing, dynamic range",

//     blues:
//       "electric blues (B.B. King, Muddy Waters style), 12-bar blues progression, guitar bends and sustain, Hammond B3 organ, gritty emotional vocal delivery, call-and-response with instruments, storytelling feel",

//     "smooth-jazz":
//       "smooth jazz (George Benson, Grover Washington Jr. style), electric piano, sax lead, laid-back groove, warm production polish, sophisticated harmony, relaxed yet skillful performance",

//     lofi:
//       "lo-fi hip-hop, jazzy chord progressions, mellow boom bap drums, vinyl texture and crackle, soft saturation, warm analog feel, relaxed vocal delivery if present",

//     rock:
//       "rock with blues/soul influence (Lenny Kravitz, Living Colour style), crunchy guitar riffs, live drums with natural room sound, bass groove, powerful vocal delivery, raw energy, authentic performance",

//     "classic-rock":
//       "classic rock (Hendrix, Cream style), blues rock guitar riffs, live band room sound, prominent bass and drums, powerful vocal performance, big chorus dynamics",

//     country:
//       "country with soul influence (Ray Charles country style), acoustic guitar, pedal steel, steady pocket, storytelling vocal delivery, warm authentic tone, emotional honesty",

//     folk:
//       "folk, fingerpicked acoustic guitar, intimate vocal delivery, minimal processing, natural warmth, storytelling focus, emotional authenticity",

//     bluegrass:
//       "bluegrass, banjo and fiddle leads, tight vocal harmonies, live room feel, acoustic instruments, rapid instrumental passages, traditional style",

//     afrobeat:
//       "afrobeat (Fela Kuti style), polyrhythmic drums and percussion, syncopated guitar patterns, horn section riffs, danceable groove, energetic call-and-response vocals, hypnotic repetition",

//     pop:
//       "modern pop with strong R&B and soul influence, clean hooks, warm mix, avoid EDM elements and maintain vocal authenticity, organic instrumentation preference",

//     "dance-pop":
//       "dance-pop groove with soul influence, tight drums, but avoid EDM drops and excessive synth sheen, keep vocals prominent and authentic",

//     "indie-pop":
//       "indie-pop with soulful warmth, airy guitars, intimate yet powerful vocal delivery, minimal pop gloss, authentic emotional expression",
//   };

//   const chosen = genreStyles[genre] || genreStyles["r&b"];

//   const toneHint = tone?.toLowerCase().includes("romantic")
//     ? "romantic and tender, intimate dynamics building to passionate peaks"
//     : tone?.toLowerCase().includes("hype")
//       ? "high energy, crowd-ready, infectious enthusiasm, powerful delivery throughout"
//       : tone?.toLowerCase().includes("sad")
//         ? "emotional and vulnerable, slow burn, raw honesty, dynamic restraint building to cathartic release"
//         : "balanced dynamics with emotional authenticity, natural ebb and flow";

//   const style = [
//     chosen,
//     delivery,
//     baseMix,
//     toneHint,
//     "NO: thin vocals, breathy indie style, pop vocal production, EDM drops, bright synth leads, shiny pop mix, heavy pitch correction",
//   ].join(", ");

//   return style.slice(0, 1000);
// }

// async function pollTaskStatus(
//   taskId: string,
//   maxAttempts = 90,
// ): Promise<SunoTaskResponse["data"]["response"]> {
//   let lastStatus: string = "UNKNOWN";
//   let lastError: string | undefined;

//   for (let i = 0; i < maxAttempts; i++) {
//     if (i > 0) await new Promise((resolve) => setTimeout(resolve, 10000));

//     const response = await axios.get<SunoTaskResponse>(
//       `${SUNO_API_BASE_URL}/api/v1/generate/record-info`,
//       {
//         params: { taskId },
//         headers: { Authorization: `Bearer ${SUNO_API_KEY}` },
//       },
//     );

//     if (response.data.code !== 200) {
//       throw new Error(response.data.msg || "Failed to query task status");
//     }

//     const { status, response: taskResponse, errorMessage } = response.data.data;
//     lastStatus = status;
//     lastError = errorMessage;

//     const dataCount = taskResponse?.sunoData?.length || 0;
//     const hasAudioUrl = taskResponse?.sunoData?.[0]?.audioUrl ? "YES" : "NO";
//     console.log(
//       `[Suno Poll ${i + 1}/${maxAttempts}] Status: ${status}, Data items: ${dataCount}, Audio URL: ${hasAudioUrl} for taskId: ${taskId}`,
//     );

//     if (status === "SUCCESS" && taskResponse?.sunoData?.length) {
//       const firstTrack = taskResponse.sunoData[0];
//       if (firstTrack.audioUrl) return taskResponse;
//     }

//     if (status === "FAILED" || status === "GENERATE_AUDIO_FAILED") {
//       throw new Error(errorMessage || "Song generation failed");
//     }
//   }

//   throw new Error(
//     `Song generation timed out. Last status: ${lastStatus}${lastError ? `. Error: ${lastError}` : ""}`,
//   );
// }

// async function extendSong(params: {
//   audioId: string;
//   continueAt: number;
//   prompt: string;
//   style: string;
//   title: string;
//   negativeTags: string;
//   vocalGender?: "m" | "f";
//   styleWeight: number;
//   weirdnessConstraint: number;
// }): Promise<{ audioId: string; audioUrl: string; duration: number }> {
//   const callbackUrl = process.env.REPL_SLUG
//     ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/suno-callback`
//     : "https://example.com/callback";

//   const response = await axios.post<SunoGenerateResponse>(
//     `${SUNO_API_BASE_URL}/api/v1/generate/extend`,
//     {
//       audioId: params.audioId,
//       model: DEFAULT_MODEL,
//       continueAt: params.continueAt,
//       prompt: params.prompt,
//       style: params.style,
//       title: params.title,
//       negativeTags: params.negativeTags,
//       ...(params.vocalGender ? { vocalGender: params.vocalGender } : {}),
//       styleWeight: params.styleWeight,
//       weirdnessConstraint: params.weirdnessConstraint,
//       defaultParamFlag: true,
//       callBackUrl: callbackUrl,
//     },
//     {
//       headers: {
//         Authorization: `Bearer ${SUNO_API_KEY}`,
//         "Content-Type": "application/json",
//       },
//     },
//   );

//   if (response.data.code !== 200) {
//     throw new Error(response.data.msg || "Failed to extend song");
//   }

//   const taskId = response.data.data.taskId;
//   const result = await pollTaskStatus(taskId);

//   if (!result?.sunoData?.length) {
//     throw new Error("No audio data returned from Suno extend API");
//   }

//   const track = result.sunoData[0];
//   return {
//     audioId: track.id,
//     audioUrl: track.audioUrl,
//     duration: track.duration,
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
//         Authorization: `Bearer ${SUNO_API_KEY}`,
//         "Content-Type": "application/json",
//       },
//     },
//   );

//   if (response.data.code !== 200) {
//     throw new Error(response.data.msg || "Failed to concatenate clips");
//   }

//   const taskId = response.data.data.taskId;
//   console.log(`[Suno Concat] Concatenation started with taskId: ${taskId}`);

//   const result = await pollTaskStatus(taskId, 60);

//   if (!result?.sunoData?.length) {
//     throw new Error("No audio data returned from Suno concat API");
//   }

//   const finalTrack = result.sunoData[0];
//   console.log(`[Suno Concat] Final song duration: ${finalTrack.duration}s`);

//   return finalTrack.audioUrl;
// }

// export async function generateSongWithLyrics(params: {
//   title: string;
//   lyrics: string;
//   tone: string;
//   genre?: string;
//   voice?: string;
//   additionalNotes?: string;
//   duration?: "quick" | "extended";
// }): Promise<{
//   audioUrl: string;
//   lyrics: string;
//   title: string;
//   coverImage?: string;
// }> {
//   if (!SUNO_API_KEY) {
//     throw new Error(
//       "SUNO_API_KEY is not configured. Please add it to environment variables.",
//     );
//   }

//   try {
//     const callbackUrl = process.env.REPL_SLUG
//       ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/suno-callback`
//       : "https://example.com/callback";

//     const resolvedGenre = resolveGenre(params.genre);
//     const overrides = parseOverrides(params.additionalNotes);

//     const style =
//       overrides.styleOverride ||
//       getDetailedStyle(resolvedGenre, params.tone, params.voice);

//     const negativeTags = overrides.negativeOverride || DEFAULT_NEGATIVE_TAGS;
//     const styleWeight = overrides.styleWeight ?? DEFAULT_STYLE_WEIGHT;
//     const weirdnessConstraint = overrides.weirdness ?? DEFAULT_WEIRDNESS;
//     const vocalGender = resolveVocalGender(params.voice);

//     console.log(`[Suno] Model: ${DEFAULT_MODEL}`);
//     console.log(`[Suno] Genre: ${resolvedGenre}`);
//     console.log(
//       `[Suno] StyleWeight: ${styleWeight} Weirdness: ${weirdnessConstraint}`,
//     );
//     console.log(`[Suno] NegativeTags: ${negativeTags}`);
//     console.log(`[Suno] Style (${style.length} chars): ${style}`);

//     console.log(
//       `[Suno] Starting generation for: ${params.title} [genre=${resolvedGenre}]`,
//     );

//     const response = await axios.post<SunoGenerateResponse>(
//       `${SUNO_API_BASE_URL}/api/v1/generate`,
//       {
//         prompt: params.lyrics,
//         style: style.slice(0, 1000),
//         title: params.title.slice(0, 100),
//         customMode: true,
//         instrumental: false,
//         model: DEFAULT_MODEL,
//         negativeTags,
//         ...(vocalGender ? { vocalGender } : {}),
//         styleWeight,
//         weirdnessConstraint,
//         callBackUrl: callbackUrl,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${SUNO_API_KEY}`,
//           "Content-Type": "application/json",
//         },
//       },
//     );

//     if (response.data.code !== 200) {
//       throw new Error(response.data.msg || "Failed to generate song");
//     }

//     const taskId = response.data.data.taskId;
//     console.log(
//       `[Suno] Initial clip generation started with taskId: ${taskId}`,
//     );

//     const initialResult = await pollTaskStatus(taskId);

//     if (!initialResult?.sunoData?.length) {
//       throw new Error("No audio data returned from Suno API");
//     }

//     const initialTrack = initialResult.sunoData[0];
//     const initialDuration = initialTrack.duration || 60;

//     console.log(
//       `[Suno] Initial clip completed: ${initialDuration}s, ID: ${initialTrack.id}`,
//     );

//     const isExtended = params.duration === "extended";
//     const targetDuration = isExtended ? 180 : 60;
//     const maxExtensions = isExtended ? 3 : 1;

//     let currentDuration = initialDuration;
//     let currentAudioId = initialTrack.id;
//     const clipIds = [initialTrack.id];
//     let extensionCount = 0;

//     const continuationBase =
//       resolvedGenre === "gospel"
//         ? "Continue with powerful choir call-and-response, organ swells, building to a strong praise-break climax with vocal runs and shouts."
//         : "Continue with the same groove, pocket, vocal delivery style, and arrangement choices. Maintain vocal power and authenticity.";

//     while (currentDuration < targetDuration && extensionCount < maxExtensions) {
//       extensionCount++;
//       const continueAt = Math.max(currentDuration - 10, 30);

//       console.log(
//         `[Suno] Extension ${extensionCount}: Current duration ${currentDuration}s, continuing from ${continueAt}s`,
//       );

//       try {
//         const extension = await extendSong({
//           audioId: currentAudioId,
//           continueAt,
//           prompt: `${continuationBase}\n\n${params.lyrics.slice(0, 400)}...`,
//           style: style.slice(0, 1000),
//           title: `${params.title} Part ${extensionCount + 1}`.slice(0, 100),
//           negativeTags,
//           vocalGender,
//           styleWeight,
//           weirdnessConstraint,
//         });

//         currentAudioId = extension.audioId;
//         currentDuration += extension.duration - (currentDuration - continueAt);
//         clipIds.push(extension.audioId);

//         console.log(
//           `[Suno] Extension ${extensionCount} completed. New total duration: ~${currentDuration}s`,
//         );
//       } catch (extendError: any) {
//         console.error(
//           `[Suno] Extension ${extensionCount} failed:`,
//           extendError?.message || extendError,
//         );
//         break;
//       }
//     }

//     let finalAudioUrl = initialTrack.audioUrl;

//     if (clipIds.length > 1) {
//       try {
//         console.log(
//           `[Suno] Concatenating ${clipIds.length} clips into final song...`,
//         );
//         finalAudioUrl = await concatenateClips(clipIds);
//       } catch (concatError: any) {
//         console.error(
//           `[Suno] Concatenation failed, using initial/last known:`,
//           concatError?.message || concatError,
//         );
//       }
//     }

//     console.log(`[Suno] Song generation completed! Final URL ready.`);

//     return {
//       audioUrl: finalAudioUrl,
//       lyrics: params.lyrics,
//       title: params.title,
//       coverImage: initialTrack.imageUrl,
//     };
//   } catch (error: any) {
//     console.error("Suno API error:", error.response?.data || error.message);

//     if (error.response?.status === 401) {
//       throw new Error(
//         "Invalid Suno API key. Please check your SUNO_API_KEY environment variable.",
//       );
//     }

//     if (error.response?.status === 429) {
//       throw new Error("Insufficient credits or rate limit exceeded.");
//     }

//     throw new Error(
//       error.response?.data?.msg ||
//         error.message ||
//         "Failed to generate song with Suno API",
//     );
//   }
// }

// export async function generateSong(params: GenerateSongParams): Promise<{
//   audioUrl: string;
//   lyrics: string;
//   title: string;
//   coverImage?: string;
// }> {
//   if (!SUNO_API_KEY) {
//     throw new Error(
//       "SUNO_API_KEY is not configured. Please add it to environment variables.",
//     );
//   }

//   const resolvedGenre = resolveGenre(params.genre);

//   if (params.customLyrics && params.customTitle) {
//     console.log(
//       `[Suno] Using custom lyrics provided by user for: ${params.customTitle} [genre=${resolvedGenre}]`,
//     );
//     return generateSongWithLyrics({
//       title: params.customTitle,
//       lyrics: params.customLyrics,
//       tone: params.tone,
//       genre: resolvedGenre,
//       voice: params.voice,
//       additionalNotes: params.additionalNotes,
//       duration: params.duration,
//     });
//   }

//   const { generateSongLyrics } = await import("./openaiService");

//   const songLyrics = await generateSongLyrics({
//     recipientName: params.recipientName,
//     relationship: params.relationship,
//     occasion: params.occasion,
//     tone: params.tone,
//     genre: resolvedGenre,
//     interests: params.interests,
//     insideJokes: params.insideJokes,
//   });

//   return generateSongWithLyrics({
//     title: songLyrics.title,
//     lyrics: songLyrics.lyrics,
//     tone: params.tone,
//     genre: resolvedGenre,
//     voice: params.voice,
//     additionalNotes: params.additionalNotes,
//     duration: params.duration,
//   });
// }

///////////////////////////////////////////////////////////////////////////////////////////////////////////

// sunoService.ts (ENHANCED with stronger vocal styling)
// - More specific vocal delivery descriptions
// - Reference-based style guidance
// - Tighter steering parameters
// - Expanded negative tags for unwanted vocal styles

import axios from "axios";

const SUNO_API_KEY = process.env.SUNO_API_KEY;
const SUNO_API_BASE_URL = "https://api.sunoapi.org";

const DEFAULT_MODEL: "V4_5PLUS" | "V5" = "V4_5PLUS";

// TIGHTER steering for stronger adherence
const DEFAULT_STYLE_WEIGHT = 0.95; // Increased from 0.9
const DEFAULT_WEIRDNESS = 0.08; // Decreased from 0.15

// EXPANDED negative tags to exclude unwanted vocal styles
const DEFAULT_NEGATIVE_TAGS =
  "pop vocals, breathy indie voice, light head voice, thin vocals, operatic style, musical theater vocals, radio pop, dance pop, glossy synth pop, shiny pop mix, bright synth lead, edm, EDM drops, sidechain pumping, heavy autotune, trap hats, whisper vocals, airy falsetto";

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
  duration?: "quick" | "extended";
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

interface SunoStyleBoostResponse {
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

/**
 * Use Suno's style boost API to enhance style descriptions
 */
async function boostStyle(styleDescription: string): Promise<string> {
  try {
    const response = await axios.post<SunoStyleBoostResponse>(
      `${SUNO_API_BASE_URL}/api/v1/style/generate`,
      {
        content: styleDescription,
      },
      {
        headers: {
          Authorization: `Bearer ${SUNO_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (response.data.code === 200 && response.data.data.result) {
      console.log(`[Suno Style Boost] Original: ${styleDescription}`);
      console.log(`[Suno Style Boost] Enhanced: ${response.data.data.result}`);
      return response.data.data.result;
    }

    console.log(`[Suno Style Boost] Failed, using original style`);
    return styleDescription;
  } catch (error: any) {
    console.error("[Suno Style Boost] Error:", error.message);
    return styleDescription; // Fallback to original
  }
}

function resolveGenre(input?: string): string {
  if (!input) return "pop";

  const g = input.toLowerCase().trim();

  const gospelLike = [
    "gospel",
    "worship",
    "praise",
    "praise & worship",
    "praise and worship",
    "church",
    "choir",
  ];
  if (gospelLike.some((x) => g.includes(x))) return "gospel";

  if (g === "hip hop" || g === "hip-hop") return "hiphop";
  if (g === "hiphop") return "hiphop";
  if (g === "rap") return "rap";
  if (
    g === "old school rap" ||
    g === "old school hip hop" ||
    g === "80s hip hop"
  )
    return "old-school-rap";

  if (["r&b", "rnb", "r and b", "r n b", "rhythm and blues"].includes(g))
    return "r&b";

  if (["soul", "soul music", "classic soul", "60s soul"].includes(g))
    return "soul";
  if (["southern soul", "stax", "memphis soul"].includes(g))
    return "southern-soul";
  if (["motown", "detroit soul", "60s motown"].includes(g)) return "motown";
  if (["neo soul", "neo-soul", "modern soul"].includes(g)) return "neo-soul";

  if (["lofi", "lo-fi", "lo fi"].includes(g)) return "lofi";
  if (["dance pop", "dance-pop"].includes(g)) return "dance-pop";
  if (["indie pop", "indie-pop"].includes(g)) return "indie-pop";
  if (["classic rock", "classic-rock", "70s rock"].includes(g))
    return "classic-rock";
  if (["smooth jazz", "smooth-jazz"].includes(g)) return "smooth-jazz";
  if (["blue grass", "bluegrass"].includes(g)) return "bluegrass";
  if (["afro beat", "afrobeat", "afro-beat"].includes(g)) return "afrobeat";

  return g;
}

function resolveVocalGender(voice?: string): "m" | "f" | undefined {
  const v = (voice || "").toLowerCase().trim();
  if (v === "male" || v === "m") return "m";
  if (v === "female" || v === "f") return "f";
  return undefined;
}

function parseOverrides(additionalNotes?: string): {
  styleOverride?: string;
  negativeOverride?: string;
  styleWeight?: number;
  weirdness?: number;
} {
  if (!additionalNotes) return {};

  const styleMatch = additionalNotes.match(/style:\s*(.+?)(?:\n|$)/i);
  const negMatch = additionalNotes.match(/negative:\s*(.+?)(?:\n|$)/i);
  const swMatch = additionalNotes.match(/styleweight:\s*([0-9.]+)(?:\n|$)/i);
  const wMatch = additionalNotes.match(/weirdness:\s*([0-9.]+)(?:\n|$)/i);

  const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

  return {
    styleOverride: styleMatch?.[1]?.trim()?.slice(0, 1000),
    negativeOverride: negMatch?.[1]?.trim(),
    styleWeight: swMatch?.[1] ? clamp01(Number(swMatch[1])) : undefined,
    weirdness: wMatch?.[1] ? clamp01(Number(wMatch[1])) : undefined,
  };
}

/**
 * ENHANCED vocal delivery guidance with specific techniques and references
 */
function buildVocalDeliveryTag(genre: string, voice?: string): string {
  const v = (voice || "").toLowerCase().trim();
  const isDuet = v === "duet";

  if (isDuet) {
    // Genre-specific duet styling
    if (
      ["gospel", "soul", "southern-soul", "motown", "r&b", "neo-soul"].includes(
        genre,
      )
    ) {
      return "male and female lead vocals, urban duet style, powerful harmonies, soul/R&B vocal blend";
    }
    if (["rap", "hiphop", "old-school-rap", "trap"].includes(genre)) {
      return "male and female rap/sung vocals, hip-hop duet, alternating verses";
    }
    return "male and female duet, pop/R&B style, vocal harmonies";
  }

  // Gospel/Soul family - strongest chest voice, emotional delivery
  if (["gospel", "soul", "southern-soul", "motown"].includes(genre)) {
    return "powerful urban soul vocal, strong chest voice belt, gospel-influenced runs, emotional grit";
  }

  // R&B / Neo-Soul - smooth but powerful
  if (["r&b", "neo-soul"].includes(genre)) {
    return "smooth urban R&B vocal, rich tone, controlled melisma, contemporary R&B style";
  }

  // Hip-Hop / Rap - strong projection and rhythm
  if (["rap", "hiphop", "old-school-rap", "trap"].includes(genre)) {
    return "confident rap vocal, strong projection, rhythmic flow, urban delivery";
  }

  // Jazz / Blues - warm and expressive
  if (["jazz", "smooth-jazz", "blues"].includes(genre)) {
    return "warm jazz vocal, intimate phrasing, expressive dynamics";
  }

  // Rock - raw power
  if (
    ["rock", "classic-rock", "alternative", "punk", "metal"].includes(genre)
  ) {
    return "powerful rock vocal, raw edge, strong chest voice";
  }

  // Country / Folk - THIS IS THE ISSUE - only use for actual country/folk
  if (["country", "folk", "bluegrass"].includes(genre)) {
    return "warm narrative vocal, natural tone, storytelling delivery";
  }

  // Afrobeat - energetic and rhythmic
  if (genre === "afrobeat") {
    return "energetic rhythmic vocal, call-and-response style";
  }

  // Default: urban/R&B approach (NOT country)
  return "smooth powerful vocal, urban contemporary style";
}

/**
 * ENHANCED style strings with reference artists/eras and specific techniques
 */
function getDetailedStyle(
  rawGenre: string | undefined,
  tone: string,
  voice?: string,
): string {
  const genre = resolveGenre(rawGenre);
  const delivery = buildVocalDeliveryTag(genre, voice);

  const baseMix =
    "live band feel, warm analog mix, prominent vocal presence, dynamic vocal peaks, minimal autotune, avoid glossy pop polish, authentic performance feel";

  const genreStyles: Record<string, string> = {
    gospel:
      "traditional gospel, Hammond B3 organ, church choir, powerful lead vocals with runs and shouts, call-and-response, handclaps, stomp groove, praise break energy",

    "r&b":
      "R&B, Rhodes piano, smooth powerful vocals with melisma, urban groove",

    soul: "70s soul, deep groove, live drums, Rhodes and Hammond B3, horn stabs, powerful emotional vocal, analog warmth",

    "southern-soul":
      "southern soul, Memphis pocket, gritty B3 organ, punchy horns, raw emotional vocal",

    motown:
      "60s Motown, tambourine backbeat, melodic bassline, handclaps, bright horns, energetic vocal",

    "neo-soul":
      "neo-soul, behind-the-beat groove, Rhodes chords, jazz harmony, conversational yet powerful vocal, hip-hop pocket",

    rap: "hip-hop, boom bap drums, strong bass, confident rap delivery, clear flow",

    hiphop:
      "90s boom bap, MPC drums with swing, jazzy samples, vinyl crackle, rhythmic flow",

    "old-school-rap":
      "old school hip-hop, breakbeats, 808 drums, funky bass, energetic delivery",

    trap: "trap, 808 sub bass, crisp hi-hats, powerful vocals, spacious mix",

    jazz: "jazz combo, upright bass, piano, brushed drums, sax, intimate vocal phrasing",

    blues:
      "electric blues, 12-bar, guitar bends, B3 organ, gritty emotional vocal",

    "smooth-jazz": "smooth jazz, electric piano, sax lead, laid-back groove",

    lofi: "lo-fi hip-hop, jazzy chords, mellow drums, vinyl texture",

    rock: "rock with blues influence, crunchy guitar, live drums, powerful vocal",

    "classic-rock":
      "classic rock, blues rock guitar, live band, powerful vocal",

    country:
      "country, acoustic guitar, pedal steel, steady groove, storytelling vocal",

    folk: "folk, acoustic guitar, intimate vocal, minimal processing",

    bluegrass: "bluegrass, banjo and fiddle, tight harmonies, acoustic",

    afrobeat:
      "afrobeat, polyrhythmic drums, syncopated guitar, horn riffs, call-and-response vocals",

    pop: "modern pop with R&B influence, catchy hooks, warm mix",

    "dance-pop": "dance-pop, tight drums, prominent vocals",

    "indie-pop": "indie-pop with soul, airy guitars, intimate powerful vocal",
  };

  const chosen = genreStyles[genre] || genreStyles["r&b"];

  const toneHint = tone?.toLowerCase().includes("romantic")
    ? "romantic and tender, intimate dynamics building to passionate peaks"
    : tone?.toLowerCase().includes("hype")
      ? "high energy, crowd-ready, infectious enthusiasm, powerful delivery throughout"
      : tone?.toLowerCase().includes("sad")
        ? "emotional and vulnerable, slow burn, raw honesty, dynamic restraint building to cathartic release"
        : "balanced dynamics with emotional authenticity, natural ebb and flow";

  const style = [
    chosen,
    delivery,
    baseMix,
    toneHint,
    "NO: thin vocals, breathy indie style, pop vocal production, EDM drops, bright synth leads, shiny pop mix, heavy pitch correction",
  ].join(", ");

  return style.slice(0, 1000);
}

async function pollTaskStatus(
  taskId: string,
  maxAttempts = 90,
): Promise<SunoTaskResponse["data"]["response"]> {
  let lastStatus: string = "UNKNOWN";
  let lastError: string | undefined;

  for (let i = 0; i < maxAttempts; i++) {
    if (i > 0) await new Promise((resolve) => setTimeout(resolve, 10000));

    const response = await axios.get<SunoTaskResponse>(
      `${SUNO_API_BASE_URL}/api/v1/generate/record-info`,
      {
        params: { taskId },
        headers: { Authorization: `Bearer ${SUNO_API_KEY}` },
      },
    );

    if (response.data.code !== 200) {
      throw new Error(response.data.msg || "Failed to query task status");
    }

    const { status, response: taskResponse, errorMessage } = response.data.data;
    lastStatus = status;
    lastError = errorMessage;

    const dataCount = taskResponse?.sunoData?.length || 0;
    const hasAudioUrl = taskResponse?.sunoData?.[0]?.audioUrl ? "YES" : "NO";
    console.log(
      `[Suno Poll ${i + 1}/${maxAttempts}] Status: ${status}, Data items: ${dataCount}, Audio URL: ${hasAudioUrl} for taskId: ${taskId}`,
    );

    if (status === "SUCCESS" && taskResponse?.sunoData?.length) {
      const firstTrack = taskResponse.sunoData[0];
      if (firstTrack.audioUrl) return taskResponse;
    }

    if (status === "FAILED" || status === "GENERATE_AUDIO_FAILED") {
      throw new Error(errorMessage || "Song generation failed");
    }
  }

  throw new Error(
    `Song generation timed out. Last status: ${lastStatus}${lastError ? `. Error: ${lastError}` : ""}`,
  );
}

async function extendSong(params: {
  audioId: string;
  continueAt: number;
  prompt: string;
  style: string;
  title: string;
  negativeTags: string;
  vocalGender?: "m" | "f";
  styleWeight: number;
  weirdnessConstraint: number;
}): Promise<{ audioId: string; audioUrl: string; duration: number }> {
  const callbackUrl = process.env.REPL_SLUG
    ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/suno-callback`
    : "https://example.com/callback";

  const response = await axios.post<SunoGenerateResponse>(
    `${SUNO_API_BASE_URL}/api/v1/generate/extend`,
    {
      audioId: params.audioId,
      model: DEFAULT_MODEL,
      continueAt: params.continueAt,
      prompt: params.prompt,
      style: params.style,
      title: params.title,
      negativeTags: params.negativeTags,
      ...(params.vocalGender ? { vocalGender: params.vocalGender } : {}),
      styleWeight: params.styleWeight,
      weirdnessConstraint: params.weirdnessConstraint,
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
  const result = await pollTaskStatus(taskId);

  if (!result?.sunoData?.length) {
    throw new Error("No audio data returned from Suno extend API");
  }

  const track = result.sunoData[0];
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

  if (!result?.sunoData?.length) {
    throw new Error("No audio data returned from Suno concat API");
  }

  const finalTrack = result.sunoData[0];
  console.log(`[Suno Concat] Final song duration: ${finalTrack.duration}s`);

  return finalTrack.audioUrl;
}

export async function generateSongWithLyrics(params: {
  title: string;
  lyrics: string;
  tone: string;
  genre?: string;
  voice?: string;
  additionalNotes?: string;
  duration?: "quick" | "extended";
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
    const overrides = parseOverrides(params.additionalNotes);

    // Build initial style
    const baseStyle =
      overrides.styleOverride ||
      getDetailedStyle(resolvedGenre, params.tone, params.voice);

    // Use Suno's style boost to enhance the description
    const style = await boostStyle(baseStyle);

    const negativeTags = overrides.negativeOverride || DEFAULT_NEGATIVE_TAGS;
    const styleWeight = overrides.styleWeight ?? DEFAULT_STYLE_WEIGHT;
    const weirdnessConstraint = overrides.weirdness ?? DEFAULT_WEIRDNESS;
    const vocalGender = resolveVocalGender(params.voice);

    console.log(`[Suno] Model: ${DEFAULT_MODEL}`);
    console.log(`[Suno] Genre: ${resolvedGenre}`);
    console.log(
      `[Suno] StyleWeight: ${styleWeight} Weirdness: ${weirdnessConstraint}`,
    );
    console.log(`[Suno] NegativeTags: ${negativeTags}`);
    console.log(`[Suno] Style (${style.length} chars): ${style}`);

    console.log(
      `[Suno] Starting generation for: ${params.title} [genre=${resolvedGenre}]`,
    );

    const response = await axios.post<SunoGenerateResponse>(
      `${SUNO_API_BASE_URL}/api/v1/generate`,
      {
        prompt: params.lyrics,
        style: style.slice(0, 1000),
        title: params.title.slice(0, 100),
        customMode: true,
        instrumental: false,
        model: DEFAULT_MODEL,
        negativeTags,
        ...(vocalGender ? { vocalGender } : {}),
        styleWeight,
        weirdnessConstraint,
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

    if (!initialResult?.sunoData?.length) {
      throw new Error("No audio data returned from Suno API");
    }

    const initialTrack = initialResult.sunoData[0];
    const initialDuration = initialTrack.duration || 60;

    console.log(
      `[Suno] Initial clip completed: ${initialDuration}s, ID: ${initialTrack.id}`,
    );

    const isExtended = params.duration === "extended";
    const targetDuration = isExtended ? 180 : 60;
    const maxExtensions = isExtended ? 3 : 1;

    let currentDuration = initialDuration;
    let currentAudioId = initialTrack.id;
    const clipIds = [initialTrack.id];
    let extensionCount = 0;

    const continuationBase =
      resolvedGenre === "gospel"
        ? "Continue with powerful choir call-and-response, organ swells, building to a strong praise-break climax with vocal runs and shouts."
        : "Continue with the same groove, pocket, vocal delivery style, and arrangement choices. Maintain vocal power and authenticity.";

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
          prompt: `${continuationBase}\n\n${params.lyrics.slice(0, 400)}...`,
          style: style.slice(0, 1000),
          title: `${params.title} Part ${extensionCount + 1}`.slice(0, 100),
          negativeTags,
          vocalGender,
          styleWeight,
          weirdnessConstraint,
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
          extendError?.message || extendError,
        );
        break;
      }
    }

    let finalAudioUrl = initialTrack.audioUrl;

    if (clipIds.length > 1) {
      try {
        console.log(
          `[Suno] Concatenating ${clipIds.length} clips into final song...`,
        );
        finalAudioUrl = await concatenateClips(clipIds);
      } catch (concatError: any) {
        console.error(
          `[Suno] Concatenation failed, using initial/last known:`,
          concatError?.message || concatError,
        );
      }
    }

    console.log(`[Suno] Song generation completed! Final URL ready.`);

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

export async function generateSong(params: GenerateSongParams): Promise<{
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
