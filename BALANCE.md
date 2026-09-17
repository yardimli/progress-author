# Pacing and presentation update

The calendar now advances one day per real second (previously four). Job pay and
expenses retain their daily values, so both accumulate four times more slowly.
Acceleration multiplies that pace by x6.0 for 10 real minutes. It is immediately available on localhost and loopback hosts. Elsewhere it is discovered after 600 seconds of active, visible play; modal pauses and background time do not count. Playtime is saved across reloads and rebirths, and cleared by hard reset. Legacy saves begin tracking from this update.

XP requirements retain the original curve, multiplied by `1 + level / 100`.
Combined XP bonuses above 4× use a square-root curve. Writing bonuses above
80 words/day grow with diminishing returns and top out at 600 words/day.
Scene clicks add a quarter-day of writing instead of three days; holding still
doubles writing speed. These changes preserve early upgrades while stretching
later milestones.

Each book earns `(12 + 0.6 × qualityPercent)` per day before fame, negotiation
and badge bonuses. Fame contributes `1 + log10(1 + fame)`, providing a useful
early income floor without linear late-game inflation. Existing saved books
receive a one-time top-up, preserving any higher royalties and extra legacy income.
The save format version remains compatible.

Progress bars use persistent elements and transforms on animation frames.
Text, unlock checks and other UI updates run four times per second. Potion labels
change only when their displayed second changes; typewriter nodes are reused.
Autosave serialization is scheduled during idle time with a one-second deadline.
Background frame gaps are capped at 100ms to avoid sudden catch-up bursts.

Run regression checks with `node --test tests/balance.test.cjs`.
This is a first tuning pass; full-career pacing still needs playtesting.

New cards are discovered individually, at least 10 active-play seconds apart across all categories. Starting cards are exempt. Discovered cards remain visible and saved; newly met requirements wait for the next discovery slot. Shared requirement thresholds have also been staggered.
