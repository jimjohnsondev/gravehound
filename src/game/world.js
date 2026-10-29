import { TILE_SIZE } from '../engine/config.js'
import { Camera } from '../engine/camera.js'
import { Fade } from '../engine/fade.js'
import { MAX_LIGHT_LEVEL } from '../engine/palette.js'
import { TileMap } from '../engine/tilemap.js'
import { Ash } from './ash.js'
import { Hero } from './hero.js'

/**
 * @typedef {object} MapExit
 * Stepping on this tile takes you to another map.
 * @property {number} tileX
 * @property {number} tileY
 * @property {string} toMap    Id of the map to go to (see game/maps/index.js).
 * @property {number} arriveX  Tile to arrive on in the new map.
 * @property {number} arriveY
 * @property {import('../engine/sprite.js').Facing} facing  Way to face on arrival.
 */

/**
 * @typedef {object} MapDefinition
 * @property {string} id
 * @property {string} name
 * @property {'screen' | 'scroll'} mode  Single still screen, or scrolling.
 * @property {number} lightLevel         0 (bright) to 4 (dark). Darkens scenery only.
 * @property {string[]} rows             The tiles, one string per row.
 * @property {MapExit[]} exits
 */

/** Which way is "behind" for each facing, used to place Ash on arrival. */
const BEHIND = {
  down: { x: 0, y: -1 },
  up: { x: 0, y: 1 },
  left: { x: 1, y: 0 },
  right: { x: -1, y: 0 },
}

/**
 * The game world: the current map, the characters in it, and moving between
 * maps. This is the "playing" state of the game.
 */
export class World {
  /**
   * @param {object} options
   * @param {Record<string, MapDefinition>} options.maps
   * @param {import('../engine/tileset.js').TileSet} options.tileset
   * @param {import('../engine/sprite.js').SpriteSheet} options.heroSprites
   * @param {import('../engine/sprite.js').SpriteSheet} options.ashSprites
   */
  constructor({ maps, tileset, heroSprites, ashSprites }) {
    this.maps = maps
    this.tileset = tileset
    this.hero = new Hero(heroSprites)
    this.ash = new Ash(ashSprites)
    this.camera = new Camera()
    this.fade = new Fade()

    /** @type {MapDefinition} */
    this.mapDefinition = maps[Object.keys(maps)[0]]
    this.tileMap = new TileMap(this.mapDefinition.rows)
    this.lightLevel = 0
    this.paused = false
  }

  /**
   * Switch to a map and put the hero on a tile.
   * @param {string} mapId
   * @param {number} tileX
   * @param {number} tileY
   * @param {import('../engine/sprite.js').Facing} facing
   */
  enterMap(mapId, tileX, tileY, facing) {
    const definition = this.maps[mapId]
    if (!definition) throw new Error(`No map called "${mapId}"`)

    this.mapDefinition = definition
    this.tileMap = new TileMap(definition.rows)
    this.lightLevel = definition.lightLevel

    this.hero.placeOnTile(tileX, tileY, TILE_SIZE)
    this.hero.facing = facing
    const behind = BEHIND[facing]
    this.ash.placeAt({
      x: this.hero.center.x + behind.x * TILE_SIZE,
      y: this.hero.center.y + behind.y * TILE_SIZE,
    })
    this.camera.follow(definition.mode, this.tileMap, this.hero.center)
  }

  /** @param {import('../engine/input.js').Input} input */
  update(input) {
    this.fade.update()
    if (this.fade.busy) return

    if (input.wasPressed('menu')) this.paused = !this.paused
    if (this.paused) return

    // DEBUG: B cycles the light level so you can see the lighting system.
    // Remove once B has a real job.
    if (input.wasPressed('b')) {
      this.lightLevel = (this.lightLevel + 1) % (MAX_LIGHT_LEVEL + 1)
    }

    this.hero.update(input.direction(), (box) => this.tileMap.overlapsSolid(this.tileset, box))
    this.ash.update(this.hero)
    this.camera.follow(this.mapDefinition.mode, this.tileMap, this.hero.center)
    this.#checkExits()
  }

  /** If the hero's feet are on an exit tile, fade out and change map. */
  #checkExits() {
    const tileX = Math.floor(this.hero.center.x / TILE_SIZE)
    const tileY = Math.floor(this.hero.center.y / TILE_SIZE)
    const exit = this.mapDefinition.exits.find((e) => e.tileX === tileX && e.tileY === tileY)
    if (!exit) return
    this.fade.out(() => this.enterMap(exit.toMap, exit.arriveX, exit.arriveY, exit.facing))
  }

  /** @param {CanvasRenderingContext2D} ctx */
  draw(ctx) {
    ctx.fillStyle = '#0b0a12'
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    this.tileMap.draw(ctx, this.tileset, this.camera, this.lightLevel)

    // Draw characters from back to front so nearer ones overlap farther ones.
    const characters = [
      { depth: this.ash.y + 3, draw: () => this.ash.draw(ctx, this.camera) },
      { depth: this.hero.y + this.hero.height, draw: () => this.hero.draw(ctx, this.camera) },
    ]
    characters.sort((a, b) => a.depth - b.depth).forEach((c) => c.draw())

    if (this.paused) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    }

    this.fade.draw(ctx)
  }
}
