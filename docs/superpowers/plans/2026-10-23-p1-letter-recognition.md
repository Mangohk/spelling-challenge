# P1 Letter Recognition Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax.

**Goal:** Ship a standalone Letter Hero HTML game for A–Z / a–z recognition, linked from Spelling Hero.

**Architecture:** One self-contained `letters.html` with inline CSS/JS; title-screen link in `index.html`; short README note.

**Tech Stack:** Vanilla HTML/CSS/JS, Web Speech API, Web Audio API, existing `assets/hero.png` + scene colours.

## Global Constraints

- SpLD-friendly: large targets, no timer, soft retry, slow TTS
- Match Spelling Hero visual language (Fredoka, Nunito, leaf/sky/sun)
- No combat HP; 10-round star sessions
- English UI short and clear

---

### Task 1: Build `letters.html`

- [ ] Title options (case + mode) + play + result screens
- [ ] Round engine for Find It / Match Friends / Hear & Tap
- [ ] TTS + soft SFX + celebration motion
- [ ] Mobile-friendly layout

### Task 2: Wire Spelling Hero entry

- [ ] Add “Letter Hero (ABC)” link/button on title screen
- [ ] Update README

### Task 3: Verify & ship

- [ ] Open in browser / smoke-check flows
- [ ] Commit, push, open PR
