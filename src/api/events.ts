import { githubFetch } from './client';
import { GitHubEvent } from '../types/github';

export async function getUserEvents(
  username: string,
  token?: string,
  perPage = 100
): Promise<GitHubEvent[]> {
  const events: GitHubEvent[] = [];
  const seenIds = new Set<string>();

  // 1. Fetch user events endpoint (includes private repos when token provided)
  if (token) {
    try {
      const authRes = await githubFetch<GitHubEvent[]>(
        `/users/${encodeURIComponent(username)}/events?per_page=${perPage}`,
        token
      );
      if (Array.isArray(authRes.data)) {
        for (const ev of authRes.data) {
          if (!seenIds.has(ev.id)) {
            seenIds.add(ev.id);
            events.push(ev);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch /users/:username/events', err);
    }
  } else {
    // Unauthenticated public events fallback
    try {
      const pubRes = await githubFetch<GitHubEvent[]>(
        `/users/${encodeURIComponent(username)}/events/public?per_page=${perPage}`
      );
      if (Array.isArray(pubRes.data)) {
        events.push(...pubRes.data);
      }
    } catch (err) {
      console.warn('Failed to fetch public events', err);
    }
  }

  // Sort by event created_at descending
  return events.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}
