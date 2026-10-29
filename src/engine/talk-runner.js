import { DEFAULT_EXPRESSION } from './talk-parser.js'

/**
 * Plays one dialog scene, one step at a time, without drawing anything.
 *
 * The dialog box asks `next()` for the next thing to show, and calls
 * `choose()` when the player picks from a menu. Steps whose [if ...] doesn't
 * hold are skipped, and [set], [give], [do] and [background] happen as they
 * are reached, so the dialog box only ever sees lines and menus.
 */

/**
 * @typedef {object} ShownLine
 * @property {'line'} type
 * @property {string | null} speaker  Speaker id, or null for narration.
 * @property {string} expression
 * @property {string} text            With {values} filled in.
 */

/**
 * @typedef {object} ShownMenu
 * @property {'menu'} type
 * @property {string[]} choices  Only the choices whose [if ...] holds.
 */

/**
 * @typedef {object} TalkHooks
 * How a conversation reaches the rest of the game.
 * @property {(action: string) => void} act               Runs [do action].
 * @property {(background: string) => void} setBackground  Runs [background name].
 * @property {Record<string, string>} textValues           Fills in {hero} and friends.
 */

export class Conversation {
  /**
   * @param {string} sceneName
   * @param {import('./talk-parser.js').Step[]} steps
   * @param {import('./story-state.js').StoryState} story
   * @param {TalkHooks} hooks
   */
  constructor(sceneName, steps, story, hooks) {
    this.sceneName = sceneName
    this.steps = steps
    this.story = story
    this.hooks = hooks
    /** Index of the next step to run. */
    this.index = 0
    /**
     * Each speaker's current expression. It sticks until a line changes it.
     * @type {Map<string, string>}
     */
    this.expressions = new Map()
    /**
     * Label of the choice picked in the most recent menu.
     * @type {string | null}
     */
    this.picked = null
    /**
     * The options on show in the current menu.
     * @type {import('./talk-parser.js').ChoiceOption[]}
     */
    this.offered = []
  }

  /**
   * Run steps until there is something to show.
   * @returns {ShownLine | ShownMenu | null}  null when the scene is over.
   */
  next() {
    while (this.index < this.steps.length) {
      const step = this.steps[this.index++]

      if (step.type === 'menu') {
        // A new menu: earlier picks no longer count, even if it's skipped.
        this.picked = null
        this.offered = step.options.filter((option) => this.#holds(option.condition))
        if (this.offered.length === 0) continue
        return { type: 'menu', choices: this.offered.map((option) => this.fillIn(option.text)) }
      }

      if (!this.#holds(step.condition)) continue

      switch (step.type) {
        case 'say':
          return this.#say(step)
        case 'change':
          this.#apply(step.change)
          break
        case 'give':
          this.story.items.add(step.name)
          break
        case 'do':
          this.hooks.act(step.name)
          break
        case 'background':
          this.hooks.setBackground(step.name)
          break
      }
    }

    this.story.seenScenes.add(this.sceneName)
    return null
  }

  /**
   * The player picked a choice from the menu that `next()` last returned.
   * @param {number} index  Position in that menu's `choices`.
   */
  choose(index) {
    const option = this.offered[index]
    this.picked = option.label
    option.changes.forEach((change) => this.#apply(change))
  }

  /**
   * Replace {names} in text with their values, e.g. {hero} with the hero's name.
   * @param {string} text
   */
  fillIn(text) {
    return text.replace(/\{([a-z_]+)\}/g, (whole, name) => this.hooks.textValues[name] ?? whole)
  }

  /**
   * @param {import('./talk-parser.js').SayStep} step
   * @returns {ShownLine}
   */
  #say(step) {
    let expression = DEFAULT_EXPRESSION
    if (step.speaker) {
      expression = step.expression ?? this.expressions.get(step.speaker) ?? DEFAULT_EXPRESSION
      this.expressions.set(step.speaker, expression)
    }
    return { type: 'line', speaker: step.speaker, expression, text: this.fillIn(step.text) }
  }

  /** @param {import('./talk-parser.js').Change} change */
  #apply({ name, how, amount }) {
    if (how === 'on') this.story.set(name, true)
    else if (how === 'off') this.story.set(name, false)
    else if (how === 'add') this.story.setNumber(name, this.story.getNumber(name) + amount)
    else this.story.setNumber(name, amount)
  }

  /**
   * @param {import('./talk-parser.js').Condition} condition
   * @returns {boolean} true when every check holds
   */
  #holds(condition) {
    return condition.every((check) => this.#checkHolds(check) !== check.negated)
  }

  /** @param {import('./talk-parser.js').Check} check */
  #checkHolds(check) {
    switch (check.type) {
      case 'flag':
        return this.story.isSet(check.name)
      case 'picked':
        return this.picked === check.name
      case 'seen':
        return this.story.seenScenes.has(check.name)
      case 'compare':
        return compare(this.story.getNumber(check.name), check.operator, check.value)
    }
  }
}

/**
 * @param {number} left
 * @param {import('./talk-parser.js').CompareOperator} operator
 * @param {number} right
 */
function compare(left, operator, right) {
  switch (operator) {
    case '=': return left === right
    case '!=': return left !== right
    case '<': return left < right
    case '<=': return left <= right
    case '>': return left > right
    case '>=': return left >= right
  }
}
