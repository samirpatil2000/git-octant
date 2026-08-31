import React from 'react';
import { AttentionItem } from '../types/app';
import {
  AlertCircle,
  Eye,
  XCircle,
  GitMerge,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { formatRelativeTime } from '../lib/formatters';
import { EmptyState } from './EmptyState';

interface AttentionSectionProps {
  items: AttentionItem[];
}

export function AttentionSection({ items }: AttentionSectionProps) {
  if (items.length === 0) {
    return (
      <section className="mb-6">
        <div className="flex items-center justify-between mb-2 px-4">
          <h2 className="text-[11px] font-semibold tracking-wider text-fg-light-muted dark:text-fg-dark-muted uppercase">
            Needs Your Attention
          </h2>
        </div>
        <div className="px-4">
          <EmptyState
            variant="attention"
            title="You're all caught up"
            description="No open pull requests require your immediate action."
          />
        </div>
      </section>
    );
  }

  const openUrl = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getReasonConfig = (reason: AttentionItem['reason']) => {
    switch (reason) {
      case 'changes_requested':
        return {
          icon: AlertCircle,
          dotColor: 'bg-rose-500',
          badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        };
      case 'checks_failing':
        return {
          icon: XCircle,
          dotColor: 'bg-rose-500',
          badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        };
      case 'merge_conflicts':
        return {
          icon: GitMerge,
          dotColor: 'bg-rose-500',
          badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        };
      case 'review_requested':
        return {
          icon: Eye,
          dotColor: 'bg-amber-500',
          badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        };
      case 'ready_to_merge':
        return {
          icon: CheckCircle,
          dotColor: 'bg-emerald-500',
          badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        };
      default:
        return {
          icon: AlertCircle,
          dotColor: 'bg-brand-500',
          badgeBg: 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/20',
        };
    }
  };

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2 px-4">
        <div className="flex items-center gap-2">
          <h2 className="text-[11px] font-semibold tracking-wider text-fg-light-muted dark:text-fg-dark-muted uppercase">
            Needs Your Attention
          </h2>
          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            {items.length}
          </span>
        </div>
      </div>

      <div className="space-y-1.5 px-4">
        {items.map((item) => {
          const config = getReasonConfig(item.reason);
          const Icon = config.icon;

          return (
            <div
              key={item.id}
              onClick={() => openUrl(item.url)}
              className="group relative p-3 rounded-xl border border-border-light/70 dark:border-border-dark/70 bg-surface-light dark:bg-surface-dark hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover hover:border-border-light dark:hover:border-border-dark/90 shadow-subtle hover:shadow-card dark:hover:shadow-card-dark transition-surface cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="mt-0.5 shrink-0">
                    <span className={`inline-block w-2 h-2 rounded-full ${config.dotColor}`} />
                  </div>

                  <div className="min-w-0">
                    {/* Reason Tag & Repo / PR number */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${config.badgeBg}`}
                      >
                        {item.reasonLabel}
                      </span>
                      <span className="text-xs font-semibold text-fg-light dark:text-fg-dark truncate">
                        {item.repoName}{' '}
                        <span className="font-mono text-fg-light-subtle dark:text-fg-dark-subtle font-normal">
                          #{item.prNumber}
                        </span>
                      </span>
                    </div>

                    {/* PR Title */}
                    <p className="text-xs text-fg-light-muted dark:text-fg-dark-muted line-clamp-1 group-hover:text-fg-light dark:group-hover:text-fg-dark transition-colors">
                      {item.prTitle}
                    </p>

                    {/* Details subtitle */}
                    {item.details && (
                      <p className="text-[10.5px] text-fg-light-subtle dark:text-fg-dark-subtle mt-0.5">
                        {item.details}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 text-right">
                  <span className="text-[10.5px] text-fg-light-subtle dark:text-fg-dark-subtle">
                    {formatRelativeTime(item.updatedAt)}
                  </span>
                  <ExternalLink className="w-3 h-3 text-fg-light-subtle dark:text-fg-dark-subtle opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
