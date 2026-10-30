/**
 * The game world while playing: the current map, the characters in it, moving
 * between maps, and starting dialog scenes.
 */
import { SCREEN_HEIGHT, SCREEN_WIDTH, TILE_SIZE } from '../engine/config.js'
import { Camera } from '../engine/camera.js'
import { DialogBox } from '../engine/dialog-box.js'
import { Fade } from '../engine/fade.js'
import { MAX_LIGHT_LEVEL, UI_COLORS } from '../engine/palette.js'
import { FACING_STEPS } from '../engine/sprite.js'
import { StoryState } from '../engine/story-state.js'
import { Conversation } from '../engine/talk-runner.js'
import { TileMap } from '../engine/tilemap.js'
import { Ash } from './ash.js'
import { Hero } from './hero.js'
import { MapBanner } from './map-banner.js'
import { Npc } from './npc.js'
import { STATS } from './story-flags.js'
import { TALK_ACTIONS } from './talk-actions.js'
import { OPEN_CHEST_TILE } from './tiles.js'

/** PLACEHOLDER until there's a title screen where the player names the hero. */
const PLACEHOLDER_HERO_NAME = 'Rowan'

/** Laid over the whole screen while the game is paused. */
const PAUSE_OVERLAY = 'rgba(0, 0, 0, 0.5)'

/** @typedef {import('./maps/index.js').MapDefinition} MapDefinition */
/** @typedef {import('./character.js').Character} Character */

/** Everything in play. Call `enterMap` once before the first update or draw. */
export class World {
  /**
   * @param {object} options
   * @param {Record<string, MapDefinition>} options.maps
   * @param {import('../engine/tileset.js').TileSet} options.tileset
   * @param {import('../engine/sprite.js').SpriteSheet} options.heroSprites
   * @param {import('../engine/sprite.js').SpriteSheet} options.ashSprites
   * @param {Record<string, import('../engine/sprite.js').SpriteSheet>} options.npcSprites
   * @param {import('../engine/talk-parser.js').Scenes} options.scenes  All dialog.
   * @param {Record<string, import('../engine/dialog-box.js').Speaker>} options.speakers
   * @param {Record<string, CanvasImageSource>} options.backgrounds  Dialog backgrounds.
   */
  constructor({ maps, tileset, heroSprites, ashSprites, npcSprites, scenes, speakers, backgrounds }) {
    this.maps = maps
    this.tileset = tileset
    this.npcSprites = npcSprites
    this.scenes = scenes
    this.hero = new Hero(heroSprites)
    this.ash = new Ash(ashSprites)
    this.camera = new Camera()
    this.fade = new Fade()
    this.banner = new MapBanner()
    this.dialog = new DialogBox({ speakers, backgrounds })
    this.story = new StoryState(STATS)
    this.heroName = PLACEHOLDER_HERO_NAME

    /** @type {MapDefinition | null} */
    this.mapDefinition = null
    /** @type {TileMap | null} */
    this.tileMap = null
    /** @type {Npc[]} */
    this.npcs = []
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

    const cameFrom = this.mapDefinition?.id
    this.mapDefinition = definition
    this.tileMap = new TileMap(definition.rows)
    this.lightLevel = definition.lightLevel
    this.npcs = definition.npcs.map((npc) => new Npc(npc, this.npcSprites[npc.sprite]))
    for (const chest of definition.chests) {
      if (this.story.isSet(chest.openedFlag)) {
        this.tileMap.setTile(chest.tileX, chest.tileY, OPEN_CHEST_TILE)
      }
    }

    this.hero.placeOnTile(tileX, tileY)
    this.hero.facing = facing
    // Ash starts one tile behind the hero.
    const ahead = FACING_STEPS[facing]
    this.ash.placeAt({
      x: this.hero.center.x - ahead.x * TILE_SIZE,
      y: this.hero.center.y - ahead.y * TILE_SIZE,
    }, this.hero.center)
    this.camera.follow(definition.mode, this.tileMap, this.hero.center)
    this.banner.show(definition.name)
    this.#startStoryScene(cameFrom)
  }

