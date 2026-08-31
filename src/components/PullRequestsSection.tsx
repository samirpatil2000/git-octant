import React from 'react';
import { GitHubPullRequest } from '../types/github';
import {
  GitPullRequest,
  GitBranch,
  MessageSquare,
  FileCode,
  Tag,
  Building2,
  User,
} from 'lucide-react';
import { formatRelativeTime } from '../lib/formatters';
import { EmptyState } from './EmptyState';

interface PullRequestsSectionProps {
  prs: GitHubPullRequest[];
}

export function PullRequestsSection({ prs }: PullRequestsSectionProps) {
  if (prs.length === 0) {
    return (
      <section className="mb-6">
        <div className="flex items-center justify-between mb-2 px-4">
          <h2 className="text-[11px] font-semibold tracking-wider text-fg-light-muted dark:text-fg-dark-muted uppercase">
            My Open Pull Requests
          </h2>
        </div>
        <div className="px-4">
          <EmptyState
            variant="prs"
            title="No open pull requests"
            description="You don't have any active pull requests authored by you."
          />
        </div>
      </section>
    );
  }

  const openUrl = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2 px-4">
        <div className="flex items-center gap-2">
          <h2 className="text-[11px] font-semibold tracking-wider text-fg-light-muted dark:text-fg-dark-muted uppercase">
            My Open Pull Requests
          </h2>
          <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-surface-light-subtle dark:bg-surface-dark text-fg-light-subtle dark:text-fg-dark-subtle border border-border-light/60 dark:border-border-dark/60">
            {prs.length}
          </span>
        </div>
      </div>

      <div className="space-y-1.5 px-4">
        {prs.map((pr) => {
          const repoName = pr.base.repo?.name || 'repository';
          const repoOwner = pr.base.repo?.owner.login || pr.user.login;
          const isOrg = pr.base.repo?.owner.type === 'Organization';

          return (
            <div
              key={pr.id}
              onClick={() => openUrl(pr.html_url)}
              className="group relative p-3 rounded-xl border border-border-light/70 dark:border-border-dark/70 bg-surface-light dark:bg-surface-dark hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover hover:border-border-light dark:hover:border-border-dark/90 shadow-subtle hover:shadow-card dark:hover:shadow-card-dark transition-surface cursor-pointer"
            >
              {/* Top Row: Owner/Repo + PR# + Draft badge + Updated time */}
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-fg-light-muted dark:text-fg-dark-muted">
                    {isOrg ? (
                      <Building2 className="w-3 h-3 opacity-70" />
                    ) : (
                      <User className="w-3 h-3 opacity-70" />
                    )}
                    <span className="truncate">{repoOwner}</span>
                    <span className="opacity-40">/</span>
                  </span>

                  <span className="text-xs font-semibold text-fg-light dark:text-fg-dark truncate">
                    {repoName}
                  </span>

                  <span className="font-mono text-xs text-fg-light-subtle dark:text-fg-dark-subtle">
                    #{pr.number}
                  </span>

                  {pr.draft && (
                    <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-surface-light-subtle dark:bg-surface-dark text-fg-light-subtle dark:text-fg-dark-subtle border border-border-light dark:border-border-dark">
                      Draft
                    </span>
                  )}
                </div>

                <span className="text-[11px] font-medium text-fg-light-subtle dark:text-fg-dark-subtle shrink-0">
                  {formatRelativeTime(pr.updated_at)}
                </span>
              </div>

              {/* Title */}
              <p className="text-xs font-normal text-fg-light dark:text-fg-dark group-hover:text-brand-500 transition-colors line-clamp-1 mb-2">
                {pr.title}
              </p>

              {/* Bottom metadata: branch path, comments, changes, labels */}
              <div className="flex items-center justify-between gap-2 text-[11px] pt-1.5 border-t border-border-light/40 dark:border-border-dark/40">
                {/* Branch path: base <- head */}
                <div className="flex items-center gap-1.5 text-fg-light-muted dark:text-fg-dark-muted font-mono text-[10px] min-w-0 truncate">
                  <span className="px-1 py-0.2 rounded bg-surface-light-subtle dark:bg-surface-dark border border-border-light/50 dark:border-border-dark/50 truncate max-w-[90px]">
                    {pr.base.ref}
                  </span>
                  <span className="text-fg-light-subtle dark:text-fg-dark-subtle">←</span>
                  <span className="px-1 py-0.2 rounded bg-surface-light-subtle dark:bg-surface-dark border border-border-light/50 dark:border-border-dark/50 truncate max-w-[120px]">
                    {pr.head.ref}
                  </span>
                </div>

                {/* Right stats: comments + diff stats + labels */}
                <div className="flex items-center gap-2.5 shrink-0 text-fg-light-subtle dark:text-fg-dark-subtle">
                  {typeof pr.comments === 'number' && pr.comments > 0 && (
                    <span className="flex items-center gap-1 text-[10.5px]">
                      <MessageSquare className="w-3 h-3" />
                      {pr.comments}
                    </span>
                  )}

                  {typeof pr.changed_files === 'number' && pr.changed_files > 0 && (
                    <span className="flex items-center gap-1 text-[10.5px]">
                      <FileCode className="w-3 h-3" />
                      {pr.changed_files} files
                    </span>
                  )}

                  {pr.labels && pr.labels.length > 0 && (
                    <div className="flex items-center gap-1">
                      {pr.labels.slice(0, 2).map((l) => (
                        <span
                          key={l.id}
                          className="px-1.5 py-0.2 rounded text-[9.5px] font-medium"
                          style={{
                            backgroundColor: `#${l.color}20`,
                            color: `#${l.color}`,
                            border: `1px solid #${l.color}40`,
                          }}
                        >
                          {l.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
