# Gravehound: notes for Claude Code

Gravehound is a retro 8-bit style, top-down (3/4 view) RPG about a boy and his
dog, set in a dark fairytale. It runs in the browser and targets **phones first,
desktop second**. Story: `docs/story-outline.md`. Decisions so far:
`docs/decisions.md`. What to build next: `docs/roadmap.md`.

## Commands

- `npm run dev`: dev server with hot reload. `--host` is on, so a phone on the
  same Wi-Fi can open the Network URL it prints.
- `npm run check`: type-check the JSDoc types with TypeScript. Run it before
  calling any change done.
- `npm run build`: production build into `dist/`.
- `npm run preview`: serve the production build.

Add `?touch` to the URL to show the on-screen controls on desktop.
In the browser console, `gravehound.world` is the live game world.

## Code rules

The owner wants code that a person can read and understand. That beats clever.

- Plain JavaScript (ES modules). No frameworks and no runtime dependencies
  unless agreed first.
- JSDoc on every exported function and class, plus `@typedef`s for data shapes.
  `npm run check` must pass.
- Comments explain *why*, in plain English. Each file starts with a short
  comment saying what it is for.
- Named constants instead of magic numbers. Screen and tile sizes live in
  `src/engine/config.js`.
- Small files with one job each. Descriptive names (`overlapsSolid`, not `ovS`).
- Keep `src/engine/` free of story content. Story, maps and characters go in
  `src/game/`.

## Fixed technical decisions

- Screen is **160 x 144** pixels (Game Gear size), drawn on one canvas and
  scaled up. Tiles are **16 x 16**, so one screen is 10 x 9 tiles. Lay out
  maps, text, the dialog box and portraits for this size. Don't hard-code
  pixel sizes; use the constants in `engine/config.js`.
- Game logic runs at a fixed 60 updates a second (`engine/loop.js`). Change
  state only in `update`, and only draw in `draw`.
- Movement is 8-directional. Input is the d-pad plus **A**, **B** and **Menu**.
  Keyboard, gamepad and touch all map to those buttons (`engine/input.js`).
- Maps are either a single still screen (`mode: 'screen'`) or scroll in any
  direction (`mode: 'scroll'`), chosen per story beat.
- **Lighting only shifts the background colour ramps darker.** Characters keep
  their colours and stay bright. Background art is painted with
  `(ramp, step)` from `engine/palette.js`, never raw colours.
- Screen fades take everything to black, characters included (`engine/fade.js`).
- Dialog uses large character portraits over an environmental background,
  with lines in flat `.talk` files (`src/game/talk/`, format in
  `docs/talk-format.md`). Names they use are declared in `src/game` and
  checked when the game loads.
- Sound (not built yet): a synth modelled on the Atari POKEY, adapted for Web
  Audio, that still sounds authentically 8-bit.
- Art and music/SFX editors are **desktop-only** tools run with npm scripts,
  and live in `tools/`.
- Hosted on GitHub Pages (`.github/workflows/deploy.yml`). `vite.config.js`
  uses `base: './'` so it works from a sub-path.

## Placeholder art

Everything visual right now is drawn with code (`src/game/tiles.js`,
`src/game/sprites.js`) and is meant to be thrown away. Real art will come
through an art style guide and an import pipeline. Keep the *shapes of the data*
stable (tile characters, `solid` flags, sprite sheet layout of
rows = facing, columns = frames) so swapping art in doesn't touch game code.

## Layout

```
src/
  main.js            boots everything
  style.css          page layout and on-screen controls
  engine/            reusable machinery: screen, loop, input, palette,
                     tileset, tilemap, camera, sprite, fade,
                     font-glyphs (the pixel font as data), text, panel,
                     talk-parser, talk-checker, talk-runner, story-state,
                     dialog-box
  game/              Gravehound itself: world, character, hero, npc, ash, tiles,
                     sprites, map-banner, cast, portraits, backgrounds, story-flags,
                     talk-actions
    talk/            .talk dialog files; register new ones in talk/index.js
    maps/            one file per map; register new ones in maps/index.js.
                     check-maps tests the names they use when the game loads
tools/               desktop-only editors and the art import pipeline (planned)
docs/                story, decisions, roadmap
```
