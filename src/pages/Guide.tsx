import React from 'react';

export interface GuidePageProps {
  onNavigate: (route: 'radar' | 'report' | 'review' | 'map' | 'export') => void;
}

export const Guide: React.FC<GuidePageProps> = ({ onNavigate }) => {
  return (
    <div>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-main)' }}>
            DriftWatch Operating Guide & Handbook
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginTop: '4px' }}>
            Workflow handbook, retrieval architecture, glossary of key concepts, and accuracy limitations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onNavigate('radar')}
          >
            ← View Radar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onNavigate('report')}
          >
            Report Change →
          </button>
        </div>
      </div>

      {/* 5-Step How-To */}
      <div className="surface-card">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' }}>
          5-Step Documentation Sync Workflow
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-subtle)',
                color: 'var(--primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9375rem',
                flexShrink: 0,
              }}
            >
              1
            </span>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>
                Load or Track Documentation
              </h3>
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted)' }}>
                Start on the <strong>Radar</strong> dashboard. Click <em>"Load sample project"</em> to initialize
                VaultLite's documentation files and precompute semantic vector embeddings.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-subtle)',
                color: 'var(--primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9375rem',
                flexShrink: 0,
              }}
            >
              2
            </span>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>
                Report Product Change & Scan Secrets
              </h3>
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted)' }}>
                Navigate to <strong>Report Change</strong>. Paste your PR summary, git commit log, or issue ticket.
                The built-in client scanner verifies that API tokens, credentials, and emails are redacted before anything is sent to AI.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-subtle)',
                color: 'var(--primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9375rem',
                flexShrink: 0,
              }}
            >
              3
            </span>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>
                Review Semantic Diffs via Human Gate
              </h3>
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted)' }}>
                Open <strong>Review</strong>. Inspect affected pages, confidence ratings, and side-by-side diffs.
                Approve valid edits, reject false positives, or tweak text inline. Check the verification acknowledgment box once completed.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-subtle)',
                color: 'var(--primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9375rem',
                flexShrink: 0,
              }}
            >
              4
            </span>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>
                Export Artifacts & Generate Briefings
              </h3>
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted)' }}>
                In <strong>Export</strong>, download a unified <code>.patch</code> file or full Markdown <code>.zip</code>.
                Click <em>"Generate briefings"</em> to automatically produce tailored plain-language release communications for Admins, Executives, and Support.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-subtle)',
                color: 'var(--primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9375rem',
                flexShrink: 0,
              }}
            >
              5
            </span>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>
                Commit the Patch to Git
              </h3>
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Apply the exported patch in your local repository branch and commit alongside the code change:
              </p>
              <pre
                style={{
                  backgroundColor: '#F3F4F6',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8125rem',
                }}
              >
                git apply driftwatch-2026-11-03.patch{'\n'}git add docs/{'\n'}git commit -m "docs: align retention and CLI flags with PR #142"
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="surface-card">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px' }}>
          How DriftWatch Works: Retrieval & The Human Gate
        </h2>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-main)', marginBottom: '12px' }}>
          Traditional AI documentation assistants are query-centric: you ask questions, and the AI
          answers. <strong>DriftWatch flips this paradigm</strong>. It starts from a product change
          and proactively scans the entire documentation surface to locate what became stale.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
          <div style={{ backgroundColor: '#F9FAFB', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '8px' }}>
              Semantic Embedding & Retrieval
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Each documentation page is chunked by heading level (max 400 tokens with 40-token overlap).
              When a change description is entered, high-dimensional vector embeddings and cosine similarity
              identify the top candidate sections.
            </p>
          </div>

          <div style={{ backgroundColor: '#F9FAFB', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--success)', marginBottom: '8px' }}>
              The Human Accuracy Gate
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              AI models can hallucinate command arguments or introduce unintended edits.
              DriftWatch enforces a strict human-in-the-loop gate: no file is modified, no patch is exported,
              and no release briefing is published until an engineer verifies the diff.
            </p>
          </div>
        </div>
      </div>

      {/* Glossary */}
      <div className="surface-card">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' }}>
          Glossary
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9375rem' }}>
          <div>
            <strong>Embedding:</strong> A dense vector of numbers representing the semantic meaning of
            a chunk of text. Words with similar concepts reside close to one another in vector space.
          </div>
          <div>
            <strong>Retrieval:</strong> The mathematical search process (e.g. cosine distance) used to find
            the most relevant documentation excerpts given a code change description.
          </div>
          <div>
            <strong>Hallucination:</strong> An error mode where a language model generates convincing-looking
            commands, flags, or configuration options that do not actually exist in the product.
          </div>
          <div>
            <strong>Stale Context:</strong> Outdated documentation that describes legacy behaviors (e.g.,
            saying default retention is 30 days after code was changed to 14 days), leading to operator mistakes.
          </div>
          <div>
            <strong>Front Matter:</strong> Metadata placed at the top of a Markdown document between triple
            dashes (<code>---</code>) containing ownership, version targets, verification dates, and mapped code source files.
          </div>
        </div>
      </div>

      {/* Limits & Disclaimer */}
      <div className="alert-warning" style={{ margin: 0 }}>
        <div className="alert-title">
          <span>⚠️ Important System Limits & Safety Disclaimer</span>
        </div>
        <p style={{ fontSize: '0.875rem', color: '#975A16', lineHeight: 1.6 }}>
          AI suggestions are generative proposals, not source of truth. Always compare proposed diffs against
          unit test fixtures and actual product binary behavior. Low-confidence proposals should receive extra
          scrutiny or be rejected if the product change does not apply.
        </p>
      </div>
    </div>
  );
};
