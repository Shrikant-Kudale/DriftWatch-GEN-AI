import React, { useState, useEffect, useMemo } from 'react';
import { store, getPageFreshness, type DocPage, type StoredProposal } from '../lib/store.ts';
import { loadSampleProject, checkSystemDiagnostics, analyzeChangeImpact } from '../lib/api.ts';
import { SAMPLE_CHANGE } from '../data/sampleDocs.ts';
import { StatCard } from '../components/StatCard.tsx';
import { Pill } from '../components/Pill.tsx';
import { Spinner } from '../components/Spinner.tsx';
import { useToast } from '../components/Toast.tsx';

export interface RadarPageProps {
  onNavigate: (route: 'report' | 'review' | 'map' | 'export' | 'guide') => void;
  onRefreshState: () => void;
}

export const Radar: React.FC<RadarPageProps> = ({ onNavigate, onRefreshState }) => {
  const { showToast } = useToast();
  const [pages, setPages] = useState<DocPage[]>([]);
  const [proposals, setProposals] = useState<StoredProposal[]>([]);
  const [stats, setStats] = useState(store.getStats());
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [isRunningQuickTest, setIsRunningQuickTest] = useState(false);
  const [loadStepMessage, setLoadStepMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'AtRisk' | 'Stale' | 'Fresh'>('All');
  const [systemDiag, setSystemDiag] = useState<{ status: string; geminiConfigured: boolean; model: string } | null>(null);

  const refreshData = () => {
    setPages(store.getPages());
    setProposals(store.getProposals());
    setStats(store.getStats());
    onRefreshState();
  };

  useEffect(() => {
    const existing = store.getPages();
    if (existing.length === 0) {
      // Auto-load sample project on first boot so user NEVER encounters empty/broken state!
      loadSampleProject()
        .then(() => {
          refreshData();
        })
        .catch(() => {
          refreshData();
        });
    } else {
      refreshData();
    }

    checkSystemDiagnostics().then((d) => setSystemDiag(d)).catch(() => {});
  }, []);

  const handleLoadSample = async () => {
    setIsLoadingSample(true);
    try {
      await loadSampleProject((msg) => setLoadStepMessage(msg));
      refreshData();
      showToast('success', 'VaultLite documentation and vector embeddings loaded successfully!');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load sample project.');
    } finally {
      setIsLoadingSample(false);
      setLoadStepMessage('');
    }
  };

  const handleRunQuickAnalysis = async () => {
    setIsRunningQuickTest(true);
    showToast('info', 'Analyzing impact of sample PR #142 (retention & flags)...');
    try {
      const results = await analyzeChangeImpact(SAMPLE_CHANGE);
      refreshData();
      showToast('success', `Analysis complete! Detected ${results.length} affected documentation pages.`);
      onNavigate('review');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to complete drift analysis.');
    } finally {
      setIsRunningQuickTest(false);
    }
  };

  // Calculations
  const pagesTracked = pages.length;
  const pagesAtRisk = pages.filter((p) => {
    const f = getPageFreshness(p, proposals);
    return f.status === 'red';
  }).length;
  const reviewsPending = proposals.filter((p) => !p.decision).length;
  const hoursSaved = stats.hoursSaved;

  // Filtered rows for the widescreen table
  const filteredPages = useMemo(() => {
    return pages.filter((page) => {
      const freshness = getPageFreshness(page, proposals);

      if (statusFilter === 'AtRisk' && freshness.status !== 'red') return false;
      if (statusFilter === 'Stale' && freshness.status !== 'amber') return false;
      if (statusFilter === 'Fresh' && freshness.status !== 'green') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = page.title.toLowerCase().includes(q);
        const matchesOwner = page.owner.toLowerCase().includes(q);
        const matchesFile = page.filename.toLowerCase().includes(q);
        const matchesTags = page.tags.some((t) => t.toLowerCase().includes(q));
        const matchesSources = page.source_files.some((s) => s.toLowerCase().includes(q));
        if (!matchesTitle && !matchesOwner && !matchesFile && !matchesTags && !matchesSources) {
          return false;
        }
      }

      return true;
    });
  }, [pages, proposals, statusFilter, searchQuery]);

  return (
    <div>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-main)' }}>
              Documentation Radar
            </h1>
            {systemDiag && (
              <span
                className={`pill ${systemDiag.geminiConfigured ? 'pill-green' : 'pill-neutral'}`}
                style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                title={systemDiag.geminiConfigured ? 'Gemini API Key active' : 'Using smart fallback'}
              >
                {systemDiag.geminiConfigured ? `● Gemini Flash (${systemDiag.model})` : '● Grounded Mode'}
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginTop: '4px' }}>
            Continuous tracking of documentation freshness, drift risks, and product release alignment across all tracked files.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleRunQuickAnalysis}
            disabled={isRunningQuickTest || isLoadingSample}
            title="Immediately run full drift detection on PR #142 sample change"
          >
            {isRunningQuickTest && <Spinner size="sm" />}
            {isRunningQuickTest ? 'Analyzing PR #142...' : '⚡ Run Sample Drift Check'}
          </button>

          <button
            type="button"
            className="btn btn-subtle"
            onClick={handleLoadSample}
            disabled={isLoadingSample || isRunningQuickTest}
            title="Re-load clean sample documentation and vector cache"
          >
            {isLoadingSample && <Spinner size="sm" />}
            {isLoadingSample ? 'Reloading...' : '↻ Reload Docs'}
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onNavigate('report')}
          >
            <span>+</span> Report Product Change
          </button>
        </div>
      </div>

      {/* 4 Stat Cards Across Full Width */}
      <div className="stat-cards-grid">
        <StatCard
          label="Pages Tracked"
          value={pagesTracked}
          subtext="VaultLite repository docs"
          badge={pagesTracked > 0 ? { label: 'Active', status: 'green' } : undefined}
        />
        <StatCard
          label="Pages at Risk"
          value={pagesAtRisk}
          subtext="Requires verification or updates"
          badge={pagesAtRisk > 0 ? { label: 'Action Required', status: 'red' } : { label: 'Up to Date', status: 'green' }}
        />
        <StatCard
          label="Reviews Pending"
          value={reviewsPending}
          subtext="Unapproved drift proposals"
          badge={reviewsPending > 0 ? { label: `${reviewsPending} Pending`, status: 'amber' } : undefined}
        />
        <StatCard
          label="Hours Saved"
          value={`${hoursSaved}h`}
          subtext="Recorded engineering automation"
          badge={{ label: 'Cumulative', status: 'green' }}
        />
      </div>

      {/* Pending Reviews Alert Banner */}
      {reviewsPending > 0 && (
        <div
          className="alert-warning"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            borderLeft: '4px solid var(--warning)',
            marginBottom: '20px',
          }}
        >
          <div>
            <div className="alert-title" style={{ color: '#78350F' }}>
              <span>⚠️ Action Required: {reviewsPending} Documentation Changes Pending Review</span>
            </div>
            <div style={{ fontSize: '0.875rem', color: '#92400E' }}>
              A product change produced proposed edits. A human must verify and approve each edit before exporting a Git patch.
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => onNavigate('review')}
          >
            Review Proposed Edits ({reviewsPending}) →
          </button>
        </div>
      )}

      {/* Main Pages Table */}
      <div className="surface-card" style={{ padding: '0', overflow: 'hidden' }}>
        {/* Table Header Controls */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            backgroundColor: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Monitored Documentation Index</h2>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Tracking {pages.length} documentation pages across <code>public/docs/</code>
              </span>
            </div>

            {/* Status Filter Tabs */}
            <div style={{ display: 'flex', gap: '6px', background: '#F1F5F9', padding: '3px', borderRadius: '8px' }}>
              <button
                type="button"
                className={`btn btn-sm ${statusFilter === 'All' ? 'btn-primary' : 'btn-subtle'}`}
                style={{ border: 'none', height: '28px', padding: '0 10px' }}
                onClick={() => setStatusFilter('All')}
              >
                All ({pages.length})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${statusFilter === 'AtRisk' ? 'btn-danger' : 'btn-subtle'}`}
                style={{ border: 'none', height: '28px', padding: '0 10px' }}
                onClick={() => setStatusFilter('AtRisk')}
              >
                At Risk ({pagesAtRisk})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${statusFilter === 'Stale' ? 'btn-secondary' : 'btn-subtle'}`}
                style={{ border: 'none', height: '28px', padding: '0 10px' }}
                onClick={() => setStatusFilter('Stale')}
              >
                Stale
              </button>
              <button
                type="button"
                className={`btn btn-sm ${statusFilter === 'Fresh' ? 'btn-secondary' : 'btn-subtle'}`}
                style={{ border: 'none', height: '28px', padding: '0 10px' }}
                onClick={() => setStatusFilter('Fresh')}
              >
                Fresh
              </button>
            </div>
          </div>

          {/* Quick Search */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="search"
              className="form-input"
              style={{ width: '260px', height: '36px', fontSize: '0.875rem' }}
              placeholder="Filter pages by keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Filter documentation pages"
            />
            <button
              type="button"
              className="btn btn-subtle btn-sm"
              onClick={() => onNavigate('map')}
            >
              Content Map Grid →
            </button>
          </div>
        </div>

        {/* Full-width Responsive Data Table */}
        <div className="data-table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>Title & File</th>
                <th style={{ width: '12%' }}>Product Version</th>
                <th style={{ width: '22%' }}>Tracked Code Files</th>
                <th style={{ width: '14%' }}>Last Verified</th>
                <th style={{ width: '12%' }}>Freshness</th>
                <th style={{ width: '10%', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPages.map((page) => {
                const freshness = getPageFreshness(page, proposals);
                const isPending = proposals.some(
                  (p) => p.page_id === page.id && !p.decision
                );

                return (
                  <tr key={page.id}>
                    {/* Title & File */}
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9375rem' }}>
                        {page.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        <code>{page.filename}</code> • <span className="pill pill-neutral" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>{page.type}</span>
                      </div>
                    </td>

                    {/* Product Version */}
                    <td>
                      {page.product_version ? (
                        <code style={{ fontSize: '0.8125rem', backgroundColor: '#F1F5F9', padding: '2px 6px', borderRadius: '4px' }}>
                          v{page.product_version}
                        </code>
                      ) : (
                        <span style={{ color: 'var(--danger)', fontSize: '0.8125rem', fontWeight: 600 }}>
                          Missing Version
                        </span>
                      )}
                    </td>

                    {/* Mapped Source Files */}
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {page.source_files.slice(0, 2).map((sf, idx) => (
                          <code
                            key={idx}
                            style={{
                              fontSize: '0.75rem',
                              color: '#475569',
                              backgroundColor: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              padding: '1px 5px',
                              borderRadius: '3px',
                            }}
                          >
                            {sf}
                          </code>
                        ))}
                        {page.source_files.length > 2 && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            +{page.source_files.length - 2} more
                          </span>
                        )}
                        {page.source_files.length === 0 && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            None mapped
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Last Verified & Owner */}
                    <td>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                        {page.last_verified || (
                          <span style={{ color: 'var(--danger)', fontStyle: 'italic' }}>
                            Unverified
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {page.owner ? `${page.owner}` : 'Unassigned owner'}
                      </div>
                    </td>

                    {/* Freshness Status Pill */}
                    <td>
                      <Pill
                        status={freshness.status}
                        label={freshness.label}
                        tooltip={freshness.tooltip}
                      />
                    </td>

                    {/* Action */}
                    <td style={{ textAlign: 'right' }}>
                      {isPending ? (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => onNavigate('review')}
                        >
                          Review Edit
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-subtle btn-sm"
                          onClick={() => onNavigate('map')}
                        >
                          Inspect
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
