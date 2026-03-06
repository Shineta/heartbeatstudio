const CREATIFY_API_ID = process.env.CREATIFY_API_ID;
const CREATIFY_API_KEY = process.env.CREATIFY_API_KEY;
const CREATIFY_BASE_URL = 'https://api.creatify.ai/api';

function getHeaders() {
  if (!CREATIFY_API_ID || !CREATIFY_API_KEY) {
    throw new Error('Creatify API credentials not configured');
  }
  return {
    'Content-Type': 'application/json',
    'X-API-ID': CREATIFY_API_ID,
    'X-API-KEY': CREATIFY_API_KEY,
  };
}

export interface CreateVideoParams {
  link: string;
  name?: string;
  target_platform?: string;
  target_audience?: string;
  language?: string;
  video_length?: number;
  aspect_ratio?: '16x9' | '9x16' | '1x1';
  script_style?: string;
  visual_style?: string;
  override_script?: string;
  override_voice?: string;
  no_background_music?: boolean;
  no_caption?: boolean;
  caption_style?: string;
  model_version?: string;
}

export interface CreatifyVideo {
  id: string;
  link: string;
  media_job: string;
  status: string;
  failed_reason: string | null;
  video_output: string | null;
  video_thumbnail: string | null;
  outputs: Array<{
    media_job: string;
    visual_style: string;
    video_output: string | null;
    video_thumbnail: string | null;
    status: string;
    progress: number;
    failed_reason: string | null;
    aspect_ratio: string;
    duration: number;
  }>;
  credits_used: number;
  duration: number;
  progress: string;
  preview: string | null;
  previews: Array<{
    media_job: string;
    visual_style: string;
    url: string;
    editor_url: string;
    aspect_ratio: string;
    duration: number;
  }>;
  editor_url: string | null;
  name: string | null;
  target_platform: string | null;
  target_audience: string | null;
  language: string;
  video_length: number;
  aspect_ratio: string;
}

export interface CreatifyVoice {
  id: string;
  name: string;
  accent: string;
  gender?: string;
}

function sanitizeUrl(url: string): string {
  return url
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '')
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, '')
    .trim();
}

