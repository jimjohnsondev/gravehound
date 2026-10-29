import { CHARACTER_COLORS as C } from '../engine/palette.js'
import { paintPortraits } from './portraits.js'

/**
 * Everyone who can speak in a .talk file, by the id written in capitals
 * (`WREN: ...`), with the expressions their portraits have.
 *
 * Every speaker needs 'neutral', which is how they start each scene.
 * Add expressions here before using them in dialog.
 */

/**
 * @typedef {object} CastMember
 * @property {string} name  Shown in the name tab. '{hero}' is the player's chosen name.
 * @property {string[]} expressions
 * @property {import('./portraits.js').PortraitLook} look  For the placeholder portraits.
 */

/** @type {Record<string, CastMember>} */
export const CAST = {
  HERO: {
    name: '{hero}',
    expressions: ['neutral', 'happy', 'worried', 'sad'],
    look: { skin: C.skin, hair: C.hair, clothes: C.tunic, old: false },
  },
  WREN: {
    name: 'Grandmother',
    expressions: ['neutral', 'happy', 'worried', 'sad', 'afraid'],
    look: { skin: C.skin, hair: C.greyHair, clothes: C.shawl, old: true },
  },
}

/**
 * The cast with their portraits painted, ready for the dialog box.
 * @returns {Record<string, import('../engine/dialog-box.js').Speaker>}
 */
export function createSpeakers() {
  return Object.fromEntries(
    Object.entries(CAST).map(([id, member]) => [
      id,
      {
        name: member.name,
        expressions: member.expressions,
        portraits: paintPortraits(member.look, member.expressions),
      },
    ]),
  )
}
