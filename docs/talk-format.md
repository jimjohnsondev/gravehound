# The `.talk` dialog format

Dialog lives in `src/game/talk/*.talk` files. They read like a script and are
meant to be written by hand.

The format is **flat**: nothing is indented, nothing jumps, and a scene always
plays from top to bottom. A choice never changes where the scene goes. It can
change a flag or counter, and later lines can check what was picked.

## The rules

| You write | Meaning |
| --- | --- |
| `== supper ==` | Starts a **scene**. Game code chooses which scene to play. One file can hold several. |
| `WREN: Happy birthday, love.` | A **spoken line**. Each line is one box; A moves on. Long lines carry on over more pages. |
| `WREN (worried): You're pale.` | A line with an **expression**. It sticks to that speaker until you change it, and resets to `neutral` at the start of each scene. |
| `Honey cakes cool on the table.` | **Narration**: any line that doesn't start with `NAME:` in capitals. No portrait. |
| `{hero}` | The player's chosen name. `HERO:` as a speaker shows it too. |
| `* "Thank you, Gran."` | A **choice**. Consecutive `*` lines make one menu (at most 4). Quotes mean he says it; no quotes means he does it (`* Let Ash out.`). A blank line ends the menu. |
| `* father: "What was he like?"` | A choice with a **label**: a lowercase word and a colon. |
| `* "…" [set maren_affection + 1]` | A choice that changes a flag or counter when picked. |
| `[if picked father] WREN: Stubborn.` | Only plays if that choice was picked **in the most recent menu**. |
| `[if ledger_read] …` | Only plays **if** the condition holds. Works on any line: spoken, narration, a choice, or a command. |
| `[set got_knife]` / `[clear got_knife]` | Turn a **flag** on or off. |
| `[set maren_affection + 1]` / `[set tobin_mood = 3]` | Change a **counter**. Unset flags are off and unset counters are 0. |
| `[background cottage_hearth]` | The full-screen **background** behind the portraits, until the scene ends. |
| `[give fathers_knife]` / `[do bar_door]` | Hand the hero an item, or run a named **game action**. |
| `# note to self` | A **comment**. |

**Conditions** can use `and`, `not`, and `= != < <= > >=`, for example
`[if maren_affection >= 2 and not took_tobins_coin]`. There's no `or`: write a
line for each case. Stats like `heart` can be checked but not changed.
`seen supper` is true once that scene has played to the end.

**Story events are flags.** Game code sets one when the event happens (for
example `ledger_read`), and dialog checks it with `[if ledger_read]`.

A reply that's several lines long repeats its `[if picked …]` on every line.
That's the price of keeping every line readable on its own.

## Where names are declared

Every name a `.talk` file uses has to be declared first. The game checks all
dialog when it starts and stops with the file and line number if something
doesn't match, for example:

```
cottage.talk line 31: unknown expression "angy" for WREN (has: neutral, happy, worried, sad, afraid)
```

| Name | Declared in |
| --- | --- |
| Speakers and their expressions | `src/game/cast.js` |
| Flags, counters, stats, items | `src/game/story-flags.js` |
| Actions for `[do …]` | `src/game/talk-actions.js` |
| Backgrounds | `src/game/backgrounds.js` |
| `.talk` files themselves | `src/game/talk/index.js` |

## Trying a scene

In the browser console, `gravehound.world.talk('wedding_portrait')` plays a
scene. Set flags first to see other lines, for example
`gravehound.world.story.set('ledger_read')` or
`gravehound.world.story.setNumber('heart', 2)`.

See `src/game/talk/cottage.talk` for a full example: the birthday supper.
