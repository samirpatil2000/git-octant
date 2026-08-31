import React from 'react';
import { GitHubOrganization } from '../types/github';
import { Building2, User, Layers, LucideIcon } from 'lucide-react';

interface OrgFilterProps {
  organizations: GitHubOrganization[];
  selectedOrg: string;
  onSelectOrg: (org: string) => void;
}

interface FilterOption {
  id: string;
  label: string;
  icon: LucideIcon;
  avatarUrl?: string;
}

export function OrgFilter({
  organizations,
  selectedOrg,
  onSelectOrg,
}: OrgFilterProps) {
  const options: FilterOption[] = [
    { id: 'all', label: 'All', icon: Layers },
    { id: 'personal', label: 'Personal', icon: User },
    ...organizations.map((org) => ({
      id: org.login,
      label: org.login,
      icon: Building2,
      avatarUrl: org.avatar_url,
    })),
  ];

  return (
    <div className="shrink-0 flex items-center gap-1.5 overflow-x-auto py-2 px-4 border-b border-border-light/70 dark:border-border-dark/70 bg-canvas-light dark:bg-canvas-dark [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {options.map((opt) => {
        const isSelected = selectedOrg.toLowerCase() === opt.id.toLowerCase();
        const Icon = opt.icon;

        return (
          <button
            key={opt.id}
            onClick={() => onSelectOrg(opt.id)}
            className={`shrink-0 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium whitespace-nowrap transition-surface ${
              isSelected
                ? 'bg-fg-light text-canvas-light dark:bg-fg-dark dark:text-canvas-dark shadow-subtle'
                : 'text-fg-light-muted hover:text-fg-light dark:text-fg-dark-muted dark:hover:text-fg-dark hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover'
            }`}
          >
            {opt.avatarUrl ? (
              <img
                src={opt.avatarUrl}
                alt={opt.label}
                className="w-3.5 h-3.5 rounded-sm object-cover shrink-0"
              />
            ) : (
              <Icon className="w-3.5 h-3.5 opacity-70 shrink-0" />
            )}
            <span className="leading-none">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
