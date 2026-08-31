import React from 'react';
import { GitHubRepository } from '../types/github';
import {
  FolderGit2,
  Lock,
  Globe,
  GitPullRequest,
  AlertCircle,
  GitBranch,
  ExternalLink,
} from 'lucide-react';
import { formatRelativeTime, getLanguageColor } from '../lib/formatters';

interface RepoGridProps {
  repositories: GitHubRepository[];
}

export function RepoGrid({ repositories }: RepoGridProps) {
  if (repositories.length === 0) return null;

  const openUrl = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2 px-4">
        <div className="flex items-center gap-2">
          <h2 className="text-[11px] font-semibold tracking-wider text-fg-light-muted dark:text-fg-dark-muted uppercase">
            Active Repositories
          </h2>
          <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-surface-light-subtle dark:bg-surface-dark text-fg-light-subtle dark:text-fg-dark-subtle border border-border-light/60 dark:border-border-dark/60">
            {repositories.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 px-4">
        {repositories.slice(0, 8).map((repo) => {
          const langColor = getLanguageColor(repo.language);

          return (
            <div
              key={repo.id}
              onClick={() => openUrl(repo.html_url)}
              className="group p-3 rounded-xl border border-border-light/70 dark:border-border-dark/70 bg-surface-light dark:bg-surface-dark hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover hover:border-border-light dark:hover:border-border-dark/90 shadow-subtle hover:shadow-card dark:hover:shadow-card-dark transition-surface cursor-pointer"
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-semibold text-fg-light dark:text-fg-dark truncate group-hover:text-brand-500 transition-colors">
                    {repo.name}
                  </span>
                  {repo.private ? (
                    <Lock className="w-2.5 h-2.5 text-fg-light-subtle dark:text-fg-dark-subtle shrink-0" />
                  ) : (
                    <Globe className="w-2.5 h-2.5 text-fg-light-subtle dark:text-fg-dark-subtle shrink-0" />
                  )}
                </div>
                <span className="text-[10.5px] text-fg-light-subtle dark:text-fg-dark-subtle shrink-0">
                  {formatRelativeTime(repo.pushed_at || repo.updated_at)}
                </span>
              </div>

              <p className="text-[11px] text-fg-light-muted dark:text-fg-dark-muted line-clamp-1 mb-2 font-normal">
                {repo.description || `${repo.owner.login}/${repo.name}`}
              </p>

              <div className="flex items-center justify-between text-[10.5px] text-fg-light-subtle dark:text-fg-dark-subtle pt-1.5 border-t border-border-light/40 dark:border-border-dark/40">
                <div className="flex items-center gap-2">
                  {repo.language && (
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: langColor }} />
                      <span>{repo.language}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-0.5 font-mono">
                    <GitBranch className="w-2.5 h-2.5" />
                    <span>{repo.default_branch}</span>
                  </span>
                </div>

                {repo.open_issues_count > 0 && (
                  <span className="flex items-center gap-1 text-[10px]">
                    <AlertCircle className="w-2.5 h-2.5" />
                    <span>{repo.open_issues_count} issues</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
