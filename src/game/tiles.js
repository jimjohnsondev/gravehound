/**
 * Every tile type in the game, keyed by the character used in map files.
 *
 * The paint functions are PLACEHOLDER ART: quick shapes drawn with code so the
 * engine can be built and tested. They will be replaced by imported art; the
 * characters, names and `solid` flags stay.
 *
 * Paint with ramp names and steps (0 = brightest), never raw colours, so the
 * lighting system can darken them. See engine/palette.js.
 */

/**
 * Colour one random pixel of a tile, for speckled ground.
 * @param {import('../engine/tileset.js').TilePainter} p
 * @param {string} ramp
 * @param {number} step
 */
function speckle(p, ramp, step) {
  p.pixel(Math.floor(p.random() * 16), Math.floor(p.random() * 16), ramp, step)
}

/**
 * Paint timber planks over a whole tile.
 * @param {import('../engine/tileset.js').TilePainter} p
 */
function paintTimber(p) {
  p.rect(0, 0, 16, 16, 'wood', 2)
  for (let y = 0; y < 16; y += 4) {
    p.rect(0, y, 16, 3, 'wood', 1)
    p.rect(0, y, 16, 1, 'wood', 0)
  }
}

/** The tile a closed chest ('C') turns into when opened. */
export const OPEN_CHEST_TILE = 'c'

