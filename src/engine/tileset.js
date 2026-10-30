/**
 * Tile graphics. Each tile type is painted once per light level and kept, so
 * maps draw quickly by copying finished squares.
 */
import { TILE_SIZE } from './config.js'
import { backgroundColor } from './palette.js'

/**
 * @typedef {object} TilePainter
 * The drawing tools a tile's paint function receives. Colours are always given
 * as (ramp, step) so lighting can darken them.
 * @property {(x: number, y: number, w: number, h: number, ramp: string, step: number) => void} rect
 * @property {(x: number, y: number, ramp: string, step: number) => void} pixel
 * @property {() => number} random  Repeatable random number 0-1 (same every time for a tile).
 */

/**
 * @typedef {object} TileType
 * @property {string} name
 * @property {boolean} solid             Can the player walk through it?
 * @property {(paint: TilePainter) => void} paint  Draws the 16x16 tile.
 */

/**
 * The set of tile types and their cached pictures. Tiles are painted by code
 * as placeholder art. For imported art, only this class has to change.
 */
export class TileSet {
  /** @param {Record<string, TileType>} types  Tile types keyed by map character. */
  constructor(types) {
    this.types = types
    this.characters = Object.keys(types)
    /** @type {Map<number, HTMLCanvasElement>} cached sheets by light level */
    this.sheets = new Map()
  }

  /** @param {string} character */
  isSolid(character) {
    return this.types[character]?.solid ?? true
  }

  /**
   * Draw one tile onto the screen.
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} character  The tile's character in the map.
   * @param {number} x  Screen x in pixels.
   * @param {number} y  Screen y in pixels.
   * @param {number} lightLevel
   */
  draw(ctx, character, x, y, lightLevel) {
    const index = this.characters.indexOf(character)
    if (index === -1) return
    const sheet = this.#sheetFor(lightLevel)
    ctx.drawImage(sheet, index * TILE_SIZE, 0, TILE_SIZE, TILE_SIZE, x, y, TILE_SIZE, TILE_SIZE)
  }

  /** All tiles at one light level in a single strip, painted on first use. */
  #sheetFor(lightLevel) {
    const cached = this.sheets.get(lightLevel)
    if (cached) return cached

    const sheet = document.createElement('canvas')
    sheet.width = TILE_SIZE * this.characters.length
    sheet.height = TILE_SIZE
    const ctx = /** @type {CanvasRenderingContext2D} */ (sheet.getContext('2d'))

    this.characters.forEach((character, index) => {
      const offsetX = index * TILE_SIZE
      const random = seededRandom(character.charCodeAt(0) * 7919)
      /** @type {TilePainter} */
      const painter = {
        rect(x, y, w, h, ramp, step) {
          ctx.fillStyle = backgroundColor(ramp, step, lightLevel)
          ctx.fillRect(offsetX + x, y, w, h)
        },
        pixel(x, y, ramp, step) {
          painter.rect(x, y, 1, 1, ramp, step)
        },
        random,
      }
      this.types[character].paint(painter)
    })

    this.sheets.set(lightLevel, sheet)
    return sheet
  }
}

/**
 * A tiny repeatable random number generator (mulberry32). The same seed always
 * gives the same numbers, so a tile looks identical at every light level.
 * @param {number} seed
 * @returns {() => number}  Function returning numbers from 0 up to 1.
 */
function seededRandom(seed) {
  let state = seed >>> 0
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
