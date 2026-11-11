
import { chromium } from 'playwright-core';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { findBrowser } from './browser.mjs';

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i+1] : def; };
const JOBS = path.resolve(opt('--jobs', 'art-jobs.json'));
const OUT = path.resolve(opt('--out', 'shots/artgen'));
const CONC = Number(opt('--concurrency', '6'));
const PROFILE = path.join(os.homedir(), '.cache', 'qinglan-youling-profile');
fs.mkdirSync(OUT, { recursive: true });
const allJobs = JSON.parse(fs.readFileSync(JOBS, 'utf8'));
const manifestPath = path.join(OUT, 'manifest.json');
let manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
const doneNames = new Set(Object.keys(manifest).filter(k => manifest[k].status === 'completed' && manifest[k].file && fs.existsSync(path.join(OUT, manifest[k].file))));
const pending = allJobs.filter(j => !doneNames.has(j.name));
console.log(`jobs=${allJobs.length} done=${doneNames.size} pending=${pending.length}`);
if (!pending.length) process.exit(0);

const context = await chromium.launchPersistentContext(PROFILE, {
  headless: true, executablePath: findBrowser(), viewport: { width: 1280, height: 900 },
  args: ['--disable-blink-features=AutomationControlled'],
});
const page = context.pages()[0] ?? await context.newPage();
await page.goto('https://craft.qq.com/resource-center', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2500);

const submit = async (job) => {
  const res = await page.evaluate(async (job) => {
    const r = await fetch('/api/res/generate-2-d-text-to-image', {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: job.prompt, style: '', category: job.category || '图像', with_matting: !!job.with_matting, image_type: '', dynamic_params: {}, size: job.size || '1024x1024', model: job.model || 'seedream_5_0_pro' })
    });
    return await r.json();
  }, job);
  if (res?.code !== 0 || !res?.data?.id) throw new Error(`submit failed ${job.name}: ${JSON.stringify(res).slice(0,300)}`);
  return { ...job, id: res.data.id, status: 'pending', attempts: (job.attempts || 0) + 1 };
};

const inflight = [];
const queue = [...pending];
const failed = [];
let round = 0;
while (queue.length || inflight.length) {
  while (inflight.length < CONC && queue.length) {
    const job = queue.shift();
    try {
      const rec = await submit(job);
      inflight.push(rec);
      console.log(`[submit] ${job.name} id=${rec.id}`);
      await page.waitForTimeout(900);
    } catch (e) {
      console.error('[submit-error]', job.name, e.message);
      failed.push({ ...job, error: e.message });
    }
  }
  await page.waitForTimeout(5000);
  round++;
  const ids = inflight.map(x => x.id);
  let items = [];
  try {
    const json = await page.evaluate(async (ids) => {
      const r = await fetch('/api/res/query-tasks', { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ids}) });
      return await r.json();
    }, ids);
    items = json.data?.data || [];
  } catch (e) { console.error('query error', e.message); }
  const settledNames = new Set();
  for (const item of items) {
    const rec = inflight.find(x => x.id === item.id);
    if (!rec) continue;
    if (item.status === 'completed' && item.result_url) {
      const ext = (item.result_url.match(/\.(png|jpe?g|webp)/i)?.[1] || 'png').toLowerCase().replace('jpeg','jpg');
      const file = `${rec.name}.${ext}`;
      const target = path.join(OUT, file);
      try {
        if (!fs.existsSync(target)) {
          const bytes = await page.evaluate(async (url) => {
            const r = await fetch(url); const b = await r.arrayBuffer(); return Array.from(new Uint8Array(b));
          }, item.result_url);
          fs.writeFileSync(target, Buffer.from(bytes));
        }
        manifest[rec.name] = { name: rec.name, file, id: item.id, status: 'completed', size: rec.size, with_matting: !!rec.with_matting, prompt: rec.prompt, resource_name: item.resource_name, description: item.description, result_url: item.result_url };
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        console.log(`[saved] ${rec.name} <- ${file}`);
        settledNames.add(rec.name);
      } catch (e) { console.error('download error', rec.name, e.message); }
    } else if (['failed','rejected','violation_hidden','violation_removed','hidden_rejected'].includes(item.status)) {
      console.error(`[failed] ${rec.name} ${item.status} ${item.error_message || ''}`);
      manifest[rec.name] = { name: rec.name, id: item.id, status: item.status, error: item.error_message || '', prompt: rec.prompt };
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      if (rec.attempts < 2) queue.push({ ...rec, attempts: rec.attempts });
      else failed.push({ ...rec, error: item.error_message || item.status });
      settledNames.add(rec.name);
    }
  }
  for (let i = inflight.length - 1; i >= 0; i--) if (settledNames.has(inflight[i].name)) inflight.splice(i, 1);
  console.log(`[round ${round}] inflight=${inflight.map(x => `${x.name}:${x.id}`).join(',')} queue=${queue.length}`);
}
console.log(`DONE failed=${failed.length}`);
if (failed.length) console.log(JSON.stringify(failed.map(f => ({ name: f.name, error: f.error })), null, 1));
await context.close();
