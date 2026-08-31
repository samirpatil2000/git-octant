import { describe, it, expect } from 'vitest';
import { parseRateLimitHeaders, GitHubApiError } from '../../src/api/client';

describe('GitHubApi client utilities', () => {
  it('parses GitHub rate limit headers correctly', () => {
    const headers = new Headers();
    headers.set('x-ratelimit-limit', '5000');
    headers.set('x-ratelimit-remaining', '42');
    const futureUnix = Math.floor(Date.now() / 1000) + 180; // 3 minutes ahead
    headers.set('x-ratelimit-reset', String(futureUnix));

    const info = parseRateLimitHeaders(headers);

    expect(info.limit).toBe(5000);
    expect(info.remaining).toBe(42);
    expect(info.isLimited).toBe(false);
    expect(info.resetInMinutes).toBeGreaterThanOrEqual(2);
  });

  it('flags isLimited when remaining is 0', () => {
    const headers = new Headers();
    headers.set('x-ratelimit-limit', '5000');
    headers.set('x-ratelimit-remaining', '0');
    headers.set('x-ratelimit-reset', String(Math.floor(Date.now() / 1000) + 300));

    const info = parseRateLimitHeaders(headers);
    expect(info.isLimited).toBe(true);
  });

  it('constructs GitHubApiError with status code and rate limit metadata', () => {
    const err = new GitHubApiError('Rate limit reached', 429, {
      limit: 5000,
      remaining: 0,
      resetTime: new Date().toISOString(),
      resetInMinutes: 5,
      isLimited: true,
    });

    expect(err.status).toBe(429);
    expect(err.isRateLimit).toBe(true);
    expect(err.isAuthError).toBe(false);
  });
});
