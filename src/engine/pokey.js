/**
 * A sound chip modelled on the Atari POKEY, built from Web Audio nodes.
 *
 * On the real chip, a clock is divided down to make "ticks". Each tick reads a
 * 1-bit value: a plain on-off flip for a pure tone, or a polynomial counter for
 * the buzzes and hisses that give the chip its sound. Here each distortion is
 * worked out once into a looping buffer, and the divider becomes the buffer's
 * playback speed. That keeps the chip's slightly out-of-tune notes, and works
 * on plain http pages, where the browser refuses AudioWorklet (such as a phone
 * testing `npm run dev`).
 *
 * One real difference from the chip: its counters run all the time at 1.79 MHz
 * and each tick only samples them, so what a channel hears shifts with the
 * divider, and some buzzy notes come out far from the expected pitch. Here the
 * counters step once per tick, so every note in a distortion uses the same
 * pattern. Notes stay in tune, but lose some of the real chip's unevenness.
 *
 * Game code talks to it the way a real program talks to the chip: by writing
 * registers. Writes are scheduled at a time, so they land exactly on the beat.
 */

/** The chip's two usual clocks: an NTSC Atari's 1.79 MHz divided by 28 and by 114. */
export const CLOCK_64K = 63921
export const CLOCK_15K = 15700

/** Highest value of the divider register, AUDF. */
export const MAX_AUDF = 255

/** Highest channel volume. */
export const MAX_VOLUME = 15

/** How many channels the chip has. */
export const CHANNEL_COUNT = 4

/** Each channel gets this share of full level, so all four together can't clip. */
const CHANNEL_LEVEL = 1 / CHANNEL_COUNT

/**
 * @typedef {object} Distortion
 * What one distortion setting does on each tick.
 * @property {boolean} fiveBitGate  Only act on ticks where the 5-bit counter is on.
 * @property {'flip' | 'fourBit' | 'seventeenBit'} source  Where the output comes from.
 * @property {number} patternTicks  Ticks until the pattern repeats. Distortion 0
 *   really repeats much later, but is cut here to a size that sounds the same.
 * @property {number} samplesPerTick  Buffer samples per tick. Web Audio blends
 *   between samples, so tones need many to keep their hard edges. The 17-bit
 *   patterns use few to save memory, which softens slow noise a little.
 * @property {number} ticksPerCycle  Ticks in one cycle of the note you hear.
 */

/**
 * The chip's distortion settings, by the number written to its control register.
 * The chip's settings 6 and 14 are left out because they repeat 2 and 10.
 * @type {Record<number, Distortion>}
 */
const DISTORTIONS = {
  0: { fiveBitGate: true, source: 'seventeenBit', patternTicks: 131071, samplesPerTick: 2, ticksPerCycle: 2 },
  2: { fiveBitGate: true, source: 'flip', patternTicks: 31, samplesPerTick: 16, ticksPerCycle: 31 },
  4: { fiveBitGate: true, source: 'fourBit', patternTicks: 465, samplesPerTick: 8, ticksPerCycle: 15 },
  8: { fiveBitGate: false, source: 'seventeenBit', patternTicks: 131071, samplesPerTick: 2, ticksPerCycle: 2 },
  10: { fiveBitGate: false, source: 'flip', patternTicks: 2, samplesPerTick: 32, ticksPerCycle: 2 },
  12: { fiveBitGate: false, source: 'fourBit', patternTicks: 15, samplesPerTick: 16, ticksPerCycle: 15 },
}

/**
 * @typedef {object} Registers
 * What's written to a channel to make it play.
 * @property {number} audf        The divider, 0 to MAX_AUDF. Higher is lower in pitch.
 * @property {number} clock       CLOCK_64K or CLOCK_15K.
 * @property {number} distortion  A key of DISTORTIONS.
 * @property {number} volume      0 to 15.
 */

/**
 * How many clock ticks make one cycle of a distortion's note. Songs use this
 * to work out the divider for a note.
 * @param {number} distortion
 */
export function ticksPerCycle(distortion) {
  return distortionFor(distortion).ticksPerCycle
}

/**
 * Is this a setting the chip has? Songs check this when they load.
 * @param {number} distortion
 */
export function isDistortion(distortion) {
  return distortion in DISTORTIONS
}

/** @param {number} distortion */
function distortionFor(distortion) {
  const found = DISTORTIONS[distortion]
  if (!found) throw new Error(`The sound chip has no distortion ${distortion}`)
  return found
}

/**
 * A polynomial counter: a shift register fed from two of its own bits, giving
 * a long but repeating series of bits that sounds random.
 * @param {number} length  Bits in the register.
 * @param {number} tap     The other term of the polynomial, x^length + x^tap + 1.
 * @returns {() => number}  Gives the next bit, 0 or 1.
 */
