/**
 * The dialog box: a text box along the bottom of the screen, with a large
 * portrait of whoever is speaking standing on it, over an environmental
 * background. Narration and menus have no portrait.
 */
import { PORTRAIT_HEIGHT, PORTRAIT_WIDTH, SCREEN_HEIGHT, SCREEN_WIDTH } from './config.js'
import { GLYPH_HEIGHT } from './font-glyphs.js'
import { moveCursor } from './input.js'
import { UI_COLORS } from './palette.js'
import {
  CURSOR_SPACE,
  LINE_HEIGHT,
  PANEL_BORDER,
  PANEL_MARGIN,
  PANEL_TEXT_INSET,
  drawCursor,
  drawPanel,
  panelHeight,
} from './panel.js'
import { drawText, measureText, wrapText } from './text.js'

/** Space above and below the name in the speaker's name tab. */
const NAME_PADDING_Y = 2

/** Lines shown at once. A longer line carries on over more pages. */
const LINES_PER_PAGE = 3

/** Width of the "press A" arrow. */
const ARROW_WIDTH = 5

/** Height of the "press A" arrow. */
const ARROW_HEIGHT = 3

/** Room kept clear of text on the right, so the arrow never covers a word. */
const ARROW_SPACE = ARROW_WIDTH + 2

/** Update steps for each half of the "press A" arrow's blink. */
const BLINK_DURATION = 20

/**
 * @typedef {object} Speaker
 * @property {string} name  Shown above their lines. May use {values}, e.g. '{hero}'.
 * @property {string[]} expressions
 * @property {CanvasImageSource} portraits  One PORTRAIT_WIDTH x PORTRAIT_HEIGHT
 *   picture per expression, side by side in the order of `expressions`.
 */

/**
 * @typedef {object} Box
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 */

/**
 * The box that lines of dialog appear in.
 * @type {Box}
 */
const TEXT_BOX = {
  x: PANEL_MARGIN,
  y: SCREEN_HEIGHT - PANEL_MARGIN - panelHeight(LINES_PER_PAGE),
  width: SCREEN_WIDTH - PANEL_MARGIN * 2,
  height: panelHeight(LINES_PER_PAGE),
}

/** Shows a Conversation. A turns the page; up, down and A pick a choice. */
export class DialogBox {
  /**
   * @param {object} options
   * @param {Record<string, Speaker>} options.speakers  By speaker id, e.g. 'WREN'.
   * @param {Record<string, CanvasImageSource>} options.backgrounds  Full-screen pictures.
   * @param {import('./sound.js').Sound} options.sound  Needs effects called
   *   'talk', 'cursor' and 'confirm'.
   */
  constructor({ speakers, backgrounds, sound }) {
    this.speakers = speakers
    this.sound = sound
    this.backgrounds = backgrounds
    /** @type {import('./talk-runner.js').Conversation | null} */
    this.conversation = null
    /** @type {import('./talk-runner.js').ShownLine | import('./talk-runner.js').ShownMenu | null} */
    this.shown = null
    /**
     * Who is saying the current line. Null for narration.
     * @type {Speaker | null}
     */
    this.speaker = null
    /** The speaker's name as shown, with {values} filled in. */
    this.speakerName = ''
    /**
     * The current line, split into pages of LINES_PER_PAGE lines.
     * @type {string[][]}
     */
    this.pages = []
    this.page = 0
    /** Which choice the cursor is on. */
    this.selected = 0
    /** @type {string | null} */
    this.background = null
    /** Update steps since the current line or menu appeared. */
    this.timer = 0
  }

  /** True while a conversation is on screen. */
  get active() {
    return this.conversation !== null
  }

  /** @param {import('./talk-runner.js').Conversation} conversation */
  start(conversation) {
    this.conversation = conversation
    this.background = null
    this.#advance()
  }

  /**
   * Show a full-screen background behind the portraits until the conversation ends.
   * @param {string} name
   */
  setBackground(name) {
    this.background = name
  }

  /** @param {import('./input.js').Input} input */
  update(input) {
    const shown = this.shown
    if (!shown) return
    this.timer++

    if (shown.type === 'menu') {
      const selected = moveCursor(input, this.selected, shown.choices.length)
      if (selected !== this.selected) this.sound.play('cursor')
      this.selected = selected
      if (input.wasPressed('a')) {
        this.sound.play('confirm')
        this.conversation.choose(this.selected)
        this.#advance()
      }
    } else if (input.wasPressed('a')) {
      this.sound.play('talk')
      if (this.page < this.pages.length - 1) this.page++
      else this.#advance()
    }
  }

  /** Move on to the conversation's next line or menu, or finish. */
  #advance() {
    this.shown = this.conversation.next()
    this.timer = 0

    if (!this.shown) {
      this.conversation = null
      this.background = null
      return
    }
    if (this.shown.type === 'menu') {
      this.selected = 0
      return
    }

