import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { store, type StoredProposal, type DocPage, type AudienceBriefings } from '../lib/store.ts';
import { generateMultiFilePatch } from '../lib/diff.ts';
import { generateAudienceBriefings } from '../lib/api.ts';
import { Spinner } from '../components/Spinner.tsx';
import { useToast } from '../components/Toast.tsx';

export interface ExportPageProps {
  onNavigate: (route: 'radar' | 'report' | 'review' | 'map' | 'guide') => void;
  onRefreshState: () => void;
}

export const Export: React.FC<ExportPageProps> = ({ onNavigate, onRefreshState }) => {
  const { showToast } = useToast();
  const [proposals, setProposals] = useState<StoredProposal[]>([]);
  const [pages, setPages] = useState<DocPage[]>([]);
  const [briefings, setBriefings] = useState<AudienceBriefings | null>(null);
  const [isGeneratingBriefings, setIsGeneratingBriefings] = useState(false);
  const [minutesInput, setMinutesInput] = useState<number>(45);
  const [hasLoggedTime, setHasLoggedTime] = useState<boolean>(false);
  const [showPatchPreview, setShowPatchPreview] = useState<boolean>(false);

  useEffect(() => {
    setProposals(store.getProposals());
    setPages(store.getPages());
    setBriefings(store.getBriefings());
  }, []);

  const approvedProposals = proposals.filter((p) => p.decision === 'approved');

  const getDocFilename = (pageId: string) => {
    const page = pages.find((p) => p.id === pageId);
    return page ? `docs/${page.filename}` : `docs/${pageId}.md`;
  };

  const getDocTitle = (pageId: string) => {
    const page = pages.find((p) => p.id === pageId);
    return page ? page.title : pageId;
  };

  const patchPayload = approvedProposals.map((p) => ({
    filename: getDocFilename(p.page_id),
    before: p.before,
    after: p.customAfter || p.after,
  }));

  const fullPatchContent = generateMultiFilePatch(patchPayload);

  // 1. Download Unified Git Patch
  const handleDownloadPatch = () => {
    if (approvedProposals.length === 0) {
      showToast('error', 'No approved documentation edits to export.');
      return;
    }

    const blob = new Blob([fullPatchContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `driftwatch-${new Date().toISOString().slice(0, 10)}.patch`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('success', 'Git unified .patch file downloaded successfully!');
  };

  // 2. Copy PR Description
  const handleCopyPRDescription = async () => {
    const change = store.getCurrentChange();
    const docList = approvedProposals
      .map((p) => `- [x] **${getDocTitle(p.page_id)}** (\`${getDocFilename(p.page_id)}\`)\n  - *Reason:* ${p.reason}`)
      .join('\n');

    const prBody = `## Documentation Updates (DriftWatch Audit)\n\n` +
      `### Associated Product Change\n${change || 'Documentation drift resolved for latest release.'}\n\n` +
      `### Verified & Approved Documentation Edits\n${docList || 'None'}\n\n` +
      `---\n*Verified by human operator with DriftWatch.*`;

    try {
      await navigator.clipboard.writeText(prBody);
      showToast('success', 'Pull request documentation summary copied to clipboard!');
    } catch {
      showToast('error', 'Failed to copy to clipboard.');
    }
  };

  // 3. Download Updated Markdown (.zip)
  const handleDownloadZip = async () => {
    if (approvedProposals.length === 0) {
      showToast('error', 'No approved documentation edits to package.');
      return;
    }

    const zip = new JSZip();
    const docsFolder = zip.folder('docs');

    approvedProposals.forEach((p) => {
      const page = pages.find((d) => d.id === p.page_id);
      const filename = page ? page.filename : `${p.page_id}.md`;
      const content = p.customAfter || p.after;
      docsFolder?.file(filename, content);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `driftwatch-updated-docs-${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('success', 'Updated Markdown .zip package downloaded successfully!');
  };

  // 4. Generate Audience Briefings
  const handleGenerateBriefings = async () => {
    setIsGeneratingBriefings(true);
    try {
      const change = store.getCurrentChange() || 'Default retention changed from 30 to 14 days, --keep-days renamed to --retain.';
      const result = await generateAudienceBriefings(change, approvedProposals);
      setBriefings(result);
      showToast('success', 'Generated tailored briefings for Administrators, Executives, and Support!');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to generate audience briefings.');
    } finally {
      setIsGeneratingBriefings(false);
    }
  };

  const handleCopyText = async (text: string, title: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('success', `Copied "${title}" to clipboard!`);
    } catch {
      showToast('error', 'Failed to copy.');
    }
  };

  // 5. Time-Saved Logger
  const handleLogTime = (mins: number = minutesInput) => {
    if (!mins || mins <= 0) {
      showToast('error', 'Please enter a valid positive number of minutes.');
      return;
    }
    store.addMinutesSaved(mins);
    setHasLoggedTime(true);
    onRefreshState();
    showToast('success', `Logged ${mins} minutes saved! Total hours updated on Radar.`);
  };

  if (approvedProposals.length === 0) {
    return (
      <div>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-main)' }}>
            Export Approved Patches
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginTop: '4px' }}>
            Nothing exports until human approval is recorded on the Review page.
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
            🔒
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>
            No Approved Documentation Edits
          </h2>
          <p
            style={{
              color: 'var(--text-muted)',
              maxWidth: '540px',
              margin: '0 auto 24px',
              fontSize: '0.9375rem',
              lineHeight: 1.6,
            }}
          >
            In accordance with DriftWatch's human accuracy gate, documentation patches and release
            briefings require explicit human review and approval.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onNavigate('review')}
            >
              Go to Review Page →
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onNavigate('radar')}
            >
              Back to Radar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Top Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-main)' }}>
          Export Approved Documentation Patches
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginTop: '4px' }}>
          Human approval recorded for {approvedProposals.length} documentation page(s). Download Git
          patches, archive zip packages, or generate release briefings.
        </p>
      </div>

      {/* Top Row: Widescreen 2 Columns (Export Artifacts & Efficiency Logger) */}
      <div className="widescreen-grid-2col" style={{ marginBottom: '24px' }}>
        {/* Column 1: Artifacts */}
        <div className="surface-card" style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              1. Git Artifacts & Packages
            </h2>
            <button
              type="button"
              className="btn btn-subtle btn-sm"
              onClick={() => setShowPatchPreview(!showPatchPreview)}
            >
              {showPatchPreview ? 'Hide Patch Preview' : '👁 Preview Unified Patch'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleDownloadPatch}
            >
              📥 Download .patch (Unified Diff)
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCopyPRDescription}
            >
              📋 Copy PR Description
            </button>

            <button
              type="button"
              className="btn btn-subtle"
              onClick={handleDownloadZip}
            >
              📦 Download updated Markdown (.zip)
            </button>
          </div>

          {/* Unified Patch Preview if toggled */}
          {showPatchPreview && (
            <div style={{ marginBottom: '16px' }}>
              <pre
                style={{
                  backgroundColor: '#0F172A',
                  color: '#34D399',
                  padding: '14px',
                  borderRadius: '8px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {fullPatchContent}
              </pre>
            </div>
          )}

          {/* Approved Pages List */}
          <div>
            <h3 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
              Approved Pages for Release ({approvedProposals.length}):
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {approvedProposals.map((p) => (
                <div
                  key={p.page_id}
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9375rem' }}>
                      {getDocTitle(p.page_id)}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      <code>{getDocFilename(p.page_id)}</code> • {p.reason}
                    </div>
                  </div>
                  <span className="pill pill-green" style={{ fontSize: '0.75rem' }}>
                    ✓ Approved
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column 2: Automation Efficiency Logger */}
        <div className="surface-card" style={{ margin: 0 }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>
            2. Efficiency & ROI Logger
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Log hours saved on manual search, diff analysis, and editorial review. Cumulative savings update immediately on the Radar dashboard.
          </p>

          <div
            style={{
              backgroundColor: 'var(--primary-subtle)',
              border: '1px solid var(--primary-border)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.8125rem', color: 'var(--primary)', fontWeight: 600 }}>
              TOTAL TIME SAVED TO DATE
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1.1, margin: '6px 0' }}>
              {store.getStats().hoursSaved} hrs
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Logged across automated drift detections
            </div>
          </div>

          {/* Quick presets */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
              Quick Minutes Presets:
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[15, 30, 45, 60, 90].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  className="btn btn-subtle btn-sm"
                  onClick={() => setMinutesInput(mins)}
                  style={{
                    backgroundColor: minutesInput === mins ? 'var(--primary-subtle)' : '#FFFFFF',
                    borderColor: minutesInput === mins ? 'var(--primary)' : 'var(--border-color)',
                    fontWeight: minutesInput === mins ? 700 : 500,
                  }}
                >
                  +{mins} min
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              id="minutes-input"
              type="number"
              min="1"
              max="600"
              className="form-input"
              style={{ width: '110px' }}
              value={minutesInput}
              onChange={(e) => setMinutesInput(parseInt(e.target.value, 10) || 0)}
              disabled={hasLoggedTime}
              aria-label="Minutes saved"
            />
            <button
              type="button"
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={() => handleLogTime()}
              disabled={hasLoggedTime}
            >
              {hasLoggedTime ? '✓ Logged to Radar' : 'Log Time Saved'}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Audience Briefings across 3 Widescreen Columns */}
      <div className="surface-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>3. Multi-Audience Briefings</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Plain-language release communications tailored for Operations, Leadership, and Customer Support.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleGenerateBriefings}
            disabled={isGeneratingBriefings}
          >
            {isGeneratingBriefings && <Spinner size="sm" />}
            {isGeneratingBriefings ? 'Generating Briefings...' : '✨ Generate Audience Briefings'}
          </button>
        </div>

        {briefings ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '16px',
            }}
          >
            {/* Administrators */}
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '18px', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '1.1rem' }}>🛠️</span>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      For Administrators
                    </h3>
                  </div>
                  <button
                    type="button"
                    className="btn btn-subtle btn-sm"
                    onClick={() => handleCopyText(briefings.for_administrators, 'Admin Briefing')}
                  >
                    Copy
                  </button>
                </div>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: '140px', fontSize: '0.875rem' }}
                  value={briefings.for_administrators}
                  onChange={(e) => {
                    const updated = { ...briefings, for_administrators: e.target.value };
                    setBriefings(updated);
                    store.setBriefings(updated);
                  }}
                />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'right' }}>
                {briefings.for_administrators.length} characters
              </div>
            </div>

            {/* Executives */}
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '18px', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '1.1rem' }}>📊</span>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      For Executives
                    </h3>
                  </div>
                  <button
                    type="button"
                    className="btn btn-subtle btn-sm"
                    onClick={() => handleCopyText(briefings.for_executives, 'Executive Briefing')}
                  >
                    Copy
                  </button>
                </div>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: '140px', fontSize: '0.875rem' }}
                  value={briefings.for_executives}
                  onChange={(e) => {
                    const updated = { ...briefings, for_executives: e.target.value };
                    setBriefings(updated);
                    store.setBriefings(updated);
                  }}
                />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'right' }}>
                {briefings.for_executives.length} characters
              </div>
            </div>

            {/* Support */}
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '18px', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '1.1rem' }}>🎧</span>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      For Support Agents
                    </h3>
                  </div>
                  <button
                    type="button"
                    className="btn btn-subtle btn-sm"
                    onClick={() => handleCopyText(briefings.for_support, 'Support Briefing')}
                  >
                    Copy
                  </button>
                </div>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: '140px', fontSize: '0.875rem' }}
                  value={briefings.for_support}
                  onChange={(e) => {
                    const updated = { ...briefings, for_support: e.target.value };
                    setBriefings(updated);
                    store.setBriefings(updated);
                  }}
                />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'right' }}>
                {briefings.for_support.length} characters
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              backgroundColor: '#F8FAFC',
              border: '1px dashed var(--border-color)',
              borderRadius: '8px',
              padding: '32px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.9375rem',
            }}
          >
            Click <strong>"Generate Audience Briefings"</strong> above to produce plain-language release summaries for Administrators, Executives, and Support teams.
          </div>
        )}
      </div>
    </div>
  );
};
