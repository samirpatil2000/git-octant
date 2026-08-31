import { GitHubEvent, GitHubPushEventPayload, GitHubRepository } from '../types/github';
import { PushedRepository } from '../types/app';
import { cleanBranchName, truncateSha } from './formatters';

interface AggregatedPushEntry {
  repoFullName: string;
  pushedAtTime: number;
  pushedAtIso: string;
  event?: GitHubEvent;
  payload?: GitHubPushEventPayload;
  repoMeta?: GitHubRepository;
}

/**
 * Aggregates GitHub events and repository metadata to find the latest unique repositories
 * the user personally pushed to, strictly sorted by latest push timestamp (newest first).
 */
export function aggregateLatestPushes(
  events: GitHubEvent[],
  username: string,
  repoMetadataMap: Map<string, GitHubRepository> = new Map(),
  limit = 50
): PushedRepository[] {
  const repoPushMap = new Map<string, AggregatedPushEntry>();

  // 1. Process user PushEvents from event feed
  if (events && events.length > 0) {
    const userPushEvents = events.filter((event) => {
      if (event.type !== 'PushEvent') return false;
      if (!event.actor || !event.actor.login) return false;
      return event.actor.login.toLowerCase() === username.toLowerCase();
    });

    for (const event of userPushEvents) {
      const repoFullName = event.repo.name;
      const pushedAtTime = new Date(event.created_at).getTime();
      const payload = event.payload as GitHubPushEventPayload;
      const repoMeta = repoMetadataMap.get(repoFullName.toLowerCase());

      const existing = repoPushMap.get(repoFullName.toLowerCase());
      if (!existing || pushedAtTime > existing.pushedAtTime) {
        repoPushMap.set(repoFullName.toLowerCase(), {
          repoFullName,
          pushedAtTime,
          pushedAtIso: event.created_at,
          event,
          payload,
          repoMeta,
        });
      }
    }
  }

  // 2. Process real-time pushed_at from repository metadata as resilient fallback
  for (const [, repoMeta] of repoMetadataMap.entries()) {
    if (!repoMeta.pushed_at) continue;

    const isPersonal = repoMeta.owner?.login?.toLowerCase() === username.toLowerCase();
    const hasPushPermission = repoMeta.permissions?.push !== false;
    if (!isPersonal && !hasPushPermission) continue;

    const repoFullName = repoMeta.full_name;
    const pushedAtTime = new Date(repoMeta.pushed_at).getTime();
    if (isNaN(pushedAtTime)) continue;

    const existing = repoPushMap.get(repoFullName.toLowerCase());
    if (!existing) {
      repoPushMap.set(repoFullName.toLowerCase(), {
        repoFullName,
        pushedAtTime,
        pushedAtIso: repoMeta.pushed_at,
        repoMeta,
      });
    } else if (pushedAtTime > existing.pushedAtTime) {
      existing.pushedAtTime = pushedAtTime;
      existing.pushedAtIso = repoMeta.pushed_at;
      if (!existing.repoMeta) {
        existing.repoMeta = repoMeta;
      }
    }
  }

  // 3. Sort repositories strictly by push timestamp descending (newest first)
  const sortedEntries = Array.from(repoPushMap.values()).sort(
    (a, b) => b.pushedAtTime - a.pushedAtTime
  );

  // Take top `limit` entries
  const topEntries = limit ? sortedEntries.slice(0, limit) : sortedEntries;

  // 4. Map into rich PushedRepository domain objects
  return topEntries.map((entry) => {
    const { repoFullName, pushedAtIso, event, payload, repoMeta } = entry;
    const [owner, name] = repoFullName.includes('/')
      ? repoFullName.split('/')
      : [repoMeta?.owner?.login || username, repoFullName];

    const isOrg = !!event?.org || (repoMeta ? repoMeta.owner.type === 'Organization' : owner.toLowerCase() !== username.toLowerCase());

    const branch = cleanBranchName(payload?.ref || repoMeta?.default_branch || 'main');
    const commits = payload?.commits || [];
    const latestCommit = commits[commits.length - 1];

    let commitMessage = latestCommit?.message?.split('\n')[0];
    if (!commitMessage || commitMessage === 'Latest commit') {
      if (repoMeta?.description) {
        commitMessage = repoMeta.description;
      } else {
        commitMessage = `Pushed commits to ${branch}`;
      }
    }

    const commitSha = latestCommit?.sha || payload?.head || '';
    const repoUrl = repoMeta?.html_url || `https://github.com/${repoFullName}`;
    const branchUrl = `${repoUrl}/tree/${encodeURIComponent(branch)}`;
    const commitUrl = commitSha ? `${repoUrl}/commit/${commitSha}` : repoUrl;

    const visibility = repoMeta?.visibility || (repoMeta?.private ? 'private' : 'public');

    return {
      id: event?.repo?.id || repoMeta?.id || Math.random(),
      name,
      fullName: repoFullName,
      owner,
      ownerAvatarUrl: event?.org?.avatar_url || repoMeta?.owner.avatar_url || event?.actor?.avatar_url || '',
      isOrg,
      visibility,
      branch,
      latestCommitMessage: commitMessage,
      latestCommitSha: commitSha,
      shortSha: commitSha ? truncateSha(commitSha, 7) : '',
      pushedAt: pushedAtIso,
      commitCount: payload?.size || commits.length || 1,
      language: repoMeta?.language || null,
      repoUrl,
      commitUrl,
      branchUrl,
      defaultBranch: repoMeta?.default_branch || 'main',
      openIssuesCount: repoMeta?.open_issues_count,
    };
  });
}
