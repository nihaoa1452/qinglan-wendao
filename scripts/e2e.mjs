import fs from 'node:fs';
import { chromium } from 'playwright-core';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173/';
const BROWSERS = [
  process.env.BROWSER_PATH,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);
const executablePath = BROWSERS.find((candidate) => fs.existsSync(candidate));
if (!executablePath) {
  console.error('No Chrome/Edge/Chromium found. Set BROWSER_PATH to a browser executable.');
  process.exit(1);
}
const browser = await chromium.launch({ headless: true, executablePath });
let passed = 0;
const errors = [];
function assert(cond, message) {
  if (!cond) throw new Error('ASSERT FAILED: ' + message);
  passed++;
  console.log('  ok -', message);
}
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await context.newPage();
page.on('pageerror', (err) => errors.push(err.message));
const getState = () => page.evaluate(() => JSON.parse(localStorage.getItem('qinglan-sts-save-v1') || 'null'));

await page.goto(BASE_URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
console.log('scenario: title and new run');
assert(await page.$('.sts-title') !== null, 'title screen is visible');
assert(await page.$('[data-action="start-run"]') !== null, 'start run button is visible');
assert(await page.$('[data-action="codex"]') !== null, 'title screen has codex button');
assert((await page.locator('.sts-bg').first().evaluate((el) => getComputedStyle(el).backgroundImage)).includes('/assets/bg/title.jpg'), 'title screen uses the new title background');
await page.click('[data-action="codex"]');
await page.waitForTimeout(180);
assert(await page.locator('.sts-codex-card').count() === 33, 'title codex lists all cards');
await page.click('[data-action="close-overlay"]');
await page.waitForTimeout(100);
await page.click('[data-action="start-run"]');
await page.waitForTimeout(300);
let st = await getState();
assert(await page.$('.sts-map') !== null, 'starting a run opens the map');
assert(st.deck.length === 10 && st.hp === 80, 'new run has 10 cards and 80 HP');
assert(st.availableIds.length === 3, 'three starting paths are available');
assert((await page.$$('.sts-map-edge')).length > 10, 'map branches are drawn as a tree');
const mapLayout = await page.evaluate(() => {
  const screen = document.querySelector('.sts-screen').getBoundingClientRect();
  const columns = new Map();
  for (const node of document.querySelectorAll('.sts-node')) {
    const box = node.getBoundingClientRect();
    const key = Math.round(box.left + box.width / 2);
    if (!columns.has(key)) columns.set(key, []);
    columns.get(key).push({ top: box.top, bottom: box.bottom });
  }
  let overlap = 0;
  for (const rows of columns.values()) {
    rows.sort((a, b) => a.top - b.top);
    for (let i = 1; i < rows.length; i++) overlap = Math.max(overlap, rows[i - 1].bottom - rows[i].top);
  }
  return { screenWidth: screen.width, viewportWidth: innerWidth, overlap };
});
assert(Math.abs(mapLayout.screenWidth - mapLayout.viewportWidth) < 1, 'screen scrolls at the viewport edge');
assert(mapLayout.overlap <= 0, 'map nodes do not overlap between rows');
const hoverNode = page.locator('.sts-node.is-available').first();
const hoverBefore = await hoverNode.boundingBox();
await hoverNode.hover();
await page.waitForTimeout(220);
const hoverAfter = await hoverNode.boundingBox();
assert(Math.abs(hoverAfter.x - hoverBefore.x) < 1, 'map node hover does not shift horizontally');
assert(hoverAfter.y < hoverBefore.y && hoverBefore.y - hoverAfter.y <= 3, 'map node hover only lifts slightly');
await page.screenshot({ path: 'shots/sts-e2e-map.png' });

console.log('scenario: backpack and codex');
await page.click('[data-action="bag"]');
await page.waitForTimeout(180);
assert(await page.$('.sts-overlay') !== null, 'backpack overlay opens');
const bagBox = await page.locator('.sts-overlay__card').boundingBox();
assert(bagBox.width >= 1430 && bagBox.height >= 890, 'backpack is full-screen');
assert((await page.locator('.sts-overlay').innerText()).includes('当前牌组'), 'backpack shows current deck effects');
assert(await page.locator('.sts-bag-card img').count() > 0, 'backpack shows card images');
await page.screenshot({ path: 'shots/sts-e2e-bag.png' });
await page.click('[data-action="close-overlay"]');
await page.waitForTimeout(100);
await page.click('[data-action="codex"]');
await page.waitForTimeout(180);
assert(await page.locator('.sts-codex-card').count() === 33, 'codex lists all 33 cards');
assert((await page.locator('.sts-codex-card img').first().getAttribute('src') || '').includes('/assets/cards/qingfeng.jpg'), 'codex uses the new card illustrations');
assert((await page.locator('.sts-overlay').innerText()).includes('升级'), 'codex shows upgrade effects');
assert(await page.locator('.sts-codex-card img').count() === 33, 'codex shows card images');
await page.screenshot({ path: 'shots/sts-e2e-codex.png' });
await page.click('[data-action="close-overlay"]');
await page.waitForTimeout(100);
await page.click('[data-action="help"]');
await page.waitForTimeout(180);
assert(await page.locator('.sts-help-tile').count() === 4, 'help overlay has illustrated sections');
assert(await page.locator('.sts-help-hero').count() === 1, 'help overlay has a hero image');
const helpImages = await page.locator('.sts-help-tile__art').evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundImage));
assert(helpImages.length === 4 && helpImages.every((url) => url && url !== 'none'), 'all help tiles have artwork');
await page.screenshot({ path: 'shots/sts-e2e-help.png' });
await page.click('[data-action="close-overlay"]');
await page.waitForTimeout(100);
await page.click('[data-action="pause"]');
await page.waitForTimeout(180);
assert(await page.$('.sts-pause-overlay') !== null, 'pause menu opens from the run');
assert((await page.locator('.sts-pause-overlay').innerText()).includes('结束本局'), 'pause menu has an end-run action');
assert((await page.locator('.sts-pause-overlay').innerText()).includes('保存并返回主界面'), 'pause menu has a return-to-title action');
await page.screenshot({ path: 'shots/sts-e2e-pause.png' });
await page.click('[data-action="close-overlay"]');
await page.waitForTimeout(100);

