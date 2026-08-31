import { githubFetch, GitHubApiError } from './client';
import { GitHubUser } from '../types/github';

export interface TokenValidationResult {
  isValid: boolean;
  user: GitHubUser | null;
  scopes: string[];
  error?: string;
}

export async function getAuthenticatedUser(token: string): Promise<GitHubUser> {
  const res = await githubFetch<GitHubUser>('/user', token);
  return res.data;
}

export async function validateToken(token: string): Promise<TokenValidationResult> {
  if (!token || !token.trim()) {
    return {
      isValid: false,
      user: null,
      scopes: [],
      error: 'Token is required.',
    };
  }

  try {
    const res = await githubFetch<GitHubUser>('/user', token);
    const scopesHeader = res.headers.get('x-oauth-scopes') || '';
    const scopes = scopesHeader
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    return {
      isValid: true,
      user: res.data,
      scopes,
    };
  } catch (err: any) {
    if (err instanceof GitHubApiError) {
      return {
        isValid: false,
        user: null,
        scopes: [],
        error: err.message,
      };
    }
    return {
      isValid: false,
      user: null,
      scopes: [],
      error: 'Failed to connect to GitHub.',
    };
  }
}
