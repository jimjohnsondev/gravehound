import { SCREEN_WIDTH, UPDATES_PER_SECOND } from '../engine/config.js'
import { GLYPH_HEIGHT } from '../engine/font-glyphs.js'
import { UI_COLORS } from '../engine/palette.js'
import { drawPanel } from '../engine/panel.js'
import { drawText, measureText } from '../engine/text.js'

/**
 * The map-name banner. When you walk into a map, its name drops down from the
 * top of the screen, stays for a couple of seconds, then lifts away again.
 */

/** How long the banner is on screen, sliding included (60 per second). */
const SHOW_DURATION = Math.round(2.5 * UPDATES_PER_SECOND)

/** Update steps spent sliding in, and again sliding out. */
const SLIDE_DURATION = 12

/** The slide moves in jumps of this many pixels, for an 8-bit feel. */
const SLIDE_STEP = 4

/** Gap between the top of the screen and the banner once it has dropped in. */
const MARGIN_TOP = 8

/** Empty space between the banner's border and its text. */
const PADDING_X = 6
const PADDING_Y = 4

/** Banner height: the text, its padding, and a 1-pixel border top and bottom. */
const BANNER_HEIGHT = GLYPH_HEIGHT + PADDING_Y * 2 + 2

/** Shows one map name at a time. Call `show()` when entering a map. */
export class MapBanner {
  constructor() {
    this.text = ''
    /** Update steps left before the banner is gone. 0 = hidden. */
    this.timeLeft = 0
  }

  /**
   * Start showing a banner, replacing any that is already up.
   * @param {string} text
   */
  show(text) {
    this.text = text
    this.timeLeft = SHOW_DURATION
  }

  /** Take the banner away at once, e.g. when a conversation starts. */
  hide() {
    this.timeLeft = 0
  }

  update() {
    if (this.timeLeft > 0) this.timeLeft--
  }

  /** @param {CanvasRenderingContext2D} ctx */
  draw(ctx) {
    if (this.timeLeft === 0) return

    const width = measureText(this.text) + PADDING_X * 2 + 2
    const x = Math.round((SCREEN_WIDTH - width) / 2)
    const y = MARGIN_TOP - this.#hiddenAmount()

    drawPanel(ctx, x, y, width, BANNER_HEIGHT)
    drawText(ctx, this.text, x + 1 + PADDING_X, y + 1 + PADDING_Y, UI_COLORS.text)
  }

  /**
   * How many pixels of the slide are still to go: the full distance off the
   * top of the screen at the very start and end, and 0 while fully shown.
   */
  #hiddenAmount() {
    const timeShown = SHOW_DURATION - this.timeLeft
    const slidFraction = Math.min(timeShown, this.timeLeft, SLIDE_DURATION) / SLIDE_DURATION
    const distance = (1 - slidFraction) * (MARGIN_TOP + BANNER_HEIGHT)
    return Math.ceil(distance / SLIDE_STEP) * SLIDE_STEP
  }
}
