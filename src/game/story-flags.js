/**
 * Every name the story keeps track of, each with a note on what sets it.
 *
 * .talk files may only use names listed here; the game checks this when it
 * loads, so a misspelt flag is an error instead of a line that never plays.
 * Add a name here first, then use it in dialog or game code.
 */

/** Things that are either true or not. Unset flags are off. */
export const FLAGS = {
  died_on_errand: 'The hero died on the kindling errand (his first Underreach trip). Set by the game.',
  asked_about_father: 'At supper, asked Grandmother what his father was like.',
  asked_about_door: 'At supper, asked Grandmother if she was expecting someone.',
  pressed_wren: 'At supper, pressed Grandmother about why she is frightened (needs Heart 2).',
  supper_done: 'The birthday supper has played.',
  ledger_read: "Read Halloway's ledger at the Drowned Chapel (the midpoint). Set by the game.",
}

/** Numbers that dialog can change. Unset counters are 0. */
export const COUNTERS = {
  maren_affection: "Maren's hidden affection. Up for honesty, protecting Nib and standing up to Tobin.",
}

/** The hero's stats and their starting values. Dialog can read them but not change them. */
export const STATS = {
  might: 1,
  wits: 1,
  heart: 1,
}

/** Things [give ...] can hand to the hero. */
export const ITEMS = {
  fathers_knife: 'Given by Grandmother at supper. Unlocks the one-button attack.',
}
