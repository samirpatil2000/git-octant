import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = path.resolve(__dirname, '..');
const STORE_ASSETS = path.resolve(ROOT, 'store-assets');

if (!fs.existsSync(STORE_ASSETS)) {
  fs.mkdirSync(STORE_ASSETS, { recursive: true });
}

async function generateStoreAssets() {
  console.log('🎨 Generating Chrome Web Store promotional and presentation assets (1280x800, 440x280, 1400x560)...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Helper to render HTML card
  async function captureCard(html, width, height, outputPath) {
    await page.setViewport({ width, height, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'load' });
    await page.screenshot({ path: outputPath });
    console.log(`   ✓ Saved: ${path.basename(outputPath)} (${width}x${height})`);
  }

  // 1. Small Promo Tile (440x280)
  const promoSmallHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif; }
        </style>
      </head>
      <body class="m-0 w-[440px] h-[280px] bg-gradient-to-br from-[#0c0e14] to-[#161a24] text-white flex flex-col items-center justify-center p-6 select-none relative overflow-hidden">
        <div class="absolute -top-12 -left-12 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-12 -right-12 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl"></div>
        
        <div class="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-3 shadow-xl backdrop-blur-md">
          <svg class="w-8 h-8 fill-white" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
        </div>
        
        <h1 class="text-xl font-bold tracking-tight text-white">GitHub Command Center</h1>
        <p class="text-xs text-gray-400 mt-1 text-center font-medium">Personal developer cockpit across all repositories</p>
        
        <div class="flex items-center gap-2 mt-4">
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 border border-white/10 text-gray-300">Top 5 Pushes</span>
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 border border-white/10 text-gray-300">Action Items</span>
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 border border-white/10 text-gray-300">Multi-Org</span>
        </div>
      </body>
    </html>
  `;
  await captureCard(promoSmallHtml, 440, 280, path.join(STORE_ASSETS, 'promo_small_440x280.png'));

  // 2. Marquee Banner (1400x560)
  const promoMarqueeHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif; }
        </style>
      </head>
      <body class="m-0 w-[1400px] h-[560px] bg-[#0a0c10] text-white flex items-center justify-between px-20 select-none relative overflow-hidden">
        <div class="absolute -top-32 left-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-32 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl"></div>

        <div class="max-w-xl space-y-4 z-10">
          <div class="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-2xl backdrop-blur-md">
            <svg class="w-9 h-9 fill-white" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
          </div>
          <h1 class="text-4xl font-extrabold tracking-tight">GitHub Command Center</h1>
          <p class="text-lg text-gray-400 font-medium leading-relaxed">
            Instantly see what is happening across all your personal repositories and organizations.
          </p>
          <div class="flex items-center gap-3 pt-2">
            <span class="px-4 py-1.5 rounded-xl text-xs font-semibold bg-white/10 border border-white/10 text-gray-200">🚀 Top 5 Personal Pushes</span>
            <span class="px-4 py-1.5 rounded-xl text-xs font-semibold bg-white/10 border border-white/10 text-gray-200">⚠️ PRs Needing Action</span>
            <span class="px-4 py-1.5 rounded-xl text-xs font-semibold bg-white/10 border border-white/10 text-gray-200">⌨️ ⌘K Command Palette</span>
          </div>
        </div>

        <div class="w-[580px] rounded-2xl border border-white/10 bg-[#12151c] p-5 shadow-2xl space-y-3 z-10">
          <div class="flex items-center justify-between border-b border-white/10 pb-3">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span class="text-xs font-mono font-bold text-gray-200">@samirpatil2000</span>
            </div>
            <span class="text-[11px] text-gray-400">Updated just now</span>
          </div>
          <div class="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-white">Stories25 / 3d-blocking-skills</span>
              <span class="text-[10px] text-gray-400">53m ago</span>
            </div>
            <p class="text-[11px] text-gray-400">Pushed commits to feature/major-revamp</p>
          </div>
          <div class="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-white">OrcheStrat360 / os360-app</span>
              <span class="text-[10px] text-gray-400">23h ago</span>
            </div>
            <p class="text-[11px] text-gray-400">Os360 Frontend</p>
          </div>
        </div>
      </body>
    </html>
  `;
  await captureCard(promoMarqueeHtml, 1400, 560, path.join(STORE_ASSETS, 'promo_marquee_1400x560.png'));

  // 3. Formatted 1280x800 Store Screenshots
  const screenshots = [
    {
      name: 'screenshot_1_cockpit_dark.png',
      src: path.resolve(ROOT, 'test-results/screenshots/04_newtab_cockpit_dark.png'),
      title: 'Full New Tab Cockpit (Dark Mode)',
      desc: 'Complete overview of your personal pushes, action items, open PRs, and chronological activity',
    },
    {
      name: 'screenshot_2_cockpit_light.png',
      src: path.resolve(ROOT, 'test-results/screenshots/05_newtab_cockpit_light.png'),
      title: 'Apple-Inspired Light Mode',
      desc: 'High-contrast monochrome typography with calm status indicators and zero visual noise',
    },
    {
      name: 'screenshot_3_token_auth.png',
      src: path.resolve(ROOT, 'test-results/screenshots/01_token_only_screen.png'),
      title: 'Minimalist Local Authentication',
      desc: '100% local token storage, zero telemetry, direct official GitHub API communication',
    },
  ];

  for (const item of screenshots) {
    if (fs.existsSync(item.src)) {
      const base64Img = fs.readFileSync(item.src).toString('base64');
      const imgHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <script src="https://cdn.tailwindcss.com"></script>
            <style>body { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif; }</style>
          </head>
          <body class="m-0 w-[1280px] h-[800px] bg-[#07090e] flex items-center justify-center p-4 select-none overflow-hidden relative">
            <img src="data:image/png;base64,${base64Img}" class="max-w-full max-h-full rounded-xl shadow-2xl border border-white/10 object-contain" />
          </body>
        </html>
      `;
      await captureCard(imgHtml, 1280, 800, path.join(STORE_ASSETS, item.name));
    }
  }

  // Copy icon
  fs.copyFileSync(path.resolve(ROOT, 'dist/icons/icon-128.png'), path.join(STORE_ASSETS, 'icon-128.png'));

  await browser.close();
  console.log('✅ All Store Assets Ready in store-assets/ !');
}

generateStoreAssets().catch((e) => {
  console.error(e);
  process.exit(1);
});
