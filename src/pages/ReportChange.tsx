import React, { useState, useEffect } from 'react';
import { store } from '../lib/store.ts';
import { scanForSecrets, redactSecrets, type SecretMatch } from '../lib/redact.ts';
import { analyzeChangeImpact } from '../lib/api.ts';
import { Spinner } from '../components/Spinner.tsx';
import { useToast } from '../components/Toast.tsx';

export interface ReportChangeProps {
  onNavigate: (route: 'radar' | 'review' | 'map' | 'export' | 'guide') => void;
  onRefreshState: () => void;
}

export const ReportChange: React.FC<ReportChangeProps> = ({ onNavigate, onRefreshState }) => {
  const { showToast } = useToast();
  const [changeText, setChangeText] = useState('');
  const [detectedSecrets, setDetectedSecrets] = useState<SecretMatch[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [hasScanned, setHasScanned] = useState(false);

  useEffect(() => {
    const existing = store.getCurrentChange();
    if (existing) {
      setChangeText(existing);
    }
  }, []);

  const handleLoadExample = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    try {
      const res = await fetch('/api/sample-data');
      if (res.ok) {
        const data = await res.json();
        setChangeText(data.sampleChange || '');
        showToast('info', 'Loaded sample PR #142 (Retention & CLI flags).');
      } else {
        const fallback = `PR #142: Update snapshot retention defaults and add restore simulation\n\n1. Default retention window reduced from 30 days to 14 days across all repositories to align with compliance guidelines.\n2. CLI flag --keep-days has been renamed to --retain across vaultlite backup.\n3. Added --dry-run flag to vaultlite restore command for simulation before writing.\n\nTouched files: src/retention.py, src/backup.py, src/restore.py, src/cli.py`;
        setChangeText(fallback);
      }
    } catch {
      const fallback = `PR #142: Update snapshot retention defaults and add restore simulation\n\n1. Default retention window reduced from 30 days to 14 days.\n2. CLI flag --keep-days renamed to --retain.\n3. Added --dry-run flag to vaultlite restore.`;
      setChangeText(fallback);
    }
  };

  const handleLoadScenario2 = () => {
    const scenario = `Ticket #208: Add AES-256 keyfile rotation and deprecate plaintext env var\n\nSummary:\n1. Introduced \`vaultlite key-rotate --keyfile <path>\` to securely re-encrypt snapshot catalogs.\n2. Deprecated passing raw passphrases via VAULTLITE_PASSPHRASE environment variable; warning emitted if detected.\n3. Added mandatory key derivation iteration check.\n\nTouched files:\n- src/crypto.py\n- src/cli.py`;
    setChangeText(scenario);
    showToast('info', 'Loaded Ticket #208 (Security & Crypto update).');
  };

  const handleAnalyzeClick = async (textToAnalyze?: string) => {
    const target = (textToAnalyze ?? changeText).trim();
    if (!target) {
      showToast('error', 'Please enter a product change description, commit log, or PR diff.');
      return;
    }

    // Run Secret Scanner before sending anything to AI
    const secrets = scanForSecrets(target);
    if (secrets.length > 0) {
      setDetectedSecrets(secrets);
      setHasScanned(true);
      showToast('error', `Secret scanner detected ${secrets.length} confidential item(s). Approval or redaction required.`);
      return;
    }

    setDetectedSecrets([]);
    setHasScanned(false);
    await executeAnalysis(target);
  };

  const handleRedactAndContinue = async () => {
    const cleaned = redactSecrets(changeText, detectedSecrets);
    setChangeText(cleaned);
    setDetectedSecrets([]);
    setHasScanned(false);
    showToast('info', 'Confidential items redacted. Proceeding with impact analysis...');
    await executeAnalysis(cleaned);
  };

  const handleCancelRedaction = () => {
    setDetectedSecrets([]);
    setHasScanned(false);
    showToast('info', 'Analysis cancelled. Please modify confidential data.');
  };

  const executeAnalysis = async (cleanText: string) => {
    setIsAnalyzing(true);
    setCurrentStep('Scanning');

    try {
      const proposals = await analyzeChangeImpact(cleanText, (step) => {
        setCurrentStep(step);
      });

      onRefreshState();
      showToast('success', `Analysis complete! Detected ${proposals.length} documentation page(s) requiring update.`);
      onNavigate('review');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to complete documentation drift analysis.');
    } finally {
      setIsAnalyzing(false);
      setCurrentStep('');
    }
  };

  const stepsList = ['Scanning', 'Finding related pages', 'Drafting edits', 'Done'];

  return (
    <div>
      {/* Page Title */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-main)' }}>
          Report Product Change
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginTop: '4px' }}>
          Paste a pull request description, commit log, or ticket. DriftWatch scans for secrets, retrieves affected documentation, and drafts surgical updates.
        </p>
      </div>

      {/* Widescreen 2-Column Grid */}
      <div className="widescreen-grid-2col">
        {/* Left Column: Input Form & Secret Scanner */}
        <div>
          <div className="surface-card">
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <label htmlFor="change-input" className="form-label" style={{ margin: 0 }}>
                  Paste a pull request description, commit log, or ticket
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <a
                    href="#load-example"
                    onClick={handleLoadExample}
                    style={{ fontSize: '0.875rem', fontWeight: 600 }}
                    aria-label="Load example pull request change"
                  >
                    Load PR #142 (Sample)
                  </a>
                  {changeText && (
                    <button
                      type="button"
                      className="btn btn-subtle btn-sm"
                      style={{ height: '24px', fontSize: '0.75rem', padding: '0 8px' }}
                      onClick={() => setChangeText('')}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <textarea
                id="change-input"
                className="form-textarea"
                style={{ minHeight: '260px', fontFamily: 'var(--font-mono)', fontSize: '0.9375rem' }}
                placeholder="e.g. PR #142: Default retention changed from 30 to 14 days; --keep-days flag renamed to --retain; new flag --dry-run added to restore..."
                value={changeText}
                onChange={(e) => setChangeText(e.target.value)}
                disabled={isAnalyzing}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                <span className="form-hint">
                  Client-side confidential scanner runs automatically prior to any server transmission.
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {changeText.length} characters • {changeText.split('\n').length} lines
                </span>
              </div>
            </div>

            {/* Secret Scanner Warning Panel */}
            {detectedSecrets.length > 0 && (
              <div
                className="alert-warning"
                role="alert"
                style={{
                  borderLeft: '4px solid var(--warning)',
                  padding: '16px 20px',
                  margin: '20px 0',
                }}
              >
                <div className="alert-title" style={{ color: '#78350F' }}>
                  <span>🛡️ Secret Scanner Alert: Sensitive Data Detected</span>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#92400E', marginBottom: '12px' }}>
                  DriftWatch identified <strong>{detectedSecrets.length} confidential string(s)</strong> in your text.
                  In accordance with enterprise confidential data rules, nothing is sent to the AI until the text is cleaned.
                </p>

                <ul style={{ listStyle: 'none', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {detectedSecrets.map((m, idx) => (
                    <li
                      key={idx}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid var(--warning-border)',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        fontSize: '0.8125rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {m.type}: <code>{m.value.length > 25 ? `${m.value.slice(0, 10)}...${m.value.slice(-6)}` : m.value}</code>
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        Replaced with: <code>{m.masked}</code>
                      </span>
                    </li>
                  ))}
                </ul>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleRedactAndContinue}
                    disabled={isAnalyzing}
                  >
                    Redact and continue
                  </button>
                  <button
                    type="button"
                    className="btn btn-subtle"
                    onClick={handleCancelRedaction}
                    disabled={isAnalyzing}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Streaming Progress Bar during Analysis */}
            {isAnalyzing && (
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '16px 20px',
                  margin: '20px 0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <Spinner size="md" color="var(--primary)" />
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    Analyzing Product Impact & Retrieving Candidates...
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '8px',
                    marginTop: '12px',
                  }}
                >
                  {stepsList.map((step, idx) => {
                    const currentIdx = stepsList.indexOf(currentStep);
                    const isPassed = currentIdx > idx;
                    const isCurrent = currentStep === step;

                    return (
                      <div
                        key={step}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          textAlign: 'center',
                          backgroundColor: isCurrent
                            ? 'var(--primary-subtle)'
                            : isPassed
                            ? 'var(--success-bg)'
                            : '#FFFFFF',
                          border: `1px solid ${
                            isCurrent
                              ? 'var(--primary)'
                              : isPassed
                              ? 'var(--success-border)'
                              : 'var(--border-color)'
                          }`,
                          color: isCurrent
                            ? 'var(--primary)'
                            : isPassed
                            ? 'var(--success)'
                            : 'var(--text-muted)',
                        }}
                      >
                        {isPassed ? '✓ ' : isCurrent ? '● ' : '○ '}
                        {step}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Button */}
            {!detectedSecrets.length && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ minWidth: '180px', height: '42px', fontSize: '1rem' }}
                  onClick={() => handleAnalyzeClick()}
                  disabled={isAnalyzing || !changeText.trim()}
                >
                  {isAnalyzing && <Spinner size="sm" />}
                  {isAnalyzing ? currentStep || 'Analyzing...' : 'Analyze impact →'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Usability Helpers & Quick Scenarios */}
        <div>
          {/* Quick Change Presets */}
          <div className="surface-card" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '10px' }}>
              ⚡ Quick Scenarios & Examples
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Test how DriftWatch isolates affected documentation pages across different product changes:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-subtle btn-sm"
                style={{ justifyContent: 'flex-start', textAlign: 'left', height: 'auto', padding: '10px 12px' }}
                onClick={() => handleLoadExample()}
              >
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--primary)' }}>
                    PR #142: Retention & Restore Dry-Run
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Changes default 30d to 14d, renames --keep-days to --retain. Affects 4-5 pages.
                  </div>
                </div>
              </button>

              <button
                type="button"
                className="btn btn-subtle btn-sm"
                style={{ justifyContent: 'flex-start', textAlign: 'left', height: 'auto', padding: '10px 12px' }}
                onClick={handleLoadScenario2}
              >
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--primary)' }}>
                    Ticket #208: Keyfile Rotation & Env Deprecation
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Security & crypto update. Tests selective retrieval for encryption & CLI reference.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Privacy & Safety Guarantee */}
          <div className="surface-card" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.1rem' }}>🛡️</span>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Client-Side Privacy Scanner</h3>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              DriftWatch runs regex scanners in your browser for API keys (<code>AIza...</code>, <code>sk-...</code>),
              Bearer tokens, passwords, customer emails, and private IP addresses. Nothing is sent to Gemini until clean.
            </p>
          </div>

          {/* 4-Stage Pipeline Card */}
          <div className="surface-card">
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '10px' }}>
              Pipeline Stages
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span className="pill pill-neutral" style={{ fontSize: '0.7rem' }}>1</span>
                <div><strong>Chunking & Embedding:</strong> Markdown pages split by heading into 400-token chunks.</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span className="pill pill-neutral" style={{ fontSize: '0.7rem' }}>2</span>
                <div><strong>Cosine Ranking:</strong> Embeds the change and fetches the top 8 relevant chunks.</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span className="pill pill-neutral" style={{ fontSize: '0.7rem' }}>3</span>
                <div><strong>Grounded Drafting:</strong> Gemini Flash drafts surgical diffs restricted strictly to the change.</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span className="pill pill-neutral" style={{ fontSize: '0.7rem' }}>4</span>
                <div><strong>Human Gate:</strong> Human engineer verifies and approves before patch export.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
