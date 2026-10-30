/**
 * PLACEHOLDER character art, drawn with code. Replace with imported sprite
 * sheets that use the same layout (rows = facing, columns = frames).
 *
 * Characters use fixed bright colours so they stand out from the darkened
 * scenery.
 */
import { paintSpriteSheet } from '../engine/sprite.js'
import { CHARACTER_COLORS as C } from '../engine/palette.js'

/** Width and height of one frame of Ash. */
const ASH_SIZE = 16

/** The hero: 12x16, 2 frames (standing, stepping). */
export function createHeroSprites() {
  return paintSpriteSheet({
    frameWidth: 12,
    frameHeight: 16,
    frameCount: 2,
    paint(draw, facing, frame) {
      const stepping = frame === 1

      // Head
      draw.rect(3, 0, 6, 3, C.hair)
      if (facing === 'up') {
        draw.rect(3, 3, 6, 4, C.hair)
      } else {
        draw.rect(3, 3, 6, 4, C.skin)
        if (facing === 'down') {
          draw.rect(4, 4, 1, 1, C.outline)
          draw.rect(7, 4, 1, 1, C.outline)
        } else {
          const back = facing === 'left' ? 7 : 3
          draw.rect(back, 3, 2, 3, C.hair)
          draw.rect(facing === 'left' ? 4 : 7, 4, 1, 1, C.outline)
        }
      }

      // Body and arms
      draw.rect(2, 7, 8, 5, C.tunic)
      draw.rect(1, 8, 1, 3, C.skin)
      draw.rect(10, 8, 1, 3, C.skin)
      draw.rect(3, 12, 6, 2, C.trousers)

      // Legs: one lifts when stepping
      draw.rect(3, stepping ? 13 : 14, 2, 2, C.boots)
      draw.rect(7, 14, 2, 2, C.boots)
    },
  })
}

/** Ash, the black dog: 16x16, 2 frames. Pale edges keep him visible at night. */
export function createAshSprites() {
  return paintSpriteSheet({
    frameWidth: ASH_SIZE,
    frameHeight: ASH_SIZE,
    frameCount: 2,
    paint(draw, facing, frame) {
      const stepping = frame === 1

      if (facing === 'left' || facing === 'right') {
        const rect = sidewaysRect(draw, facing)
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
      draw.rect(4, 8, 8, 5, C.dogFur) // body
      draw.rect(4, 8, 8, 1, C.dogLight)
      draw.rect(4, 13, 1, stepping ? 2 : 3, C.dogFur) // legs
      draw.rect(11, 13, 1, stepping ? 3 : 2, C.dogFur)
      if (facing === 'down') {
        draw.rect(5, 4, 6, 5, C.dogFur) // head in front
        draw.rect(5, 4, 6, 1, C.dogLight)
        draw.rect(5, 3, 1, 1, C.dogFur) // ears
        draw.rect(10, 3, 1, 1, C.dogFur)
        draw.rect(6, 6, 1, 1, C.dogEye)
        draw.rect(9, 6, 1, 1, C.dogEye)
      } else {
        draw.rect(5, 5, 6, 4, C.dogFur) // back of head
        draw.rect(5, 5, 6, 1, C.dogLight)
        draw.rect(7, 12, 2, 3, C.dogFur) // tail
      }
    },
  })
}

/**
 * Ash's side-on frames are drawn facing right. This gives a rectangle painter
 * that flips them when he faces left.
 * @param {{rect: (x: number, y: number, w: number, h: number, color: string) => void}} draw
 * @param {'left' | 'right'} facing
 * @returns {(x: number, y: number, w: number, h: number, color: string) => void}
 */
function sidewaysRect(draw, facing) {
  return (x, y, w, h, color) => {
    const left = facing === 'right' ? x : ASH_SIZE - x - w
    draw.rect(left, y, w, h, color)
  }
}
