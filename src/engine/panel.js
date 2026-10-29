import { UI_COLORS } from './palette.js'

/**
 * The game's standard panel: a dark box with a 1-pixel border. Banners, the
 * dialog box and menus all sit on one, so they look like they belong together.
 */

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x       Left edge, including the border.
 * @param {number} y       Top edge, including the border.
 * @param {number} width   Including the border.
 * @param {number} height  Including the border.
 */
export function drawPanel(ctx, x, y, width, height) {
  ctx.fillStyle = UI_COLORS.panelBorder
  ctx.fillRect(x, y, width, height)
  ctx.fillStyle = UI_COLORS.panel
  ctx.fillRect(x + 1, y + 1, width - 2, height - 2)
}
