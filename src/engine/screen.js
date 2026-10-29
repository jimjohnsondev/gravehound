import { SCREEN_WIDTH, SCREEN_HEIGHT } from './config.js'

/**
 * Owns the <canvas> the game draws on.
 *
 * The canvas always has 320x192 real pixels. We only change its *displayed*
 * size, scaling by whole numbers (2x, 3x, ...) so every game pixel becomes an
 * even square. On small phones where 2x won't fit we fall back to "fit the
 * space", which can make a few pixels a little uneven but fills the screen.
 */
export class Screen {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {HTMLElement} area  The element the canvas should fill.
   */
  constructor(canvas, area) {
    this.canvas = canvas
    this.area = area
    this.canvas.width = SCREEN_WIDTH
    this.canvas.height = SCREEN_HEIGHT

    /** The drawing context. Smoothing off = hard pixel edges. */
    this.ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'))
    this.ctx.imageSmoothingEnabled = false

    this.resize = this.resize.bind(this)
    new ResizeObserver(this.resize).observe(area)
    this.resize()
  }

  /** Recalculate the displayed size of the canvas. */
  resize() {
    // Space inside the area's padding (the padding leaves room for controls).
    const style = getComputedStyle(this.area)
    const availableWidth =
      this.area.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
    const availableHeight =
      this.area.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)
    const fitScale = Math.min(
      availableWidth / SCREEN_WIDTH,
      availableHeight / SCREEN_HEIGHT,
    )
    // Whole-number scaling when it's at least 2x, otherwise just fit.
    const scale = fitScale >= 2 ? Math.floor(fitScale) : fitScale
    this.canvas.style.width = `${Math.floor(SCREEN_WIDTH * scale)}px`
    this.canvas.style.height = `${Math.floor(SCREEN_HEIGHT * scale)}px`
  }
}
