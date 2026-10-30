/**
 * Every sound effect in the game, by name. Each row is one game update (1/60
 * of a second) of [divider, distortion, volume]: a lower divider is a higher
 * note, distortion 10 is a pure tone and 8 is a hiss (see engine/pokey.js).
 *
 * The dialog box uses 'talk', 'cursor' and 'confirm'.
 *
 * @type {Record<string, import('../engine/sound.js').SoundEffect>}
 */
export const SOUND_EFFECTS = {
  /** Moving a menu cursor. */
  cursor: [[60, 10, 7], [60, 10, 5], [60, 10, 2]],

  /** Choosing something. */
  confirm: [[80, 10, 8], [80, 10, 8], [50, 10, 8], [50, 10, 6], [50, 10, 3]],

  /** Going back out of a menu. */
  back: [[50, 10, 7], [50, 10, 6], [80, 10, 5], [80, 10, 2]],

  /** Moving dialog on to the next line. */
  talk: [[90, 10, 5], [90, 10, 3]],

  /** Opening a chest: a little rising fanfare. */
  chest: [
    [95, 10, 9], [95, 10, 9], [95, 10, 7], [95, 10, 7],
    [75, 10, 9], [75, 10, 9], [75, 10, 7], [75, 10, 7],
    [63, 10, 9], [63, 10, 9], [63, 10, 7], [63, 10, 7],
    [47, 10, 10], [47, 10, 10], [47, 10, 9], [47, 10, 9],
    [47, 10, 7], [47, 10, 6], [47, 10, 4], [47, 10, 2],
  ],

  /** Going through a door or leaving a map: a soft scuff of noise. */
  door: [[30, 8, 7], [40, 8, 7], [50, 8, 6], [60, 8, 5], [70, 8, 4], [80, 8, 3], [90, 8, 2]],
}
