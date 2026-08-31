import React from 'react';
import { ActivityTimelineItem } from '../types/app';
import {
  GitCommit,
  GitPullRequest,
  CheckCircle,
  GitMerge,
  Eye,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';
import { formatTimeOfDay } from '../lib/formatters';
import { EmptyState } from './EmptyState';

interface ActivityTimelineProps {
  activities: ActivityTimelineItem[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <section className="mb-6">
        <div className="flex items-center justify-between mb-2 px-4">
          <h2 className="text-[11px] font-semibold tracking-wider text-fg-light-muted dark:text-fg-dark-muted uppercase">
            Recent Activity
          </h2>
        </div>
        <div className="px-4">
          <EmptyState
            title="No recent activity"
            description="Your recent GitHub actions will be recorded here."
          />
        </div>
      </section>
    );
  }

  const openUrl = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const todayStr = new Date().toDateString();
  const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const yesterdayStr = yesterdayDate.toDateString();

  const groups: { label: string; items: ActivityTimelineItem[] }[] = [];
  const todayItems: ActivityTimelineItem[] = [];
  const yesterdayItems: ActivityTimelineItem[] = [];
  const earlierItems: ActivityTimelineItem[] = [];

  for (const act of activities) {
    const actDate = new Date(act.timestamp).toDateString();
    if (actDate === todayStr) {
      todayItems.push(act);
    } else if (actDate === yesterdayStr) {
      yesterdayItems.push(act);
    } else {
      earlierItems.push(act);
    }
  }

  if (todayItems.length > 0) groups.push({ label: 'Today', items: todayItems });
  if (yesterdayItems.length > 0) groups.push({ label: 'Yesterday', items: yesterdayItems });
  if (earlierItems.length > 0) groups.push({ label: 'Earlier', items: earlierItems });

  const getBadgeIcon = (type: ActivityTimelineItem['type']) => {
    switch (type) {
      case 'push':
        return <GitCommit className="w-3.5 h-3.5 text-brand-500" />;
      case 'pr_opened':
        return <GitPullRequest className="w-3.5 h-3.5 text-brand-500" />;
      case 'pr_merged':
        return <GitMerge className="w-3.5 h-3.5 text-purple-500" />;
      case 'review_submitted':
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />;
      case 'review_requested':
        return <Eye className="w-3.5 h-3.5 text-amber-500" />;
      case 'comment':
        return <MessageSquare className="w-3.5 h-3.5 text-fg-light-muted dark:text-fg-dark-muted" />;
      default:
        return <GitCommit className="w-3.5 h-3.5 text-fg-light-muted" />;
    }
  };

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2 px-4">
        <h2 className="text-[11px] font-semibold tracking-wider text-fg-light-muted dark:text-fg-dark-muted uppercase">
          Recent PR & Push Activity
        </h2>
      </div>

      <div className="space-y-4 px-4">
        {groups.map((group) => (
          <div key={group.label} className="space-y-1.5">
            <h3 className="text-[10px] font-bold tracking-wider text-fg-light-subtle dark:text-fg-dark-subtle uppercase px-1">
              {group.label}
            </h3>

            <div className="rounded-xl border border-border-light/70 dark:border-border-dark/70 bg-surface-light dark:bg-surface-dark divide-y divide-border-light/40 dark:divide-border-dark/40 shadow-subtle overflow-hidden">
              {group.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => openUrl(item.url)}
                  className="group p-2.5 flex items-center justify-between gap-2.5 hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover transition-surface cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="font-mono text-[10px] text-fg-light-subtle dark:text-fg-dark-subtle shrink-0 w-9">
                      {formatTimeOfDay(item.timestamp)}
                    </span>

                    <div className="p-1 rounded-md bg-surface-light-subtle dark:bg-surface-dark border border-border-light/60 dark:border-border-dark/60 shrink-0">
                      {getBadgeIcon(item.type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-fg-light dark:text-fg-dark shrink-0">
                          {item.typeLabel}
                        </span>
                        <span className="text-xs text-fg-light-muted dark:text-fg-dark-muted truncate">
                          {item.title}
                        </span>
                      </div>
                      {item.details && (
                        <p className="text-[10.5px] text-fg-light-subtle dark:text-fg-dark-subtle truncate max-w-sm mt-0.5">
                          {item.details}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] font-medium text-fg-light-muted dark:text-fg-dark-muted px-1.5 py-0.5 rounded bg-surface-light-subtle dark:bg-surface-dark border border-border-light/50 dark:border-border-dark/50 max-w-[120px] truncate">
                      {item.repoName}
                    </span>
                    <ExternalLink className="w-3 h-3 text-fg-light-subtle dark:text-fg-dark-subtle opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
