import { store, parseDocPage, type DocPage, type ChunkEmbedding, type StoredProposal, type AudienceBriefings } from './store.ts';
import { chunkMarkdown } from './chunk.ts';
import { rankChunks } from './similarity.ts';

export interface AnalyzeProgressCallback {
  (step: 'Scanning' | 'Finding related pages' | 'Drafting edits' | 'Done' | string): void;
}

/**
 * Fetch embeddings for a list of texts through /api/embed
 */
export async function fetchEmbeddings(texts: string[]): Promise<number[][]> {
  const res = await fetch('/api/embed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorData.error || `Embed request failed with status ${res.status}`);
  }

  const data = await res.json();
  return data.vectors || [];
}

/**
 * Ensures all loaded pages are chunked and embedded in cache.
 */
export async function syncEmbeddings(
  onProgress?: (current: number, total: number) => void
): Promise<ChunkEmbedding[]> {
  const existing = store.getEmbeddings();
  const pages = store.getPages();

  if (pages.length === 0) return [];

  // Generate chunks for all current pages
  const allChunks = pages.flatMap((p) => chunkMarkdown(p.id, p.title, p.content));

  // Determine which chunks are missing vectors
  const existingMap = new Map(existing.map((e) => [e.chunkId, e]));
  const missingChunks = allChunks.filter((c) => !existingMap.has(c.chunkId));

  if (missingChunks.length === 0) {
    return existing;
  }

  // Fetch embeddings in batches of 6
  const updatedEmbeddings: ChunkEmbedding[] = [...existing];
  const batchSize = 6;

  for (let i = 0; i < missingChunks.length; i += batchSize) {
    const batch = missingChunks.slice(i, i + batchSize);
    const textsToEmbed = batch.map((c) => `${c.pageTitle} - ${c.heading}\n${c.text}`);
    
    const vectors = await fetchEmbeddings(textsToEmbed);
    batch.forEach((chunk, idx) => {
      const vec = vectors[idx] || [];
      const item: ChunkEmbedding = {
        chunkId: chunk.chunkId,
        pageId: chunk.pageId,
        heading: chunk.heading,
        text: chunk.text,
        vector: vec,
      };
      updatedEmbeddings.push(item);
    });

    if (onProgress) {
      onProgress(Math.min(i + batchSize, missingChunks.length), missingChunks.length);
    }
  }

  store.setEmbeddings(updatedEmbeddings);
  return updatedEmbeddings;
}

/**
 * Validates the raw proposals returned by Gemini.
 */
export function validateProposals(raw: any): StoredProposal[] {
  if (!Array.isArray(raw)) {
    throw new Error('AI output is not a valid list of edits.');
  }

  const valid: StoredProposal[] = [];
  for (const item of raw) {
    if (!item.page_id || typeof item.page_id !== 'string') {
      throw new Error(`Invalid proposal: missing "page_id" in item: ${JSON.stringify(item)}`);
    }
    if (!item.before || typeof item.before !== 'string') {
      throw new Error(`Invalid proposal for page "${item.page_id}": missing original "before" text.`);
    }
    if (!item.after || typeof item.after !== 'string') {
      throw new Error(`Invalid proposal for page "${item.page_id}": missing proposed "after" text.`);
    }

    const conf = String(item.confidence || 'Medium').toLowerCase();
    const normalizedConfidence: 'High' | 'Medium' | 'Low' =
      conf === 'high' ? 'High' : conf === 'low' ? 'Low' : 'Medium';

    valid.push({
      page_id: item.page_id,
      confidence: normalizedConfidence,
      reason: item.reason || 'Documentation updated to reflect latest product changes.',
      before: item.before,
      after: item.after,
      customAfter: undefined,
      decision: undefined,
    });
  }

  return valid;
}

/**
 * Analyzes impact using RAG retrieval + Gemini propose edits.
 * Streams progress through onProgress callback.
 */
