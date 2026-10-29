/**
 * The colour palette and how lighting works.
 *
 * Background art is painted in "ramps": a short list of shades of one colour
 * from brightest (step 0) to darkest. Background art never uses a raw colour;
 * it says "grass ramp, step 1".
 *
 * Lighting then just shifts every background step darker. At light level 2,
 * "grass step 1" is drawn as "grass step 3". Characters are drawn with their
 * own fixed colours and are never shifted, so they always glow against the
 * scenery. That is the whole lighting system, by design.
 */

/** Darkest light level. 0 = full light, 4 = nearly black. */
export const MAX_LIGHT_LEVEL = 4

/**
 * Background ramps, brightest first. Every ramp ends in near-black so that
 * deep darkness converges on the same night colours.
 * @type {Record<string, string[]>}
 */
export const RAMPS = {
  grass: ['#6f9a4a', '#4f7a3a', '#365a32', '#22402b', '#152a22', '#0d1a18', '#0b0a12'],
  leaf: ['#3f6b3a', '#2c5233', '#1e3c2c', '#142a24', '#0e1c1b', '#0b1214', '#0b0a12'],
  earth: ['#a88458', '#86663f', '#664b30', '#4a3626', '#30241d', '#1c1616', '#0b0a12'],
  wood: ['#9a6a3e', '#7a4f2e', '#5a3a24', '#3e281c', '#2a1c17', '#191113', '#0b0a12'],
  stone: ['#8d86a6', '#6c6688', '#4f4a68', '#37344d', '#252335', '#16151f', '#0b0a12'],
  water: ['#5a8ab0', '#3e6a92', '#2b4d72', '#1f3654', '#16243a', '#0f1626', '#0b0a12'],
  ember: ['#ffd27a', '#f29a3a', '#c4602a', '#8a3a22', '#55241c', '#2c1416', '#0b0a12'],
  cloth: ['#a04050', '#7e2f40', '#5c2333', '#3e1a27', '#27131c', '#170d13', '#0b0a12'],
}

/** Name of a ramp in RAMPS. @typedef {keyof typeof RAMPS} RampName */

/**
 * Look up a background colour with lighting applied.
 * @param {string} ramp       Name of the ramp, e.g. 'grass'.
 * @param {number} step       Shade in the ramp (0 = brightest).
 * @param {number} lightLevel 0 (bright) to MAX_LIGHT_LEVEL (dark).
 */
export function backgroundColor(ramp, step, lightLevel) {
  const shades = RAMPS[ramp]
  if (!shades) throw new Error(`Unknown colour ramp "${ramp}"`)
  return shades[Math.min(step + lightLevel, shades.length - 1)]
}

/**
 * Fixed colours for characters and effects. Never darkened by lighting.
 */
export const CHARACTER_COLORS = {
  outline: '#0b0a12',
  skin: '#f2c9a0',
  hair: '#6a3a1e',
  tunic: '#d8483a',
  trousers: '#3b4a8a',
  boots: '#4a2e1e',
  dogFur: '#3a3550',
  dogLight: '#6a6290',
  dogEye: '#9be36b',
  wisp: '#c8f0ff',
  greyHair: '#cfc8d8',
  shawl: '#4a5a9a',
  eyeWhite: '#f4f0e8',
}

/**
 * Fixed colours for text and the panels behind it (banners, dialog, menus).
 * Like character colours, these are never darkened by lighting, so text stays
 * readable in the darkest places.
 */
export const UI_COLORS = {
  text: '#f2e8d0',
  /** Menu choices that aren't selected. */
  textDim: '#8d86a6',
  panel: '#0b0a12',
  panelBorder: '#6c6688',
}
