/**
 * The wood's edge outside the cottage: a scrolling map (40 x 24 tiles).
 * Dusk, so the scenery is darker (light level 2) while characters stay bright.
 *
 * Tile key: see game/tiles.js
 *   . grass   , long grass   = path   T tree   ~ water   # stone wall   D doorway
 *   s signpost   C chest
 */

/** @type {import('./index.js').MapDefinition} */
export const woodEdge = {
  id: 'woodEdge',
  name: "The wood's edge",
  mode: 'scroll',
  lightLevel: 2,
  music: 'dusk',
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TT....#######.....,,,,,.....TTTTTTTTTTTT',
    'TT..C.#######....,,,,,,,.....TTTTTTTTTTT',
    'TT....#######.........,,......TTTTTTTTTT',
    'TT....#######...................TTTTTTTT',
    'TT....###D###....................TTTTTTT',
    'TT.......=s.......................TTTTTT',
    'TT.......=..........,,,...........TTTTTT',
    'TT.......=.........,,,,,...........TTTTT',
    'TT.......==========......T..........TTTT',
    'TT,,..............=.................TTTT',
    'TT,,,.............=.........~~~~.....TTT',
    'TT,,..............=........~~~~~~....TTT',
    'TT................=........~~~~~~....TTT',
    'TT.....T..........=.........~~~~.....TTT',
    'TT................=..................TTT',
    'TT..........T.....====..........T...TTTT',
    'TT...................=..............TTTT',
    'TTT..................=.............TTTTT',
    'TTTT.......,,,.......=...........TTTTTTT',
    'TTTTTT....,,,,,......=.........TTTTTTTTT',
    'TTTTTTTTTTTTTTTTTTTTT=TTTTTTTTTTTTTTTTTT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  exits: [
    // Back into the cottage.
    { tileX: 9, tileY: 6, toMap: 'cottage', arriveX: 4, arriveY: 7, facing: 'up' },
  ],
  npcs: [
    { sprite: 'woodcutter', tileX: 13, tileY: 8, facing: 'down', scene: 'woodcutter_chat', wanderRadius: 2 },
  ],
  spots: [
    { tileX: 10, tileY: 7, scene: 'wood_sign' },
  ],
  chests: [
    { tileX: 4, tileY: 3, scene: 'wood_chest', openedFlag: 'opened_wood_chest' },
  ],
}
