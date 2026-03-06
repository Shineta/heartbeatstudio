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

export async function createVideoFromLink(params: CreateVideoParams): Promise<CreatifyVideo> {
  const response = await fetch(`${CREATIFY_BASE_URL}/link_to_videos/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(params),
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
  { value: 'AvatarFullTemplate', label: 'Avatar Full Screen' },
  { value: 'SplitScreenTemplate', label: 'Split Screen' },
  { value: 'StockVideoTemplate', label: 'Stock Video' },
  { value: 'ExplainerTemplate', label: 'Explainer' },
] as const;

export const SCRIPT_STYLES = [
  { value: 'BenefitsV2', label: 'Benefits' },
  { value: 'ProblemSolution', label: 'Problem & Solution' },
  { value: 'Storytelling', label: 'Storytelling' },
  { value: 'Testimonial', label: 'Testimonial' },
  { value: 'HowTo', label: 'How-To' },
  { value: 'ListStyle', label: 'List Style' },
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
