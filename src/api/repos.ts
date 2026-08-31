import { githubFetch } from './client';
import { GitHubRepository, GitHubCommit } from '../types/github';

export async function getUserRepositories(
  token: string,
  perPage = 100
): Promise<GitHubRepository[]> {
  try {
    const res = await githubFetch<GitHubRepository[]>(
      `/user/repos?sort=pushed&per_page=${perPage}&affiliation=owner,collaborator,organization_member`,
      token
    );
    return res.data || [];
  } catch (err) {
    console.warn('Failed to fetch user repositories', err);
    return [];
  }
}

export async function getRepository(
  owner: string,
  repo: string,
  token?: string
): Promise<GitHubRepository | null> {
  try {
    const res = await githubFetch<GitHubRepository>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
      token
    );
    return res.data;
  } catch (err) {
    console.warn(`Failed to fetch repo ${owner}/${repo}`, err);
    return null;
  }
}

export async function getCommitDetails(
  owner: string,
  repo: string,
  sha: string,
  token?: string
): Promise<GitHubCommit | null> {
  try {
    const res = await githubFetch<any>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits/${encodeURIComponent(sha)}`,
      token
    );
    return {
      sha: res.data.sha,
      message: res.data.commit.message,
      author: {
        name: res.data.commit.author.name,
        email: res.data.commit.author.email,
        date: res.data.commit.author.date,
      },
      url: res.data.url,
      html_url: res.data.html_url,
    };
  } catch (err) {
    console.warn(`Failed to fetch commit ${sha}`, err);
    return null;
  }
}
