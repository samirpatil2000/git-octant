import { describe, it, expect } from 'vitest';
import {
  formatRelativeTime,
  truncateSha,
  cleanBranchName,
  getLanguageColor,
} from '../../src/lib/formatters';

describe('formatters', () => {
  it('truncates commit SHA to 7 characters', () => {
    expect(truncateSha('8a3f12d89b12480a8274092b7c4a12390f7a6b32')).toBe('8a3f12d');
    expect(truncateSha('')).toBe('');
  });

  it('cleans git refs to friendly branch names', () => {
    expect(cleanBranchName('refs/heads/main')).toBe('main');
    expect(cleanBranchName('refs/heads/feature/camera-flight')).toBe('feature/camera-flight');
    expect(cleanBranchName('develop')).toBe('develop');
  });

  it('formats relative time accurately', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 10 * 1000)).toBe('just now');
    expect(formatRelativeTime(now - 12 * 60 * 1000)).toBe('12 minutes ago');
    expect(formatRelativeTime(now - 60 * 60 * 1000)).toBe('1 hour ago');
    expect(formatRelativeTime(now - 3 * 60 * 60 * 1000)).toBe('3 hours ago');
    expect(formatRelativeTime(now - 25 * 60 * 60 * 1000)).toBe('yesterday');
    expect(formatRelativeTime(now - 4 * 24 * 60 * 60 * 1000)).toBe('4 days ago');
  });

  it('returns valid hex color for programming languages', () => {
    expect(getLanguageColor('TypeScript')).toBe('#3178c6');
    expect(getLanguageColor('Go')).toBe('#00ADD8');
    expect(getLanguageColor('Unknown')).toBe('#8b949e');
  });
});
