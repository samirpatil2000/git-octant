import { GitHubEvent, GitHubPushEventPayload, GitHubRepository } from '../types/github';
import { PushedRepository } from '../types/app';
import { cleanBranchName, truncateSha } from './formatters';

/**
 * Aggregates GitHub events to find the latest unique repositories the authenticated user
 * personally pushed to, strictly sorted by the user's latest push timestamp (newest first).
 */
export function aggregateLatestPushes(
  events: GitHubEvent[],
  username: string,
  repoMetadataMap: Map<string, GitHubRepository> = new Map(),
  limit = 5
): PushedRepository[] {
  if (!events || events.length === 0) {
    return [];
  }

  // Filter only PushEvents by this user
  const userPushEvents = events.filter((event) => {
    if (event.type !== 'PushEvent') return false;
    if (!event.actor || !event.actor.login) return false;
    // Actor must match the authenticated username (case-insensitive)
    return event.actor.login.toLowerCase() === username.toLowerCase();
  });

  // Track the most recent push per repository
  // Key: repo full_name (e.g. "Narkane/environment-sculptor")
  const repoPushMap = new Map<string, {
    event: GitHubEvent;
    payload: GitHubPushEventPayload;
    pushedAtTime: number;
  }>();

  for (const event of userPushEvents) {
    const repoFullName = event.repo.name;
    const pushedAtTime = new Date(event.created_at).getTime();
    const payload = event.payload as GitHubPushEventPayload;

    const existing = repoPushMap.get(repoFullName);
    if (!existing || pushedAtTime > existing.pushedAtTime) {
      repoPushMap.set(repoFullName, {
        event,
        payload,
        pushedAtTime,
      });
    }
  }

  // Sort repositories strictly by push timestamp descending (newest first)
  const sortedEntries = Array.from(repoPushMap.entries()).sort(
    (a, b) => b[1].pushedAtTime - a[1].pushedAtTime
  );

  // Take top `limit` entries (default 5)
  const topEntries = sortedEntries.slice(0, limit);

  // Map into rich PushedRepository domain objects
  return topEntries.map(([repoFullName, { event, payload }]) => {
    const [owner, name] = repoFullName.includes('/')
      ? repoFullName.split('/')
      : [event.actor.login, repoFullName];

    const repoMeta = repoMetadataMap.get(repoFullName.toLowerCase());
    const isOrg = !!event.org || (repoMeta ? repoMeta.owner.type === 'Organization' : owner.toLowerCase() !== username.toLowerCase());

    const branch = cleanBranchName(payload.ref || 'main');
    const commits = payload.commits || [];
    const latestCommit = commits[commits.length - 1];

    let commitMessage = latestCommit?.message?.split('\n')[0];
    if (!commitMessage || commitMessage === 'Latest commit') {
      if (repoMeta?.description) {
        commitMessage = repoMeta.description;
      } else {
        commitMessage = `Pushed commits to ${branch}`;
      }
    }

    const commitSha = latestCommit?.sha || payload.head || '';
    const repoUrl = repoMeta?.html_url || `https://github.com/${repoFullName}`;
    const branchUrl = `${repoUrl}/tree/${encodeURIComponent(branch)}`;
    const commitUrl = commitSha ? `${repoUrl}/commit/${commitSha}` : repoUrl;

    const visibility = repoMeta?.visibility || (repoMeta?.private ? 'private' : 'public');

    return {
      id: event.repo.id || repoMeta?.id || Math.random(),
      name,
      fullName: repoFullName,
      owner,
      ownerAvatarUrl: event.org?.avatar_url || repoMeta?.owner.avatar_url || event.actor.avatar_url,
      isOrg,
      visibility,
      branch,
      latestCommitMessage: commitMessage,
      latestCommitSha: commitSha,
      shortSha: truncateSha(commitSha, 7),
      pushedAt: event.created_at,
      commitCount: payload.size || commits.length || 1,
      language: repoMeta?.language || null,
      repoUrl,
      commitUrl,
      branchUrl,
      defaultBranch: repoMeta?.default_branch || 'main',
      openIssuesCount: repoMeta?.open_issues_count,
    };
  });
}
