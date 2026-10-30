// Fingerprints what the game draws, so a refactor can prove it changed nothing.
// Paste into the browser after a fresh page load. Run it before and after a
// refactor: the returned `total` must match. Reload afterwards, because it
// leaves the game in a test state.

const { FLAGS, COUNTERS, STATS, ITEMS } = await import('/src/game/story-flags.js')

const world = gravehound.world
const dialog = world.dialog
const canvas = document.getElementById('screen')
const ctx = canvas.getContext('2d', { willReadFrequently: true })

/** FNV-1a: a small, fast fingerprint of some bytes. */
function fingerprint(bytes) {
  let hash = 2166136261
  for (let i = 0; i < bytes.length; i++) {
    hash ^= bytes[i]
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16)
}

function hashScreen() {
  world.draw(ctx)
  return fingerprint(ctx.getImageData(0, 0, canvas.width, canvas.height).data)
}

const press = (button) => dialog.update({ wasPressed: (name) => name === button })

function resetStory() {
  const { story } = world
  story.flags.clear()
  story.items.clear()
  story.seenScenes.clear()
  story.numbers.clear()
  for (const [name, value] of Object.entries(STATS)) story.setNumber(name, value)
  dialog.conversation = null
  dialog.shown = null
  dialog.background = null
  world.menu.close()
}

/** Everything on: flags set, numbers high, so `[if ...]` lines all show. */
function turnEverythingOn() {
  const { story } = world
  for (const flag of Object.keys(FLAGS)) story.set(flag)
  for (const name of [...Object.keys(COUNTERS), ...Object.keys(STATS)]) story.setNumber(name, 99)
}

/** Play a scene to the end, hashing every page, menu and cursor position. */
function playScene(scene, pick) {
  const hashes = []
  world.talk(scene)
  let guard = 0
  while (dialog.active) {
    if (++guard > 2000) throw new Error(`Scene ${scene} never ended`)
    dialog.timer = 0
    hashes.push(hashScreen())
    dialog.timer = 25 // the "press A" arrow's other blink state
    hashes.push(hashScreen())

    if (dialog.shown.type === 'menu') {
      press('down')
      hashes.push(hashScreen())
      press('up')
      hashes.push(hashScreen())
      dialog.selected = pick(dialog.shown.choices.length)
      press('a')
    } else {
      while (dialog.page < dialog.pages.length - 1) {
        press('a')
        hashes.push(hashScreen())
      }
      press('a')
    }
  }
  return hashes
}

const sections = {}
resetStory()

for (const [id, map] of Object.entries(world.maps)) {
  const middleX = Math.floor(map.rows[0].length / 2)
  const middleY = Math.floor(map.rows.length / 2)
  for (const facing of ['down', 'left']) {
    world.enterMap(id, middleX, middleY, facing)
    world.dialog.conversation = null
    world.dialog.shown = null
    // Every moment of the banner's slide in, its rest, and its slide out.
    sections[`map ${id} ${facing}`] = [150, 148, 145, 142, 139, 100, 12, 9, 5, 2, 0].map((time) => {
      world.banner.timeLeft = time
      return hashScreen()
    })
  }
}

world.banner.timeLeft = 0
// Every page of the menu, with and without items in the list.
world.menu.open(world.story, 'Rowan')
sections.paused = [hashScreen()]
for (const page of ['items', 'status']) {
  world.menu.page = page
  sections[`menu ${page}, nothing found`] = [hashScreen()]
}
for (const item of Object.keys(ITEMS)) world.story.items.add(item)
world.menu.page = 'items'
sections['menu items'] = Object.keys(ITEMS).map((item, index) => {
  world.menu.itemCursor = index
  return hashScreen()
})
world.menu.close()
world.story.items.clear()

const paths = {
  'flags off, first choices': { setup: () => {}, pick: () => 0 },
  'flags off, last choices': { setup: () => {}, pick: (count) => count - 1 },
  'flags on, first choices': { setup: turnEverythingOn, pick: () => 0 },
  'flags on, last choices': { setup: turnEverythingOn, pick: (count) => count - 1 },
}

for (const scene of Object.keys(world.scenes)) {
  for (const [name, { setup, pick }] of Object.entries(paths)) {
    resetStory()
    setup()
    sections[`${scene}: ${name}`] = playScene(scene, pick)
  }
}

resetStory()

const checkpoints = Object.values(sections).reduce((sum, hashes) => sum + hashes.length, 0)
const total = fingerprint(new TextEncoder().encode(JSON.stringify(sections)))
const bySection = {}
for (const [name, hashes] of Object.entries(sections)) {
  bySection[name] = fingerprint(new TextEncoder().encode(hashes.join()))
}

JSON.stringify({ total, checkpoints, bySection }, null, 1)
