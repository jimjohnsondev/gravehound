/**
 * Checks that maps make sense, so a typo stops the game loading instead of
 * freezing it or trapping the player the first time someone walks there.
 */
import { MIN_WANDER_RADIUS } from '../npc.js'
import { FLAGS } from '../story-flags.js'
import { CLOSED_CHEST_TILE, TILE_TYPES } from '../tiles.js'

/**
 * Check every map. Throws one error listing every problem.
 * @param {Record<string, import('./index.js').MapDefinition>} maps
 * @param {import('../../engine/talk-parser.js').Scenes} scenes
 * @param {Record<string, import('../../engine/sprite.js').SpriteSheet>} npcSprites
 * @param {Record<string, import('../../engine/song.js').Song>} songs
 */
export function checkMaps(maps, scenes, npcSprites, songs) {
  /** @type {string[]} */
  const problems = []
  /** Chest flags seen so far. Two chests sharing one would open together. */
  const chestFlags = new Set()

  for (const [key, map] of Object.entries(maps)) {
    if (key !== map.id) problems.push(`${map.id}: listed in MAPS as "${key}"`)
    if (!songs[map.music]) problems.push(`${map.id}: no song called "${map.music}"`)
    checkRowWidths(map, problems)
    checkExits(map, maps, problems)
    checkChests(map, chestFlags, problems)
    checkNpcs(map, problems)

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
    if (!isWalkable(target, arriveX, arriveY)) problems.push(`${arrival}, which isn't walkable`)
    if (target.npcs.some((npc) => isOnTile(npc, arriveX, arriveY))) {
      problems.push(`${arrival}, where an NPC is standing`)
    }
    if (target.exits.some((exit) => isOnTile(exit, arriveX, arriveY))) {
      problems.push(`${arrival}, which is itself an exit`)
    }
  }
}

/**
 * Mistakes here don't crash anything: the NPC just never moves, which is easy
 * to miss, so they're worth stopping at load.
 * @param {import('./index.js').MapDefinition} map
 * @param {string[]} problems
 */
function checkNpcs(map, problems) {
  map.npcs.forEach((npc, index) => {
    const { tileX, tileY, wanderRadius = 0 } = npc
    const name = `${map.id}: NPC at tile ${tileX}, ${tileY}`

    const sharesHome = map.npcs.slice(index + 1).some((other) => isOnTile(other, tileX, tileY))
    if (sharesHome) problems.push(`${name} shares its home tile with another NPC`)

    if (wanderRadius === 0) return
    if (wanderRadius < MIN_WANDER_RADIUS) {
      problems.push(`${name} has wanderRadius ${wanderRadius}, the smallest is ${MIN_WANDER_RADIUS}`)
    }
    if (!isWalkable(map, tileX, tileY)) problems.push(`${name} wanders, but its home tile isn't walkable`)
  })
}

/**
 * The tile character at a position, or undefined if that's outside the map.
 * @param {import('./index.js').MapDefinition} map
 * @param {number} tileX
 * @param {number} tileY
 */
function tileAt(map, tileX, tileY) {
  return map.rows[tileY]?.[tileX]
}

/**
 * @param {{tileX: number, tileY: number}} thing
 * @param {number} tileX
 * @param {number} tileY
 */
function isOnTile(thing, tileX, tileY) {
  return thing.tileX === tileX && thing.tileY === tileY
}

/**
 * Can the hero stand on this tile? Tiles the game doesn't know count as solid.
 * @param {import('./index.js').MapDefinition} map
 * @param {number} tileX
 * @param {number} tileY
 */
function isWalkable(map, tileX, tileY) {
  return TILE_TYPES[tileAt(map, tileX, tileY)]?.solid === false
}

/**
 * Chest tiles in `rows` and entries in `chests` must match one for one.
 * @param {import('./index.js').MapDefinition} map
 * @param {Set<string>} chestFlags  Flags used so far, across all maps.
 * @param {string[]} problems
 */
function checkChests(map, chestFlags, problems) {
  for (const { tileX, tileY, openedFlag } of map.chests) {
    if (tileAt(map, tileX, tileY) !== CLOSED_CHEST_TILE) {
      problems.push(`${map.id}: chest at tile ${tileX}, ${tileY} has no ${CLOSED_CHEST_TILE} tile`)
    }
    if (!FLAGS[openedFlag]) problems.push(`${map.id}: unknown flag "${openedFlag}"`)
    if (chestFlags.has(openedFlag)) problems.push(`${map.id}: another chest also uses "${openedFlag}"`)
    chestFlags.add(openedFlag)
  }

  map.rows.forEach((row, tileY) => {
    for (let tileX = 0; tileX < row.length; tileX++) {
      if (row[tileX] !== CLOSED_CHEST_TILE) continue
      const isListed = map.chests.some((chest) => isOnTile(chest, tileX, tileY))
      if (!isListed) problems.push(`${map.id}: ${CLOSED_CHEST_TILE} tile at ${tileX}, ${tileY} isn't in chests`)
    }
  })
}
