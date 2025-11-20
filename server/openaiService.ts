// From blueprint:javascript_openai_ai_integrations
import OpenAI from "openai";
import { Buffer } from "node:buffer";

// This is using Replit's AI Integrations service
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

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
    model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_completion_tokens: 8192,
  });

  const content = JSON.parse(response.choices[0]?.message?.content || '{"message": "", "title": ""}');
  return content;
}

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

  const base64 = response.data?.[0]?.b64_json ?? "";
  return base64;
}

export async function generateSongLyrics(params: {
  recipientName: string;
  relationship: string;
  occasion?: string;
  tone: string;
  genre?: string;
  interests?: string;
  insideJokes?: string;
}): Promise<{ lyrics: string; title: string; description: string }> {
  const prompt = `Write ${params.tone} song lyrics (30-60 seconds when sung) for ${params.recipientName}, my ${params.relationship}.
${params.occasion ? `Occasion: ${params.occasion}` : ''}
${params.genre ? `Genre: ${params.genre}` : ''}
${params.interests ? `Their interests: ${params.interests}` : ''}
${params.insideJokes ? `Inside jokes: ${params.insideJokes}` : ''}

Create personalized, heartfelt lyrics with:
- A catchy title (3-5 words)
- 2 verses and a chorus
- Personal touches that celebrate them
- ${params.tone} and ${params.genre || 'upbeat'} style
- A brief description of the song's vibe

Return as JSON with 'lyrics', 'title', and 'description' fields.`;

  const response = await openai.chat.completions.create({
    model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_completion_tokens: 8192,
  });

  const content = JSON.parse(response.choices[0]?.message?.content || '{"lyrics": "", "title": "", "description": ""}');
  return content;
}

export async function generateSongCover(params: {
  title: string;
  tone: string;
  genre?: string;
}): Promise<string> {
  const prompt = `Create album cover art for a ${params.tone} ${params.genre || 'pop'} song titled "${params.title}". Vibrant, colorful, modern design with musical elements, hearts, and celebration motifs. Professional music album artwork style.`;

  const response = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    size: "1024x1024",
  });

  const base64 = response.data?.[0]?.b64_json ?? "";
  return base64;
}
