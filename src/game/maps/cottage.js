/**
 * Wren's cottage: a single still screen (20 x 12 tiles).
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
    'WWWWWWWWWWWWWWWWWWWW',
    'WWWWWWWWWHWWWWWWWWWW',
    'W__________________W',
    'W__________________W',
    'W___t______________W',
    'W__________________W',
    'W_______rrrr_______W',
    'W_______rrrr_______W',
    'W__________________W',
    'W__________________W',
    'W__________________W',
    'WWWWWWWWWDWWWWWWWWWW',
  ],
  exits: [
    // The front door leads out to the edge of the wood.
    { tileX: 9, tileY: 11, toMap: 'woodEdge', arriveX: 9, arriveY: 7, facing: 'down' },
  ],
}
