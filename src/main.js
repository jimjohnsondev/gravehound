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
import { Sound } from './engine/sound.js'
import { TileSet } from './engine/tileset.js'
import { checkMaps } from './game/maps/check-maps.js'
import { MAPS } from './game/maps/index.js'
import { loadSongs } from './game/music/index.js'
import { createBackgrounds } from './game/backgrounds.js'
import { createSpeakers } from './game/cast.js'
import { SOUND_EFFECTS } from './game/sound-effects.js'
import { createAshSprites, createHeroSprites, createNpcSprites } from './game/sprites.js'
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

const scenes = loadScenes()
const npcSprites = createNpcSprites()
const songs = loadSongs()
checkMaps(MAPS, scenes, npcSprites, songs)

const sound = new Sound({ effects: SOUND_EFFECTS, songs })
sound.attachUnlock()

const world = new World({
  maps: MAPS,
  tileset: new TileSet(TILE_TYPES),
  heroSprites: createHeroSprites(),
  ashSprites: createAshSprites(),
  npcSprites,
  scenes,
  speakers: createSpeakers(),
  backgrounds: createBackgrounds(),
  sound,
})
world.enterMap('cottage', 5, 4, 'down')

startLoop({
  update() {
    input.update()
    // Gamepads send no events for Sound to hear. Some browsers accept this
    // as permission to start audio; the menu shows a hint for those that don't.
    if (input.usingGamepad) sound.unlock()
    world.update(input)
  },
  draw() {
    world.draw(screen.ctx)
  },
})

// For the browser console while developing, e.g. `gravehound.world.lightLevel = 3`
Object.assign(window, { gravehound: { world, input, sound } })
