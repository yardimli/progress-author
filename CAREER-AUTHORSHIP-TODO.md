# Career and authorship implementation checklist

Implementation in progress. This supersedes the direction in GAMEPLAY-REBALANCE-PLAN.md. Keep the slider: employment funds the transition into authorship, and successful writing should ultimately generate most income. Use Knight's coherent career loop, not necessarily its exact numbers. See [the source comparison](PROGRESSION-COMPARISON.md).

**Required pacing:** the full game spans many retirements. A first life establishes an author, not completion of all careers, upgrades and author milestones. Financial independence is an intermediate achievement. Later lives must make earlier progress faster while introducing goals that were unreachable in the first life.

### Implemented foundation

- [x] Extract existing shared XP, inheritance, salary/upkeep scaling, writing-speed, royalty and purchase controls into `BALANCE` in `js/state.js`, retaining current numeric defaults. Individual salary/upkeep ladders remain in the JSON data.
- [x] Add a seeded headless runner using production formulas and isolated balance overrides; compare strategy/author policies over actual retirements, never synthetic inherited levels at a time cap.
- [x] Add continuous writing with save/load, offline progression, explicit stop-after-current-book, missing-genre handling and retirement/reset checks.
- [x] Remove the dormant Inspiration-potion cash top-up.
- [x] Record a 13-run, three-author baseline matrix plus ten consecutive ordinary retirements for the mixed policy; document results and policy limitations in [reports](reports/README.md). All 53 automated tests pass for this first batch.

### Career candidate implemented

- [x] Local-only `?balance=career` preview with separate saves, version acknowledgement and tab ownership; excluded from play analytics.
- [x] Candidate salaries, Knight XP curve, uncapped career XP, inherited level/10, creative-pay skill benefit and retirement-gated endgame.
- [x] Eighteen upgrade cards, exclusive replacement tiers, explicit cost/effect types, and migrated legacy equipment/job data with a backup.
- [x] Browser smoke check of preview startup, reload, upgrade catalogue, tool details and writing controls; 61 automated tests pass.

Released locally as version 2.0.0: the normal game now loads the career/authorship profile and 18 upgrades. Readership, declining sales, paid editing, opt-in career/training automation and the sustained-income milestone are enabled by default. The localhost preview remains a separate testing save. Broader author milestones and further balance playtesting remain open. Source: `data/career-profile.json`; [writing implementation report](reports/WRITING-PREVIEW.md).

### Current scope — retirement work deferred

At the user's request, do not further redesign retirement gates, lifespan, inheritance or prestige in this batch. Existing retirement behaviour remains; the new readership is current-life progress and resets alongside the existing book catalogue. Audience inheritance and author legacy decisions remain deferred.

- [x] Implement finite per-book sales, current-life readership, paid editing and explicit free/pause fallback.
- [x] Share preview time advancement online/offline, integrate sales exactly and preserve static journal entries.
- [x] Add one-time old-royalty migration with backup and a bounded one-year transition.
- [x] Expose audience, launch estimates, current book receipts and editor controls; verify the preview loads in the browser.
- [x] Compare four writing allocations over two existing lifetimes; keep this an initial balance measurement, not endgame approval.

## 1. Establish the balance model

- [x] Centralize salary, XP, inheritance, upkeep, writing-speed and book-sales constants in a balance configuration.
- [x] Build a deterministic simulation using actual game formulas. Compare job-only, writing-heavy, mixed and job-first-then-transition strategies across author traits and multiple lives.
  - Current revision has a three-author, four-policy, two-life matrix plus paid-editing, ordinary-career, targeted-training, acceleration and limited-catalogue controls. A separate ten-life transition run records first discovery and independence. See `reports/CAREER-REVISION.md`.
- [x] Measure time to first publication, promotions, sustainable housing, writing-income majority and retirement. Track income by source, costs, savings and active upgrades.
  - Actual journal-event accounting separates editor fees and checks cash reconciliation. Sustained housing requires 365 game days without bankruptcy. General, creative and ordinary career controls and promotion-targeted training are measured; these remain heuristics rather than optimal-play claims.
