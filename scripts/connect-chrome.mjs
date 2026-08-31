import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import os from 'os';

async function connectToLiveChrome() {
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
  console.log(`Connecting to Chrome via DevTools endpoint: ${wsEndpoint}`);

  try {
    const browser = await puppeteer.connect({
      browserWSEndpoint: wsEndpoint,
      defaultViewport: null,
    });

    console.log('Connected to Chrome!');
    const pages = await browser.pages();
    console.log(`Found ${pages.length} open pages:`);
    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];
      const title = await p.title().catch(() => 'unknown');
      const url = p.url();
      console.log(`[${i}] "${title}" -> ${url}`);
    }

    // Find DevConsole tab or create one
    let devPage = pages.find((p) => p.url().includes('webstore/devconsole'));
    if (!devPage) {
      console.log('Opening new tab to DevConsole...');
      devPage = await browser.newPage();
      await devPage.goto('https://chrome.google.com/u/1/webstore/devconsole/50a0ee3a-650f-4c5e-86b0-1f529fedff8b', {
        waitUntil: 'networkidle2',
      });
    }

    console.log(`Active DevConsole tab: ${devPage.url()}`);
    await devPage.bringToFront();
    const title = await devPage.title();
    console.log(`Page title: ${title}`);
  } catch (err) {
    console.error('Connection failed:', err.message);
  }
}

connectToLiveChrome();
