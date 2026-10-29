/**
 * The story so far: which flags are on, the values of counters and stats,
 * the items the hero carries, and which dialog scenes have been played.
 *
 * Dialog reads and changes this, and so does game code when story events
 * happen. Saving the game will later just mean saving this.
 */
export class StoryState {
  /**
   * @param {Record<string, number>} startingNumbers  Counters and stats that
   *   don't start at 0, e.g. { heart: 1 }.
   */
  constructor(startingNumbers = {}) {
    /** @type {Set<string>} flags that are on */
    this.flags = new Set()
    /** @type {Map<string, number>} counters and stats */
    this.numbers = new Map(Object.entries(startingNumbers))
    /** @type {Set<string>} */
    this.items = new Set()
    /** @type {Set<string>} scenes played to the end */
    this.seenScenes = new Set()
  }

  /** @param {string} flag */
  isSet(flag) {
    return this.flags.has(flag)
  }

  /**
   * Turn a flag on (or off).
   * @param {string} flag
   * @param {boolean} [on]
   */
  set(flag, on = true) {
    if (on) this.flags.add(flag)
    else this.flags.delete(flag)
  }

  /**
   * A counter or stat. Anything never set counts as 0.
   * @param {string} name
   */
  getNumber(name) {
    return this.numbers.get(name) ?? 0
  }

  /**
   * @param {string} name
   * @param {number} value
   */
  setNumber(name, value) {
    this.numbers.set(name, value)
  }
}
