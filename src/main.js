/**
 * Gravehound starts here.
 *
 * Wires the engine together: screen, input, main loop and the world.
 * Game rules live in src/game; reusable machinery lives in src/engine.
 */
import './style.css'
import { Input } from './engine/input.js'
import { startLoop } from './engine/loop.js'
import { Screen } from './engine/screen.js'
import { TileSet } from './engine/tileset.js'
import { MAPS } from './game/maps/index.js'
import { createBackgrounds } from './game/backgrounds.js'
import { createSpeakers } from './game/cast.js'
import { createAshSprites, createHeroSprites } from './game/sprites.js'
import { loadScenes } from './game/talk/index.js'
import { TILE_TYPES } from './game/tiles.js'
import { World } from './game/world.js'

// Add ?touch to the URL to show the on-screen controls on a desktop browser.
if (new URLSearchParams(location.search).has('touch')) {
  document.body.classList.add('force-touch')
}

const screen = new Screen(
  /** @type {HTMLCanvasElement} */ (document.getElementById('screen')),
  /** @type {HTMLElement} */ (document.getElementById('screen-area')),
)

const input = new Input()
input.attachTouchControls(/** @type {HTMLElement} */ (document.getElementById('touch-controls')))

const world = new World({
  maps: MAPS,
  tileset: new TileSet(TILE_TYPES),
  heroSprites: createHeroSprites(),
  ashSprites: createAshSprites(),
  scenes: loadScenes(),
  speakers: createSpeakers(),
  backgrounds: createBackgrounds(),
})
world.enterMap('cottage', 10, 8, 'down')

startLoop({
  update() {
    input.update()
    world.update(input)
  },
  draw() {
    world.draw(screen.ctx)
  },
})

// Handy in the browser console while developing: `gravehound.world.lightLevel = 3`
Object.assign(window, { gravehound: { world, input } })
