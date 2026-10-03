# spelling-challenge · Version Two

**Spelling Hero** — a simple linear spelling RPG for kids.

Open `index.html` to play (or visit the GitHub Pages site).

## How to play

1. On the title screen, pick **Stage One** or **Stage Two**, then tap **Start Adventure**.
2. Each stage has **8 encounters**: 6 small monsters → 1 Mini-Boss → 1 final Boss (different monster rosters per stage).
3. Each attack shows a **picture clue** for a spelling word. Fill the blanks to spell it.
4. **Correct spelling** damages the monster. **Wrong spelling** damages the hero.
5. Defeat a monster to get **equipment** (ATK, DEF, or special effects). Mini-Boss / Boss drop stronger gear.
6. Blank difficulty ramps from ~30% of letters to **100%** on the final Boss.
7. Clear all 8 fights to win, or Game Over if hero HP reaches 0.

## Stages

| Stage | Words | Monsters |
|-------|-------|----------|
| Stage One | School facilities (art room, library, pond, …) | Own 8-monster roster; final Boss **Miss Lam** (`miss-lam.png`) |
| Stage Two | 心圓二年級 二六年第二次英文默書 (school rules & assembly) | **Different** 8-monster roster (unused m01–m20 art) |

## Word lists

Spelling targets stay English. Picture prompts live in `assets/words/`. Each stage has its own `words` array.

**Stage Two** (16 unique phrases; “Sit still” appears once): sit still, line up, keep quiet, wait for your turn, keep off the grass, spit, litter, pick the flowers, climb, every, friday, morning, assembly, school hall, run around, pay attention.

## Assets

- `assets/` — hero, scene, equipment
- `assets/monsters/` — monster portraits (`m01` … `m20`, plus `miss-lam.png`)
- `assets/words/` — picture prompts for each vocabulary item

# Page
https://mangohk.github.io/spelling-challenge/
