/**
 * Ash, the dog. For now he simply follows the hero's footsteps a short way
 * behind, the way party members do in classic RPGs.
 */

/** How many hero steps behind Ash walks. */
const FOLLOW_DELAY = 18

/** Update steps between walk animation frames. */
const STEPS_PER_FRAME = 6

export class Ash {
  /** @param {import('../engine/sprite.js').SpriteSheet} sprites */
  constructor(sprites) {
    this.sprites = sprites
    /** Where the hero's feet have been, oldest first. @type {{x: number, y: number}[]} */
    this.trail = []
    this.x = 0
    this.y = 0
    /** @type {import('../engine/sprite.js').Facing} */
    this.facing = 'down'
    this.walkTimer = 0
  }

  /**
   * Jump straight to a spot (used when entering a map).
   * @param {{x: number, y: number}} point
   */
  placeAt(point) {
    this.x = point.x
    this.y = point.y
    this.trail = []
  }

  /** @param {import('./hero.js').Hero} hero */
  update(hero) {
    if (!hero.isMoving) {
      this.walkTimer = 0
      return
    }
    this.trail.push(hero.center)
    if (this.trail.length <= FOLLOW_DELAY) return

    const next = /** @type {{x: number, y: number}} */ (this.trail.shift())
    const dx = next.x - this.x
    const dy = next.y - this.y
    if (Math.abs(dx) > Math.abs(dy)) this.facing = dx < 0 ? 'left' : 'right'
    else if (dy !== 0) this.facing = dy < 0 ? 'up' : 'down'
    this.x = next.x
    this.y = next.y
    this.walkTimer++
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {{x: number, y: number}} camera
   */
  draw(ctx, camera) {
    const frame = Math.floor(this.walkTimer / STEPS_PER_FRAME) % 2
    const left = this.x - this.sprites.frameWidth / 2 - camera.x
    const top = this.y + 3 - this.sprites.frameHeight - camera.y
    this.sprites.draw(ctx, this.facing, frame, left, top)
  }
}
