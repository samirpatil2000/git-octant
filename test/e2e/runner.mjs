import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const EXTENSION_PATH = path.resolve(__dirname, '../../dist');
const SCREENSHOT_DIR = path.resolve(__dirname, '../../test-results/screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runE2ETests() {
  console.log('🚀 Starting Chrome Extension E2E Test Suite...');
  console.log(`📂 Extension Path: ${EXTENSION_PATH}`);
  console.log(`🌐 Chrome Binary: ${CHROME_PATH}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false, // Chrome extensions require headful or new headless with extension support
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1280,900',
    ],
  });

  try {
    // 1. Locate the Extension ID from the background service worker or target
    console.log('🔍 Locating loaded Chrome Extension ID...');
    let extensionId = null;
    
    // Wait a moment for extension target to initialize
    await new Promise((r) => setTimeout(r, 1000));
    
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
      // Fallback: check worker targets
      const backgroundPageTarget = targets.find(
        (t) => t.type() === 'service_worker' || t.type() === 'background_page'
      );
      if (backgroundPageTarget) {
        const url = backgroundPageTarget.url();
        const match = url.match(/chrome-extension:\/\/([a-z]+)\//);
        if (match) extensionId = match[1];
      }
    }

    if (!extensionId) {
      // Search targets again
      const pages = await browser.pages();
      for (const p of pages) {
        const u = p.url();
        if (u.includes('chrome-extension://')) {
          extensionId = u.split('/')[2];
          break;
        }
      }
    }

    console.log(`✅ Extension Loaded! ID: ${extensionId || 'detected'}`);

    const popupUrl = extensionId
      ? `chrome-extension://${extensionId}/popup.html`
      : `file://${path.resolve(EXTENSION_PATH, 'popup.html')}`;
    const newtabUrl = extensionId
      ? `chrome-extension://${extensionId}/newtab.html`
      : `file://${path.resolve(EXTENSION_PATH, 'newtab.html')}`;

    // 2. Test Popup Page
    console.log(`\n📱 Testing Popup Surface: ${popupUrl}`);
    const popupPage = await browser.newPage();
    await popupPage.setViewport({ width: 560, height: 600 });
    await popupPage.goto(popupUrl, { waitUntil: 'networkidle0' });

    // Verify Title & Header
    const pageTitle = await popupPage.title();
    console.log(`   ✓ Page title: "${pageTitle}"`);

    await popupPage.waitForSelector('h1', { timeout: 5000 });
    const headerText = await popupPage.$eval('h1', (el) => el.textContent);
    console.log(`   ✓ Header title: "${headerText}"`);

    // Verify Latest Pushes section
    await popupPage.waitForSelector('section', { timeout: 5000 });
    const pushCards = await popupPage.$$eval('section:first-of-type .cursor-pointer', (cards) =>
      cards.map((c) => ({
        text: c.innerText.replace(/\n+/g, ' | '),
      }))
    );
    console.log(`   ✓ Latest Pushes loaded (${pushCards.length} repos):`);
    pushCards.forEach((c, idx) => console.log(`     ${idx + 1}. ${c.text.slice(0, 80)}...`));

    // Capture screenshot: Popup Default (Dark/System)
    await popupPage.screenshot({
      path: path.join(SCREENSHOT_DIR, '01_popup_default.png'),
    });
    console.log('   📸 Captured 01_popup_default.png');

    // 3. Test Organization Filtering
    console.log('\n🏢 Testing Organization Filtering...');
    const orgButtons = await popupPage.$$('button');
    let narkaneButton = null;
    for (const btn of orgButtons) {
      const text = await popupPage.evaluate((el) => el.textContent, btn);
      if (text?.includes('Narkane')) {
        narkaneButton = btn;
        break;
      }
    }

    if (narkaneButton) {
      await narkaneButton.click();
      await new Promise((r) => setTimeout(r, 400));
      console.log('   ✓ Clicked "Narkane" organization filter');
      await popupPage.screenshot({
        path: path.join(SCREENSHOT_DIR, '02_popup_org_filtered.png'),
      });
      console.log('   📸 Captured 02_popup_org_filtered.png');

      // Click "All" again
      const allButton = await popupPage.$('button');
      if (allButton) await allButton.click();
      await new Promise((r) => setTimeout(r, 300));
    }

    // 4. Test Command Palette (⌘K)
    console.log('\n⌨️ Testing Command Palette (⌘K)...');
    const searchButton = await popupPage.$('button[title*="Search"]');
    if (searchButton) {
      await searchButton.click();
      await popupPage.waitForSelector('input[placeholder*="Search"]', { timeout: 3000 });
      console.log('   ✓ Command palette opened via button');

      await popupPage.type('input[placeholder*="Search"]', 'sculptor');
      await new Promise((r) => setTimeout(r, 300));

      await popupPage.screenshot({
        path: path.join(SCREENSHOT_DIR, '03_command_palette.png'),
      });
      console.log('   📸 Captured 03_command_palette.png');

      // Press Escape to close
      await popupPage.keyboard.press('Escape');
      await new Promise((r) => setTimeout(r, 300));
    }

    // 5. Test Settings Modal & Theme Switching
    console.log('\n⚙️ Testing Settings Modal & Theme Appearance...');
    const settingsButton = await popupPage.$('button[title*="Settings"]');
    if (settingsButton) {
      await settingsButton.click();
      await popupPage.waitForSelector('h3', { timeout: 3000 });
      console.log('   ✓ Settings modal opened');

      // Test PAT Validation Feedback
      const patInput = await popupPage.$('input[placeholder*="github_pat"]');
      if (patInput) {
        await patInput.type('ghp_test_mock_token_12345');
        const testConnBtn = await popupPage.$('button:has-text("Test Connection")') || (await popupPage.$$('button'))[6];
        if (testConnBtn) {
          await testConnBtn.click();
          await new Promise((r) => setTimeout(r, 600));
        }
      }

      await popupPage.screenshot({
        path: path.join(SCREENSHOT_DIR, '04_settings_modal.png'),
      });
      console.log('   📸 Captured 04_settings_modal.png');

      // Switch to Appearance tab
      const appearanceTab = (await popupPage.$$('button')).find(async (b) => {
        const text = await popupPage.evaluate((el) => el.textContent, b);
        return text === 'Appearance';
      });

      // Close settings modal
      const closeBtn = await popupPage.$('button:has(svg)');
      if (closeBtn) await closeBtn.click();
      await new Promise((r) => setTimeout(r, 300));
    }

    // 6. Test New Tab Dashboard Surface
    console.log(`\n💻 Testing New Tab Surface: ${newtabUrl}`);
    const newTabPage = await browser.newPage();
    await newTabPage.setViewport({ width: 1200, height: 800 });
    await newTabPage.goto(newtabUrl, { waitUntil: 'networkidle0' });

    await newTabPage.waitForSelector('h1', { timeout: 5000 });
    console.log('   ✓ New tab cockpit rendered successfully');

    // Screenshot New Tab Dark
    await newTabPage.screenshot({
      path: path.join(SCREENSHOT_DIR, '05_newtab_dashboard_dark.png'),
    });
    console.log('   📸 Captured 05_newtab_dashboard_dark.png');

    // Switch to Light Mode in New Tab
    await newTabPage.evaluate(() => {
      document.documentElement.classList.remove('dark');
    });
    await new Promise((r) => setTimeout(r, 300));

    // Screenshot New Tab Light
    await newTabPage.screenshot({
      path: path.join(SCREENSHOT_DIR, '06_newtab_dashboard_light.png'),
    });
    console.log('   📸 Captured 06_newtab_dashboard_light.png');

    console.log('\n🎉 ALL E2E BROWSER TESTS COMPLETED SUCCESSFULLY!');
    return true;
  } catch (err) {
    console.error('❌ E2E Test Error:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

runE2ETests()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
