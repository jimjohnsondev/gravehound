import { paintSpriteSheet } from '../engine/sprite.js'
import { CHARACTER_COLORS as C } from '../engine/palette.js'

/**
 * PLACEHOLDER character art, drawn with code. Replace with imported sprite
 * sheets that use the same layout (rows = facing, columns = frames).
 *
 * Characters use fixed bright colours so they stand out from the darkened
 * scenery.
 */

/** The hero: 12x16, 2 frames (standing, stepping). */
export function createHeroSprites() {
  return paintSpriteSheet({
    frameWidth: 12,
    frameHeight: 16,
    frameCount: 2,
    paint(d, facing, frame) {
      const stepping = frame === 1

      // Head
      d.rect(3, 0, 6, 3, C.hair)
      if (facing === 'up') {
        d.rect(3, 3, 6, 4, C.hair)
      } else {
        d.rect(3, 3, 6, 4, C.skin)
        if (facing === 'down') {
          d.rect(4, 4, 1, 1, C.outline)
          d.rect(7, 4, 1, 1, C.outline)
        } else {
          const back = facing === 'left' ? 7 : 3
          d.rect(back, 3, 2, 3, C.hair)
          d.rect(facing === 'left' ? 4 : 7, 4, 1, 1, C.outline)
        }
      }

      // Body and arms
      d.rect(2, 7, 8, 5, C.tunic)
      d.rect(1, 8, 1, 3, C.skin)
      d.rect(10, 8, 1, 3, C.skin)
      d.rect(3, 12, 6, 2, C.trousers)

      // Legs: one lifts when stepping
      d.rect(3, stepping ? 13 : 14, 2, 2, C.boots)
      d.rect(7, 14, 2, 2, C.boots)
    },
  })
}

/** Ash, the black dog: 16x16, 2 frames. Pale edges keep him visible at night. */
export function createAshSprites() {
  return paintSpriteSheet({
    frameWidth: 16,
    frameHeight: 16,
    frameCount: 2,
    paint(d, facing, frame) {
      const stepping = frame === 1

      if (facing === 'left' || facing === 'right') {
        // Draw facing right; mirror x when facing left.
        const mx = (/** @type {number} */ x, /** @type {number} */ w) =>
          facing === 'right' ? x : 16 - x - w
        const rect = (/** @type {number} */ x, /** @type {number} */ y,
          /** @type {number} */ w, /** @type {number} */ h, /** @type {string} */ c) =>
          d.rect(mx(x, w), y, w, h, c)

        rect(0, 7, 2, 2, C.dogFur) // tail
        rect(2, 8, 10, 4, C.dogFur) // body
        rect(2, 8, 10, 1, C.dogLight)
        rect(10, 5, 5, 4, C.dogFur) // head
        rect(10, 5, 5, 1, C.dogLight)
        rect(11, 4, 1, 1, C.dogFur) // ear
        rect(13, 6, 1, 1, C.dogEye)
        rect(3, 12, 1, stepping ? 2 : 3, C.dogFur) // legs
        rect(10, 12, 1, stepping ? 3 : 2, C.dogFur)
        return
      }

      // Facing the camera (down) or away (up)
      d.rect(4, 8, 8, 5, C.dogFur) // body
      d.rect(4, 8, 8, 1, C.dogLight)
      d.rect(4, 13, 1, stepping ? 2 : 3, C.dogFur) // legs
      d.rect(11, 13, 1, stepping ? 3 : 2, C.dogFur)
      if (facing === 'down') {
        d.rect(5, 4, 6, 5, C.dogFur) // head in front
        d.rect(5, 4, 6, 1, C.dogLight)
        d.rect(5, 3, 1, 1, C.dogFur) // ears
        d.rect(10, 3, 1, 1, C.dogFur)
        d.rect(6, 6, 1, 1, C.dogEye)
        d.rect(9, 6, 1, 1, C.dogEye)
      } else {
        d.rect(5, 5, 6, 4, C.dogFur) // back of head
        d.rect(5, 5, 6, 1, C.dogLight)
        d.rect(7, 12, 2, 3, C.dogFur) // tail
      }
    },
  })
}
