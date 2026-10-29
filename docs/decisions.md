# Decisions

A running log of what we've decided and why. Add new entries at the bottom.

## Look and feel

- **Retro 8-bit feel, not 8-bit limits.** It should look and sound like an
  8-bit game without copying old hardware rules that don't help.
- **Screen resolution 320 x 192**, Atari-style. Tiles are 16 x 16, so a screen
  is 20 x 12 tiles.
- **Top-down 3/4 view.** Characters are taller than their collision box, so
  heads overlap the scenery behind them.
- **Dark scenery, glowing characters.** Lighting only shifts the background
  colour ramps darker. Characters never darken.
- **Fades go to black for everything**, sprites included.
- **Dialog** uses large portraits over an environmental background.

## Controls

- **Phone first, desktop second.**
- **8-direction movement**, using an on-screen d-pad plus **A**, **B** and **Menu**.
  Desktop uses the keyboard or a gamepad mapped to the same buttons.

## World

- **Maps are single screens or scrolling maps**, chosen per story beat. Single
  screens suit still, intimate scenes. Scrolling maps (in any direction) are
  for exploring.
- **Eight locations in a fixed order**, with the Underreach beneath them (see
  the story outline). A seed can shuffle side details.

## Tech

- **JavaScript with JSDoc types, built with Vite.** There's no framework. Types
  are checked with `npm run check`.
- **Human-readable code over clever code.**
- **Custom `.talk` dialog format, kept flat.** No nesting and no branching: a
  scene plays top to bottom, choices only set flags or label their replies,
  and any line can start with an `[if …]`. Every name is declared in
  `src/game` and checked on load. See `docs/talk-format.md`.
- **POKEY-inspired sound**, built on Web Audio, that still sounds authentically
  8-bit.
- **Hosted on GitHub Pages.**

## Art and tools

- **Art style guide plus an art import pipeline**, both built with Claude Code.
  This replaces drawing every asset by hand or relying on code-drawn
  placeholder art.
- **Art and music/SFX editors run from npm scripts** and are desktop-only.
  There's no editing on phones.

## First milestone

- **The engine, with placeholder content.**
