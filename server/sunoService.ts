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

  const timeoutMessage = `Song generation timed out after 15 minutes. Last status: ${lastStatus}${lastError ? `. Error: ${lastError}` : ""}`;
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

// Map genres to more descriptive style strings for better AI music generation
// Note: Suno has a tag length limit, so keep styles concise
// Genre comes FIRST to ensure it's the dominant style influence
function getDetailedStyle(genre: string, tone: string): string {
  // For gospel genres, we use very specific tags without mixing in generic tones
  // that might confuse the AI (like "heartfelt" which can sound country)
  const genreStyles: Record<string, string> = {
    gospel: "gospel choir, church organ, spiritual, uplifting",
    "black-gospel":
      "BLACK GOSPEL CHOIR, female African American vocals, 12/8 worship groove, call and response, Hammond B3, tambourine, praise break",
    christmas: "Christmas carol, holiday bells, festive choir",
    pop: `${tone} pop, catchy, modern`,
    rock: `${tone} rock, electric guitar, drums`,
    country: `${tone} country, acoustic guitar, Nashville`,
    "r&b": `${tone} R&B, smooth, neo-soul`,
    rap: `${tone} hip hop, rap, 808 beats`,
    ballad: `${tone} ballad, piano, emotional, slow`,
  };

  // For gospel genres, don't mix in the tone as it can override the gospel sound
  if (genre === "gospel" || genre === "black-gospel") {
    return genreStyles[genre];
  }

  return genreStyles[genre] || `${tone} pop, catchy`;
}

