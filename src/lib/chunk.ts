/**
 * Splits Markdown pages into semantic chunks based on headings,
 * with token estimation and sliding window overlap for oversized sections.
 */

export interface DocChunk {
  chunkId: string;
  pageId: string;
  pageTitle: string;
  heading: string;
  text: string;
  tokenCount: number;
}

// Approximate 4 chars per token for English markdown
const CHARS_PER_TOKEN = 4;
const MAX_CHUNK_TOKENS = 400; // ~1600 chars
const OVERLAP_TOKENS = 40;    // ~160 chars

export function estimateTokens(text: string): number {
  return Math.ceil(text.trim().length / CHARS_PER_TOKEN);
}

/**
 * Parse front matter and extract body from raw markdown string
 */
export function extractFrontMatter(rawContent: string): { frontMatter: Record<string, any>; body: string } {
  const match = rawContent.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n([\s\S]*)$/);
  if (!match) {
    return { frontMatter: {}, body: rawContent };
  }

  const yamlBlock = match[1];
  const body = match[2];
  const frontMatter: Record<string, any> = {};

  for (const line of yamlBlock.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx > 0) {
      const key = trimmed.slice(0, colonIdx).trim();
      let val = trimmed.slice(colonIdx + 1).trim();

      // Check for array syntax [a, b, c]
      if (val.startsWith('[') && val.endsWith(']')) {
        const items = val
          .slice(1, -1)
          .split(',')
          .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
          .filter(Boolean);
        frontMatter[key] = items;
      } else {
        // Strip quotes
        val = val.replace(/^['"]|['"]$/g, '');
        frontMatter[key] = val;
      }
    }
  }

  return { frontMatter, body };
}

/**
 * Chunks a markdown document by heading (#, ##, ###, etc.)
 * respecting max 400 tokens with 40 token overlap.
 */
export function chunkMarkdown(pageId: string, pageTitle: string, rawContent: string): DocChunk[] {
  const { body } = extractFrontMatter(rawContent);
  const chunks: DocChunk[] = [];

  // Split by Markdown headings while keeping the heading line
  const lines = body.split(/\r?\n/);
  const sections: { heading: string; lines: string[] }[] = [];
  let currentHeading = pageTitle || 'Introduction';
  let currentLines: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      if (currentLines.length > 0) {
        sections.push({ heading: currentHeading, lines: currentLines });
        currentLines = [];
      }
      currentHeading = headingMatch[2].trim();
      currentLines.push(line);
    } else {
      currentLines.push(line);
    }
  }
  if (currentLines.length > 0) {
    sections.push({ heading: currentHeading, lines: currentLines });
  }

  // Process sections and apply overlap if section exceeds max tokens
  let chunkIndex = 0;
  for (const section of sections) {
    const sectionText = section.lines.join('\n').trim();
    if (!sectionText) continue;

    const estimatedTokens = estimateTokens(sectionText);

    if (estimatedTokens <= MAX_CHUNK_TOKENS) {
      chunks.push({
        chunkId: `${pageId}-c${++chunkIndex}`,
        pageId,
        pageTitle,
        heading: section.heading,
        text: sectionText,
        tokenCount: estimatedTokens,
      });
    } else {
      // Split large section using sliding window with overlap
      const maxChars = MAX_CHUNK_TOKENS * CHARS_PER_TOKEN;
      const overlapChars = OVERLAP_TOKENS * CHARS_PER_TOKEN;
      let start = 0;

      while (start < sectionText.length) {
        let end = start + maxChars;
        // Don't cut in the middle of a line if possible
        if (end < sectionText.length) {
          const nextNewline = sectionText.indexOf('\n', end);
          if (nextNewline !== -1 && nextNewline - end < 120) {
            end = nextNewline + 1;
          }
        }

        const chunkText = sectionText.slice(start, end).trim();
        if (chunkText) {
          chunks.push({
            chunkId: `${pageId}-c${++chunkIndex}`,
            pageId,
            pageTitle,
            heading: `${section.heading} (part ${chunkIndex})`,
            text: chunkText,
            tokenCount: estimateTokens(chunkText),
          });
        }

        if (end >= sectionText.length) break;
        start = end - overlapChars;
      }
    }
  }

  return chunks;
}
