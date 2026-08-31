import { githubFetch } from './client';
import { GitHubOrganization } from '../types/github';

export async function getUserOrganizations(token: string): Promise<GitHubOrganization[]> {
  try {
    const res = await githubFetch<GitHubOrganization[]>('/user/orgs?per_page=100', token);
    return res.data || [];
  } catch (err) {
    console.warn('Failed to fetch user organizations, continuing with empty org list', err);
    return [];
  }
}
