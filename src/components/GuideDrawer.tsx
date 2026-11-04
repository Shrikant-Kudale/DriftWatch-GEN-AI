import React, { useEffect } from 'react';

export interface GuideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFullGuide?: () => void;
}

export const GuideDrawer: React.FC<GuideDrawerProps> = ({
  isOpen,
  onClose,
  onOpenFullGuide,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="drawer-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-drawer-title"
    >
      <div
        className="drawer-panel"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        style={{ maxWidth: '720px' }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '16px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'var(--primary-subtle)',
                color: 'var(--primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                fontWeight: 700,
              }}
            >
              📖
            </span>
            <div>
              <h2 id="guide-drawer-title" style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                DriftWatch Guide & How-to
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Quick reference handbook for documentation drift detection and accuracy gates.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {onOpenFullGuide && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  onClose();
                  onOpenFullGuide();
                }}
              >
                Open Full Guide Page ↗
              </button>
            )}
            <button
              type="button"
              className="btn btn-subtle btn-sm"
              onClick={onClose}
              aria-label="Close guide drawer"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* 5-Step Workflow */}
        <div style={{ marginBottom: '24px' }}>
          <h3
            style={{
              fontSize: '0.875rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted)',
              marginBottom: '12px',
            }}
          >
            5-Step Synchronization Workflow
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}
            >
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  color: '#FFFFFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                1
              </span>
              <div>
                <strong style={{ color: 'var(--text-main)', fontSize: '0.9375rem' }}>
                  Load or Track Docs:
                </strong>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-body)', marginTop: '2px' }}>
                  On the <strong>Radar</strong> dashboard, click <em>"Load sample project"</em> to index
                  VaultLite documentation pages and precompute vector embeddings.
                </p>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}
            >
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  color: '#FFFFFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                2
              </span>
              <div>
                <strong style={{ color: 'var(--text-main)', fontSize: '0.9375rem' }}>
                  Report Change & Scan Secrets:
                </strong>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-body)', marginTop: '2px' }}>
                  Paste PR summary, commit message, or ticket into <strong>Report Change</strong>. The
                  confidential data scanner checks for passwords, API tokens, and credentials before transmission.
                </p>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}
            >
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  color: '#FFFFFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                3
              </span>
              <div>
                <strong style={{ color: 'var(--text-main)', fontSize: '0.9375rem' }}>
                  Review Diff via Human Gate:
                </strong>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-body)', marginTop: '2px' }}>
                  Inspect side-by-side diffs on <strong>Review</strong>. Verify citations, approve or
                  reject each proposed page, or edit Markdown inline. Tick the verification checkbox.
                </p>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}
            >
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  color: '#FFFFFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                4
              </span>
              <div>
                <strong style={{ color: 'var(--text-main)', fontSize: '0.9375rem' }}>
                  Export Patch & Release Briefings:
                </strong>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-body)', marginTop: '2px' }}>
                  In <strong>Export</strong>, download <code>.patch</code> (unified Git diff), PR text, or <code>.zip</code>.
                  Generate tailored briefings for Admins, Execs, and Support agents.
                </p>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}
            >
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  color: '#FFFFFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                5
              </span>
              <div>
                <strong style={{ color: 'var(--text-main)', fontSize: '0.9375rem' }}>
                  Commit & Log Time Saved:
                </strong>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-body)', marginTop: '2px' }}>
                  Run <code>git apply driftwatch.patch</code> in your repository. Enter manual minutes
                  saved to accumulate engineering efficiency on Radar.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Core Philosophy & Rules */}
        <div
          style={{
            backgroundColor: 'var(--primary-subtle)',
            border: '1px solid var(--primary-border)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
          }}
        >
          <h4 style={{ color: 'var(--primary)', fontWeight: 700, marginBottom: '6px' }}>
            ⚡ Core Principle: Human Accuracy Gate
          </h4>
          <p style={{ fontSize: '0.875rem', color: '#312E81', lineHeight: 1.5 }}>
            DriftWatch flips traditional documentation assistants. Instead of asking how to write docs,
            it detects what the code change broke. <strong>Nothing is exported or applied until a human verifies and approves it.</strong>
          </p>
        </div>

        {/* Git Pipeline CLI Command */}
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
            CI/CD Git Diff Command
          </h4>
          <pre
            style={{
              backgroundColor: '#0F172A',
              color: '#F8FAFC',
              padding: '12px 14px',
              borderRadius: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8125rem',
              overflowX: 'auto',
            }}
          >
            python3 scripts/drift_check.py --base origin/main
          </pre>
        </div>
      </div>
    </div>
  );
};
