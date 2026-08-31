import { githubFetch } from './client';
import {
  GitHubPullRequest,
  GitHubReview,
  GitHubCheckRun,
} from '../types/github';
import { PRReviewAndCheckContext } from '../lib/attention';

interface SearchIssuesResponse {
  total_count: number;
  incomplete_results: boolean;
  items: Array<{
    id: number;
    node_id: string;
    number: number;
    title: string;
    user: any;
    state: string;
    html_url: string;
    repository_url: string;
    labels: any[];
    created_at: string;
    updated_at: string;
    closed_at: string | null;
    pull_request?: {
      url: string;
      html_url: string;
      diff_url: string;
      patch_url: string;
      merged_at: string | null;
    };
    draft?: boolean;
  }>;
}

export async function getOpenPRsByAuthor(
  username: string,
  token: string
): Promise<GitHubPullRequest[]> {
  try {
    const q = encodeURIComponent(`is:pr is:open author:${username}`);
    const res = await githubFetch<SearchIssuesResponse>(
      `/search/issues?q=${q}&sort=updated&order=desc&per_page=30`,
      token
    );

    const prs: GitHubPullRequest[] = [];
    const fetchPromises = res.data.items.slice(0, 10).map(async (item) => {
      // Extract owner & repo from repository_url: https://api.github.com/repos/{owner}/{repo}
      const parts = item.repository_url.split('/');
      const owner = parts[parts.length - 2];
      const repo = parts[parts.length - 1];
      try {
        const detail = await getPullRequestDetails(owner, repo, item.number, token);
        if (detail) return detail;
      } catch (_) {}
      return null;
    });

    const results = await Promise.allSettled(fetchPromises);
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) {
        prs.push(r.value);
      }
    }
    return prs;
  } catch (err) {
    console.warn('Failed to search author PRs', err);
    return [];
  }
}

export async function getReviewRequestedPRs(
  username: string,
  token: string
): Promise<GitHubPullRequest[]> {
  try {
    const q = encodeURIComponent(`is:pr is:open review-requested:${username}`);
    const res = await githubFetch<SearchIssuesResponse>(
      `/search/issues?q=${q}&sort=updated&order=desc&per_page=20`,
      token
    );

    const prs: GitHubPullRequest[] = [];
    const fetchPromises = res.data.items.slice(0, 10).map(async (item) => {
      const parts = item.repository_url.split('/');
      const owner = parts[parts.length - 2];
      const repo = parts[parts.length - 1];
      try {
        const detail = await getPullRequestDetails(owner, repo, item.number, token);
        if (detail) return detail;
      } catch (_) {}
      return null;
    });

    const results = await Promise.allSettled(fetchPromises);
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) {
        prs.push(r.value);
      }
    }
    return prs;
  } catch (err) {
    console.warn('Failed to search review-requested PRs', err);
    return [];
  }
}

export async function getPullRequestDetails(
  owner: string,
  repo: string,
  pullNumber: number,
  token: string
): Promise<GitHubPullRequest | null> {
  try {
    const res = await githubFetch<GitHubPullRequest>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${pullNumber}`,
      token
    );
    return res.data;
  } catch (err) {
    console.warn(`Failed to fetch PR #${pullNumber} for ${owner}/${repo}`, err);
    return null;
  }
}

export async function getPullRequestReviews(
  owner: string,
  repo: string,
  pullNumber: number,
  token: string
): Promise<GitHubReview[]> {
  try {
    const res = await githubFetch<GitHubReview[]>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${pullNumber}/reviews`,
      token
    );
    return res.data || [];
  } catch (err) {
    console.warn(`Failed to fetch reviews for PR #${pullNumber}`, err);
    return [];
  }
}

export async function getCommitCheckRuns(
  owner: string,
  repo: string,
  ref: string,
  token: string
): Promise<GitHubCheckRun[]> {
  try {
    const res = await githubFetch<{ total_count: number; check_runs: GitHubCheckRun[] }>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits/${encodeURIComponent(ref)}/check-runs`,
      token
    );
    return res.data.check_runs || [];
  } catch (err) {
    console.warn(`Failed to fetch check runs for ${ref}`, err);
    return [];
  }
}

export async function fetchPRContexts(
  prs: GitHubPullRequest[],
  token: string
): Promise<PRReviewAndCheckContext[]> {
  return Promise.all(
    prs.map(async (pr) => {
      const owner = pr.base.repo?.owner.login || pr.head.user.login;
      const repo = pr.base.repo?.name || 'repository';

      const [reviews, checks] = await Promise.all([
        getPullRequestReviews(owner, repo, pr.number, token),
        pr.head.sha ? getCommitCheckRuns(owner, repo, pr.head.sha, token) : Promise.resolve([]),
      ]);

      return { pr, reviews, checks };
    })
  );
}
