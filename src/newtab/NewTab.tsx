import React, { useState, useEffect } from 'react';
import { useDashboardData } from '../store/useDashboardData';
import { Header } from '../components/Header';
import { OrgFilter } from '../components/OrgFilter';
import { LatestPushes } from '../components/LatestPushes';
import { AttentionSection } from '../components/AttentionSection';
import { PullRequestsSection } from '../components/PullRequestsSection';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { RepoGrid } from '../components/RepoGrid';
import { CommandPalette } from '../components/CommandPalette';
import { SettingsModal } from '../components/SettingsModal';
import { AuthScreen } from '../components/AuthScreen';
import { FullCockpitLoader } from '../components/FullCockpitLoader';
import { RateLimitBanner, ErrorBanner } from '../components/RateLimitBanner';
import { applyTheme, initThemeListener } from '../lib/theme';
import { GitCommit, GitPullRequest, AlertCircle } from 'lucide-react';

export function NewTab() {
  const {
    data,
    settings,
    isLoading,
    isRefreshing,
    error,
    rateLimit,
    selectedOrg,
    setSelectedOrg,
    reorderOrganizations,
    refreshDashboard,
    updateSettings,
    filteredLatestPushes,
    filteredOpenPrs,
    filteredAttentionItems,
    filteredActivity,
  } = useDashboardData();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Initialize theme
  useEffect(() => {
    applyTheme(settings.theme || 'system');
    const cleanup = initThemeListener(() => settings.theme || 'system');
    return cleanup;
  }, [settings.theme]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (e.key.toLowerCase() === 'r' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        refreshDashboard();
      } else if (e.key === ',' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsSettingsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [refreshDashboard]);

  // 1. IF NO TOKEN: Render ONLY the Token Connection Window
  if (!settings.token || !settings.token.trim()) {
    return (
      <AuthScreen
        onConnectToken={async (token, username) => {
          await updateSettings({ token, username });
        }}
        isNewTab={true}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-canvas-light dark:bg-canvas-dark text-fg-light dark:text-fg-dark antialiased font-sans transition-surface">
      {/* Top Header */}
      <Header
        username={data.user?.login}
        avatarUrl={data.user?.avatar_url}
        lastSyncedAt={data.lastSyncedAt}
        isRefreshing={isRefreshing}
        isMockData={false}
        onRefresh={refreshDashboard}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        isNewTabPage={true}
      />

      {/* Main Container */}
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* 2. IF LOADING: Render Full Cockpit Loader */}
        {isLoading ? (
          <div className="rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-6 shadow-subtle">
            <FullCockpitLoader statusMessage="Syncing your GitHub repositories, personal pushes, and pull requests..." />
          </div>
        ) : (
          <>
            {/* Org filter bar */}
            <div className="rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-1 shadow-subtle">
              <OrgFilter
                organizations={data.organizations}
                selectedOrg={selectedOrg}
                onSelectOrg={setSelectedOrg}
                onReorderOrgs={reorderOrganizations}
              />
            </div>

            {/* Rate limit banner */}
            {rateLimit && rateLimit.isLimited && (
              <RateLimitBanner rateLimit={rateLimit} />
            )}

            {/* Error banner */}
            {error && (
              <ErrorBanner
                error={error}
                onRetry={refreshDashboard}
                onOpenSettings={() => setIsSettingsOpen(true)}
              />
            )}

            {/* Cockpit Metric Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-subtle flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-fg-light-muted dark:text-fg-dark-muted uppercase tracking-wider">
                    Recent Pushes
                  </p>
                  <p className="text-2xl font-bold text-fg-light dark:text-fg-dark mt-0.5">
                    {filteredLatestPushes.length}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <GitCommit className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-subtle flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-fg-light-muted dark:text-fg-dark-muted uppercase tracking-wider">
                    Action Items
                  </p>
                  <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                    {filteredAttentionItems.length}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-subtle flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-fg-light-muted dark:text-fg-dark-muted uppercase tracking-wider">
                    My Open PRs
                  </p>
                  <p className="text-2xl font-bold text-fg-light dark:text-fg-dark mt-0.5">
                    {filteredOpenPrs.length}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <GitPullRequest className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Cockpit Content Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Left Column (2 cols wide) */}
              <div className="lg:col-span-2 space-y-6">
                <LatestPushes
                  pushes={filteredLatestPushes}
                  isLoading={isLoading}
                />

                {settings.showAttentionSection && (
                  <AttentionSection items={filteredAttentionItems} />
                )}

                {settings.showOpenPrsSection && (
                  <PullRequestsSection prs={filteredOpenPrs} />
                )}

                {settings.showRepoGrid && (
                  <RepoGrid repositories={data.repositories} />
                )}
              </div>

              {/* Right Column (1 col wide): Activity Timeline */}
              <div className="space-y-6">
                {settings.showActivityTimeline && (
                  <ActivityTimeline activities={filteredActivity} />
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        dashboardData={data}
        onRefresh={refreshDashboard}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleTheme={(t) => updateSettings({ theme: t })}
        currentTheme={settings.theme}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={updateSettings}
        onDisconnect={async () => {
          await updateSettings({ token: '', username: '' });
        }}
      />
    </div>
  );
}
