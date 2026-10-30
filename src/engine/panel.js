/**
 * The game's standard panel: a dark box with a thin border. Banners, the
 * dialog box and menus all sit on one, so they look like they belong together.
 * Also the sizes of the text inside a panel, and the cursor beside a choice.
 */
import { GLYPH_HEIGHT } from './font-glyphs.js'
import { UI_COLORS } from './palette.js'

/** Gap between a panel and the edge of the screen. */
export const PANEL_MARGIN = 2

/** Thickness of a panel's border in pixels. */
export const PANEL_BORDER = 1

/** Distance from the outside of a panel to its text. */
export const PANEL_TEXT_INSET = PANEL_BORDER + 4

/** Distance from the top of one line of text to the top of the next. */
export const LINE_HEIGHT = GLYPH_HEIGHT + 2

/** Room on the left of a choice for the cursor. */
export const CURSOR_SPACE = 6

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

/**
 * Height of a panel holding `lineCount` lines of text, border included.
 * @param {number} lineCount
 */
export function panelHeight(lineCount) {
  const textHeight = (lineCount - 1) * LINE_HEIGHT + GLYPH_HEIGHT
  return textHeight + PANEL_TEXT_INSET * 2
}

/**
 * A small right-pointing triangle beside the selected choice.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} textY  Top of the choice's text.
 */
export function drawCursor(ctx, x, textY) {
  ctx.fillStyle = UI_COLORS.text
  ctx.fillRect(x, textY + 1, 1, 5)
  ctx.fillRect(x + 1, textY + 2, 1, 3)
  ctx.fillRect(x + 2, textY + 3, 1, 1)
}
