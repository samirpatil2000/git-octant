import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  GitPullRequest,
  GitCommit,
  Building2,
  FolderGit2,
  ExternalLink,
  RotateCw,
  Sun,
  Moon,
  Laptop,
  Settings as SettingsIcon,
  X,
} from 'lucide-react';
import { DashboardData } from '../types/app';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  dashboardData: DashboardData;
  onRefresh: () => void;
  onOpenSettings: () => void;
  onToggleTheme: (theme: 'light' | 'dark' | 'system') => void;
  currentTheme: string;
}

interface PaletteItem {
  id: string;
  category: 'Repositories' | 'Pull Requests' | 'Organizations' | 'Actions';
  title: string;
  subtitle?: string;
  icon: any;
  action: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  dashboardData,
  onRefresh,
  onOpenSettings,
  onToggleTheme,
  currentTheme,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global key listener for Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex]);

  // Build searchable items list
  const allItems: PaletteItem[] = useMemo(() => {
    const items: PaletteItem[] = [];

    // Quick Actions
    items.push({
      id: 'action-refresh',
      category: 'Actions',
      title: 'Refresh GitHub Data',
      subtitle: 'Sync latest pushes and PR reviews',
      icon: RotateCw,
      action: onRefresh,
    });

    items.push({
      id: 'action-open-github',
      category: 'Actions',
      title: 'Open GitHub.com',
      subtitle: 'Open GitHub in a new tab',
      icon: ExternalLink,
      action: () => window.open('https://github.com', '_blank'),
    });

    items.push({
      id: 'action-open-settings',
      category: 'Actions',
      title: 'Open Settings',
      subtitle: 'Configure GitHub PAT, appearance and filters',
      icon: SettingsIcon,
      action: onOpenSettings,
    });

    // Theme toggles
    items.push({
      id: 'action-theme-dark',
      category: 'Actions',
      title: 'Set Dark Mode',
      subtitle: 'Switch to refined dark theme',
      icon: Moon,
      action: () => onToggleTheme('dark'),
    });

    items.push({
      id: 'action-theme-light',
      category: 'Actions',
      title: 'Set Light Mode',
      subtitle: 'Switch to Apple-style light theme',
      icon: Sun,
      action: () => onToggleTheme('light'),
    });

    items.push({
      id: 'action-theme-system',
      category: 'Actions',
      title: 'Set System Theme',
      subtitle: 'Match macOS / system appearance',
      icon: Laptop,
      action: () => onToggleTheme('system'),
    });

    // Repositories
    for (const repo of dashboardData.latestPushes) {
      items.push({
        id: `repo-push-${repo.id}`,
        category: 'Repositories',
        title: repo.fullName,
        subtitle: `Latest push: ${repo.branch} (${repo.shortSha})`,
        icon: GitCommit,
        action: () => window.open(repo.repoUrl, '_blank'),
      });
    }

    for (const repo of dashboardData.repositories) {
      if (!items.some((i) => i.id === `repo-push-${repo.id}`)) {
        items.push({
          id: `repo-${repo.id}`,
          category: 'Repositories',
          title: repo.full_name,
          subtitle: repo.description || `Default branch: ${repo.default_branch}`,
          icon: FolderGit2,
          action: () => window.open(repo.html_url, '_blank'),
        });
      }
    }

    // Pull Requests
    for (const pr of dashboardData.myOpenPrs) {
      items.push({
        id: `pr-${pr.id}`,
        category: 'Pull Requests',
        title: `#${pr.number} ${pr.title}`,
        subtitle: `${pr.base.repo?.name || 'repo'} (${pr.head.ref})`,
        icon: GitPullRequest,
        action: () => window.open(pr.html_url, '_blank'),
      });
    }

    for (const att of dashboardData.attentionItems) {
      if (!items.some((i) => i.id === `pr-${att.prNumber}`)) {
        items.push({
          id: `att-${att.id}`,
          category: 'Pull Requests',
          title: `#${att.prNumber} ${att.prTitle}`,
          subtitle: `Attention: ${att.reasonLabel} (${att.repoName})`,
          icon: GitPullRequest,
          action: () => window.open(att.url, '_blank'),
        });
      }
    }

    // Organizations
    for (const org of dashboardData.organizations) {
      items.push({
        id: `org-${org.id}`,
        category: 'Organizations',
        title: org.login,
        subtitle: org.description || 'GitHub Organization',
        icon: Building2,
        action: () => window.open(`https://github.com/${org.login}`, '_blank'),
      });
    }

    return items;
  }, [dashboardData, onRefresh, onOpenSettings, onToggleTheme]);

  // Filter items by search query
  const filteredItems = useMemo(() => {
    if (!query.trim()) return allItems;
    const lowerQ = query.toLowerCase();
    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(lowerQ) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(lowerQ)) ||
        item.category.toLowerCase().includes(lowerQ)
    );
  }, [allItems, query]);

  // Keep selected item visible in scroll view
  useEffect(() => {
    const listEl = listRef.current;
    if (listEl) {
      const selectedEl = listEl.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-16 px-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg rounded-2xl border border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark shadow-popover dark:shadow-popover-dark overflow-hidden flex flex-col max-h-[80vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
          <Search className="w-4 h-4 text-fg-light-muted dark:text-fg-dark-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search repositories, PRs, orgs, or type a command..."
            className="w-full text-xs bg-transparent text-fg-light dark:text-fg-dark placeholder:text-fg-light-subtle dark:placeholder:text-fg-dark-subtle focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-fg-light-subtle hover:text-fg-light dark:text-fg-dark-subtle dark:hover:text-fg-dark"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Results List */}
        <div ref={listRef} className="overflow-y-auto p-2 divide-y divide-transparent">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-fg-light-muted dark:text-fg-dark-muted">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  data-index={idx}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between gap-3 p-2.5 rounded-xl text-xs transition-surface cursor-pointer ${
                    isSelected
                      ? 'bg-brand-500 text-white shadow-subtle'
                      : 'hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover text-fg-light dark:text-fg-dark'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg shrink-0 ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-surface-light-subtle dark:bg-surface-dark border border-border-light/60 dark:border-border-dark/60 text-fg-light-muted dark:text-fg-dark-muted'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`font-semibold truncate ${
                          isSelected ? 'text-white' : 'text-fg-light dark:text-fg-dark'
                        }`}
                      >
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p
                          className={`text-[10.5px] truncate font-normal ${
                            isSelected
                              ? 'text-white/80'
                              : 'text-fg-light-muted dark:text-fg-dark-muted'
                          }`}
                        >
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <span
                    className={`text-[9.5px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded shrink-0 ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-surface-light-subtle dark:bg-surface-dark text-fg-light-subtle dark:text-fg-dark-subtle'
                    }`}
                  >
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-border-light dark:border-border-dark bg-surface-light/50 dark:bg-surface-dark/50 text-[10px] text-fg-light-subtle dark:text-fg-dark-subtle">
          <div className="flex items-center gap-2">
            <span>
              <kbd className="px-1 py-0.2 bg-surface-light-subtle dark:bg-surface-dark rounded border border-border-light dark:border-border-dark font-mono">
                ↑
              </kbd>{' '}
              <kbd className="px-1 py-0.2 bg-surface-light-subtle dark:bg-surface-dark rounded border border-border-light dark:border-border-dark font-mono">
                ↓
              </kbd>{' '}
              Navigate
            </span>
            <span>
              <kbd className="px-1 py-0.2 bg-surface-light-subtle dark:bg-surface-dark rounded border border-border-light dark:border-border-dark font-mono">
                ↵
              </kbd>{' '}
              Open
            </span>
          </div>
          <span>
            <kbd className="px-1 py-0.2 bg-surface-light-subtle dark:bg-surface-dark rounded border border-border-light dark:border-border-dark font-mono">
              esc
            </kbd>{' '}
            Close
          </span>
        </div>
      </div>
    </div>
  );
}
