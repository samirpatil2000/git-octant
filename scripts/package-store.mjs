import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const DIST = path.resolve(ROOT, 'dist');
const STORE_ASSETS = path.resolve(ROOT, 'store-assets');
const ZIP_PATH = path.resolve(ROOT, 'github-command-center.zip');

if (!fs.existsSync(STORE_ASSETS)) {
  fs.mkdirSync(STORE_ASSETS, { recursive: true });
}

console.log('📦 1. Building production extension...');
execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });

console.log('📦 2. Creating Chrome Web Store ZIP archive...');
if (fs.existsSync(ZIP_PATH)) {
  fs.unlinkSync(ZIP_PATH);
}

// Create ZIP from dist/ contents
execSync(`cd "${DIST}" && zip -r "${ZIP_PATH}" . -x "*.DS_Store"`, { stdio: 'inherit' });
console.log(`✅ ZIP package created: ${ZIP_PATH} (${(fs.statSync(ZIP_PATH).size / 1024).toFixed(1)} KB)`);

// Prepare store copy description
const storeCopy = `# GitHub Command Center — Chrome Web Store Listing

## Title
GitHub Command Center

## Summary (Max 132 chars)
A refined personal developer cockpit for all your GitHub repositories, personal pushes, PRs, and multi-organization activity.

## Detailed Description
GitHub Command Center gives developers an instant, high-signal overview of what is happening across all GitHub repositories they actively work on — across personal accounts and organizations.

Designed with an Apple / Steve Jobs + Linear design philosophy: calm monochrome typography, high signal-to-noise ratio, zero clutter, and instantaneous performance.

### Key Features:
• 🚀 Top 5 Personal Pushes: Tracks and deduplicates the 5 most recent repositories you personally pushed code to, sorted strictly newest-first.
• ⚠️ Needs Your Attention: Action items for PRs needing changes, review requests, failing CI checks, and merge conflicts.
• 🌿 My Open Pull Requests: Real-time overview of all PRs you authored across all organizations.
• ⏱️ Personal Activity Timeline: Chronological developer activity stream grouped by Today, Yesterday, and Earlier.
• 🏢 Multi-Organization Intelligence: Automatically discovers and filters across all GitHub organizations you belong to.
• ⌨️ Command Palette (⌘K / Ctrl+K): Fast fuzzy search across all repositories, PRs, and quick actions.
• 🌓 Dual Surfaces: Accessible via a compact toolbar popup (560px) and an expanded New Tab Cockpit dashboard with Dark, Light, and System theme support.

### Privacy & Security:
• 100% Local Storage: Personal Access Tokens are stored strictly on your local device (chrome.storage.local).
• Zero Telemetry: No third-party tracking, analytics, or external servers.
• Direct Communication: Communicates directly and exclusively with official GitHub REST APIs (https://api.github.com).
• Read-Only Mode: Operates solely with read-only permissions — never modifies your code or repositories.

## Category
Developer Tools / Workflow & Productivity

## Permissions Justification
• storage: Required to securely store user settings, theme preference, and Personal Access Token locally on the user's machine.
• alarms: Required for periodic background sync and badge count updates.
• https://api.github.com/*: Required to fetch user repository, event, push, and pull request information from the official GitHub API.
`;

fs.writeFileSync(path.join(STORE_ASSETS, 'store-listing.txt'), storeCopy);
console.log(`✅ Store listing copy generated: ${path.join(STORE_ASSETS, 'store-listing.txt')}`);
