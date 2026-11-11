import fs from 'node:fs';

const CANDIDATES = [
  process.env.BROWSER_PATH,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

export function findBrowser() {
  const executablePath = CANDIDATES.find((candidate) => fs.existsSync(candidate));
  if (!executablePath) {
    throw new Error('No Chrome/Edge/Chromium found. Set BROWSER_PATH to a browser executable.');
  }
  return executablePath;
}
