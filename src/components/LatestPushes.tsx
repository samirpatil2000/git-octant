import React from 'react';
import { PushedRepository } from '../types/app';
import {
  GitBranch,
  GitCommit,
  Lock,
  Globe,
  ExternalLink,
  Building2,
  User,
} from 'lucide-react';
import { formatRelativeTime, getLanguageColor } from '../lib/formatters';
import { EmptyState } from './EmptyState';

interface LatestPushesProps {
  pushes: PushedRepository[];
  isLoading?: boolean;
}

export function LatestPushes({ pushes, isLoading }: LatestPushesProps) {
  if (pushes.length === 0 && !isLoading) {
    return (
      <section className="mb-6">
        <div className="flex items-center justify-between mb-2.5 px-4">
          <h2 className="text-[11px] font-semibold tracking-wider text-fg-light-muted dark:text-fg-dark-muted uppercase">
            Latest Pushes
          </h2>
        </div>
        <div className="px-4">
          <EmptyState
            variant="pushes"
            title="Nothing to show yet"
            description={`Once you push to a GitHub repository,\nyour latest activity will appear here.`}
          />
        </div>
      </section>
    );
  }

  const openUrl = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2 px-4">
        <div className="flex items-center gap-2">
          <h2 className="text-[11px] font-semibold tracking-wider text-fg-light-muted dark:text-fg-dark-muted uppercase">
            Latest Pushes
          </h2>
          <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-surface-light-subtle dark:bg-surface-dark text-fg-light-subtle dark:text-fg-dark-subtle border border-border-light/60 dark:border-border-dark/60">
            Top {pushes.length}
          </span>
        </div>
        <span className="text-[10.5px] text-fg-light-subtle dark:text-fg-dark-subtle">
          Personal push activity
        </span>
      </div>

      <div className="space-y-1.5 px-4">
        {pushes.map((repo) => {
          const langColor = getLanguageColor(repo.language);

          return (
            <div
              key={repo.fullName}
              onClick={(e) => openUrl(e, repo.repoUrl)}
              className="group relative p-3 rounded-xl border border-border-light/70 dark:border-border-dark/70 bg-surface-light dark:bg-surface-dark hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover hover:border-border-light dark:hover:border-border-dark/90 shadow-subtle hover:shadow-card dark:hover:shadow-card-dark transition-surface cursor-pointer"
            >
              {/* Top Row: Owner / Repo Name + Visibility + Push Time */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  {/* Owner badge */}
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-fg-light-muted dark:text-fg-dark-muted">
                    {repo.isOrg ? (
                      <Building2 className="w-3 h-3 opacity-70" />
                    ) : (
                      <User className="w-3 h-3 opacity-70" />
                    )}
                    <span className="truncate">{repo.owner}</span>
                    <span className="opacity-40">/</span>
                  </span>

                  {/* Repo Name */}
                  <span className="text-xs font-semibold text-fg-light dark:text-fg-dark truncate group-hover:text-brand-500 transition-colors">
                    {repo.name}
                  </span>

                  {/* Visibility */}
                  {repo.visibility === 'private' ? (
                    <span
                      title="Private repository"
                      className="p-0.5 rounded text-fg-light-subtle dark:text-fg-dark-subtle bg-surface-light-subtle dark:bg-surface-dark"
                    >
                      <Lock className="w-2.5 h-2.5" />
                    </span>
                  ) : (
                    <span
                      title="Public repository"
                      className="p-0.5 rounded text-fg-light-subtle dark:text-fg-dark-subtle"
                    >
                      <Globe className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                {/* Push Time */}
                <span className="text-[11px] font-medium text-fg-light-subtle dark:text-fg-dark-subtle shrink-0">
                  {formatRelativeTime(repo.pushedAt)}
                </span>
              </div>

              {/* Middle Row: Latest Commit Message */}
              <div className="mb-2">
                <p className="text-xs text-fg-light-muted dark:text-fg-dark-muted line-clamp-1 group-hover:text-fg-light dark:group-hover:text-fg-dark transition-colors font-normal leading-relaxed">
                  {repo.latestCommitMessage}
                </p>
              </div>

              {/* Bottom Row: Branch + Commit SHA + Language + Commit Count */}
              <div className="flex items-center justify-between gap-2 text-[11px] pt-1.5 border-t border-border-light/40 dark:border-border-dark/40">
                <div className="flex items-center gap-2 min-w-0">
                  {/* Branch link */}
                  <button
                    onClick={(e) => openUrl(e, repo.branchUrl)}
                    className="inline-flex items-center gap-1 font-mono text-[10.5px] px-1.5 py-0.5 rounded bg-surface-light-subtle dark:bg-surface-dark border border-border-light/60 dark:border-border-dark/60 text-fg-light-muted dark:text-fg-dark-muted hover:text-brand-500 hover:border-brand-500/30 transition-colors truncate max-w-[140px]"
                    title={`Branch: ${repo.branch}`}
                  >
                    <GitBranch className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{repo.branch}</span>
                  </button>

                  {/* Commit SHA link */}
                  {repo.shortSha && (
                    <button
                      onClick={(e) => openUrl(e, repo.commitUrl)}
                      className="inline-flex items-center gap-1 font-mono text-[10.5px] px-1.5 py-0.5 rounded bg-surface-light-subtle dark:bg-surface-dark border border-border-light/60 dark:border-border-dark/60 text-fg-light-subtle dark:text-fg-dark-subtle hover:text-brand-500 hover:border-brand-500/30 transition-colors"
                      title={`Commit SHA: ${repo.latestCommitSha}`}
                    >
                      <GitCommit className="w-2.5 h-2.5 shrink-0" />
                      <span>{repo.shortSha}</span>
                    </button>
                  )}

                  {/* Commits count */}
                  {repo.commitCount > 1 && (
                    <span className="text-[10px] text-fg-light-subtle dark:text-fg-dark-subtle">
                      +{repo.commitCount - 1} more
                    </span>
                  )}
                </div>

                {/* Right: Language indicator */}
                {repo.language && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: langColor }}
                    />
                    <span className="text-[10.5px] text-fg-light-subtle dark:text-fg-dark-subtle">
                      {repo.language}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
