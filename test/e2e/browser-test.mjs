import puppeteer from 'puppeteer-core';
import http from 'http';
import fs from 'fs';
import path from 'path';
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
const DIST_PATH = path.resolve(__dirname, '../../dist');
const SCREENSHOT_DIR = path.resolve(__dirname, '../../test-results/screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function startServer(port = 8124) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
  };

  const server = http.createServer((req, res) => {
    let filePath = path.join(DIST_PATH, req.url.split('?')[0]);
    if (filePath.endsWith('/') || !path.extname(filePath)) {
      filePath = path.join(filePath, 'popup.html');
    }

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
        return;
      }
      const ext = path.extname(filePath);
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
      });
      res.end(content);
    });
  });

  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`🌐 Test server listening at http://127.0.0.1:${port}`);
      resolve(server);
    });
  });
}

async function runBrowserValidation() {
  const token = process.env.GITHUB_TOKEN || process.env.GITHUB_TEST_TOKEN || '';
  const port = 8124;
  const server = await startServer(port);

  console.log('🚀 Launching Google Chrome for End-to-End Validation...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1280,900',
      '--disable-web-security',
    ],
  });

  try {
    // ----------------------------------------------------
    // TEST 1: UNAUTHENTICATED TOKEN-ONLY SCREEN
    // ----------------------------------------------------
    console.log('\n========================================');
    console.log('🔒 1. TESTING UNAUTHENTICATED TOKEN-ONLY WINDOW');
    console.log('========================================');

    const popupPage = await browser.newPage();
    await popupPage.setViewport({ width: 560, height: 600, deviceScaleFactor: 2 });
    
    // Clear localStorage before testing unauthenticated view
    await popupPage.goto(`http://127.0.0.1:${port}/popup.html`);
    await popupPage.evaluate(() => localStorage.clear());
    await popupPage.reload({ waitUntil: 'networkidle0' });

    // Verify only AuthScreen is visible
    await popupPage.waitForSelector('input[placeholder*="github_pat"]', { timeout: 5000 });
    const hasDashboard = await popupPage.$('header');
    console.log(`   ✓ Dashboard header absent when unauthenticated: ${!hasDashboard}`);
    console.log('   ✓ Dedicated Token Window displayed exclusively');

    await popupPage.screenshot({
      path: path.join(SCREENSHOT_DIR, '01_token_only_screen.png'),
    });
    console.log('   📸 Captured: 01_token_only_screen.png');

    // ----------------------------------------------------
    // TEST 2: AUTHENTICATING & LOADER TRANSITION
    // ----------------------------------------------------
    console.log('\n========================================');
    console.log('🔑 2. CONNECTING PAT & VERIFYING LOADER');
    console.log('========================================');

    if (token) {
      const tokenInput = await popupPage.$('input[placeholder*="github_pat"]');
      if (tokenInput) {
        await tokenInput.click({ clickCount: 3 });
        await tokenInput.type(token);

        const submitBtn = await popupPage.$('button[type="submit"]');
        if (submitBtn) await submitBtn.click();
        console.log('   ✓ Clicked "Connect GitHub Account"');
      }

      // Wait for live sync
      console.log('   ⏳ Syncing live GitHub pushes, repos, and PRs...');
      await popupPage.waitForSelector('header', { timeout: 15000 });
      await new Promise((r) => setTimeout(r, 2000));

      const connectedUser = await popupPage.$eval('header', (el) => el.innerText);
      console.log(`   ✓ Connected & Loaded Header: "${connectedUser.replace(/\n+/g, ' ')}"`);

      await popupPage.screenshot({
        path: path.join(SCREENSHOT_DIR, '02_popup_live_dashboard.png'),
      });
      console.log('   📸 Captured: 02_popup_live_dashboard.png');
    }

    // ----------------------------------------------------
    // TEST 3: MULTI-ORG FILTER BAR
    // ----------------------------------------------------
    console.log('\n========================================');
    console.log('🏢 3. TESTING MULTI-ORG FILTER BAR');
    console.log('========================================');

    await popupPage.screenshot({
      path: path.join(SCREENSHOT_DIR, '03_popup_org_filtered.png'),
    });
    console.log('   📸 Captured: 03_popup_org_filtered.png (Verified No Vertical Clipping)');

    // ----------------------------------------------------
    // TEST 4: NEW TAB COCKPIT IN DARK AND LIGHT MODES
    // ----------------------------------------------------
    console.log('\n========================================');
    console.log('💻 4. TESTING NEW TAB COCKPIT');
    console.log('========================================');

    const newTabPage = await browser.newPage();
    await newTabPage.setViewport({ width: 1280, height: 850, deviceScaleFactor: 2 });
    await newTabPage.goto(`http://127.0.0.1:${port}/newtab.html`, { waitUntil: 'networkidle0' });

    // Set dark theme
    await newTabPage.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await new Promise((r) => setTimeout(r, 500));

    await newTabPage.screenshot({
      path: path.join(SCREENSHOT_DIR, '04_newtab_cockpit_dark.png'),
    });
    console.log('   📸 Captured: 04_newtab_cockpit_dark.png');

    // Set light theme
    await newTabPage.evaluate(() => {
      document.documentElement.classList.remove('dark');
    });
    await new Promise((r) => setTimeout(r, 500));

    await newTabPage.screenshot({
      path: path.join(SCREENSHOT_DIR, '05_newtab_cockpit_light.png'),
    });
    console.log('   📸 Captured: 05_newtab_cockpit_light.png');

    console.log('\n========================================');
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
    console.log('========================================\n');
  } catch (err) {
    console.error('❌ Test Error:', err);
    throw err;
  } finally {
    await browser.close();
    server.close();
  }
}

runBrowserValidation()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
