/**
 * Soft accept: 10s hint timeout and normal-monster HP ±2.
 * Run: NODE_PATH=/tmp/stage3-test/node_modules node --test tests/timeout10-hp-jitter.test.mjs
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
function loadJsdom() {
  try {
    return require('jsdom');
  } catch {
    return require('/tmp/stage3-test/node_modules/jsdom');
  }
}
const { JSDOM } = loadJsdom();

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const TABLE_HP = [1, 6, 6, 6, 6, 6, 14, 28];

function load(query) {
  const dom = new JSDOM(html.replace(/<link\b[^>]*>/g, ''), {
    url: `http://127.0.0.1/index.html?${query}`,
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    beforeParse(window) {
      window.speechSynthesis = {
        cancel() {},
        speak() {},
        getVoices() { return []; }
      };
    }
  });
  const spell = dom.window.__SPELL;
  assert.ok(spell, 'test hook window.__SPELL missing (open with test=1)');
  return { dom, window: dom.window, spell, document: dom.window.document };
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function boot(query) {
  const loaded = load(query);
  loaded.document.getElementById('start-btn').click();
  await wait(30);
  return loaded;
}

function withRandom(gameWindow, value, fn) {
  const orig = gameWindow.Math.random;
  gameWindow.Math.random = () => value;
  try {
    return fn();
  } finally {
    gameWindow.Math.random = orig;
  }
}

function tableHp(spell) {
  return Array.from(spell.state.stage.monsters, (m) => m.hp);
}

function startFight(spell, index) {
  spell.state.index = index;
  spell.state.forceMode = 'fill';
  spell.state.forceWord = 'draw';
  spell.beginBattle();
}

test('T1 T3 the main idle threshold is 10000 and the countdown opens at 10s', async () => {
  const { spell, document } = await boot('test=1&stage=stage1&skipTravel=1');
  assert.equal(spell.HINT_TIMEOUT_MS, 10000);
  assert.equal(spell.hintLimitMs(), 10000);
  startFight(spell, 1);
  assert.equal(spell.state.mode, 'fill');
  assert.equal(document.getElementById('hint-countdown').textContent, '10s');
  assert.equal(document.getElementById('hint-countdown').hidden, false);
});

test('H1 H4 normal battles roll max(1, base±2) and the HUD uses that same hp/maxHp', async () => {
  const { spell, document, window: game } = await boot('test=1&stage=stage1&skipTravel=1');
  assert.deepEqual(tableHp(spell), TABLE_HP);

  withRandom(game, 0, () => startFight(spell, 0));
  assert.equal(spell.state.monster.role, 'normal');
  assert.equal(spell.state.monster.hp, 1);
  assert.equal(spell.state.monster.maxHp, 1);
  assert.equal(document.getElementById('monster-hp-text').textContent, '1/1');

  withRandom(game, 0.999, () => startFight(spell, 0));
  assert.equal(spell.state.monster.hp, 3);
  assert.equal(spell.state.monster.maxHp, 3);
  assert.equal(document.getElementById('monster-hp-text').textContent, '3/3');

  withRandom(game, 0, () => startFight(spell, 1));
  assert.equal(spell.state.monster.hp, 4);
  assert.equal(spell.state.monster.maxHp, 4);
  assert.equal(document.getElementById('monster-hp-text').textContent, '4/4');

  withRandom(game, 0.999, () => startFight(spell, 1));
  assert.equal(spell.state.monster.hp, 8);
  assert.equal(spell.state.monster.maxHp, 8);
  assert.equal(document.getElementById('monster-hp-text').textContent, '8/8');

  assert.deepEqual(tableHp(spell), TABLE_HP);
});

test('H1 each normal battle rolls on its own', async () => {
  const { spell, window: game } = await boot('test=1&stage=stage2&skipTravel=1');
  withRandom(game, 0, () => startFight(spell, 2));
  assert.equal(spell.state.monster.hp, 4);
  withRandom(game, 0.999, () => startFight(spell, 2));
  assert.equal(spell.state.monster.hp, 8);
  assert.equal(spell.state.stage.monsters[2].hp, 6);
});

test('H2 H3 mini stays 14 and boss stays 28 on every stage', async () => {
  for (const stage of ['stage1', 'stage2', 'stage3']) {
    const { spell, document, window: game } = await boot(`test=1&stage=${stage}&skipTravel=1`);
    assert.deepEqual(tableHp(spell), TABLE_HP);

    withRandom(game, 0, () => startFight(spell, 6));
    assert.equal(spell.state.monster.role, 'mini');
    assert.equal(spell.state.monster.hp, 14);
    assert.equal(spell.state.monster.maxHp, 14);
    assert.equal(document.getElementById('monster-hp-text').textContent, '14/14');

    withRandom(game, 0.999, () => startFight(spell, 6));
    assert.equal(spell.state.monster.hp, 14);
    assert.equal(spell.state.monster.maxHp, 14);

    withRandom(game, 0, () => startFight(spell, 7));
    assert.equal(spell.state.monster.role, 'boss');
    assert.equal(spell.state.monster.hp, 28);
    assert.equal(spell.state.monster.maxHp, 28);
    assert.equal(document.getElementById('monster-hp-text').textContent, '28/28');

    withRandom(game, 0.999, () => startFight(spell, 7));
    assert.equal(spell.state.monster.hp, 28);
    assert.equal(spell.state.monster.maxHp, 28);
    assert.deepEqual(tableHp(spell), TABLE_HP);
  }
});