console.log('scenario: combat');
await page.locator('.sts-node.is-available').first().click();
await page.waitForTimeout(350);
st = await getState();
assert(st.screen === 'combat', 'entering a battle opens combat');
assert(await page.$('.sts-combat-screen') !== null, 'combat UI is visible');
assert((await page.locator('.sts-enemy-card .sts-combatant__art').evaluate((el) => getComputedStyle(el).backgroundImage)).includes('/assets/enemies/'), 'combat uses enemy scene art');
assert(st.combat.hand.length === 5, 'combat starts with a five-card hand');
assert(st.combat.energy === 3, 'combat starts with three energy');
const enemyBox = await page.locator('.sts-enemy-card').boundingBox();
const playerBox = await page.locator('.sts-player-card').boundingBox();
assert(Math.abs(enemyBox.width - playerBox.width) < 2, 'enemy and player panels have equal width');
assert(enemyBox.x < playerBox.x, 'enemy is on the left and player is on the right');
const intentBefore = await page.locator('.sts-intent').innerText();
const baseIntentDamage = Number(intentBefore.match(/攻击\s+(\d+)/)?.[1] ?? 0);
await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('qinglan-sts-save-v1'));
  s.combat.enemy.strength += 5;
  localStorage.setItem('qinglan-sts-save-v1', JSON.stringify(s));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(180);
