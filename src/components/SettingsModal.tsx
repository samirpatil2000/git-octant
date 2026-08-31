import React, { useState } from 'react';
import {
  X,
  Key,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Sun,
  Moon,
  Laptop,
  Trash2,
  ExternalLink,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { UserSettings } from '../types/app';
import { validateToken } from '../api/users';
import { applyTheme } from '../lib/theme';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSaveSettings: (settings: Partial<UserSettings>) => Promise<void>;
  onDisconnect: () => Promise<void>;
}

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onDisconnect,
}: SettingsModalProps) {
  const [tokenInput, setTokenInput] = useState(settings.token || '');
  const [showToken, setShowToken] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationState, setValidationState] = useState<{
    tested: boolean;
    success: boolean;
    username?: string;
    message?: string;
    scopes?: string[];
  } | null>(null);

  const [theme, setTheme] = useState(settings.theme || 'system');
  const [enableNewTab, setEnableNewTab] = useState(settings.enableNewTab ?? true);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(
    settings.autoRefreshIntervalMinutes || 10
  );
  const [maxLatestRepos, setMaxLatestRepos] = useState(settings.maxLatestRepos || 5);
  const [showAttention, setShowAttention] = useState(settings.showAttentionSection ?? true);
  const [showOpenPrs, setShowOpenPrs] = useState(settings.showOpenPrsSection ?? true);
  const [showActivity, setShowActivity] = useState(settings.showActivityTimeline ?? true);
  const [showRepoGrid, setShowRepoGrid] = useState(settings.showRepoGrid ?? true);
  const [activeTab, setActiveTab] = useState<'connection' | 'dashboard' | 'appearance' | 'privacy'>('connection');

  React.useEffect(() => {
    if (isOpen) {
      setTokenInput(settings.token || '');
      setTheme(settings.theme || 'system');
      setEnableNewTab(settings.enableNewTab ?? true);
      setAutoRefreshInterval(settings.autoRefreshIntervalMinutes || 10);
      setMaxLatestRepos(settings.maxLatestRepos || 5);
      setShowAttention(settings.showAttentionSection ?? true);
      setShowOpenPrs(settings.showOpenPrsSection ?? true);
      setShowActivity(settings.showActivityTimeline ?? true);
      setShowRepoGrid(settings.showRepoGrid ?? true);
      setOrgOrder(settings.orgOrder || []);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!tokenInput.trim()) {
      setValidationState({
        tested: true,
        success: false,
        message: 'Please enter a GitHub Personal Access Token.',
      });
      return;
    }

    setIsValidating(true);
    setValidationState(null);

    const result = await validateToken(tokenInput.trim());
    setIsValidating(false);

    if (result.isValid && result.user) {
      setValidationState({
        tested: true,
        success: true,
        username: result.user.login,
        scopes: result.scopes,
        message: `Successfully connected as @${result.user.login}`,
      });
      // Automatically persist token & username
      await onSaveSettings({
        token: tokenInput.trim(),
        username: result.user.login,
      });
    } else {
      setValidationState({
        tested: true,
        success: false,
        message: result.error || 'Authentication failed. Please verify token permissions.',
      });
    }
  };

  const [orgOrder, setOrgOrder] = useState<string[]>(settings.orgOrder || []);

  const handleSaveAll = async () => {
    await onSaveSettings({
      token: tokenInput.trim(),
      theme,
      enableNewTab,
      autoRefreshIntervalMinutes: autoRefreshInterval,
      maxLatestRepos,
      showAttentionSection: showAttention,
      showOpenPrsSection: showOpenPrs,
      showActivityTimeline: showActivity,
      showRepoGrid,
      orgOrder,
    });
    applyTheme(theme);
    onClose();
  };

  const handleThemeChange = (newTheme: 'system' | 'light' | 'dark') => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg rounded-2xl border border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark shadow-popover dark:shadow-popover-dark overflow-hidden flex flex-col max-h-[88vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-brand-500" />
            <h3 className="text-xs font-semibold text-fg-light dark:text-fg-dark">
              Settings & Preferences
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-fg-light-subtle hover:text-fg-light dark:text-fg-dark-subtle dark:hover:text-fg-dark"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 pt-2 border-b border-border-light/60 dark:border-border-dark/60 bg-surface-light-subtle/50 dark:bg-surface-dark-subtle/50 text-xs">
          {[
            { id: 'connection', label: 'GitHub Connection' },
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'appearance', label: 'Appearance' },
            { id: 'privacy', label: 'Privacy & Security' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-fg-light-muted hover:text-fg-light dark:text-fg-dark-muted dark:hover:text-fg-dark'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Tab 1: GitHub Connection */}
          {activeTab === 'connection' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-fg-light dark:text-fg-dark mb-1">
                  Personal Access Token (PAT)
                </label>
                <p className="text-[11px] text-fg-light-muted dark:text-fg-dark-muted mb-2 leading-relaxed">
                  Use a fine-grained token with read-only access to repositories and organizations.
                </p>

                <div className="relative flex items-center">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="github_pat_... or ghp_..."
                    className="w-full pl-3 pr-10 py-2 rounded-xl text-xs font-mono border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-fg-light dark:text-fg-dark focus:border-brand-500 focus:outline-none transition-surface"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 p-1 text-fg-light-subtle hover:text-fg-light dark:text-fg-dark-subtle dark:hover:text-fg-dark"
                  >
                    {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isValidating}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs shadow-subtle transition-surface disabled:opacity-50"
                >
                  {isValidating ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      Testing Connection...
                    </>
                  ) : (
                    <>
                      <Key className="w-3.5 h-3.5" />
                      Test Connection
                    </>
                  )}
                </button>

                {settings.token && (
                  <button
                    type="button"
                    onClick={async () => {
                      await onDisconnect();
                      setTokenInput('');
                      setValidationState(null);
                    }}
                    className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:underline"
                  >
                    <Trash2 className="w-3 h-3" />
                    Disconnect
                  </button>
                )}
              </div>

              {/* Validation Result Box */}
              {validationState && (
                <div
                  className={`p-3 rounded-xl border text-xs leading-relaxed ${
                    validationState.success
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold mb-0.5">
                    {validationState.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                    <span>{validationState.message}</span>
                  </div>
                  {validationState.scopes && validationState.scopes.length > 0 && (
                    <p className="text-[10.5px] mt-1 text-fg-light-muted dark:text-fg-dark-muted font-mono">
                      Granted Scopes: {validationState.scopes.join(', ')}
                    </p>
                  )}
                </div>
              )}

              {/* Guide link */}
              <div className="pt-2 border-t border-border-light/50 dark:border-border-dark/50">
                <a
                  href="https://github.com/settings/tokens?type=beta"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-brand-500 hover:text-brand-600"
                >
                  <span>Create a Fine-Grained Token on GitHub</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* Tab 2: Dashboard Preferences */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-fg-light dark:text-fg-dark mb-1">
                  Number of Latest Repositories
                </label>
                <div className="flex items-center gap-2">
                  {[5, 8, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setMaxLatestRepos(num)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-surface ${
                        maxLatestRepos === num
                          ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                          : 'border-border-light dark:border-border-dark hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover'
                      }`}
                    >
                      Top {num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-fg-light dark:text-fg-dark mb-1">
                  Background Auto-Refresh Frequency
                </label>
                <select
                  value={autoRefreshInterval}
                  onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-fg-light dark:text-fg-dark text-xs focus:outline-none"
                >
                  <option value={0}>Manual refresh only</option>
                  <option value={5}>Every 5 minutes</option>
                  <option value={10}>Every 10 minutes (Recommended)</option>
                  <option value={15}>Every 15 minutes</option>
                  <option value={30}>Every 30 minutes</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-fg-light dark:text-fg-dark mb-2">
                  Visible Sections
                </label>
                <div className="space-y-2">
                  {[
                    { label: 'PRs Requiring Attention', state: showAttention, set: setShowAttention },
                    { label: 'My Open PRs', state: showOpenPrs, set: setShowOpenPrs },
                    { label: 'Recent Activity Timeline', state: showActivity, set: setShowActivity },
                    { label: 'Active Repositories Grid', state: showRepoGrid, set: setShowRepoGrid },
                  ].map((s, idx) => (
                    <label
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-xl border border-border-light/60 dark:border-border-dark/60 bg-surface-light dark:bg-surface-dark cursor-pointer"
                    >
                      <span className="text-xs text-fg-light dark:text-fg-dark">{s.label}</span>
                      <input
                        type="checkbox"
                        checked={s.state}
                        onChange={(e) => s.set(e.target.checked)}
                        className="rounded text-brand-500 focus:ring-0"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-fg-light dark:text-fg-dark">
                    Organization Order
                  </label>
                  {orgOrder.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setOrgOrder([])}
                      className="text-[11px] text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 font-medium"
                    >
                      Reset to Default
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-fg-light-muted dark:text-fg-dark-muted leading-relaxed mb-2">
                  You can drag and drop organization tabs directly in the top filter bar to rearrange them. Preferences are saved automatically.
                </p>
                {orgOrder.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl border border-border-light/60 dark:border-border-dark/60 bg-surface-light dark:bg-surface-dark">
                    {orgOrder.map((name, i) => (
                      <span
                        key={name}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-light-hover dark:bg-surface-dark-hover border border-border-light dark:border-border-dark text-fg-light dark:text-fg-dark"
                      >
                        <span className="text-[10px] text-fg-light-subtle dark:text-fg-dark-subtle">{i + 1}.</span>
                        {name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] italic text-fg-light-subtle dark:text-fg-dark-subtle">
                    Using default alphabetical / GitHub API ordering.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Appearance */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-fg-light dark:text-fg-dark mb-2">
                  Theme Appearance
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'system', label: 'System', icon: Laptop },
                    { id: 'light', label: 'Light', icon: Sun },
                    { id: 'dark', label: 'Dark', icon: Moon },
                  ].map((t) => {
                    const isSelected = theme === t.id;
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleThemeChange(t.id as any)}
                        className={`p-3 rounded-xl border text-center flex flex-col items-center gap-2 transition-surface ${
                          isSelected
                            ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold'
                            : 'border-border-light dark:border-border-dark hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover text-fg-light-muted dark:text-fg-dark-muted'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-border-light/50 dark:border-border-dark/50">
                <label className="flex items-center justify-between p-3 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark cursor-pointer">
                  <div>
                    <p className="text-xs font-semibold text-fg-light dark:text-fg-dark">
                      New Tab Experience
                    </p>
                    <p className="text-[11px] text-fg-light-muted dark:text-fg-dark-muted">
                      Open Command Center cockpit when opening a new browser tab.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableNewTab}
                    onChange={(e) => setEnableNewTab(e.target.checked)}
                    className="rounded text-brand-500 focus:ring-0 ml-3"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Tab 4: Privacy & Security */}
          {activeTab === 'privacy' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark">
                <div className="flex items-start gap-2.5 mb-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-fg-light dark:text-fg-dark">
                      Zero Telemetry & Local Storage Guarantee
                    </h4>
                  </div>
                </div>
                <p className="text-xs text-fg-light-muted dark:text-fg-dark-muted leading-relaxed">
                  Your GitHub token stays strictly on this device in secure Chrome storage (<code className="font-mono text-[11px] text-brand-500">chrome.storage.local</code>).
                </p>
                <p className="text-xs text-fg-light-muted dark:text-fg-dark-muted leading-relaxed mt-2">
                  GitOctant does not operate any intermediary backend, does not collect analytics or telemetry, and communicates directly and exclusively with GitHub&apos;s official APIs.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl text-xs font-medium text-fg-light-muted hover:text-fg-light dark:text-fg-dark-muted dark:hover:text-fg-dark transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            className="px-4 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-subtle transition-surface"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
