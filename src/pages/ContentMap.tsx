import React, { useState, useEffect, useMemo } from 'react';
import { store, getPageFreshness, type DocPage } from '../lib/store.ts';
import { Pill } from '../components/Pill.tsx';
import { Drawer } from '../components/Drawer.tsx';

export interface ContentMapProps {
  onNavigate: (route: 'radar' | 'report' | 'review' | 'export' | 'guide') => void;
}

export const ContentMap: React.FC<ContentMapProps> = ({ onNavigate }) => {
  const [pages, setPages] = useState<DocPage[]>([]);
  const [proposals, setProposals] = useState(store.getProposals());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [filterHealth, setFilterHealth] = useState<'All' | 'Stale' | 'Issues'>('All');
  const [selectedPage, setSelectedPage] = useState<DocPage | null>(null);

  useEffect(() => {
    setPages(store.getPages());
    setProposals(store.getProposals());
  }, []);

  // Metadata problems scanner
  const metadataProblems = useMemo(() => {
    const issues: { page: DocPage; problems: string[] }[] = [];
    const now = Date.now();

    for (const page of pages) {
      const problems: string[] = [];
      if (!page.owner || !page.owner.trim()) {
        problems.push('Missing documentation owner');
      }
      if (!page.product_version || !page.product_version.trim()) {
        problems.push('Missing product version specification');
      }
      if (!page.last_verified) {
        problems.push('Missing last_verified timestamp');
      } else {
        const verifiedTime = new Date(page.last_verified).getTime();
        if (isNaN(verifiedTime)) {
          problems.push('Invalid last_verified date format');
        } else {
          const daysOld = Math.floor((now - verifiedTime) / (1000 * 60 * 60 * 24));
          if (daysOld > 90) {
            problems.push(`last_verified is ${daysOld} days old (>90 days threshold)`);
          }
        }
      }

      if (problems.length > 0) {
        issues.push({ page, problems });
      }
    }
    return issues;
  }, [pages]);

  // Filtered pages
  const filteredPages = useMemo(() => {
    return pages.filter((page) => {
      // Type filter
      if (selectedType !== 'All' && page.type !== selectedType) {
        return false;
      }

      // Health filter
      if (filterHealth === 'Issues') {
        const hasIssue = metadataProblems.some((m) => m.page.id === page.id);
        if (!hasIssue) return false;
      } else if (filterHealth === 'Stale') {
        const freshness = getPageFreshness(page, proposals);
        if (freshness.status === 'green') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = page.title.toLowerCase().includes(q);
        const matchesTags = page.tags.some((t) => t.toLowerCase().includes(q));
        const matchesOwner = page.owner.toLowerCase().includes(q);
        const matchesFilename = page.filename.toLowerCase().includes(q);
        const matchesContent = page.content.toLowerCase().includes(q);
        if (!matchesTitle && !matchesTags && !matchesOwner && !matchesFilename && !matchesContent) {
          return false;
        }
      }

      return true;
    });
  }, [pages, selectedType, filterHealth, searchQuery, metadataProblems, proposals]);

  return (
    <div>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
            Documentation Content Map
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginTop: '4px' }}>
            Searchable, filterable structural index of topics, front matter metadata, and ownership status.
          </p>
        </div>

        <div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => onNavigate('report')}
          >
            Report Change →
          </button>
        </div>
      </div>

      {/* Metadata Problems Alert Panel */}
      {metadataProblems.length > 0 && (
        <div
          className="alert-warning"
          style={{
            borderLeft: '4px solid var(--warning)',
            padding: '16px 20px',
            marginBottom: '24px',
          }}
        >
          <div className="alert-title" style={{ color: '#744210' }}>
            <span>⚠️ Metadata Audit: {metadataProblems.length} Page(s) Need Maintenance</span>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#975A16', marginBottom: '12px' }}>
            Documentation front matter is missing required fields or exceeds the 90-day verification threshold:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {metadataProblems.map(({ page, problems }) => (
              <div
                key={page.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--warning-border)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div>
                  <strong>{page.title}</strong> (<code>{page.filename}</code>):{' '}
                  <span style={{ color: 'var(--danger)' }}>{problems.join(' • ')}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-subtle btn-sm"
                  style={{ height: '26px', fontSize: '0.75rem' }}
                  onClick={() => setSelectedPage(page)}
                >
                  View Front Matter
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div
        className="surface-card"
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
          padding: '16px 20px',
        }}
      >
        <div style={{ flex: '1 1 240px' }}>
          <input
            type="search"
            className="form-input"
            placeholder="Search docs by title, tag, owner, content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search documentation"
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <select
            className="form-input"
            style={{ width: 'auto' }}
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            aria-label="Filter by documentation type"
          >
            <option value="All">All Types</option>
            <option value="Concept">Concept</option>
            <option value="Task">Task</option>
            <option value="Reference">Reference</option>
          </select>

          <select
            className="form-input"
            style={{ width: 'auto' }}
            value={filterHealth}
            onChange={(e) => setFilterHealth(e.target.value as any)}
            aria-label="Filter by metadata health"
          >
            <option value="All">All Statuses</option>
            <option value="Stale">Stale / At Risk</option>
            <option value="Issues">Metadata Problems</option>
          </select>
        </div>
      </div>

      {/* Grid of Doc Tiles */}
      {filteredPages.length === 0 ? (
        <div
          className="surface-card"
          style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}
        >
          No documentation pages match your search criteria.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px',
          }}
        >
          {filteredPages.map((page) => {
            const freshness = getPageFreshness(page, proposals);
            const hasIssue = metadataProblems.some((m) => m.page.id === page.id);

            return (
              <div
                key={page.id}
                className="surface-card"
                onClick={() => setSelectedPage(page)}
                style={{
                  cursor: 'pointer',
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'border-color 0.15s ease, transform 0.1s ease',
                  border: hasIssue ? '1px solid #FBD38D' : undefined,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = hasIssue
                    ? '#FBD38D'
                    : 'var(--border-color)';
                }}
                tabIndex={0}
                role="button"
                aria-label={`Open details for ${page.title}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedPage(page);
                  }
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    <span className="pill pill-neutral" style={{ fontSize: '0.75rem' }}>
                      {page.type}
                    </span>
                    <Pill
                      status={freshness.status}
                      label={freshness.label}
                      tooltip={freshness.tooltip}
                    />
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>
                    {page.title}
                  </h3>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    <code>{page.filename}</code>
                  </div>

                  {/* Metadata fields */}
                  <div style={{ fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Version: </span>
                      {page.product_version ? (
                        <code>v{page.product_version}</code>
                      ) : (
                        <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Missing</span>
                      )}
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Owner: </span>
                      {page.owner ? (
                        <span>{page.owner}</span>
                      ) : (
                        <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Unassigned</span>
                      )}
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Last Verified: </span>
                      <span>{page.last_verified || 'Never'}</span>
                    </div>
                  </div>
                </div>

                {/* Tags and footer */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '10px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {page.tags.slice(0, 4).map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        style={{
                          backgroundColor: '#F3F4F6',
                          color: 'var(--text-muted)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                    {page.tags.length > 4 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        +{page.tags.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drawer Component */}
      <Drawer
        page={selectedPage}
        isOpen={Boolean(selectedPage)}
        onClose={() => setSelectedPage(null)}
      />
    </div>
  );
};
