/**
 * Sprite sheets: one image holding every frame of a character.
 *
 * Layout used by every character sheet:
 *   rows    = facing direction, in the order of FACINGS below
 *   columns = animation frames (column 0 is standing still)
 */

/** @typedef {'down' | 'up' | 'left' | 'right'} Facing */

/** Row order in a character sprite sheet. @type {Facing[]} */
export const FACINGS = ['down', 'up', 'left', 'right']

export class SpriteSheet {
  /**
   * @param {CanvasImageSource} image
   * @param {number} frameWidth
   * @param {number} frameHeight
   */
  constructor(image, frameWidth, frameHeight) {
    this.image = image
    this.frameWidth = frameWidth
    this.frameHeight = frameHeight
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {Facing} facing
   * @param {number} frame  Column in the sheet.
   * @param {number} x      Screen x of the frame's top-left corner.
   * @param {number} y      Screen y of the frame's top-left corner.
   */
  draw(ctx, facing, frame, x, y) {
    const row = FACINGS.indexOf(facing)
    ctx.drawImage(
      this.image,
      frame * this.frameWidth,
      row * this.frameHeight,
      this.frameWidth,
      this.frameHeight,
      Math.round(x),
      Math.round(y),
      this.frameWidth,
      this.frameHeight,
    )
  }
}

/**
 * Build a sprite sheet by drawing each frame with code. Used for placeholder
 * characters until real art arrives through the import pipeline.
 *
 * @param {object} options
 * @param {number} options.frameWidth
 * @param {number} options.frameHeight
 * @param {number} options.frameCount  Frames per facing.
 * @param {(draw: {rect: (x: number, y: number, w: number, h: number, color: string) => void},
 *          facing: Facing, frame: number) => void} options.paint
 */
export function paintSpriteSheet({ frameWidth, frameHeight, frameCount, paint }) {
  const canvas = document.createElement('canvas')
  canvas.width = frameWidth * frameCount
  canvas.height = frameHeight * FACINGS.length
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'))

  FACINGS.forEach((facing, row) => {
    for (let frame = 0; frame < frameCount; frame++) {
      const offsetX = frame * frameWidth
      const offsetY = row * frameHeight
      paint(
        {
          rect(x, y, w, h, color) {
            ctx.fillStyle = color
            ctx.fillRect(offsetX + x, offsetY + y, w, h)
          },
        },
        facing,
        frame,
      )
    }
  })

  return new SpriteSheet(canvas, frameWidth, frameHeight)
}
