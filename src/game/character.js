/**
 * What the hero and NPCs have in common: a position, a facing, a sprite, and
 * walking without going through things.
 *
 * Position (x, y) is the top-left of a small "feet" box used for collisions.
 * The sprite is drawn taller than the box, so the head can overlap walls and
 * trees above, which is what makes a 3/4 top-down view look right.
 */
import { TILE_SIZE } from '../engine/config.js'

/** Size of the collision box at a character's feet. */
const FEET_WIDTH = 10
const FEET_HEIGHT = 6

/** Update steps between walk animation frames. */
const STEPS_PER_FRAME = 8

/** Frames in the walk animation. */
export const WALK_FRAME_COUNT = 2

/** @typedef {(character: Character) => boolean} BlockCheck  Is this character walking into something? */

/** Someone with feet on the map. Hero and Npc build on this. */
export class Character {
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

  /** Centre of the feet, in map pixels. */
  get center() {
    return { x: this.x + this.width / 2, y: this.y + this.height / 2 }
  }

  /** Where the feet touch the ground. Lower on screen means nearer. */
  get depth() {
    return this.y + this.height
  }

  /**
   * Put the feet in the middle of a tile.
   * @param {number} tileX
   * @param {number} tileY
   */
  placeOnTile(tileX, tileY) {
    this.x = tileX * TILE_SIZE + (TILE_SIZE - this.width) / 2
    this.y = tileY * TILE_SIZE + (TILE_SIZE - this.height) / 2
  }

  /**
   * Do this character's feet overlap another's?
   * @param {Character} other
   */
  overlaps(other) {
    return other.x < this.x + this.width && other.x + other.width > this.x
      && other.y < this.y + this.height && other.y + other.height > this.y
  }

  /**
   * Walk by this many pixels, stopping at anything in the way. One axis moves
   * at a time, so pushing diagonally into a wall slides along it.
   * @param {number} dx
   * @param {number} dy
   * @param {BlockCheck} isBlocked
   */
  moveBy(dx, dy, isBlocked) {
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
   * Draw the character, with the bottom of the sprite on the bottom of the feet box.
   * @param {CanvasRenderingContext2D} ctx
   * @param {{x: number, y: number}} camera
   */
  draw(ctx, camera) {
    const frame = Math.floor(this.walkTimer / STEPS_PER_FRAME) % WALK_FRAME_COUNT
    const left = this.center.x - this.sprites.frameWidth / 2 - camera.x
    const top = this.y + this.height - this.sprites.frameHeight - camera.y
    this.sprites.draw(ctx, this.facing, frame, left, top)
  }
}
