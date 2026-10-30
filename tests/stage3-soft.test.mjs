/**
 * Soft accept checks for Stage 3 Traveling means + global combat (S/W/G/R).
 * Run: NODE_PATH=/tmp/stage3-test/node_modules node --test tests/stage3-soft.test.mjs
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
  'on foot',
  'on walk',
  'by school bus',
  'by taxi',
  'by car',
  'by minibus',
  'by bus',
  'by tram',
  'by ferry',
  'by MTR',
  'by train',
  'by light rail',
  'apple',
  'banana',
  'mango',
  'pear',
  'kiwi',
  'live in japan',
  'live in thailand',
  'every day',
  'little sister niko',
  'like a dog',
  'taxi driver',
  "i don't mind",
  'chat with'
];
const BOSS_ONLY = 'i live on hong kong island.';

const MONSTERS = [
  ['s3-m01', 'Footprint Slime', 'normal', 1, 1, 'assets/monsters/m-footprint-slime.png'],
  ['s3-m02', 'Zebra Cross Crab', 'normal', 6, 1, 'assets/monsters/m-zebra-cross-crab.png'],
  ['s3-m03', 'Schoolbus Beetle', 'normal', 6, 1, 'assets/monsters/m-schoolbus-beetle.png'],
  ['s3-m04', 'Taxi Toad', 'normal', 6, 1, 'assets/monsters/m-taxi-toad.png'],
  ['s3-m05', 'Minibus Moth', 'normal', 6, 1, 'assets/monsters/m-minibus-moth.png'],
  ['s3-m06', 'Tram Turtle', 'normal', 6, 1, 'assets/monsters/m-tram-turtle.png'],
  ['s3-mini', 'Ferry Fox', 'mini', 14, 2, 'assets/monsters/m-ferry-fox.png'],
  ['s3-boss', 'Island Guide', 'boss', 28, 2, 'assets/monsters/m-island-guide.png']
];

const ASSETS = [
  'assets/bg-city-travel-day.png',
  ...MONSTERS.map((row) => row[5])
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

function bgOf(el) {
  return String(el?.style?.backgroundImage || '');
}

function wordList(list) {
  return Array.from(list, (item) => String(item.word));
}

test('S2 asset files are copied to contract paths and bust/sheet/manifest are absent', () => {
  for (const rel of ASSETS) {
    assert.ok(fs.existsSync(path.join(root, rel)), `missing ${rel}`);
  }
  assert.equal(fs.existsSync(path.join(root, 'assets/monsters/m-island-guide-bust.png')), false);
  assert.equal(fs.existsSync(path.join(root, 'assets/monsters/MANIFEST.md')), false);
  assert.equal(fs.existsSync(path.join(root, 'MANIFEST.md')), false);
  assert.equal(fs.existsSync(path.join(root, 'assets/contact-sheet.jpg')), false);
});

test('S1 S4 R1 stage3 roster, button, and stage1/2 content stay put', () => {
  const { document, spell } = load('test=1&stage=stage3&skipTravel=1');
  const btn = document.querySelector('.stage-btn[data-stage="stage3"]');
  assert.ok(btn, 'third stage button');
  assert.match(btn.textContent, /Stage Three/);
  assert.match(btn.textContent, /Traveling means/);
  assert.equal(document.querySelectorAll('.stage-btn').length, 3);

  const stage = spell.state.stage;
  assert.equal(stage.id, 'stage3');
  assert.equal(stage.bg, 'assets/bg-city-travel-day.png');
  assert.equal(stage.monsters.length, 8);
  MONSTERS.forEach((row, i) => {
    const m = stage.monsters[i];
    assert.equal(m.id, row[0], `id ${i}`);
    assert.equal(m.name, row[1], `name ${i}`);
    assert.equal(m.role, row[2], `role ${i}`);
    assert.equal(m.hp, row[3], `hp ${i}`);
    assert.equal(m.atk, row[4], `atk ${i}`);
    assert.equal(m.img, row[5], `img ${i}`);
  });
  assert.deepEqual(wordList(stage.words), POOL_A);

  document.querySelector('[data-stage="stage1"]').click();
  assert.equal(spell.state.stage.id, 'stage1');
  assert.equal(spell.state.stage.monsters[0].name, 'Green Slime');
  assert.equal(spell.state.stage.monsters.at(-1).name, 'Miss Lam');
  assert.ok(spell.state.stage.words.some((w) => w.word === 'art room'));
  assert.equal(spell.state.stage.words.some((w) => w.word === 'on foot'), false);
  assert.equal(spell.state.stage.bg, undefined);

  document.querySelector('[data-stage="stage2"]').click();
  assert.equal(spell.state.stage.monsters[0].name, 'Rock Shroom');
  assert.equal(spell.state.stage.monsters.at(-1).name, 'Storm Eagle');
  assert.ok(spell.state.stage.words.some((w) => w.word === 'sit still'));
  assert.equal(spell.state.stage.words.some((w) => w.word === 'on foot'), false);
  assert.equal(spell.state.stage.bg, undefined);
  assert.match(document.querySelector('[data-stage="stage1"]').textContent, /Stage One/);
  assert.match(document.querySelector('[data-stage="stage2"]').textContent, /Stage Two/);
  assert.match(document.querySelector('[data-stage="stage2"]').textContent, /School rules/);
});

test('S3 title, travel, and battle backgrounds follow the active stage', async () => {
  const { document, spell } = load('test=1&stage=stage3&skipTravel=1');
  assert.match(bgOf(document.getElementById('title-scene')), /bg-city-travel-day\.png/);
  assert.match(bgOf(document.getElementById('travel-bg')), /bg-city-travel-day\.png/);

  spell.state.forceMode = 'fill';
  spell.state.forceWord = 'on foot';
  document.getElementById('start-btn').click();
  await new Promise((r) => setTimeout(r, 30));
  const arena = document.getElementById('arena');
  assert.match(bgOf(arena), /bg-city-travel-day\.png/);
  assert.equal(document.getElementById('monster-name').textContent, 'Footprint Slime');
  assert.match(document.getElementById('monster-img').getAttribute('src'), /m-footprint-slime\.png/);

  document.querySelector('[data-stage="stage1"]').click();
  assert.match(bgOf(document.getElementById('title-scene')), /scene\.png/);
  assert.doesNotMatch(bgOf(document.getElementById('title-scene')), /bg-city-travel-day/);
  assert.match(bgOf(document.getElementById('travel-bg')), /scene\.png/);
  assert.doesNotMatch(bgOf(arena), /bg-city-travel-day/);

  const stage2 = load('test=1&stage=stage2&skipTravel=1');
  assert.match(bgOf(stage2.document.getElementById('title-scene')), /scene\.png/);
  assert.doesNotMatch(bgOf(stage2.document.getElementById('title-scene')), /bg-city-travel-day/);
  stage2.document.getElementById('start-btn').click();
  await new Promise((r) => setTimeout(r, 30));
  assert.doesNotMatch(bgOf(stage2.document.getElementById('arena')), /bg-city-travel-day/);
  assert.equal(stage2.document.getElementById('monster-name').textContent, 'Rock Shroom');
});

test('W1 W2 W4 pool A keeps MTR case and does not show a Stage 1 word image', async () => {
  const { document, spell } = load('test=1&stage=stage3&skipTravel=1&forceMode=fill&forceWord=on%20foot');
  document.getElementById('start-btn').click();
  await new Promise((r) => setTimeout(r, 30));
  assert.deepEqual(wordList(spell.state.words), POOL_A);
  assert.ok(spell.state.words.some((w) => w.word === 'by MTR'));
  assert.equal(spell.state.words.some((w) => w.word === 'by mtr'), false);
  for (const fruit of ['apple', 'banana', 'mango', 'pear', 'kiwi']) {
    assert.ok(spell.state.words.some((w) => w.word === fruit), fruit);
  }
  assert.ok(spell.state.words.some((w) => w.word === 'on foot'));
  assert.ok(spell.state.words.some((w) => w.word === 'on walk'));
  const img = document.getElementById('word-prompt-img');
  assert.equal(img.hidden, true);
  const src = img.getAttribute('src') || '';
  assert.equal(/assets\/words\//.test(src), false);

  const stage1 = load('test=1&stage=stage1&skipTravel=1&forceMode=fill&forceWord=art%20room');
  stage1.document.getElementById('start-btn').click();
  await new Promise((r) => setTimeout(r, 30));
  const img1 = stage1.document.getElementById('word-prompt-img');
  assert.equal(img1.hidden, false);
  assert.match(img1.getAttribute('src') || img1.src, /assets\/words\/art-room\.png/);
});

test('G1 G2 deplete the current drawable set before any repeat; boss adds the island sentence', async () => {
  const { spell } = load('test=1&stage=stage3&skipTravel=1');
  spell.state.words = POOL_A.map((word) => ({ word, img: '', clue: '' }));
  spell.state.bossExtraWords = [{ word: BOSS_ONLY, img: '', clue: '' }];
  spell.state.usedWords = new Set();
  spell.state.attackWord = null;
  spell.state.wordDrawCounts = {};
  spell.state.index = 0;
  spell.state.stage = {
    ...spell.state.stage,
    words: POOL_A.map((word) => ({ word })),
    bossWords: [{ word: BOSS_ONLY }]
  };

  const seen = new Set();
  for (let i = 0; i < POOL_A.length; i += 1) {
    const picked = spell.pickNextAttackWord();
    assert.ok(picked, 'expected a word');
    assert.equal(seen.has(picked.word), false, `repeat before deplete: ${picked.word}`);
    assert.equal(picked.word === BOSS_ONLY, false);
    assert.ok(POOL_A.includes(picked.word));
    seen.add(picked.word);
  }
  assert.equal(seen.size, POOL_A.length);

  spell.state.index = 7;
  const bossDraw = spell.pickNextAttackWord();
  assert.equal(bossDraw.word, BOSS_ONLY);

  spell.state.index = 0;
  spell.state.usedWords = new Set();
  spell.state.attackWord = null;
  for (let i = 0; i < 80; i += 1) {
    const picked = spell.pickNextAttackWord();
    assert.notEqual(picked.word, BOSS_ONLY);
    assert.ok(POOL_A.includes(picked.word));
  }
});

test('G3 G4 pick stem is the answer prefix and fill still types', async () => {
  const { document, spell } = load('test=1&stage=stage3&skipTravel=1&forceMode=pick&forceWord=by%20MTR');
  document.getElementById('start-btn').click();
  await new Promise((r) => setTimeout(r, 30));
  const stem = document.getElementById('pick-stem');
  assert.ok(stem);
  assert.equal(stem.hidden, false);
  assert.equal(stem.textContent, 'by');
  const choices = [...document.querySelectorAll('.pick-choice')];
  assert.equal(choices.length, 3);
  assert.ok(choices.some((btn) => btn.dataset.word === 'by MTR'));

  const cases = [
    ['on foot', 'on'],
    ['apple', 'a'],
    ['by school bus', 'by s'],
    [BOSS_ONLY, 'i live on']
  ];
  for (const [word, expect] of cases) {
    spell.state.index = word === BOSS_ONLY ? 7 : 0;
    spell.state.forceMode = 'pick';
    spell.state.forceWord = word;
    spell.preparePuzzle();
    assert.equal(document.getElementById('pick-stem').textContent, expect, word);
    assert.equal(document.querySelectorAll('.pick-choice').length, 3, word);
  }

  spell.state.index = 0;
  spell.state.forceMode = 'fill';
  spell.state.forceWord = 'apple';
  spell.preparePuzzle();
  assert.equal(document.getElementById('pick-stem').hidden, true);
  assert.equal(document.getElementById('pick-choices').hidden, true);
  assert.equal(document.getElementById('slots').hidden, false);
  assert.ok(document.querySelectorAll('#slots .slot').length > 1);

  spell.state.forceMode = 'fix';
  spell.state.forceWord = 'kiwi';
  spell.preparePuzzle();
  assert.equal(document.getElementById('slots').hidden, false);
  assert.equal(document.getElementById('keyboard').hidden, false);
  assert.equal(document.getElementById('pick-choices').hidden, true);
});

test('G5 G6 G7 attack loot stays at or below 3 and respects the atk gate', () => {
  const { spell } = load('test=1&stage=stage3&skipTravel=1');
  const hero = {
    hp: 10,
    maxHp: 10,
    atk: 1,
    def: 0,
    equipment: [],
    doubleNext: false,
    amuletReady: false
  };
  spell.state.hero = hero;
  spell.state.index = 0;

  const first = spell.pickLoot();
  assert.equal(first.id, 'wood_sword');
  assert.equal(first.kind, 'atk');
  assert.equal(first.value, 1);
  spell.applyLoot(first);
  assert.equal(hero.atk, 2);

  spell.state.index = 7;
  for (let i = 0; i < 30; i += 1) {
    const item = spell.pickLoot();
    if (item.kind === 'atk') assert.equal(item.value, 1);
    assert.notEqual(item.id, 'iron_sword');
    const pair = spell.pickLootPair();
    for (const card of pair) {
      if (card.kind === 'atk') assert.equal(card.value, 1);
      assert.notEqual(card.id, 'iron_sword');
    }
  }

  hero.atk = 2;
  hero.equipment = [{ id: 'cloth_armor', name: 'Cloth Armor', kind: 'def', value: 1 }];
  const gated = spell.pickLoot();
  assert.ok(gated.kind !== 'atk' || gated.value === 1);
  assert.notEqual(gated.id, 'iron_sword');

  hero.atk = 3;
  hero.equipment = [
    { id: 'wood_sword', kind: 'atk', value: 1 },
    { id: 'iron_sword', kind: 'atk', value: 2 }
  ];
  for (let i = 0; i < 40; i += 1) {
    const pair = spell.pickLootPair();
    assert.equal(pair.length, 2);
    for (const card of pair) assert.notEqual(card.kind, 'atk');
    assert.notEqual(spell.pickLoot().kind, 'atk');
  }

  hero.atk = 2;
  hero.equipment = [];
  spell.applyLoot({ id: 'iron_sword', name: 'Iron Sword', kind: 'atk', value: 2 });
  assert.equal(hero.atk, 3);
  spell.applyLoot({ id: 'wood_sword', name: 'Wood Sword', kind: 'atk', value: 1 });
  assert.equal(hero.atk, 3);
  spell.applyLoot({ id: 'lucky_feather', name: 'Lucky Feather', kind: 'double', value: 1 });
  assert.equal(hero.doubleNext, true);
  assert.equal(hero.atk, 3);
});
