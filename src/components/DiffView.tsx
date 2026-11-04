import React, { useMemo } from 'react';
import { computeSideBySide, type SideBySideRow } from '../lib/diff.ts';

export interface DiffViewProps {
  beforeText: string;
  afterText: string;
  beforeTitle?: string;
  afterTitle?: string;
  maxHeight?: string;
}

export const DiffView: React.FC<DiffViewProps> = ({
  beforeText,
  afterText,
  beforeTitle = 'Current Documentation (Before)',
  afterTitle = 'Proposed Update (After)',
  maxHeight = '360px',
}) => {
  const rows = useMemo(() => computeSideBySide(beforeText, afterText), [beforeText, afterText]);

  const hasModifications = useMemo(
    () => rows.some((r) => r.left?.type === 'removed' || r.right?.type === 'added'),
    [rows]
  );

  return (
    <div className="diff-container" aria-label="Documentation diff comparison">
      <div className="diff-header">
        <div className="diff-header-col">{beforeTitle}</div>
        <div className="diff-header-col">{afterTitle}</div>
      </div>

      <div className="diff-body" style={{ maxHeight }}>
        {!hasModifications ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No textual changes detected between versions.
          </div>
        ) : (
          rows.map((row: SideBySideRow, idx: number) => {
            const leftClass =
              row.left?.type === 'removed' ? 'diff-cell left diff-removed' : 'diff-cell left';
            const rightClass =
              row.right?.type === 'added' ? 'diff-cell right diff-added' : 'diff-cell right';

            return (
              <div key={idx} className="diff-row">
                {/* Left cell (Before) */}
                <div className={leftClass}>
                  <span className="diff-cell-num">{row.left?.lineNumber ?? ''}</span>
                  <span className="diff-cell-content">{row.left?.text ?? ''}</span>
                </div>

                {/* Right cell (After) */}
                <div className={rightClass}>
                  <span className="diff-cell-num">{row.right?.lineNumber ?? ''}</span>
                  <span className="diff-cell-content">{row.right?.text ?? ''}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
