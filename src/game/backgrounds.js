import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../engine/config.js'
import { backgroundColor } from '../engine/palette.js'

/**
 * PLACEHOLDER dialog backgrounds, drawn with code: the full-screen scenes that
 * portraits stand in front of. Like all background art they're painted with
 * (ramp, step) colours. Replace with imported pictures of the same size.
 */

/**
 * @typedef {(rect: (x: number, y: number, w: number, h: number, ramp: string, step: number) => void) => void} BackgroundPainter
 */

/** @type {Record<string, BackgroundPainter>} */
const PAINTERS = {
  /** Wren's cottage by firelight, looking towards the hearth. */
  cottage_hearth(rect) {
    // Back wall of timber planks.
    rect(0, 0, 320, 124, 'wood', 2)
    for (let x = 0; x < 320; x += 20) rect(x, 0, 1, 124, 'wood', 4)
    // Floorboards.
    rect(0, 124, 320, 68, 'earth', 2)
    for (let y = 132; y < 192; y += 10) rect(0, y, 320, 1, 'earth', 3)

    // A small night window.
    rect(52, 24, 44, 36, 'wood', 4)
    rect(56, 28, 36, 28, 'water', 4)
    rect(73, 28, 2, 28, 'wood', 4)
    rect(56, 41, 36, 2, 'wood', 4)

    // The stone hearth with a fire in it.
    rect(188, 28, 112, 100, 'stone', 2)
    rect(196, 20, 96, 10, 'stone', 1)
    rect(208, 60, 72, 68, 'stone', 5)
    rect(220, 104, 48, 20, 'ember', 3)
    rect(228, 92, 32, 24, 'ember', 1)
    rect(236, 80, 16, 20, 'ember', 0)

    // The table in front, with honey cakes.
    rect(24, 132, 128, 10, 'wood', 1)
    rect(24, 142, 128, 3, 'wood', 3)
    rect(32, 145, 6, 40, 'wood', 3)
    rect(138, 145, 6, 40, 'wood', 3)
    rect(60, 124, 40, 8, 'ember', 2)
    rect(66, 120, 8, 5, 'earth', 0)
    rect(78, 120, 8, 5, 'earth', 0)
  },
}

/** Names [background ...] can use. */
export const BACKGROUND_NAMES = Object.keys(PAINTERS)

/**
 * Paint every background once, at full light.
 * @returns {Record<string, HTMLCanvasElement>}
 */
export function createBackgrounds() {
  return Object.fromEntries(
    Object.entries(PAINTERS).map(([name, paint]) => {
      const canvas = document.createElement('canvas')
      canvas.width = SCREEN_WIDTH
      canvas.height = SCREEN_HEIGHT
      const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'))
      paint((x, y, w, h, ramp, step) => {
        ctx.fillStyle = backgroundColor(ramp, step, 0)
        ctx.fillRect(x, y, w, h)
      })
      return [name, canvas]
    }),
  )
}
