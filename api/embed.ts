import type { Request, Response } from 'express';
import { getGeminiClient, getGeminiEmbedModel, getApiKey, withRetry } from './geminiClient.ts';

/**
 * Computes deterministic pseudo-embedding based on character n-grams and word hashing
 * Used as fallback if GEMINI_API_KEY is not yet configured or rate limited.
 */
function fallbackEmbedding(text: string, dim = 768): number[] {
  const vec = new Array(dim).fill(0);
  const words = text.toLowerCase().split(/\W+/).filter(Boolean);
  if (words.length === 0) return vec;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = (hash << 5) - hash + word.charCodeAt(j);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dim;
    vec[idx] += 1.0;
  }

  // Normalize vector
  let norm = 0;
  for (let i = 0; i < dim; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dim; i++) vec[i] /= norm;
  }
  return vec;
}

export default async function handler(req: Request, res: Response) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { texts } = req.body || {};
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: 'Missing or invalid "texts" array in request body.' });
    }

    const hasKey = Boolean(getApiKey());

    // If no key configured, immediately return deterministic heuristic vectors so app never crashes
    if (!hasKey) {
      console.warn('GEMINI_API_KEY not configured, using deterministic keyword vector fallback.');
      const vectors = texts.map((t) => fallbackEmbedding(t || ''));
      return res.status(200).json({ vectors, fallback: true });
    }

    const ai = getGeminiClient();
    const model = getGeminiEmbedModel();

    // Process embeddings in concurrent batches
    const vectors: number[][] = [];
    const batchSize = 6;

    for (let i = 0; i < texts.length; i += batchSize) {
      const slice = texts.slice(i, i + batchSize);
      const batchVectors = await Promise.all(
        slice.map((text) =>
          withRetry(async () => {
            const cleanText = (text || '').trim();
            if (!cleanText) {
              return new Array(768).fill(0);
            }
            const response = await ai.models.embedContent({
              model,
              contents: cleanText,
            });
            const vector = response.embeddings?.[0]?.values || [];
            return vector.length > 0 ? vector : fallbackEmbedding(cleanText);
          })
        )
      );
      vectors.push(...batchVectors);
    }

    return res.status(200).json({ vectors });
  } catch (error: any) {
    console.error('Error generating embeddings, falling back to local vectors:', error);
    // Even if Gemini quota is exceeded, return fallback vectors so the user can continue testing!
    const { texts } = req.body || {};
    if (Array.isArray(texts)) {
      const vectors = texts.map((t: string) => fallbackEmbedding(t || ''));
      return res.status(200).json({ vectors, fallback: true, warning: error?.message });
    }
    return res.status(500).json({
      error: error?.message || 'Failed to generate text embeddings.',
    });
  }
}
