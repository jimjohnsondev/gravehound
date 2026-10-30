---
name: refactor
description: Review and refactor the Gravehound code for simplicity and readability without changing how the game behaves or looks, then prove it with a before/after pixel check. Use this whenever the user asks to refactor, clean up, tidy or simplify the code, reduce complexity, remove nested ternaries or clever constructs, improve or shorten comments, or do a code quality pass, even if they don't say "refactor". Not for new features or bug fixes.
---

# Refactor Gravehound

The owner wants code a person can read and understand; that beats clever.
A refactor here changes how the code reads and nothing about how the game
behaves or looks. Read `CLAUDE.md` first, since its code rules are the standard.

## 1. Review and propose

Read all of `src/` before suggesting anything, because the worthwhile problems
are often repeats across files. Then give the user a plan grouped by theme. Say
plainly when something they asked about isn't there: if there are no nested
ternaries, report that rather than finding something to change.

Look for:

- **Files doing two jobs**, and long functions that hide separate steps.
- **Clever constructs** with a plain equivalent: nested ternaries, boolean
  tricks like `a !== b` for negation, `Object.fromEntries(...map())`, `reduce`
  for simple sums, assignments inside conditions, closures that could be
  functions, `?.` or `??` on values that can't be missing.
- **Magic numbers and raw colours** that should be named, and sums or patterns
  written twice.
- **Dead code:** exports nothing imports, unused typedefs and variables. Search
  for each name before removing it.
- **`CLAUDE.md` rule breaks:** a file not starting with a comment saying what
  it's for, an exported class or function with no JSDoc, story content in
  `src/engine/`.
- **Comments that need outside context.** A good comment makes sense to someone
  who has only this file, and explains why. Reword ones that lean on history or
  other code ("for now", "today", "the same trick X uses"), and cut ones that
  repeat the code.

Leave alone:

- Short, single-level ternaries. They read fine.
- Long but simple data: `font-glyphs.js`, `maps/*`, `.talk` files.
- Drawing numbers in placeholder art (`tiles.js`, `sprites.js`,
  `backgrounds.js`, `portraits.js`). It's throwaway, so naming each number
  doesn't help. Keep the data shapes stable, as `CLAUDE.md` asks.

Line count isn't the goal. Splitting a function can make a file longer and
still be better; say so if it happens.

Fixing a bug is a behaviour change, so don't slip one in. List any bugs you find
separately for the user to decide on.

Wait for the user's approval of the plan before changing code.

## 2. Record the baseline

Do this before the first edit, or there's nothing to compare against.

1. Start a new branch from the current one.
2. Start the dev server with `preview_start` (config name `dev`).
3. Read `.claude/skills/refactor/pixel-check.js`, then paste its contents into
   the browser's `javascript_tool` after reloading the page.
4. Note the `total` it returns. Run it twice after a fresh reload each time: if
   the two totals differ, the check itself isn't reliable, so fix that first.

The script hashes every pixel of the canvas across every map, the banner's
slide, the pause screen, and every line and menu of every dialog scene on
several paths. It needs no browser window to be visible, unlike screenshots.

## 3. Refactor

Work in small themed passes and run `npm run check` after each one. Long edit
scripts are safer saved as a file in the scratchpad than passed inline to Bash.

The script reads these names: `world.maps`, `enterMap`, `talk`, `scenes`,
`draw`, `paused`, `banner.timeLeft`, `story`, and on `dialog`: `active`,
`shown`, `pages`, `page`, `selected`, `timer`, `update`. If the refactor renames
one, update the script to match, and say so in your report.

## 4. Prove nothing changed

1. Reload the page and run `pixel-check.js` again.
2. Compare `total` with the baseline. They must match exactly. A difference is
   a bug in the refactor, so use the per-section hashes to find where, and fix
   it. Don't explain it away.
3. The pixel check never walks anyone, so if movement or collision code changed,
   also drive the hero with fake input through `world.update` and confirm the
   hero and Ash move and face the right way.
4. If dialog parsing changed, run a deliberately broken `.talk` text through
   `parseTalkFiles` and `checkTalk` and compare the errors.
5. Check the browser console for errors, then run `npm run check` and
   `npm run build`.

If any check can't be run, say so in the report rather than implying it passed.

## 5. Report

Lead with whether behaviour is unchanged, giving the before and after hash and
what the check covered. Then list what changed by theme, anything you
deliberately left, and anything not tested (real key presses and real phones
aren't covered by the pixel check).

Don't commit, merge or push until the user asks. Update `CLAUDE.md`'s layout
section if files were added or removed.