/** @type {Record<string, import('../engine/tileset.js').TileType>} */
export const TILE_TYPES = {
  '.': {
    name: 'grass',
    solid: false,
    paint(p) {
      p.rect(0, 0, 16, 16, 'grass', 1)
      for (let i = 0; i < 10; i++) {
        speckle(p, 'grass', 0)
        speckle(p, 'grass', 2)
      }
    },
  },

  ',': {
    name: 'long grass',
    solid: false,
    paint(p) {
      p.rect(0, 0, 16, 16, 'grass', 2)
      for (let i = 0; i < 6; i++) {
        const x = Math.floor(p.random() * 14) + 1
        const y = Math.floor(p.random() * 12) + 2
        p.rect(x, y, 1, 3, 'grass', 0)
        p.pixel(x - 1, y + 1, 'grass', 1)
      }
    },
  },

  '=': {
    name: 'dirt path',
    solid: false,
    paint(p) {
      p.rect(0, 0, 16, 16, 'earth', 1)
      for (let i = 0; i < 8; i++) {
        speckle(p, 'earth', 2)
        speckle(p, 'earth', 0)
      }
    },
  },

  T: {
    name: 'tree',
    solid: true,
    paint(p) {
      p.rect(0, 0, 16, 16, 'grass', 2)
      p.rect(6, 10, 4, 6, 'wood', 2) // trunk
      p.rect(2, 1, 12, 10, 'leaf', 1) // crown
      p.rect(1, 3, 14, 6, 'leaf', 1)
      p.rect(4, 2, 5, 3, 'leaf', 0) // highlight
      p.rect(3, 8, 10, 2, 'leaf', 2) // shadow underneath
    },
  },

  '~': {
    name: 'water',
    solid: true,
    paint(p) {
      p.rect(0, 0, 16, 16, 'water', 1)
      p.rect(2, 4, 5, 1, 'water', 0)
      p.rect(9, 10, 5, 1, 'water', 0)
      p.rect(0, 14, 16, 2, 'water', 2)
    },
  },

  s: {
    name: 'signpost',
    solid: true,
    paint(p) {
      p.rect(0, 0, 16, 16, 'grass', 1)
      p.rect(7, 8, 2, 8, 'wood', 2) // post
      p.rect(1, 2, 14, 7, 'wood', 1) // board
      p.rect(1, 2, 14, 1, 'wood', 0)
      p.rect(3, 4, 10, 1, 'wood', 3) // faded writing
      p.rect(3, 6, 7, 1, 'wood', 3)
    },
  },

  C: {
    name: 'closed chest',
    solid: true,
    paint(p) {
      p.rect(0, 0, 16, 16, 'grass', 1)
      p.rect(2, 4, 12, 10, 'wood', 1)
      p.rect(2, 4, 12, 4, 'wood', 0) // lid
      p.rect(2, 8, 12, 1, 'wood', 3)
      p.rect(7, 7, 2, 3, 'ember', 0) // clasp
    },
  },

  c: {
    name: 'open chest',
    solid: true,
    paint(p) {
      p.rect(0, 0, 16, 16, 'grass', 1)
      p.rect(2, 2, 12, 4, 'wood', 0) // lid, tipped back
      p.rect(2, 6, 12, 8, 'wood', 1)
      p.rect(3, 6, 10, 4, 'wood', 4) // the empty inside
    },
  },

  S: {
    name: 'standing stone',
    solid: true,
    paint(p) {
      p.rect(0, 0, 16, 16, 'grass', 2)
      p.rect(4, 1, 8, 14, 'stone', 1)
      p.rect(5, 0, 6, 1, 'stone', 1)
      p.rect(4, 1, 2, 14, 'stone', 0)
      p.rect(10, 1, 2, 14, 'stone', 2)
      p.rect(7, 5, 2, 1, 'stone', 3) // carved marks
      p.rect(7, 7, 2, 1, 'stone', 3)
      p.rect(7, 9, 2, 1, 'stone', 3)
    },
  },

  '#': {
    name: 'stone wall',
    solid: true,
    paint(p) {
      p.rect(0, 0, 16, 16, 'stone', 2)
      for (const [x, y, w] of [[0, 0, 7], [8, 0, 8], [0, 8, 3], [4, 8, 8], [13, 8, 3]]) {
        p.rect(x, y, w, 7, 'stone', 1)
        p.rect(x, y, w, 1, 'stone', 0)
      }
    },
  },

  W: {
    name: 'timber wall',
    solid: true,
    paint: paintTimber,
  },

  P: {
    name: 'wedding portrait',
    solid: true,
    paint(p) {
      paintTimber(p)
      p.rect(2, 2, 12, 11, 'wood', 3) // frame
      p.rect(3, 3, 10, 9, 'earth', 0) // canvas
      p.rect(5, 5, 2, 6, 'cloth', 1) // the bride and groom
      p.rect(9, 5, 2, 6, 'stone', 2)
      p.rect(7, 9, 2, 2, 'stone', 4) // the dog at their feet
    },
  },

  _: {
    name: 'floorboards',
    solid: false,
    paint(p) {
      p.rect(0, 0, 16, 16, 'wood', 1)
      p.rect(0, 7, 16, 1, 'wood', 2)
      p.rect(0, 15, 16, 1, 'wood', 2)
      p.rect(5, 0, 1, 7, 'wood', 2)
      p.rect(11, 8, 1, 7, 'wood', 2)
    },
  },

  r: {
    name: 'rug',
    solid: false,
    paint(p) {
      p.rect(0, 0, 16, 16, 'cloth', 1)
      p.rect(0, 2, 16, 1, 'cloth', 0)
      p.rect(0, 13, 16, 1, 'cloth', 0)
      p.rect(6, 6, 4, 4, 'ember', 1)
    },
  },

  t: {
    name: 'table',
    solid: true,
    paint(p) {
      p.rect(0, 0, 16, 16, 'wood', 1)
      p.rect(1, 2, 14, 9, 'wood', 0)
      p.rect(1, 11, 14, 2, 'wood', 2)
      p.rect(2, 13, 2, 3, 'wood', 3)
      p.rect(12, 13, 2, 3, 'wood', 3)
      p.rect(6, 4, 4, 4, 'ember', 0) // a candle
    },
  },

  H: {
    name: 'hearth',
    solid: true,
    paint(p) {
      p.rect(0, 0, 16, 16, 'stone', 1)
      p.rect(0, 0, 16, 2, 'stone', 0)
      p.rect(3, 5, 10, 11, 'stone', 4)
      p.rect(4, 10, 8, 6, 'ember', 2)
      p.rect(5, 9, 6, 5, 'ember', 1)
      p.rect(7, 8, 2, 4, 'ember', 0)
    },
  },

  D: {
    name: 'doorway',
    solid: false,
    paint(p) {
      p.rect(0, 0, 16, 16, 'earth', 2)
      p.rect(0, 0, 2, 16, 'wood', 1)
      p.rect(14, 0, 2, 16, 'wood', 1)
      p.rect(2, 0, 12, 2, 'wood', 0)
    },
  },
}
