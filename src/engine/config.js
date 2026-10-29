/**
 * Fixed numbers the whole game agrees on.
 * Change them here, never as magic numbers elsewhere.
 */

/** Width of the game screen in pixels (Atari-style resolution). */
export const SCREEN_WIDTH = 320

/** Height of the game screen in pixels. */
export const SCREEN_HEIGHT = 192

/** Size of one map tile in pixels. The screen is 20 x 12 tiles. */
export const TILE_SIZE = 16

/** Screen size measured in tiles. A single-screen map is exactly this big. */
export const SCREEN_TILES_WIDE = SCREEN_WIDTH / TILE_SIZE
export const SCREEN_TILES_HIGH = SCREEN_HEIGHT / TILE_SIZE

/** Size of a character portrait in the dialog box, in pixels. */
export const PORTRAIT_WIDTH = 72
export const PORTRAIT_HEIGHT = 96

/** Game logic runs this many times per second, whatever the display rate. */
export const UPDATES_PER_SECOND = 60
