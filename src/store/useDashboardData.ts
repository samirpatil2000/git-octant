import { useState, useEffect, useCallback, useRef } from 'react';
import {
  DashboardData,
  UserSettings,
  RateLimitInfo,
} from '../types/app';
import {
  getStoredSettings,
  saveStoredSettings,
  getCachedDashboard,
  setCachedDashboard,
  DEFAULT_SETTINGS,
} from '../lib/storage';
import { getAuthenticatedUser } from '../api/users';
import { getUserOrganizations } from '../api/organizations';
import { getUserEvents } from '../api/events';
import { getUserRepositories } from '../api/repos';
import {
  getOpenPRsByAuthor,
  getReviewRequestedPRs,
  fetchPRContexts,
} from '../api/pulls';
import { aggregateLatestPushes } from '../lib/push-aggregator';
import { classifyAttentionItems } from '../lib/attention';
import { generateActivityTimeline } from '../lib/activity';
import { sortOrganizationsByPreference } from '../lib/org-sorter';
import { GitHubApiError } from '../api/client';
import { GitHubRepository } from '../types/github';

const EMPTY_DASHBOARD_DATA: DashboardData = {
  user: null,
  organizations: [],
  latestPushes: [],
  attentionItems: [],
  myOpenPrs: [],
  recentActivity: [],
  repositories: [],
  lastSyncedAt: null,
  rateLimit: null,
  isLoading: false,
  isRefreshing: false,
  error: null,
  isMockData: false,
};

