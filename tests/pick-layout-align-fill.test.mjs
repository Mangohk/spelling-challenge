/**
 * Pick battle vertical stack aligns with Fill's column (L1–L4, R1–R2).
 * Run: NODE_PATH=/tmp/stage3-test/node_modules node --test tests/pick-layout-align-fill.test.mjs
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

function byId(document, id) {
  const el = document.getElementById(id);
  assert.ok(el, id);
  return el;
}

/** Main-column rank: flex `order`, then source index, from #battle down. */
function stackKey(el) {
  const stop = el.ownerDocument.getElementById('battle');
  const view = el.ownerDocument.defaultView;
  const keys = [];
  let node = el;
  while (node && node !== stop) {
    const parent = node.parentElement;
    const raw = view.getComputedStyle(node).order;
    const order = raw === '' || raw == null ? 0 : (parseInt(raw, 10) || 0);
    let index = 0;
    for (const child of parent.children) {
      if (child === node) break;
      index += 1;
    }
    keys.push([order, index]);
    node = parent;
  }
  keys.reverse();
  return keys;
}

function assertStackOrder(document, ids) {
  const keys = ids.map((id) => stackKey(byId(document, id)));
  for (let i = 0; i < keys.length - 1; i += 1) {
    const cmp = compareKeys(keys[i], keys[i + 1]);
    assert.ok(
      cmp < 0,
      `${ids[i]} should sit above ${ids[i + 1]} (${JSON.stringify(keys[i])} vs ${JSON.stringify(keys[i + 1])})`
    );
  }
}

function compareKeys(a, b) {
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i += 1) {
    const ak = a[i] || [0, 0];
    const bk = b[i] || [0, 0];
    if (ak[0] !== bk[0]) return ak[0] - bk[0];
    if (ak[1] !== bk[1]) return ak[1] - bk[1];
  }
  return 0;
}

test('L1–L3 R1 R2 pick opens enemy, image, stem, Attack, pocket, then choices in the keyboard band', async () => {
  const { document, spell } = load('test=1&stage=stage1&skipTravel=1&forceMode=pick&forceWord=art%20room');
  document.getElementById('start-btn').click();
  await wait(30);

  assert.equal(spell.state.mode, 'pick');
  assert.equal(document.querySelectorAll('#battle').length, 1);
  assert.equal(document.querySelectorAll('#play-dock').length, 1);

  const battle = byId(document, 'battle');
  const dock = byId(document, 'play-dock');
  const choices = byId(document, 'pick-choices');
  const keyboard = byId(document, 'keyboard');
  const slots = byId(document, 'slots');
  assert.ok(battle.classList.contains('mode-pick'));
  assert.equal(choices.parentElement, dock);
  assert.equal(keyboard.parentElement, dock);
  assert.equal(byId(document, 'check-btn').closest('#play-dock'), dock);
  assert.equal(byId(document, 'pocket-slots').closest('#play-dock'), dock);
  assert.equal(slots.closest('#battle-main'), byId(document, 'battle-main'));
  assert.equal(byId(document, 'monster-panel').closest('#arena'), byId(document, 'arena'));
  assert.equal(choices.closest('aside'), null);

  assert.equal(slots.hidden, true);
  assert.equal(keyboard.hidden, true);
  assert.equal(choices.hidden, false);
  assert.equal(byId(document, 'pick-stem').hidden, false);
  assert.equal(byId(document, 'word-prompt-img').hidden, false);
  const view = document.defaultView;
  assert.match(html, /\.keyboard\[hidden\],\s*\.slots\[hidden\],\s*\.pick-choices\[hidden\]\s*\{[^}]*display:\s*none\s*!important/);
  assert.equal(view.getComputedStyle(slots).display, 'none');
  assert.equal(view.getComputedStyle(dock).flexDirection, 'column');
  assert.equal(view.getComputedStyle(dock.querySelector('.battle-actions')).order, '1');
  assert.equal(view.getComputedStyle(byId(document, 'pocket-bar')).order, '2');
  assert.equal(view.getComputedStyle(choices).order, '3');

  assertStackOrder(document, [
    'monster-panel',
    'word-prompt-img',
    'word-clue',
    'pick-stem',
    'check-btn',
    'pocket-slots',
    'pick-choices'
  ]);

  const buttons = [...choices.querySelectorAll('.pick-choice')];
  assert.equal(buttons.length, 3);
  assert.equal(byId(document, 'check-btn').textContent, 'Attack!');
  assert.equal(byId(document, 'pocket-slots').children.length, 5);
  buttons[0].click();
  assert.equal(spell.state.pickChoice, buttons[0].dataset.word);
});

test('L4 fill keeps enemy, image, clue, slots, pocket, keyboard, then Attack', async () => {
  const { document, spell } = load('test=1&stage=stage1&skipTravel=1&forceMode=fill&forceWord=library');
  document.getElementById('start-btn').click();
  await wait(30);

  assert.equal(spell.state.mode, 'fill');
  const battle = byId(document, 'battle');
  assert.equal(battle.classList.contains('mode-pick'), false);
  assert.equal(byId(document, 'pick-stem').hidden, true);
  assert.equal(byId(document, 'pick-choices').hidden, true);
  assert.equal(byId(document, 'slots').hidden, false);
  assert.equal(byId(document, 'keyboard').hidden, false);
  assert.ok(byId(document, 'slots').querySelector('.slot'));
  const fillOrder = document.defaultView.getComputedStyle(byId(document, 'play-dock').querySelector('.battle-actions')).order;
  assert.ok(fillOrder === '0' || fillOrder === '', `fill Attack order ${fillOrder}`);

  assertStackOrder(document, [
    'monster-panel',
    'word-prompt-img',
    'word-clue',
    'slots',
    'pocket-slots',
    'keyboard',
    'check-btn'
  ]);
});
