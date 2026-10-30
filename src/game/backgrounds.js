/**
 * PLACEHOLDER dialog backgrounds, drawn with code: the full-screen scenes that
 * portraits stand in front of. Like all background art they're painted with
 * (ramp, step) colours. Replace with imported pictures of the same size.
 */
import { SCREEN_HEIGHT, SCREEN_WIDTH, TILE_SIZE } from '../engine/config.js'
import { backgroundColor } from '../engine/palette.js'

/** Where the back wall meets the floor, in the cottage background. */
const WALL_BOTTOM = 100

/**
 * @typedef {(rect: (x: number, y: number, w: number, h: number, ramp: string, step: number) => void) => void} BackgroundPainter
 */

/** @type {Record<string, BackgroundPainter>} */
const PAINTERS = {
  /** Wren's cottage by firelight, looking towards the hearth. */
  cottage_hearth(rect) {
    // Back wall of timber planks, down to the floor.
    rect(0, 0, SCREEN_WIDTH, WALL_BOTTOM, 'wood', 2)
    for (let x = 0; x < SCREEN_WIDTH; x += TILE_SIZE) rect(x, 0, 1, WALL_BOTTOM, 'wood', 4)
    // Floorboards.
    rect(0, WALL_BOTTOM, SCREEN_WIDTH, SCREEN_HEIGHT - WALL_BOTTOM, 'earth', 2)
    for (let y = WALL_BOTTOM + 8; y < SCREEN_HEIGHT; y += 8) rect(0, y, SCREEN_WIDTH, 1, 'earth', 3)

    // A small night window.
    rect(10, 8, 30, 26, 'wood', 4)
    rect(13, 11, 24, 20, 'water', 4)
    rect(24, 11, 2, 20, 'wood', 4)
    rect(13, 20, 24, 2, 'wood', 4)

    // The stone hearth with a fire in it.
    rect(90, 16, 60, 84, 'stone', 2)
    rect(86, 10, 68, 8, 'stone', 1)
    rect(100, 44, 40, 56, 'stone', 5)
    rect(106, 84, 28, 14, 'ember', 3)
    rect(110, 74, 20, 20, 'ember', 1)
    rect(115, 64, 10, 16, 'ember', 0)

    // The table, with honey cakes on it.
    rect(54, 78, 30, 5, 'wood', 1)
    rect(54, 83, 30, 2, 'wood', 3)
    rect(57, 85, 3, 16, 'wood', 3)
    rect(78, 85, 3, 16, 'wood', 3)
    rect(58, 72, 22, 6, 'ember', 2)
    rect(61, 69, 6, 3, 'earth', 0)
    rect(71, 69, 6, 3, 'earth', 0)
  },
}

/** Names [background ...] can use. */
export const BACKGROUND_NAMES = Object.keys(PAINTERS)

/**
 * Paint every background once, at full light.
 * @returns {Record<string, HTMLCanvasElement>}
 */
export function createBackgrounds() {
  /** @type {Record<string, HTMLCanvasElement>} */
  const backgrounds = {}
  for (const [name, paint] of Object.entries(PAINTERS)) {
    backgrounds[name] = paintBackground(paint)
  }
  return backgrounds
}

/**
 * @param {BackgroundPainter} paint
 * @returns {HTMLCanvasElement}
 */
function paintBackground(paint) {
  const canvas = document.createElement('canvas')
  canvas.width = SCREEN_WIDTH
  canvas.height = SCREEN_HEIGHT
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'))
  paint((x, y, w, h, ramp, step) => {
    ctx.fillStyle = backgroundColor(ramp, step, 0)
    ctx.fillRect(x, y, w, h)
  })
  return canvas
}
