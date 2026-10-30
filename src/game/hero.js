/**
 * The player character.
 */
import { TILE_SIZE } from '../engine/config.js'
import { FACING_STEPS } from '../engine/sprite.js'
import { Character } from './character.js'

/**
 * How far ahead of the feet's centre the hero can reach with A. Half a tile
 * lands inside whatever the feet are pressed up against, in every direction.
 */
const REACH = TILE_SIZE / 2

/** Pixels moved per update step (60 steps a second). */
const WALK_SPEED = 1.25

/** Diagonal moves are scaled down so they aren't faster than straight ones. */
const DIAGONAL_SCALE = Math.SQRT1_2

/** Update steps between walk animation frames. */
const STEPS_PER_FRAME = 8

/** Frames in the walk animation. */
const WALK_FRAME_COUNT = 2

/** The hero: moves with the d-pad and slides along walls. */
export class Hero extends Character {
  /** @param {import('../engine/sprite.js').SpriteSheet} sprites */
  constructor(sprites) {
    super(sprites)
    this.isMoving = false
    this.walkTimer = 0
  }

  /** The spot in front of the hero that A acts on, in map pixels. */
  get reachPoint() {
    const step = FACING_STEPS[this.facing]
    return { x: this.center.x + step.x * REACH, y: this.center.y + step.y * REACH }
  }

  /**
   * Move with the d-pad, stopping at anything in the way.
   * @param {{x: number, y: number}} direction  Each -1, 0 or 1.
   * @param {(box: {x: number, y: number, width: number, height: number}) => boolean} isBlocked
   */
  update(direction, isBlocked) {
    let dx = direction.x * WALK_SPEED
    let dy = direction.y * WALK_SPEED
    if (dx !== 0 && dy !== 0) {
      dx *= DIAGONAL_SCALE
      dy *= DIAGONAL_SCALE
    }

    // Face the way we're pushing. Horizontal wins on diagonals, like most
    // top-down games, so sideways sprites show while moving diagonally.
    if (direction.x < 0) this.facing = 'left'
    else if (direction.x > 0) this.facing = 'right'
    else if (direction.y < 0) this.facing = 'up'
    else if (direction.y > 0) this.facing = 'down'

    // Move one axis at a time, so pushing diagonally into a wall slides along it.
    const startX = this.x
    const startY = this.y
    this.x += dx
    if (isBlocked(this)) this.x = startX
    this.y += dy
    if (isBlocked(this)) this.y = startY

    this.isMoving = this.x !== startX || this.y !== startY
    this.walkTimer = this.isMoving ? this.walkTimer + 1 : 0
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {{x: number, y: number}} camera
   */
  draw(ctx, camera) {
    this.drawFrame(ctx, camera, Math.floor(this.walkTimer / STEPS_PER_FRAME) % WALK_FRAME_COUNT)
  }
}
