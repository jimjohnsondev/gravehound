/**
 * Loads every .talk dialog file and checks it against the names the game
 * declares: cast, flags, items, actions and backgrounds.
 */
import { checkTalk } from '../../engine/talk-checker.js'
import { parseTalkFiles } from '../../engine/talk-parser.js'
import { BACKGROUND_NAMES } from '../backgrounds.js'
import { CAST } from '../cast.js'
import { COUNTERS, FLAGS, ITEMS, STATS } from '../story-flags.js'
import { TALK_ACTIONS } from '../talk-actions.js'
import cottage from './cottage.talk?raw'
import woodEdge from './wood-edge.talk?raw'

/** Every .talk file in the game, by file name. Add new ones here. */
const TALK_FILES = {
  'cottage.talk': cottage,
  'wood-edge.talk': woodEdge,
}

/**
 * Read and check all the dialog. Throws one error listing every problem, with
 * file and line numbers, so mistakes show up as soon as the game starts.
 * @returns {import('../../engine/talk-parser.js').Scenes}
 */
export function loadScenes() {
  /** @type {Record<string, string[]>} */
  const speakers = {}
  for (const [id, member] of Object.entries(CAST)) speakers[id] = member.expressions

  const scenes = parseTalkFiles(TALK_FILES)
  checkTalk(scenes, {
    speakers,
    flags: Object.keys(FLAGS),
    counters: Object.keys(COUNTERS),
    stats: Object.keys(STATS),
    items: Object.keys(ITEMS),
    actions: Object.keys(TALK_ACTIONS),
    backgrounds: BACKGROUND_NAMES,
    textValues: ['hero'],
  })
  return scenes
}
