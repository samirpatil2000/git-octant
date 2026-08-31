import React, { useState } from 'react';
import {
  Key,
  ShieldCheck,
  AlertCircle,
  RotateCw,
  ExternalLink,
  Eye,
  EyeOff,
} from 'lucide-react';
import { validateToken } from '../api/users';
import { GitHubIcon } from './GitHubIcon';

interface AuthScreenProps {
  onConnectToken: (token: string, username: string) => Promise<void>;
  isNewTab?: boolean;
}

export function AuthScreen({ onConnectToken, isNewTab = false }: AuthScreenProps) {
  const [tokenInput, setTokenInput] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setErrorMsg('Please enter your GitHub Personal Access Token.');
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
    <div
      className={`w-full ${
        isNewTab ? 'min-h-screen' : 'min-h-[520px] h-full'
      } flex flex-col items-center justify-center p-6 bg-canvas-light dark:bg-canvas-dark text-fg-light dark:text-fg-dark select-none animate-fade-in`}
    >
      <div className="w-full max-w-sm rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-card dark:shadow-card-dark p-6 space-y-5">
        {/* Branding Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-fg-light dark:bg-surface-dark-subtle border border-border-light dark:border-border-dark flex items-center justify-center text-canvas-light dark:text-fg-dark shadow-subtle">
            <GitHubIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-fg-light dark:text-fg-dark tracking-tight">
              Octant
            </h2>
            <p className="text-[11px] text-fg-light-muted dark:text-fg-dark-muted mt-0.5">
              High-precision developer navigation for GitHub
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-fg-light-muted dark:text-fg-dark-muted leading-relaxed text-center">
          Connect your GitHub Personal Access Token to view your recent personal pushes, review requests, and active repositories.
        </p>

        {/* Token Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-fg-light dark:text-fg-dark">
                Personal Access Token
              </label>
              <a
                href="https://github.com/settings/tokens?type=beta"
                target="_blank"
                rel="noreferrer"
                className="text-[10.5px] font-medium text-brand-500 hover:text-brand-600 inline-flex items-center gap-0.5"
              >
                Create token <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>

            <div className="relative flex items-center">
              <input
                type={showToken ? 'text' : 'password'}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="github_pat_... or ghp_..."
                className="w-full pl-3 pr-9 py-2 rounded-xl text-xs font-mono border border-border-light dark:border-border-dark bg-surface-light-subtle/50 dark:bg-surface-dark-subtle/50 text-fg-light dark:text-fg-dark focus:border-brand-500 focus:outline-none transition-surface"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2.5 p-1 text-fg-light-subtle hover:text-fg-light dark:text-fg-dark-subtle dark:hover:text-fg-dark"
              >
                {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            {errorMsg && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1.5 flex items-start gap-1 font-medium leading-tight">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isValidating}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-subtle transition-surface disabled:opacity-50"
          >
            {isValidating ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                Verifying Token...
              </>
            ) : (
              <>
                <Key className="w-3.5 h-3.5" />
                Connect GitHub Account
              </>
            )}
          </button>
        </form>

        {/* Local Security Disclosure */}
        <div className="pt-2 border-t border-border-light/60 dark:border-border-dark/60">
          <div className="flex items-center gap-2 text-[10.5px] text-fg-light-subtle dark:text-fg-dark-subtle">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Stored strictly on this device. No servers, zero telemetry.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
