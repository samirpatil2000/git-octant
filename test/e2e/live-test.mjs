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
const EXTENSION_PATH = path.resolve(__dirname, '../../dist');
const SCREENSHOT_DIR = path.resolve(__dirname, '../../test-results/screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runLiveE2ETest() {
  const token = process.env.GITHUB_TOKEN || process.env.GITHUB_TEST_TOKEN || '';
  if (!token) {
    console.error('GITHUB_TOKEN environment variable not set in .env or environment.');
    process.exit(1);
  }

  console.log('🚀 Launching Real Chrome with GitOctant Extension...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1280,900',
    ],
  });

  try {
    console.log('🔍 Waiting for extension service worker to register...');
    const workerTarget = await browser.waitForTarget(
      (target) => target.type() === 'service_worker' && target.url().startsWith('chrome-extension://'),
      { timeout: 8000 }
    );

    const extensionUrl = workerTarget.url();
    const extensionId = extensionUrl.split('/')[2];
    console.log(`✅ Loaded Extension ID: ${extensionId}`);

    const popupUrl = `chrome-extension://${extensionId}/popup.html`;

    const page = await browser.newPage();
    await page.setViewport({ width: 560, height: 600 });
    await page.goto(popupUrl, { waitUntil: 'networkidle0' });

    const input = await page.$('input[placeholder*="github_pat"]');
    if (input) {
      await input.click({ clickCount: 3 });
      await input.type(token);

      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) await submitBtn.click();
    }

    await page.waitForSelector('header', { timeout: 15000 });
    console.log('   ✓ Extension live authenticated successfully!');
  } catch (err) {
    console.error('❌ Live Test Failed:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

runLiveE2ETest()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
