/**
 * Soft accept for turn countdown, pocket, instant equip, and attack loot.
 * Run: NODE_PATH=/tmp/stage3-test/node_modules node --test tests/turn-countdown-pocket.test.mjs
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

test('T5 D1 HUD has no DEF pill and the source has no light-hit path', () => {
  const { document } = load('test=1&stage=stage1&skipTravel=1');
  assert.equal(document.getElementById('def-pill'), null);
  assert.doesNotMatch(html, /LIGHT_HIT|Light hit|def-pill|amuletOpen|Wood Shield|Cloth Armor/);
});

test('T2 C1 countdown opens at 3 for normal and mini, and 2 for boss', async () => {
  const { spell, document } = await boot('test=1&stage=stage1&skipTravel=1');
  armFill(spell, 'draw', 0);
  assert.equal(spell.state.monster.role, 'normal');
  assert.equal(spell.state.turnLeft, 3);
  assert.equal(document.getElementById('turn-count-num').textContent, '3');

  armFill(spell, 'draw', 6);
  assert.equal(spell.state.monster.role, 'mini');
  assert.equal(spell.state.turnLeft, 3);
  assert.equal(document.getElementById('turn-count-num').textContent, '3');

  armFill(spell, 'library', 7);
  assert.equal(spell.state.monster.role, 'boss');
  assert.equal(spell.state.turnLeft, 2);
  assert.equal(document.getElementById('turn-count-num').textContent, '2');
});

test('T1 T6 C3 timeout fills one letter without HP loss or a turn spend; Hint spends a turn', async () => {
  const { spell } = await boot('test=1&stage=stage1&skipTravel=1');
  armFill(spell, 'library', 0);
  const hp = spell.state.hero.hp;
  const before = spell.state.blanks.filter((b) => b.value).length;
  const turn = spell.state.turnLeft;
  spell.handleHintTimeout();
  assert.equal(spell.state.hero.hp, hp);
  assert.equal(spell.state.turnLeft, turn);
  assert.equal(spell.state.blanks.filter((b) => b.value).length, before + 1);

  const hp2 = spell.state.hero.hp;
  const filled = spell.state.blanks.filter((b) => b.value).length;
  spell.useLetterHint();
  assert.equal(spell.state.hero.hp, hp2);
  assert.equal(spell.state.turnLeft, turn - 1);
  assert.equal(spell.state.blanks.filter((b) => b.value).length, filled + 1);
});

test('T3 T4 a wrong answer spends a turn and only the enemy atk hits when the count reaches 0', async () => {
  const { spell, document } = await boot('test=1&stage=stage1&skipTravel=1');
  armFill(spell, 'library', 1);
  assert.equal(spell.state.monster.atk, 1);
  const hp = spell.state.hero.hp;
  spell.state.blanks.forEach((b) => { b.value = 'q'; });
  spell.checkAnswer();
  assert.equal(spell.state.hero.hp, hp);
  assert.equal(spell.state.turnLeft, 2);
  assert.doesNotMatch(document.getElementById('feedback').textContent, /Light hit/);

  spell.state.locked = false;
  spell.state.review = null;
  spell.state.blanks.forEach((b) => { b.value = 'q'; });
  spell.checkAnswer();
  assert.equal(spell.state.hero.hp, hp);
  assert.equal(spell.state.turnLeft, 1);

  spell.state.locked = false;
  spell.state.review = null;
  spell.state.blanks.forEach((b) => { b.value = 'q'; });
  spell.checkAnswer();
  assert.equal(spell.state.hero.hp, hp - 1);
  assert.equal(spell.state.turnLeft, 3);
  assert.equal(document.getElementById('turn-count-num').textContent, '0');
  assert.match(document.getElementById('feedback').textContent, /Enemy hit −1/);
  assert.doesNotMatch(document.getElementById('feedback').textContent, /Light hit/);
});

test('T3 a correct answer spends a turn and the enemy does not hit after a knockout', async () => {
  const { spell } = await boot('test=1&stage=stage1&skipTravel=1');
  armFill(spell, 'draw', 0);
  assert.equal(spell.state.monster.hp, 1);
  const hp = spell.state.hero.hp;
  spell.state.blanks.forEach((b) => {
    b.value = spell.currentWord().word[b.index].toLowerCase();
  });
  spell.checkAnswer();
  assert.equal(spell.state.monster.hp, 0);
  assert.equal(spell.state.hero.hp, hp);
  assert.equal(spell.state.turnLeft, 2);
});

test('P1–P6 pocket cap, manual use, and no opening prefill or pocket max-HP item', async () => {
  const { spell, document } = await boot('test=1&stage=stage1&skipTravel=1');
  armFill(spell, 'swimming pool', 5);
  const hero = spell.state.hero;
  hero.hp = 4;
  const names = [...spell.POCKET_ITEMS].map((item) => String(item.name)).join('|');
  assert.equal(names, 'Healing Herb|Health Potion|Lucky Feather|Hint Amulet|Lucky Star');
  assert.equal(spell.POCKET_ITEMS.some((item) => item.kind === 'maxhp'), false);
  assert.equal(spell.EQUIPMENT.some((item) => item.kind === 'def'), false);

  for (let i = 0; i < 5; i += 1) {
    assert.equal(spell.applyLoot({ id: 'herb', name: 'Healing Herb', kind: 'heal', value: 3 }), true);
  }
  assert.equal(hero.pocket.length, 5);
  assert.equal(spell.applyLoot({ id: 'herb', name: 'Healing Herb', kind: 'heal', value: 3 }), false);
  assert.equal(hero.pocket.length, 5);
  assert.match(document.getElementById('battle-toast').textContent, /口袋已滿/);
  assert.equal(document.querySelectorAll('.pocket-slot').length, 5);
  assert.equal(document.getElementById('pocket-toggle').textContent.trim(), 'Pocket');
  assert.equal(document.getElementById('pocket-count'), null);

  spell.usePocketItem(0);
  assert.equal(hero.pocket.length, 4);
  assert.equal(hero.hp, 7);
  assert.ok(document.querySelector('.hp-bar').classList.contains('heal-flash'));

  hero.pocket.unshift({ id: 'health_potion', name: 'Health Potion', kind: 'fullheal', pocket: true });
  spell.usePocketItem(0);
  assert.equal(hero.hp, hero.maxHp);
  assert.ok(document.querySelector('.hp-bar').classList.contains('heal-strong'));

  hero.pocket.unshift({ id: 'lucky_feather', name: 'Lucky Feather', kind: 'double', pocket: true });
  spell.usePocketItem(0);
  assert.equal(hero.doubleNext, true);
  assert.equal(document.getElementById('feather-mark').hidden, false);

  const emptyBefore = spell.state.blanks.filter((b) => !b.value).length;
  assert.ok(emptyBefore >= 5);
  hero.pocket.unshift({ id: 'hint_amulet', name: 'Hint Amulet', kind: 'amulet', pocket: true });
  const turn = spell.state.turnLeft;
  spell.usePocketItem(0);
  const filled = spell.state.blanks.filter((b) => b.value).length;
  assert.ok(filled >= 3 && filled <= 5, `filled ${filled}`);
  assert.equal(spell.state.turnLeft, turn);
  assert.equal(spell.state.amuletArmed, false);

  spell.state.blanks.forEach((b) => { b.value = ''; });
  spell.preparePuzzle();
  assert.equal(spell.state.blanks.filter((b) => b.value).length, 0);

  const monsterHp = spell.state.monster.hp;
  hero.pocket = [{ id: 'lucky_star', name: 'Lucky Star', kind: 'star', pocket: true }];
  spell.state.locked = false;
  spell.state.review = null;
  spell.usePocketItem(0);
  assert.equal(hero.pocket.length, 0);
  assert.ok(spell.state.monster.hp < monsterHp);
  assert.equal(hero.doubleNext, false);
});

test('E1–E6 gear equips immediately, once per name, with the ATK cap and elite-only crystals', () => {
  const { spell, document } = load('test=1&stage=stage1&skipTravel=1');
  const hero = {
    hp: 10,
    maxHp: 10,
    atk: 1,
    equipment: [],
    pocket: [],
    doubleNext: false
  };
  spell.state.hero = hero;
  spell.state.index = 0;

  const normalNames = spell.legalLootList().map((item) => item.name);
  assert.equal(normalNames.includes('Crystal Heart Blade'), false);
  assert.equal(normalNames.includes('Crystal Heart Medallion'), false);
  assert.equal(normalNames.includes('Wood Sword'), true);
  assert.equal(normalNames.includes('Wooden Shield'), true);

  spell.state.index = 6;
  const miniNames = spell.legalLootList().map((item) => item.name);
  assert.equal(miniNames.includes('Crystal Heart Blade'), true);
  assert.equal(miniNames.includes('Crystal Heart Medallion'), true);

  spell.applyGear(spell.GEAR_ITEMS.find((item) => item.name === 'Wood Sword'));
  assert.equal(hero.atk, 2);
  assert.equal(hero.pocket.length, 0);
  spell.applyGear(spell.GEAR_ITEMS.find((item) => item.name === 'Wood Sword'));
  assert.equal(hero.atk, 2);
  assert.equal(hero.equipment.filter((item) => item.name === 'Wood Sword').length, 1);

  spell.applyGear(spell.GEAR_ITEMS.find((item) => item.name === 'Crystal Heart Blade'));
  assert.equal(hero.atk, 3);
  assert.equal(document.getElementById('equip-banner-name').textContent, 'Crystal Heart Blade');
  assert.equal(document.getElementById('equip-banner-img').getAttribute('src'), 'assets/equipment/crystal-heart-blade.png');
  assert.equal(document.getElementById('equip-banner').hidden, false);

  hero.atk = 3;
  for (let i = 0; i < 20; i += 1) {
    const card = spell.pickLoot();
    assert.notEqual(card.kind, 'atk');
  }

  spell.applyGear(spell.GEAR_ITEMS.find((item) => item.name === 'Wooden Shield'));
  spell.applyGear(spell.GEAR_ITEMS.find((item) => item.name === 'Cloth Vest'));
  spell.applyGear(spell.GEAR_ITEMS.find((item) => item.name === 'Leather Cap'));
  spell.applyGear(spell.GEAR_ITEMS.find((item) => item.name === 'Crystal Heart Medallion'));
  assert.equal(hero.maxHp, 10 + 2 + 3 + 3 + 8);
  assert.equal(hero.hp, hero.maxHp);
  assert.equal(document.getElementById('equip-banner-img').getAttribute('src'), 'assets/equipment/crystal-heart-medallion.png');
  assert.equal(fs.existsSync(path.join(root, 'assets/equipment/crystal-heart-blade.png')), true);
  assert.equal(fs.existsSync(path.join(root, 'assets/equipment/crystal-heart-medallion.png')), true);
});

test('L1–L5 attack loot is a separate 12% drop, and a full pocket refuses pocket items only', async () => {
  const { spell, document } = await boot('test=1&stage=stage1&skipTravel=1');
  armFill(spell, 'library', 1);
  assert.equal(spell.ATTACK_LOOT_CHANCE, 0.12);
  const hero = spell.state.hero;
  hero.pocket = [];
  spell.state.lootChance = 0;
  spell.state.blanks.forEach((b) => {
    b.value = spell.currentWord().word[b.index].toLowerCase();
  });
  const gearBefore = hero.equipment.length;
  spell.checkAnswer();
  assert.equal(spell.state.lastAttackLoot, null);
  assert.equal(hero.pocket.length, 0);
  assert.equal(hero.equipment.length, gearBefore);

  spell.state.lootChance = 1;
  spell.state.locked = false;
  spell.state.review = null;
  const dropped = spell.tryAttackLoot();
  assert.ok(dropped && dropped.dropped);
  assert.ok(spell.state.lastAttackLoot);
  const landed = hero.pocket.length + hero.equipment.length;
  assert.equal(landed, gearBefore + 1);

  hero.pocket = Array.from({ length: 5 }, () => ({ id: 'herb', name: 'Healing Herb', kind: 'heal', value: 3, pocket: true }));
  hero.equipment = [];
  hero.atk = 1;
  const refused = spell.resolveAttackLoot({ id: 'health_potion', name: 'Health Potion', kind: 'fullheal', pocket: true });
  assert.equal(refused.dropped, false);
  assert.equal(refused.reason, 'full');
  assert.equal(hero.pocket.length, 5);
  assert.match(document.getElementById('battle-toast').textContent, /口袋已滿/);

  const atkBefore = hero.atk;
  const armed = spell.resolveAttackLoot(spell.GEAR_ITEMS.find((item) => item.id === 'iron_sword'));
  assert.equal(armed.dropped, true);
  assert.equal(armed.where, 'equip');
  assert.equal(hero.pocket.length, 5);
  assert.ok(hero.atk > atkBefore);
  assert.equal(hero.equipment.some((item) => item.name === 'Iron Sword'), true);

  const pair = spell.pickLootPair();
  assert.equal(pair.length, 2);
  assert.equal(pair.some((item) => item.name === 'Crystal Heart Blade' || item.name === 'Crystal Heart Medallion'), false);
  spell.showLoot(pair);
  assert.equal(document.getElementById('loot').classList.contains('active'), true);
  assert.equal(document.querySelectorAll('.loot-choice').length, 2);
});

test('F3 item FX does not disable the letter keys or Attack', async () => {
  const { spell, document } = await boot('test=1&stage=stage1&skipTravel=1');
  armFill(spell, 'draw', 1);
  spell.state.hero.pocket = [{ id: 'herb', name: 'Healing Herb', kind: 'heal', value: 3, pocket: true }];
  spell.state.hero.hp = 5;
  spell.usePocketItem(0);
  assert.equal(document.getElementById('check-btn').disabled, false);
  assert.equal(document.getElementById('letter-hint-btn').disabled, false);
  assert.equal(document.getElementById('keyboard').hidden, false);
  assert.equal(spell.state.locked, false);
});
