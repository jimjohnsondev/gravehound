/**
 * All the game's sound: sets up the audio system, plays sound effects and keeps
 * the music going.
 *
 * Browsers won't make a sound until the player has touched the page, so nothing
 * starts until the first tap or key press. A song asked for before then starts
 * at that moment, and sound effects before then are simply skipped.
 */
import { UPDATES_PER_SECOND } from './config.js'
import { MusicPlayer } from './music-player.js'
import { CHANNEL_COUNT, CLOCK_64K, Pokey } from './pokey.js'

/** The channel kept for effects, so an effect never takes a note out of the tune. */
const EFFECT_CHANNEL = CHANNEL_COUNT - 1

/** How many channels songs can use. */
export const SONG_CHANNEL_COUNT = EFFECT_CHANNEL

/** Each step of an effect lasts one game update. */
const SECONDS_PER_EFFECT_STEP = 1 / UPDATES_PER_SECOND

/** Any of these counts as the player touching the page. Phones differ on which they accept. */
const UNLOCK_EVENTS = ['pointerdown', 'pointerup', 'touchend', 'keydown']

/**
 * @typedef {[audf: number, distortion: number, volume: number]} EffectStep
 * One game update of a sound effect, as values for the chip's 64 kHz clock.
 */

/** @typedef {EffectStep[]} SoundEffect */

/** Plays effects and music. Call `attachUnlock` once, and `update` every game update. */
export class Sound {
  /**
   * @param {object} options
   * @param {Record<string, SoundEffect>} options.effects
   * @param {Record<string, import('./song.js').Song>} options.songs
   */
  constructor({ effects, songs }) {
    this.effects = effects
    this.songs = songs
    this.muted = false
    /** @type {string | null} */
    this.wantedSong = null
    /** @type {string | null} */
    this.playingSong = null
    /** @type {AudioContext | null} */
    this.context = null
    /** @type {GainNode | null} */
    this.master = null
    /** @type {Pokey | null} */
    this.pokey = null
    /** @type {MusicPlayer | null} */
    this.music = null
  }

  /** Start listening for the player's first touch, and for the tab being hidden. */
  attachUnlock() {
    for (const eventName of UNLOCK_EVENTS) {
      // Capture, because the touch controls stop some events reaching the window.
      window.addEventListener(eventName, () => this.#unlock(), { capture: true })
    }
    document.addEventListener('visibilitychange', () => {
      if (!this.context) return
      if (document.hidden) this.context.suspend()
      else this.context.resume()
    })
  }

  /**
   * Later touches matter as well as the first: phones can suspend audio again
   * after a call or a trip to another app.
   */
  #unlock() {
    if (!window.AudioContext) return
    if (!this.context) this.#createAudio()
    if (this.context.state !== 'running') this.context.resume()
  }

  #createAudio() {
    this.context = new AudioContext()
    this.master = this.context.createGain()
    this.master.connect(this.context.destination)
    this.#applyMute()
    this.pokey = new Pokey(this.context, this.master)
    this.music = new MusicPlayer(this.pokey)
  }

  #applyMute() {
    if (this.master) this.master.gain.value = this.muted ? 0 : 1
  }

  /**
   * Turn all sound off or on. Music keeps its place while silent.
   * @param {boolean} muted
   */
  setMuted(muted) {
    this.muted = muted
    this.#applyMute()
  }

  /**
   * Play a sound effect, cutting off any effect still sounding.
   * @param {string} name
   */
  play(name) {
    const effect = this.effects[name]
    if (!effect) throw new Error(`No sound effect called "${name}"`)
    if (!this.pokey) return

    const now = this.context.currentTime
    const channel = this.pokey.channels[EFFECT_CHANNEL]
    channel.clear(now)
    effect.forEach(([audf, distortion, volume], index) => {
      channel.write(now + index * SECONDS_PER_EFFECT_STEP, { audf, clock: CLOCK_64K, distortion, volume })
    })
    channel.setVolume(now + effect.length * SECONDS_PER_EFFECT_STEP, 0)
  }

  /**
   * Play a song, unless it's already playing, so walking between two maps with
   * the same song doesn't restart it.
   * @param {string} name
   */
  playSong(name) {
    if (!this.songs[name]) throw new Error(`No song called "${name}"`)
    this.wantedSong = name
  }

  /** Call every game update. */
  update() {
    if (!this.music) return

    const now = this.context.currentTime
    if (this.wantedSong !== this.playingSong) {
      this.music.play(this.songs[this.wantedSong], now)
      this.playingSong = this.wantedSong
    }
    this.music.update(now)
  }
}
