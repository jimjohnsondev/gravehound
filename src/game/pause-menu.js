/**
 * The menu the Menu button opens. Play stops while it's up, and the game stays
 * dimly visible behind it. It has a short list of choices, leading to the
 * hero's items and stats, and can turn the sound off.
 */
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../engine/config.js'
import { moveCursor } from '../engine/input.js'
import { UI_COLORS } from '../engine/palette.js'
import {
  CURSOR_SPACE,
  LINE_HEIGHT,
  PANEL_MARGIN,
  PANEL_TEXT_INSET,
  drawCursor,
  drawPanel,
  panelHeight,
} from '../engine/panel.js'
import { drawText, wrapText } from '../engine/text.js'
import { ITEMS, STATS } from './story-flags.js'

/** Laid over the whole screen behind the menu. */
const DIM_OVERLAY = 'rgba(0, 0, 0, 0.5)'

/** Width of a panel that spans the screen. */
const FULL_WIDTH = SCREEN_WIDTH - PANEL_MARGIN * 2

/** Where text starts in a panel in the top-left corner. */
const TEXT_LEFT = PANEL_MARGIN + PANEL_TEXT_INSET
const TEXT_TOP = PANEL_MARGIN + PANEL_TEXT_INSET

/** Width of the panel holding the main choices. */
const MAIN_PANEL_WIDTH = 72

/** Item names shown at once. A longer list scrolls to follow the cursor. */
const ITEM_ROWS = 6

/** Lines of an item's description shown under the list. */
const DESCRIPTION_LINES = 3

/** Shown under the main choices if the browser hasn't let sound start yet. */
const SOUND_HINT = 'Press a key or click for sound'

/** On the status page, how far right of the text's left edge the numbers sit. */
const STAT_VALUE_OFFSET = 48

/** @typedef {'main' | 'items' | 'status'} MenuPage */

/** The main page's choices, in order. */
const MAIN_CHOICES = ['Items', 'Status', 'Sound', 'Close']

/** Open it with `open()`. While `active`, it gets all the input. */
export class PauseMenu {
  /** @param {import('../engine/sound.js').Sound} sound */
  constructor(sound) {
    this.sound = sound
    this.active = false
    /**
     * Handed over on every open, so the menu can never show a story that
     * loading a save has since replaced.
     * @type {import('../engine/story-state.js').StoryState | null}
     */
    this.story = null
    /** @type {MenuPage} */
    this.page = 'main'
    /** Which main choice the cursor is on. */
    this.mainCursor = 0
    /** Which item the cursor is on. */
    this.itemCursor = 0
    this.heroName = ''
  }

  /**
   * @param {import('../engine/story-state.js').StoryState} story
   * @param {string} heroName
   */
  open(story, heroName) {
    this.active = true
    this.story = story
    this.page = 'main'
    this.mainCursor = 0
    this.heroName = heroName
  }

  close() {
    this.active = false
  }