if (await page.$('[data-action="continue-run"]')) await page.click('[data-action="continue-run"]');
await page.waitForTimeout(250);
const intentAfter = await page.locator('.sts-intent').innerText();
assert(intentAfter.includes(`攻击 ${baseIntentDamage + 5}`), 'enemy intent includes enemy strength');
st = await getState();
assert(await page.locator('[data-action="use-potion"]').count() > 0, 'potion belt is visible in combat');
const potionsBefore = st.potions.length;
await page.click('[data-action="use-potion"]');
await page.waitForTimeout(200);
st = await getState();
assert(st.potions.length === potionsBefore - 1, 'using a potion consumes it');
const enemyHp = st.combat.enemy.hp;
await page.locator('.sts-card[data-action="play-card"]').first().click();
await page.waitForTimeout(250);
st = await getState();
assert(st.combat.hand.length === 4, 'playing a card removes it from the hand');
assert(st.combat.energy < 3, 'playing a card spends energy');
assert(st.combat.enemy.hp <= enemyHp, 'enemy HP does not increase');
const handBeforeDrag = st.combat.hand.length;
await page.locator('.sts-card[data-action="play-card"]').last().dragTo(page.locator('.sts-combat-middle'));
await page.waitForTimeout(180);
st = await getState();
assert(st.combat.hand.length === handBeforeDrag - 1, 'dragging a card to the battlefield plays it');
assert(await page.locator('.sts-fx-number').count() > 0, 'playing a card shows impact feedback');
await page.screenshot({ path: 'shots/sts-e2e-drag-fx.png' });
await page.waitForTimeout(900);
await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('qinglan-sts-save-v1'));
  s.combat.block = 0;
  localStorage.setItem('qinglan-sts-save-v1', JSON.stringify(s));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(180);
if (await page.$('[data-action="continue-run"]')) await page.click('[data-action="continue-run"]');
await page.waitForTimeout(250);
await page.click('[data-action="end-turn"]');
await page.waitForTimeout(120);
assert(await page.locator('.sts-fx-number').count() > 0, 'enemy action shows impact feedback');
assert(await page.locator('.sts-fx-flash--red').count() > 0, 'enemy attack flashes the screen');
await page.waitForTimeout(400);
st = await getState();
assert(st.combat.turn === 2, 'ending the turn advances the combat turn');
assert(st.combat.energy === 3, 'energy refills after the enemy turn');
assert(st.combat.hand.length === 5, 'a new hand is drawn after the enemy turn');
assert(await page.locator('[data-action="battle-log"]').count() > 0, 'battle log button is visible');
await page.click('[data-action="battle-log"]');
await page.waitForTimeout(200);
assert(await page.locator('.sts-battle-log li').count() >= 3, 'battle log lists the previous turn');
assert((await page.locator('.sts-overlay').innerText()).includes('上回合结算'), 'battle log includes a previous-turn summary');
await page.screenshot({ path: 'shots/sts-e2e-battle-log.png' });
await page.click('[data-action="close-overlay"]');
await page.waitForTimeout(100);
await page.screenshot({ path: 'shots/sts-e2e-combat.png' });

console.log('scenario: reward and map return');
await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('qinglan-sts-save-v1'));
  s.combat.enemy.hp = 1;
  s.combat.energy = 3;
  s.combat.hand = [{ uid: 'e2e-kill', defId: 'qingfeng', upgraded: false }];
  localStorage.setItem('qinglan-sts-save-v1', JSON.stringify(s));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(200);
if (await page.$('[data-action="continue-run"]')) await page.click('[data-action="continue-run"]');
await page.waitForTimeout(250);
await page.locator('.sts-card[data-action="play-card"]').click();
await page.waitForTimeout(300);
st = await getState();
assert(st.screen === 'reward', 'defeating the enemy opens the reward screen');
assert(await page.$('.sts-reward') !== null, 'reward UI is visible');
assert(st.reward.cards.length === 3, 'reward offers three cards');
await page.screenshot({ path: 'shots/sts-e2e-reward.png' });
const deckBefore = st.deck.length;
await page.locator('.sts-card[data-action="choose-reward"]').first().click();
await page.waitForTimeout(300);
st = await getState();
assert(st.screen === 'map', 'choosing a reward returns to the map');
assert(st.deck.length === deckBefore + 1, 'reward card is added to the deck');
assert(await page.$('.sts-map') !== null, 'map is visible after reward');
await page.screenshot({ path: 'shots/sts-e2e-map2.png' });
await page.click('[data-action="pause"]');
await page.waitForTimeout(150);
await page.click('[data-action="pause-save"]');
await page.waitForTimeout(250);
assert(await page.$('.sts-title') !== null, 'save-and-return goes back to the title');
assert(await page.$('[data-action="continue-run"]') !== null, 'saved run can be continued from the title');
await page.click('[data-action="continue-run"]');
await page.waitForTimeout(250);
assert(await page.$('.sts-map') !== null, 'continue after pause-save restores the map');

