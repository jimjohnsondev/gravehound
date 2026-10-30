/**
 * Someone on a map who the hero can talk to. They block the way like a wall
 * and turn to face the hero when spoken to. Some stand still; others wander
 * around their home tile, pausing between short walks.
 */
import { TILE_SIZE } from '../engine/config.js'
import { FACINGS, FACING_STEPS } from '../engine/sprite.js'
import { Character } from './character.js'

/**
 * How far outside the feet box the hero can still reach. Without it the hero
 * has to line up almost exactly, which is fiddly on a touch d-pad.
 */
const REACH_SLACK = 3

/** Pixels moved per update step. Slower than the hero, so they're easy to catch. */
const WANDER_SPEED = 0.5

/** A wanderRadius, in tiles, smaller than this leaves no room for a single step. */
export const MIN_WANDER_RADIUS = WANDER_SPEED / TILE_SIZE

/** How long a wanderer stands still between walks, in update steps. */
const MIN_PAUSE_STEPS = 60
const MAX_PAUSE_STEPS = 240

/** How long one walk lasts, in update steps. */
const MIN_WALK_STEPS = 30
const MAX_WALK_STEPS = 90

/** @type {Record<import('../engine/sprite.js').Facing, import('../engine/sprite.js').Facing>} */
const OPPOSITE = { down: 'up', up: 'down', left: 'right', right: 'left' }

/**
 * @typedef {object} NpcDefinition
 * @property {string} sprite  Name of a sheet from createNpcSprites (game/sprites.js).
 * @property {number} tileX   Home tile.
 * @property {number} tileY
 * @property {import('../engine/sprite.js').Facing} facing
 * @property {string} scene   Dialog scene to play when spoken to.
 * @property {number} [wanderRadius]  Tiles they may stray from home. Leave it
 *   out for someone who stands still.
 */

/** One person on the current map. */
export class Npc extends Character {
  /**
   * @param {NpcDefinition} definition
   * @param {import('../engine/sprite.js').SpriteSheet} sprites
   */
  constructor(definition, sprites) {
    super(sprites)
    this.scene = definition.scene
    this.facing = definition.facing
    this.placeOnTile(definition.tileX, definition.tileY)
    this.homeX = this.x
    this.homeY = this.y
    this.wanderDistance = (definition.wanderRadius ?? 0) * TILE_SIZE
    /** True during a walk, false during a pause. */
    this.isWalking = false
    /** Update steps left in the current walk or pause. */
    this.stepsLeft = 0
    this.#pause()
  }

  /**
   * Is a point close enough to talk to this NPC?
   * @param {{x: number, y: number}} point
   */
  isWithinReach(point) {
    return point.x >= this.x - REACH_SLACK && point.x <= this.x + this.width + REACH_SLACK
      && point.y >= this.y - REACH_SLACK && point.y <= this.y + this.height + REACH_SLACK
  }

  /**
   * Stop and look back at someone facing this way.
   * @param {import('../engine/sprite.js').Facing} theirFacing
   */
  turnToFace(theirFacing) {
    this.facing = OPPOSITE[theirFacing]
    this.#pause()
  }

  /**
   * Carry on with the current walk or pause, if this NPC wanders at all.
   * @param {import('./character.js').BlockCheck} isBlocked
   */
  update(isBlocked) {
    if (this.wanderDistance === 0) return

    this.stepsLeft--
    if (this.stepsLeft <= 0) {
      if (this.isWalking) this.#pause()
      else this.#startWalking()
    }
    if (!this.isWalking) return

    const step = FACING_STEPS[this.facing]
    /** @type {import('./character.js').BlockCheck} */
    const isInTheWay = (npc) => isBlocked(npc) || this.#isTooFarFromHome()
    this.moveBy(step.x * WANDER_SPEED, step.y * WANDER_SPEED, isInTheWay)
    if (!this.isMoving) this.#pause()
  }

  /** Stand still for a while. */
  #pause() {
    this.isWalking = false
    this.isMoving = false
    this.walkTimer = 0
    this.stepsLeft = randomBetween(MIN_PAUSE_STEPS, MAX_PAUSE_STEPS)
  }

  /** Set off in a random direction. */
  #startWalking() {
    this.isWalking = true
    this.facing = FACINGS[randomBetween(0, FACINGS.length - 1)]
    this.stepsLeft = randomBetween(MIN_WALK_STEPS, MAX_WALK_STEPS)
  }

  #isTooFarFromHome() {
    return Math.abs(this.x - this.homeX) > this.wanderDistance
      || Math.abs(this.y - this.homeY) > this.wanderDistance
  }
}

/**
 * A random whole number from `min` to `max`, both included.
 * @param {number} min
 * @param {number} max
 */
function randomBetween(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1))
}
