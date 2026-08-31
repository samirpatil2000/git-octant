import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const ZIP_PATH = path.resolve(ROOT, 'github-command-center.zip');
const STORE_ASSETS = path.resolve(ROOT, 'store-assets');

async function automateUpload() {
  const portFilePath =
    process.env.CHROME_DEVTOOLS_PORT_FILE ||
    path.join(os.homedir(), 'Library/Application Support/Google/Chrome/DevToolsActivePort');
  if (!fs.existsSync(portFilePath)) {
    console.error('DevToolsActivePort not found');
    process.exit(1);
  }

  const lines = fs.readFileSync(portFilePath, 'utf8').trim().split('\n');
  const port = lines[0].trim();
  const wsPath = lines[1]?.trim() || '';
  const wsEndpoint = `ws://127.0.0.1:${port}${wsPath}`;
  console.log(`Connecting to Chrome via: ${wsEndpoint}`);

  const browser = await puppeteer.connect({
    browserWSEndpoint: wsEndpoint,
    defaultViewport: null,
  });

  const pages = await browser.pages();
  let devPage = pages.find((p) => p.url().includes('webstore/devconsole'));
  if (!devPage) {
    devPage = await browser.newPage();
    await devPage.goto('https://chrome.google.com/u/1/webstore/devconsole/50a0ee3a-650f-4c5e-86b0-1f529fedff8b');
  }

  await devPage.bringToFront();
  console.log(`Connected to DevConsole page: ${devPage.url()}`);

  // Screenshot current state to inspect
  const inspectScreenshot = path.join(STORE_ASSETS, 'devconsole_initial.png');
  await devPage.screenshot({ path: inspectScreenshot });
  console.log(`📸 Initial DevConsole screenshot: ${inspectScreenshot}`);

  // Find and click "New item" / "+ Add new item" button
  console.log('Searching for "New item" / "Add new item" button...');
  const clickedNewItem = await devPage.evaluate(() => {
    // Look for button or link with text "New item" or "Add new item"
    const elements = Array.from(document.querySelectorAll('button, a, div[role="button"], span'));
    const target = elements.find((el) => {
      const txt = (el.innerText || el.textContent || '').trim().toLowerCase();
      return txt === 'new item' || txt === '+ new item' || txt === 'add new item' || txt === '+ add new item';
    });
    if (target) {
      target.click();
      return true;
    }
    return false;
  });

  console.log(`Clicked New Item button: ${clickedNewItem}`);
  await new Promise((r) => setTimeout(r, 2000));

  // Screenshot state after clicking new item
  const afterClickScreenshot = path.join(STORE_ASSETS, 'devconsole_after_new_item.png');
  await devPage.screenshot({ path: afterClickScreenshot });
  console.log(`📸 After Click screenshot: ${afterClickScreenshot}`);

  // Look for file input
  console.log('Looking for file input in page or shadow roots...');
  const fileInput = await devPage.$('input[type="file"]');
  if (fileInput) {
    console.log(`Found file input! Uploading ${ZIP_PATH}...`);
    await fileInput.uploadFile(ZIP_PATH);
    console.log('✅ ZIP file uploaded to file input!');
    await new Promise((r) => setTimeout(r, 4000));

    const afterUploadScreenshot = path.join(STORE_ASSETS, 'devconsole_after_upload.png');
    await devPage.screenshot({ path: afterUploadScreenshot });
    console.log(`📸 After Upload screenshot: ${afterUploadScreenshot}`);
  } else {
    console.log('Searching deeper for file input or dropzone...');
    // Inspect DOM structure
    const domSummary = await devPage.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      return {
        inputs: inputs.map((i) => ({ type: i.type, id: i.id, name: i.name, class: i.className })),
        buttons: Array.from(document.querySelectorAll('button')).map((b) => b.innerText?.trim()).filter(Boolean),
        dialogs: Array.from(document.querySelectorAll('[role="dialog"], dialog')).map((d) => d.innerText?.slice(0, 100)),
      };
    });
    console.log('DOM Summary:', JSON.stringify(domSummary, null, 2));
  }
}

automateUpload().catch((e) => {
  console.error('Automation error:', e);
  process.exit(1);
});
