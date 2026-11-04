import type { Request, Response } from 'express';
import { getGeminiClient, getGeminiEmbedModel, withRetry } from './geminiClient.ts';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { texts } = req.body || {};
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: 'Missing or invalid "texts" array in request body.' });
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
            // Extract vector array from response
            const vector = response.embeddings?.[0]?.values || [];
            return vector;
          })
        )
      );
      vectors.push(...batchVectors);
    }

    return res.status(200).json({ vectors });
  } catch (error: any) {
    console.error('Error generating embeddings:', error);
    const statusCode = error?.status === 429 ? 429 : 500;
    return res.status(statusCode).json({
      error: error?.message || 'Failed to generate text embeddings from Gemini.',
    });
  }
}
