import { cottage } from './cottage.js'
import { woodEdge } from './wood-edge.js'

/**
 * Every map in the game, by id. Add new maps here.
 * @type {Record<string, import('../world.js').MapDefinition>}
 */
export const MAPS = {
  cottage,
  woodEdge,
}
