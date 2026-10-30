/**
 * Every song in the game, ready to play.
 */
import { parseSong } from '../../engine/song.js'
import { SONG_CHANNEL_COUNT } from '../../engine/sound.js'
import { dusk } from './dusk.js'
import { hearth } from './hearth.js'

/** Every song as written, by the name maps use. Add new songs here. */
const SONGS = {
  dusk,
  hearth,
}

/**
 * Read all the songs. Throws if one can't be played, so a typo shows up as soon
 * as the game starts.
 * @returns {Record<string, import('../../engine/song.js').Song>}
 */
export function loadSongs() {
  /** @type {Record<string, import('../../engine/song.js').Song>} */
  const songs = {}
  for (const [name, source] of Object.entries(SONGS)) {
    songs[name] = parseSong(name, source, SONG_CHANNEL_COUNT)
  }
  return songs
}
