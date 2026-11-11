import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PROFILE = path.join(os.homedir(), '.cache', 'qinglan-youling-profile');
const OUT = path.resolve('shots/youling-assets');
fs.mkdirSync(OUT, { recursive: true });

const context = await chromium.launchPersistentContext(PROFILE, {
  headless: true,
  executablePath: EDGE,
  viewport: { width: 1280, height: 900 },
  args: ['--disable-blink-features=AutomationControlled'],
});
const page = context.pages()[0] ?? await context.newPage();
await page.goto('https://craft.qq.com/resource-center', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(3000);

const API = '/api/ms/resource?completion_status=completed&exclude_intermediate=true&page_size=100&sort=update_at&is_resource_center=true&entry_source=resource_center&tab_source=my';
const all = [];
for (let pageNo = 1; pageNo <= 10; pageNo++) {
  const url = `${API}&page=${pageNo}`;
  const json = await page.evaluate(async (u) => {
    const r = await fetch(u, { credentials: 'include' });
    return { status: r.status, json: await r.json() };
  }, url);
  if (json.status !== 200 || json.json?.code !== 0) {
    console.error('API failed', json.status, JSON.stringify(json.json).slice(0, 500));
    break;
  }
  const data = json.json.data ?? {};
  const items = Array.isArray(data.data) ? data.data : [];
  all.push(...items);
  const totalPages = Number(data.total_pages || 0);
  if (pageNo >= totalPages || items.length === 0) break;
}

const seen = new Set();
const manifest = [];
for (const item of all) {
  if (!item || seen.has(item.id)) continue;
  seen.add(item.id);
  const url = item.result_url || item.preview_image_url || '';
  if (!url || !/\.(png|jpe?g|webp|avif|gif)(\?|$)/i.test(url)) continue;
  const ext = (url.match(/\.(png|jpe?g|webp|avif|gif)(?:\?|$)/i)?.[1] || 'jpg').toLowerCase().replace('jpeg', 'jpg');
  const file = `${item.id}.${ext}`;
  const target = path.join(OUT, file);
  let bytes = 0;
  if (fs.existsSync(target)) {
    bytes = fs.statSync(target).size;
  } else {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const buf = Buffer.from(await r.arrayBuffer());
      fs.writeFileSync(target, buf);
      bytes = buf.length;
    } catch (e) {
      console.error('download failed', item.id, e.message, url.slice(0, 120));
      continue;
    }
  }
  manifest.push({
    id: item.id,
    file,
    bytes,
    resourceName: item.resource_name || '',
    description: item.description || '',
    prompt: item.prompt_original || '',
    url,
    withMatting: item.input_extra?.with_matting ?? null,
    size: item.input_extra?.size ?? '',
    model: item.input_extra?.model ?? '',
    style: item.input_extra?.style ?? '',
    createdAt: item.created_at || '',
  });
  console.log(`saved ${file} ${bytes} bytes · ${item.resource_name || item.id}`);
}
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`\nDONE ${manifest.length} image asset(s) -> ${OUT}`);
await context.close();
