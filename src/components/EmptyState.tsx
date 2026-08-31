import React from 'react';
import { LucideIcon, GitCommit, CheckCircle2, GitPullRequest, Search } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  variant?: 'pushes' | 'attention' | 'prs' | 'search' | 'default';
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  variant = 'default',
}: EmptyStateProps) {
  let DefaultIcon = Icon || GitCommit;

  if (variant === 'attention') {
    DefaultIcon = CheckCircle2;
  } else if (variant === 'prs') {
    DefaultIcon = GitPullRequest;
  } else if (variant === 'search') {
    DefaultIcon = Search;
  }

  return (
    <div className="py-8 px-4 text-center rounded-xl border border-dashed border-border-light dark:border-border-dark/80 bg-surface-light-hover/30 dark:bg-surface-dark-subtle/20 flex flex-col items-center justify-center">
      <div className="w-10 h-10 rounded-full bg-surface-light-subtle dark:bg-surface-dark flex items-center justify-center text-fg-light-muted dark:text-fg-dark-muted mb-3 shadow-subtle">
        <DefaultIcon className="w-5 h-5 opacity-80" />
      </div>
      <h4 className="text-xs font-semibold text-fg-light dark:text-fg-dark mb-1 tracking-tight">
        {title}
      </h4>
      <p className="text-xs text-fg-light-muted dark:text-fg-dark-muted max-w-xs leading-relaxed whitespace-pre-line">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-3 text-xs font-medium text-brand-500 hover:text-brand-600 dark:text-brand-500 dark:hover:text-brand-400 transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
