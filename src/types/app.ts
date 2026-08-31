import { GitHubOrganization, GitHubPullRequest, GitHubRepository, GitHubUser } from './github';

export interface PushedRepository {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  ownerAvatarUrl?: string;
  isOrg: boolean;
  visibility: 'public' | 'private' | 'internal';
  branch: string;
  latestCommitMessage: string;
  latestCommitSha: string;
  shortSha: string;
  pushedAt: string; // ISO string of user's push
  commitCount: number;
  language: string | null;
  repoUrl: string;
  commitUrl: string;
  branchUrl: string;
  defaultBranch?: string;
  openIssuesCount?: number;
  openPrCount?: number;
}

export type AttentionReason =
  | 'changes_requested'
  | 'review_requested'
  | 'checks_failing'
  | 'merge_conflicts'
  | 'awaiting_approval'
  | 'ready_to_merge';

export interface AttentionItem {
  id: string;
  reason: AttentionReason;
  reasonLabel: string;
  prNumber: number;
  prTitle: string;
  repoName: string;
  repoFullName: string;
  owner: string;
  author: string;
  authorAvatarUrl: string;
  url: string;
  updatedAt: string;
  details?: string;
  badgeType: 'danger' | 'warning' | 'info' | 'success';
}

export interface ActivityTimelineItem {
  id: string;
  type: 'push' | 'pr_opened' | 'pr_merged' | 'pr_closed' | 'review_submitted' | 'review_requested' | 'comment';
  typeLabel: string;
  title: string;
  repoName: string;
  repoFullName: string;
  ref?: string;
  timestamp: string;
  url: string;
  details?: string;
  badgeType: 'push' | 'pr' | 'review' | 'merge';
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: string; // ISO timestamp
  resetInMinutes: number;
  isLimited: boolean;
}

export interface UserSettings {
  token: string;
  username: string;
  theme: 'system' | 'light' | 'dark';
  enableNewTab: boolean;
  autoRefreshIntervalMinutes: number; // 0 to disable, or 5, 10, 15, 30
  selectedOrgFilter: string; // 'all' | 'personal' | orgName
  maxLatestRepos: number; // default 5
  showAttentionSection: boolean;
  showOpenPrsSection: boolean;
  showActivityTimeline: boolean;
  showRepoGrid: boolean;
  orgOrder?: string[]; // Array of organization logins in preferred order
}

export interface DashboardData {
  user: GitHubUser | null;
  organizations: GitHubOrganization[];
  latestPushes: PushedRepository[];
  attentionItems: AttentionItem[];
  myOpenPrs: GitHubPullRequest[];
  recentActivity: ActivityTimelineItem[];
  repositories: GitHubRepository[];
  lastSyncedAt: string | null;
  rateLimit: RateLimitInfo | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  isMockData?: boolean;
}
