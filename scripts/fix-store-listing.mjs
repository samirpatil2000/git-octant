import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const STORE_ASSETS = path.resolve(ROOT, 'store-assets');

async function fixStoreListing() {
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
  let devPage = pages.find((p) => p.url().includes('webstore/devconsole'));
  if (!devPage) {
    devPage = await browser.newPage();
  }

  const editUrl = 'https://chrome.google.com/u/1/webstore/devconsole/50a0ee3a-650f-4c5e-86b0-1f529fedff8b/ddnajpnjpncdkldlcielnlkobgbolnha/edit';
  await devPage.goto(editUrl, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 2000));

  // 1. Click "Store listing" on left sidebar
  await devPage.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a, button, [role="tab"], div'));
    const link = links.find((l) => l.innerText?.trim() === 'Store listing');
    if (link) link.click();
  });
  await new Promise((r) => setTimeout(r, 1500));

  // 2. Select Language
  console.log('Selecting Language: English...');
  await devPage.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('mat-select, select, div[role="combobox"]'));
    if (selects[1]) selects[1].click();
  });
  await new Promise((r) => setTimeout(r, 600));

  await devPage.evaluate(() => {
    const options = Array.from(document.querySelectorAll('mat-option, [role="option"], option'));
    const eng = options.find((o) => o.textContent?.trim().startsWith('English'));
    if (eng) eng.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  // 3. Select Category
  console.log('Selecting Category: Developer Tools...');
  await devPage.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('mat-select, select, div[role="combobox"]'));
    if (selects[0]) selects[0].click();
  });
  await new Promise((r) => setTimeout(r, 600));

  await devPage.evaluate(() => {
    const options = Array.from(document.querySelectorAll('mat-option, [role="option"], option'));
    const dev = options.find((o) => o.textContent?.trim().includes('Developer'));
    if (dev) dev.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  // 4. File uploads
  const fileInputs = await devPage.$$('input[type="file"]');
  console.log(`Found ${fileInputs.length} file inputs on Store Listing.`);

  const iconPath = path.join(STORE_ASSETS, 'icon-128.png');
  const screenshot1Path = path.join(STORE_ASSETS, 'screenshot_1_cockpit_dark.png');
  const promoSmallPath = path.join(STORE_ASSETS, 'promo_small_440x280.png');
  const promoMarqueePath = path.join(STORE_ASSETS, 'promo_marquee_1400x560.png');

  if (fileInputs[0]) {
    console.log('Uploading Icon (128x128)...');
    await fileInputs[0].uploadFile(iconPath).catch((e) => console.log('icon err:', e.message));
    await new Promise((r) => setTimeout(r, 2000));
  }

  if (fileInputs[1]) {
    console.log('Uploading Screenshot 1 (1280x800)...');
    await fileInputs[1].uploadFile(screenshot1Path).catch((e) => console.log('screenshot err:', e.message));
    await new Promise((r) => setTimeout(r, 3000));
  }

  if (fileInputs[2]) {
    console.log('Uploading Small Promo Tile (440x280)...');
    await fileInputs[2].uploadFile(promoSmallPath).catch((e) => console.log('promo small err:', e.message));
    await new Promise((r) => setTimeout(r, 2000));
  }

  if (fileInputs[3]) {
    console.log('Uploading Marquee Banner (1400x560)...');
    await fileInputs[3].uploadFile(promoMarqueePath).catch((e) => console.log('marquee err:', e.message));
    await new Promise((r) => setTimeout(r, 2000));
  }

  // Save draft
  console.log('Saving Draft...');
  await devPage.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const saveBtn = buttons.find((b) => b.innerText?.trim() === 'Save draft');
    if (saveBtn) saveBtn.click();
  });

  await new Promise((r) => setTimeout(r, 4000));
  await devPage.screenshot({ path: path.join(STORE_ASSETS, 'devconsole_store_listing_complete.png') });
  console.log('📸 Saved screenshot: devconsole_store_listing_complete.png');
}

fixStoreListing().catch((e) => {
  console.error(e);
  process.exit(1);
});
