/**
 * Decides which part of the map is on screen. There are two kinds of map:
 * - 'screen': a single still screen. The camera never moves.
 * - 'scroll': a larger map. The camera follows a target and stops at the edges.
 */
import { SCREEN_WIDTH, SCREEN_HEIGHT } from './config.js'

/** Top-left of the view, in map pixels. */
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
      this.x = centred(map.widthInPixels, SCREEN_WIDTH)
      this.y = centred(map.heightInPixels, SCREEN_HEIGHT)
      return
    }
    this.x = clampAxis(target.x - SCREEN_WIDTH / 2, map.widthInPixels, SCREEN_WIDTH)
    this.y = clampAxis(target.y - SCREEN_HEIGHT / 2, map.heightInPixels, SCREEN_HEIGHT)
  }
}

/**
 * The view position that puts the map in the middle of the screen.
 * @param {number} mapSize
 * @param {number} screenSize
 */
function centred(mapSize, screenSize) {
  return Math.floor((mapSize - screenSize) / 2)
}

/**
 * Keep the view inside the map, or centre a map smaller than the screen.
 * Rounded to whole pixels so art never blurs.
 * @param {number} wanted
 * @param {number} mapSize
 * @param {number} screenSize
 */
function clampAxis(wanted, mapSize, screenSize) {
  if (mapSize <= screenSize) return centred(mapSize, screenSize)
  return Math.round(Math.max(0, Math.min(wanted, mapSize - screenSize)))
}
