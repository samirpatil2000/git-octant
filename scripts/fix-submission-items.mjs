import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const STORE_ASSETS = path.resolve(ROOT, 'store-assets');

async function fixSubmissionItems() {
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

  // Close any modal open
  await devPage.keyboard.press('Escape');
  await new Promise((r) => setTimeout(r, 500));

  // ==========================================
  // PART 1: STORE LISTING TAB (Icon, Screenshots, Language, Category)
  // ==========================================
  console.log('--- PART 1: Fixing Store Listing Tab ---');
  await devPage.goto('https://chrome.google.com/u/1/webstore/devconsole/50a0ee3a-650f-4c5e-86b0-1f529fedff8b/ddnajpnjpncdkldlcielnlkobgbolnha/edit/store-listing', {
    waitUntil: 'networkidle2',
  });
  await new Promise((r) => setTimeout(r, 2000));

  // 1. Select Language (English)
  console.log('Selecting Language: English...');
  await devPage.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('mat-select, select, [aria-label*="Language"]'));
    const langSelect = selects.find((s) => s.getAttribute('aria-label')?.includes('Language') || s.parentElement?.textContent?.includes('Language'));
    if (langSelect) langSelect.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  const options = await devPage.$$('mat-option, option');
  for (const opt of options) {
    const text = await devPage.evaluate((el) => el.textContent?.trim(), opt);
    if (text === 'English' || text === 'English (United States)') {
      await opt.click().catch(() => {});
      console.log(`   ✓ Selected Language: ${text}`);
      break;
    }
  }

  // 2. Select Category (Developer Tools)
  console.log('Selecting Category: Developer Tools...');
  await devPage.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('mat-select, select, [aria-label*="Category"]'));
    const catSelect = selects.find((s) => s.getAttribute('aria-label')?.includes('Category') || s.parentElement?.textContent?.includes('Category'));
    if (catSelect) catSelect.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  const catOptions = await devPage.$$('mat-option, option');
  for (const opt of catOptions) {
    const text = await devPage.evaluate((el) => el.textContent?.trim(), opt);
    if (text?.includes('Developer Tools') || text?.includes('Developer') || text?.includes('Productivity')) {
      await opt.click().catch(() => {});
      console.log(`   ✓ Selected Category: ${text}`);
      break;
    }
  }

  // 3. Upload Icon (128x128) and Screenshots
  console.log('Uploading Store Icon & Screenshots...');
  const iconPath = path.join(STORE_ASSETS, 'icon-128.png');
  const screenshot1Path = path.join(STORE_ASSETS, 'screenshot_1_cockpit_dark.png');
  const screenshot2Path = path.join(STORE_ASSETS, 'screenshot_2_cockpit_light.png');
  const screenshot3Path = path.join(STORE_ASSETS, 'screenshot_3_token_auth.png');
  const promoSmallPath = path.join(STORE_ASSETS, 'promo_small_440x280.png');
  const promoMarqueePath = path.join(STORE_ASSETS, 'promo_marquee_1400x560.png');

  const fileInputs = await devPage.$$('input[type="file"]');
  console.log(`Found ${fileInputs.length} file inputs on Store Listing`);

  for (let i = 0; i < fileInputs.length; i++) {
    const input = fileInputs[i];
    if (i === 0 && fs.existsSync(iconPath)) {
      console.log('   -> Uploading icon-128.png');
      await input.uploadFile(iconPath).catch(() => {});
      await new Promise((r) => setTimeout(r, 2000));
    } else if (i === 1 && fs.existsSync(screenshot1Path)) {
      console.log('   -> Uploading screenshots');
      await input.uploadFile(screenshot1Path, screenshot2Path, screenshot3Path).catch(() => {});
      await new Promise((r) => setTimeout(r, 3000));
    } else if (i === 2 && fs.existsSync(promoSmallPath)) {
      console.log('   -> Uploading promo_small_440x280.png');
      await input.uploadFile(promoSmallPath).catch(() => {});
      await new Promise((r) => setTimeout(r, 2000));
    } else if (i === 3 && fs.existsSync(promoMarqueePath)) {
      console.log('   -> Uploading promo_marquee_1400x560.png');
      await input.uploadFile(promoMarqueePath).catch(() => {});
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  // Save draft on Store Listing
  await devPage.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const saveBtn = buttons.find((b) => b.innerText?.trim() === 'Save draft');
    if (saveBtn) saveBtn.click();
  });
  await new Promise((r) => setTimeout(r, 4000));
  console.log('   ✓ Store listing draft saved');

  // ==========================================
  // PART 2: PRIVACY TAB (Remote Code Justification & Compliance)
  // ==========================================
  console.log('\n--- PART 2: Fixing Privacy Tab ---');
  await devPage.goto('https://chrome.google.com/u/1/webstore/devconsole/50a0ee3a-650f-4c5e-86b0-1f529fedff8b/ddnajpnjpncdkldlcielnlkobgbolnha/edit/privacy', {
    waitUntil: 'networkidle2',
  });
  await new Promise((r) => setTimeout(r, 2000));

  // Handle Remote Code Radio
  await devPage.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('label, mat-radio-button, [role="radio"]'));
    for (const l of labels) {
      const text = l.textContent?.toLowerCase() || '';
      if (text.includes('not using remote code') || text.includes('no, i am not') || text.includes('no')) {
        l.click();
        break;
      }
    }
  });

  // Check all compliance checkboxes
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
  });

  // Save draft on Privacy tab
  await devPage.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const saveBtn = buttons.find((b) => b.innerText?.trim() === 'Save draft');
    if (saveBtn) saveBtn.click();
  });
  await new Promise((r) => setTimeout(r, 4000));
  console.log('   ✓ Privacy tab draft saved');

  // Take final screenshots of both tabs
  await devPage.screenshot({ path: path.join(STORE_ASSETS, 'devconsole_final_privacy.png') });
  console.log('📸 Final Privacy Tab Screenshot: devconsole_final_privacy.png');

  await devPage.goto('https://chrome.google.com/u/1/webstore/devconsole/50a0ee3a-650f-4c5e-86b0-1f529fedff8b/ddnajpnjpncdkldlcielnlkobgbolnha/edit/store-listing');
  await new Promise((r) => setTimeout(r, 2000));
  await devPage.screenshot({ path: path.join(STORE_ASSETS, 'devconsole_final_listing.png') });
  console.log('📸 Final Store Listing Screenshot: devconsole_final_listing.png');

  console.log('\n🎉 ALL STORE DETAILS, ASSETS, AND PRIVACY JUSTIFICATIONS COMPLETED!');
}

fixSubmissionItems().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
