/**
 * Game actions that dialog can run with [do name]. Each one is handed the
 * world, so it can change the map, move characters or start an event.
 * Add an action here before using it in a .talk file.
 */

/** @type {Record<string, (world: import('./world.js').World) => void>} */
export const TALK_ACTIONS = {
  /**
   * Grandmother bars the cottage door at the end of the birthday supper.
   * PLACEHOLDER: nothing visible happens yet. The theft scene, where the
   * goblin comes in through the window instead, will build on it.
   */
  bar_door() {},
}
