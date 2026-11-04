import React, { useEffect } from 'react';
import type { DocPage } from '../lib/store.ts';
import { Pill } from './Pill.tsx';

export interface DrawerProps {
  page: DocPage | null;
  isOpen: boolean;
  onClose: () => void;
}

export const Drawer: React.FC<DrawerProps> = ({ page, isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !page) return null;

  const isStale = () => {
    if (!page.last_verified) return true;
    const diff = Date.now() - new Date(page.last_verified).getTime();
    return diff > 90 * 24 * 60 * 60 * 1000;
  };

  return (
    <div
      className="drawer-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      <div
        className="drawer-panel"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Drawer Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '16px',
            marginBottom: '16px',
          }}
        >
          <div>
            <span
              className="pill pill-neutral"
              style={{ fontSize: '0.75rem', marginBottom: '8px' }}
            >
              {page.type}
            </span>
            <h2 id="drawer-title" style={{ fontSize: '1.4rem', fontWeight: 700 }}>
              {page.title}
            </h2>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              File: <code>public/docs/{page.filename}</code>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-subtle btn-sm"
            onClick={onClose}
            aria-label="Close document drawer"
          >
            ✕ Close
          </button>
        </div>

        {/* Front Matter Metadata Inspector */}
        <div
          style={{
            backgroundColor: '#F9FAFB',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
            fontSize: '0.875rem',
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: '0.8125rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '10px',
            }}
          >
            YAML Front Matter
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 12px' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>ID:</span>
            <span><code>{page.id}</code></span>

            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Product Ver:</span>
            <span>
              {page.product_version ? (
                <code>v{page.product_version}</code>
              ) : (
                <span className="pill pill-red" style={{ fontSize: '0.7rem' }}>
                  Missing Version
                </span>
              )}
            </span>

            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Owner:</span>
            <span>
              {page.owner ? (
                <span>{page.owner}</span>
              ) : (
                <span className="pill pill-red" style={{ fontSize: '0.7rem' }}>
                  Unassigned Owner
                </span>
              )}
            </span>

            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Last Verified:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{page.last_verified || 'Never'}</span>
              {isStale() && (
                <Pill status="amber" label="Stale (>90d)" tooltip="Older than 90 days threshold" />
              )}
            </div>

            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Tags:</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {page.tags.map((t, i) => (
                <span
                  key={i}
                  style={{
                    backgroundColor: '#EEF2FF',
                    color: 'var(--primary)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                  }}
                >
                  #{t}
                </span>
              ))}
            </div>

            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Source Files:</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {page.source_files.length > 0 ? (
                page.source_files.map((sf, i) => (
                  <code key={i} style={{ fontSize: '0.8rem', color: '#1E293B' }}>
                    {sf}
                  </code>
                ))
              ) : (
                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>None specified</span>
              )}
            </div>
          </div>
        </div>

        {/* Rendered Document Body */}
        <div>
          <div
            style={{
              fontWeight: 700,
              fontSize: '0.875rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '10px',
            }}
          >
            Markdown Source Content
          </div>
          <pre
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '16px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8125rem',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              overflowY: 'auto',
            }}
          >
            {page.content}
          </pre>
        </div>
      </div>
    </div>
  );
};
