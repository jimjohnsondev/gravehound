# Gravehound

A boy turns 18 in a forest village, a goblin steals his dog that same night,
and he learns the dog has been carrying his death since he was a baby.

A retro 8-bit style top-down RPG for the browser, built for phones first.

## Run it

You need [Node.js](https://nodejs.org) 22 or newer.

```sh
npm install
npm run dev
```

Open the Local URL it prints. To play on your phone, connect it to the same
Wi-Fi and open the Network URL instead.

## Controls

| Button | Keyboard | Gamepad | Phone |
| --- | --- | --- | --- |
| Move (8 directions) | Arrows / WASD | D-pad / left stick | D-pad |
| A | Z / Space / J | A | A |
| B | X / K | B | B |
| Menu | Enter / Esc | Start | MENU |

Right now **B** cycles the light level (a debug feature) and **Menu** opens the
menu, with the hero's items and stats.
Walk through the cottage door to reach the wood's edge.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run check` | Type-checks the code (JSDoc + TypeScript) |
| `npm run build` | Builds the game into `dist/` |
| `npm run preview` | Serves the built game |

## Publishing

Pushing to `main` on GitHub builds the game and publishes it to GitHub Pages.
The one-time setup is in the repo's **Settings → Pages**: set **Source** to
**GitHub Actions**.

## More

- `docs/story-outline.md`: the story
- `docs/decisions.md`: design and technical decisions
- `docs/roadmap.md`: what's built and what's next
- `CLAUDE.md`: conventions for working on the code with Claude Code
