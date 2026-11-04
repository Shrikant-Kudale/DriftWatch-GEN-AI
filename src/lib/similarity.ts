import type { DocChunk } from './chunk.ts';

/**
 * Computes standard Cosine Similarity between two numeric vectors.
 * Returns a value between -1.0 and 1.0 (typically 0.0 to 1.0 for embeddings).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length === 0 || b.length === 0 || a.length !== b.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface ScoredChunk {
  chunk: DocChunk;
  score: number;
}

/**
 * Ranks chunks by cosine similarity to a query embedding vector.
 */
export function rankChunks(
  queryVector: number[],
  chunkVectors: { chunk: DocChunk; vector: number[] }[]
): ScoredChunk[] {
  const scored = chunkVectors.map(({ chunk, vector }) => ({
    chunk,
    score: cosineSimilarity(queryVector, vector),
  }));

  return scored.sort((a, b) => b.score - a.score);
}
