# GitHub Command Center — Chrome Extension

> A refined personal developer cockpit that instantly reveals what is happening across all GitHub repositories you actively work on — across personal accounts and organizations.

Designed with an **Apple / Steve Jobs + Linear + Raycast** philosophy: calm, monochrome-first typography, high signal-to-noise ratio, zero clutter, and instantaneous performance.

---

## Key Features

### 1. 🚀 Latest Personal Pushes (Core Feature)
* Shows the **latest 5 unique repositories you personally pushed to**, sorted strictly newest-first by your own push timestamp.
* Deduplicates multiple pushes to the same repository.
* Displays repository name, owner/organization tag, visibility badge, active branch, commit message, shortened commit SHA (7 chars), push relative timestamp, commit count, and language indicator.
* Quick-click direct targets: click repository to open repo, click commit SHA to open commit, click branch chip to open branch tree.

### 2. ⚠️ PRs Requiring Your Attention
* High-signal alerts for pull requests requiring action:
  * **Changes requested**: Reviewer requested changes on your PR.
  * **Review requested**: You were added to `requested_reviewers`.
  * **Checks failing**: CI status checks or workflow runs failed.
  * **Merge conflicts**: Conflicts preventing merge.
  * **Ready to merge**: Approved with all checks passing.

### 3. 🌿 My Open Pull Requests
* All active PRs authored by you across all repositories and organizations.
* Displays draft / ready state, base $\leftarrow$ head branches, review state, CI checks, comment counts, diff stats, and labels.

### 4. ⏱️ Recent PR & Push Activity Timeline
* Chronological developer activity stream grouped by **Today**, **Yesterday**, and **Earlier**.
* Records pushed commits, opened PRs, submitted reviews, approved PRs, and merged branches.

### 5. 🏢 Multi-Organization Intelligence & Filtering
* Automatically discovers all organizations your account has access to.
* Instant filter bar: **All**, **Personal**, or specific organization views.

### 6. ⌨️ Global Command Palette (`⌘K` / `Ctrl+K`)
* Lightning-fast fuzzy search across all repositories, open PRs, action items, and organizations.
* Quick actions: Open GitHub, refresh data, switch theme (Dark / Light / System), open settings.
* Full keyboard navigation (Arrow keys, Enter, Escape).

### 7. 💻 Dual Surface Experience
* **Popup Window**: Fast, 560px compact popup accessible from the browser toolbar.
* **New Tab Cockpit**: Optional full-screen dashboard with high-level metric summaries and expanded multi-column layout.

---

## 🔒 Security & Privacy Model

* **Local Storage Only**: Personal Access Tokens (PAT) are stored strictly on your local device in `chrome.storage.local`.
* **Zero Telemetry**: No tracking, no external analytics, no third-party servers.
* **Direct Communication**: Communicates directly and exclusively with official GitHub APIs (`https://api.github.com`).
* **Token Redaction**: Tokens are never printed, logged, or exposed in errors.
* **Read-Only Minimum Permissions**: Operates in read-only mode — never modifies your repositories, PRs, or settings.

---

## 🔑 GitHub Personal Access Token (PAT) Setup

Create a **Fine-grained Personal Access Token** or Classic PAT on GitHub:

1. Go to **GitHub Settings** $\rightarrow$ **Developer Settings** $\rightarrow$ [**Personal Access Tokens**](https://github.com/settings/tokens?type=beta).
2. Click **Generate new token**.
3. Under **Repository access**, select **All repositories** (or select specific repositories).
4. Minimum recommended permissions (Read-only):
   * **Commit statuses**: Read-only
   * **Contents**: Read-only
   * **Metadata**: Read-only (mandatory)
   * **Pull requests**: Read-only
   * **Organization permissions $\rightarrow$ Members**: Read-only
5. Paste your token into the extension Settings and click **Test Connection**.

---

## 🛠️ Installation & Chrome Setup

### 1. Build the Extension
```bash
# Install dependencies
npm install

# Build extension
npm run build
```

### 2. Load into Chrome
1. Open Google Chrome and navigate to `chrome://extensions`.
2. Toggle **Developer mode** in the top right corner.
3. Click **Load unpacked** in the top left.
4. Select the `dist/` folder inside this project directory (`github-command-center/dist`).
5. Pin **GitHub Command Center** to your browser toolbar.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `⌘K` or `Ctrl+K` | Open Global Command Palette & Search |
| `R` | Refresh GitHub Data |
| `,` (Comma) | Open Settings & Preferences |
| `1` – `5` | Open Top 1–5 Pushed Repositories directly |
| `Esc` | Dismiss Modal / Command Palette |

---

## 🧪 Testing

### Automated Unit Tests
```bash
# Run Vitest test suite
npm run test
```

### Real Browser E2E Testing
```bash
# Run automated Chrome browser validation with visual screenshots
GITHUB_TEST_TOKEN="ghp_your_pat_here" npm run test:e2e
```

---

## 📁 Architecture

```text
github-command-center/
├── src/
│   ├── api/             # Resilient GitHub REST API client & endpoints
│   │   ├── client.ts    # Fetch client with rate limiting & error handling
│   │   ├── users.ts     # User profile & token validation
│   │   ├── repos.ts     # Repository details & commit lookups
│   │   ├── pulls.ts     # PR search, review states & CI checks
│   │   ├── events.ts    # User push events & activity feeds
│   │   └── organizations.ts # Discovered organizations
│   ├── lib/             # Core business logic & algorithms
│   │   ├── push-aggregator.ts # Top 5 personal pushes algorithm
│   │   ├── attention.ts # PR attention classification engine
│   │   ├── activity.ts  # Chronological activity timeline generator
│   │   ├── formatters.ts# Relative timestamps, SHAs, language colors
│   │   ├── storage.ts   # Type-safe chrome.storage.local wrapper
│   │   ├── theme.ts     # Light / Dark / System theme engine
│   │   └── mock-data.ts # High-fidelity demo data
│   ├── components/      # Apple-inspired UI component system
│   │   ├── Header.tsx
│   │   ├── LatestPushes.tsx
│   │   ├── AttentionSection.tsx
│   │   ├── PullRequestsSection.tsx
│   │   ├── ActivityTimeline.tsx
│   │   ├── RepoGrid.tsx
│   │   ├── CommandPalette.tsx
│   │   ├── SettingsModal.tsx
│   │   ├── OnboardingModal.tsx
│   │   └── OrgFilter.tsx
│   ├── popup/           # Extension popup application
│   ├── newtab/          # Expanded new tab cockpit dashboard
│   ├── background/      # Service worker for background sync & badge alerts
│   └── styles/          # Tailwind design system & SF typography
├── public/              # Manifest V3 & PNG icons (16, 32, 48, 128)
├── test/                # Unit tests & browser automation E2E suites
└── scripts/             # Multi-target build and icon generation scripts
```

---

## License

MIT
