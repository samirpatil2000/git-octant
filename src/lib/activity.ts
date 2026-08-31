import { GitHubEvent, GitHubPushEventPayload } from '../types/github';
import { ActivityTimelineItem } from '../types/app';
import { cleanBranchName } from './formatters';

/**
 * Transforms raw GitHub events into a clean developer activity timeline.
 */
export function generateActivityTimeline(
  events: GitHubEvent[],
  username: string,
  limit = 20
): ActivityTimelineItem[] {
  if (!events || events.length === 0) return [];

  const lowerUser = username.toLowerCase();
  const timeline: ActivityTimelineItem[] = [];

  for (const event of events) {
    if (!event.actor || event.actor.login.toLowerCase() !== lowerUser) {
      continue;
    }

    const repoFullName = event.repo.name;
    const [_, repoName] = repoFullName.includes('/')
      ? repoFullName.split('/')
      : [event.actor.login, repoFullName];

    const timestamp = event.created_at;

    switch (event.type) {
      case 'PushEvent': {
        const payload = event.payload as GitHubPushEventPayload;
        const commitCount = payload.size || payload.commits?.length || 1;
        const branch = cleanBranchName(payload.ref || 'main');
        const commitMsg = payload.commits?.[0]?.message?.split('\n')[0];

        timeline.push({
          id: `act-push-${event.id}`,
          type: 'push',
          typeLabel: 'Pushed',
          title: `Pushed ${commitCount} ${commitCount === 1 ? 'commit' : 'commits'}`,
          repoName,
          repoFullName,
          ref: branch,
          timestamp,
          url: `https://github.com/${repoFullName}/tree/${encodeURIComponent(branch)}`,
          details: commitMsg,
          badgeType: 'push',
        });
        break;
      }

      case 'PullRequestEvent': {
        const payload = event.payload;
        const pr = payload.pull_request;
        if (!pr) break;

        const action = payload.action;
        let type: ActivityTimelineItem['type'] = 'pr_opened';
        let typeLabel = 'Opened';
        let badgeType: ActivityTimelineItem['badgeType'] = 'pr';

        if (action === 'closed') {
          if (pr.merged) {
            type = 'pr_merged';
            typeLabel = 'Merged';
            badgeType = 'merge';
          } else {
            type = 'pr_closed';
            typeLabel = 'Closed';
            badgeType = 'pr';
          }
        } else if (action === 'opened' || action === 'reopened') {
          type = 'pr_opened';
          typeLabel = action === 'opened' ? 'Opened' : 'Reopened';
          badgeType = 'pr';
        } else if (action === 'review_requested') {
          type = 'review_requested';
          typeLabel = 'Requested review';
          badgeType = 'review';
        }

        timeline.push({
          id: `act-pr-${event.id}`,
          type,
          typeLabel,
          title: `#${pr.number} ${pr.title}`,
          repoName,
          repoFullName,
          ref: `#${pr.number}`,
          timestamp,
          url: pr.html_url,
          details: pr.title,
          badgeType,
        });
        break;
      }

      case 'PullRequestReviewEvent': {
        const payload = event.payload;
        const review = payload.review;
        const pr = payload.pull_request;
        if (!review || !pr) break;

        let typeLabel = 'Reviewed';
        if (review.state === 'APPROVED') typeLabel = 'Approved';
        else if (review.state === 'CHANGES_REQUESTED') typeLabel = 'Changes requested';
        else if (review.state === 'COMMENTED') typeLabel = 'Review comment';

        timeline.push({
          id: `act-review-${event.id}`,
          type: 'review_submitted',
          typeLabel,
          title: `#${pr.number} ${pr.title}`,
          repoName,
          repoFullName,
          ref: `#${pr.number}`,
          timestamp,
          url: review.html_url || pr.html_url,
          details: review.body || undefined,
          badgeType: 'review',
        });
        break;
      }

      case 'PullRequestReviewCommentEvent': {
        const payload = event.payload;
        const pr = payload.pull_request;
        const comment = payload.comment;
        if (!pr || !comment) break;

        timeline.push({
          id: `act-pr-comment-${event.id}`,
          type: 'comment',
          typeLabel: 'Commented',
          title: `#${pr.number} ${pr.title}`,
          repoName,
          repoFullName,
          ref: `#${pr.number}`,
          timestamp,
          url: comment.html_url || pr.html_url,
          details: comment.body?.slice(0, 100),
          badgeType: 'review',
        });
        break;
      }

      default:
        break;
    }
  }

  // Sort newest first
  return timeline
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}
