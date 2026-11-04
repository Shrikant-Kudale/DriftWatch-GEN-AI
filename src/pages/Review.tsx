import React, { useState, useEffect } from 'react';
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
  const isReadyToExport = allDecided && checkboxConfirmed && approvedCount > 0;

  const getPageTitle = (pageId: string) => {
    const found = pages.find((p) => p.id === pageId);
    return found ? found.title : pageId;
  };

  if (proposals.length === 0) {
    return (
      <div>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
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
            📋
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '8px' }}>
            No Active Proposals to Review
          </h2>
          <p
            style={{
              color: 'var(--text-muted)',
              maxWidth: '500px',
              margin: '0 auto 24px',
              fontSize: '0.9375rem',
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
              Go to Report Change
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
    <div style={{ paddingBottom: '80px' }}>
      {/* Page Title & Instructions */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
          Review Proposed Updates ({proposals.length} Pages Affected)
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginTop: '4px' }}>
          Inspect the semantic evidence and side-by-side diffs. AI proposes updates, but nothing is
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
          gap: '12px',
          padding: '14px 20px',
          backgroundColor: '#FFFFFF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Review Progress:</span>
          <span
            className={`pill ${allDecided ? 'pill-green' : 'pill-amber'}`}
            style={{ fontSize: '0.8125rem' }}
          >
            {totalDecided} of {totalCount} decided
          </span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            ({approvedCount} approved, {totalDecided - approvedCount} rejected)
          </span>
        </div>

        <div>
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
            Approve All
          </button>
        </div>
      </div>

      {/* Impact Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {proposals.map((proposal) => (
          <ImpactCard
            key={proposal.page_id}
            proposal={proposal}
            pageTitle={getPageTitle(proposal.page_id)}
            onApprove={handleApprove}
            onReject={handleReject}
            onSaveCustomEdit={handleSaveCustomEdit}
          />
        ))}
      </div>

      {/* Sticky Bottom Bar */}
      <div className="sticky-bar" role="region" aria-label="Review Actions Confirmation">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>
              {totalDecided} of {totalCount} decided
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              ({approvedCount} approved)
            </span>
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              color: 'var(--text-main)',
            }}
          >
            <input
              type="checkbox"
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
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
            disabled={!isReadyToExport}
            onClick={() => {
              showToast('success', 'All reviews confirmed! Ready to export git patch and briefings.');
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
            Proceed to Export ({approvedCount}) →
          </button>
        </div>
      </div>
    </div>
  );
};