  /**
   * Play a scene if arriving on this map is a story beat.
   * @param {string | undefined} cameFrom  Id of the map just left.
   */
  #startStoryScene(cameFrom) {
    const broughtKindlingHome = this.mapDefinition.id === 'cottage' && cameFrom === 'woodEdge'
    if (broughtKindlingHome && !this.story.isSet('supper_done')) this.talk('supper')
  }

  /**
   * Start a dialog scene from a .talk file. Play stops until it's over.
   * @param {string} sceneName
   */
  talk(sceneName) {
    const steps = this.scenes[sceneName]
    if (!steps) throw new Error(`No dialog scene called "${sceneName}"`)
    this.banner.hide()
    this.dialog.start(new Conversation(sceneName, steps, this.story, {
      act: (action) => TALK_ACTIONS[action](this),
      setBackground: (name) => this.dialog.setBackground(name),
      textValues: { hero: this.heroName },
    }))
  }

  /** @param {import('../engine/input.js').Input} input */
  update(input) {
    this.fade.update()
    if (this.fade.busy) return

    // While someone is talking, the dialog box gets all the input.
    if (this.dialog.active) {
      this.dialog.update(input)
      return
    }

    if (input.wasPressed('menu')) this.paused = !this.paused
    if (this.paused) return

    // Counted only during play, so the banner is never used up behind a fade.
    this.banner.update()

    // DEBUG: B cycles the light level so you can see the lighting system.
    // Remove once B has a real job.
    if (input.wasPressed('b')) {
      this.lightLevel = (this.lightLevel + 1) % (MAX_LIGHT_LEVEL + 1)
    }

    if (input.wasPressed('a')) this.#interact()
    if (this.dialog.active) return

    const isBlocked = (/** @type {Character} */ character) => this.#isBlocked(character)
    this.hero.update(input.direction(), isBlocked)
    this.ash.update(this.hero)
    for (const npc of this.npcs) npc.update(isBlocked)
    this.camera.follow(this.mapDefinition.mode, this.tileMap, this.hero.center)
    this.#checkExits()
  }

  /**
   * Is someone walking into a solid tile or another person? The hero and NPCs
   * all block each other, so nobody can end up standing inside anyone else and
   * get stuck. Ash doesn't block anyone, so he can't trap the hero in a corner.
   * @param {Character} character
   */
  #isBlocked(character) {
    if (this.tileMap.overlapsSolid(this.tileset, character)) return true
    const everyone = [this.hero, ...this.npcs]
    return everyone.some((other) => other !== character && other.overlaps(character))
  }

  /** A was pressed: act on whatever is right in front of the hero. */
  #interact() {
    const reach = this.hero.reachPoint

    const npc = this.npcs.find((candidate) => candidate.isWithinReach(reach))
    if (npc) {
      npc.turnToFace(this.hero.facing)
      this.talk(npc.scene)
      return
    }

    const chest = findAtPoint(this.mapDefinition.chests, reach)
    if (chest) {
      this.#openChest(chest)
      return
    }

    const spot = findAtPoint(this.mapDefinition.spots, reach)
    if (spot) this.talk(spot.scene)
  }

  /**
   * Open a chest, unless it's already been opened.
   * @param {import('./maps/index.js').MapChest} chest
   */
  #openChest(chest) {
    if (this.story.isSet(chest.openedFlag)) return
    this.story.set(chest.openedFlag)
    this.tileMap.setTile(chest.tileX, chest.tileY, OPEN_CHEST_TILE)
    this.talk(chest.scene)
  }

  /** If the hero's feet are on an exit tile, fade out and change map. */
  #checkExits() {
    const exit = findAtPoint(this.mapDefinition.exits, this.hero.center)
    if (!exit) return
    this.fade.out(() => this.enterMap(exit.toMap, exit.arriveX, exit.arriveY, exit.facing))
  }

  /** @param {CanvasRenderingContext2D} ctx */
  draw(ctx) {
    ctx.fillStyle = UI_COLORS.backdrop
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

    this.tileMap.draw(ctx, this.tileset, this.camera, this.lightLevel)

    // Draw from back to front so nearer characters overlap farther ones.
    const characters = [this.ash, this.hero, ...this.npcs].sort((a, b) => a.depth - b.depth)
    for (const character of characters) character.draw(ctx, this.camera)

    this.banner.draw(ctx)
    this.dialog.draw(ctx)

    if (this.paused) {
      ctx.fillStyle = PAUSE_OVERLAY
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)
    }

    this.fade.draw(ctx)
  }
}

/**
 * The thing on the tile under a point, if there is one.
 * @template {{tileX: number, tileY: number}} Thing
 * @param {Thing[]} things
 * @param {{x: number, y: number}} point  In map pixels.
 * @returns {Thing | undefined}
 */
function findAtPoint(things, point) {
  const tileX = Math.floor(point.x / TILE_SIZE)
  const tileY = Math.floor(point.y / TILE_SIZE)
  return things.find((thing) => thing.tileX === tileX && thing.tileY === tileY)
}
