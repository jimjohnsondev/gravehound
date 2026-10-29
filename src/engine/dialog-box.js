import { PORTRAIT_HEIGHT, PORTRAIT_WIDTH, SCREEN_HEIGHT, SCREEN_WIDTH } from './config.js'
import { GLYPH_HEIGHT } from './font-glyphs.js'
import { UI_COLORS } from './palette.js'
import { drawPanel } from './panel.js'
import { drawText, measureText, wrapText } from './text.js'

/**
 * The dialog box: a large portrait of whoever is speaking, over an
 * environmental background, with their words in a box beside them. Narration
 * has no portrait and uses the full width. So do menus, since it's the player
 * choosing.
 *
 * It shows whatever a Conversation (talk-runner.js) gives it. A turns the
 * page; up, down and A pick a choice.
 */

/** Gap between the boxes and the screen edges. */
const MARGIN = 4

/** Space between a box's 1-pixel border and its text. */
const PADDING_X = 6
const PADDING_Y = 5

/** Space above and below the name in the speaker's name tab. */
const NAME_PADDING_Y = 3

/** Distance from the top of one line of text to the top of the next. */
const LINE_HEIGHT = GLYPH_HEIGHT + 3

/** Lines shown at once. A longer line carries on over more pages. */
const LINES_PER_PAGE = 4

/** Room on the left of each choice for the cursor. */
const CURSOR_SPACE = 8

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

