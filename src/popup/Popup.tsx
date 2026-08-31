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

export function Popup() {
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

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // ⌘K or Ctrl+K for search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      // R for refresh
      else if (e.key.toLowerCase() === 'r' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        refreshDashboard();
      }
      // , for settings
      else if (e.key === ',' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsSettingsOpen(true);
      }
      // Numbers 1-5 for quick opening top repos
      else if (['1', '2', '3', '4', '5'].includes(e.key) && !e.metaKey && !e.ctrlKey) {
        const index = parseInt(e.key, 10) - 1;
        if (filteredLatestPushes[index]) {
          window.open(filteredLatestPushes[index].repoUrl, '_blank');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [refreshDashboard, filteredLatestPushes]);

  // 1. IF NO TOKEN: Render ONLY the Token Window
  if (!settings.token || !settings.token.trim()) {
    return (
      <div className="w-[560px] min-h-[520px] max-h-[600px] flex flex-col bg-canvas-light dark:bg-canvas-dark text-fg-light dark:text-fg-dark antialiased font-sans select-none overflow-hidden">
        <AuthScreen
          onConnectToken={async (token, username) => {
            await updateSettings({ token, username });
          }}
          isNewTab={false}
        />
      </div>
    );
  }

  return (
    <div className="w-[560px] min-h-[520px] max-h-[600px] flex flex-col bg-canvas-light dark:bg-canvas-dark text-fg-light dark:text-fg-dark antialiased font-sans select-none overflow-hidden">
      {/* Header */}
      <Header
        username={data.user?.login}
        avatarUrl={data.user?.avatar_url}
        lastSyncedAt={data.lastSyncedAt}
        isRefreshing={isRefreshing}
        isMockData={false}
        onRefresh={refreshDashboard}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        isNewTabPage={false}
      />

      {/* 2. IF LOADING: Render Full Cockpit Loader */}
      {isLoading ? (
        <FullCockpitLoader statusMessage="Syncing your GitHub activity and repositories..." />
      ) : (
        <>
          {/* Organization Filters */}
          <OrgFilter
            organizations={data.organizations}
            selectedOrg={selectedOrg}
            onSelectOrg={setSelectedOrg}
            onReorderOrgs={reorderOrganizations}
          />

          {/* Scrollable Main Area */}
          <main className="flex-1 overflow-y-auto pt-3 pb-6">
            {/* Rate limit banner */}
            {rateLimit && rateLimit.isLimited && (
              <div className="px-4">
                <RateLimitBanner rateLimit={rateLimit} />
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div className="px-4">
                <ErrorBanner
                  error={error}
                  onRetry={refreshDashboard}
                  onOpenSettings={() => setIsSettingsOpen(true)}
                />
              </div>
            )}

            {/* 1. Core Primary Feature: Latest Pushes */}
            <LatestPushes
              pushes={filteredLatestPushes}
              isLoading={isLoading}
            />

            {/* 2. Needs Attention Section */}
            {settings.showAttentionSection && (
              <AttentionSection items={filteredAttentionItems} />
            )}

            {/* 3. My Open Pull Requests */}
            {settings.showOpenPrsSection && (
              <PullRequestsSection prs={filteredOpenPrs} />
            )}

            {/* 4. Recent PR & Push Activity Timeline */}
            {settings.showActivityTimeline && (
              <ActivityTimeline activities={filteredActivity} />
            )}

            {/* 5. Repositories Grid */}
            {settings.showRepoGrid && (
              <RepoGrid repositories={data.repositories} />
            )}
          </main>
        </>
      )}

      {/* Command Palette Modal */}
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
