/**
 * Soft accept: no Hint One Letter button, 15s mid-arena countdown.
 * Run: NODE_PATH=/tmp/stage3-test/node_modules node --test tests/hint-mid-countdown.test.mjs
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

async function boot(query) {
  const loaded = load(query);
  loaded.document.getElementById('start-btn').click();
  await wait(30);
  return loaded;
}

function armFill(spell, word, index) {
  spell.state.index = index;
  spell.state.forceMode = 'fill';
  spell.state.forceWord = word;
  spell.beginBattle();
}

function filledCount(spell) {
  return spell.state.blanks.filter((b) => b.value).length;
}

test('B1 the battle dock has no Hint One Letter button', async () => {
  const { document, spell } = await boot('test=1&stage=stage1&skipTravel=1');
  armFill(spell, 'draw', 0);
  assert.equal(document.getElementById('letter-hint-btn'), null);
  assert.equal(spell.useLetterHint, undefined);
  assert.doesNotMatch(html, /Hint One Letter/);
  const labels = [...document.querySelectorAll('#battle button')].map((btn) => btn.textContent.trim());
  assert.equal(labels.some((label) => /hint one letter/i.test(label)), false);
  assert.equal(document.getElementById('check-btn').textContent.trim(), 'Attack!');
});

test('H1 the idle auto-hint threshold is 15 seconds', () => {
  const { spell } = load('test=1&stage=stage1&skipTravel=1');
  assert.equal(spell.HINT_TIMEOUT_MS, 15000);
  assert.equal(spell.hintLimitMs(), 15000);
});

test('U1 U2 N3 the 15s countdown sits between hero and monster and stays distinct from the enemy count', async () => {
  const { document, spell } = await boot('test=1&stage=stage1&skipTravel=1');
  armFill(spell, 'library', 0);
  const countdown = document.getElementById('hint-countdown');
  const turn = document.getElementById('turn-countdown');
  const arena = document.getElementById('arena');
  const hero = document.getElementById('hero-panel');
  const monster = document.getElementById('monster-panel');
  assert.ok(countdown);
  assert.equal(countdown.parentElement, arena);
  assert.ok(hero.compareDocumentPosition(countdown) & document.DOCUMENT_POSITION_FOLLOWING);
  assert.ok(countdown.compareDocumentPosition(monster) & document.DOCUMENT_POSITION_FOLLOWING);
  assert.equal(turn.closest('#monster-panel'), monster);
  assert.notEqual(countdown, turn);
  assert.equal(countdown.hidden, false);
  assert.match(countdown.textContent, /^15s$/);
  assert.equal(document.getElementById('turn-count-num').textContent, '3');
  assert.notEqual(countdown.textContent, document.getElementById('turn-count-num').textContent);
  assert.match(html, /#hint-countdown\s*\{[^}]*left:\s*50%/s);
  assert.match(html, /#hint-countdown\s*\{[^}]*top:\s*5\d%/s);
  assert.match(html, /#hint-countdown\s*\{[^}]*pointer-events:\s*none/s);
  assert.equal(document.getElementById('keyboard').hidden, false);
  assert.equal(document.getElementById('check-btn').disabled, false);
});

test('H2 a letter input resets the countdown so the auto-fill waits another full interval', async () => {
  const { spell, document } = await boot('test=1&stage=stage1&skipTravel=1&hintMs=1500');
  armFill(spell, 'library', 5);
  const turn = spell.state.turnLeft;
  const before = filledCount(spell);
  await wait(900);
  assert.equal(spell.state.turnLeft, turn);
  assert.equal(filledCount(spell), before);
  document.querySelector('#keyboard .key').click();
  await wait(900);
  assert.equal(spell.state.turnLeft, turn);
  assert.equal(filledCount(spell), before + 1);
  assert.equal(document.getElementById('hint-countdown').hidden, false);
  await wait(900);
  assert.equal(spell.state.turnLeft, turn - 1);
  assert.equal(filledCount(spell), before + 2);
  assert.equal(spell.state.hero.hp, 10);
});

test('H3 E1 the clock starts again after a timeout while blanks remain', async () => {
  const { spell } = await boot('test=1&stage=stage1&skipTravel=1&hintMs=450');
  armFill(spell, 'swimming pool', 5);
  assert.ok(spell.state.blanks.length >= 3);
  const turn = spell.state.turnLeft;
  await wait(750);
  assert.equal(filledCount(spell), 1);
  assert.equal(spell.state.turnLeft, turn - 1);
  await wait(750);
  assert.equal(filledCount(spell), 2);
  assert.equal(spell.state.turnLeft, turn - 2);
});

test('E3 E2 a timeout that lands on 0 strikes with enemy atk only, then the count resets', async () => {
  const { spell, document } = await boot('test=1&stage=stage1&skipTravel=1');
  armFill(spell, 'library', 1);
  assert.equal(spell.state.monster.atk, 1);
  spell.state.turnLeft = 1;
  const hp = spell.state.hero.hp;
  const before = filledCount(spell);
  spell.handleHintTimeout();
  assert.equal(filledCount(spell), before + 1);
  assert.equal(spell.state.hero.hp, hp - 1);
  assert.equal(spell.state.turnLeft, 3);
  assert.equal(document.getElementById('turn-count-num').textContent, '0');
  assert.doesNotMatch(document.getElementById('feedback').textContent, /−2|Hint/);
});

test('E4 pick mode does not auto-fill or spend a turn when the hint interval elapses', async () => {
  const { spell, document } = await boot('test=1&stage=stage1&skipTravel=1&hintMs=400');
  spell.state.index = 0;
  spell.state.forceMode = 'pick';
  spell.state.forceWord = 'draw';
  spell.beginBattle();
  assert.equal(spell.state.mode, 'pick');
  const turn = spell.state.turnLeft;
  const hp = spell.state.hero.hp;
  await wait(800);
  assert.equal(spell.state.mode, 'pick');
  assert.equal(spell.state.turnLeft, turn);
  assert.equal(spell.state.hero.hp, hp);
  assert.equal(document.getElementById('hint-countdown').hidden, true);
  assert.equal(spell.state.blanks.length, 0);
});

test('H3 a finished blank row does not keep restarting the countdown', async () => {
  const { spell, document } = await boot('test=1&stage=stage1&skipTravel=1&hintMs=400');
  armFill(spell, 'draw', 0);
  assert.equal(spell.state.blanks.length, 1);
  const turn = spell.state.turnLeft;
  await wait(700);
  assert.equal(filledCount(spell), 1);
  assert.equal(spell.state.turnLeft, turn - 1);
  assert.equal(document.getElementById('hint-countdown').hidden, true);
  await wait(700);
  assert.equal(spell.state.turnLeft, turn - 1);
  assert.equal(document.getElementById('hint-countdown').hidden, true);
});

test('N1 enemy countdown still opens at 3, 3, and 2', async () => {
  const { spell, document } = await boot('test=1&stage=stage1&skipTravel=1');
  armFill(spell, 'draw', 0);
  assert.equal(spell.state.turnLeft, 3);
  assert.equal(document.getElementById('turn-count-num').textContent, '3');
  armFill(spell, 'draw', 6);
  assert.equal(spell.state.monster.role, 'mini');
  assert.equal(spell.state.turnLeft, 3);
  armFill(spell, 'library', 7);
  assert.equal(spell.state.monster.role, 'boss');
  assert.equal(spell.state.turnLeft, 2);
  assert.equal(document.getElementById('turn-count-num').textContent, '2');
});
