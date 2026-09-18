# Player-feedback update — September 2026

## Isolated career candidate

The preview now includes [readership, finite sales and optional editing](reports/WRITING-PREVIEW.md). Its retirement redesign is deferred. Earlier career-only measurements remain historical references; use `writing-sales-candidate.json` for the first combined-economy measurements.

The normal-game values below are unchanged. On localhost only, add `?balance=career` to open the candidate. Its save, version acknowledgement and tab lock are separate; analytics are disabled. It combines new salary/upkeep ladders, 18 upgrades, Knight-style XP/inheritance and the writing model linked above. These remain candidate values, not a release balance.

## Pace and progression

Normal time advances three game days per real second: about 101 minutes for an unextended lifetime from age 20 to 70. Acceleration remains exactly ×6 for ten real minutes. Localhost/loopback unlocks it immediately; other hosts require 600 seconds of active visible play. Away time does not unlock it or count toward active-play analytics.

The early XP discount remains: the original curve times `(1 + level / 100) × (0.3 + 0.7 × (min(level, 40) / 40)^1.5)`. Levels 40–100 retain previous costs. Above 100, cost is anchored at level 100 and grows by `((level + 1) / 101)^1.2`, avoiding exponential walls. Inherited maximum levels still grant `1 + maxLevel / 20` experience before existing diminishing returns above ×4.

The regression simulation trains Gig Worker and Focus together for 100 minutes, without author bonuses, purchases, books, potions or task switching, then repeats with the attained levels inherited:

| Milestone | First life | Next life |
| --- | ---: | ---: |
| Job level 10 | 56 seconds | 19 seconds |
| Skill level 10 | 106 seconds | 38 seconds |
| Job level 20 | 307 seconds | 102 seconds |
| Skill level 20 | 540 seconds | 201 seconds |
| Final job / skill levels | 52 / 46 | 75 / 62 |

This is a repeatable baseline, not proof that every career or strategy is balanced. Full-career player testing remains necessary.

## Books and authorship

New first, second and third manuscripts are capped at 12,000, 18,000 and 24,000 words. Existing manuscripts keep their saved/original length. Starting at zero writing allocation sets it to 30%; other allocations are preserved. At baseline 30 words/game day and normal time, 12,000 words take about 133 seconds before other bonuses or editorial changes.

Players choose a title, protagonist, theme, ending and approach. Story choices shift scene composition targets, exposed in scene tooltips. Story outlines and decisions persist in publication records and the journal. The manuscript preview stays visible. Its illustrative prose uses the original character-by-character typewriter animation, including pauses, corrections and line returns.

- Balanced: unchanged speed, quality and royalties.
- Commercial: ×1.2 raw speed, ×0.85 quality, ×1.15 royalties.
- Careful revision: ×0.8 raw speed, ×1.35 quality.
- At halfway: keep, revise (+15% length, +25% raw quality), or cut (−10% length, −10% raw quality). No pause or forced popup.
- Queue a fixed number of further books, or choose “until I stop,” in the same genre and approach. Choose “no more books” to stop after the current manuscript. Automatic books keep their drafts unless the player intervenes. Every publication is recorded, including repeat templates. Continuous queues persist across reloads, work offline, wait at zero writing allocation, and reset at retirement.

Speed bonuses precede the existing soft cap, so their final effect can be smaller at high speeds. Equipment and skill quality stacks each use `1 + log2(multiplier)` to reduce early saturation.

New-book daily royalties use `(12 + 0.6 × quality × sqrt(quality / 50)) × readership × contract / sqrt(1 + booksPublished / 5)`, then negotiation, badge and approach bonuses. Readership grows logarithmically with fame. Five and fifteen publications unlock ×1.15 and ×1.30 contracts for future books. With no bonuses, first-book quality 50 earns $42/day; quality 80 earns about $72.72/day. Existing royalties are preserved.

## Upgrade purchases

Eligibility remains progression-based. A new upgrade costs the greater of 20% of its money eligibility threshold or 60 days of base upkeep. Pay once; re-equipping owned items is free, while upkeep continues. Used Laptop costs $5,000 and $3/day. Starting equipment is free. Old unlocked/equipped items migrate as owned without retroactive charges. Rebirth resets ownership.

## Away progress and presentation

Up to eight hours are simulated on return, respecting potion expiry, bankruptcy, queued books, achievements and retirement. A summary enters the inbox; a saved timestamp prevents repeat claims. Web Locks permit one owning tab at a time. Browsers without Web Locks lack this cross-tab guard.

Career, Skills, Upgrades and Writing have separate desktop/mobile screens. The header retains work/training context; secondary resources live in Stats & breakdowns. Achievements show numeric requirements and benefits. Distant categories are optional. Themed tooltips respond to hover, focus and taps. Decorative text retains a visible cursor: `cursor:none` hides the pointer rather than preventing selection.

Unlocks, badges and publications enter the persistent inbox with direct actions. Reading ordinary details and the journal does not pause play; onboarding and major lifetime decisions still pause. Writing counters and bars retain a one-second DOM budget; typewriter prose renders independently when its next character changes. Task bars reuse nodes and animate via transforms.

## Verification

Run `node --test tests/*.test.cjs` and `php tests/stats-test.php`.

Browser checks cover desktop, 390×844 mobile, 640×360 reflow, both themes, keyboard activation, resource/achievement dialogs and duplicate-tab protection. The narrow desktop check approximates the content area at 200% zoom on a 1280×720 display; actual browser zoom and a full assistive-technology audit remain follow-ups.


## Current isolated career revision

See [CAREER-REVISION.md](reports/CAREER-REVISION.md) for actual Knight/control salary and XP tables, the 18-item ladder, all-author two-life comparisons and a ten-life measurement. The preview uses canonical `data/items.json`; ordinary games use `data/items-legacy.json`. This is staged work, not a normal-game economy release. Retirement rules remain unchanged.
