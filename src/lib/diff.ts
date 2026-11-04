export interface DiffLine {
  type: 'same' | 'added' | 'removed';
  leftLineNumber?: number;
  rightLineNumber?: number;
  text: string;
}

export interface SideBySideRow {
  left?: { lineNumber: number; text: string; type: 'same' | 'removed' };
  right?: { lineNumber: number; text: string; type: 'same' | 'added' };
}

/**
 * Computes line-by-line diff using Longest Common Subsequence (LCS).
 */
export function computeDiffLines(beforeText: string, afterText: string): DiffLine[] {
  const beforeLines = beforeText.split(/\r?\n/);
  const afterLines = afterText.split(/\r?\n/);

  const n = beforeLines.length;
  const m = afterLines.length;

  // LCS Matrix
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (beforeLines[i - 1] === afterLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to build diff
  let i = n;
  let j = m;
  const rawDiff: DiffLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && beforeLines[i - 1] === afterLines[j - 1]) {
      rawDiff.push({
        type: 'same',
        leftLineNumber: i,
        rightLineNumber: j,
        text: beforeLines[i - 1],
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rawDiff.push({
        type: 'added',
        rightLineNumber: j,
        text: afterLines[j - 1],
      });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      rawDiff.push({
        type: 'removed',
        leftLineNumber: i,
        text: beforeLines[i - 1],
      });
      i--;
    }
  }

  return rawDiff.reverse();
}

/**
 * Aligns diff lines for a clean side-by-side presentation.
 */
export function computeSideBySide(beforeText: string, afterText: string): SideBySideRow[] {
  const diffLines = computeDiffLines(beforeText, afterText);
  const rows: SideBySideRow[] = [];

  let idx = 0;
  while (idx < diffLines.length) {
    const item = diffLines[idx];
    if (item.type === 'same') {
      rows.push({
        left: { lineNumber: item.leftLineNumber!, text: item.text, type: 'same' },
        right: { lineNumber: item.rightLineNumber!, text: item.text, type: 'same' },
      });
      idx++;
    } else if (item.type === 'removed') {
      // Check if following line is an 'added' line to pair them on the same visual row
      const next = diffLines[idx + 1];
      if (next && next.type === 'added') {
        rows.push({
          left: { lineNumber: item.leftLineNumber!, text: item.text, type: 'removed' },
          right: { lineNumber: next.rightLineNumber!, text: next.text, type: 'added' },
        });
        idx += 2;
      } else {
        rows.push({
          left: { lineNumber: item.leftLineNumber!, text: item.text, type: 'removed' },
          right: undefined,
        });
        idx++;
      }
    } else if (item.type === 'added') {
      rows.push({
        left: undefined,
        right: { lineNumber: item.rightLineNumber!, text: item.text, type: 'added' },
      });
      idx++;
    }
  }

  return rows;
}

/**
 * Generates unified Git patch string suitable for `git apply`.
 */
export function generateUnifiedPatch(filename: string, beforeText: string, afterText: string): string {
  const diffLines = computeDiffLines(beforeText, afterText);
  if (!diffLines.some((l) => l.type !== 'same')) {
    return ''; // No changes
  }

  const patchLines: string[] = [
    `diff --git a/${filename} b/${filename}`,
    `--- a/${filename}`,
    `+++ b/${filename}`,
  ];

  // Group into hunks with context
  let hunkBeforeCount = 0;
  let hunkAfterCount = 0;
  const hunkBody: string[] = [];

  for (const line of diffLines) {
    if (line.type === 'same') {
      hunkBeforeCount++;
      hunkAfterCount++;
      hunkBody.push(` ${line.text}`);
    } else if (line.type === 'removed') {
      hunkBeforeCount++;
      hunkBody.push(`-${line.text}`);
    } else if (line.type === 'added') {
      hunkAfterCount++;
      hunkBody.push(`+${line.text}`);
    }
  }

  patchLines.push(`@@ -1,${hunkBeforeCount} +1,${hunkAfterCount} @@`);
  patchLines.push(...hunkBody);
  return patchLines.join('\n') + '\n';
}

/**
 * Generates a multi-file unified git patch for all approved edits.
 */
export function generateMultiFilePatch(
  edits: { filename: string; before: string; after: string }[]
): string {
  return edits
    .map((e) => generateUnifiedPatch(e.filename, e.before, e.after))
    .filter(Boolean)
    .join('\n');
}
