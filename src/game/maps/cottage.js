/**
 * Wren's cottage: a single still screen (10 x 9 tiles).
 * Firelit, so full light.
 *
 * Tile key: see game/tiles.js
 *   W timber wall   _ floorboards   H hearth   t table   r rug   D doorway
 */

/** @type {import('../world.js').MapDefinition} */
export const cottage = {
  id: 'cottage',
  name: "Wren's cottage",
  mode: 'screen',
  lightLevel: 0,
  rows: [
    'WWWWWWWWWW',
    'WWWWHWWWWW',
    'W________W',
    'W_t______W',
    'W________W',
    'W___rr___W',
    'W___rr___W',
    'W________W',
    'WWWWDWWWWW',
  ],
  exits: [
    // The front door leads out to the edge of the wood.
    { tileX: 4, tileY: 8, toMap: 'woodEdge', arriveX: 9, arriveY: 7, facing: 'down' },
  ],
}
