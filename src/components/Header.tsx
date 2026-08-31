import React from 'react';
import {
  RotateCw,
  Settings,
  Search,
  ExternalLink,
} from 'lucide-react';
import { formatRelativeTime } from '../lib/formatters';
import { GitHubIcon } from './GitHubIcon';

interface HeaderProps {
  username?: string;
  avatarUrl?: string;
  lastSyncedAt: string | null;
  isRefreshing: boolean;
  isMockData?: boolean;
  onRefresh: () => void;
  onOpenSettings: () => void;
  onOpenSearch: () => void;
  isNewTabPage?: boolean;
}

export function Header({
  username,
  lastSyncedAt,
  isRefreshing,
  isMockData,
  onRefresh,
  onOpenSettings,
  onOpenSearch,
  isNewTabPage = false,
}: HeaderProps) {
  const updatedText = isRefreshing
    ? 'Updating...'
    : lastSyncedAt
    ? `Updated ${formatRelativeTime(lastSyncedAt)}`
    : 'Not synced';

  const openNewTab = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: chrome.runtime.getURL('newtab.html') });
    } else {
      window.open('/newtab.html', '_blank');
    }
  };

  return (
    <header className="shrink-0 sticky top-0 z-30 px-4 py-3 border-b border-border-light dark:border-border-dark bg-canvas-light/90 dark:bg-canvas-dark/90 backdrop-blur-md transition-surface">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-fg-light dark:bg-surface-dark border border-border-light dark:border-border-dark flex items-center justify-center text-canvas-light dark:text-fg-dark shadow-subtle shrink-0">
            <GitHubIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs font-semibold text-fg-light dark:text-fg-dark tracking-tight truncate">
                GitHub Command Center
              </h1>
              {isMockData && (
                <span className="px-1.5 py-0.2 text-[9px] font-medium tracking-wide uppercase rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 shrink-0">
                  Preview
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-fg-light-muted dark:text-fg-dark-muted truncate">
              {username ? (
                <span className="flex items-center gap-1 font-mono text-[10.5px]">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  @{username}
                </span>
              ) : (
                <span className="text-fg-light-subtle dark:text-fg-dark-subtle">
                  Not connected
                </span>
              )}
              <span className="text-fg-light-subtle dark:text-fg-dark-subtle opacity-40">•</span>
              <span className="truncate">{updatedText}</span>
            </div>
          </div>
        </div>

        {/* Right: Controls & Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Quick Search ⌘K Button */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium text-fg-light-muted hover:text-fg-light dark:text-fg-dark-muted dark:hover:text-fg-dark hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover border border-transparent hover:border-border-light dark:hover:border-border-dark transition-surface"
            title="Search & Quick Actions (⌘K)"
          >
            <Search className="w-3.5 h-3.5" />
            <kbd className="hidden sm:inline-flex items-center px-1 text-[10px] font-mono text-fg-light-subtle dark:text-fg-dark-subtle bg-surface-light-subtle dark:bg-surface-dark rounded border border-border-light dark:border-border-dark">
              ⌘K
            </kbd>
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg text-fg-light-muted hover:text-fg-light dark:text-fg-dark-muted dark:hover:text-fg-dark hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover transition-surface disabled:opacity-50"
            title="Refresh GitHub Data (R)"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Expand to New Tab (shown only in popup) */}
          {!isNewTabPage && (
            <button
              onClick={openNewTab}
              className="p-1.5 rounded-lg text-fg-light-muted hover:text-fg-light dark:text-fg-dark-muted dark:hover:text-fg-dark hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover transition-surface"
              title="Open Expanded Cockpit in New Tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg text-fg-light-muted hover:text-fg-light dark:text-fg-dark-muted dark:hover:text-fg-dark hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover transition-surface"
            title="Settings & Connection"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
