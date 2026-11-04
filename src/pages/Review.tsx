import React, { useState, useEffect, useMemo } from 'react';
import { store, type StoredProposal, type DocPage } from '../lib/store.ts';
import { ImpactCard } from '../components/ImpactCard.tsx';
import { useToast } from '../components/Toast.tsx';

export interface ReviewPageProps {
  onNavigate: (route: 'radar' | 'report' | 'map' | 'export' | 'guide') => void;
  onRefreshState: () => void;
}

export const Review: React.FC<ReviewPageProps> = ({ onNavigate, onRefreshState }) => {
  const { showToast } = useToast();
  const [proposals, setProposals] = useState<StoredProposal[]>([]);
  const [pages, setPages] = useState<DocPage[]>([]);
  const [checkboxConfirmed, setCheckboxConfirmed] = useState<boolean>(false);
  const [filterDecision, setFilterDecision] = useState<'All' | 'pending' | 'approved' | 'rejected'>('All');

  useEffect(() => {
    setProposals(store.getProposals());
    setPages(store.getPages());
    setCheckboxConfirmed(store.getCheckboxConfirmed());
  }, []);

  const handleApprove = (pageId: string) => {
    store.updateProposalDecision(pageId, 'approved');
    const updated = store.getProposals();
    setProposals(updated);
    onRefreshState();
    showToast('success', `Approved edit for page "${pageId}".`);
  };

  const handleReject = (pageId: string) => {
    store.updateProposalDecision(pageId, 'rejected');
    const updated = store.getProposals();
    setProposals(updated);
    onRefreshState();
    showToast('info', `Rejected edit for page "${pageId}".`);
  };

  const handleSaveCustomEdit = (pageId: string, newAfter: string) => {
    store.updateProposalText(pageId, newAfter);
    const updated = store.getProposals();
    setProposals(updated);
    onRefreshState();
    showToast('success', `Saved customized proposal text for "${pageId}".`);
  };

  const handleCheckboxChange = (checked: boolean) => {
    setCheckboxConfirmed(checked);
    store.setCheckboxConfirmed(checked);
  };

  const totalDecided = proposals.filter((p) => Boolean(p.decision)).length;
  const totalCount = proposals.length;
  const allDecided = totalCount > 0 && totalDecided === totalCount;
  const approvedCount = proposals.filter((p) => p.decision === 'approved').length;
  const rejectedCount = proposals.filter((p) => p.decision === 'rejected').length;
  const pendingCount = totalCount - totalDecided;
  const isReadyToExport = allDecided && checkboxConfirmed && approvedCount > 0;
  const progressPercent = totalCount > 0 ? Math.round((totalDecided / totalCount) * 100) : 0;

  const getPageTitle = (pageId: string) => {
    const found = pages.find((p) => p.id === pageId);
    return found ? found.title : pageId;
  };

  const filteredProposals = useMemo(() => {
    if (filterDecision === 'All') return proposals;
    if (filterDecision === 'pending') return proposals.filter((p) => !p.decision);
    return proposals.filter((p) => p.decision === filterDecision);
  }, [proposals, filterDecision]);

  if (proposals.length === 0) {
    return (
      <div>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-main)' }}>
            Review Documentation Drift
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginTop: '4px' }}>
            Human accuracy gate: verify and approve or reject proposed updates before Git patches can be exported.
          </p>
        </div>

        <div
          className="surface-card"
          style={{
            textAlign: 'center',
            padding: '64px 32px',
            backgroundColor: '#FFFFFF',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-subtle)',
              color: 'var(--primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              marginBottom: '16px',
              boxShadow: '0 0 0 8px #EEF2FF',
            }}
          >
            📋
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>
            No Active Proposals to Review
          </h2>
          <p
            style={{
              color: 'var(--text-muted)',
              maxWidth: '520px',
              margin: '0 auto 24px',
              fontSize: '0.9375rem',
              lineHeight: 1.6,
            }}
          >
            No product change has been analyzed yet. Submit a PR or ticket description in
            <strong> Report Change</strong> to generate proposed edits.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onNavigate('report')}
            >
              Go to Report Change →
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onNavigate('radar')}
            >
              View Documentation Radar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '90px' }}>
      {/* Page Title & Instructions */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-main)' }}>
          Review Proposed Updates ({proposals.length} Pages Affected)
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginTop: '4px' }}>
          Inspect the semantic citations and side-by-side diffs. AI proposes updates, but nothing is
          exported until human verification is complete.
        </p>
      </div>

      {/* Decision Summary Tracker Banner */}
      <div
        className="surface-card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '16px 24px',
          backgroundColor: '#FFFFFF',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Progress Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
              Accuracy Gate Progress:
            </span>
            <span
              className={`pill ${allDecided ? 'pill-green' : 'pill-amber'}`}
              style={{ fontSize: '0.875rem', padding: '4px 12px' }}
            >
              {totalDecided} of {totalCount} decided ({progressPercent}%)
            </span>
          </div>

          {/* Quick Filter Buttons */}
          <div style={{ display: 'flex', gap: '6px', background: '#F1F5F9', padding: '3px', borderRadius: '8px' }}>
            <button
              type="button"
              className={`btn btn-sm ${filterDecision === 'All' ? 'btn-primary' : 'btn-subtle'}`}
              style={{ border: 'none', height: '28px', padding: '0 10px' }}
              onClick={() => setFilterDecision('All')}
            >
              All ({totalCount})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${filterDecision === 'pending' ? 'btn-primary' : 'btn-subtle'}`}
              style={{ border: 'none', height: '28px', padding: '0 10px' }}
              onClick={() => setFilterDecision('pending')}
            >
              Pending ({pendingCount})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${filterDecision === 'approved' ? 'btn-primary' : 'btn-subtle'}`}
              style={{ border: 'none', height: '28px', padding: '0 10px' }}
              onClick={() => setFilterDecision('approved')}
            >
              Approved ({approvedCount})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${filterDecision === 'rejected' ? 'btn-primary' : 'btn-subtle'}`}
              style={{ border: 'none', height: '28px', padding: '0 10px' }}
              onClick={() => setFilterDecision('rejected')}
            >
              Rejected ({rejectedCount})
            </button>
          </div>
        </div>

        {/* Batch Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-subtle btn-sm"
            onClick={() => {
              proposals.forEach((p) => store.updateProposalDecision(p.page_id, 'approved'));
              setProposals(store.getProposals());
              onRefreshState();
              showToast('success', 'Marked all proposals as approved.');
            }}
          >
            ✓ Approve All
          </button>
          <button
            type="button"
            className="btn btn-subtle btn-sm"
            onClick={() => {
              proposals.forEach((p) => {
                const list = store.getProposals().map((item) => ({ ...item, decision: undefined }));
                store.setProposals(list);
              });
              setProposals(store.getProposals());
              onRefreshState();
              showToast('info', 'Reset all decisions to pending.');
            }}
          >
            Reset Decisions
          </button>
        </div>
      </div>

      {/* Impact Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredProposals.map((proposal) => (
          <ImpactCard
            key={proposal.page_id}
            proposal={proposal}
            pageTitle={getPageTitle(proposal.page_id)}
            onApprove={handleApprove}
            onReject={handleReject}
            onSaveCustomEdit={handleSaveCustomEdit}
          />
        ))}

        {filteredProposals.length === 0 && (
          <div className="surface-card" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
            No proposals match the selected filter ({filterDecision}).
          </div>
        )}
      </div>

      {/* Sticky Bottom Bar */}
      <div className="sticky-bar" role="region" aria-label="Review Actions Confirmation">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>
              {totalDecided} of {totalCount} decided
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              ({approvedCount} approved, {rejectedCount} rejected)
            </span>
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.9375rem',
              fontWeight: 600,
              cursor: 'pointer',
              color: 'var(--text-main)',
              backgroundColor: '#F8FAFC',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
            }}
          >
            <input
              type="checkbox"
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
              checked={checkboxConfirmed}
              onChange={(e) => handleCheckboxChange(e.target.checked)}
            />
            <span>I verified these edits against the product</span>
          </label>
        </div>

        <div>
          <button
            type="button"
            className="btn btn-primary"
            style={{ height: '42px', padding: '0 20px', fontSize: '0.9375rem' }}
            disabled={!isReadyToExport}
            onClick={() => {
              showToast('success', 'All reviews confirmed! Ready to export git patch and release briefings.');
              onNavigate('export');
            }}
            title={
              !allDecided
                ? 'Decide all proposals before proceeding'
                : !checkboxConfirmed
                ? 'Tick the verification checkbox to proceed'
                : 'Proceed to Export'
            }
          >
            Proceed to Export ({approvedCount} Approved) →
          </button>
        </div>
      </div>
    </div>
  );
};
