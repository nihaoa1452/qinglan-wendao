import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

mkdirSync('shots', { recursive: true });
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const browser = await chromium.launch({ headless: true, executablePath: EDGE });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (err) => errors.push(err.message));
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
const intro = await page.$('[data-action="close-intro"]');
if (intro) await intro.click();
await page.waitForTimeout(300);
const getState = () => page.evaluate(() => JSON.parse(localStorage.getItem('qinglan-zong-save-v1')));

for (let turn = 0; turn < 40; turn++) {
  const eventClose = await page.$('[data-action="close-event"]');
  if (eventClose) {
    await eventClose.click();
    await page.waitForTimeout(150);
  }
  let st = await getState();
  if (st.phase !== 'playing') break;
  console.log(`day ${st.day}: stones=${st.stones} disc=${st.disciples} rep=${st.reputation} fac=${st.facilities.length} hand=${st.hand.length}`);
  const reserve = 8 + st.day * 1.2;

  // Play affordable cards while keeping a reserve.
  for (let i = 0; i < 12; i++) {
    st = await getState();
    if (st.phase !== 'playing') break;
    const card = await page.$('[data-action="play"]:not(.is-blocked)');
    if (!card) break;
    const costText = await card.$eval('.card__cost', (el) => el.textContent ?? '0');
    const cost = Number(costText) || 0;
    if (cost > 0 && st.stones - cost < reserve) break;
    await card.click();
    await page.waitForTimeout(80);
  }

  // Buy affordable offers while keeping a reserve.
  for (let i = 0; i < 2; i++) {
    st = await getState();
    const buy = await page.$('[data-action="buy"]:not([disabled]):not(.is-blocked)');
    if (!buy) break;
    const priceText = await buy.evaluate((el) => el.parentElement?.querySelector('.offer__price')?.textContent ?? '0');
    const price = Number(priceText.replace(/[^0-9]/g, '')) || 0;
    if (st.stones - price < reserve) break;
    await buy.click();
    await page.waitForTimeout(100);
  }

  st = await getState();
  if (st.day === 10 || st.day === 15 || st.day === 20) {
    await page.screenshot({ path: `shots/uiplay-day${st.day}.png` });
  }
  if (st.phase !== 'playing') break;
  await page.click('[data-action="end-day"]');
  await page.waitForTimeout(250);
}

const st = await getState();
console.log('final', JSON.stringify({ day: st.day, phase: st.phase, stones: st.stones, disciples: st.disciples, reputation: st.reputation, facilities: st.facilities.map(f => f.defId), ending: st.ending }));
console.log('errors:', errors.length ? errors : 'none');
await page.screenshot({ path: 'shots/uiplay-final.png' });
await browser.close();
