# Rebuilding the Author’s Journey progression loop

> Superseded design proposal. Use [the career and authorship implementation checklist](CAREER-AUTHORSHIP-TODO.md) for current work: retain the slider and make writing the eventual main livelihood. Parallel writing, the Full-Time Author salary proposal and this document's item mapping are not the current direction. Numerical tables below remain historical simulation controls only.

Analysis and proposals only. No gameplay files were edited. See [the complete source comparison](PROGRESSION-COMPARISON.md).

## Assessment of the feedback

The feedback identifies a real structural problem. Jobs already contribute prerequisites, inherited XP and life-experience bonuses, so they are not literally just money. However, allocating more time to books reduces both salary and job XP, while published royalties remain until rebirth. The new-book catalogue penalty slows accumulation but does not retire existing income. This encourages switching toward writing once a backlist can support upkeep. That strategic transition could be intentional, but it conflicts with a Knight-style career loop if career advancement is meant to remain central.

The recent 20%-of-unlock purchase formula did not fix the upkeep loop. It imposed a cash deduction while leaving wildly different reserve-to-upkeep ratios. It was an incomplete balance change. Purchases can still compete for cash, and Rented Room is a meaningful early expense, so “every purchase is negligible” is too broad. The strongest evidence is that Used Laptop leaves 6,667 days of its upkeep in reserve at unlock, while Home Library leaves 200,000. Knight generally leaves 100. Those are single-item runway calculations, not overall household budgets.

All 20 job base XP coefficients were copied unchanged. Knight common-job wages grow ×30, specialist wages ×10,000 and advanced wages ×10,000. Author’s corresponding growth is ×5, ×17.5 before the zero-pay full-time role, and ×100. Author also globally softens XP, halves the inherited-level coefficient, and applies baseline ×0.4 to job/skill XP. The level-cost curve has also changed, so no one multiplier alone predicts completion time. These systems must be tested as a whole.

## Recommended direction

Keep the loop **train skills → advance careers → earn more → sustain stronger upgrades → train faster**. Let books contribute to that loop rather than replace it.

1. **Remove the work/writing time split.** Keep one active job and one active skill as in Knight; run one manuscript alongside them. Manuscript progress depends on craft skills, life experience and equipment. Career selection becomes an income/progression decision again, without losing the writing system.
2. **Give publications progression value.** Add book-count/quality requirements to selected creative promotions and important writing equipment. Use existing publication records and fame rather than introducing another currency. Each new career tier must improve earning power or provide an explicit useful benefit. Avoid a gate that requires equipment only unlocked by that same promotion.
3. **Make book cash rewards finite.** Replace permanent royalty accumulation with a bounded sales contract per book, such as a fixed game-year term or a total sales pool. Keep the book in the library after the contract ends. A publish advance plus a finite tail is easier to reason about than permanent income. Calibrate against career-tier wages; do not use a hidden salary-relative cap that retroactively changes an old book’s earnings.
4. **Use upkeep as the primary spending decision.** For the first reference-balance pass, remove the new upfront deduction and restore coherent operating costs. Reveal paid upgrades near a reserve of about 100 days of their upkeep, as Knight does. Some options should be affordable from savings but unsustainable on the current job, making temporary use a real choice. Cost reductions should matter. Show net income and runway before activation.
5. **Restore the career pay ladder together with upgrade costs.** Use a single currency scale for the initial reference model, then tune the author-specific additions. Do not paste the much larger upkeep ladder into today’s compressed salaries. A salary baseline and housing ladder are below.
6. **Restore explicit skill roles.** Focus → skill XP; Time Management → job XP; Frugality → upkeep; Meditation → inspiration. Typing Speed can improve creative-job pay as well as manuscript speed, replacing the missing Strength-to-specialist-pay connection. Grammar & Prose → creative XP and quality; Character Development → Typing XP and quality; Plotting → literary XP and quality. Make these links explicit in code rather than dependent on matching description strings.
7. **Restore meaningful later-life acceleration.** Test the reference model without the global career-XP soft cap and with Knight’s inherited coefficient (max level/10). Keep writing-quality/speed diminishing returns separate. Reassess the extra ×0.4 XP factors as part of that same simulation. If retaining softened XP, reduce job base costs accordingly; do not retain trillion-XP jobs without sufficient acceleration. Reconsider Head of Publishing 100–120 as an additional gate for all six business skills; fame/prestige should open that layer earlier.
8. **Add an opt-in “Keep writing” queue.** Unlimited manuscripts should continue the saved plan and stop on retirement, manual stop or an unmet prerequisite. Editorial choices must never block automation; use a saved default. Continue offline under the existing cap. Use a serializable mode flag, not JavaScript Infinity, in the save.
9. **Restore useful job/skill automation.** Knight unlocks auto-promote and auto-learn at age 20. Offer promotion within the selected career and training toward selected requirements or excluding chosen skills. Active play should be choosing priorities, not repeatedly restarting the same task.
10. **Reduce passive item stacking.** Keep one home and one transport. Group extra equipment into replacements or a few loadout slots so 37 items do not become 37 automatic stacking purchases. Old/new ownership migration needs to preserve player value. Start by testing the 16 functional reference roles, then add author-specific equipment only where it creates a distinct decision.

If upfront purchases are retained instead, remove the separate higher cash-balance unlock for those items: unlock by career/skill/publication milestones, charge the price, and reserve upkeep for meaningful ongoing services. That is a valid alternative, but less directly comparable to Knight and should not be mixed into the first reference test.

## Numerical reference model — not a finished balance

