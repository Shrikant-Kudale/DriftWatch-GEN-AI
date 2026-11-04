import { extractFrontMatter } from './chunk.ts';

export interface DocPage {
  id: string;
  filename: string;
  title: string;
  type: 'Concept' | 'Task' | 'Reference' | string;
  product_version: string;
  owner: string;
  last_verified: string;
  tags: string[];
  source_files: string[];
  content: string;
}

export interface ChunkEmbedding {
  chunkId: string;
  pageId: string;
  heading: string;
  text: string;
  vector: number[];
}

export interface StoredProposal {
  page_id: string;
  confidence: 'High' | 'Medium' | 'Low';
  reason: string;
  before: string;
  after: string;
  customAfter?: string;
  decision?: 'approved' | 'rejected';
  retrievedSnippets?: { heading: string; text: string; score: number }[];
}

export interface AudienceBriefings {
  for_administrators: string;
  for_executives: string;
  for_support: string;
}

export interface AppStats {
  hoursSaved: number;
}

const STORAGE_KEYS = {
  PAGES: 'driftwatch_pages',
  EMBEDDINGS: 'driftwatch_embeddings',
  CURRENT_CHANGE: 'driftwatch_current_change',
  PROPOSALS: 'driftwatch_proposals',
  STATS: 'driftwatch_stats',
  BRIEFINGS: 'driftwatch_briefings',
  CHECKBOX_CONFIRMED: 'driftwatch_checkbox_confirmed',
};

export const store = {
  // --- Pages ---
  getPages(): DocPage[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PAGES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  setPages(pages: DocPage[]): void {
    localStorage.setItem(STORAGE_KEYS.PAGES, JSON.stringify(pages));
  },

  getPageById(id: string): DocPage | undefined {
    return this.getPages().find((p) => p.id === id);
  },

  // --- Embeddings ---
  getEmbeddings(): ChunkEmbedding[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.EMBEDDINGS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  setEmbeddings(embeddings: ChunkEmbedding[]): void {
    localStorage.setItem(STORAGE_KEYS.EMBEDDINGS, JSON.stringify(embeddings));
  },

  // --- Current Product Change ---
  getCurrentChange(): string {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_CHANGE) || '';
  },

  setCurrentChange(change: string): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_CHANGE, change);
  },

  // --- Drift Proposals & Decisions ---
  getProposals(): StoredProposal[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PROPOSALS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  setProposals(proposals: StoredProposal[]): void {
    localStorage.setItem(STORAGE_KEYS.PROPOSALS, JSON.stringify(proposals));
  },

  updateProposalDecision(pageId: string, decision: 'approved' | 'rejected', customAfter?: string): void {
    const list = this.getProposals().map((p) => {
      if (p.page_id === pageId) {
        return {
          ...p,
          decision,
          customAfter: customAfter !== undefined ? customAfter : p.customAfter,
        };
      }
      return p;
    });
    this.setProposals(list);
  },

  updateProposalText(pageId: string, customAfter: string): void {
    const list = this.getProposals().map((p) => {
      if (p.page_id === pageId) {
        return { ...p, customAfter };
      }
      return p;
    });
    this.setProposals(list);
  },

  // --- Checkbox confirmation ---
  getCheckboxConfirmed(): boolean {
    return localStorage.getItem(STORAGE_KEYS.CHECKBOX_CONFIRMED) === 'true';
  },

  setCheckboxConfirmed(val: boolean): void {
    localStorage.setItem(STORAGE_KEYS.CHECKBOX_CONFIRMED, String(val));
  },

  // --- Stats ---
  getStats(): AppStats {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.STATS);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { hoursSaved: 16.5 }; // sensible default baseline
  },

  addMinutesSaved(minutes: number): void {
    const stats = this.getStats();
    stats.hoursSaved = parseFloat((stats.hoursSaved + minutes / 60).toFixed(1));
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  },

  // --- Audience Briefings ---
  getBriefings(): AudienceBriefings | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.BRIEFINGS);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setBriefings(briefings: AudienceBriefings): void {
    localStorage.setItem(STORAGE_KEYS.BRIEFINGS, JSON.stringify(briefings));
  },

  // --- Reset / Clear ---
  clearAll(): void {
    localStorage.removeItem(STORAGE_KEYS.PAGES);
    localStorage.removeItem(STORAGE_KEYS.EMBEDDINGS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_CHANGE);
    localStorage.removeItem(STORAGE_KEYS.PROPOSALS);
    localStorage.removeItem(STORAGE_KEYS.BRIEFINGS);
    localStorage.removeItem(STORAGE_KEYS.CHECKBOX_CONFIRMED);
  },
};

/**
 * Parses raw markdown file with YAML front matter into DocPage object.
 */
export function parseDocPage(filename: string, rawContent: string): DocPage {
  const { frontMatter } = extractFrontMatter(rawContent);
  const fallbackId = filename.replace(/\.md$/, '');

  return {
    id: frontMatter.id || fallbackId,
    filename,
    title: frontMatter.title || fallbackId,
    type: frontMatter.type || 'Concept',
    product_version: frontMatter.product_version || '',
    owner: frontMatter.owner || '',
    last_verified: frontMatter.last_verified || '',
    tags: Array.isArray(frontMatter.tags) ? frontMatter.tags : [],
    source_files: Array.isArray(frontMatter.source_files) ? frontMatter.source_files : [],
    content: rawContent,
  };
}

/**
 * Calculates page freshness:
 * - 'red': at risk from an active unapproved change, OR missing last_verified
 * - 'amber': last_verified is older than 90 days
 * - 'green': verified recently and not pending change
 */
export function getPageFreshness(
  page: DocPage,
  proposals: StoredProposal[],
  currentDate: Date = new Date()
): { status: 'green' | 'amber' | 'red'; label: string; tooltip: string } {
  // Check if at risk from active proposal
  const hasPendingProposal = proposals.some(
    (p) => p.page_id === page.id && p.decision !== 'rejected'
  );
  if (hasPendingProposal) {
    return {
      status: 'red',
      label: 'At Risk',
      tooltip: 'Product change touches this page. Review required.',
    };
  }

  if (!page.last_verified) {
    return {
      status: 'red',
      label: 'Unverified',
      tooltip: 'Document has never been verified.',
    };
  }

  const verifiedDate = new Date(page.last_verified);
  if (isNaN(verifiedDate.getTime())) {
    return {
      status: 'red',
      label: 'Invalid Date',
      tooltip: 'last_verified date format is invalid.',
    };
  }

  const diffDays = Math.floor(
    (currentDate.getTime() - verifiedDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays > 90) {
    return {
      status: 'amber',
      label: `Stale (${diffDays}d)`,
      tooltip: `Last verified ${diffDays} days ago (>90 days threshold).`,
    };
  }

  return {
    status: 'green',
    label: `Fresh (${diffDays}d)`,
    tooltip: `Verified ${diffDays} days ago.`,
  };
}
