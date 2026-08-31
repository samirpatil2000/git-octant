import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const STORE_ASSETS = path.resolve(ROOT, 'store-assets');

async function automateStoreListing() {
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
  const devPage = pages.find((p) => p.url().includes('webstore/devconsole'));
  if (!devPage) {
    console.error('DevConsole page not found');
    process.exit(1);
  }

  await devPage.bringToFront();
  console.log(`Current URL: ${devPage.url()}`);

  console.log('Waiting for item edit page to load...');
  await new Promise((r) => setTimeout(r, 4000));

  const currentUrl = devPage.url();
  console.log(`Page URL after upload processing: ${currentUrl}`);

  await devPage.screenshot({ path: path.join(STORE_ASSETS, 'devconsole_edit_page.png') });
  console.log('📸 Saved screenshot: devconsole_edit_page.png');

  // Inspect elements on page
  const pageState = await devPage.evaluate(() => {
    return {
      title: document.title,
      inputs: Array.from(document.querySelectorAll('input, textarea, select')).map((el) => ({
        tag: el.tagName,
        type: el.type,
        id: el.id,
        name: el.name,
        placeholder: el.placeholder,
        ariaLabel: el.getAttribute('aria-label'),
      })),
      buttons: Array.from(document.querySelectorAll('button')).map((b) => b.innerText?.trim()).filter(Boolean),
      links: Array.from(document.querySelectorAll('a, [role="tab"]')).map((a) => a.innerText?.trim()).filter(Boolean),
    };
  });

  console.log('Page Structure Summary:', JSON.stringify(pageState, null, 2));
}

automateStoreListing().catch((e) => {
  console.error(e);
  process.exit(1);
});
