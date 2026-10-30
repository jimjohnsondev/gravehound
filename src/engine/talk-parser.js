/**
 * Reads `.talk` dialog files into scenes of plain data. The format is flat:
 * every line stands alone and a scene plays from top to bottom. The rules are
 * in docs/talk-format.md, and talk-checker.js checks the names used.
 */

/** Expression a speaker starts each scene with. Every speaker must have it. */
export const DEFAULT_EXPRESSION = 'neutral'

/** A menu can't offer more choices than this (screen space). */
const MAX_CHOICES = 4

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

/** `== supper ==` */
const SCENE_HEADER = /^==\s*([a-z][a-z0-9_]*)\s*==$/

/** `[if ledger_read] ` at the start of a line. */
const LEADING_CONDITION = /^\[if\s+([^\]]+)\]\s*/

/** `[give fathers_knife]` */
const COMMAND = /^\[([a-z]+)(?:\s+([^\]]*))?\]$/

/** `WREN: Hello.` or `WREN (happy): Hello.` */
const SPEECH = /^([A-Z][A-Z0-9_]*)(?:\s*\(([a-z_]+)\))?:\s*(.*)$/

/** `father: ` at the start of a choice. */
const CHOICE_LABEL = /^([a-z][a-z0-9_]*):\s+/

/** ` [set asked_about_door]` at the end of a choice. */
const TRAILING_CHANGE = /\s*\[(set|clear)\s+([^\]]+)\]$/

/** `ledger_read` */
const NAME = /^[a-z][a-z0-9_]*$/

/** `heart >= 2` */
const COMPARISON = /^([a-z][a-z0-9_]*)\s*(!=|<=|>=|=|<|>)\s*(-?\d+)$/

/** `got_knife`, `maren_affection + 1` or `tobin_mood = 3` */
const CHANGE_ARGUMENT = /^([a-z][a-z0-9_]*)(?:\s*([+\-=])\s*(\d+))?$/

/** `{hero}` inside a line of text. */
export const TEXT_VALUE = /\{([a-z_]+)\}/g

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
 * @typedef {object} FileReader
 * What carries over from one line of a file to the next.
 * @property {Scenes} scenes
 * @property {Step[] | null} steps       The scene being read, if any.
 * @property {MenuStep | null} openMenu  The menu `*` lines are being added to, if any.
 */

/**
 * Read one file's lines into `scenes`, adding anything unreadable to `problems`.
 * @param {string} source
 * @param {string} file
 * @param {Scenes} scenes
 * @param {string[]} problems
 */
function parseFile(source, file, scenes, problems) {
  /** @type {FileReader} */
  const reader = { scenes, steps: null, openMenu: null }

  source.split(/\r?\n/).forEach((rawLine, index) => {
    const place = { file, line: index + 1 }
    try {
      parseLine(rawLine.trimEnd(), place, reader)
    } catch (error) {
      problems.push(`${file} line ${place.line}: ${error.message}`)
    }
  })
}

/**
 * @param {string} line
 * @param {Place} place
 * @param {FileReader} reader
 */
function parseLine(line, place, reader) {
  // A blank line ends a menu. Comments don't, so choices can be annotated.
  if (line === '') {
    reader.openMenu = null
    return
  }
  if (line.startsWith('#')) return
  if (/^\s/.test(line)) throw new Error("lines can't be indented")

  const header = line.match(SCENE_HEADER)
  if (header) {
    const name = header[1]
    if (reader.scenes[name]) throw new Error(`there is already a scene called ${name}`)
    reader.steps = reader.scenes[name] = []
    reader.openMenu = null
    return
  }
  if (!reader.steps) throw new Error('this line is outside a scene; start one with == name ==')

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
    addChoice(parseChoice(rest.slice(1).trim(), condition, place), place, reader)
  } else {
    reader.openMenu = null
    reader.steps.push(parseStep(rest, condition, place))
  }
}

/**
 * Add a choice to the open menu, starting a new menu if there isn't one.
 * @param {ChoiceOption} option
 * @param {Place} place
 * @param {FileReader} reader
 */
function addChoice(option, place, reader) {
  if (!reader.openMenu) {
    reader.openMenu = { type: 'menu', options: [], place }
    reader.steps.push(reader.openMenu)
  }
  if (reader.openMenu.options.length === MAX_CHOICES) {
    throw new Error(`a menu can have at most ${MAX_CHOICES} choices`)
  }
  reader.openMenu.options.push(option)
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
  let match = text.match(TRAILING_CHANGE)
  while (match) {
    changes.unshift(parseChange(match[1], match[2]))
    text = text.slice(0, match.index)
    match = text.match(TRAILING_CHANGE)
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

/**
 * Throw one error listing every problem, if there are any.
 * @param {string[]} problems
 */
export function throwIfAny(problems) {
  if (problems.length > 0) {
    throw new Error(`Problems in the .talk files:\n  ${problems.join('\n  ')}`)
  }
}
