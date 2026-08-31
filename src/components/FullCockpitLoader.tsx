import React from 'react';
import { RotateCw } from 'lucide-react';
import { GitHubIcon } from './GitHubIcon';
import { LatestPushesSkeleton, AttentionSkeleton } from './SkeletonLoader';

interface FullCockpitLoaderProps {
  statusMessage?: string;
}

export function FullCockpitLoader({
  statusMessage = 'Connecting to GitHub and syncing repositories...',
}: FullCockpitLoaderProps) {
  return (
    <div className="w-full flex-1 flex flex-col p-4 space-y-5 animate-fade-in">
      {/* Top Syncing Status Banner */}
      <div className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400">
        <RotateCw className="w-3.5 h-3.5 animate-spin shrink-0" />
        <span className="text-xs font-medium tracking-tight truncate">
          {statusMessage}
        </span>
      </div>

      {/* Shimmering Cockpit Skeletons */}
      <div className="space-y-4">
        <div>
          <div className="h-3 w-28 rounded bg-fg-light-subtle/20 dark:bg-fg-dark-subtle/20 mb-2.5" />
          <LatestPushesSkeleton />
        </div>

        <div>
          <div className="h-3 w-36 rounded bg-fg-light-subtle/20 dark:bg-fg-dark-subtle/20 mb-2.5" />
          <AttentionSkeleton />
        </div>
      </div>
    </div>
  );
}