  /**
   * The items the hero has, in the order they were found. Ids the game doesn't
   * know are left out, because an old save could hold one and drawing it would
   * stop the game.
   */
  get #items() {
    return [...this.story.items].filter((item) => ITEMS[item])
  }

  /** @param {import('../engine/input.js').Input} input */
  update(input) {
    if (input.wasPressed('menu')) {
      this.#leave()
    } else if (this.page === 'main') {
      this.#updateMain(input)
    } else {
      this.#updateSubPage(input)
    }
  }

  /** Close the menu the way the player does, with a sound. */
  #leave() {
    this.sound.play('back')
    this.close()
  }

  /** @param {import('../engine/input.js').Input} input */
  #updateMain(input) {
    const cursor = moveCursor(input, this.mainCursor, MAIN_CHOICES.length)
    if (cursor !== this.mainCursor) this.sound.play('cursor')
    this.mainCursor = cursor

    if (input.wasPressed('b')) {
      this.#leave()
    } else if (input.wasPressed('a')) {
      this.#choose(MAIN_CHOICES[this.mainCursor])
    }
  }

  /** @param {string} choice  One of MAIN_CHOICES. */
  #choose(choice) {
    if (choice === 'Close') {
      this.#leave()
    } else if (choice === 'Sound') {
      this.sound.setMuted(!this.sound.muted)
      this.sound.play('confirm')
    } else {
      this.sound.play('confirm')
      this.#showPage(choice === 'Items' ? 'items' : 'status')
    }
  }

  /** @param {MenuPage} page */
  #showPage(page) {
    this.page = page
    this.itemCursor = 0
  }

  /**
   * Items and status only look at things, so A and B both go back.
   * @param {import('../engine/input.js').Input} input
   */
  #updateSubPage(input) {
    if (this.page === 'items') {
      // The list may have shrunk since the cursor last moved.
      const count = this.#items.length
      const cursor = moveCursor(input, Math.min(this.itemCursor, count - 1), count)
      if (cursor !== this.itemCursor) this.sound.play('cursor')
      this.itemCursor = cursor
    }
    if (input.wasPressed('a') || input.wasPressed('b')) {
      this.sound.play('back')
      this.page = 'main'
    }
  }

  /** @param {CanvasRenderingContext2D} ctx */
  draw(ctx) {
    if (!this.active) return

    ctx.fillStyle = DIM_OVERLAY
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

    if (this.page === 'main') this.#drawMain(ctx)
    else if (this.page === 'items') this.#drawItems(ctx)
    else this.#drawStatus(ctx)
  }

  /** @param {CanvasRenderingContext2D} ctx */
  #drawMain(ctx) {
    const soundLabel = this.sound.muted ? 'Sound off' : 'Sound on'
    const labels = MAIN_CHOICES.map((choice) => (choice === 'Sound' ? soundLabel : choice))
    drawPanel(ctx, PANEL_MARGIN, PANEL_MARGIN, MAIN_PANEL_WIDTH, panelHeight(labels.length))
    drawChoices(ctx, labels, this.mainCursor, TEXT_LEFT, TEXT_TOP)
    if (this.sound.needsTouch) drawSoundHint(ctx)
  }

  /** @param {CanvasRenderingContext2D} ctx */
  #drawItems(ctx) {
    const items = this.#items
    drawPanel(ctx, PANEL_MARGIN, PANEL_MARGIN, FULL_WIDTH, panelHeight(ITEM_ROWS))

    if (items.length === 0) {
      drawText(ctx, 'Nothing yet.', TEXT_LEFT, TEXT_TOP, UI_COLORS.textDim)
      return
    }

    // Keep the cursor on screen: past the last row, it stays on the bottom row.
    const firstRow = Math.max(0, this.itemCursor - ITEM_ROWS + 1)
    const names = items.slice(firstRow, firstRow + ITEM_ROWS).map((item) => ITEMS[item].name)
    drawChoices(ctx, names, this.itemCursor - firstRow, TEXT_LEFT, TEXT_TOP)

    drawDescription(ctx, ITEMS[items[this.itemCursor]].description)
  }

  /** @param {CanvasRenderingContext2D} ctx */
  #drawStatus(ctx) {
    const stats = Object.keys(STATS)
    // One line for the name, then one for each stat.
    drawPanel(ctx, PANEL_MARGIN, PANEL_MARGIN, FULL_WIDTH, panelHeight(stats.length + 1))
    drawText(ctx, this.heroName, TEXT_LEFT, TEXT_TOP, UI_COLORS.text)

    stats.forEach((stat, index) => {
      const y = TEXT_TOP + (index + 1) * LINE_HEIGHT
      drawText(ctx, capitalise(stat), TEXT_LEFT, y, UI_COLORS.textDim)
      drawText(ctx, String(this.story.getNumber(stat)), TEXT_LEFT + STAT_VALUE_OFFSET, y, UI_COLORS.text)
    })
  }
}

/**
 * The selected item's description, in a panel along the bottom of the screen.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} description
 */
function drawDescription(ctx, description) {
  const height = panelHeight(DESCRIPTION_LINES)
  const y = SCREEN_HEIGHT - PANEL_MARGIN - height
  drawPanel(ctx, PANEL_MARGIN, y, FULL_WIDTH, height)
  wrapText(description, FULL_WIDTH - PANEL_TEXT_INSET * 2).forEach((line, index) => {
    drawText(ctx, line, TEXT_LEFT, y + PANEL_TEXT_INSET + index * LINE_HEIGHT, UI_COLORS.text)
  })
}

/**
 * A one-line reminder along the bottom of the screen.
 * @param {CanvasRenderingContext2D} ctx
 */
function drawSoundHint(ctx) {
  const height = panelHeight(1)
  const y = SCREEN_HEIGHT - PANEL_MARGIN - height
  drawPanel(ctx, PANEL_MARGIN, y, FULL_WIDTH, height)
  drawText(ctx, SOUND_HINT, TEXT_LEFT, y + PANEL_TEXT_INSET, UI_COLORS.textDim)
}

/**
 * A column of one-line choices, with the cursor beside the selected one.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string[]} labels
 * @param {number} selected
 * @param {number} x  Left edge, where the cursor goes.
 * @param {number} y  Top of the first choice.
 */
function drawChoices(ctx, labels, selected, x, y) {
  labels.forEach((label, index) => {
    const textY = y + index * LINE_HEIGHT
    const isSelected = index === selected
    if (isSelected) drawCursor(ctx, x, textY)
    drawText(ctx, label, x + CURSOR_SPACE, textY, isSelected ? UI_COLORS.text : UI_COLORS.textDim)
  })
}

/**
 * Turn a stat's name into a label, e.g. 'might' into 'Might'.
 * @param {string} word
 */
function capitalise(word) {
  return word[0].toUpperCase() + word.slice(1)
}
