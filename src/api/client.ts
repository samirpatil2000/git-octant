import { RateLimitInfo } from '../types/app';

export class GitHubApiError extends Error {
  status: number;
  rateLimit?: RateLimitInfo;
  isRateLimit: boolean;
  isAuthError: boolean;
  documentationUrl?: string;

  constructor(
    message: string,
    status: number,
    rateLimit?: RateLimitInfo,
    documentationUrl?: string
  ) {
    super(message);
    this.name = 'GitHubApiError';
    this.status = status;
    this.rateLimit = rateLimit;
    this.isRateLimit = status === 429 || (status === 403 && rateLimit?.remaining === 0);
    this.isAuthError = status === 401;
    this.documentationUrl = documentationUrl;
  }
}

export interface ApiResponse<T> {
  data: T;
  rateLimit: RateLimitInfo;
  headers: Headers;
}

const GITHUB_API_BASE = 'https://api.github.com';

export function parseRateLimitHeaders(headers: Headers): RateLimitInfo {
  const limit = parseInt(headers.get('x-ratelimit-limit') || '5000', 10);
  const remaining = parseInt(headers.get('x-ratelimit-remaining') || '5000', 10);
  const resetUnix = parseInt(headers.get('x-ratelimit-reset') || '0', 10);
  
  const resetTime = resetUnix ? new Date(resetUnix * 1000).toISOString() : new Date().toISOString();
  const nowUnix = Math.floor(Date.now() / 1000);
  const resetInMinutes = resetUnix > nowUnix ? Math.ceil((resetUnix - nowUnix) / 60) : 0;

  return {
    limit,
    remaining,
    resetTime,
    resetInMinutes,
    isLimited: remaining === 0,
  };
}

export async function githubFetch<T>(
  path: string,
  token?: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = path.startsWith('http') ? path : `${GITHUB_API_BASE}${path}`;

  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/vnd.github+json');
  headers.set('X-GitHub-Api-Version', '2022-11-28');

  if (token && token.trim().length > 0) {
    headers.set('Authorization', `Bearer ${token.trim()}`);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (netErr: any) {
    throw new GitHubApiError(
      'Unable to connect to GitHub. Please check your internet connection.',
      0
    );
  }

  const rateLimit = parseRateLimitHeaders(response.headers);

  if (!response.ok) {
    let errorMsg = `GitHub API request failed (${response.status})`;
    let docUrl: string | undefined;

    try {
      const errJson = await response.json();
      if (errJson.message) {
        errorMsg = errJson.message;
      }
      if (errJson.documentation_url) {
        docUrl = errJson.documentation_url;
      }
    } catch (_) {
      // fallback
    }

    if (response.status === 401) {
      throw new GitHubApiError(
        'Invalid or expired GitHub Personal Access Token. Please verify token permissions.',
        401,
        rateLimit,
        docUrl
      );
    }

    if (response.status === 403 || response.status === 429) {
      if (rateLimit.remaining === 0) {
        throw new GitHubApiError(
          `GitHub API rate limit exceeded. Cached data is shown. Resets in ${rateLimit.resetInMinutes} min.`,
          response.status,
          rateLimit,
          docUrl
        );
      }
      throw new GitHubApiError(
        'Access forbidden. The token may lack required repository/organization permissions.',
        403,
        rateLimit,
        docUrl
      );
    }

    if (response.status === 404) {
      throw new GitHubApiError(
        'The requested repository or resource was not found or is not accessible with this token.',
        404,
        rateLimit,
        docUrl
      );
    }

    throw new GitHubApiError(errorMsg, response.status, rateLimit, docUrl);
  }

  const data = (await response.json()) as T;
  return {
    data,
    rateLimit,
    headers: response.headers,
  };
}
