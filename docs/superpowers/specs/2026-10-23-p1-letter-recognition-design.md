# P1 Letter Recognition Game — Design

## Goal

A fun, easy HTML game for Primary 1 EFL students with SpLD to recognise letters **A–Z** and **a–z**. Opens from Spelling Hero; stays simple and separate from the spelling RPG combat loop.

## Audience constraints

- Large tap targets, high contrast, clear rounded type (Fredoka / Nunito)
- No countdown pressure; wrong answers invite a gentle retry
- Slow TTS letter names; Hear again always available
- One job per screen; minimal text in English

## Approach (chosen)

**Standalone `letters.html` (“Letter Hero”)** linked from the Spelling Hero title screen.

Alternatives considered:

1. Fold into existing Fill/Pick/Fix combat — too hard for pure letter recognition; combat HP is stressful for SpLD
2. Fully separate repo — worse for teachers already using this Pages site
3. **Standalone page in this repo (chosen)** — clear entry, shared brand/assets, no combat

## Game modes

Each play session: **10 rounds**, star progress, end celebration.

| Mode | Prompt | Action |
|------|--------|--------|
| **Find It** | Big target letter shown + spoken | Tap the matching letter among 4 choices |
| **Match Friends** | Upper (or lower) shown + spoken | Tap the other case among 4 |
| **Hear & Tap** | Letter name spoken only (no target glyph) | Tap the letter among 4 |

## Options (title screen)

- **Letters:** Capitals / Small / Mix
- **Mode:** Find It / Match Friends / Hear & Tap / Mix modes
- Start uses existing hero art for familiarity

## Feedback

- Correct: short cheer SFX + star fill + next round
- Wrong: soft shake, “Try again”, target stays the same; no score loss
- End: stars out of 10 + Play again / Back to Spelling Hero

## Tech

- Single file `letters.html` (CSS + JS inline, same pattern as `index.html`)
- Web Speech API for letter names (rate ~0.7)
- Web Audio oscillators for soft SFX (no new asset files required)
- Link from `index.html` title; README mention

## Out of scope

- Writing/tracing strokes
- Phonics sounds beyond letter names
- Accounts, levels save, combat HP
