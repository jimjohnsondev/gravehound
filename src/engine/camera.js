import { SCREEN_WIDTH, SCREEN_HEIGHT } from './config.js'

/**
 * Decides which part of the map is on screen.
 *
 * Two kinds of map, chosen per story beat:
 * - 'screen': a single still screen (20 x 12 tiles). The camera never moves.
 *   Smaller maps are centred.
 * - 'scroll': a larger map. The camera follows a target and stops at the
 *   map edges, scrolling in any direction.
 */
export class Camera {
  constructor() {
    this.x = 0
    this.y = 0
  }

  /**
   * @param {'screen' | 'scroll'} mode
   * @param {{widthInPixels: number, heightInPixels: number}} map
   * @param {{x: number, y: number}} target  Point to keep in view (map pixels).
   */
  follow(mode, map, target) {
    if (mode === 'screen') {
      this.x = Math.floor((map.widthInPixels - SCREEN_WIDTH) / 2)
      this.y = Math.floor((map.heightInPixels - SCREEN_HEIGHT) / 2)
      return
    }
    this.x = clampAxis(target.x - SCREEN_WIDTH / 2, map.widthInPixels, SCREEN_WIDTH)
    this.y = clampAxis(target.y - SCREEN_HEIGHT / 2, map.heightInPixels, SCREEN_HEIGHT)
  }
}

/**
 * Keep the view inside the map. If the map is smaller than the screen on this
 * axis, centre it instead. Rounded to whole pixels so art never blurs.
 * @param {number} wanted
 * @param {number} mapSize
 * @param {number} screenSize
 */
function clampAxis(wanted, mapSize, screenSize) {
  if (mapSize <= screenSize) return Math.floor((mapSize - screenSize) / 2)
  return Math.round(Math.max(0, Math.min(wanted, mapSize - screenSize)))
}
