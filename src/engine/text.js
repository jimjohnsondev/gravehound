/**
 * Draws text in the pixel font from font-glyphs.js.
 *
 * Every glyph is painted once per colour into a strip, the first time that
 * colour is used. Drawing text then just copies small rectangles from the strip.
 */
import { FALLBACK_CHARACTER, GLYPHS, GLYPH_HEIGHT, LETTER_SPACING } from './font-glyphs.js'

/**
 * @typedef {object} GlyphSlot
 * Where one glyph sits in a painted strip.
 * @property {number} x      Left edge in the strip, in pixels.
 * @property {number} width  Glyph width in pixels.
 */

/** Where each character's glyph sits in a strip, and the whole strip's width. */
const { slots: SLOTS, stripWidth: STRIP_WIDTH } = layOutGlyphs()

/**
 * Painted strips, one per colour, made the first time each colour is used.
 * @type {Map<string, HTMLCanvasElement>}
 */
const stripsByColor = new Map()

/**
 * How wide a line of text will be when drawn, in pixels.
 * @param {string} text
 */
export function measureText(text) {
  let width = 0
  for (const character of text) width += slotFor(character).width + LETTER_SPACING
  // No gap is needed after the last letter.
  return Math.max(0, width - LETTER_SPACING)
}

/**
 * Split text into lines that each fit in `maxWidth` pixels, breaking between
 * words. A single word wider than `maxWidth` gets a line of its own.
 * @param {string} text
 * @param {number} maxWidth
 * @returns {string[]}
 */
export function wrapText(text, maxWidth) {
  /** @type {string[]} */
  const lines = []
  let line = ''
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const longer = line ? `${line} ${word}` : word
    if (line && measureText(longer) > maxWidth) {
      lines.push(line)
      line = word
    } else {
      line = longer
    }
  }
  if (line) lines.push(line)
  return lines
}

/**
 * Draw one line of text. Characters the font lacks are drawn as '?'.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} x      Screen x of the text's left edge.
 * @param {number} y      Screen y of the top of the glyphs (capitals start here).
 * @param {string} color  Any CSS colour, e.g. a value from UI_COLORS.
 */
export function drawText(ctx, text, x, y, color) {
  const strip = stripFor(color)
  // Whole pixels only, so letters never smear across two screen pixels.
  let penX = Math.round(x)
  const top = Math.round(y)
  for (const character of text) {
    const slot = slotFor(character)
    ctx.drawImage(strip, slot.x, 0, slot.width, GLYPH_HEIGHT, penX, top, slot.width, GLYPH_HEIGHT)
    penX += slot.width + LETTER_SPACING
  }
}

/** @param {string} character */
function slotFor(character) {
  return SLOTS.get(character) ?? /** @type {GlyphSlot} */ (SLOTS.get(FALLBACK_CHARACTER))
}

/**
 * Check every glyph's shape and give each one a place in the strip.
 * Mistakes in the font data are caught here, at start-up, with a clear message.
 * @returns {{slots: Map<string, GlyphSlot>, stripWidth: number}}
 */
function layOutGlyphs() {
  /** @type {Map<string, GlyphSlot>} */
  const slots = new Map()
  let x = 0
  for (const [character, rows] of Object.entries(GLYPHS)) {
    if (rows.length !== GLYPH_HEIGHT) {
      throw new Error(`Glyph "${character}" has ${rows.length} rows; it needs ${GLYPH_HEIGHT}`)
    }
    const width = rows[0].length
    if (rows.some((row) => row.length !== width)) {
      throw new Error(`Glyph "${character}" has rows of different lengths`)
    }
    slots.set(character, { x, width })
    x += width
  }
  if (!slots.has(FALLBACK_CHARACTER)) {
    throw new Error(`The font needs a glyph for the fallback character "${FALLBACK_CHARACTER}"`)
  }
  return { slots, stripWidth: x }
}

/**
 * The strip of every glyph painted in one colour, painting it the first time.
 * @param {string} color
 * @returns {HTMLCanvasElement}
 */
function stripFor(color) {
  const cached = stripsByColor.get(color)
  if (cached) return cached

  const strip = document.createElement('canvas')
  strip.width = STRIP_WIDTH
  strip.height = GLYPH_HEIGHT
  const ctx = /** @type {CanvasRenderingContext2D} */ (strip.getContext('2d'))
  ctx.fillStyle = color

  for (const [character, slot] of SLOTS) {
    GLYPHS[character].forEach((row, rowIndex) => {
      for (let column = 0; column < row.length; column++) {
        if (row[column] === '#') ctx.fillRect(slot.x + column, rowIndex, 1, 1)
      }
    })
  }

  stripsByColor.set(color, strip)
  return strip
}