async function createLinkResource(url: string): Promise<string> {
  const cleanUrl = sanitizeUrl(url);
  console.log(`[Creatify] Creating link resource for URL: ${cleanUrl}`);

  const response = await fetch(`${CREATIFY_BASE_URL}/links/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ url: cleanUrl }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Creatify] Create link error:', response.status, errorText);
    throw new Error(`Failed to create Creatify link: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log(`[Creatify] Link resource created with ID: ${data.id}`);
  return data.id;
}

async function waitForLinkReady(linkId: string, maxAttempts = 30): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`${CREATIFY_BASE_URL}/links/${linkId}/`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to check link status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[Creatify] Link ${linkId} status: ${data.status}`);

    if (data.status === 'done' || data.status === 'completed') {
      return;
    }
    if (data.status === 'failed' || data.status === 'error') {
      throw new Error(`Link analysis failed: ${data.failed_reason || 'Unknown error'}`);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  throw new Error('Link analysis timed out after 60 seconds');
}

export async function createVideoFromLink(params: CreateVideoParams): Promise<CreatifyVideo> {
  const linkId = await createLinkResource(params.link);
  await waitForLinkReady(linkId);

  const videoParams: Record<string, any> = {
    link: linkId,
  };

  if (params.name) videoParams.name = params.name;
  if (params.target_platform) videoParams.target_platform = params.target_platform;
  if (params.target_audience) videoParams.target_audience = params.target_audience;
  if (params.language) videoParams.language = params.language;
  if (params.video_length) videoParams.video_length = params.video_length;
  if (params.aspect_ratio) videoParams.aspect_ratio = params.aspect_ratio;
  if (params.script_style) videoParams.script_style = params.script_style;
  if (params.visual_style) videoParams.visual_style = params.visual_style;
  if (params.override_script && params.override_script.trim().length >= 20) {
    videoParams.override_script = params.override_script.trim();
  }
  if (params.no_background_music !== undefined) videoParams.no_background_music = params.no_background_music;
  if (params.no_caption !== undefined) videoParams.no_caption = params.no_caption;

  console.log(`[Creatify] Creating video with link ID: ${linkId}`);

  const response = await fetch(`${CREATIFY_BASE_URL}/link_to_videos/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(videoParams),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Creatify] Create video error:', response.status, errorText);
    throw new Error(`Creatify API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function getVideoStatus(videoId: string): Promise<CreatifyVideo> {
  const response = await fetch(`${CREATIFY_BASE_URL}/link_to_videos/${videoId}/`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Creatify] Get video error:', response.status, errorText);
    throw new Error(`Creatify API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function getVideoHistory(): Promise<CreatifyVideo[]> {
  const response = await fetch(`${CREATIFY_BASE_URL}/link_to_videos/`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Creatify] Get history error:', response.status, errorText);
    throw new Error(`Creatify API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function renderVideo(videoId: string): Promise<CreatifyVideo> {
  const response = await fetch(`${CREATIFY_BASE_URL}/link_to_videos/${videoId}/render/`, {
    method: 'POST',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Creatify] Render video error:', response.status, errorText);
    throw new Error(`Creatify API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function getVoices(): Promise<any[]> {
  const response = await fetch(`${CREATIFY_BASE_URL}/voices/`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Creatify] Get voices error:', response.status, errorText);
    throw new Error(`Creatify API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export function isCreatifyConfigured(): boolean {
  return !!(CREATIFY_API_ID && CREATIFY_API_KEY);
}

export const VISUAL_STYLES = [
  { value: 'AvatarBubbleTemplate', label: 'Avatar Bubble' },
  { value: 'FullScreenTemplate', label: 'Full Screen' },
  { value: 'FullScreenV2Template', label: 'Full Screen V2' },
  { value: 'SideBySideTemplate', label: 'Side by Side' },
  { value: 'VanillaTemplate', label: 'Vanilla' },
  { value: 'EnhancedVanillaTemplate', label: 'Dynamic Vanilla' },
  { value: 'DramaticTemplate', label: 'Dramatic' },
  { value: 'FeatureHighlightTemplate', label: 'Feature Highlight' },
  { value: 'MotionCardsTemplate', label: 'Motion Cards' },
  { value: 'SmartAdsTemplate', label: 'Smart Ads' },
  { value: 'StandardAdsTemplate', label: 'Standard Ads' },
  { value: 'VlogTemplate', label: 'Vlog' },
  { value: 'ScribbleTemplate', label: 'Scribble' },
  { value: 'QuickTransitionTemplate', label: 'Quick Transition' },
  { value: 'DynamicProductTemplate', label: 'Product' },
  { value: 'SimpleAvatarOverlayTemplate', label: 'Product Presenter' },
  { value: 'GreenScreenEffectTemplate', label: 'Green Screen Effect' },
] as const;

export const SCRIPT_STYLES = [
  { value: 'BenefitsV2', label: 'Benefits' },
  { value: 'ProblemSolutionV2', label: 'Problem & Solution' },
  { value: 'StoryTimeWriter', label: 'Storytelling' },
  { value: 'HowToV2', label: 'How-To' },
  { value: 'EmotionalWriter', label: 'Emotional' },
  { value: 'BrandStoryV2', label: 'Brand Story' },
  { value: 'CallToActionV2', label: 'Call to Action' },
  { value: 'DiscoveryWriter', label: 'Discovery' },
  { value: 'ProductHighlightsV2', label: 'Product Highlights' },
  { value: 'SpecialOffersV2', label: 'Special Offers' },
  { value: 'ThreeReasonsWriter', label: '3 Reasons Why' },
  { value: 'GenzWriter', label: 'Gen Z' },
  { value: 'MotivationalWriter', label: 'Motivational' },
] as const;

export const PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'X (Twitter)' },
] as const;

export const ASPECT_RATIOS = [
  { value: '9x16', label: '9:16 (Vertical/Stories)' },
  { value: '16x9', label: '16:9 (Landscape/YouTube)' },
  { value: '1x1', label: '1:1 (Square/Feed)' },
] as const;

export const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'it', label: 'Italian' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ar', label: 'Arabic' },
  { value: 'ru', label: 'Russian' },
  { value: 'nl', label: 'Dutch' },
  { value: 'sv', label: 'Swedish' },
  { value: 'tr', label: 'Turkish' },
] as const;