// Generate song with provided lyrics (no OpenAI lyrics generation) - Extended version (~3 minutes)
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
      "SUNO_API_KEY is not configured. Please add it to Replit Secrets.",
    );
  }

  try {
    const callbackUrl = process.env.REPL_SLUG
      ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/suno-callback`
      : "https://example.com/callback";

    // Check if additional notes contain style override (look for "style:" prefix)
    let style: string;
    const styleMatch = params.additionalNotes?.match(/style:\s*(.+?)(?:\n|$)/i);

    if (styleMatch && styleMatch[1]) {
      // Use the custom style from notes, trim to avoid tag length issues
      style = styleMatch[1].trim().substring(0, 100);
      console.log(`[Suno] Using CUSTOM style from notes: ${style}`);
    } else {
      // Use detailed style based on genre
      style = getDetailedStyle(params.genre || "pop", params.tone);
      console.log(`[Suno] Using auto-generated style: ${style}`);
    }

    // Step 1: Generate initial clip (uses V4 for longer initial output)
    console.log(
      `[Suno] Starting extended song generation (~3 minutes) for: ${params.title}`,
    );

    const response = await axios.post<SunoGenerateResponse>(
      `${SUNO_API_BASE_URL}/api/v1/generate`,
      {
        prompt: params.lyrics,
        style: style,
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
    let clipIds = [initialTrack.id];
    let extensionCount = 0;
    const maxExtensions = 3;

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
          continueAt: continueAt,
          prompt: `Continue the song with the same style and energy. ${params.lyrics.slice(0, 200)}...`,
          style: style,
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
        "Invalid Suno API key. Please check your SUNO_API_KEY in Replit Secrets.",
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
      "SUNO_API_KEY is not configured. Please add it to Replit Secrets.",
    );
  }

  // If custom lyrics provided, use them directly
  if (params.customLyrics && params.customTitle) {
    console.log(
      `[Suno] Using custom lyrics provided by user for: ${params.customTitle}`,
    );
    return generateSongWithLyrics({
      title: params.customTitle,
      lyrics: params.customLyrics,
      tone: params.tone,
      genre: params.genre,
    });
  }

  // Otherwise, generate lyrics using OpenAI
  const { generateSongLyrics } = await import("./openaiService");

  const songLyrics = await generateSongLyrics({
    recipientName: params.recipientName,
    relationship: params.relationship,
    occasion: params.occasion,
    tone: params.tone,
    genre: params.genre || "pop",
    interests: params.interests,
    insideJokes: params.insideJokes,
  });

  // Use generateSongWithLyrics for extended song generation
  return generateSongWithLyrics({
    title: songLyrics.title,
    lyrics: songLyrics.lyrics,
    tone: params.tone,
    genre: params.genre,
  });
}

// sunoService.ts
import axios from "axios";

const SUNO_API_KEY = process.env.SUNO_API_KEY;
const SUNO_API_BASE_URL = "https://api.sunoapi.org";

// Global default: all songs assume soulful Black vocals
const DEFAULT_VOICE_STYLE =
  "soulful Black lead vocals, rich warm tone, gospel/R&B phrasing, ";

// Types
interface GenerateSongParams {
  recipientName: string;
  relationship: string;
  occasion?: string;
  tone: string;
  genre?: string;
  voice?: "male" | "female" | "duet"; // optional nuance, still always Black
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
 * - If nothing is passed, default to "pop".
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
  if (g === "hip hop" || g === "hip-hop") return "hip-hop";
  if (g === "hiphop") return "hip-hop";
  if (g === "rap") return "rap";
  if (
    g === "conscious rap" ||
    g === "conscious-rap" ||
    g === "conscious hip hop"
  )
    return "conscious-rap";

  if (g === "r&b" || g === "rnb" || g === "r and b" || g === "r n b")
    return "r&b";
  if (g === "modern r&b" || g === "modern-r&b" || g === "contemporary r&b")
    return "modern-r&b";
  if (g === "quiet storm" || g === "quiet-storm") return "quiet-storm";
  if (
    g === "classic soul" ||
    g === "classic-soul" ||
    g === "70s soul" ||
    g === "motown"
  )
    return "classic-soul";
  if (g === "neo soul" || g === "neo-soul" || g === "neosoul")
    return "neo-soul";
  if (g === "soul blues" || g === "soul-blues") return "soul-blues";
  if (g === "chicago blues" || g === "chicago-blues") return "chicago-blues";

  if (
    g === "p funk" ||
    g === "p-funk" ||
    g === "pfunk" ||
    g === "parliament" ||
    g === "funkadelic"
  )
    return "p-funk";
  if (g === "modern funk" || g === "modern-funk") return "modern-funk";

  if (g === "smooth jazz" || g === "smooth-jazz") return "smooth-jazz";
  if (g === "jazz fusion" || g === "jazz-fusion") return "jazz-fusion";

  if (g === "lofi" || g === "lo-fi" || g === "lo fi") return "lofi";
  if (g === "dance pop" || g === "dance-pop") return "dance-pop";
  if (g === "indie pop" || g === "indie-pop") return "indie-pop";
  if (g === "classic rock" || g === "classic-rock") return "classic-rock";
  if (g === "blues rock" || g === "blues-rock") return "blues-rock";
  if (g === "country soul" || g === "country-soul") return "country-soul";

  // Otherwise use the lowercased string as-is
  return g;
}

/**
 * Style builder specifically tuned for authentic Black gospel band/arrangement.
 * (Vocal race/feel is handled by voicePrefix so we don’t double up.)
 */
function buildBlackGospelBandStyle(): string {
  // Keep this reasonably short; Suno can be sensitive to very long tag strings
  return [
    "church choir harmonies",
    "Hammond B3 organ",
    "live church band",
    "call and response",
    "12/8 worship groove",
    "tambourine",
    "praise break energy",
  ].join(", ");
}

/**
 * Build vocal descriptor prefix - ALWAYS Black and soulful.
 */
function buildVoicePrefix(voice?: "male" | "female" | "duet"): string {
  switch (voice) {
    case "male":
      return "soulful Black male lead vocals, deep baritone/tenor, rich warm tone, ";
    case "female":
      return "soulful Black female lead vocals, alto/soprano, rich warm tone, ";
    case "duet":
      return "soulful Black male and female duet, stacked harmonies, rich warm tone, ";
    default:
      return DEFAULT_VOICE_STYLE;
  }
}

// Map genres to style strings with detailed musical characteristics.
function getDetailedStyle(
  rawGenre: string | undefined,
  tone: string,
  voice?: "male" | "female" | "duet",
): string {
  const genre = resolveGenre(rawGenre);
  const voicePrefix = buildVoicePrefix(voice);

  // Genre-specific style clusters with authentic instrumentation, groove, and production
  // Priority order: instrumentation, rhythm/groove, arrangement, production era, energy
  const genreStyles: Record<string, string> = {
    // Gospel styles - use dedicated builder
    "black-gospel": buildBlackGospelBandStyle(),
    gospel: buildBlackGospelBandStyle(),

    // Soul / R&B - AUTHENTIC BLACK MUSIC STYLES
    soul: "classic soul, live horn section, deep pocket drums, Fender Rhodes, analog warmth, 1970s Motown/Stax feel, gospel-influenced runs",
    "classic-soul":
      "70s soul, live brass arrangement, finger-snapping groove, vintage tape saturation, halftime feel, emotional melisma",
    "neo-soul":
      "neo-soul, Fender Rhodes chords, jazzy 7th harmonies, laid-back pocket groove, live bass, D'Angelo/Erykah Badu vibe",
    "r&b":
      "90s R&B, new jack swing drums, lush vocal stacks, slow jam groove, sensual, Jodeci/Mary J Blige feel",
    rnb: "90s R&B, new jack swing drums, lush vocal stacks, slow jam groove, sensual, deep pocket bass",
    "modern-r&b":
      "modern R&B, 808 bass, trap hi-hats, falsetto runs, moody pads, SZA/Frank Ocean atmosphere",
    "quiet-storm":
      "quiet storm R&B, smooth slow jam, satin sheets vibe, soft synths, intimate whisper vocals, late night radio",

    // Funk - tight grooves
    funk: "funk, slap bass, clavinet, wah guitar, deep pocket ONE groove, James Brown horns, call and response",
    "p-funk":
      "P-funk, synth bass, spacey keyboards, talkbox, Parliament/Funkadelic cosmic groove, tight drums",
    "modern-funk":
      "modern funk, synth bass, 80s drum machine, boogie feel, Thundercat/Anderson Paak vibe",

    // Hip-hop styles
    rap: "melodic hip hop, 808 sub bass, trap hi-hats, sung hooks, atmospheric pads, Drake/Future vibe",
    "hip-hop":
      "boom bap, chopped soul samples, MPC drums, jazzy loops, conscious lyrics, 90s golden era",
    hiphop:
      "boom bap, chopped soul samples, MPC drums, jazzy loops, storytelling verses, 90s golden era",
    trap: "trap, heavy 808s, triplet hi-hats, dark minor keys, Atlanta sound, melodic hooks",
    "conscious-rap":
      "conscious hip hop, jazz samples, live bass, positive message, Kendrick/J Cole vibe",

    // Blues
    blues:
      "delta blues, slide guitar, shuffle groove, Hammond B3 organ, 12-bar progression, gritty emotional vocals",
    "chicago-blues":
      "Chicago blues, electric guitar, harmonica, walking bass, smoky club feel, Muddy Waters vibe",
    "soul-blues":
      "soul blues, horn section, B3 organ, Bobby Blue Bland feel, deep southern groove",

    // Jazz
    jazz: "jazz, swing rhythm, piano trio, walking upright bass, brush drums, sophisticated harmony",
    "smooth-jazz":
      "smooth jazz, soprano sax, Rhodes piano, laid-back groove, late night vibe",
    "jazz-fusion":
      "jazz fusion, complex harmony, slap bass, Herbie Hancock Rhodes, odd time signatures",

    // Pop - but with soul influence
    pop: "pop, catchy hooks, polished production, R&B vocal runs, radio-friendly, contemporary sound",
    "dance-pop":
      "dance pop, four-on-the-floor, synth drops, euphoric chorus, house-influenced, club energy",
    "indie-pop":
      "indie pop, dreamy guitars, lo-fi warmth, bedroom production, quirky melody",

    // Rock with soul
    rock: "rock, electric guitar riffs, live drums, powerful vocals with gospel inflection, arena sound",
    alternative:
      "alternative rock, 90s grunge influence, emotional intensity, raw guitar, dynamic shifts",
    indie: "indie rock, jangly guitars, lo-fi charm, melodic hooks, DIY energy",
    "classic-rock":
      "classic rock, 70s guitar tones, blues-based riffs, analog warmth, live band feel",
    "blues-rock":
      "blues rock, overdriven guitar, shuffle groove, Hammond organ, Hendrix/SRV feel",

    // Country/Folk
    country:
      "modern country, acoustic guitar, steel guitar, Nashville production, storytelling, crossover appeal",
    folk: "folk, fingerpicked acoustic, warm natural vocal, narrative storytelling, organic production",
    "country-soul":
      "country soul, Ray Charles influence, piano, southern groove, gospel harmonies",

    // Electronic with soul
    electronic:
      "electronic, synth textures, soulful vocal chops, atmospheric, modern production",
    edm: "EDM, build and drop, festival energy, anthemic hooks, euphoric breakdown",
    house:
      "deep house, four-on-the-floor, soulful vocal samples, classic Chicago/Detroit feel, warm bass",
    lofi: "lo-fi hip hop, vinyl crackle, jazzy piano samples, chill beats, mellow and nostalgic",

    // Latin
    latin:
      "latin soul, Afro-Cuban percussion, piano montuno, bilingual flow, salsa-influenced",
    reggaeton:
      "reggaeton, dembow riddim, 808 bass, latin trap flavor, club-ready energy",
    salsa:
      "salsa, live brass, congas, piano montuno, call and response, dance floor energy",

    // Caribbean
    reggae:
      "reggae, one drop beat, bass-heavy, off-beat skank guitar, dub echo, island vibes",
    dancehall:
      "dancehall, digital riddim, Caribbean flow, party energy, tropical bass",

    // Special occasions
    christmas:
      "Christmas soul, sleigh bells, gospel choir harmonies, Motown holiday feel, warm and festive",
    ballad:
      "power ballad, piano-driven, emotional strings, slow tempo, big vocal crescendo, gospel runs",
    acoustic:
      "acoustic soul, unplugged guitar, intimate vocals, stripped-down, warm room sound",

    // Other
    disco:
      "disco, four-on-the-floor, funky bass, string stabs, 70s dance floor, Chic/Earth Wind Fire feel",
    metal:
      "heavy metal, distorted guitars, double bass drums, powerful vocals, aggressive energy",
    punk: "punk rock, fast tempo, power chords, raw energy, DIY aesthetic",
    classical:
      "classical crossover, orchestral strings, piano, elegant arrangement, cinematic",
  };

  // For gospel of any kind, force gospel band style but keep Black vocal prefix
  if (genre === "black-gospel" || genre === "gospel") {
    const style = voicePrefix + buildBlackGospelBandStyle();
    console.log(`[Suno] Gospel style: ${style}`);
    return style;
  }

  // Exact match
  if (genreStyles[genre]) {
    const style = voicePrefix + genreStyles[genre];
    console.log(`[Suno] Genre "${genre}" matched to style: ${style}`);
    return style;
  }

  // Partial match for fuzzy cases
  const genreLower = genre.toLowerCase();
  for (const [key, value] of Object.entries(genreStyles)) {
    if (genreLower.includes(key) || key.includes(genreLower)) {
      const style = voicePrefix + value;
      console.log(
        `[Suno] Genre "${genre}" partially matched to "${key}" style: ${style}`,
      );
      return style;
    }
  }

  // Default fallback
  const fallback =
    voicePrefix +
    `${tone} pop, synth-driven, catchy hooks, polished production, R&B-infused vocals`;
  console.log(
    `[Suno] Genre "${genre}" not found, using pop fallback: ${fallback}`,
  );
  return fallback;
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
  voice?: "male" | "female" | "duet";
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

    const voicePrefix = buildVoicePrefix(params.voice);

    // If user includes a "style:" override, we STILL keep the Black soulful voice prefix.
    let style: string;
    const styleMatch = params.additionalNotes?.match(/style:\s*(.+?)(?:\n|$)/i);

    if (styleMatch && styleMatch[1]) {
      const userStyle = styleMatch[1].trim().substring(0, 120);
      style = voicePrefix + userStyle;
      console.log(
        `[Suno] Using CUSTOM style from notes (with Black vocals): ${style}`,
      );
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
        prompt: params.lyrics,
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

    const continuationBase = isGospel
      ? "Continue this BLACK GOSPEL worship song with the same soulful Black choir energy, Hammond organ feel, and call-and-response spirit."
      : `Continue this ${resolvedGenre} song with the same groove, production style, and soulful Black vocal energy.`;

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
  });
}
