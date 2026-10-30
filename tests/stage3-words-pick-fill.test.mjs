/**
 * Soft accept for Stage 3 word images + global pick/fill gate (I/W/M/B/R).
 * Run: NODE_PATH=/tmp/stage3-test/node_modules node --test tests/stage3-words-pick-fill.test.mjs
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

const POOL_A = [
  ['on foot', 'assets/words/on-foot.png'],
  ['on walk', 'assets/words/on-walk.png'],
  ['by school bus', 'assets/words/by-school-bus.png'],
  ['by taxi', 'assets/words/by-taxi.png'],
  ['by car', 'assets/words/by-car.png'],
  ['by minibus', 'assets/words/by-minibus.png'],
  ['by tram', 'assets/words/by-tram.png'],
  ['by ferry', 'assets/words/by-ferry.png'],
  ['by MTR', 'assets/words/by-mtr.png'],
  ['by train', 'assets/words/by-train.png'],
  ['by light rail', 'assets/words/by-light-rail.png'],
  ['apple', 'assets/words/apple.png'],
  ['banana', 'assets/words/banana.png'],
  ['mango', 'assets/words/mango.png'],
  ['pear', 'assets/words/pear.png'],
  ['kiwi', 'assets/words/kiwi.png'],
  ['live in japan', 'assets/words/live-in-japan.png'],
  ['live in thailand', 'assets/words/live-in-thailand.png'],
  ['every day', 'assets/words/every-day.png'],
  ['little sister niko', 'assets/words/little-sister-niko.png'],
  ['like a dog', 'assets/words/like-a-dog.png'],
  ['taxi driver', 'assets/words/taxi-driver.png'],
  ["i don't mind", 'assets/words/i-dont-mind.png'],
  ['chat with', 'assets/words/chat-with.png']
];
const BOSS = ["i live on hong kong island.", 'assets/words/i-live-on-hong-kong-island.png'];

const STAGE1 = [
  ['art room', 'assets/words/art-room.png'],
  ['first floor', 'assets/words/first-floor.png'],
  ['draw', 'assets/words/draw.png'],
  ['paint', 'assets/words/paint.png'],
  ['puppets', 'assets/words/puppets.png'],
  ['library', 'assets/words/library.png'],
  ['second floor', 'assets/words/second-floor.png'],
  ['borrow', 'assets/words/borrow.png'],
  ['swimming pool', 'assets/words/swimming-pool.png'],
  ['pond', 'assets/words/pond.png'],
  ['students', 'assets/words/students.png']
];
const STAGE2 = [
  ['sit still', 'assets/words/sit-still.jpg'],
  ['line up', 'assets/words/line-up.jpg'],
  ['keep quiet', 'assets/words/keep-quiet.jpg'],
  ['wait for your turn', 'assets/words/wait-for-your-turn.jpg'],
  ['keep off the grass', 'assets/words/keep-off-the-grass.jpg'],
  ['spit', 'assets/words/spit.jpg'],
  ['litter', 'assets/words/litter.jpg'],
  ['pick the flowers', 'assets/words/pick-the-flowers.jpg'],
  ['climb', 'assets/words/climb.jpg'],
  ['every', 'assets/words/every.jpg'],
  ['friday', 'assets/words/friday.jpg'],
  ['morning', 'assets/words/morning.jpg'],
  ['assembly', 'assets/words/assembly.jpg'],
  ['school hall', 'assets/words/school-hall.jpg'],
  ['run around', 'assets/words/run-around.jpg'],
  ['pay attention', 'assets/words/pay-attention.jpg']
];

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

function pairs(list) {
  return Array.from(list, (item) => [String(item.word), String(item.img || '')]);
}

function letters(word) {
  return (String(word).match(/[a-z]/gi) || []).length;
}

function blankCount(document) {
  return document.querySelectorAll('#slots .slot:not(.space):not(.given)').length;
}

function expectedBlanks(word, index) {
  const L = letters(word);
  if (!L) return 0;
  const ratio = [0.30, 0.30, 0.30, 0.55, 0.55, 0.75, 0.90, 1][index];
  return Math.min(L, Math.max(1, Math.round(L * ratio)));
}

async function showWord(spell, document, word, index, mode) {
  spell.state.index = index;
  spell.state.forceMode = mode;
  spell.state.forceWord = word;
  spell.state.amuletArmed = false;
  spell.preparePuzzle();
  await new Promise((r) => setTimeout(r, 0));
}

test('I1 I2 the 25 Stage 3 word images are in assets/words and by-bus.png is absent', () => {
  const names = POOL_A.map((row) => path.basename(row[1])).concat(path.basename(BOSS[1]));
  assert.equal(names.length, 25);
  assert.equal(new Set(names).size, 25);
  for (const name of names) {
    const file = path.join(root, 'assets/words', name);
    assert.ok(fs.existsSync(file), `missing ${name}`);
    const magic = fs.readFileSync(file).subarray(0, 8);
    assert.equal(magic[0], 0x89);
    assert.equal(magic.toString('ascii', 1, 4), 'PNG');
  }
  assert.equal(fs.existsSync(path.join(root, 'assets/words/by-bus.png')), false);
});

test('W1 W2 W3 pool A is the 24 phrases, boss stays separate, stage 1 and 2 words stay put', () => {
  const { spell } = load('test=1&stage=stage3&skipTravel=1');
  assert.deepEqual(pairs(spell.state.stage.words), POOL_A);
  assert.equal(spell.state.stage.words.some((w) => w.word === 'by bus'), false);
  assert.deepEqual(pairs(spell.state.stage.bossWords), [BOSS]);

  const stage1 = load('test=1&stage=stage1&skipTravel=1');
  assert.deepEqual(pairs(stage1.spell.state.stage.words), STAGE1);
  assert.equal(stage1.spell.state.stage.bossWords, undefined);

  const stage2 = load('test=1&stage=stage2&skipTravel=1');
  assert.deepEqual(pairs(stage2.spell.state.stage.words), STAGE2);
});

test('R1 a Stage 3 prompt shows that word image and does not keep a Stage 1 picture', async () => {
  const { document, spell } = load('test=1&stage=stage3&skipTravel=1');
  document.getElementById('start-btn').click();
  await new Promise((r) => setTimeout(r, 20));

  for (const [word, img] of POOL_A) {
    await showWord(spell, document, word, 0, 'fill');
    const el = document.getElementById('word-prompt-img');
    assert.equal(el.hidden, false, word);
    assert.equal(el.getAttribute('src'), img, word);
    assert.doesNotMatch(el.getAttribute('src'), /art-room|sit-still|library/);
  }
  await showWord(spell, document, BOSS[0], 7, 'fill');
  const bossImg = document.getElementById('word-prompt-img');
  assert.equal(bossImg.hidden, false);
  assert.equal(bossImg.getAttribute('src'), BOSS[1]);

  const apple = spell.state.words.find((w) => w.word === 'apple');
  apple.img = '';
  await showWord(spell, document, 'apple', 0, 'fill');
  const cleared = document.getElementById('word-prompt-img');
  assert.equal(cleared.hidden, true);
  assert.equal(cleared.getAttribute('src'), null);
});

test('M1–M5 fix is never selected; fights 1–3 are pick or fill; fights 4–8 are fill only', async () => {
  const { spell, window: game } = load('test=1&stage=stage1&skipTravel=1');
  const random = game.Math.random;
  const samples = [0, 0.2, 0.49, 0.5, 0.8, 0.99];

  function roll(index, extra) {
    spell.state.index = index;
    spell.state.forceMode = '';
    spell.state.amuletArmed = false;
    spell.state.puzzlesServed = 0;
    spell.state.modesSeen = new Set();
    Object.assign(spell.state, extra || {});
    return spell.pickMode();
  }

  try {
    for (let index = 0; index < 8; index += 1) {
      const seen = new Set();
      for (const value of samples) {
        game.Math.random = () => value;
        const mode = roll(index);
        seen.add(mode);
        assert.notEqual(mode, 'fix', `fight ${index + 1}`);
        if (index <= 2) assert.ok(mode === 'fill' || mode === 'pick', mode);
        else assert.equal(mode, 'fill', `fight ${index + 1} got ${mode}`);
      }
      if (index <= 2) {
        assert.ok(seen.has('fill'), `fight ${index + 1} can fill`);
        assert.ok(seen.has('pick'), `fight ${index + 1} can pick`);
      }

      game.Math.random = () => 0.99;
      const forcedFix = roll(index, { forceMode: 'fix' });
      assert.notEqual(forcedFix, 'fix');
      if (index <= 2) assert.ok(forcedFix === 'fill' || forcedFix === 'pick');
      else assert.equal(forcedFix, 'fill');
      assert.equal(roll(index, { forceMode: 'pick' }), index <= 2 ? 'pick' : 'fill');
      assert.equal(roll(index, { forceMode: 'fill' }), 'fill');
      assert.equal(roll(index, { amuletArmed: true }), 'fill');
      assert.equal(roll(index, {
        amuletArmed: true,
        forceMode: 'fix',
        puzzlesServed: 3,
        modesSeen: new Set(['fill', 'pick'])
      }), 'fill');

      game.Math.random = () => 0;
      const diversified = roll(index, {
        puzzlesServed: 1,
        modesSeen: new Set(['fill'])
      });
      assert.equal(diversified, index <= 2 ? 'pick' : 'fill');
      assert.equal(roll(index, {
        puzzlesServed: 1,
        modesSeen: new Set(['pick'])
      }), 'fill');
    }
  } finally {
    game.Math.random = random;
  }

  const stage3 = load('test=1&stage=stage3&skipTravel=1');
  stage3.document.getElementById('start-btn').click();
  await new Promise((r) => setTimeout(r, 20));
  stage3.spell.state.index = 6;
  stage3.spell.state.forceMode = 'pick';
  stage3.spell.state.forceWord = 'by tram';
  stage3.spell.preparePuzzle();
  assert.equal(stage3.spell.state.mode, 'fill');
  assert.equal(stage3.document.getElementById('mode-pill').textContent, 'Fill');
  assert.doesNotMatch(stage3.document.getElementById('title-hint').textContent, /Fix/);
  assert.match(stage3.document.getElementById('title-hint').textContent, /Fill/);
  assert.match(stage3.document.getElementById('title-hint').textContent, /Pick/);
  assert.doesNotMatch(stage3.document.getElementById('mode-hint').textContent, /Fix/);
});

test('B1–B4 fill blanks follow the fight ratio; pick does not; later fights are not easier', async () => {
  const { document, spell } = load('test=1&stage=stage3&skipTravel=1');
  document.getElementById('start-btn').click();
  await new Promise((r) => setTimeout(r, 20));

  const tram = [];
  for (let index = 0; index < 8; index += 1) {
    await showWord(spell, document, 'by tram', index, 'fill');
    const blanks = blankCount(document);
    tram.push(blanks);
    assert.equal(blanks, expectedBlanks('by tram', index), `by tram fight ${index + 1}`);
    assert.equal(spell.state.mode, 'fill');
  }
  assert.deepEqual(tram, [2, 2, 2, 3, 3, 5, 5, 6]);
  for (let i = 1; i < tram.length; i += 1) assert.ok(tram[i] >= tram[i - 1]);

  await showWord(spell, document, 'kiwi', 0, 'fill');
  assert.equal(blankCount(document), 1);
  await showWord(spell, document, 'kiwi', 6, 'fill');
  assert.equal(blankCount(document), 4);
  await showWord(spell, document, "i don't mind", 7, 'fill');
  assert.equal(blankCount(document), 9);
  assert.ok([...document.querySelectorAll('#slots .slot.given')].some((slot) => slot.textContent === "'"));

  await showWord(spell, document, BOSS[0], 7, 'fill');
  assert.equal(blankCount(document), letters(BOSS[0]));
  assert.equal(blankCount(document), 21);
  assert.ok([...document.querySelectorAll('#slots .slot.given')].some((slot) => slot.textContent === '.'));

  await showWord(spell, document, 'by school bus', 0, 'pick');
  assert.equal(spell.state.mode, 'pick');
  assert.equal(spell.state.blanks.length, 0);
  assert.equal(blankCount(document), 0);

  const stage2 = load('test=1&stage=stage2&skipTravel=1');
  stage2.document.getElementById('start-btn').click();
  await new Promise((r) => setTimeout(r, 20));
  await showWord(stage2.spell, stage2.document, 'sit still', 0, 'fill');
  assert.equal(blankCount(stage2.document), expectedBlanks('sit still', 0));
  const img = stage2.document.getElementById('word-prompt-img');
  assert.equal(img.hidden, false);
  assert.match(img.getAttribute('src') || '', /sit-still\.jpg$/);
  await showWord(stage2.spell, stage2.document, 'sit still', 7, 'pick');
  assert.equal(stage2.spell.state.mode, 'fill');
  assert.equal(blankCount(stage2.document), letters('sit still'));

  const stage1 = load('test=1&stage=stage1&skipTravel=1');
  stage1.document.getElementById('start-btn').click();
  await new Promise((r) => setTimeout(r, 20));
  await showWord(stage1.spell, stage1.document, 'art room', 2, 'pick');
  assert.equal(stage1.spell.state.mode, 'pick');
  assert.match(stage1.document.getElementById('word-prompt-img').getAttribute('src') || '', /art-room\.png$/);
  await showWord(stage1.spell, stage1.document, 'library', 4, 'pick');
  assert.equal(stage1.spell.state.mode, 'fill');
  assert.equal(blankCount(stage1.document), expectedBlanks('library', 4));
  assert.match(stage1.document.getElementById('word-prompt-img').getAttribute('src') || '', /library\.png$/);
});
