/**
 * Turns keyboard, gamepad and on-screen touch controls into one simple set of
 * game buttons. Game code never looks at keys or touches directly; it asks
 * `input.isHeld('a')` or `input.wasPressed('menu')`.
 *
 * Buttons: up, down, left, right, a, b, menu
 */

/** @typedef {'up' | 'down' | 'left' | 'right' | 'a' | 'b' | 'menu'} Button */

/** Keyboard keys (KeyboardEvent.code) for each button. */
const KEY_BINDINGS = /** @type {Record<string, Button>} */ ({
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  KeyZ: 'a',
  Space: 'a',
  KeyJ: 'a',
  KeyX: 'b',
  KeyK: 'b',
  Enter: 'menu',
  Escape: 'menu',
})

/** Standard gamepad button numbers for each button. */
const GAMEPAD_BINDINGS = /** @type {Record<number, Button>} */ ({
  12: 'up',
  13: 'down',
  14: 'left',
  15: 'right',
  0: 'a',
  1: 'b',
  9: 'menu',
})

/** How far the touch must be from the d-pad centre before it counts (0-1). */
const DPAD_DEAD_ZONE = 0.2

/**
 * Buttons for each 45-degree slice of the d-pad, going clockwise from right.
 * @type {Button[][]}
 */
const DPAD_SLICES = [
  ['right'], ['right', 'down'], ['down'], ['down', 'left'],
  ['left'], ['left', 'up'], ['up'], ['up', 'right'],
]

/** Analog stick must be pushed this far to count as a direction. */
const STICK_DEAD_ZONE = 0.4

/** The current state of the game's buttons. Call `update()` once per update step. */
export class Input {
  constructor() {
    /** Buttons held down by the keyboard. */
    this.keyboard = new Set()
    /** Buttons held down by on-screen controls. */
    this.touch = new Set()

    /** Combined state for this update step. */
    this.held = new Set()
    /** Buttons that went down during this update step. */
    this.pressed = new Set()

    window.addEventListener('keydown', (event) => {
      const button = KEY_BINDINGS[event.code]
      if (!button) return
      event.preventDefault()
      this.keyboard.add(button)
    })
    window.addEventListener('keyup', (event) => {
      const button = KEY_BINDINGS[event.code]
      if (button) this.keyboard.delete(button)
    })
    // Let go of everything if the window loses focus, so keys don't "stick".
    window.addEventListener('blur', () => {
      this.keyboard.clear()
      this.touch.clear()
    })
  }

  /**
   * Hook up the on-screen d-pad and buttons.
   * @param {HTMLElement} root  The #touch-controls element.
   */
  attachTouchControls(root) {
    const dpad = /** @type {HTMLElement} */ (root.querySelector('[data-dpad]'))
    this.#attachDpad(dpad)

    for (const element of root.querySelectorAll('[data-button]')) {
      const buttonElement = /** @type {HTMLElement} */ (element)
      const button = /** @type {Button} */ (buttonElement.dataset.button)
      const press = (/** @type {PointerEvent} */ event) => {
        event.preventDefault()
        buttonElement.setPointerCapture(event.pointerId)
        this.touch.add(button)
        buttonElement.classList.add('pressed')
      }
      const release = () => {
        this.touch.delete(button)
        buttonElement.classList.remove('pressed')
      }
      buttonElement.addEventListener('pointerdown', press)
      buttonElement.addEventListener('pointerup', release)
      buttonElement.addEventListener('pointercancel', release)
    }
  }

  /**
   * The d-pad works out the direction from where your thumb is compared to its
   * centre, split into 8 slices, so you can slide between directions and hit
   * diagonals easily.
   * @param {HTMLElement} dpad
   */
  #attachDpad(dpad) {
    /** @type {Button[]} */
    const directions = ['up', 'down', 'left', 'right']

    const clear = () => {
      for (const direction of directions) this.touch.delete(direction)
      dpad.dataset.dir = ''
    }

    const track = (/** @type {PointerEvent} */ event) => {
      const box = dpad.getBoundingClientRect()
      // Position relative to the centre, from -1 to 1 on each axis.
      const x = ((event.clientX - box.left) / box.width) * 2 - 1
      const y = ((event.clientY - box.top) / box.height) * 2 - 1
      clear()
      if (Math.hypot(x, y) < DPAD_DEAD_ZONE) return

      // Angle in 45-degree slices: 0 = right, 2 = down, 4 = left, 6 = up.
      const slice = Math.round(Math.atan2(y, x) / (Math.PI / 4)) & 7
      const pressed = DPAD_SLICES[slice]
      for (const button of pressed) this.touch.add(button)
      dpad.dataset.dir = pressed.join(' ')
    }

    dpad.addEventListener('pointerdown', (event) => {
      event.preventDefault()
      dpad.setPointerCapture(event.pointerId)
      track(event)
    })
    dpad.addEventListener('pointermove', (event) => {
      if (dpad.hasPointerCapture(event.pointerId)) track(event)
    })
    dpad.addEventListener('pointerup', clear)
    dpad.addEventListener('pointercancel', clear)
  }

  /** Read the first connected gamepad, if any. */
  #readGamepad() {
    const held = new Set()
    const pad = navigator.getGamepads?.().find((p) => p)
    if (!pad) return held

    for (const [index, button] of Object.entries(GAMEPAD_BINDINGS)) {
      if (pad.buttons[Number(index)]?.pressed) held.add(button)
    }
    const [stickX = 0, stickY = 0] = pad.axes
    if (stickX < -STICK_DEAD_ZONE) held.add('left')
    if (stickX > STICK_DEAD_ZONE) held.add('right')
    if (stickY < -STICK_DEAD_ZONE) held.add('up')
    if (stickY > STICK_DEAD_ZONE) held.add('down')
    return held
  }

  /** Call once at the start of every update step. */
  update() {
    const previous = this.held
    this.held = new Set([...this.keyboard, ...this.touch, ...this.#readGamepad()])
    this.pressed = new Set([...this.held].filter((b) => !previous.has(b)))
  }

  /** @param {Button} button  True while the button is down. */
  isHeld(button) {
    return this.held.has(button)
  }

  /** @param {Button} button  True only on the step the button went down. */
  wasPressed(button) {
    return this.pressed.has(button)
  }

  /**
   * The direction being held as x and y, each -1, 0 or 1.
   * @returns {{x: number, y: number}}
   */
  direction() {
    return {
      x: (this.isHeld('right') ? 1 : 0) - (this.isHeld('left') ? 1 : 0),
      y: (this.isHeld('down') ? 1 : 0) - (this.isHeld('up') ? 1 : 0),
    }
  }
}
