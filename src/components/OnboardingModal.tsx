import React, { useState } from 'react';
import {
  Key,
  ShieldCheck,
  AlertCircle,
  RotateCw,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { validateToken } from '../api/users';
import { GitHubIcon } from './GitHubIcon';

interface OnboardingModalProps {
  isOpen: boolean;
  onConnectToken: (token: string, username: string) => Promise<void>;
  onExploreDemo: () => void;
}

export function OnboardingModal({
  isOpen,
  onConnectToken,
  onExploreDemo,
}: OnboardingModalProps) {
  const [tokenInput, setTokenInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setErrorMsg('Please enter a GitHub Personal Access Token.');
      return;
    }

    setIsValidating(true);
    setErrorMsg(null);

    const res = await validateToken(tokenInput.trim());
    setIsValidating(false);

    if (res.isValid && res.user) {
      await onConnectToken(tokenInput.trim(), res.user.login);
    } else {
      setErrorMsg(res.error || 'Token validation failed. Please check permissions.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-md rounded-2xl border border-border-light dark:border-border-dark bg-canvas-light dark:bg-canvas-dark shadow-popover dark:shadow-popover-dark p-6 space-y-5 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-fg-light dark:bg-surface-dark border border-border-light dark:border-border-dark flex items-center justify-center text-canvas-light dark:text-fg-dark shadow-subtle">
            <GitHubIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-fg-light dark:text-fg-dark tracking-tight">
              GitOctant
            </h2>
            <p className="text-xs text-fg-light-muted dark:text-fg-dark-muted">
              Developer Navigation for GitHub
            </p>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="space-y-2 text-xs text-fg-light-muted dark:text-fg-dark-muted leading-relaxed">
          <p>
            Instantly see the latest repositories you personally pushed to, active PR reviews requiring your attention, and multi-org activity.
          </p>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="text-[11px] font-medium">
              Your token stays local on this device. No servers, zero telemetry.
            </span>
          </div>
        </div>

        {/* PAT Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-fg-light dark:text-fg-dark">
                Personal Access Token
              </label>
              <a
                href="https://github.com/settings/tokens?type=beta"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-brand-500 hover:text-brand-600 inline-flex items-center gap-0.5"
              >
                Create token <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>

            <div className="relative">
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="github_pat_... or ghp_..."
                className="w-full pl-3 pr-3 py-2 rounded-xl text-xs font-mono border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-fg-light dark:text-fg-dark focus:border-brand-500 focus:outline-none transition-surface"
              />
            </div>
            {errorMsg && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errorMsg}
              </p>
            )}
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              disabled={isValidating}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-subtle transition-surface disabled:opacity-50"
            >
              {isValidating ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  Connecting to GitHub...
                </>
              ) : (
                <>
                  <Key className="w-3.5 h-3.5" />
                  Connect GitHub Account
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onExploreDemo}
              className="w-full py-2 px-4 rounded-xl border border-border-light dark:border-border-dark hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover text-fg-light-muted hover:text-fg-light dark:text-fg-dark-muted dark:hover:text-fg-dark font-medium text-xs transition-surface flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-500" />
              <span>Explore Interactive Demo Mode</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
