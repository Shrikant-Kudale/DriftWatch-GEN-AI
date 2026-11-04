import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

export function getApiKey(): string | undefined {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GEMINNI_API_KEY ||
    process.env.GEMINI_KEY ||
    process.env.API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.gemini_api_key ||
    process.env.GOOGLE_API_KEY
  );
}

export function isGeminiConfigured(): boolean {
  return Boolean(getApiKey());
}

export function getGeminiClient(): GoogleGenAI {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please set GEMINI_API_KEY in your Vercel project environment variables or local .env file.'
    );
  }

  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL || 'gemini-3.8-flash';
}

export function getGeminiEmbedModel(): string {
  return process.env.GEMINI_EMBED_MODEL || 'gemini-embedding-2-preview';
}

export async function withRetry<T>(fn: () => Promise<T>, retries = 1, delayMs = 1200): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    if (retries > 0) {
      const isRateLimit =
        err?.status === 429 ||
        String(err?.message || '').includes('429') ||
        String(err?.message || '').toLowerCase().includes('quota');
      const isTransient =
        err?.status >= 500 ||
        String(err?.message || '').toLowerCase().includes('network') ||
        String(err?.message || '').toLowerCase().includes('timeout');
      if (isRateLimit || isTransient) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return withRetry(fn, retries - 1, delayMs * 2);
      }
    }
    throw err;
  }
}
