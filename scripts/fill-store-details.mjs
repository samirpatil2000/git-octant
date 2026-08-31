import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const STORE_ASSETS = path.resolve(ROOT, 'store-assets');

async function fillStoreDetails() {
  const portFilePath =
    process.env.CHROME_DEVTOOLS_PORT_FILE ||
    path.join(os.homedir(), 'Library/Application Support/Google/Chrome/DevToolsActivePort');
  const lines = fs.readFileSync(portFilePath, 'utf8').trim().split('\n');
  const port = lines[0].trim();
  const wsPath = lines[1]?.trim() || '';
  const wsEndpoint = `ws://127.0.0.1:${port}${wsPath}`;

  const browser = await puppeteer.connect({
    browserWSEndpoint: wsEndpoint,
    defaultViewport: null,
  });

  const pages = await browser.pages();
  const devPage = pages.find((p) => p.url().includes('webstore/devconsole') && p.url().includes('/edit'));
  if (!devPage) {
    console.error('Item edit page not found');
    process.exit(1);
  }

  await devPage.bringToFront();
  console.log(`Connected to edit page: ${devPage.url()}`);

  // Description text
  const descriptionText = `GitOctant gives developers an instant, high-signal overview of what is happening across all GitHub repositories they actively work on — across personal accounts and organizations.

Designed with an Apple / Steve Jobs + Linear design philosophy: calm monochrome typography, high signal-to-noise ratio, zero clutter, and instantaneous performance.

Key Features:
• Top 5 Personal Pushes: Tracks and deduplicates the 5 most recent repositories you personally pushed code to, sorted strictly newest-first.
• Needs Your Attention: Action items for PRs needing changes, review requests, failing CI checks, and merge conflicts.
• My Open Pull Requests: Real-time overview of all PRs you authored across all organizations.
• Personal Activity Timeline: Chronological developer activity stream grouped by Today, Yesterday, and Earlier.
• Multi-Organization Intelligence: Automatically discovers and filters across all GitHub organizations you belong to.
• Command Palette (⌘K / Ctrl+K): Fast fuzzy search across all repositories, PRs, and quick actions.
• Dual Surfaces: Accessible via a compact toolbar popup (560px) and an expanded New Tab Cockpit dashboard with Dark, Light, and System theme support.

Privacy & Security:
• 100% Local Storage: Personal Access Tokens are stored strictly on your local device (chrome.storage.local).
• Zero Telemetry: No third-party tracking, analytics, or external servers.
• Direct Communication: Communicates directly and exclusively with official GitHub REST APIs (https://api.github.com).
• Read-Only Mode: Operates solely with read-only permissions — never modifies your code or repositories.`;

  // 1. Fill Description Textarea
  console.log('1. Filling Description...');
  await devPage.waitForSelector('textarea');
  await devPage.evaluate((desc) => {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.value = desc;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, descriptionText);

  // 2. Select Category (Developer Tools)
  console.log('2. Selecting Category...');
  try {
    // Click category dropdown
    const categoryDropdowns = await devPage.$$('mat-select, div[role="combobox"], select, [aria-label*="Category"], .mat-mdc-select');
    for (const dd of categoryDropdowns) {
      await dd.click().catch(() => {});
      await new Promise((r) => setTimeout(r, 400));
      // Look for Developer Tools option
      const options = await devPage.$$('mat-option, [role="option"], option');
      for (const opt of options) {
        const text = await devPage.evaluate((el) => el.textContent?.trim(), opt);
        if (text?.includes('Developer Tools') || text?.includes('Developer') || text?.includes('Workflow')) {
          await opt.click().catch(() => {});
          console.log(`   ✓ Selected category: ${text}`);
          break;
        }
      }
    }
  } catch (err) {
    console.log('Category select note:', err.message);
  }

  // 3. Upload Graphic Assets
  console.log('3. Uploading Graphic Assets...');
  const fileInputs = await devPage.$$('input[type="file"]');
  console.log(`Found ${fileInputs.length} file upload inputs on page.`);

  const iconPath = path.join(STORE_ASSETS, 'icon-128.png');
  const promoSmallPath = path.join(STORE_ASSETS, 'promo_small_440x280.png');
  const promoMarqueePath = path.join(STORE_ASSETS, 'promo_marquee_1400x560.png');
  const screenshot1Path = path.join(STORE_ASSETS, 'screenshot_1_cockpit_dark.png');
  const screenshot2Path = path.join(STORE_ASSETS, 'screenshot_2_cockpit_light.png');
  const screenshot3Path = path.join(STORE_ASSETS, 'screenshot_3_token_auth.png');

  // Assign files to available inputs
  if (fileInputs[0] && fs.existsSync(iconPath)) {
    console.log('   Uploading Store Icon (128x128)...');
    await fileInputs[0].uploadFile(iconPath).catch(() => {});
  }

  if (fileInputs[1] && fs.existsSync(screenshot1Path)) {
    console.log('   Uploading Screenshot 1...');
    await fileInputs[1].uploadFile(screenshot1Path).catch(() => {});
  }

  if (fileInputs[2] && fs.existsSync(promoSmallPath)) {
    console.log('   Uploading Small Promo Tile (440x280)...');
    await fileInputs[2].uploadFile(promoSmallPath).catch(() => {});
  }

  if (fileInputs[3] && fs.existsSync(promoMarqueePath)) {
    console.log('   Uploading Marquee Promo Banner (1400x560)...');
    await fileInputs[3].uploadFile(promoMarqueePath).catch(() => {});
  }

  // Click "Save draft"
  console.log('4. Clicking "Save draft"...');
  await devPage.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const saveBtn = buttons.find((b) => b.innerText?.trim() === 'Save draft');
    if (saveBtn) saveBtn.click();
  });

  await new Promise((r) => setTimeout(r, 4000));
  await devPage.screenshot({ path: path.join(STORE_ASSETS, 'devconsole_after_saving_listing.png') });
  console.log('📸 Saved screenshot: devconsole_after_saving_listing.png');

  // 5. Navigate to Privacy tab
  console.log('5. Navigating to Privacy tab...');
  const clickedPrivacy = await devPage.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a, button, [role="tab"], div'));
    const privLink = links.find((l) => l.innerText?.trim() === 'Privacy');
    if (privLink) {
      privLink.click();
      return true;
    }
    return false;
  });

  console.log(`Clicked Privacy Tab: ${clickedPrivacy}`);
  await new Promise((r) => setTimeout(r, 3000));

  await devPage.screenshot({ path: path.join(STORE_ASSETS, 'devconsole_privacy_tab.png') });
  console.log('📸 Saved screenshot: devconsole_privacy_tab.png');
}

fillStoreDetails().catch((e) => {
  console.error(e);
  process.exit(1);
});
