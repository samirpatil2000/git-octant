import { describe, it, expect } from 'vitest';
import { aggregateLatestPushes } from '../../src/lib/push-aggregator';
import { GitHubEvent, GitHubRepository } from '../../src/types/github';

describe('aggregateLatestPushes', () => {
  it('deduplicates repositories and strictly sorts newest-first by personal push timestamp', () => {
    const user = 'samirpatil2000';

    // Sequence from prompt requirement:
    // repo-a 10:00
    // repo-a 10:15
    // repo-b 10:20
    // repo-c 10:25
    // repo-a 10:40
    // repo-d 10:45
    // repo-e 10:50
    const makePushEvent = (id: string, repo: string, time: string, msg: string, branch = 'main'): GitHubEvent => ({
      id,
      type: 'PushEvent',
      actor: { id: 1, login: user, avatar_url: '' },
      repo: { id: 10, name: repo, url: '' },
      payload: {
        push_id: parseInt(id),
        size: 1,
        distinct_size: 1,
        ref: `refs/heads/${branch}`,
        head: 'sha1234567890',
        before: 'sha0000000000',
        commits: [
          {
            sha: 'sha1234567890',
            author: { name: user, email: 'test@example.com' },
            message: msg,
            distinct: true,
            url: '',
          },
        ],
      },
      public: true,
      created_at: time,
    });

    const events: GitHubEvent[] = [
      makePushEvent('1', 'samirpatil2000/repo-a', '2026-08-31T10:00:00Z', 'Commit 1'),
      makePushEvent('2', 'samirpatil2000/repo-a', '2026-08-31T10:15:00Z', 'Commit 2'),
      makePushEvent('3', 'Narkane/repo-b', '2026-08-31T10:20:00Z', 'Commit 3'),
      makePushEvent('4', 'Acme/repo-c', '2026-08-31T10:25:00Z', 'Commit 4'),
      makePushEvent('5', 'samirpatil2000/repo-a', '2026-08-31T10:40:00Z', 'Commit 5'),
      makePushEvent('6', 'Narkane/repo-d', '2026-08-31T10:45:00Z', 'Commit 6'),
      makePushEvent('7', 'Narkane/repo-e', '2026-08-31T10:50:00Z', 'Commit 7'),
    ];

    const result = aggregateLatestPushes(events, user);

    expect(result).toHaveLength(5);
    expect(result.map((r) => r.name)).toEqual([
      'repo-e', // 10:50
      'repo-d', // 10:45
      'repo-a', // 10:40
      'repo-c', // 10:25
      'repo-b', // 10:20
    ]);
  });

  it('ignores pushes made by other users', () => {
    const user = 'samirpatil2000';

    const events: GitHubEvent[] = [
      {
        id: '1',
        type: 'PushEvent',
        actor: { id: 99, login: 'other-user', avatar_url: '' },
        repo: { id: 1, name: 'org/repo-other', url: '' },
        payload: { ref: 'refs/heads/main', commits: [] },
        public: true,
        created_at: '2026-08-31T12:00:00Z',
      },
      {
        id: '2',
        type: 'PushEvent',
        actor: { id: 1, login: user, avatar_url: '' },
        repo: { id: 2, name: 'org/repo-mine', url: '' },
        payload: { ref: 'refs/heads/feature', head: 'abc1234567', commits: [{ message: 'My commit' }] },
        public: true,
        created_at: '2026-08-31T11:00:00Z',
      },
    ];

    const result = aggregateLatestPushes(events, user);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('repo-mine');
    expect(result[0].branch).toBe('feature');
    expect(result[0].shortSha).toBe('abc1234');
  });
});
