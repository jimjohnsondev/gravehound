/**
 * Ash, the dog. He follows the hero's footsteps a short way behind, the way
 * party members do in classic RPGs.
 */

/** How many hero steps behind Ash walks. */
const FOLLOW_DELAY = 18

/** Update steps between walk animation frames. */
const STEPS_PER_FRAME = 6

/** Ash's feet are this many pixels below his position. */
const FEET_OFFSET = 3

/** Ash the dog: walks exactly where the hero walked. */
export class Ash {
  /** @param {import('../engine/sprite.js').SpriteSheet} sprites */
  constructor(sprites) {
    this.sprites = sprites
    /**
     * Where the hero's feet have been, oldest first.
     * @type {{x: number, y: number}[]}
     */
    this.trail = []
    this.x = 0
    this.y = 0
    /** @type {import('../engine/sprite.js').Facing} */
    this.facing = 'down'
    this.walkTimer = 0
  }

  /** Where Ash's feet touch the ground. Lower on screen means nearer. */
  get depth() {
    return this.y + FEET_OFFSET
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

    const next = this.trail.shift()
    this.facing = facingFor(next.x - this.x, next.y - this.y, this.facing)
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
    const top = this.y + FEET_OFFSET - this.sprites.frameHeight - camera.y
    this.sprites.draw(ctx, this.facing, frame, left, top)
  }
}

/**
 * The way to face after moving by (dx, dy). The longer direction wins.
 * @param {number} dx
 * @param {number} dy
 * @param {import('../engine/sprite.js').Facing} current  Kept if there was no move.
 * @returns {import('../engine/sprite.js').Facing}
 */
function facingFor(dx, dy, current) {
  if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? 'left' : 'right'
  if (dy !== 0) return dy < 0 ? 'up' : 'down'
  return current
}
