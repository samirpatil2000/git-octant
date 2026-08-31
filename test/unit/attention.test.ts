import { describe, it, expect } from 'vitest';
import { classifyAttentionItems, PRReviewAndCheckContext } from '../../src/lib/attention';
import { GitHubPullRequest, GitHubUser } from '../../src/types/github';

describe('classifyAttentionItems', () => {
  const me: GitHubUser = {
    login: 'samirpatil2000',
    id: 1,
    node_id: '',
    avatar_url: '',
    html_url: '',
    name: 'Samir',
    company: null,
    blog: null,
    location: null,
    email: null,
    bio: null,
    public_repos: 1,
  };

  const otherUser: GitHubUser = {
    ...me,
    login: 'alex-reviewer',
    id: 2,
  };

  it('detects review requested from current user', () => {
    const pr: GitHubPullRequest = {
      id: 101,
      node_id: '',
      html_url: 'https://github.com/Narkane/environment-sculptor/pull/91',
      number: 91,
      state: 'open',
      locked: false,
      title: 'Procedural mesh refactor',
      user: otherUser,
      body: '',
      created_at: '2026-08-31T10:00:00Z',
      updated_at: '2026-08-31T11:00:00Z',
      closed_at: null,
      merged_at: null,
      merge_commit_sha: null,
      requested_reviewers: [me],
      head: { label: '', ref: 'refactor', sha: 'sha1', user: otherUser, repo: null },
      base: { label: '', ref: 'main', sha: 'sha2', user: otherUser, repo: { full_name: 'Narkane/environment-sculptor' } as any },
      labels: [],
    };

    const items = classifyAttentionItems([{ pr }], me.login);
    expect(items).toHaveLength(1);
    expect(items[0].reason).toBe('review_requested');
    expect(items[0].repoName).toBe('environment-sculptor');
    expect(items[0].prNumber).toBe(91);
  });

  it('detects changes requested on user authored PR', () => {
    const pr: GitHubPullRequest = {
      id: 184,
      node_id: '',
      html_url: 'https://github.com/Narkane/viewer-template/pull/184',
      number: 184,
      state: 'open',
      locked: false,
      title: 'Dual track timeline dock',
      user: me,
      body: '',
      created_at: '2026-08-30T10:00:00Z',
      updated_at: '2026-08-31T09:00:00Z',
      closed_at: null,
      merged_at: null,
      merge_commit_sha: null,
      head: { label: '', ref: 'feat', sha: 'sha1', user: me, repo: null },
      base: { label: '', ref: 'main', sha: 'sha2', user: me, repo: { full_name: 'Narkane/viewer-template' } as any },
      labels: [],
    };

    const reviews = [
      {
        id: 1,
        user: otherUser,
        body: 'Please fix the timeline scrubber timing.',
        state: 'CHANGES_REQUESTED' as const,
        submitted_at: '2026-08-31T09:30:00Z',
        html_url: '',
      },
    ];

    const items = classifyAttentionItems([{ pr, reviews }], me.login);
    expect(items).toHaveLength(1);
    expect(items[0].reason).toBe('changes_requested');
    expect(items[0].details).toContain('@alex-reviewer');
  });

  it('detects failed CI checks on user PR', () => {
    const pr: GitHubPullRequest = {
      id: 42,
      node_id: '',
      html_url: 'https://github.com/samirpatil2000/website/pull/42',
      number: 42,
      state: 'open',
      locked: false,
      title: 'Dark mode improvements',
      user: me,
      body: '',
      created_at: '2026-08-31T08:00:00Z',
      updated_at: '2026-08-31T08:30:00Z',
      closed_at: null,
      merged_at: null,
      merge_commit_sha: null,
      head: { label: '', ref: 'fix/dark-mode', sha: 'sha123', user: me, repo: null },
      base: { label: '', ref: 'main', sha: 'sha0', user: me, repo: { full_name: 'samirpatil2000/website' } as any },
      labels: [],
    };

    const checks = [
      {
        id: 1,
        name: 'build-and-test',
        status: 'completed' as const,
        conclusion: 'failure' as const,
        html_url: '',
        started_at: '',
        completed_at: '',
      },
    ];

    const items = classifyAttentionItems([{ pr, checks }], me.login);
    expect(items).toHaveLength(1);
    expect(items[0].reason).toBe('checks_failing');
    expect(items[0].details).toContain('build-and-test');
  });
});
