/**
 * Checks that maps make sense, so a typo stops the game loading instead of
 * freezing it or trapping the player the first time someone walks there.
 */
import { FLAGS } from '../story-flags.js'
import { CLOSED_CHEST_TILE, TILE_TYPES } from '../tiles.js'

/**
 * Check every map. Throws one error listing every problem.
 * @param {Record<string, import('./index.js').MapDefinition>} maps
 * @param {import('../../engine/talk-parser.js').Scenes} scenes
 * @param {Record<string, import('../../engine/sprite.js').SpriteSheet>} npcSprites
 */
export function checkMaps(maps, scenes, npcSprites) {
  /** @type {string[]} */
  const problems = []
  /** Chest flags seen so far. Two chests sharing one would open together. */
  const chestFlags = new Set()

  for (const [key, map] of Object.entries(maps)) {
    if (key !== map.id) problems.push(`${map.id}: listed in MAPS as "${key}"`)
    checkRowWidths(map, problems)
    checkExits(map, maps, problems)
    checkChests(map, chestFlags, problems)

    for (const { scene } of [...map.npcs, ...map.spots, ...map.chests]) {
      if (!scenes[scene]) problems.push(`${map.id}: no dialog scene called "${scene}"`)
    }
    for (const { sprite } of map.npcs) {
      if (!npcSprites[sprite]) problems.push(`${map.id}: no NPC sprite called "${sprite}"`)
    }
  }

  if (problems.length > 0) {
    throw new Error(`Problems in the maps:\n  ${problems.join('\n  ')}`)
  }
}

/**
 * @param {import('./index.js').MapDefinition} map
 * @param {string[]} problems
 */
function checkRowWidths(map, problems) {
  const width = map.rows[0].length
  map.rows.forEach((row, y) => {
    if (row.length !== width) problems.push(`${map.id}: row ${y} is ${row.length} wide, expected ${width}`)
  })
}

/**
 * Every exit must lead somewhere the hero can stand and walk away from.
 * @param {import('./index.js').MapDefinition} map
 * @param {Record<string, import('./index.js').MapDefinition>} maps
 * @param {string[]} problems
 */
function checkExits(map, maps, problems) {
  for (const { toMap, arriveX, arriveY } of map.exits) {
    const target = maps[toMap]
    if (!target) {
      problems.push(`${map.id}: exit leads to a map called "${toMap}", which doesn't exist`)
      continue
    }

    const arrival = `${map.id}: exit arrives at ${toMap} tile ${arriveX}, ${arriveY}`
    const isHere = (/** @type {{tileX: number, tileY: number}} */ thing) =>
      thing.tileX === arriveX && thing.tileY === arriveY

    if (!isWalkable(target, arriveX, arriveY)) problems.push(`${arrival}, which isn't walkable`)
    if (target.npcs.some(isHere)) problems.push(`${arrival}, where an NPC is standing`)
    if (target.exits.some(isHere)) problems.push(`${arrival}, which is itself an exit`)
  }
}

/**
 * Can the hero stand on this tile? Tiles the game doesn't know count as solid.
 * @param {import('./index.js').MapDefinition} map
 * @param {number} tileX
 * @param {number} tileY
 */
function isWalkable(map, tileX, tileY) {
  const character = map.rows[tileY]?.[tileX]
  return TILE_TYPES[character]?.solid === false
}

/**
 * Chest tiles in `rows` and entries in `chests` must match one for one.
 * @param {import('./index.js').MapDefinition} map
 * @param {Set<string>} chestFlags  Flags used so far, across all maps.
 * @param {string[]} problems
 */
function checkChests(map, chestFlags, problems) {
  for (const { tileX, tileY, openedFlag } of map.chests) {
    if (map.rows[tileY]?.[tileX] !== CLOSED_CHEST_TILE) {
      problems.push(`${map.id}: chest at tile ${tileX}, ${tileY} has no ${CLOSED_CHEST_TILE} tile`)
    }
    if (!FLAGS[openedFlag]) problems.push(`${map.id}: unknown flag "${openedFlag}"`)
    if (chestFlags.has(openedFlag)) problems.push(`${map.id}: another chest also uses "${openedFlag}"`)
    chestFlags.add(openedFlag)
  }

  map.rows.forEach((row, tileY) => {
    for (let tileX = 0; tileX < row.length; tileX++) {
      if (row[tileX] !== CLOSED_CHEST_TILE) continue
      const isListed = map.chests.some((chest) => chest.tileX === tileX && chest.tileY === tileY)
      if (!isListed) problems.push(`${map.id}: ${CLOSED_CHEST_TILE} tile at ${tileX}, ${tileY} isn't in chests`)
    }
  })
}
