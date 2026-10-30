/**
 * Plays a song on the sound chip, looping for ever.
 *
 * Game updates aren't exact enough to start notes on the beat, so each update
 * schedules the notes due in the next moment, and the audio system plays them
 * at exactly the right time.
 */
import { UPDATES_PER_SECOND } from './config.js'

/** How far ahead notes are scheduled, in seconds. Longer than a slow frame. */
const SCHEDULE_AHEAD = 0.15

/** Gap before a new song's first note, in seconds, so it isn't scheduled late. */
const START_DELAY = 0.05

/** Share of a note's length that sounds. The gap keeps repeated notes separate. */
const NOTE_LENGTH = 0.9

/** Volume steps are timed in game updates, like a real program driving the chip. */
const SECONDS_PER_UPDATE = 1 / UPDATES_PER_SECOND

/** A note never fades below this volume until it's cut off. */
const QUIETEST_VOLUME = 1

/** Keeps one song going. Call `update` regularly. */
export class MusicPlayer {
  /**
   * @param {import('./pokey.js').Pokey} pokey
   */
  constructor(pokey) {
    this.pokey = pokey
    /** @type {import('./song.js').Song | null} */
    this.song = null
    this.step = 0
    /** When the next step starts, in audio context seconds. */
    this.nextStepTime = 0
  }

  /**
   * Start a song from the top, replacing whatever is playing.
   * @param {import('./song.js').Song} song
   * @param {number} now  In audio context seconds.
   */
  play(song, now) {
    this.stop(now)
    this.song = song
    this.step = 0
    this.nextStepTime = now + START_DELAY
  }

  /** @param {number} now  In audio context seconds. */
  stop(now) {
    if (!this.song) return
    for (let channel = 0; channel < this.song.channels.length; channel++) {
      this.pokey.channels[channel].clear(now)
    }
    this.song = null
  }

  /**
   * Schedule any notes that are nearly due.
   * @param {number} now  In audio context seconds.
   */
  update(now) {
    if (!this.song) return

    // If updates stopped for a while, carry on from here rather than racing
    // through every note that was missed.
    if (this.nextStepTime < now) this.nextStepTime = now

    while (this.nextStepTime < now + SCHEDULE_AHEAD) {
      this.#playStep(this.nextStepTime)
      this.nextStepTime += this.song.stepSeconds
      this.step = (this.step + 1) % this.song.stepCount
    }
  }

  /** @param {number} time */
  #playStep(time) {
    this.song.channels.forEach((channel, index) => {
      const note = channel.notes[this.step]
      if (note) this.#playNote(this.pokey.channels[index], channel, note, time)
    })
  }

  /**
   * @param {import('./pokey.js').Pokey['channels'][number]} pokeyChannel
   * @param {import('./song.js').SongChannel} channel
   * @param {import('./song.js').SongNote} note
   * @param {number} time
   */
  #playNote(pokeyChannel, { distortion, volume, decay }, { audf, clock, steps }, time) {
    const end = time + steps * this.song.stepSeconds * NOTE_LENGTH
    pokeyChannel.write(time, { audf, clock, distortion, volume })
    if (decay > 0) scheduleFade(pokeyChannel, volume, decay, time, end)
    pokeyChannel.setVolume(end, 0)
  }
}

/**
 * Step a note's volume down from when it starts until it ends.
 * @param {import('./pokey.js').Pokey['channels'][number]} pokeyChannel
 * @param {number} volume  What the note started at.
 * @param {number} decay   Update steps for each drop of 1 in volume.
 * @param {number} start
 * @param {number} end
 */
function scheduleFade(pokeyChannel, volume, decay, start, end) {
  const secondsPerDrop = decay * SECONDS_PER_UPDATE
  let fadeTime = start + secondsPerDrop
  for (let level = volume - 1; level >= QUIETEST_VOLUME && fadeTime < end; level--) {
    pokeyChannel.setVolume(fadeTime, level)
    fadeTime += secondsPerDrop
  }
}
