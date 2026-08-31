export interface GitHubUser {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  html_url: string;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  bio: string | null;
  public_repos: number;
  total_private_repos?: number;
  owned_private_repos?: number;
  disk_usage?: number;
  collaborators?: number;
}

export interface GitHubOrganization {
  login: string;
  id: number;
  node_id: string;
  url: string;
  avatar_url: string;
  description: string | null;
}

export interface GitHubRepository {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  private: boolean;
  owner: {
    login: string;
    id: number;
    avatar_url: string;
    type: 'User' | 'Organization';
  };
  html_url: string;
  description: string | null;
  fork: boolean;
  url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  has_issues: boolean;
  has_projects: boolean;
  has_downloads: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  forks_count: number;
  archived: boolean;
  disabled: boolean;
  open_issues_count: number;
  default_branch: string;
  visibility?: 'public' | 'private' | 'internal';
  permissions?: {
    admin: boolean;
    maintain?: boolean;
    push: boolean;
    triage?: boolean;
    pull: boolean;
  };
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  url: string;
  html_url?: string;
  distinct?: boolean;
}

export interface GitHubPushEventPayload {
  push_id: number;
  size: number;
  distinct_size: number;
  ref: string; // e.g. "refs/heads/main" or "refs/heads/feature/xyz"
  head: string;
  before: string;
  commits: Array<{
    sha: string;
    author: {
      email: string;
      name: string;
    };
    message: string;
    distinct: boolean;
    url: string;
  }>;
}

export interface GitHubPullRequestEventPayload {
  action: 'opened' | 'closed' | 'reopened' | 'assigned' | 'unassigned' | 'review_requested' | 'review_request_removed' | 'labeled' | 'unlabeled' | 'synchronize';
  number: number;
  pull_request: GitHubPullRequest;
}

export interface GitHubPullRequestReviewEventPayload {
  action: 'submitted' | 'edited' | 'dismissed';
  pull_request: GitHubPullRequest;
  review: {
    id: number;
    user: GitHubUser;
    body: string | null;
    commit_id: string;
    submitted_at: string;
    state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED';
    html_url: string;
  };
}

export interface GitHubEvent {
  id: string;
  type: 'PushEvent' | 'PullRequestEvent' | 'PullRequestReviewEvent' | 'PullRequestReviewCommentEvent' | 'IssuesEvent' | 'IssueCommentEvent' | 'CreateEvent' | 'DeleteEvent' | 'WatchEvent' | 'ForkEvent' | string;
  actor: {
    id: number;
    login: string;
    display_login?: string;
    avatar_url: string;
  };
  repo: {
    id: number;
    name: string; // e.g. "samirpatil2000/website" or "Narkane/environment-sculptor"
    url: string;
  };
  payload: any;
  public: boolean;
  created_at: string;
  org?: {
    id: number;
    login: string;
    avatar_url: string;
  };
}

export interface GitHubPullRequest {
  id: number;
  node_id: string;
  html_url: string;
  number: number;
  state: 'open' | 'closed';
  locked: boolean;
  title: string;
  user: GitHubUser;
  body: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  merge_commit_sha: string | null;
  draft?: boolean;
  head: {
    label: string;
    ref: string;
    sha: string;
    user: GitHubUser;
    repo: GitHubRepository | null;
  };
  base: {
    label: string;
    ref: string;
    sha: string;
    user: GitHubUser;
    repo: GitHubRepository;
  };
  labels: Array<{
    id: number;
    name: string;
    color: string;
    description: string | null;
  }>;
  requested_reviewers?: GitHubUser[];
  comments?: number;
  review_comments?: number;
  commits?: number;
  additions?: number;
  deletions?: number;
  changed_files?: number;
  mergeable?: boolean | null;
  mergeable_state?: string;
}

export interface GitHubCheckRun {
  id: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'timed_out' | 'action_required' | 'skipped' | null;
  html_url: string;
  started_at: string;
  completed_at: string | null;
}

export interface GitHubReview {
  id: number;
  user: GitHubUser;
  body: string | null;
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED' | 'PENDING';
  submitted_at: string;
  html_url: string;
}
