/**
 * Artifact Diff Utilities
 *
 * Compute line-based diffs between artifact versions
 */

import { diffLines, Change } from 'diff';

export type DiffChange = Change;

/**
 * Compute line-based diff between two versions of markdown
 *
 * @param oldText - Previous version markdown
 * @param newText - Current version markdown
 * @returns Array of diff changes with added/removed flags
 */
export function computeDiff(oldText: string, newText: string): DiffChange[] {
  return diffLines(oldText, newText);
}