export class DialogBox {
  /**
   * @param {object} options
   * @param {Record<string, Speaker>} options.speakers  By speaker id, e.g. 'WREN'.
   * @param {Record<string, CanvasImageSource>} options.backgrounds  Full-screen pictures.
   */
  constructor({ speakers, backgrounds }) {
    this.speakers = speakers
    this.backgrounds = backgrounds
    /** @type {import('./talk-runner.js').Conversation | null} */
    this.conversation = null
    /** @type {import('./talk-runner.js').ShownLine | import('./talk-runner.js').ShownMenu | null} */
    this.shown = null
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
      const count = shown.choices.length
      if (input.wasPressed('up')) this.selected = (this.selected + count - 1) % count
      if (input.wasPressed('down')) this.selected = (this.selected + 1) % count
      if (input.wasPressed('a')) {
        this.conversation?.choose(this.selected)
        this.#advance()
      }
    } else if (input.wasPressed('a')) {
      if (this.page < this.pages.length - 1) this.page++
      else this.#advance()
    }
  }

  /** Move on to the conversation's next line or menu, or finish. */
  #advance() {
    this.shown = this.conversation?.next() ?? null
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

    const lines = wrapText(this.shown.text, textWidth(this.#lineBox()))
    this.pages = []
    for (let start = 0; start < lines.length; start += LINES_PER_PAGE) {
      this.pages.push(lines.slice(start, start + LINES_PER_PAGE))
    }
    this.page = 0
  }

  /** @param {CanvasRenderingContext2D} ctx */
  draw(ctx) {
    const shown = this.shown
    if (!shown) return

    if (this.background) ctx.drawImage(this.backgrounds[this.background], 0, 0)

    if (shown.type === 'menu') {
      this.#drawMenu(ctx, shown.choices)
      return
    }

    const box = this.#lineBox()
    const speaker = shown.speaker ? this.speakers[shown.speaker] : null
    if (speaker) {
      const column = speaker.expressions.indexOf(shown.expression)
      ctx.drawImage(
        speaker.portraits,
        column * PORTRAIT_WIDTH, 0, PORTRAIT_WIDTH, PORTRAIT_HEIGHT,
        MARGIN, SCREEN_HEIGHT - MARGIN - PORTRAIT_HEIGHT, PORTRAIT_WIDTH, PORTRAIT_HEIGHT,
      )
      this.#drawNameTab(ctx, box, this.conversation?.fillIn(speaker.name) ?? speaker.name)
    }

    drawPanel(ctx, box.x, box.y, box.width, box.height)
    this.pages[this.page].forEach((line, index) => {
      drawText(ctx, line, box.x + 1 + PADDING_X, box.y + 1 + PADDING_Y + index * LINE_HEIGHT, UI_COLORS.text)
    })

    // A blinking arrow in the corner says "press A to go on".
    if (this.timer % (BLINK_DURATION * 2) < BLINK_DURATION) {
      const x = box.x + box.width - 1 - PADDING_X - 5
      const y = box.y + box.height - 1 - PADDING_Y - 3
      ctx.fillStyle = UI_COLORS.text
      ctx.fillRect(x, y, 5, 1)
      ctx.fillRect(x + 1, y + 1, 3, 1)
      ctx.fillRect(x + 2, y + 2, 1, 1)
    }
  }

  /**
   * Where the text box for a line goes: beside the portrait if someone is
   * speaking, full width for narration.
   * @returns {Box}
   */
  #lineBox() {
    const height = boxHeight(LINES_PER_PAGE)
    const y = SCREEN_HEIGHT - MARGIN - height
    const hasPortrait = this.shown?.type === 'line' && this.shown.speaker !== null
    const x = hasPortrait ? MARGIN + PORTRAIT_WIDTH + MARGIN : MARGIN
    return { x, y, width: SCREEN_WIDTH - MARGIN - x, height }
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {Box} box  The text box the tab sits on.
   * @param {string} name
   */
  #drawNameTab(ctx, box, name) {
    const width = measureText(name) + PADDING_X * 2 + 2
    const height = GLYPH_HEIGHT + NAME_PADDING_Y * 2 + 2
    // Overlap the box by one pixel so the two borders join up.
    const y = box.y - height + 1
    drawPanel(ctx, box.x, y, width, height)
    drawText(ctx, name, box.x + 1 + PADDING_X, y + 1 + NAME_PADDING_Y, UI_COLORS.text)
  }

  /**
   * The choices, full width at the bottom. A long choice wraps onto more lines
   * and the box grows upwards to fit.
   * @param {CanvasRenderingContext2D} ctx
   * @param {string[]} choices
   */
  #drawMenu(ctx, choices) {
    const width = SCREEN_WIDTH - MARGIN * 2
    const wrapped = choices.map((choice) =>
      wrapText(choice, width - 2 - PADDING_X * 2 - CURSOR_SPACE))
    const lineCount = wrapped.reduce((sum, lines) => sum + lines.length, 0)
    const height = boxHeight(lineCount)
    const x = MARGIN
    const y = SCREEN_HEIGHT - MARGIN - height
    drawPanel(ctx, x, y, width, height)

    const textX = x + 1 + PADDING_X + CURSOR_SPACE
    let textY = y + 1 + PADDING_Y
    wrapped.forEach((lines, index) => {
      const isSelected = index === this.selected
      if (isSelected) {
        // A small right-pointing triangle.
        ctx.fillStyle = UI_COLORS.text
        ctx.fillRect(x + 1 + PADDING_X, textY + 1, 1, 5)
        ctx.fillRect(x + 2 + PADDING_X, textY + 2, 1, 3)
        ctx.fillRect(x + 3 + PADDING_X, textY + 3, 1, 1)
      }
      for (const line of lines) {
        drawText(ctx, line, textX, textY, isSelected ? UI_COLORS.text : UI_COLORS.textDim)
        textY += LINE_HEIGHT
      }
    })
  }
}

/**
 * Height of a box holding `lineCount` lines of text, border included.
 * @param {number} lineCount
 */
function boxHeight(lineCount) {
  const textHeight = (lineCount - 1) * LINE_HEIGHT + GLYPH_HEIGHT
  return textHeight + PADDING_Y * 2 + 2
}

/**
 * Room for text inside a box.
 * @param {Box} box
 */
function textWidth(box) {
  return box.width - 2 - PADDING_X * 2
}