    this.speaker = null
    if (this.shown.speaker) {
      this.speaker = this.speakers[this.shown.speaker]
      this.speakerName = this.conversation.fillIn(this.speaker.name)
    }

    this.pages = splitIntoPages(this.shown.text)
    this.page = 0
  }

  /** @param {CanvasRenderingContext2D} ctx */
  draw(ctx) {
    const shown = this.shown
    if (!shown) return

    if (this.background) ctx.drawImage(this.backgrounds[this.background], 0, 0)

    if (shown.type === 'menu') this.#drawMenu(ctx, shown.choices)
    else this.#drawLine(ctx, shown.expression)
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} expression
   */
  #drawLine(ctx, expression) {
    const box = TEXT_BOX

    if (this.speaker) {
      const column = this.speaker.expressions.indexOf(expression)
      ctx.drawImage(
        this.speaker.portraits,
        column * PORTRAIT_WIDTH, 0, PORTRAIT_WIDTH, PORTRAIT_HEIGHT,
        PANEL_MARGIN, box.y - PORTRAIT_HEIGHT, PORTRAIT_WIDTH, PORTRAIT_HEIGHT,
      )
      drawNameTab(ctx, box, this.speakerName)
    }

    drawPanel(ctx, box.x, box.y, box.width, box.height)
    this.pages[this.page].forEach((line, index) => {
      drawText(ctx, line, box.x + PANEL_TEXT_INSET, box.y + PANEL_TEXT_INSET + index * LINE_HEIGHT, UI_COLORS.text)
    })

    if (this.timer % (BLINK_DURATION * 2) < BLINK_DURATION) drawArrow(ctx, box)
  }

  /**
   * The choices, full width at the bottom. A long choice wraps onto more lines
   * and the box grows upwards to fit.
   * @param {CanvasRenderingContext2D} ctx
   * @param {string[]} choices
   */
  #drawMenu(ctx, choices) {
    const width = TEXT_BOX.width
    const wrapped = choices.map((choice) => wrapText(choice, width - PANEL_TEXT_INSET * 2 - CURSOR_SPACE))

    let lineCount = 0
    for (const lines of wrapped) lineCount += lines.length

    const height = panelHeight(lineCount)
    const y = SCREEN_HEIGHT - PANEL_MARGIN - height
    drawPanel(ctx, PANEL_MARGIN, y, width, height)

    const cursorX = PANEL_MARGIN + PANEL_TEXT_INSET
    let textY = y + PANEL_TEXT_INSET
    wrapped.forEach((lines, index) => {
      const isSelected = index === this.selected
      if (isSelected) drawCursor(ctx, cursorX, textY)
      for (const line of lines) {
        const color = isSelected ? UI_COLORS.text : UI_COLORS.textDim
        drawText(ctx, line, cursorX + CURSOR_SPACE, textY, color)
        textY += LINE_HEIGHT
      }
    })
  }
}

/**
 * Wrap a line of dialog to fit the text box, in pages of LINES_PER_PAGE lines.
 * @param {string} text
 * @returns {string[][]}
 */
function splitIntoPages(text) {
  const lines = wrapText(text, TEXT_BOX.width - PANEL_TEXT_INSET * 2 - ARROW_SPACE)
  /** @type {string[][]} */
  const pages = []
  for (let start = 0; start < lines.length; start += LINES_PER_PAGE) {
    pages.push(lines.slice(start, start + LINES_PER_PAGE))
  }
  return pages
}

/**
 * The speaker's name, in a small tab on top of the text box, beside the portrait.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Box} box  The text box.
 * @param {string} name
 */
function drawNameTab(ctx, box, name) {
  const width = measureText(name) + PANEL_TEXT_INSET * 2
  const height = GLYPH_HEIGHT + NAME_PADDING_Y * 2 + PANEL_BORDER * 2
  // Overlap the box so the two borders join up.
  const y = box.y - height + PANEL_BORDER
  const x = box.x + PORTRAIT_WIDTH + PANEL_MARGIN
  drawPanel(ctx, x, y, width, height)
  drawText(ctx, name, x + PANEL_TEXT_INSET, y + PANEL_BORDER + NAME_PADDING_Y, UI_COLORS.text)
}

/**
 * A small down-pointing triangle in the corner of a box, meaning "press A".
 * @param {CanvasRenderingContext2D} ctx
 * @param {Box} box
 */
function drawArrow(ctx, box) {
  const x = box.x + box.width - PANEL_TEXT_INSET - ARROW_WIDTH
  const y = box.y + box.height - PANEL_TEXT_INSET - ARROW_HEIGHT
  ctx.fillStyle = UI_COLORS.text
  // Each row is one pixel narrower on both sides than the row above.
  for (let row = 0; row < ARROW_HEIGHT; row++) {
    ctx.fillRect(x + row, y + row, ARROW_WIDTH - row * 2, 1)
  }
}
