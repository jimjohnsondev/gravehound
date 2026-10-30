/**
 * PLACEHOLDER dialog portraits, drawn with code: a head and shoulders with a
 * face that changes with the expression. Replace with imported portrait
 * sheets in the same layout (one picture per expression, side by side, in the
 * order the cast lists them).
 */
import { PORTRAIT_HEIGHT, PORTRAIT_WIDTH } from '../engine/config.js'
import { CHARACTER_COLORS as C } from '../engine/palette.js'

/** @typedef {(x: number, y: number, w: number, h: number, color: string) => void} RectPainter */

/**
 * @typedef {object} PortraitLook
 * @property {string} skin
 * @property {string} hair
 * @property {string} clothes
 * @property {boolean} old  Grey bun and a shawl instead of a young haircut.
 */

/**
 * @typedef {object} Face
 * @property {'level' | 'raised' | 'worried' | 'angry'} brows
 * @property {'open' | 'wide' | 'smiling' | 'lowered'} eyes
 * @property {'flat' | 'smile' | 'frown' | 'open'} mouth
 */

/** How each expression looks on a placeholder face. @type {Record<string, Face>} */
const FACES = {
  neutral: { brows: 'level', eyes: 'open', mouth: 'flat' },
  happy: { brows: 'raised', eyes: 'smiling', mouth: 'smile' },
  worried: { brows: 'worried', eyes: 'open', mouth: 'flat' },
  sad: { brows: 'worried', eyes: 'lowered', mouth: 'frown' },
  afraid: { brows: 'raised', eyes: 'wide', mouth: 'open' },
  angry: { brows: 'angry', eyes: 'open', mouth: 'frown' },
}

/** Left edge of each eye, in portrait pixels. */
const LEFT_EYE_X = 27
const RIGHT_EYE_X = 42
const EYE_Y = 38
const BROW_Y = 34
const MOUTH_Y = 51

/** Width of an eye. Brows are mirrored around its centre. */
const EYE_WIDTH = 3

/**
 * Each brow shape as pieces of the left brow: [x offset from the eye,
 * y offset from BROW_Y, width]. The right brow is the mirror image.
 * @type {Record<Face['brows'], [number, number, number][]>}
 */
const BROW_PIECES = {
  level: [[-1, 0, 5]],
  raised: [[-1, -2, 5]],
  worried: [[-1, 1, 2], [1, 0, 3]], // inner ends up
  angry: [[-1, 0, 2], [1, 1, 3]], // inner ends down
}

/**
 * Paint one portrait per expression into a strip, left to right.
 * @param {PortraitLook} look
 * @param {string[]} expressions
 * @returns {HTMLCanvasElement}
 */
export function paintPortraits(look, expressions) {
  const strip = document.createElement('canvas')
  strip.width = PORTRAIT_WIDTH * expressions.length
  strip.height = PORTRAIT_HEIGHT
  const ctx = /** @type {CanvasRenderingContext2D} */ (strip.getContext('2d'))

  expressions.forEach((expression, column) => {
    const face = FACES[expression]
    if (!face) throw new Error(`No placeholder face for the expression "${expression}"`)
    const offsetX = column * PORTRAIT_WIDTH
    /** @type {RectPainter} */
    const rect = (x, y, w, h, color) => {
      ctx.fillStyle = color
      ctx.fillRect(offsetX + x, y, w, h)
    }
    paintBust(rect, look)
    paintFace(rect, face)
  })
  return strip
}

/**
 * Shoulders, neck, head and hair. Every shape gets a dark outline so the
 * portrait stands out against any background.
 * @param {RectPainter} rect
 * @param {PortraitLook} look
 */
function paintBust(rect, look) {
  /** @type {[number, number, number, number, string][]} x, y, width, height, colour */
  const shapes = [
    [8, 72, 56, 24, look.clothes],
    [30, 56, 12, 16, look.skin],
    [20, 16, 32, 44, look.skin],
    [18, 20, 36, 36, look.skin],
  ]
  if (look.old) {
    shapes.push(
      [28, 4, 16, 10, look.hair], // bun
      [18, 12, 36, 10, look.hair],
      [16, 18, 4, 18, look.hair],
      [52, 18, 4, 18, look.hair],
      [14, 64, 44, 10, look.clothes], // shawl up round the neck
    )
  } else {
    shapes.push(
      [18, 10, 36, 14, look.hair],
      [16, 16, 4, 22, look.hair],
      [52, 16, 4, 22, look.hair],
    )
  }

  for (const [x, y, w, h] of shapes) rect(x - 1, y - 1, w + 2, h + 2, C.outline)
  for (const [x, y, w, h, color] of shapes) rect(x, y, w, h, color)
}

/**
 * @param {RectPainter} rect
 * @param {Face} face
 */
function paintFace(rect, face) {
  const dark = C.outline

  for (const eyeX of [LEFT_EYE_X, RIGHT_EYE_X]) {
    if (face.eyes === 'open') {
      rect(eyeX, EYE_Y, 3, 4, dark)
    } else if (face.eyes === 'wide') {
      rect(eyeX - 1, EYE_Y - 1, 5, 6, C.eyeWhite)
      rect(eyeX, EYE_Y, 3, 4, dark)
    } else if (face.eyes === 'smiling') {
      // An upside-down U.
      rect(eyeX, EYE_Y + 1, 3, 1, dark)
      rect(eyeX - 1, EYE_Y + 2, 1, 1, dark)
      rect(eyeX + 3, EYE_Y + 2, 1, 1, dark)
    } else {
      rect(eyeX, EYE_Y + 2, 3, 2, dark)
    }
  }

  for (const [offsetX, offsetY, width] of BROW_PIECES[face.brows]) {
    const mirroredOffsetX = EYE_WIDTH - offsetX - width
    rect(LEFT_EYE_X + offsetX, BROW_Y + offsetY, width, 1, dark)
    rect(RIGHT_EYE_X + mirroredOffsetX, BROW_Y + offsetY, width, 1, dark)
  }

  if (face.mouth === 'flat') {
    rect(32, MOUTH_Y, 8, 1, dark)
  } else if (face.mouth === 'smile') {
    rect(33, MOUTH_Y + 1, 6, 1, dark)
    rect(31, MOUTH_Y, 2, 1, dark)
    rect(39, MOUTH_Y, 2, 1, dark)
  } else if (face.mouth === 'frown') {
    rect(33, MOUTH_Y, 6, 1, dark)
    rect(31, MOUTH_Y + 1, 2, 1, dark)
    rect(39, MOUTH_Y + 1, 2, 1, dark)
  } else {
    rect(33, MOUTH_Y - 1, 6, 4, dark)
  }
}