console.log('scenario: shop card removal');
await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('qinglan-sts-save-v1'));
  s.screen = 'shop';
  s.gold = 200;
  s.shop = { nodeId: 'r3c2', offers: [], removalPrice: 50, removalUsed: false };
  s.currentNodeId = 'r3c2';
  s.availableIds = ['r3c2'];
  localStorage.setItem('qinglan-sts-save-v1', JSON.stringify(s));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(200);
if (await page.$('[data-action="continue-run"]')) await page.click('[data-action="continue-run"]');
await page.waitForTimeout(250);
assert(await page.$('.sts-shop') !== null, 'shop screen is visible');
const shopDeckBefore = (await getState()).deck.length;
await page.click('[data-action="shop-remove"]');
await page.waitForTimeout(200);
assert(await page.locator('[data-action="remove-card"]').count() > 0, '忘尘茶 opens deck selection');
await page.locator('[data-action="remove-card"]').first().click();
await page.waitForTimeout(250);
st = await getState();
assert(st.deck.length === shopDeckBefore - 1, '忘尘茶 removes one card');
assert(st.gold === 150, '忘尘茶 costs 50 gold');
assert(st.shop.removalUsed === true, 'shop removal is marked used');
await page.screenshot({ path: 'shots/sts-e2e-remove.png' });
await page.click('[data-action="leave-shop"]');
await page.waitForTimeout(250);
assert(await page.$('.sts-map') !== null, 'leaving the shop returns to the map');

console.log('scenario: save and continue');
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(250);
assert(await page.$('[data-action="continue-run"]') !== null, 'saved run offers continue');
await page.click('[data-action="continue-run"]');
await page.waitForTimeout(300);
assert(await page.$('.sts-map') !== null, 'continue resumes the saved run');

console.log('scenario: endings and new game plus');
await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('qinglan-sts-save-v1'));
  s.screen = 'reward';
  s.floor = 8;
  s.hp = 22;
  s.gold = 120;
  s.currentNodeId = 'r8c0';
  s.availableIds = ['r8c0'];
  s.reward = { nodeId: 'r8c0', cards: ['qingfeng'], gold: 50, relic: null, boss: true };
  localStorage.setItem('qinglan-sts-save-v1', JSON.stringify(s));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(200);
if (await page.$('[data-action="continue-run"]')) await page.click('[data-action="continue-run"]');
await page.waitForTimeout(250);
assert(await page.$('.sts-reward') !== null, 'boss reward is shown before victory');
await page.locator('.sts-card[data-action="choose-reward"]').first().click();
await page.waitForTimeout(350);
assert(await page.$('.sts-ending') !== null, 'victory ending is shown');
assert(await page.locator('.sts-ending').evaluate((el) => el.classList.contains('is-win')), 'victory ending has win styling');
assert(await page.locator('.sts-ending').innerText().then((text) => text.includes('下一周目')), 'victory ending offers the next cycle');
assert(await getState() === null, 'victory clears the run save');
await page.screenshot({ path: 'shots/sts-e2e-victory.png' });

const metaAfterVictory = await page.evaluate(() => JSON.parse(localStorage.getItem('qinglan-sts-meta-v1') || 'null'));
assert(metaAfterVictory && metaAfterVictory.cycle === 2, 'victory unlocks the next cycle');
assert(metaAfterVictory.essence > 0, 'victory awards meta currency');

await page.click('[data-action="title"]');
await page.waitForTimeout(250);
assert(await page.$('.sts-title') !== null, 'victory can return to the title');
assert(await page.$('[data-action="continue-run"]') === null, 'finished run is not offered as continue');

