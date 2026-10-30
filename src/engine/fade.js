/**
 * Screen fades: everything, characters included, to black and back.
 */
import { SCREEN_WIDTH, SCREEN_HEIGHT } from './config.js'

/** Fades use a few hard steps rather than a smooth blend, for the 8-bit feel. */
const FADE_STEPS = [0, 0.25, 0.5, 0.75, 1]

/** Update steps spent on each fade step (60 per second). */
const STEP_DURATION = 5

/**
 * Runs one fade at a time. Usage:
 *   fade.out(() => { changeMap() })   // goes black, runs the callback, fades back in
 */
export class Fade {
  constructor() {
    /** 0 = clear, last index = fully black. */
    this.stepIndex = 0
    /** @type {'idle' | 'out' | 'in'} */
    this.state = 'idle'
    this.timer = 0
    /** @type {(() => void) | null} */
    this.onBlack = null
  }

  /** True while a fade is running. Game code usually ignores input then. */
  get busy() {
    return this.state !== 'idle'
  }

  /**
   * Fade to black, call `onBlack`, then fade back in.
   * @param {() => void} onBlack
   */
  out(onBlack) {
    if (this.busy) return
    this.state = 'out'
    this.timer = 0
    this.onBlack = onBlack
  }

  update() {
    if (this.state === 'idle') return
    this.timer++
    if (this.timer < STEP_DURATION) return
    this.timer = 0

    if (this.state === 'out') {
      this.stepIndex++
      if (this.stepIndex === FADE_STEPS.length - 1) {
        this.onBlack?.()
        this.onBlack = null
        this.state = 'in'
      }
    } else {
      this.stepIndex--
      if (this.stepIndex === 0) this.state = 'idle'
    }
  }

  /** @param {CanvasRenderingContext2D} ctx */
  draw(ctx) {
    const amount = FADE_STEPS[this.stepIndex]
    if (amount === 0) return
    ctx.fillStyle = `rgba(0, 0, 0, ${amount})`
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)
  }
}
