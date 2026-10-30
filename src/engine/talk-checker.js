/**
 * Checks parsed dialog against the names the game declares, so a typo in a
 * flag or expression stops the game loading instead of silently doing nothing.
 */
import { DEFAULT_EXPRESSION, TEXT_VALUE, throwIfAny } from './talk-parser.js'

/**
 * @typedef {object} TalkRules
 * Everything a .talk file is allowed to mention.
 * @property {Record<string, string[]>} speakers  Speaker id -> its expressions.
 * @property {string[]} flags
 * @property {string[]} counters    Numbers dialog can change, like maren_affection.
 * @property {string[]} stats       Numbers dialog can read but not change, like heart.
 * @property {string[]} items
 * @property {string[]} actions
 * @property {string[]} backgrounds
 * @property {string[]} textValues  Names allowed in {curly braces}, like 'hero'.
 */

/**
 * Check every name used in the scenes. Throws one error listing every problem.
 * @param {import('./talk-parser.js').Scenes} scenes
 * @param {TalkRules} rules
 */
export function checkTalk(scenes, rules) {
  const checker = new TalkChecker(scenes, rules)
  checker.checkSpeakers()
  for (const steps of Object.values(scenes)) checker.checkScene(steps)
  throwIfAny(checker.problems)
}

/** Holds what every check needs: the scenes, the rules and the problems so far. */
class TalkChecker {
  /**
   * @param {import('./talk-parser.js').Scenes} scenes
   * @param {TalkRules} rules
   */
  constructor(scenes, rules) {
    this.scenes = scenes
    this.rules = rules
    /** @type {string[]} */
    this.problems = []
  }

  /** The runner starts every speaker on the default expression, so all need it. */
  checkSpeakers() {
    for (const [speaker, expressions] of Object.entries(this.rules.speakers)) {
      if (!expressions.includes(DEFAULT_EXPRESSION)) {
        this.problems.push(`speaker ${speaker} needs a "${DEFAULT_EXPRESSION}" expression`)
      }
    }
  }

  /** @param {import('./talk-parser.js').Step[]} steps */
  checkScene(steps) {
    /** @type {(string | null)[]} */
    let menuLabels = []

    for (const step of steps) {
      if (step.type === 'menu') {
        this.#checkMenu(step, menuLabels)
        menuLabels = step.options.map((option) => option.label)
        continue
      }

      this.#checkCondition(step.condition, step.place, menuLabels)
      switch (step.type) {
        case 'say':
          this.#checkSay(step)
          break
        case 'change':
          this.#checkChange(step.change, step.place)
          break
        case 'give':
          this.#checkDeclared(step, this.rules.items, 'item')
          break
        case 'do':
          this.#checkDeclared(step, this.rules.actions, 'action')
          break
        case 'background':
          this.#checkDeclared(step, this.rules.backgrounds, 'background')
          break
      }
    }
  }

  /**
   * @param {import('./talk-parser.js').Place} place
   * @param {string} message
   */
  #report(place, message) {
    this.problems.push(`${place.file} line ${place.line}: ${message}`)
  }

  /** @param {string} name */
  #isNumber(name) {
    return this.rules.counters.includes(name) || this.rules.stats.includes(name)
  }

  /**
   * @param {import('./talk-parser.js').MenuStep} step
   * @param {(string | null)[]} previousLabels  A choice's own [if picked ...]
   *   refers to the menu before this one.
   */
  #checkMenu(step, previousLabels) {
    for (const option of step.options) {
      this.#checkCondition(option.condition, option.place, previousLabels)
      for (const change of option.changes) this.#checkChange(change, option.place)
      this.#checkTextValues(option.text, option.place)
    }

    const labels = step.options.map((option) => option.label).filter((label) => label !== null)
    if (new Set(labels).size !== labels.length) {
      this.#report(step.place, 'two choices in this menu have the same label')
    }
  }

  /** @param {import('./talk-parser.js').SayStep} step */
  #checkSay(step) {
    this.#checkTextValues(step.text, step.place)
    if (step.speaker === null) return

    const expressions = this.rules.speakers[step.speaker]
    if (!expressions) {
      this.#report(step.place, `unknown speaker ${step.speaker}`)
    } else if (step.expression && !expressions.includes(step.expression)) {
      this.#report(step.place,
        `unknown expression "${step.expression}" for ${step.speaker} (has: ${expressions.join(', ')})`)
    }
  }

  /**
   * @param {import('./talk-parser.js').Condition} condition
   * @param {import('./talk-parser.js').Place} place
   * @param {(string | null)[]} labels  Labels in the most recent menu.
   */
  #checkCondition(condition, place, labels) {
    for (const { type, name } of condition) {
      if (type === 'picked' && !labels.includes(name)) {
        this.#report(place, `"picked ${name}" doesn't match a choice label in the menu above it`)
      } else if (type === 'seen' && !this.scenes[name]) {
        this.#report(place, `"seen ${name}": there is no scene called ${name}`)
      } else if (type === 'compare' && !this.#isNumber(name)) {
        this.#report(place, `unknown counter or stat "${name}"`)
      } else if (type === 'flag' && this.#isNumber(name)) {
        this.#report(place, `${name} is a number, so compare it, e.g. [if ${name} >= 1]`)
      } else if (type === 'flag' && !this.rules.flags.includes(name)) {
        this.#report(place, `unknown flag "${name}"`)
      }
    }
  }

  /**
   * @param {import('./talk-parser.js').Change} change
   * @param {import('./talk-parser.js').Place} place
   */
  #checkChange({ name, how }, place) {
    if (how === 'on' || how === 'off') {
      if (!this.rules.flags.includes(name)) this.#report(place, `unknown flag "${name}"`)
    } else if (this.rules.stats.includes(name)) {
      this.#report(place, `${name} is a stat, which dialog can read but not change`)
    } else if (!this.rules.counters.includes(name)) {
      this.#report(place, `unknown counter "${name}"`)
    }
  }

  /**
   * @param {string} text
   * @param {import('./talk-parser.js').Place} place
   */
  #checkTextValues(text, place) {
    for (const [, name] of text.matchAll(TEXT_VALUE)) {
      if (!this.rules.textValues.includes(name)) this.#report(place, `unknown {${name}} in the text`)
    }
  }

  /**
   * @param {import('./talk-parser.js').CommandStep} step
   * @param {string[]} declared
   * @param {string} kind  What to call the name in the error message.
   */
  #checkDeclared(step, declared, kind) {
    if (!declared.includes(step.name)) this.#report(step.place, `unknown ${kind} "${step.name}"`)
  }
}
