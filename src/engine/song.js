/**
 * Reads songs written as text into notes the sound chip can play.
 *
 * A song has a few channels, each a list of steps separated by spaces:
 *
 *   'A4 -- C5 -- E5 -- .. ..'
 *
 * `A4` starts a note, `G#3` is a sharp, `--` holds the note before it, and
 * `..` is a rest. Song format: docs/sound-format.md
 */
import { CLOCK_15K, CLOCK_64K, MAX_AUDF, MAX_VOLUME, isDistortion, ticksPerCycle } from './pokey.js'

/** `A4` or `G#3` */
const NOTE = /^([A-G])(#?)([0-9])$/

const HOLD = '--'
const REST = '..'

/** Semitones above C, for each note letter. */
const SEMITONES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

/** Tuning: note 69 in the usual numbering is A4, at 440 Hz. */
const A4_NUMBER = 69
const A4_FREQUENCY = 440
const SEMITONES_PER_OCTAVE = 12

/**
 * @typedef {object} ChannelSource
 * One channel of a song, as written.
 * @property {number} distortion  See engine/pokey.js.
 * @property {number} volume      Where each note starts, 0 to 15.
 * @property {number} decay       Update steps (60 a second) for each drop of 1
 *   in volume, down to 1. The chip's volume has only 16 levels, so a note fades
 *   in small steps. 0 holds the volume steady.
 * @property {string} notes
 */

/**
 * @typedef {object} SongSource
 * A song as written.
 * @property {number} stepsPerSecond
 * @property {ChannelSource[]} channels
 */

/**
 * @typedef {object} SongNote
 * @property {number} audf
 * @property {number} clock
 * @property {number} steps  How many steps it lasts.
 */

/**
 * @typedef {object} SongChannel
 * @property {number} distortion
 * @property {number} volume
 * @property {number} decay
 * @property {(SongNote | null)[]} notes  One entry per step. Null means no new note starts.
 */

/**
 * @typedef {object} Song
 * @property {number} stepSeconds  Length of one step.
 * @property {number} stepCount    Steps before the song loops.
 * @property {SongChannel[]} channels
 */

/**
 * Read a song. Throws if it can't be played as written.
 * @param {string} name  Used in error messages.
 * @param {SongSource} source
 * @param {number} maxChannels
 * @returns {Song}
 */
export function parseSong(name, source, maxChannels) {
  if (!(source.stepsPerSecond > 0 && Number.isFinite(source.stepsPerSecond))) {
    throw new Error(`Song "${name}" has stepsPerSecond ${source.stepsPerSecond}; it must be above 0`)
  }
  if (source.channels.length === 0) throw new Error(`Song "${name}" has no channels`)
  if (source.channels.length > maxChannels) {
    throw new Error(`Song "${name}" has ${source.channels.length} channels; the most is ${maxChannels}`)
  }

  const channels = source.channels.map((channel, index) => (
    parseChannel(`Song "${name}" channel ${index + 1}`, channel)
  ))

  const stepCount = channels[0].notes.length
  for (const [index, channel] of channels.entries()) {
    if (channel.notes.length !== stepCount) {
      throw new Error(`Song "${name}" channel ${index + 1} has ${channel.notes.length} steps, expected ${stepCount}`)
    }
  }
  return { stepSeconds: 1 / source.stepsPerSecond, stepCount, channels }
}

/**
 * @param {string} label  Used in error messages.
 * @param {ChannelSource} channel
 * @returns {SongChannel}
 */
function parseChannel(label, { distortion, volume, decay, notes }) {
  if (!isDistortion(distortion)) throw new Error(`${label}: no distortion ${distortion}`)
  if (!(volume >= 0 && volume <= MAX_VOLUME)) throw new Error(`${label}: volume must be 0 to ${MAX_VOLUME}`)
  if (!(decay >= 0)) throw new Error(`${label}: decay can't be ${decay}`)

  /** @type {(SongNote | null)[]} */
  const parsed = []
  /** The note a `--` would extend. */
  let held = null

  for (const word of notes.trim().split(/\s+/)) {
    if (word === REST) {
      held = null
      parsed.push(null)
    } else if (word === HOLD) {
      if (!held) throw new Error(`${label}, step ${parsed.length + 1}: ${HOLD} has no note to hold`)
      held.steps++
      parsed.push(null)
    } else {
      held = { ...notePitch(label, word, distortion), steps: 1 }
      parsed.push(held)
    }
  }
  return { distortion, volume, decay, notes: parsed }
}

/**
 * The divider and clock that come closest to a note. The 64 kHz clock is
 * preferred because the 15 kHz clock has too few settings to tune well.
 * @param {string} label  Used in error messages.
 * @param {string} note   Like 'A4' or 'G#3'.
 * @param {number} distortion
 * @returns {{audf: number, clock: number}}
 */
function notePitch(label, note, distortion) {
  const ticksPerSecond = noteFrequency(label, note) * ticksPerCycle(distortion)

  for (const clock of [CLOCK_64K, CLOCK_15K]) {
    const audf = Math.round(clock / ticksPerSecond) - 1
    if (audf >= 0 && audf <= MAX_AUDF) return { audf, clock }
  }
  throw new Error(`${label}: ${note} is out of range for distortion ${distortion}`)
}

/**
 * @param {string} label  Used in error messages.
 * @param {string} note
 * @returns {number}  In Hz.
 */
function noteFrequency(label, note) {
  const match = note.match(NOTE)
  if (!match) throw new Error(`${label}: couldn't read "${note}"`)

  const [, letter, sharp, octave] = match
  const semitone = SEMITONES[letter] + (sharp ? 1 : 0)
  const noteNumber = (Number(octave) + 1) * SEMITONES_PER_OCTAVE + semitone
  return A4_FREQUENCY * 2 ** ((noteNumber - A4_NUMBER) / SEMITONES_PER_OCTAVE)
}