export async function analyzeChangeImpact(
  changeText: string,
  onProgress?: AnalyzeProgressCallback
): Promise<StoredProposal[]> {
  onProgress?.('Scanning');

  // Ensure doc embeddings are ready
  const embeddings = await syncEmbeddings();
  const pages = store.getPages();

  if (pages.length === 0) {
    throw new Error('No documentation pages are loaded. Please load a project first.');
  }

  onProgress?.('Finding related pages');

  // 1. Embed the change text
  const [changeVector] = await fetchEmbeddings([changeText]);

  // 2. Rank chunks by similarity
  const chunkVectorPairs = embeddings.map((e) => ({
    chunk: {
      chunkId: e.chunkId,
      pageId: e.pageId,
      pageTitle: pages.find((p) => p.id === e.pageId)?.title || e.pageId,
      heading: e.heading,
      text: e.text,
      tokenCount: 0,
    },
    vector: e.vector,
  }));

  const ranked = rankChunks(changeVector, chunkVectorPairs);
  // Retrieve top 8 chunks as specified in prompt
  const top8 = ranked.slice(0, 8);

  // Group retrieved chunks by page and track snippets
  const pageSnippetsMap = new Map<string, { heading: string; text: string; score: number }[]>();
  for (const { chunk, score } of top8) {
    const list = pageSnippetsMap.get(chunk.pageId) || [];
    list.push({
      heading: chunk.heading,
      text: chunk.text.slice(0, 220) + (chunk.text.length > 220 ? '...' : ''),
      score: parseFloat(score.toFixed(3)),
    });
    pageSnippetsMap.set(chunk.pageId, list);
  }

  // Find candidate pages that appeared in top chunks
  const candidatePageIds = Array.from(pageSnippetsMap.keys());
  const candidatePages = candidatePageIds
    .map((id) => pages.find((p) => p.id === id))
    .filter((p): p is DocPage => Boolean(p));

  // If no chunks were retrieved or similarity is too low, include first 3 pages as fallback
  const pagesToSend = candidatePages.length > 0 ? candidatePages : pages.slice(0, 4);

  onProgress?.('Drafting edits');

  // Try Server-Sent Events stream or fallback to direct POST
  const response = await fetch('/api/analyze?stream=true', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({
      change: changeText,
      pages: pagesToSend.map((p) => ({
        id: p.id,
        title: p.title,
        source_files: p.source_files,
        content: p.content,
      })),
    }),
  });

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errJson.error || `Analyze failed with status ${response.status}`);
  }

  let finalEdits: StoredProposal[] = [];

  // Parse SSE response
  if (response.headers.get('content-type')?.includes('text/event-stream') && response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(trimmed.slice(6));
            if (parsed.type === 'step') {
              onProgress?.(parsed.data);
            } else if (parsed.type === 'result') {
              finalEdits = validateProposals(parsed.data);
            } else if (parsed.type === 'error') {
              throw new Error(parsed.data || 'Analysis error occurred.');
            }
          } catch (e: any) {
            if (e.message?.includes('Analysis error') || e.message?.includes('Invalid proposal')) {
              throw e;
            }
          }
        }
      }
    }
  } else {
    // Non-streaming fallback
    const resJson = await response.json();
    finalEdits = validateProposals(resJson.edits);
  }

  onProgress?.('Done');

  // Attach retrieved evidence snippets to each proposal
  const enriched = finalEdits.map((item) => {
    const snippets = pageSnippetsMap.get(item.page_id) || [];
    return {
      ...item,
      retrievedSnippets: snippets,
    };
  });

  store.setCurrentChange(changeText);
  store.setProposals(enriched);
  store.setCheckboxConfirmed(false);

  return enriched;
}

/**
 * Calls /api/brief to generate audience briefings.
 */
export async function generateAudienceBriefings(
  change: string,
  approvedEdits: StoredProposal[]
): Promise<AudienceBriefings> {
  const res = await fetch('/api/brief', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ change, approvedEdits }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Briefing request failed with status ${res.status}`);
  }

  const data: AudienceBriefings = await res.json();
  store.setBriefings(data);
  return data;
}

/**
 * Loads the complete VaultLite sample project and embeds chunks.
 */
export async function loadSampleProject(
  onProgress?: (msg: string) => void
): Promise<{ pages: DocPage[]; sampleChange: string }> {
  onProgress?.('Loading VaultLite sample documentation...');

  const res = await fetch('/api/sample-data');
  if (!res.ok) {
    throw new Error('Failed to load sample documentation from server.');
  }

  const { docs, sampleChange } = await res.json();
  const parsedPages: DocPage[] = docs.map((d: any) => parseDocPage(d.filename, d.content));

  store.setPages(parsedPages);
  store.setCurrentChange(sampleChange);
  store.setProposals([]);
  store.setCheckboxConfirmed(false);

  onProgress?.('Generating vector embeddings for search...');
  await syncEmbeddings((curr, total) => {
    onProgress?.(`Embedding documentation chunks (${curr}/${total})...`);
  });

  onProgress?.('Sample project loaded successfully!');
  return { pages: parsedPages, sampleChange };
}
