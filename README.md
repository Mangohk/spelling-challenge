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
| Stage One | Shared school-facilities list (picture prompts) | Own 8-monster roster; final Boss **Miss Lam** (`miss-lam.png`) |
| Stage Two | Same list until the second dictation content arrives | **Different** 8-monster roster (unused m01–m20 art) |

## Word list (for now)

Spelling targets stay English. Chinese meanings are replaced by images in `assets/words/`. Stage config can swap Stage Two’s `words` independently later.

## Assets

- `assets/` — hero, scene, equipment
- `assets/monsters/` — monster portraits (`m01` … `m20`, plus `miss-lam.png`)
- `assets/words/` — picture prompts for each vocabulary item

# Page
https://mangohk.github.io/spelling-challenge/
