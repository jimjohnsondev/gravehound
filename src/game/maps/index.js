/**
 * The list of every map in the game, and the shape of a map's data.
 */
import { cottage } from './cottage.js'
import { woodEdge } from './wood-edge.js'

/**
 * @typedef {object} MapExit
 * Stepping on this tile takes you to another map.
 * @property {number} tileX
 * @property {number} tileY
 * @property {string} toMap    Id of the map to go to.
 * @property {number} arriveX  Tile to arrive on in the new map.
 * @property {number} arriveY
 * @property {import('../../engine/sprite.js').Facing} facing  Way to face on arrival.
 */

/**
 * @typedef {object} MapSpot
 * A tile that plays a scene when you press A at it: a sign, a picture, a well.
 * @property {number} tileX
 * @property {number} tileY
 * @property {string} scene
 */

/**
 * @typedef {object} MapChest
 * A chest tile. It opens once and stays open, remembered by a story flag.
 * @property {number} tileX
 * @property {number} tileY
 * @property {string} scene       Plays on opening, and hands over what's inside.
 * @property {string} openedFlag  Set when opened (declared in game/story-flags.js).
 */

/**
 * @typedef {object} MapDefinition
 * @property {string} id
 * @property {string} name
 * @property {'screen' | 'scroll'} mode  Single still screen, or scrolling.
 * @property {number} lightLevel         0 (bright) to 4 (dark). Darkens scenery only.
 * @property {string} music              Song to play here (see game/music/index.js).
 * @property {string[]} rows             The tiles, one string per row.
 * @property {MapExit[]} exits
 * @property {import('../npc.js').NpcDefinition[]} npcs
 * @property {MapSpot[]} spots
 * @property {MapChest[]} chests
 */

/**
 * Every map in the game, by id. Add new maps here.
 * @type {Record<string, MapDefinition>}
 */
export const MAPS = {
  cottage,
  woodEdge,
}