- [x] Use Knight salary/upkeep/XP proportions as a control, not release values. Recalculate the ladder after removing intermediate upgrades.
- [x] Set provisional ordinary-speed first-life targets after baseline measurement in `reports/balance-targets.json`: first promotion 1–4 minutes, first publication 1.5–5 minutes, sustained paid housing 7–25 minutes for the stated policies. These are playtest targets, not release approval; acceleration/inherited comparisons remain separate and pending.
- [x] Define and share the preview's rolling-year operating-income test between game and simulator: sales after editing cover upkeep and exceed actual wages and available full-time employment. Record first qualification and qualifying game-day duration. Tool purchases remain separate cash investments, not amortized operating costs.
- [x] Confirm ongoing publications can sustain a successful author while a handful of early books cannot fund all future upgrades forever. A deliberate transition away from employment is intended.
  - Three-book controls stop earning. The current ten-life transition policy sustains strict independence for multiple game years beginning in life two; not every later life qualifies. Broader playtesting and late audience/wage tuning remain open.
- [x] Measure ten consecutive actual retirements under existing rules, recording first discovered career/upgrade access and author milestones in `reports/career-revision-ten-lives.json`.
- [ ] Set new life-count targets from those observations when retirement work resumes; deliberately deferred, not treated as validated endgame pacing.
- [x] Existing endgame career/upgrade retirement gates prevent first-life completion even with extreme wealth/levels; measured promotion-targeted and accelerated controls also remain short of completion. Future author endgame goals and their retirement targets remain deferred.
- [ ] Specify what persists at each retirement type: inherited training, author legacy/fame, badges and any audience carryover. Reset current-life books, salary, cash and active readership consistently; avoid both permanent runaway royalties and a meaningless total reset.
- [ ] Make retirement useful before exhaustion: preview retained benefits and the next-life opportunity. Verify that staying indefinitely to stack lifespan boosts does not bypass intended generational progression.

## 2. Career, allocation and skills

Files: `data/jobs.json`, `data/skills.json`, `js/classes.js`, `js/formulas.js`, `js/mechanics.js`.

- [x] Rebuild pay, promotion requirements, XP costs and upgrade effects together. Fix advanced entry roles that pay less than starting work without a compensating benefit.
- [x] In the candidate, keep job income and job XP proportional to work allocation, including when no manuscript is active. Independent skill training stays active at both endpoints.
- [x] Keep ordinary jobs competitive through wages/easier entry. Give creative jobs modest transferable craft/life-experience benefits, earned through progress rather than merely selecting a job.
- [x] Replace the selectable Full-Time Author job and its unconditional ×5 writing bonus with an earned authorship milestone. End/rename the employment branch with a salaried role if needed; authorship must not require completing that branch.
- [x] Candidate effects use explicit identifiers; the normal game retains a compatibility translation for old data. Focus improves skill XP; Time Management job XP; Frugality ongoing costs; Meditation inspiration.
- [x] Give Typing Speed a creative-wage benefit in the candidate alongside manuscript speed; preserve distinct craft/training roles and test ordinary wages remain unaffected.
- [x] Separate career XP scaling from writing-quality/speed diminishing returns. Test inherited level/10, removal of the career XP soft cap and revision of the ×0.4 baseline together with the level-cost curve. Do not keep enormous XP requirements without sufficient acceleration.
- [x] Candidate business skills use publication and retirement milestones instead of Head of Publishing requirements. Ordinary promotions do not require books.
- [x] Audit prerequisites for circular dependencies and ensure equipment changes cannot erase learned skill progress.
- [x] Add opt-in promotion within the selected branch and priority-based skill training. Automation never changes the time allocation without player instruction.

## 3. Reduce 37 upgrade cards to 18

Implemented in the default game: retain 18 cards, turn Editor into a per-book service, and retire 18 redundant cards. `data/items.json` is the canonical reduced catalogue; `data/items-legacy.json` is retained only for historical simulations and migration fixtures. Removed multipliers are not all transferred to replacements.

| Group | Keep | Intended role |
| --- | --- | --- |
| Homes: 6 | Homeless, Rented Room, Studio, Suburban, City Penthouse, Mansion Estate | Exclusive comfort/inspiration ladder with meaningful upkeep; avoid independent quality, speed and XP boosts on every home |
| Transport: 3 | Walking, Bus Pass, Used Car | Exclusive job-XP tiers; no direct writing bonus |
| Learning: 2 | Planner, Home Library | Early/late general skill training; replacement tiers |
| Career support: 1 | Premium Briefcase | Job XP |
| Craft training: 2 | Library Card, Masterclass Subscription | Accessible early craft learning and stronger paid tier; replacement tiers |
| Writing tools: 2 | Used Laptop, Pro Writing Software | Replacement manuscript-throughput tiers; optional typing-training support |
| Writing space: 1 | Home Office | Optional writing-speed investment with upkeep |
| Revision support: 1 | Style Guide | Modest craft/quality benefit, distinct from throughput |

