import React from 'react';

export function LatestPushesSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="p-3.5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark animate-pulse"
        >
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-fg-light-subtle/20 dark:bg-fg-dark-subtle/20" />
              <div className="h-4 w-32 rounded bg-fg-light-subtle/20 dark:bg-fg-dark-subtle/20" />
              <div className="h-3 w-12 rounded-full bg-fg-light-subtle/15 dark:bg-fg-dark-subtle/15" />
            </div>
            <div className="h-3 w-20 rounded bg-fg-light-subtle/15 dark:bg-fg-dark-subtle/15" />
          </div>
          <div className="h-3.5 w-3/4 rounded bg-fg-light-subtle/20 dark:bg-fg-dark-subtle/20 mb-2" />
          <div className="flex items-center gap-3">
            <div className="h-3 w-24 rounded bg-fg-light-subtle/15 dark:bg-fg-dark-subtle/15" />
            <div className="h-3 w-16 rounded bg-fg-light-subtle/15 dark:bg-fg-dark-subtle/15" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AttentionSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="p-3 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark animate-pulse flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-fg-light-subtle/30 dark:bg-fg-dark-subtle/30" />
            <div>
              <div className="h-3.5 w-24 rounded bg-fg-light-subtle/20 dark:bg-fg-dark-subtle/20 mb-1" />
              <div className="h-3 w-40 rounded bg-fg-light-subtle/15 dark:bg-fg-dark-subtle/15" />
            </div>
          </div>
          <div className="h-3 w-14 rounded bg-fg-light-subtle/15 dark:bg-fg-dark-subtle/15" />
        </div>
      ))}
    </div>
  );
}
