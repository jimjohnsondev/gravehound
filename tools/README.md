# Tools

Desktop-only tools for making Gravehound. They aren't part of the game build.

Planned (see `docs/roadmap.md`, milestone 2):

- **Art import pipeline**: turns source art into palette-mapped tiles and
  sprite sheets in the layout the engine expects (rows = facing,
  columns = frames).
- **Map editor**
- **Music and SFX editor**: POKEY-style

Each tool gets its own folder here and an `npm run <tool>` script in
`package.json`.