| Retire/move | Replacement or reason |
| --- | --- |
| Large House, Private Villa | Shorter housing ladder |
| Bicycle, Scooter | Early transport merged into Bus Pass progression |
| New Car, Private Driver, First Class Flights, Private Jet | Shorter transport ladder; remove repetitive late job-XP boosts |
| Mini Fridge, Ambient Lighting, Coffee Machine, Ergonomic Chair | Comfort supplied by housing |
| Standing Desk Converter, Noise-Canceling Headphones, Focus Supplements | Learning supplied by Planner/Home Library; writing-space role by Home Office |
| Mechanical Keyboard, Dual Monitors | Tool progression supplied by Used Laptop/Pro Writing Software |
| Networking Membership | Author-business progression supplied by skills/readership |
| Editor | Optional editing service charged once per manuscript, with an automation preset |

- [x] Change `data/items.json`, effect wiring, requirements, categories and tooltips. Search all 37 old names for hardcoded references before removal.
- [x] Candidate replacement groups contribute effects/upkeep only from the active tier; standalone supports can combine.
- [x] Candidate Typing Speed unlocks at Focus 7, independently of equipped tools.
- [x] Candidate career/shared tiers use upkeep without purchase deductions; most cash gates start at 100 days of upkeep, with the first room at 50 days. Total affordability remains under tuning.
- [x] Candidate writing tools use explicit prices and craft/publication gates, without higher cash unlock thresholds. Recurring upgrades declare an upkeep cost model.
- [x] Distinguish eligibility, ownership and active equipment. Define insolvency fallback to free tiers/paused optional services without losing the manuscript.
- [x] Retain retired assets and reuse existing art; update the retired Large House achievement reference for the candidate.

## 4. Writing grows into the main livelihood

Files: `js/state.js`, `js/formulas.js`, `js/mechanics.js`, `js/writing-plan.js`; optionally a dedicated book-sales module.

- [ ] Add readership earned through publications, quality and genre fit. Distinguish audience from existing fame/prestige; define reset/inheritance rules without adding several new currencies.
- [x] Store preview sales start, duration, launch rate and receipts; use audience/quality/approach, independent of current job and slider.
- [x] Preview books decline linearly to zero over 730 game days; integrate the finite sales pool exactly.
- [ ] Keep books in the library after sales end. Continuing releases and readership growth should sustain independence and eventually outperform feasible employment.
- [ ] Rebalance existing quality, commercial/crafted approaches, genre fit, editorial choices and publication-count contracts together. Avoid instant quality saturation and double-counted rewards.
- [x] Add optional paid editing, locked quote, +25% raw-quality benefit and a free publication path. Cover/promotion budgets are not added.
- [ ] Add indefinite writing through a serializable queue mode, retaining genre, approach, editorial and service presets. No blocking prompts between books.
- [ ] Stop on manual stop/retirement; pause for unmet prerequisites. At zero writing allocation leave the queue armed without spinning or completing books.
- [x] Wait for editing funds by default without pausing the game; allow an automatic or manual free release; charge once per manuscript.

## 5. Saves, time progression and accounting

Files: `js/main.js`, `js/offline.js`, `js/save.js`, `js/state.js`, `js/journal.js`.

- [ ] Use the same game-time sales calculation online/offline. Integrate across publications, sales changes, year boundaries, potion expiry and retirement rather than applying the ending royalty rate to a whole interval.
- [ ] Guarantee exactly-once receipts, readership awards and service charges across save/load/import, offline catch-up and duplicate-tab handover.
- [ ] Add an idempotent versioned migration for removed items, active tiers, old Full-Time Author selection, royalties, manuscripts and queues.
- [ ] Keep a pre-migration backup/export and explain the optional restart. Define replacements/refunds per retired item; distinguish actual purchases from grandfathered ownership to prevent unearned refunds.
- [x] Old preview royalties receive a one-year declining transition at their existing initial rate. Unrecorded historical receipts are marked unknown; existing journal history is retained.
- [x] Preview sales migration bypasses the old royalty top-up and cannot restart the sales term on reload.
- [x] Editing charges use immediate static expense entries with remaining cash; work/sales/upkeep keep existing year-end summaries and filters.
- [x] Preview stores at most 366 daily finance rows separately from the journal; completed-day rolling totals distinguish gross sales, editing, upkeep, actual wages and available full-time wage benchmarks.
- [x] Remove/guard the dormant Inspiration-potion cash top-up. Existing ×6 checks still pass; new balance tuning will use ordinary speed.

## 6. Interface, descriptions and documentation

