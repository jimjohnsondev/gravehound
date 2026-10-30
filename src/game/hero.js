/**
 * The player character.
 *
 * Position (x, y) is the top-left of a small "feet" box used for collisions.
 * The sprite is drawn taller than the box, so the head can overlap walls and
 * trees above, which is what makes a 3/4 top-down view look right.
 */
import { TILE_SIZE } from '../engine/config.js'

/** Pixels moved per update step (60 steps a second). */
const WALK_SPEED = 1.25

/** Diagonal moves are scaled down so they aren't faster than straight ones. */
const DIAGONAL_SCALE = Math.SQRT1_2

/** Update steps between walk animation frames. */
const STEPS_PER_FRAME = 8

/** Size of the collision box at the hero's feet. */
const FEET_WIDTH = 10
const FEET_HEIGHT = 6

/** The hero: moves with the d-pad and slides along walls. */
export class Hero {
  /** @param {import('../engine/sprite.js').SpriteSheet} sprites */
  constructor(sprites) {
    this.sprites = sprites
    this.x = 0
    this.y = 0
    this.width = FEET_WIDTH
    this.height = FEET_HEIGHT
    /** @type {import('../engine/sprite.js').Facing} */
    this.facing = 'down'
    this.isMoving = false
    this.walkTimer = 0
  }

  /** Centre of the feet, in map pixels. Used for exits and the camera. */
  get center() {
    return { x: this.x + this.width / 2, y: this.y + this.height / 2 }
  }

  /** Where the hero's feet touch the ground. Lower on screen means nearer. */
  get depth() {
    return this.y + this.height
  }

  /**
   * Put the hero's feet in the middle of a tile.
   * @param {number} tileX
   * @param {number} tileY
   */
  placeOnTile(tileX, tileY) {
    this.x = tileX * TILE_SIZE + (TILE_SIZE - this.width) / 2
    this.y = tileY * TILE_SIZE + (TILE_SIZE - this.height) / 2
  }

  /**
   * Move with the d-pad, stopping at solid tiles.
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
    const frame = Math.floor(this.walkTimer / STEPS_PER_FRAME) % 2
    // Feet of the sprite line up with the bottom of the feet box.
    const left = this.center.x - this.sprites.frameWidth / 2 - camera.x
    const top = this.y + this.height - this.sprites.frameHeight - camera.y
    this.sprites.draw(ctx, this.facing, frame, left, top)
  }
}
