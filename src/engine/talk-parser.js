/**
 * Reads `.talk` dialog files and checks them for mistakes.
 *
 * The format is flat on purpose: every line stands alone and a scene always
 * plays from top to bottom. The full rules are in docs/talk-format.md. In short:
 *
 *   == supper ==                         starts a scene
 *   WREN (happy): There you are!         a spoken line, with an expression
 *   The fire is lit.                     narration (no NAME: at the start)
 *   * father: "What was he like?"        a choice, with an optional label
 *   [if picked father] WREN: Stubborn.   any line can start with a condition
 *   [set maren_affection + 1]            change a flag or counter
 *   [give fathers_knife]  [do bar_door]  [background cottage_hearth]
 *   # a comment
 *
 * Reading happens in two passes. `parseTalkFiles` turns text into scenes and
 * reports anything it can't read. `checkTalk` then compares every name against
 * the lists the game declares, so a typo in a flag or expression is caught
 * when the game loads instead of silently doing nothing.
 */

/** Expression a speaker starts each scene with. Every speaker must have it. */
export const DEFAULT_EXPRESSION = 'neutral'

/** A menu can't offer more choices than this (screen space). */
export const MAX_CHOICES = 4

/** @typedef {'=' | '!=' | '<' | '<=' | '>' | '>='} CompareOperator */

/**
 * @typedef {object} Check
 * One part of a condition. A condition holds when all its checks hold.
 * @property {'flag' | 'compare' | 'picked' | 'seen'} type
 * @property {string} name      Flag, number, choice label or scene name.
 * @property {boolean} negated  True when written with "not".
 * @property {CompareOperator} [operator]  Only for 'compare'.
 * @property {number} [value]              Only for 'compare'.
 */

/** @typedef {Check[]} Condition  Empty means "always". */

/**
 * @typedef {object} Change
 * What a [set ...] or [clear ...] does.
 * @property {string} name
 * @property {'on' | 'off' | 'add' | 'assign'} how
 * @property {number} amount  For 'add' (negative to take away) and 'assign'.
 */

/**
 * @typedef {object} Place
 * Where something was written, for error messages.
 * @property {string} file
 * @property {number} line
 */

/**
 * @typedef {object} SayStep
 * A spoken line or narration.
 * @property {'say'} type
 * @property {string | null} speaker     Speaker id like 'WREN', or null for narration.
 * @property {string | null} expression  Null = keep the speaker's current expression.
 * @property {string} text
 * @property {Condition} condition
 * @property {Place} place
 */

/**
 * @typedef {object} ChoiceOption
 * @property {string | null} label  Lets later lines say [if picked label].
 * @property {string} text
 * @property {Condition} condition  The choice is only offered if this holds.
 * @property {Change[]} changes     Applied when the player picks it.
 * @property {Place} place
 */

/**
 * @typedef {object} MenuStep
 * Consecutive `*` lines, gathered into one menu.
 * @property {'menu'} type
 * @property {ChoiceOption[]} options
 * @property {Place} place
 */

/**
 * @typedef {object} ChangeStep
 * @property {'change'} type
 * @property {Change} change
 * @property {Condition} condition
 * @property {Place} place
 */

/**
 * @typedef {object} CommandStep
 * [give item], [do action] or [background name].
 * @property {'give' | 'do' | 'background'} type
 * @property {string} name
 * @property {Condition} condition
 * @property {Place} place
 */

/** @typedef {SayStep | MenuStep | ChangeStep | CommandStep} Step */

/** @typedef {Record<string, Step[]>} Scenes  Steps of every scene, by scene name. */

/**
 * @typedef {object} TalkRules
 * Everything a .talk file is allowed to mention. The game declares these.
 * @property {Record<string, string[]>} speakers  Speaker id -> its expressions.
 * @property {string[]} flags
 * @property {string[]} counters    Numbers dialog can change, like maren_affection.
 * @property {string[]} stats       Numbers dialog can read but not change, like heart.
 * @property {string[]} items
 * @property {string[]} actions
 * @property {string[]} backgrounds
 * @property {string[]} textValues  Names allowed in {curly braces}, like 'hero'.
 */

