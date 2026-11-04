import React, { useState, useEffect } from 'react';
import { store, getPageFreshness, type DocPage, type StoredProposal } from '../lib/store.ts';
import { loadSampleProject } from '../lib/api.ts';
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
  const [loadStepMessage, setLoadStepMessage] = useState('');

  const refreshData = () => {
    setPages(store.getPages());
    setProposals(store.getProposals());
    setStats(store.getStats());
    onRefreshState();
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleLoadSample = async () => {
    setIsLoadingSample(true);
    try {
      await loadSampleProject((msg) => setLoadStepMessage(msg));
      refreshData();
      showToast('success', 'VaultLite documentation and embeddings loaded successfully!');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load sample project.');
    } finally {
      setIsLoadingSample(false);
      setLoadStepMessage('');
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
            Documentation Radar
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginTop: '4px' }}>
            Continuous tracking of documentation freshness, drift risks, and product release alignment.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {pagesTracked > 0 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleLoadSample}
              disabled={isLoadingSample}
            >
              {isLoadingSample && <Spinner size="sm" />}
              {isLoadingSample ? 'Reloading...' : 'Reload Sample Docs'}
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onNavigate('report')}
          >
            + Report Product Change
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="stat-cards-grid">
        <StatCard
          label="Pages Tracked"
          value={pagesTracked}
          subtext="VaultLite technical docs"
          badge={pagesTracked > 0 ? { label: 'Active', status: 'green' } : undefined}
        />
        <StatCard
          label="Pages at Risk"
          value={pagesAtRisk}
          subtext="Requires verification or updates"
          badge={pagesAtRisk > 0 ? { label: 'Attention', status: 'red' } : { label: 'Clean', status: 'green' }}
        />
        <StatCard
          label="Reviews Pending"
          value={reviewsPending}
          subtext="Unapproved drift proposals"
          badge={reviewsPending > 0 ? { label: `${reviewsPending} Actionable`, status: 'amber' } : undefined}
        />
        <StatCard
          label="Hours Saved"
          value={`${hoursSaved}h`}
          subtext="Logged automation efficiency"
          badge={{ label: 'Cumulative', status: 'green' }}
        />
      </div>

      {/* Pending Reviews Alert Banner */}
      {reviewsPending > 0 && (
        <div className="alert-warning" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div className="alert-title">
              <span>⚠️ Action Required: {reviewsPending} Documentation Changes Pending Review</span>
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>
              A recent product change produced proposed edits. A human must verify and approve each edit before exporting.
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => onNavigate('review')}
          >
            Review Proposed Edits →
          </button>
        </div>
      )}

      {/* Main Pages Table or Empty State */}
      {pagesTracked === 0 ? (
        <div
          className="surface-card"
          style={{
            textAlign: 'center',
            padding: '48px 24px',
            backgroundColor: '#FFFFFF',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-subtle)',
              color: 'var(--primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              marginBottom: '16px',
            }}
          >
            📡
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '8px' }}>
            No Documentation Pages Tracked Yet
          </h2>
          <p
            style={{
              color: 'var(--text-muted)',
              maxWidth: '520px',
              margin: '0 auto 24px',
              fontSize: '0.9375rem',
            }}
          >
            DriftWatch needs documentation files to monitor for product drift. Click below to load
            the sample project <strong>VaultLite</strong> (a snapshot backup tool with 8 pages and precomputed embeddings).
          </p>

          <button
            type="button"
            className="btn btn-primary"
            style={{ minWidth: '180px' }}
            onClick={handleLoadSample}
            disabled={isLoadingSample}
          >
            {isLoadingSample && <Spinner size="sm" />}
            {isLoadingSample ? (loadStepMessage || 'Loading...') : 'Load sample project'}
          </button>

          {loadStepMessage && (
            <p style={{ marginTop: '12px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              {loadStepMessage}
            </p>
          )}
        </div>
      ) : (
        <div className="surface-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Monitored Documentation Index</h2>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Showing all {pages.length} pages in <code>public/docs/</code>
              </span>
            </div>
            <button
              type="button"
              className="btn btn-subtle btn-sm"
              onClick={() => onNavigate('map')}
            >
              Open Content Map →
            </button>
          </div>

          <div className="data-table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Product Version</th>
                  <th>Last Verified</th>
                  <th>Freshness</th>
                  <th>Owner</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page) => {
                  const freshness = getPageFreshness(page, proposals);
                  const isPending = proposals.some(
                    (p) => p.page_id === page.id && !p.decision
                  );

                  return (
                    <tr key={page.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          {page.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {page.filename} • {page.type}
                        </div>
                      </td>
                      <td>
                        {page.product_version ? (
                          <code>v{page.product_version}</code>
                        ) : (
                          <span style={{ color: 'var(--danger)', fontSize: '0.8125rem', fontWeight: 500 }}>
                            Missing
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.875rem' }}>
                        {page.last_verified || (
                          <span style={{ color: 'var(--danger)', fontStyle: 'italic' }}>
                            Unverified
                          </span>
                        )}
                      </td>
                      <td>
                        <Pill
                          status={freshness.status}
                          label={freshness.label}
                          tooltip={freshness.tooltip}
                        />
                      </td>
                      <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        {page.owner || (
                          <span style={{ color: 'var(--danger)', fontStyle: 'italic' }}>
                            Unassigned
                          </span>
                        )}
                      </td>
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
      )}
    </div>
  );
};
