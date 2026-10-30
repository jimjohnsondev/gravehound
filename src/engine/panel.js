/**
 * The game's standard panel: a dark box with a thin border. Banners, the
 * dialog box and menus all sit on one, so they look like they belong together.
 */
import { UI_COLORS } from './palette.js'

/** Thickness of a panel's border in pixels. */
export const PANEL_BORDER = 1

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
  ctx.fillRect(
    x + PANEL_BORDER,
    y + PANEL_BORDER,
    width - PANEL_BORDER * 2,
    height - PANEL_BORDER * 2,
  )
}