const SCENE_HEADER = /^==\s*([a-z][a-z0-9_]*)\s*==$/
const LEADING_CONDITION = /^\[if\s+([^\]]+)\]\s*/
const COMMAND = /^\[([a-z]+)(?:\s+([^\]]*))?\]$/
const SPEECH = /^([A-Z][A-Z0-9_]*)(?:\s*\(([a-z_]+)\))?:\s*(.*)$/
const CHOICE_LABEL = /^([a-z][a-z0-9_]*):\s+/
const TRAILING_CHANGE = /\s*\[(set|clear)\s+([^\]]+)\]$/
const NAME = /^[a-z][a-z0-9_]*$/
const COMPARISON = /^([a-z][a-z0-9_]*)\s*(!=|<=|>=|=|<|>)\s*(-?\d+)$/
const CHANGE_ARGUMENT = /^([a-z][a-z0-9_]*)(?:\s*([+\-=])\s*(\d+))?$/
const TEXT_VALUE = /\{([a-z_]+)\}/g

/**
 * Read several .talk files into one set of scenes.
 * Throws one error listing every problem found, with file and line numbers.
 * @param {Record<string, string>} files  File name -> file contents.
 * @returns {Scenes}
 */
export function parseTalkFiles(files) {
  /** @type {Scenes} */
  const scenes = {}
  /** @type {string[]} */
  const problems = []
  for (const [file, source] of Object.entries(files)) {
    parseFile(source, file, scenes, problems)
  }
  throwIfAny(problems)
  return scenes
}

/**
 * Check every name used in the scenes against what the game has declared.
 * Throws one error listing every problem found.
 * @param {Scenes} scenes
 * @param {TalkRules} rules
 */
export function checkTalk(scenes, rules) {
  /** @type {string[]} */
  const problems = []
  /** @param {Place} place @param {string} message */
  const report = (place, message) => problems.push(`${place.file} line ${place.line}: ${message}`)

  for (const [speaker, expressions] of Object.entries(rules.speakers)) {
    if (!expressions.includes(DEFAULT_EXPRESSION)) {
      problems.push(`speaker ${speaker} needs a "${DEFAULT_EXPRESSION}" expression`)
    }
  }

  /**
   * @param {Condition} condition
   * @param {Place} place
   * @param {(string | null)[]} labels  Labels in the most recent menu.
   */
  const checkCondition = (condition, place, labels) => {
    for (const check of condition) {
      const { name } = check
      if (check.type === 'picked' && !labels.includes(name)) {
        report(place, `"picked ${name}" doesn't match a choice label in the menu above it`)
      } else if (check.type === 'seen' && !scenes[name]) {
        report(place, `"seen ${name}": there is no scene called ${name}`)
      } else if (check.type === 'compare' && !isNumber(name)) {
        report(place, `unknown counter or stat "${name}"`)
      } else if (check.type === 'flag' && !rules.flags.includes(name)) {
        report(place, isNumber(name)
          ? `${name} is a number, so compare it, e.g. [if ${name} >= 1]`
          : `unknown flag "${name}"`)
      }
    }
  }

  /** @param {string} name */
  const isNumber = (name) => rules.counters.includes(name) || rules.stats.includes(name)

  /** @param {Change} change @param {Place} place */
  const checkChange = (change, place) => {
    const { name } = change
    if (change.how === 'on' || change.how === 'off') {
      if (!rules.flags.includes(name)) report(place, `unknown flag "${name}"`)
    } else if (rules.stats.includes(name)) {
      report(place, `${name} is a stat, which dialog can read but not change`)
    } else if (!rules.counters.includes(name)) {
      report(place, `unknown counter "${name}"`)
    }
  }

  /** @param {string} text @param {Place} place */
  const checkTextValues = (text, place) => {
    for (const [, name] of text.matchAll(TEXT_VALUE)) {
      if (!rules.textValues.includes(name)) report(place, `unknown {${name}} in the text`)
    }
  }

  for (const steps of Object.values(scenes)) {
    /** @type {(string | null)[]} */
    let menuLabels = []

    for (const step of steps) {
      if (step.type === 'menu') {
        // A choice's own [if picked ...] refers to the menu before this one.
        for (const option of step.options) {
          checkCondition(option.condition, option.place, menuLabels)
          option.changes.forEach((change) => checkChange(change, option.place))
          checkTextValues(option.text, option.place)
        }
        menuLabels = step.options.map((option) => option.label)
        const labelled = menuLabels.filter((label) => label !== null)
        if (new Set(labelled).size !== labelled.length) {
          report(step.place, 'two choices in this menu have the same label')
        }
        continue
      }

      checkCondition(step.condition, step.place, menuLabels)
      if (step.type === 'say') {
        checkTextValues(step.text, step.place)
        if (step.speaker === null) continue
        const expressions = rules.speakers[step.speaker]
        if (!expressions) {
          report(step.place, `unknown speaker ${step.speaker}`)
        } else if (step.expression && !expressions.includes(step.expression)) {
          report(step.place,
            `unknown expression "${step.expression}" for ${step.speaker} (has: ${expressions.join(', ')})`)
        }
      } else if (step.type === 'change') {
        checkChange(step.change, step.place)
      } else {
        const [known, kind] = {
          give: [rules.items, 'item'],
          do: [rules.actions, 'action'],
          background: [rules.backgrounds, 'background'],
        }[step.type]
        if (!known.includes(step.name)) report(step.place, `unknown ${kind} "${step.name}"`)
      }
    }
  }

  throwIfAny(problems)
}

