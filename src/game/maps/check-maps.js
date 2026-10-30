/**
 * Checks the names maps use, so a typo stops the game loading instead of only
 * showing up when someone walks over and presses A.
 */
import { FLAGS } from '../story-flags.js'

/**
 * Check every map. Throws one error listing every problem.
 * @param {Record<string, import('../world.js').MapDefinition>} maps
 * @param {import('../../engine/talk-parser.js').Scenes} scenes
 * @param {Record<string, import('../../engine/sprite.js').SpriteSheet>} npcSprites
 */
export function checkMaps(maps, scenes, npcSprites) {
  /** @type {string[]} */
  const problems = []

  for (const map of Object.values(maps)) {
    for (const { scene } of [...map.npcs, ...map.spots, ...map.chests]) {
      if (!scenes[scene]) problems.push(`${map.id}: no dialog scene called "${scene}"`)
    }
    for (const { sprite } of map.npcs) {
      if (!npcSprites[sprite]) problems.push(`${map.id}: no NPC sprite called "${sprite}"`)
    }
    for (const { openedFlag } of map.chests) {
      if (!FLAGS[openedFlag]) problems.push(`${map.id}: unknown flag "${openedFlag}"`)
    }
  }

  if (problems.length > 0) {
    throw new Error(`Problems in the maps:\n  ${problems.join('\n  ')}`)
  }
}
