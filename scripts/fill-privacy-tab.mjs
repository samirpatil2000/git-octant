import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const STORE_ASSETS = path.resolve(ROOT, 'store-assets');

async function fillPrivacyTab() {
  const portFilePath = '/Users/samirpatil/Library/Application Support/Google/Chrome/DevToolsActivePort';
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
  console.log(`Connected to Privacy tab on: ${devPage.url()}`);

  const singlePurpose = 'Provides an instant developer cockpit displaying the user\'s recent personal GitHub pushes, active pull requests, and review items across personal accounts and organizations.';
  const storageJustification = 'Used exclusively to securely store user settings, theme preferences, and the GitHub Personal Access Token locally on the client.';
  const alarmsJustification = 'Used to schedule background synchronization and update badge counts on the toolbar icon.';
  const hostJustification = 'Direct communication with official GitHub REST APIs (https://api.github.com) to fetch repository metadata, push events, and pull requests on behalf of the user.';

  console.log('1. Filling privacy textareas...');
  await devPage.evaluate((sp, sj, aj, hj) => {
    const textareas = Array.from(document.querySelectorAll('textarea'));
    console.log(`Found ${textareas.length} textareas`);

    if (textareas[0]) {
      textareas[0].value = sp;
      textareas[0].dispatchEvent(new Event('input', { bubbles: true }));
      textareas[0].dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (textareas[1]) {
      textareas[1].value = sj;
      textareas[1].dispatchEvent(new Event('input', { bubbles: true }));
      textareas[1].dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (textareas[2]) {
      textareas[2].value = aj;
      textareas[2].dispatchEvent(new Event('input', { bubbles: true }));
      textareas[2].dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (textareas[3]) {
      textareas[3].value = hj;
      textareas[3].dispatchEvent(new Event('input', { bubbles: true }));
      textareas[3].dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, singlePurpose, storageJustification, alarmsJustification, hostJustification);

  // 2. Check all compliance checkboxes / radios
  console.log('2. Checking compliance checkboxes...');
  await devPage.evaluate(() => {
    const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"], mat-checkbox, [role="checkbox"]'));
    for (const cb of checkboxes) {
      if (cb.type === 'checkbox') {
        if (!cb.checked) {
          cb.click();
        }
      } else {
        cb.click();
      }
    }

    // Also look for radio buttons that say "No" for data collection if present
    const radios = Array.from(document.querySelectorAll('input[type="radio"], mat-radio-button, [role="radio"]'));
    for (const r of radios) {
      const text = r.parentElement?.textContent || '';
      if (text.toLowerCase().includes('do not collect') || text.toLowerCase().includes('no')) {
        r.click();
      }
    }
  });

  await new Promise((r) => setTimeout(r, 1000));

  // 3. Click "Save draft"
  console.log('3. Clicking "Save draft"...');
  await devPage.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const saveBtn = buttons.find((b) => b.innerText?.trim() === 'Save draft');
    if (saveBtn) saveBtn.click();
  });

  await new Promise((r) => setTimeout(r, 4000));
  await devPage.screenshot({ path: path.join(STORE_ASSETS, 'devconsole_privacy_saved.png') });
  console.log('📸 Saved screenshot: devconsole_privacy_saved.png');
}

fillPrivacyTab().catch((e) => {
  console.error(e);
  process.exit(1);
});