/**
 * Read one file's lines into `scenes`, adding anything unreadable to `problems`.
 * @param {string} source
 * @param {string} file
 * @param {Scenes} scenes
 * @param {string[]} problems
 */
function parseFile(source, file, scenes, problems) {
  /** @type {Step[] | null} */
  let steps = null
  /**
   * The menu that `*` lines are currently being added to, if any.
   * @type {MenuStep | null}
   */
  let openMenu = null

  source.split(/\r?\n/).forEach((rawLine, index) => {
    const place = { file, line: index + 1 }
    const line = rawLine.trimEnd()
    try {
      // A blank line ends a menu. Comments don't, so you can annotate choices.
      if (line === '') {
        openMenu = null
        return
      }
      if (line.startsWith('#')) return
      if (/^\s/.test(line)) throw new Error("lines can't be indented")

      const header = line.match(SCENE_HEADER)
      if (header) {
        const name = header[1]
        if (scenes[name]) throw new Error(`there is already a scene called ${name}`)
        steps = scenes[name] = []
        openMenu = null
        return
      }
      if (!steps) throw new Error('this line is outside a scene; start one with == name ==')

      let rest = line
      /** @type {Condition} */
      let condition = []
      const conditionMatch = rest.match(LEADING_CONDITION)
      if (conditionMatch) {
        condition = parseCondition(conditionMatch[1].trim())
        rest = rest.slice(conditionMatch[0].length)
        if (rest === '') throw new Error('[if ...] needs something after it on the same line')
      }

      if (rest.startsWith('*')) {
        if (!openMenu) {
          openMenu = { type: 'menu', options: [], place }
          steps.push(openMenu)
        }
        if (openMenu.options.length === MAX_CHOICES) {
          throw new Error(`a menu can have at most ${MAX_CHOICES} choices`)
        }
        openMenu.options.push(parseChoice(rest.slice(1).trim(), condition, place))
        return
      }

      openMenu = null
      steps.push(parseStep(rest, condition, place))
    } catch (error) {
      problems.push(`${file} line ${place.line}: ${error.message}`)
    }
  })
}

/**
 * @param {string} text  The choice after its `*`.
 * @param {Condition} condition
 * @param {Place} place
 * @returns {ChoiceOption}
 */
