/**
 * Wren's cottage: a slow lullaby in A minor. PLACEHOLDER until the music editor
 * exists, but written to suit the room: warm and a little sad.
 */

/** @type {import('../../engine/song.js').SongSource} */
export const hearth = {
  stepsPerSecond: 5,
  channels: [
    // The tune.
    {
      distortion: 10,
      volume: 7,
      decay: 8,
      notes: `
        A4 -- C5 -- E5 -- D5 --   C5 -- B4 -- A4 -- -- --
        F4 -- A4 -- C5 -- B4 --   A4 -- G4 -- E4 -- -- --
        A4 -- C5 -- E5 -- G5 --   F5 -- E5 -- D5 -- -- --
        C5 -- B4 -- A4 -- G#4 --  A4 -- -- -- -- -- -- --
      `,
    },
    // Broken chords, quietly underneath.
    {
      distortion: 10,
      volume: 3,
      decay: 0,
      notes: `
        A3 C4 E4 C4 A3 C4 E4 C4   A3 C4 E4 C4 A3 C4 E4 C4
        F3 A3 C4 A3 F3 A3 C4 A3   E3 G3 B3 G3 E3 G3 B3 G3
        A3 C4 E4 C4 A3 C4 E4 C4   D3 F3 A3 F3 D3 F3 A3 F3
        A3 C4 E4 C4 E3 G#3 B3 G#3 A3 C4 E4 C4 A3 -- -- --
      `,
    },
    // The bass.
    {
      distortion: 10,
      volume: 6,
      decay: 12,
      notes: `
        A2 -- -- -- E3 -- -- --   A2 -- -- -- E3 -- -- --
        F2 -- -- -- C3 -- -- --   E2 -- -- -- B2 -- -- --
        A2 -- -- -- E3 -- -- --   D3 -- -- -- A2 -- -- --
        A2 -- -- -- E2 -- -- --   A2 -- -- -- -- -- -- --
      `,
    },
  ],
}
