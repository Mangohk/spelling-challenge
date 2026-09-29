# spelling-challenge · Version Two

**拼字勇者** — a simple linear spelling RPG for kids.

Open `index.html` to play (or visit the GitHub Pages site).

## How to play

1. On the title screen, pick **第一關 (Stage One)** or **第二關 (Stage Two)**, then tap **開始冒險**.
2. Each stage has **8 encounters**: 6 small monsters → 1 Mini-Boss → 1 final Boss (different monster rosters per stage).
3. Each attack draws a **spelling word** from that stage’s dictation list. Spell it in the blanks.
4. **Correct spelling** damages the monster. **Wrong spelling** damages the hero.
5. Defeat a monster to get **equipment** (ATK, DEF, or special effects). Mini-Boss / Boss drop stronger gear.
6. Blank difficulty ramps from ~30% of letters to **100%** on the final Boss.
7. Clear all 8 fights to win, or Game Over if hero HP reaches 0.

## Stages

| Stage | Words | Monsters |
|-------|-------|----------|
| Stage One | Shared school-facilities list (for now) | Own 8-monster roster; final Boss **Miss Lam** |
| Stage Two | Same list until 第二次默書 content arrives | **Different** 8-monster roster (unused m01–m20 art) |

## Word list (for now)

Spelling prompts use a fixed dictation sample (school facilities). A settings screen to edit words will come later. Stage config is ready to swap Stage Two’s `wordsRaw` independently.

## Assets

- `assets/` — hero, scene, equipment
- `assets/monsters/` — monster portraits (`m01` … `m20`); each stage reuses a distinct subset

# Page
https://mangohk.github.io/spelling-challenge/
