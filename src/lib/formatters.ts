export function formatRelativeTime(dateStringOrTimestamp: string | number | Date): string {
  const date = typeof dateStringOrTimestamp === 'object' && dateStringOrTimestamp instanceof Date
    ? dateStringOrTimestamp
    : new Date(dateStringOrTimestamp);

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (isNaN(diffInSeconds) || diffInSeconds < 0) {
    return 'just now';
  }

  if (diffInSeconds < 45) {
    return 'just now';
  }

  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }

  const days = Math.floor(hours / 24);
  if (days === 1) {
    return 'yesterday';
  }
  if (days < 30) {
    return `${days} days ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return months === 1 ? '1 month ago' : `${months} months ago`;
  }

  const years = Math.floor(months / 12);
  return years === 1 ? '1 year ago' : `${years} years ago`;
}

export function formatTimeOfDay(dateStringOrTimestamp: string | number | Date): string {
  const date = typeof dateStringOrTimestamp === 'object' && dateStringOrTimestamp instanceof Date
    ? dateStringOrTimestamp
    : new Date(dateStringOrTimestamp);

  if (isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function cleanBranchName(ref: string): string {
  if (!ref) return 'main';
  if (ref.startsWith('refs/heads/')) {
    return ref.replace('refs/heads/', '');
  }
  return ref;
}

export function truncateSha(sha: string, length = 7): string {
  if (!sha) return '';
  return sha.slice(0, length);
}

export function getLanguageColor(language: string | null | undefined): string {
  if (!language) return '#8b949e';
  const colors: Record<string, string> = {
    TypeScript: '#3178c6',
    JavaScript: '#f1e05a',
    Python: '#3572A5',
    Rust: '#dea584',
    Go: '#00ADD8',
    HTML: '#e34c26',
    CSS: '#563d7c',
    SCSS: '#c6538c',
    Ruby: '#701516',
    Java: '#b07219',
    'C++': '#f34b7d',
    C: '#555555',
    'C#': '#178600',
    PHP: '#4F5D95',
    Swift: '#F05138',
    Kotlin: '#A97BFF',
    Shell: '#89e051',
    Vue: '#41b883',
    Dart: '#00B4AB',
    Elixir: '#6e4a7e',
    Zig: '#ec915c',
    Lua: '#000080',
  };
  return colors[language] || '#8b949e';
}
