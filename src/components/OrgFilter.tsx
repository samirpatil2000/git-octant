import React, { useState } from 'react';
import { GitHubOrganization } from '../types/github';
import { Building2, User, Layers, LucideIcon, GripVertical } from 'lucide-react';

interface OrgFilterProps {
  organizations: GitHubOrganization[];
  selectedOrg: string;
  onSelectOrg: (org: string) => void;
  onReorderOrgs?: (newOrder: string[]) => void;
}

interface StaticFilterOption {
  id: string;
  label: string;
  icon: LucideIcon;
}

export function OrgFilter({
  organizations,
  selectedOrg,
  onSelectOrg,
  onReorderOrgs,
}: OrgFilterProps) {
  const [draggedLogin, setDraggedLogin] = useState<string | null>(null);
  const [dragOverLogin, setDragOverLogin] = useState<string | null>(null);
  const [hasDragged, setHasDragged] = useState(false);

  const staticOptions: StaticFilterOption[] = [
    { id: 'all', label: 'All', icon: Layers },
    { id: 'personal', label: 'Personal', icon: User },
  ];

  const handleDragStart = (e: React.DragEvent, login: string) => {
    setDraggedLogin(login);
    setHasDragged(true);
    e.dataTransfer.setData('text/plain', login);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, login: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverLogin !== login) {
      setDragOverLogin(login);
    }
  };

  const handleDragLeave = (_e: React.DragEvent, login: string) => {
    if (dragOverLogin === login) {
      setDragOverLogin(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetLogin: string) => {
    e.preventDefault();
    if (!draggedLogin || draggedLogin.toLowerCase() === targetLogin.toLowerCase()) {
      setDraggedLogin(null);
      setDragOverLogin(null);
      return;
    }

    const currentLogins = organizations.map((o) => o.login);
    const fromIndex = currentLogins.findIndex(
      (l) => l.toLowerCase() === draggedLogin.toLowerCase()
    );
    const toIndex = currentLogins.findIndex(
      (l) => l.toLowerCase() === targetLogin.toLowerCase()
    );

    if (fromIndex !== -1 && toIndex !== -1) {
      const updated = [...currentLogins];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      onReorderOrgs?.(updated);
    }

    setDraggedLogin(null);
    setDragOverLogin(null);
  };

  const handleDragEnd = () => {
    setDraggedLogin(null);
    setDragOverLogin(null);
    // Reset drag flag after short delay to prevent click firing on drop
    setTimeout(() => {
      setHasDragged(false);
    }, 50);
  };

  return (
    <div className="shrink-0 flex items-center gap-1.5 overflow-x-auto py-2 px-3 border-b border-border-light/70 dark:border-border-dark/70 bg-canvas-light dark:bg-canvas-dark [scrollbar-width:none] [&::-webkit-scrollbar]:hidden select-none">
      {/* Static Filters: All, Personal */}
      {staticOptions.map((opt) => {
        const isSelected = selectedOrg.toLowerCase() === opt.id.toLowerCase();
        const Icon = opt.icon;

        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelectOrg(opt.id)}
            className={`shrink-0 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium whitespace-nowrap transition-surface ${
              isSelected
                ? 'bg-fg-light text-canvas-light dark:bg-fg-dark dark:text-canvas-dark shadow-subtle ring-1 ring-fg-light/20 dark:ring-fg-dark/20'
                : 'text-fg-light-muted hover:text-fg-light dark:text-fg-dark-muted dark:hover:text-fg-dark hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover'
            }`}
          >
            <Icon className="w-3.5 h-3.5 opacity-70 shrink-0" />
            <span className="leading-none">{opt.label}</span>
          </button>
        );
      })}

      {organizations.length > 0 && (
        <div className="w-[1px] h-4 bg-border-light/80 dark:border-border-dark/80 mx-1 shrink-0" />
      )}

      {/* Draggable Organization Filters */}
      {organizations.map((org) => {
        const isSelected = selectedOrg.toLowerCase() === org.login.toLowerCase();
        const isDraggingThis = draggedLogin?.toLowerCase() === org.login.toLowerCase();
        const isDragOverThis = dragOverLogin?.toLowerCase() === org.login.toLowerCase();

        return (
          <div
            key={org.login}
            draggable
            onDragStart={(e) => handleDragStart(e, org.login)}
            onDragOver={(e) => handleDragOver(e, org.login)}
            onDragLeave={(e) => handleDragLeave(e, org.login)}
            onDrop={(e) => handleDrop(e, org.login)}
            onDragEnd={handleDragEnd}
            onClick={() => {
              if (!hasDragged) {
                onSelectOrg(org.login);
              }
            }}
            title={`Drag to reorder • Filter by ${org.login}`}
            className={`group shrink-0 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium whitespace-nowrap cursor-grab active:cursor-grabbing transition-all duration-150 relative ${
              isDraggingThis
                ? 'opacity-30 scale-95 border border-dashed border-brand-500'
                : isDragOverThis
                ? 'ring-2 ring-brand-500 ring-offset-1 dark:ring-offset-canvas-dark scale-[1.04] bg-brand-500/10'
                : isSelected
                ? 'bg-fg-light text-canvas-light dark:bg-fg-dark dark:text-canvas-dark shadow-subtle ring-1 ring-fg-light/20 dark:ring-fg-dark/20'
                : 'text-fg-light-muted hover:text-fg-light dark:text-fg-dark-muted dark:hover:text-fg-dark hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover'
            }`}
          >
            {/* Tiny grip indicator visible on hover */}
            <GripVertical className="w-2.5 h-2.5 -ml-1 text-fg-light-subtle/50 dark:text-fg-dark-subtle/50 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />

            {org.avatar_url ? (
              <img
                src={org.avatar_url}
                alt={org.login}
                className="w-3.5 h-3.5 rounded-sm object-cover shrink-0 pointer-events-none"
              />
            ) : (
              <Building2 className="w-3.5 h-3.5 opacity-70 shrink-0 pointer-events-none" />
            )}
            <span className="leading-none pointer-events-none">{org.login}</span>
          </div>
        );
      })}
    </div>
  );
}