export function polynomialCounter(length, tap) {
  let state = (1 << length) - 1
  return function nextBit() {
    const bit = state & 1
    const feedback = (state ^ (state >> (length - tap))) & 1
    state = (state >> 1) | (feedback << (length - 1))
    return bit
  }
}

/**
 * The 1-bit output of a distortion, one value per tick.
 * @param {Distortion} distortion
 * @returns {Uint8Array}
 */
function renderBits({ fiveBitGate, source, patternTicks }) {
  const fiveBit = polynomialCounter(5, 3)
  const fourBit = polynomialCounter(4, 3)
  const seventeenBit = polynomialCounter(17, 14)

  const bits = new Uint8Array(patternTicks)
  let output = 0
  for (let tick = 0; tick < patternTicks; tick++) {
    // Every counter runs on every tick, whether or not its bit gets used.
    const gateOpen = fiveBit() === 1 || !fiveBitGate
    const fourBitValue = fourBit()
    const seventeenBitValue = seventeenBit()

    if (gateOpen) {
      if (source === 'flip') output = 1 - output
      else if (source === 'fourBit') output = fourBitValue
      else output = seventeenBitValue
    }
    bits[tick] = output
  }
  return bits
}

/**
 * Turn a distortion into a looping audio buffer.
 * @param {BaseAudioContext} context
 * @param {Distortion} distortion
 * @returns {AudioBuffer}
 */
function renderBuffer(context, distortion) {
  const { samplesPerTick } = distortion
  const bits = renderBits(distortion)
  const buffer = context.createBuffer(1, bits.length * samplesPerTick, context.sampleRate)
  const samples = buffer.getChannelData(0)
  bits.forEach((bit, tick) => {
    samples.fill(bit * 2 - 1, tick * samplesPerTick, (tick + 1) * samplesPerTick)
  })
  return buffer
}

/** One of the chip's channels. */
class PokeyChannel {
  /**
   * @param {BaseAudioContext} context
   * @param {AudioNode} output
   * @param {Map<number, AudioBuffer>} buffers  Patterns by distortion.
   */
  constructor(context, output, buffers) {
    this.context = context
    this.buffers = buffers
    this.level = context.createGain()
    this.level.gain.value = 0
    this.level.connect(output)
    /** The distortion being played, or null before the first write. */
    this.distortion = null
    /** @type {AudioBufferSourceNode | null} */
    this.source = null
    /**
     * Every source that hasn't finished, including any still waiting to start.
     * @type {Set<AudioBufferSourceNode>}
     */
    this.sources = new Set()
  }

  /**
   * Set the channel playing from a given time.
   * @param {number} time  In audio context seconds.
   * @param {Registers} registers
   */
  write(time, { audf, clock, distortion, volume }) {
    const { samplesPerTick } = distortionFor(distortion)
    const speed = ((clock / (audf + 1)) * samplesPerTick) / this.context.sampleRate

    // Only a change of pattern needs a new source. Keeping the same one means
    // a pitch change carries on from the same point in the wave, without a click.
    if (distortion !== this.distortion) this.#startSource(time, distortion)
    this.source.playbackRate.setValueAtTime(speed, time)
    this.setVolume(time, volume)
  }

  /**
   * @param {number} time
   * @param {number} volume  0 to 15.
   */
  setVolume(time, volume) {
    this.level.gain.setValueAtTime((volume / MAX_VOLUME) * CHANNEL_LEVEL, time)
  }

  /**
   * Silence the channel at once, and drop anything scheduled.
   * @param {number} time  Now, in audio context seconds.
   */
  clear(time) {
    this.level.gain.cancelScheduledValues(time)
    this.level.gain.setValueAtTime(0, time)
    for (const source of this.sources) source.stop(time)
    this.source = null
    this.distortion = null
  }

  /**
   * @param {number} time
   * @param {number} distortion
   */
  #startSource(time, distortion) {
    this.source?.stop(time)

    const source = this.context.createBufferSource()
    source.buffer = this.buffers.get(distortion)
    source.loop = true
    source.connect(this.level)
    source.start(time)
    source.addEventListener('ended', () => this.sources.delete(source))

    this.sources.add(source)
    this.source = source
    this.distortion = distortion
  }
}

/** The whole chip. Channels are numbered from 0 up to CHANNEL_COUNT - 1. */
export class Pokey {
  /**
   * @param {BaseAudioContext} context
   * @param {AudioNode} output  Where the sound goes.
   */
  constructor(context, output) {
    /** @type {Map<number, AudioBuffer>} */
    const buffers = new Map()
    for (const [distortion, details] of Object.entries(DISTORTIONS)) {
      buffers.set(Number(distortion), renderBuffer(context, details))
    }

    /** @type {PokeyChannel[]} */
    this.channels = []
    for (let index = 0; index < CHANNEL_COUNT; index++) {
      this.channels.push(new PokeyChannel(context, output, buffers))
    }
  }
}