Multiply EVERY Knight money amount by 8 to keep the Author starting wage at 40 instead of Knight’s 5. Uniform conversion preserves the reference income/upkeep/reserve ratios before author-specific bonuses and books. These tables are a control model for simulation, not values proven suitable for release. The current Author trait multipliers, item effects, XP curve, books and time rate mean money scaling alone cannot reproduce Knight pacing.

### Salary control values

| Author job | Current base pay/day | Knight-derived control pay/day |
| --- | --- | --- |
| Gig Worker | 40 | 40 |
| Food Service | 70 | 72 |
| Delivery Driver | 100 | 120 |
| Warehouse Worker | 130 | 320 |
| Office Temp | 160 | 640 |
| Personal Assistant | 200 | 1,200 |
| Intern | 40 | 40 |
| Blogger | 80 | 400 |
| Content Creator | 150 | 960 |
| Copy Editor | 220 | 2,400 |
| Staff Writer | 300 | 8,000 |
| Senior Editor | 450 | 24,000 |
| Ghostwriter | 700 | 120,000 |
| Full-Time Author | 0 | 400,000 |
| C.W. Student | 30 | 800 |
| Junior Agent | 180 | 8,000 |
| Senior Agent | 350 | 60,000 |
| Publisher | 600 | 400,000 |
| Literary Titan | 1,500 | 2,000,000 |
| Head of Publishing | 3,000 | 8,000,000 |

Full-Time Author needs a clear model: in this control, its pay represents contracted professional writing income, with manuscript sales balanced separately. Keeping its current zero salary and unconditional ×5 manuscript bonus would make it a different system; do not call that a straight reference match.

### Housing control values

| Author home | Current upkeep/day | Control upkeep/day | Control cash unlock | Control upfront price | Control inspiration |
| --- | --- | --- | --- | --- | --- |
| Homeless | 0 | 0 | Default item* | 0 | ×1 |
| Rented Room | 30 | 120 | Default item* | 0 | ×1.4 |
| Studio | 75 | 800 | 80,000 | 0 | ×2 |
| Suburban | 120 | 6,000 | 600,000 | 0 | ×3.5 |
| Large House | 250 | 24,000 | 2,400,000 | 0 | ×6 |
| City Penthouse | 600 | 200,000 | 20,000,000 | 0 | ×12 |
| Private Villa | 2,000 | 2,400,000 | 240,000,000 | 0 | ×25 |
| Mansion Estate | 5,000 | 40,000,000 | 4,000,000,000 | 0 | ×60 |

*The reference Shop unlock would be 6,000 (750 × 8). Starting equipment remains available. Homes replace one another. Changing the effect ladder as well as prices is essential: the current free Homeless ×1.6 bonus is already stronger than Knight’s first paid home ×1.4.

### Miscellaneous control roles

| Reference role | Closest Author item | Control upkeep/day | Control cash unlock | Control effect |
| --- | --- | --- | --- | --- |
| Book | Planner | 80 | Default after Shop | ×1.5 Skill xp |
| Dumbbells | Mechanical Keyboard | 400 | 40,000 | ×1.5 Strength xp |
| Personal squire | Premium Briefcase | 1,600 | 160,000 | ×2 Job xp |
| Steel longsword | Missing creative-XP equipment role | 8,000 | 800,000 | ×2 Military xp |
| Butler | Coffee Machine | 60,000 | 6,000,000 | ×1.5 Happiness |
| Sapphire charm | Masterclass Subscription | 400,000 | 40,000,000 | ×3 Magic xp |
| Study desk | Focus Supplements | 8,000,000 | 800,000,000 | ×2 Skill xp |
| Library | Networking Membership | 80,000,000 | 8,000,000,000 | ×1.5 Skill xp |

All control miscellaneous upfront prices are zero. Translate Military XP to Creative Industry XP, Magic XP to Writing Craft XP, Strength XP to Typing XP and Happiness to Inspiration. These role translations are hypotheses to test, not exact equivalence. Reassigning Planner to the early Book role would require changing its current unlock as well as its numbers.

## Practical implementation order

1. Build a separate reference balance data set and deterministic simulation, leaving live saves untouched while comparing. Measure first promotion, first sustainable home, affordable skill equipment, next career branch, retirement, and inherited gains over several lives.
2. Change the career/skill/pay/upkeep/XP model together. Check net income with all affordable gear, not just each item in isolation.
3. Integrate parallel writing, finite sales contracts and publication gates. Compare job-only, writing-heavy and mixed-choice policies; check whether a single strategy dominates all milestones.
4. Add infinite writing and job/skill automation. Test save/reload, offline processing, retirement and missing genre/book data.
5. Migrate existing purchases and royalties explicitly. Preserve a backup/export path and offer a fresh run; do not silently remove bought items or lifetime royalty balances.

## Code findings to keep separate from design claims

- A legacy Inspiration-potion branch in drinkPotion() raises cash to 20,000. Current potions.json exposes only Acceleration, so this is dormant code, not evidence that ordinary players currently receive the top-up. Remove or guard it before future potion testing.
- The Knight source has no upfront deductions in setProperty()/setMisc(); its UI checks whether the player can cover one day of upkeep. The older local markdown description calling items “purchased” is misleading.
- Jobs already supply life-experience bonuses and prerequisite levels. Keep those useful author-specific links when changing the money loop.
- An infinite queue solves repetitive clicking; it does not itself solve runaway lifetime royalties. Ship it with a deliberate money model.

## Validation of this report

The extraction script verifies source counts (20/17/16 vs 20/17/37), extracts 64 Knight requirement definitions, checks all 20 matched job XP coefficients, covers all Author skills/items, and writes the tables from source values. It reads literal data and requirement expressions in an isolated VM; it does not launch either game or edit game balance. These are structural findings, not a claim of completed career simulation.
