import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import { findBrowser } from './browser.mjs';

const OUT = path.resolve('shots/youling-captured');
const PROFILE = path.join(os.homedir(), '.cache', 'qinglan-youling-profile');
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(PROFILE, { recursive: true });

const manifestPath = path.join(OUT, 'manifest.json');
const logPath = path.join(OUT, 'capture.log');
const log = (msg) => {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(logPath, line + '\n');
};

const context = await chromium.launchPersistentContext(PROFILE, {
  headless: false,
  executablePath: findBrowser(),
  viewport: null,
  args: ['--start-maximized', '--disable-blink-features=AutomationControlled'],
});
const page = context.pages()[0] ?? await context.newPage();
const inProject = () => /\/chat\/[^/]+/.test(page.url());
const seenUrls = new Set();
const seenHashes = new Set();
const manifest = [];

function extFor(contentType, url) {
  const ct = (contentType || '').toLowerCase();
  if (ct.includes('png')) return 'png';
  if (ct.includes('webp')) return 'webp';
  if (ct.includes('jpeg') || ct.includes('jpg')) return 'jpg';
  if (ct.includes('avif')) return 'avif';
  if (ct.includes('gif')) return 'gif';
  const m = url.match(/\.(png|jpe?g|webp|avif|gif)(?:\?|$)/i);
  return m ? m[1].toLowerCase().replace('jpeg', 'jpg') : 'bin';
}

function saveBuffer(buf, contentType, url, meta = {}) {
  if (!buf || buf.length < 20000) return false;
  const hash = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 12);
  if (seenHashes.has(hash)) return false;
  seenHashes.add(hash);
  const ext = extFor(contentType, url);
  const n = String(manifest.length + 1).padStart(3, '0');
  const name = `${n}_${hash}.${ext}`;
  fs.writeFileSync(path.join(OUT, name), buf);
  manifest.push({
    file: name,
    bytes: buf.length,
    contentType: contentType || '',
    url,
    ...meta,
  });
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  log(`saved ${name} (${buf.length} bytes) ${url.slice(0, 140)}`);
  return true;
}

page.on('response', async (resp) => {
  try {
    const url = resp.url();
    if (!inProject()) return;
    if (!/^https?:/i.test(url)) return;
    if (/file\.craft\.qq\.com\/static\//i.test(url)) return;
    const ct = (resp.headers()['content-type'] || '').toLowerCase();
    if (!ct.startsWith('image/')) return;
    const len = Number(resp.headers()['content-length'] || 0);
    if (len && len < 20000) return;
    const key = url.split('#')[0];
    if (seenUrls.has(key)) return;
    seenUrls.add(key);
    const buf = await resp.body();
    saveBuffer(buf, ct, url, { source: 'network' });
  } catch (e) {
    // body may be unavailable after redirect; ignore
  }
});

// Also scan the DOM, because some AIGC previews are blob URLs / lazy rendered.
async function scanDom() {
  try {
    if (!inProject()) return;
    const imgs = await page.evaluate(() => Array.from(document.images)
      .filter((img) => img.naturalWidth >= 256 && img.naturalHeight >= 256)
      .map((img) => {
        const box = img.getBoundingClientRect();
        const parent = img.closest('figure, .resource-card, .message, .chat-message, li, div');
        return {
          src: img.currentSrc || img.src,
          w: img.naturalWidth,
          h: img.naturalHeight,
          alt: img.alt || '',
          title: img.title || '',
          text: (parent?.innerText || '').slice(0, 240),
        };
      }));
    for (const img of imgs) {
      const src = img.src || '';
      if (!src || seenUrls.has(src)) continue;
      seenUrls.add(src);
      let buf = null;
      let ct = '';
      if (src.startsWith('data:')) {
        const m = src.match(/^data:([^;]+);base64,(.*)$/);
        if (m) {
          ct = m[1];
          buf = Buffer.from(m[2], 'base64');
        }
      } else if (src.startsWith('blob:')) {
        const arr = await page.evaluate(async (u) => {
          const r = await fetch(u);
          const b = await r.arrayBuffer();
          return { ct: r.headers.get('content-type') || '', data: Array.from(new Uint8Array(b)) };
        }, src);
        ct = arr.ct;
        buf = Buffer.from(arr.data);
      } else if (/^https?:/i.test(src)) {
        try {
          const r = await context.request.get(src, { headers: { Referer: page.url() }, timeout: 30000 });
          if (r.ok()) {
            ct = r.headers()['content-type'] || '';
            buf = await r.body();
          }
        } catch {}
        if (!buf) {
          try {
            const arr = await page.evaluate(async (u) => {
              const r = await fetch(u);
              const b = await r.arrayBuffer();
              return { ct: r.headers.get('content-type') || '', data: Array.from(new Uint8Array(b)) };
            }, src);
            ct = arr.ct;
            buf = Buffer.from(arr.data);
          } catch {}
        }
      }
      if (buf) {
        saveBuffer(buf, ct, src, {
          source: 'dom',
          width: img.w,
          height: img.h,
          alt: img.alt,
          title: img.title,
          parentText: img.text,
        });
      }
    }
  } catch (e) {
    log(`scan error: ${e.message}`);
  }
}

setInterval(scanDom, 3000).unref?.();

await page.goto('https://craft.qq.com/chat', { waitUntil: 'domcontentloaded', timeout: 60000 });
log(`BROWSER_OPEN ${page.url()}`);
log('请在打开的 Edge 窗口登录游点灵，打开生成图片的项目/对话，并滚动浏览所有图片。');
log('抓够后告诉我，我会停止脚本并检查 shots/youling-captured/。');
await new Promise(() => {});
