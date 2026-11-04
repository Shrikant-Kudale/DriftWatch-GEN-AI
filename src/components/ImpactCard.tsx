import React, { useState } from 'react';
import type { StoredProposal } from '../lib/store.ts';
import { DiffView } from './DiffView.tsx';

export interface ImpactCardProps {
  proposal: StoredProposal;
  pageTitle: string;
  onApprove: (pageId: string) => void;
  onReject: (pageId: string) => void;
  onSaveCustomEdit: (pageId: string, newAfter: string) => void;
}

export const ImpactCard: React.FC<ImpactCardProps> = ({
  proposal,
  pageTitle,
  onApprove,
  onReject,
  onSaveCustomEdit,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(proposal.customAfter ?? proposal.after);

  const activeAfter = proposal.customAfter ?? proposal.after;

  const handleSaveEdit = () => {
    onSaveCustomEdit(proposal.page_id, editText);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditText(activeAfter);
    setIsEditing(false);
  };

  const confidenceClass =
    proposal.confidence === 'High'
      ? 'chip-high'
      : proposal.confidence === 'Low'
      ? 'chip-low'
      : 'chip-medium';

  return (
    <article className="surface-card" style={{ marginBottom: '24px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{pageTitle}</h3>
            <span
              className={`pill ${confidenceClass}`}
              style={{ fontSize: '0.75rem', fontWeight: 600 }}
              title={`AI Confidence: ${proposal.confidence}`}
            >
              {proposal.confidence} Confidence
            </span>
          </div>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Page ID: <code>{proposal.page_id}</code>
          </span>
        </div>

        {/* Current status tag */}
        <div>
          {proposal.decision === 'approved' && (
            <span className="pill pill-green">
              <span className="pill-dot" /> Approved
            </span>
          )}
          {proposal.decision === 'rejected' && (
            <span className="pill pill-red">
              <span className="pill-dot" /> Rejected
            </span>
          )}
          {!proposal.decision && (
            <span className="pill pill-amber">
              <span className="pill-dot" /> Decision Pending
            </span>
          )}
        </div>
      </div>

      {/* Why this page (retrieved evidence and reasoning) */}
      <div style={{ margin: '16px 0' }}>
        <h4 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em', marginBottom: '6px' }}>
          Why this page
        </h4>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-main)', marginBottom: '12px' }}>
          {proposal.reason}
        </p>

        {/* Retrieved Snippets */}
        {proposal.retrievedSnippets && proposal.retrievedSnippets.length > 0 && (
          <div
            style={{
              backgroundColor: '#F9FAFB',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '0.8125rem',
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
              Retrieved Semantic Evidence ({proposal.retrievedSnippets.length}):
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {proposal.retrievedSnippets.map((s, sIdx) => (
                <div
                  key={sIdx}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    padding: '8px 10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>§ {s.heading}</span>
                    <span
                      style={{
                        color: 'var(--primary)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      Cosine: {(s.score * 100).toFixed(1)}% ({s.score})
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                    "{s.text}"
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Diff or Inline Editor */}
      {!isEditing ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Proposed Document Diff
            </span>
            {proposal.customAfter && (
              <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                • Custom edits applied
              </span>
            )}
          </div>
          <DiffView beforeText={proposal.before} afterText={activeAfter} />
        </div>
      ) : (
        <div style={{ margin: '16px 0' }}>
          <label className="form-label" htmlFor={`editor-${proposal.page_id}`}>
            Edit Proposed Markdown Content
          </label>
          <textarea
            id={`editor-${proposal.page_id}`}
            className="form-textarea"
            style={{ minHeight: '260px', fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleSaveEdit}>
              Save Edits
            </button>
            <button type="button" className="btn btn-subtle btn-sm" onClick={handleCancelEdit}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '12px',
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-color)',
        }}
      >
        <button
          type="button"
          className="btn btn-subtle btn-sm"
          onClick={() => {
            if (!isEditing) {
              setEditText(activeAfter);
            }
            setIsEditing(!isEditing);
          }}
          aria-label={isEditing ? 'Close editor' : 'Edit proposed text'}
        >
          {isEditing ? 'Close Editor' : 'Edit Propose'}
        </button>

        <button
          type="button"
          className={`btn btn-danger btn-sm ${proposal.decision === 'rejected' ? 'active' : ''}`}
          style={{
            backgroundColor: proposal.decision === 'rejected' ? 'var(--danger)' : '#FFFFFF',
            color: proposal.decision === 'rejected' ? '#FFFFFF' : 'var(--danger)',
          }}
          onClick={() => onReject(proposal.page_id)}
          aria-label={`Reject proposed changes for ${pageTitle}`}
        >
          {proposal.decision === 'rejected' ? '✓ Rejected' : 'Reject'}
        </button>

        <button
          type="button"
          className={`btn btn-primary btn-sm ${proposal.decision === 'approved' ? 'active' : ''}`}
          style={{
            backgroundColor: proposal.decision === 'approved' ? 'var(--success)' : 'var(--primary)',
            borderColor: proposal.decision === 'approved' ? 'var(--success)' : 'var(--primary)',
          }}
          onClick={() => onApprove(proposal.page_id)}
          aria-label={`Approve proposed changes for ${pageTitle}`}
        >
          {proposal.decision === 'approved' ? '✓ Approved' : 'Approve'}
        </button>
      </div>
    </article>
  );
};
