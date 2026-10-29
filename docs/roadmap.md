# Roadmap

## Milestone 1: the engine, with placeholder content

Done in the starter project:

- [x] 320 x 192 canvas, scaled crisply to fit phone (portrait and landscape)
      and desktop
- [x] Fixed-rate 60 Hz game loop
- [x] Input: keyboard, gamepad, and on-screen d-pad with A / B / Menu
      (8 directions, slide between them)
- [x] Tile maps written as text, with solid tiles and wall sliding
- [x] Single-screen and scrolling maps, with a camera clamped to the map edges
- [x] Map exits, with a stepped fade to black between maps
- [x] Palette ramps and background-only lighting (press B to try it)
- [x] Placeholder hero and Ash, with walk frames; Ash follows your footsteps
- [x] Two test maps: Wren's cottage (single screen) and the wood's edge (scrolling)
- [x] GitHub Pages deploy workflow

Still to do for milestone 1:

- [ ] Pixel font and text rendering
- [ ] Dialog box: big portrait over the background, plus the `.talk` file
      format and its parser
- [ ] Interact with A: talk to NPCs, read signs, open chests
- [ ] NPCs that stand still or wander
- [ ] Menu screen (replacing the current pause)
- [ ] Sound: a POKEY-style synth on Web Audio, sound effects, and a music player
- [ ] Save and load in localStorage
- [ ] Death and the Underreach loop: fall into the netherworld, then find the way up
- [ ] Simple one-button combat (the father's knife) and one enemy type (the wisp)
- [ ] Full-screen and "add to home screen" support for phones

## Milestone 2: tools and art pipeline (desktop only)

- [ ] Art style guide: palette, ramps, sprite sizes, outline rules
- [ ] Art import pipeline (`npm run import-art`): turns source images into
      palette-mapped tiles and sprite sheets
- [ ] Map editor (`npm run map-editor`)
- [ ] Music and SFX editor (`npm run sound-editor`)

## Milestone 3: Act I

- [ ] Cottage, Hollin village and the Lantern & Thorn, with real art
- [ ] The kindling errand tutorial, birthday supper, the theft
- [ ] Meeting Maren, Tobin's first appearance
