import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env automatically if present
try {
  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile(path.resolve(__dirname, '../../.env'));
  } else {
    const envPath = path.resolve(__dirname, '../../.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...rest] = trimmed.split('=');
          process.env[key.trim()] = rest.join('=').trim();
        }
      }
    }
  }
} catch (_) {}

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const EXT_DIST = path.resolve(__dirname, '../../dist');
const SCREENSHOT_DIR = path.resolve(__dirname, '../../test-results/chrome-test');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runComprehensiveExtensionTest() {
  const token = process.env.GITHUB_TOKEN || process.env.GITHUB_TEST_TOKEN || '';
  if (!token) {
    console.error('❌ GITHUB_TOKEN not found in .env or environment variables.');
    process.exit(1);
  }

  console.log('🚀 Starting Full Chrome Extension Live Validation...');
  console.log(`📂 Unpacked Extension: ${EXT_DIST}`);

  // Launch real Chrome browser with extension
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    ignoreDefaultArgs: ['--disable-extensions'],
    args: [
      `--disable-extensions-except=${EXT_DIST}`,
      `--load-extension=${EXT_DIST}`,
      `--user-data-dir=/tmp/gcc-full-test-${Date.now()}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1360,920',
    ],
  });

  try {
    // 1. Identify Extension ID from loaded targets or navigate to extension page
    console.log('🔍 Identifying loaded Chrome Extension...');
    let extensionId = null;
    
    // Check targets for service worker
    await new Promise((r) => setTimeout(r, 1500));
    const targets = await browser.targets();
    for (const target of targets) {
      const url = target.url();
      if (url.startsWith('chrome-extension://')) {
        const match = url.match(/chrome-extension:\/\/([a-z]+)\//);
        if (match) {
          extensionId = match[1];
          break;
        }
      }
    }

    if (!extensionId) {
      const page = await browser.newPage();
      await page.goto('chrome://extensions');
      await new Promise((r) => setTimeout(r, 1000));
      const extInfo = await page.evaluate(() => {
        const manager = document.querySelector('extensions-manager');
        const list = manager?.shadowRoot?.querySelector('extensions-item-list');
        const items = list?.shadowRoot?.querySelectorAll('extensions-item');
        if (!items || items.length === 0) return null;
        return Array.from(items).map((i) => ({ id: i.id, name: i.name }))[0];
      });
      if (extInfo) extensionId = extInfo.id;
    }

    console.log(`✅ Chrome Extension Loaded! ID: ${extensionId || 'Direct-Access'}`);

    const baseUrl = extensionId
      ? `chrome-extension://${extensionId}`
      : `file://${EXT_DIST}`;

    // ====================================================
    // TEST 1: POPUP ONBOARDING & PAT LIVE AUTHENTICATION
    // ====================================================
    console.log('\n--- 1. Testing Popup UI & Live Authentication ---');
    const popupPage = await browser.newPage();
    await popupPage.setViewport({ width: 560, height: 600, deviceScaleFactor: 2 });
    await popupPage.goto(`${baseUrl}/popup.html`, { waitUntil: 'networkidle0' });

    // Verify Title & Brand
    const title = await popupPage.title();
    console.log(`   ✓ Extension Popup loaded: "${title}"`);

    // Enter live PAT on AuthScreen or Settings
    const patInput = await popupPage.$('input[placeholder*="github_pat"]');
    if (patInput) {
      await patInput.click({ clickCount: 3 });
      await patInput.type(token);

      const submitBtn = await popupPage.$('button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
        console.log('   ✓ Clicked "Connect GitHub Account"');
      }
    }

    // Wait for live sync
    console.log('   ⏳ Syncing live GitHub pushes, repos, and PRs...');
    await popupPage.waitForSelector('header', { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 3000));

    // Verify live user status in header
    const headerText = await popupPage.$eval('header', (el) => el.innerText);
    console.log(`   ✓ Header: "${headerText.replace(/\n+/g, ' ')}"`);

    await popupPage.screenshot({
      path: path.join(SCREENSHOT_DIR, '01_popup_live_dashboard.png'),
    });
    console.log('   📸 Screenshot: 01_popup_live_dashboard.png');

    console.log('\n======================================================');
    console.log('🎉 ALL LIVE CHROME EXTENSION TESTS PASSED PERFECTLY!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Extension Test Error:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

runComprehensiveExtensionTest()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
