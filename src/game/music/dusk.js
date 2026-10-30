/**
 * The wood's edge at dusk: sparse and uneasy, on E with a flattened second.
 * PLACEHOLDER until the music editor exists. The low buzz is the chip's 4-bit
 * counter and the hiss, in short gusts, is its 17-bit counter.
 */

/** @type {import('../../engine/song.js').SongSource} */
export const dusk = {
  stepsPerSecond: 4,
  channels: [
    // The tune.
    {
      distortion: 10,
      volume: 6,
      decay: 7,
      notes: `
        E4 -- -- -- F4 -- -- --   E4 -- -- -- .. .. .. ..
        G4 -- -- F4 E4 -- -- --   D4 -- -- -- .. .. .. ..
        E4 -- B4 -- C5 -- -- --   B4 -- -- A4 G4 -- -- --
        F4 -- -- E4 D4 -- -- --   E4 -- -- -- .. .. .. ..
      `,
    },
    // A low buzz, like something breathing.
    {
      distortion: 12,
      volume: 5,
      decay: 14,
      notes: `
        E2 -- -- -- -- -- -- --   E2 -- -- -- -- -- -- --
        C3 -- -- -- -- -- -- --   D3 -- -- -- -- -- -- --
        E2 -- -- -- -- -- -- --   A2 -- -- -- -- -- -- --
        D3 -- -- -- -- -- -- --   E2 -- -- -- -- -- -- --
      `,
    },
    // Wind in the trees.
    {
      distortion: 8,
      volume: 1,
      decay: 0,
      notes: `
        A6 -- -- -- .. .. .. ..   .. .. .. .. F6 -- -- --
        .. .. .. .. A6 -- -- --   C7 -- -- -- .. .. .. ..
        A6 -- -- -- .. .. .. ..   .. .. .. .. F6 -- -- --
        .. .. .. .. A6 -- -- --   C7 -- -- -- .. .. .. ..
      `,
    },
  ],
}
