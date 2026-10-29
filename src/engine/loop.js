import { UPDATES_PER_SECOND } from './config.js'

const STEP_MS = 1000 / UPDATES_PER_SECOND

/** Never try to catch up more than this much time (e.g. after a tab switch). */
const MAX_CATCH_UP_MS = 250

/**
 * The main loop.
 *
 * `update` runs at a fixed 60 times a second so movement and timing feel the
 * same on a 60Hz phone and a 144Hz monitor. `draw` runs once per display
 * frame. Game code should change state only in update and only read it in draw.
 *
 * @param {object} callbacks
 * @param {() => void} callbacks.update  One fixed step of game logic.
 * @param {() => void} callbacks.draw    Paint the current state.
 */
export function startLoop({ update, draw }) {
  let previousTime = performance.now()
  let unspentTime = 0

  /** @param {number} now */
  function frame(now) {
    unspentTime += Math.min(now - previousTime, MAX_CATCH_UP_MS)
    previousTime = now

    while (unspentTime >= STEP_MS) {
      update()
      unspentTime -= STEP_MS
    }
    draw()
    requestAnimationFrame(frame)
  }

  requestAnimationFrame(frame)
}
