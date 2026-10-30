# Sound

The game's sound comes from a chip modelled on the Atari POKEY
(`src/engine/pokey.js`). It has four channels: songs use the first three, and
sound effects use the last.

## Songs

Each song is a file in `src/game/music/`, registered in `music/index.js`. A map
picks its song with `music: 'hearth'`. Walking between two maps with the same
song keeps it playing.

```js
export const hearth = {
  stepsPerSecond: 5,
  channels: [
    {
      distortion: 10,   // 10 is a pure tone; see the table below
      volume: 7,        // Where each note starts, 0 to 15
      decay: 8,         // Updates (60 a second) per drop of 1 in volume. 0 holds steady.
      notes: `
        A4 -- C5 -- E5 -- .. ..
      `,
    },
  ],
}
```

| You write | Meaning |
| --- | --- |
| `A4`, `G#3` | Start a **note**. There are sharps but no flats. |
| `--` | **Hold** the note before it for another step. It needs a note to hold, so it can't start a channel or follow a rest. |
| `..` | A **rest**. |

Line breaks and extra spaces don't matter, so lay a song out in bars. Every
channel must have the same number of steps, and the song loops at the end.

The game checks every song and sound effect when it starts, and stops with a
message if one can't be played, such as a misspelt note, channels of different
lengths or a volume above 15.

## Distortions

| Number | Sound | Good for |
| --- | --- | --- |
| 10 | Pure tone | Tunes and basses |
| 12 | Buzz, from the 4-bit counter | Low, growling basses |
| 2 | Rough, from the 5-bit counter | Engines, drones |
| 4 | Harsh, from the 4-bit and 5-bit counters | Machines, alarms |
| 8 | Hiss, from the 17-bit counter | Wind, footsteps, doors |
| 0 | Crackle, from the 5-bit and 17-bit counters | Fire, static |

The real chip's settings 6 and 14 are left out because they repeat 2 and 10.

Notes are slightly out of tune, especially high ones, because the chip can only
divide its clock by whole numbers. That's part of the sound.

## Sound effects

Effects are in `src/game/sound-effects.js`. Each row is one game update (1/60 of
a second) of `[divider, distortion, volume]`. A lower divider is a higher note.
Starting an effect cuts off the one before it.

```js
cursor: [[60, 10, 7], [60, 10, 5], [60, 10, 2]],
```

Play one from game code with `this.sound.play('cursor')`.

## Trying sounds

Browsers stay silent until the player touches the page, so click the game first.
A gamepad press may not count, so the menu shows a hint until sound has started.
Then, in the browser console:

```js
gravehound.sound.play('chest')
gravehound.sound.playSong('dusk')
```