await page.click('[data-action="meta"]');
await page.waitForTimeout(250);
assert(await page.$('.sts-meta-overlay') !== null, 'meta progression shop opens');
assert(await page.locator('.sts-meta-card').count() === 5, 'meta shop lists permanent upgrades');
await page.screenshot({ path: 'shots/sts-e2e-meta.png' });
const essenceBeforeBuy = (await page.evaluate(() => JSON.parse(localStorage.getItem('qinglan-sts-meta-v1')))).essence;
await page.click('[data-action="buy-meta"][data-upgrade="potion:focus"]');
await page.waitForTimeout(250);
const metaAfterBuy = await page.evaluate(() => JSON.parse(localStorage.getItem('qinglan-sts-meta-v1')));
assert(metaAfterBuy.unlocked.includes('potion:focus'), 'meta upgrade is purchased');
assert(metaAfterBuy.essence === essenceBeforeBuy - 25, 'meta purchase spends essence');
await page.click('[data-action="close-overlay"]');
await page.waitForTimeout(150);

await page.click('[data-action="start-run"]');
await page.waitForTimeout(300);
st = await getState();
assert(st.cycle === 2, 'new run after victory starts cycle two');
assert(st.map.length === 10, 'cycle two has a longer ten-row map');
assert(st.potions.includes('focus'), 'purchased starting potion is carried into the next run');
assert(await page.$('.sts-map') !== null, 'cycle two map is visible');
assert((await page.locator('.sts-brand small').innerText()).includes('10'), 'HUD shows the longer cycle map');
await page.waitForTimeout(1000);
await page.screenshot({ path: 'shots/sts-e2e-cycle2.png' });

await page.locator('.sts-node.is-available').first().click();
await page.waitForTimeout(300);
assert(await page.$('.sts-combat-screen') !== null, 'cycle two battle starts');
await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('qinglan-sts-save-v1'));
  s.hp = 1;
  s.combat.block = 0;
  s.combat.hand = [];
  s.combat.drawPile = [];
  s.combat.discardPile = [];
  s.combat.energy = 0;
  s.combat.enemy.defId = 'yaowang';
  s.combat.enemy.hp = 100;
  s.combat.enemy.maxHp = 100;
  s.combat.enemy.moveIndex = 0;
  s.combat.enemy.strength = 0;
  s.combat.enemy.vulnerable = 0;
  s.combat.enemy.weak = 0;
  s.combat.enemy.poison = 0;
  s.screen = 'combat';
  localStorage.setItem('qinglan-sts-save-v1', JSON.stringify(s));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(200);
if (await page.$('[data-action="continue-run"]')) await page.click('[data-action="continue-run"]');
await page.waitForTimeout(250);
await page.click('[data-action="end-turn"]');
await page.waitForTimeout(350);
assert(await page.$('.sts-ending') !== null, 'defeat ending is shown');
assert(await page.locator('.sts-ending').evaluate((el) => el.classList.contains('is-lose')), 'defeat ending has lose styling');
assert(await getState() === null, 'defeat clears the run save');
await page.screenshot({ path: 'shots/sts-e2e-defeat.png' });

await page.click('[data-action="pause"]');
await page.waitForTimeout(150);
assert(await page.$('.sts-pause-overlay') !== null, 'pause menu is available on the defeat screen');
page.once('dialog', (dialog) => dialog.accept());
await page.click('[data-action="pause-abandon"]');
await page.waitForTimeout(300);
assert(await page.$('.sts-title') !== null, 'ending a run returns to the title');
assert(await page.$('[data-action="continue-run"]') === null, 'ending a run clears the save');

console.log('errors:', errors.length ? errors : 'none');
assert(errors.length === 0, 'no page errors');
await context.close();

console.log('scenario: mobile layout');
const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const mobile = await mobileContext.newPage();
mobile.on('pageerror', (err) => errors.push('mobile: ' + err.message));
await mobile.goto(BASE_URL, { waitUntil: 'networkidle' });
await mobile.waitForTimeout(250);
assert(await mobile.$('.sts-title') !== null, 'mobile title screen is visible');
await mobile.click('[data-action="start-run"]');
await mobile.waitForTimeout(300);
assert(await mobile.$('.sts-map') !== null, 'mobile map is visible');
await mobile.screenshot({ path: 'shots/sts-e2e-mobile.png' });
await mobileContext.close();

await browser.close();
console.log(`\nALL ${passed} STS E2E CHECKS PASSED`);