function parseChoice(text, condition, place) {
  /** @type {Change[]} */
  const changes = []
  let match
  while ((match = text.match(TRAILING_CHANGE))) {
    changes.unshift(parseChange(match[1], match[2]))
    text = text.slice(0, match.index)
  }

  let label = null
  const labelMatch = text.match(CHOICE_LABEL)
  if (labelMatch) {
    label = labelMatch[1]
    text = text.slice(labelMatch[0].length)
  }

  text = text.trim()
  if (text === '') throw new Error('this choice has no words')
  return { label, text, condition, changes, place }
}

/**
 * A line that isn't a choice: a command, a spoken line or narration.
 * @param {string} text
 * @param {Condition} condition
 * @param {Place} place
 * @returns {Step}
 */
function parseStep(text, condition, place) {
  if (text.startsWith('[')) {
    const command = text.match(COMMAND)
    if (!command) throw new Error(`couldn't read "${text}"`)
    const [, word, argument = ''] = command
    switch (word) {
      case 'set':
      case 'clear':
        return { type: 'change', change: parseChange(word, argument), condition, place }
      case 'give':
      case 'do':
      case 'background':
        if (!NAME.test(argument.trim())) throw new Error(`[${word}] needs one name, like [${word} some_name]`)
        return { type: word, name: argument.trim(), condition, place }
      case 'if':
        throw new Error('[if ...] needs something after it on the same line')
      default:
        throw new Error(`unknown command [${word}]`)
    }
  }

  const speech = text.match(SPEECH)
  if (speech) {
    const [, speaker, expression = null, words] = speech
    if (words === '') throw new Error(`${speaker} has nothing to say`)
    return { type: 'say', speaker, expression, text: words, condition, place }
  }
  return { type: 'say', speaker: null, expression: null, text, condition, place }
}

/**
 * The inside of [set ...] or [clear ...].
 * @param {string} command  'set' or 'clear'.
 * @param {string} argument
 * @returns {Change}
 */
function parseChange(command, argument) {
  const match = argument.trim().match(CHANGE_ARGUMENT)
  if (!match) throw new Error(`couldn't read [${command} ${argument}]`)
  const [, name, sign, number] = match

  if (command === 'clear') {
    if (sign) throw new Error('[clear] only takes a flag name')
    return { name, how: 'off', amount: 0 }
  }
  if (!sign) return { name, how: 'on', amount: 0 }
  const amount = Number(number)
  if (sign === '=') return { name, how: 'assign', amount }
  return { name, how: 'add', amount: sign === '-' ? -amount : amount }
}

/**
 * The inside of [if ...]: checks joined by "and".
 * @param {string} text
 * @returns {Condition}
 */
function parseCondition(text) {
  if (/\bor\b/.test(text)) {
    throw new Error('"or" isn\'t supported; write a separate line for each case')
  }
  return text.split(/\s+and\s+/).map((part) => parseCheck(part.trim()))
}

/**
 * @param {string} text  One check, e.g. "not ledger_read" or "heart >= 2".
 * @returns {Check}
 */
function parseCheck(text) {
  let negated = false
  if (text.startsWith('not ')) {
    negated = true
    text = text.slice('not '.length).trim()
  }

  const words = text.split(/\s+/)
  if (words.length === 2 && (words[0] === 'picked' || words[0] === 'seen') && NAME.test(words[1])) {
    return { type: words[0], name: words[1], negated }
  }
  const comparison = text.match(COMPARISON)
  if (comparison) {
    const [, name, operator, value] = comparison
    return { type: 'compare', name, operator: /** @type {CompareOperator} */ (operator), value: Number(value), negated }
  }
  if (NAME.test(text)) return { type: 'flag', name: text, negated }
  throw new Error(`couldn't read the condition "${text}"`)
}

/** @param {string[]} problems */
function throwIfAny(problems) {
  if (problems.length > 0) {
    throw new Error(`Problems in the .talk files:\n  ${problems.join('\n  ')}`)
  }
}
