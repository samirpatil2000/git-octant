import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const STORE_ASSETS = path.resolve(ROOT, 'store-assets');

async function checkSubmissionStatus() {
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

  // Click "Why can't I submit?"
  console.log('Clicking "Why can\'t I submit?" button...');
  await devPage.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find((b) => b.innerText?.includes("Why can't I submit"));
    if (btn) btn.click();
  });

  await new Promise((r) => setTimeout(r, 2000));
  await devPage.screenshot({ path: path.join(STORE_ASSETS, 'devconsole_submission_checklist.png') });
  console.log('📸 Saved checklist screenshot: devconsole_submission_checklist.png');

  // Read modal / dialog text
  const checklist = await devPage.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"], mat-dialog-container, .mat-mdc-dialog-container');
    return dialog ? dialog.innerText : 'No dialog found';
  });

  console.log('Submission Checklist:\n', checklist);
}

checkSubmissionStatus().catch((e) => {
  console.error(e);
  process.exit(1);
});
