import { UserSettings, DashboardData } from '../types/app';

const SETTINGS_KEY = 'gcc_user_settings_v1';
const CACHE_KEY = 'gcc_dashboard_cache_v1';

export const DEFAULT_SETTINGS: UserSettings = {
  token: '',
  username: '',
  theme: 'system',
  enableNewTab: true,
  autoRefreshIntervalMinutes: 10,
  selectedOrgFilter: 'all',
  maxLatestRepos: 5,
  showAttentionSection: true,
  showOpenPrsSection: true,
  showActivityTimeline: true,
  showRepoGrid: true,
  orgOrder: [],
};

// In-memory fallback for local development or non-extension environments
const memoryStore = new Map<string, any>();

function isChromeStorageAvailable(): boolean {
  return (
    typeof chrome !== 'undefined' &&
    !!chrome.storage &&
    !!chrome.storage.local
  );
}

export async function getStoredSettings(): Promise<UserSettings> {
  try {
    if (isChromeStorageAvailable()) {
      const result = await chrome.storage.local.get([SETTINGS_KEY]);
      if (result[SETTINGS_KEY]) {
        return { ...DEFAULT_SETTINGS, ...result[SETTINGS_KEY] };
      }
    } else {
      const item =
        memoryStore.get(SETTINGS_KEY) ||
        (typeof localStorage !== 'undefined' ? localStorage.getItem(SETTINGS_KEY) : null);
      if (item) {
        const parsed = typeof item === 'string' ? JSON.parse(item) : item;
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    }
  } catch (err) {
    console.error('Failed to read settings from storage', err);
  }
  return DEFAULT_SETTINGS;
}

export async function saveStoredSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  const current = await getStoredSettings();
  const updated: UserSettings = { ...current, ...settings };

  try {
    if (isChromeStorageAvailable()) {
      await chrome.storage.local.set({ [SETTINGS_KEY]: updated });
    } else {
      memoryStore.set(SETTINGS_KEY, updated);
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
        } catch (_) {}
      }
    }
  } catch (err) {
    console.error('Failed to save settings to storage', err);
  }
  return updated;
}

export async function clearStoredToken(): Promise<void> {
  const current = await getStoredSettings();
  await saveStoredSettings({ ...current, token: '', username: '' });
  await clearCachedDashboard();
}

export async function getCachedDashboard(): Promise<{ data: DashboardData; timestamp: number } | null> {
  try {
    if (isChromeStorageAvailable()) {
      const result = await chrome.storage.local.get([CACHE_KEY]);
      return result[CACHE_KEY] || null;
    } else {
      const item =
        memoryStore.get(CACHE_KEY) ||
        (typeof localStorage !== 'undefined' ? localStorage.getItem(CACHE_KEY) : null);
      if (item) {
        return typeof item === 'string' ? JSON.parse(item) : item;
      }
    }
  } catch (err) {
    console.error('Failed to read cache', err);
  }
  return null;
}

export async function setCachedDashboard(data: DashboardData): Promise<void> {
  const payload = {
    data,
    timestamp: Date.now(),
  };
  try {
    if (isChromeStorageAvailable()) {
      await chrome.storage.local.set({ [CACHE_KEY]: payload });
    } else {
      memoryStore.set(CACHE_KEY, payload);
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
        } catch (_) {}
      }
    }
  } catch (err) {
    console.error('Failed to write cache', err);
  }
}

export async function clearCachedDashboard(): Promise<void> {
  try {
    if (isChromeStorageAvailable()) {
      await chrome.storage.local.remove([CACHE_KEY]);
    } else {
      memoryStore.delete(CACHE_KEY);
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.removeItem(CACHE_KEY);
        } catch (_) {}
      }
    }
  } catch (err) {
    console.error('Failed to clear cache', err);
  }
}
