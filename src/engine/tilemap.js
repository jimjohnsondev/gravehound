import { TILE_SIZE, SCREEN_WIDTH, SCREEN_HEIGHT } from './config.js'

/**
 * A grid of tiles, written as rows of characters so maps are easy to read
 * and edit by hand:
 *
 *   'TTTTTTTT',
 *   'T......T',
 *   'T..==..D',
 *
 * Each character is a tile type from the TileSet (see game/tiles.js).
 */
export class TileMap {
  /** @param {string[]} rows  One string per row, all the same length. */
  constructor(rows) {
    this.rows = rows
    this.widthInTiles = rows[0].length
    this.heightInTiles = rows.length
    this.widthInPixels = this.widthInTiles * TILE_SIZE
    this.heightInPixels = this.heightInTiles * TILE_SIZE

    rows.forEach((row, y) => {
      if (row.length !== this.widthInTiles) {
        throw new Error(`Map row ${y} is ${row.length} wide, expected ${this.widthInTiles}`)
      }
    })
  }

  /**
   * The tile character at a tile position, or null if outside the map.
   * @param {number} tileX
   * @param {number} tileY
   */
  tileAt(tileX, tileY) {
    if (tileY < 0 || tileY >= this.heightInTiles) return null
    if (tileX < 0 || tileX >= this.widthInTiles) return null
    return this.rows[tileY][tileX]
  }

  /**
   * Does a rectangle (in pixels) overlap any solid tile or the map edge?
   * @param {import('./tileset.js').TileSet} tileset
   * @param {{x: number, y: number, width: number, height: number}} box
   */
  overlapsSolid(tileset, box) {
    const left = Math.floor(box.x / TILE_SIZE)
    const right = Math.floor((box.x + box.width - 0.001) / TILE_SIZE)
    const top = Math.floor(box.y / TILE_SIZE)
    const bottom = Math.floor((box.y + box.height - 0.001) / TILE_SIZE)

    for (let tileY = top; tileY <= bottom; tileY++) {
      for (let tileX = left; tileX <= right; tileX++) {
        const character = this.tileAt(tileX, tileY)
        if (character === null || tileset.isSolid(character)) return true
      }
    }
    return false
  }

  /**
   * Draw the part of the map the camera can see.
   * @param {CanvasRenderingContext2D} ctx
   * @param {import('./tileset.js').TileSet} tileset
   * @param {{x: number, y: number}} camera  Top-left of the view, in map pixels.
   * @param {number} lightLevel
   */
  draw(ctx, tileset, camera, lightLevel) {
    const firstX = Math.floor(camera.x / TILE_SIZE)
    const firstY = Math.floor(camera.y / TILE_SIZE)
    const lastX = Math.floor((camera.x + SCREEN_WIDTH - 1) / TILE_SIZE)
    const lastY = Math.floor((camera.y + SCREEN_HEIGHT - 1) / TILE_SIZE)

    for (let tileY = firstY; tileY <= lastY; tileY++) {
      for (let tileX = firstX; tileX <= lastX; tileX++) {
        const character = this.tileAt(tileX, tileY)
        if (character === null) continue
        tileset.draw(
          ctx,
          character,
          tileX * TILE_SIZE - camera.x,
          tileY * TILE_SIZE - camera.y,
          lightLevel,
        )
      }
    }
  }
}
