/**
 * The map-name banner. When you walk into a map, its name drops down from the
 * top of the screen, stays for a couple of seconds, then lifts away again.
 */
import { SCREEN_WIDTH, UPDATES_PER_SECOND } from '../engine/config.js'
import { GLYPH_HEIGHT } from '../engine/font-glyphs.js'
import { UI_COLORS } from '../engine/palette.js'
import { PANEL_BORDER, drawPanel } from '../engine/panel.js'
import { drawText, measureText } from '../engine/text.js'

/** How long the banner is on screen, sliding included (60 per second). */
const SHOW_DURATION = Math.round(2.5 * UPDATES_PER_SECOND)

/** Update steps spent sliding in, and again sliding out. */
const SLIDE_DURATION = 12

/** The slide moves in jumps of this many pixels, for an 8-bit feel. */
const SLIDE_STEP = 4

/** Gap between the top of the screen and the banner once it has dropped in. */
const MARGIN_TOP = 8

/** Distance from the outside of the banner to its text. */
const TEXT_INSET_X = PANEL_BORDER + 6
const TEXT_INSET_Y = PANEL_BORDER + 4

const BANNER_HEIGHT = GLYPH_HEIGHT + TEXT_INSET_Y * 2

/** How far the banner travels from fully off screen to fully shown. */
const SLIDE_DISTANCE = MARGIN_TOP + BANNER_HEIGHT

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

    const width = measureText(this.text) + TEXT_INSET_X * 2
    const x = Math.round((SCREEN_WIDTH - width) / 2)
    const y = MARGIN_TOP - this.#slideOffset()

    drawPanel(ctx, x, y, width, BANNER_HEIGHT)
    drawText(ctx, this.text, x + TEXT_INSET_X, y + TEXT_INSET_Y, UI_COLORS.text)
  }

  /** Pixels above its resting place: most at the very start and end, 0 in between. */
  #slideOffset() {
    const timeShown = SHOW_DURATION - this.timeLeft
    const timeFromEitherEnd = Math.min(timeShown, this.timeLeft)
    const stepsLeft = Math.max(0, SLIDE_DURATION - timeFromEitherEnd)
    const offset = (stepsLeft / SLIDE_DURATION) * SLIDE_DISTANCE
    return Math.ceil(offset / SLIDE_STEP) * SLIDE_STEP
  }
}
