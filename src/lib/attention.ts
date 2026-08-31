import { GitHubPullRequest, GitHubReview, GitHubCheckRun } from '../types/github';
import { AttentionItem } from '../types/app';

export interface PRReviewAndCheckContext {
  pr: GitHubPullRequest;
  reviews?: GitHubReview[];
  checks?: GitHubCheckRun[];
}

/**
 * Classifies pull requests that require the authenticated user's attention.
 * Evaluates review requests, review states (changes requested), CI check statuses,
 * merge conflicts, and readiness.
 */
export function classifyAttentionItems(
  pullRequests: PRReviewAndCheckContext[],
  currentUsername: string
): AttentionItem[] {
  const attentionItems: AttentionItem[] = [];
  const lowerUser = currentUsername.toLowerCase();

  for (const { pr, reviews = [], checks = [] } of pullRequests) {
    if (pr.state !== 'open') continue;

    const isAuthor = pr.user.login.toLowerCase() === lowerUser;
    const isReviewRequested = pr.requested_reviewers?.some(
      (r) => r.login.toLowerCase() === lowerUser
    );

    const [owner, name] = pr.base.repo?.full_name
      ? pr.base.repo.full_name.split('/')
      : [pr.user.login, 'repository'];

    const repoFullName = pr.base.repo?.full_name || `${owner}/${name}`;

    // 1. Review requested from current user
    if (isReviewRequested) {
      attentionItems.push({
        id: `att-review-req-${pr.id}`,
        reason: 'review_requested',
        reasonLabel: 'Review requested',
        prNumber: pr.number,
        prTitle: pr.title,
        repoName: name,
        repoFullName,
        owner,
        author: pr.user.login,
        authorAvatarUrl: pr.user.avatar_url,
        url: pr.html_url,
        updatedAt: pr.updated_at,
        details: `Requested by @${pr.user.login}`,
        badgeType: 'warning',
      });
      continue;
    }

    // 2. For PRs authored by current user:
    if (isAuthor) {
      // Check if changes were requested
      const latestReviewByReviewer = new Map<string, GitHubReview>();
      for (const rev of reviews) {
        if (rev.user && rev.user.login.toLowerCase() !== lowerUser) {
          latestReviewByReviewer.set(rev.user.login.toLowerCase(), rev);
        }
      }

      const hasChangesRequested = Array.from(latestReviewByReviewer.values()).some(
        (rev) => rev.state === 'CHANGES_REQUESTED'
      );

      if (hasChangesRequested) {
        const reviewerWithChanges = Array.from(latestReviewByReviewer.values()).find(
          (r) => r.state === 'CHANGES_REQUESTED'
        );
        attentionItems.push({
          id: `att-changes-req-${pr.id}`,
          reason: 'changes_requested',
          reasonLabel: 'Changes requested',
          prNumber: pr.number,
          prTitle: pr.title,
          repoName: name,
          repoFullName,
          owner,
          author: pr.user.login,
          authorAvatarUrl: pr.user.avatar_url,
          url: pr.html_url,
          updatedAt: pr.updated_at,
          details: reviewerWithChanges ? `Requested by @${reviewerWithChanges.user.login}` : undefined,
          badgeType: 'danger',
        });
        continue;
      }

      // Check for merge conflicts
      if (pr.mergeable === false || pr.mergeable_state === 'dirty') {
        attentionItems.push({
          id: `att-conflict-${pr.id}`,
          reason: 'merge_conflicts',
          reasonLabel: 'Merge conflict',
          prNumber: pr.number,
          prTitle: pr.title,
          repoName: name,
          repoFullName,
          owner,
          author: pr.user.login,
          authorAvatarUrl: pr.user.avatar_url,
          url: pr.html_url,
          updatedAt: pr.updated_at,
          details: 'Resolve conflicts before merging',
          badgeType: 'danger',
        });
        continue;
      }

      // Check for failed CI checks
      const hasFailedChecks = checks.some(
        (c) => c.conclusion === 'failure' || c.conclusion === 'timed_out' || c.conclusion === 'action_required'
      );

      if (hasFailedChecks) {
        const failedCheck = checks.find(
          (c) => c.conclusion === 'failure' || c.conclusion === 'timed_out'
        );
        attentionItems.push({
          id: `att-check-fail-${pr.id}`,
          reason: 'checks_failing',
          reasonLabel: 'Checks failing',
          prNumber: pr.number,
          prTitle: pr.title,
          repoName: name,
          repoFullName,
          owner,
          author: pr.user.login,
          authorAvatarUrl: pr.user.avatar_url,
          url: pr.html_url,
          updatedAt: pr.updated_at,
          details: failedCheck ? `Failed: ${failedCheck.name}` : 'One or more CI checks failed',
          badgeType: 'danger',
        });
        continue;
      }

      // Check if approved and ready to merge
      const isApproved = Array.from(latestReviewByReviewer.values()).some(
        (r) => r.state === 'APPROVED'
      );
      if (isApproved && !pr.draft && pr.mergeable === true) {
        attentionItems.push({
          id: `att-approved-${pr.id}`,
          reason: 'ready_to_merge',
          reasonLabel: 'Approved & ready to merge',
          prNumber: pr.number,
          prTitle: pr.title,
          repoName: name,
          repoFullName,
          owner,
          author: pr.user.login,
          authorAvatarUrl: pr.user.avatar_url,
          url: pr.html_url,
          updatedAt: pr.updated_at,
          details: 'All checks passed and approved',
          badgeType: 'success',
        });
        continue;
      }
    }
  }

  // Sort: Danger first, then Warning, then Info/Success, then newest
  const priorityOrder: Record<string, number> = {
    changes_requested: 1,
    merge_conflicts: 2,
    checks_failing: 3,
    review_requested: 4,
    ready_to_merge: 5,
    awaiting_approval: 6,
  };

  return attentionItems.sort((a, b) => {
    const pA = priorityOrder[a.reason] || 99;
    const pB = priorityOrder[b.reason] || 99;
    if (pA !== pB) return pA - pB;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}
