import { getStoredSettings, getCachedDashboard, setCachedDashboard } from '../lib/storage';
import { getAuthenticatedUser } from '../api/users';
import { getUserOrganizations } from '../api/organizations';
import { getUserEvents } from '../api/events';
import { getUserRepositories } from '../api/repos';
import { getOpenPRsByAuthor, getReviewRequestedPRs, fetchPRContexts } from '../api/pulls';
import { aggregateLatestPushes } from '../lib/push-aggregator';
import { classifyAttentionItems } from '../lib/attention';
import { generateActivityTimeline } from '../lib/activity';
import { DashboardData } from '../types/app';
import { GitHubRepository } from '../types/github';

const ALARM_NAME = 'gcc_periodic_refresh';

// Set up periodic sync alarm
chrome.runtime.onInstalled.addListener(async () => {
  console.log('GitOctant installed.');
  setupSyncAlarm();
  performBackgroundSync();
});

chrome.runtime.onStartup.addListener(() => {
  setupSyncAlarm();
  performBackgroundSync();
});

// Listen for alarm triggers
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    performBackgroundSync();
  }
});

async function setupSyncAlarm() {
  const settings = await getStoredSettings();
  const interval = settings.autoRefreshIntervalMinutes || 10;

  chrome.alarms.clear(ALARM_NAME, () => {
    if (interval > 0) {
      chrome.alarms.create(ALARM_NAME, {
        periodInMinutes: interval,
      });
    }
  });
}

// Background sync logic
async function performBackgroundSync() {
  try {
    const settings = await getStoredSettings();
    const token = settings.token?.trim();
    if (!token) {
      updateBadge(0);
      return;
    }

    const user = await getAuthenticatedUser(token);
    const username = user.login;

    const [orgs, events, rawRepos, authorPRs, reviewReqPRs] = await Promise.all([
      getUserOrganizations(token),
      getUserEvents(username, token, 100),
      getUserRepositories(token, 100),
      getOpenPRsByAuthor(username, token),
      getReviewRequestedPRs(username, token),
    ]);

    const repoMetaMap = new Map<string, GitHubRepository>();
    for (const r of rawRepos) {
      repoMetaMap.set(r.full_name.toLowerCase(), r);
    }

    const latestPushes = aggregateLatestPushes(
      events,
      username,
      repoMetaMap,
      settings.maxLatestRepos || 5
    );

    const combinedPRsMap = new Map<number, typeof authorPRs[0]>();
    for (const pr of authorPRs) combinedPRsMap.set(pr.id, pr);
    for (const pr of reviewReqPRs) combinedPRsMap.set(pr.id, pr);
    const allRelevantPRs = Array.from(combinedPRsMap.values());

    const prContexts = await fetchPRContexts(allRelevantPRs, token);
    const attentionItems = classifyAttentionItems(prContexts, username);
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

    await setCachedDashboard(newDashboardData);
    updateBadge(attentionItems.length);
  } catch (err) {
    console.warn('Background sync failed', err);
  }
}

function updateBadge(attentionCount: number) {
  if (attentionCount > 0) {
    chrome.action.setBadgeText({ text: String(attentionCount) });
    chrome.action.setBadgeBackgroundColor({ color: '#f43f5e' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}