export function useDashboardData() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [data, setData] = useState<DashboardData>(EMPTY_DASHBOARD_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<string>('all');

  const isMountedRef = useRef(true);

  // Load initial settings and cached data
  useEffect(() => {
    isMountedRef.current = true;
    async function init() {
      const storedSettings = await getStoredSettings();
      if (!isMountedRef.current) return;
      setSettings(storedSettings);
      setSelectedOrg(storedSettings.selectedOrgFilter || 'all');

      if (!storedSettings.token || !storedSettings.token.trim()) {
        setData(EMPTY_DASHBOARD_DATA);
        setIsLoading(false);
        return;
      }

      // If token exists, check cache
      const cached = await getCachedDashboard();
      if (cached && cached.data && cached.data.user) {
        if (!isMountedRef.current) return;
        const sortedCachedOrgs = sortOrganizationsByPreference(
          cached.data.organizations || [],
          storedSettings.orgOrder
        );
        setData({ ...cached.data, organizations: sortedCachedOrgs });
        setIsLoading(false);
      }

      // Fetch fresh data
      await refreshDashboard(storedSettings, !cached);
    }

    init();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch all dashboard data from GitHub API
  const refreshDashboard = useCallback(
    async (currentSettings?: UserSettings, showFullLoader = false) => {
      const activeSettings = currentSettings || settings;
      const token = activeSettings.token?.trim();

      if (!token) {
        setData(EMPTY_DASHBOARD_DATA);
        setIsLoading(false);
        setIsRefreshing(false);
        setError(null);
        return;
      }

      if (showFullLoader) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      try {
        // 1. Fetch User Profile
        const user = await getAuthenticatedUser(token);
        const username = user.login;

        if (activeSettings.username !== username) {
          saveStoredSettings({ username });
        }

        // 2. Concurrently fetch Organizations, Events, Repositories, Author PRs, Review PRs
        const [rawOrgs, events, rawRepos, authorPRs, reviewReqPRs] = await Promise.all([
          getUserOrganizations(token),
          getUserEvents(username, token, 100),
          getUserRepositories(token, 100),
          getOpenPRsByAuthor(username, token),
          getReviewRequestedPRs(username, token),
        ]);

        const orgs = sortOrganizationsByPreference(rawOrgs, activeSettings.orgOrder);

        const repoMetaMap = new Map<string, GitHubRepository>();
        for (const r of rawRepos) {
          repoMetaMap.set(r.full_name.toLowerCase(), r);
        }

        // 3. Aggregate Latest Pushes
        const latestPushes = aggregateLatestPushes(
          events,
          username,
          repoMetaMap,
          activeSettings.maxLatestRepos || 5
        );

        // 4. PRs & Attention
        const combinedPRsMap = new Map<number, typeof authorPRs[0]>();
        for (const pr of authorPRs) combinedPRsMap.set(pr.id, pr);
        for (const pr of reviewReqPRs) combinedPRsMap.set(pr.id, pr);
        const allRelevantPRs = Array.from(combinedPRsMap.values());

        const prContexts = await fetchPRContexts(allRelevantPRs, token);
        const attentionItems = classifyAttentionItems(prContexts, username);

        // 5. Generate Activity Timeline
        const recentActivity = generateActivityTimeline(events, username, 20);

        const newDashboardData: DashboardData = {
          user,
          organizations: orgs,
          latestPushes,
          attentionItems,
          myOpenPrs: authorPRs,
          recentActivity,
          repositories: rawRepos,
          lastSyncedAt: new Date().toISOString(),
          rateLimit: null,
          isLoading: false,
          isRefreshing: false,
          error: null,
          isMockData: false,
        };

        if (isMountedRef.current) {
          setData(newDashboardData);
          setIsLoading(false);
          setIsRefreshing(false);
          setError(null);
        }

        // Cache the successful result
        await setCachedDashboard(newDashboardData);
      } catch (err: any) {
        if (!isMountedRef.current) return;
        setIsLoading(false);
        setIsRefreshing(false);

        if (err instanceof GitHubApiError) {
          setError(err.message);
          if (err.rateLimit) {
            setRateLimit(err.rateLimit);
          }
        } else {
          setError(err?.message || 'An unexpected error occurred while fetching GitHub data.');
        }
      }
    },
    [settings]
  );

  // Auto-refresh timer
  useEffect(() => {
    if (settings.autoRefreshIntervalMinutes <= 0 || !settings.token) return;
    const intervalMs = settings.autoRefreshIntervalMinutes * 60 * 1000;
    const timer = setInterval(() => {
      refreshDashboard(settings, false);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [settings, refreshDashboard]);

  // Update settings handler
  const updateSettings = useCallback(
    async (newSettings: Partial<UserSettings>) => {
      const updated = await saveStoredSettings(newSettings);
      setSettings(updated);
      if ('selectedOrgFilter' in newSettings && newSettings.selectedOrgFilter) {
        setSelectedOrg(newSettings.selectedOrgFilter);
      }
      if ('token' in newSettings) {
        await refreshDashboard(updated, true);
      }
    },
    [refreshDashboard]
  );

  // Filtered views based on selectedOrg ('all' | 'personal' | orgName)
  const filteredLatestPushes = data.latestPushes.filter((p) => {
    if (selectedOrg === 'all') return true;
    if (selectedOrg === 'personal') return !p.isOrg;
    return p.owner.toLowerCase() === selectedOrg.toLowerCase();
  });

  const filteredOpenPrs = data.myOpenPrs.filter((pr) => {
    if (selectedOrg === 'all') return true;
    const repoOwner = pr.base.repo?.owner.login || '';
    if (selectedOrg === 'personal') {
      return pr.base.repo?.owner.type === 'User' || repoOwner.toLowerCase() === (data.user?.login || '').toLowerCase();
    }
    return repoOwner.toLowerCase() === selectedOrg.toLowerCase();
  });

  const filteredAttentionItems = data.attentionItems.filter((item) => {
    if (selectedOrg === 'all') return true;
    if (selectedOrg === 'personal') {
      return item.owner.toLowerCase() === (data.user?.login || '').toLowerCase();
    }
    return item.owner.toLowerCase() === selectedOrg.toLowerCase();
  });

  const filteredActivity = data.recentActivity.filter((act) => {
    if (selectedOrg === 'all') return true;
    const [owner] = act.repoFullName.split('/');
    if (selectedOrg === 'personal') {
      return owner.toLowerCase() === (data.user?.login || '').toLowerCase();
    }
    return owner.toLowerCase() === selectedOrg.toLowerCase();
  });

  // Reorder organizations preference handler
  const reorderOrganizations = useCallback(
    async (newOrder: string[]) => {
      await updateSettings({ orgOrder: newOrder });
      setData((prev) => ({
        ...prev,
        organizations: sortOrganizationsByPreference(prev.organizations, newOrder),
      }));
    },
    [updateSettings]
  );

  return {
    data,
    settings,
    isLoading,
    isRefreshing,
    error,
    rateLimit,
    selectedOrg,
    setSelectedOrg: (org: string) => {
      setSelectedOrg(org);
      updateSettings({ selectedOrgFilter: org });
    },
    reorderOrganizations,
    refreshDashboard: () => refreshDashboard(settings, false),
    updateSettings,
    filteredLatestPushes,
    filteredOpenPrs,
    filteredAttentionItems,
    filteredActivity,
  };
}
