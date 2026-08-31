import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { RateLimitInfo } from '../types/app';

interface RateLimitBannerProps {
  rateLimit: RateLimitInfo;
}

export function RateLimitBanner({ rateLimit }: RateLimitBannerProps) {
  return (
    <div className="mb-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200">
      <div className="flex items-start gap-3">
        <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-semibold text-amber-600 dark:text-amber-400">
            GitHub API rate limit reached
          </p>
          <p className="mt-0.5 text-fg-light-muted dark:text-fg-dark-muted">
            Your cached data is still available. Next refresh available in{' '}
            <span className="font-medium text-fg-light dark:text-fg-dark">
              {rateLimit.resetInMinutes || 1} {rateLimit.resetInMinutes === 1 ? 'minute' : 'minutes'}
            </span>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

interface ErrorBannerProps {
  error: string;
  onRetry?: () => void;
  onOpenSettings?: () => void;
}

export function ErrorBanner({ error, onRetry, onOpenSettings }: ErrorBannerProps) {
  const isAuthError =
    error.toLowerCase().includes('token') ||
    error.toLowerCase().includes('unauthorized') ||
    error.toLowerCase().includes('permission');

  return (
    <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-900 dark:text-rose-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-medium text-rose-700 dark:text-rose-300">
              {error}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isAuthError && onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
            >
              Update Token
            </button>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
