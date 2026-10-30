/**
 * What the hero and NPCs have in common: a position, a facing and a sprite.
 *
 * Position (x, y) is the top-left of a small "feet" box used for collisions.
 * The sprite is drawn taller than the box, so the head can overlap walls and
 * trees above, which is what makes a 3/4 top-down view look right.
 */
import { TILE_SIZE } from '../engine/config.js'

/** Size of the collision box at a character's feet. */
const FEET_WIDTH = 10
const FEET_HEIGHT = 6

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
   * Draw one frame, with the bottom of the sprite on the bottom of the feet box.
   * @param {CanvasRenderingContext2D} ctx
   * @param {{x: number, y: number}} camera
   * @param {number} frame  Column in the sprite sheet.
   */
  drawFrame(ctx, camera, frame) {
    const left = this.center.x - this.sprites.frameWidth / 2 - camera.x
    const top = this.y + this.height - this.sprites.frameHeight - camera.y
    this.sprites.draw(ctx, this.facing, frame, left, top)
  }
}