Files: `index.html`, `css/`, `js/ui_builder.js`, `js/ui_updater.js`, `js/ui_modals.js`, `js/experience.js`, `js/chart.js`.

- [ ] Explain the goal in onboarding: work funds today's bills; craft and readership build financial independence through writing.
- [x] Preview daily wages, sales, upkeep, signed net cash, pending editing reserve and finite-sales savings runway beside the slider; manuscript ETA remains in the writing dashboard. Forecast updates once per second or immediately on allocation changes.
- [ ] Show readership, career/craft progress and income-source history in Stats. Make charts responsive and readable in both themes.
- [ ] Show book age, current income, lifetime earnings and sales-ended status in the library.
- [x] Preview Full-Time Author milestone requires 365 observed completed game days: editing-adjusted book receipts cover upkeep and exceed actual wages and available full-time employment. Award once per life through the inbox; keep status visible beside the budget.
- [ ] Show upgrade replacement behaviour, marginal benefits and resulting budget. Explain job/writing/shared effects from the same structured data used by calculations.
- [ ] Preserve always-visible manuscript preview, typewriter animation, once-per-second progress text/bar updates, responsive sticky headers, journal navigation and non-blocking inbox.
- [ ] Update goals, achievements, help, `BALANCE.md`, release notes and cache/version identifiers when shipped. Keep source comparison tables as a historical baseline.

## 7. Delivery and verification

- [ ] A: configuration and deterministic baseline measurements.
- [x] B: coordinated career/skill/XP/upkeep candidate plus reduced catalogue in an isolated test configuration. Balance and release validation remain open.
- [ ] C: readership, declining sales, optional services and indefinite writing; re-run strategy comparisons before fixing values.
- [ ] D: interface, migrations and lifecycle verification; release a coherent economy update rather than isolated price changes.
- [ ] Test slider endpoints/intermediate allocations, replacement effects, insolvency, migration twice, save/import, rebirth and finite/infinite queues.
- [ ] Compare equal elapsed time online/offline across publication/year/retirement boundaries; check large catalogues without unbounded DOM work.
- [ ] Playtest a fresh life without debug shortcuts/acceleration and inherited lives. Confirm several reasonable transition points, early job usefulness, eventual writing dominance, and recovery after overcommitting time to writing.
- [ ] Verify desktop/mobile, keyboard/touch and light/dark themes. Record measured outcomes and unresolved tuning issues rather than treating passing code tests as proof of balance.

### Planning and automation batch

- [x] Add opt-in better-paying promotions within the selected career branch and lowest-level training within the selected skill category. Respect discovery and requirements; never change allocation or buy equipment.
- [x] Run automation on game-day boundaries through the shared preview online/offline stepper; persist preferences and clear them at the existing lifetime reset.
- [x] Add regression coverage for declining-sales runway, editing reserves, bounded daily accounting/reload, sustained-income qualification, automation gates/category and reset.
- [x] Add ordered target-level and next-promotion prerequisite automation; measure paid-editor and promotion-focused training policies. Final release playtesting remains pending.

### Sections 1–3 revision status

The measured preview was promoted to the default game in version 2.0.0 on 2026-09-18. This is not proof of optimal balance. Current salary/XP changes, 18-item prices and measured tradeoffs are documented in [the revision report](reports/CAREER-REVISION.md). Retirement targets/persistence redesign and retirement UI remain deferred by user request.

- [x] Preserve the old item dataset for historical fixtures; default catalogue has 18 retained assets and explicit effect/cost models.
- [x] Audit all removed item references: legacy tooltip entries intentionally remain, Landlord is mapped to Suburban, and former Editor ownership maps to Style Guide access.
- [x] Verify desktop and narrow-screen controls, target add/remove, upgrade budget details and no browser console errors.
- [ ] Continue broader light/dark/device playtesting and refine late audience growth, employment benchmarks and progression variance after rollout.

### Version 2.0.0 rollout

- [x] Load the career/authorship rules and 18-item catalogue on the ordinary URL and public hosts.
- [x] Explain the conversion in the one-time version notice; preserve separate preview saves.
- [x] Back up existing saves before converting equipment and legacy royalties; preserve unfinished manuscripts, queues, money and levels; verify migration is idempotent.
- [x] Verify ordinary startup and main-save migration with production code; retain retirement redesign as deferred work.
- [x] All 88 tests pass; data audit confirms 20 jobs, 17 skills and 18 upgrades with no errors. Normal URL browser check confirms version choice, keeping progress and reload without a repeated prompt or console errors. Existing save reached its retirement boundary; no retirement was triggered by the verification.
