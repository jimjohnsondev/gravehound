/**
 * Someone standing on a map who the hero can talk to. They block the way like
 * a wall, and turn to face the hero when spoken to.
 */
import { Character } from './character.js'

/**
 * How far outside the feet box the hero can still reach. Without it the hero
 * has to line up almost exactly, which is fiddly on a touch d-pad.
 */
const REACH_SLACK = 3

/** Column of the sprite sheet showing someone standing still. */
const STANDING_FRAME = 0

/** @type {Record<import('../engine/sprite.js').Facing, import('../engine/sprite.js').Facing>} */
const OPPOSITE = { down: 'up', up: 'down', left: 'right', right: 'left' }

/**
 * @typedef {object} NpcDefinition
 * @property {string} sprite  Name of a sheet from createNpcSprites (game/sprites.js).
 * @property {number} tileX
 * @property {number} tileY
 * @property {import('../engine/sprite.js').Facing} facing
 * @property {string} scene   Dialog scene to play when spoken to.
 */

/** One person on the current map. */
export class Npc extends Character {
  /**
   * @param {NpcDefinition} definition
   * @param {import('../engine/sprite.js').SpriteSheet} sprites
   */
  constructor(definition, sprites) {
    super(sprites)
    this.scene = definition.scene
    this.facing = definition.facing
    this.placeOnTile(definition.tileX, definition.tileY)
  }

  /**
   * Does a box (in map pixels) overlap this NPC's feet?
   * @param {{x: number, y: number, width: number, height: number}} box
   */
  overlaps(box) {
    return box.x < this.x + this.width && box.x + box.width > this.x
      && box.y < this.y + this.height && box.y + box.height > this.y
  }

  /**
   * Is a point close enough to talk to this NPC?
   * @param {{x: number, y: number}} point
   */
  isWithinReach(point) {
    return point.x >= this.x - REACH_SLACK && point.x <= this.x + this.width + REACH_SLACK
      && point.y >= this.y - REACH_SLACK && point.y <= this.y + this.height + REACH_SLACK
  }

  /**
   * Turn to look back at someone facing this way.
   * @param {import('../engine/sprite.js').Facing} theirFacing
   */
  turnToFace(theirFacing) {
    this.facing = OPPOSITE[theirFacing]
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {{x: number, y: number}} camera
   */
  draw(ctx, camera) {
    this.drawFrame(ctx, camera, STANDING_FRAME)
  }
}
