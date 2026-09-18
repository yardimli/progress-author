# Player-feedback improvement plan

## Next balance revision: careers supporting eventual authorship

The completed items below describe earlier work, not a finished economy. Detailed file changes, item decisions and verification are in [the current implementation checklist](CAREER-AUTHORSHIP-TODO.md).

- [x] Establish balance configuration, simulation and transition targets.
- [x] Rebuild Knight-style careers, skills, XP and upkeep while retaining the work/writing slider.
- [x] Reduce 37 upgrade cards to 18 and move Editor into an optional per-book service.
- [x] Add readership and declining sales so ongoing successful writing becomes the main income.
- [x] Add indefinite writing and opt-in career/training automation.
- [x] Update forecasts, library, sustained-income milestone, help and static financial accounting; broader milestones remain follow-up work.
- [x] Migrate saves and verify early careers, established authors and online/offline progression before release.
- [ ] Require many retirements for endgame completion; measure career/upgrade/author milestones by lifetime and validate inheritance without first-life completion.

Completed foundation for this revision:
- [x] Shared baseline tuning controls and deterministic production-formula simulation.
- [x] Unlimited writing option, persistent queue mode, offline continuation and stopping/retirement safeguards.
- [x] Remove the dormant Inspiration-potion cash grant.
- [x] Record the initial strategy/author matrix and ten-retirement baseline; first foundation batch passed 53 tests.
- [x] Implement isolated local career preview: candidate salaries/XP/inheritance/upkeep, 18 upgrades, replacement tiers and retirement gates.
- [x] Add candidate save migration with backups and no normal-save writes; browser smoke checks and 61 tests pass.
- [x] Simulate ten lives with ordinary and creative career policies; detailed outcomes are in `reports/CAREER-PREVIEW.md`.

Version 2.0.0 now enables the career/authorship balance in the normal game. Earlier preview entries below document its development. Retirement redesign is deferred at the user's request; existing rules remain in place.

- [x] Preview readership and finite two-year book sales, independent of job selection.
- [x] Optional per-book editor with a locked fee, once-only expense entry, queued preset and free-release fallback.
- [x] Shared preview online/offline progression, bounded legacy sales migration and lifetime receipt display.
- [x] Add sales/editing regression coverage and initial four-strategy measurements; see `reports/WRITING-PREVIEW.md`.
- [x] All 71 automated tests pass after the writing-sales and editing batch; preview controls verified in the browser.
- [x] Ship the measured career/authorship rules, budget forecasts, sustained-income milestone and opt-in career/training automation as the default game.
- [x] Add version 2.0.0 migration notice, save backups and normal-startup/main-save regression coverage, including active manuscripts and repeat loads.
- [ ] Continue balance tuning, broader author milestones and device playtesting after rollout.
- [ ] Later: retirement/legacy redesign and audience inheritance, when the user resumes that work.

## Interruptions and reliability
- [x] Pulse the inbox for unread messages, automatically mark displayed messages read on opening and persist the change; keep refresh and Return to game in a fixed dialog footer. Respect reduced-motion preferences.
- [x] 1. Persistent inbox for unlocks, badges and publications, with direct actions.
- [x] 2. Background/offline simulation, summary, retirement boundary and separate active-play analytics.
- [x] 10. Remove discovery countdowns; eligible discoveries enter the inbox immediately.
- [x] 20. Restore unfinished books; explicit local debug opt-in.

## Clarity and navigation
- [x] 4. Explain work → craft → publish → legacy and the next milestone.
- [x] 5. Four desktop/mobile screens with active-task context.
- [x] 6. Compact header; secondary resources in Stats & breakdowns.
- [x] 7. Larger text, theme-aware contrast, smaller art and responsive cards.
- [x] 8. Persistent Working, Training and Equipped labels.
- [x] 9. Hide distant categories behind an optional overview.
- [x] 11. Writing speed, ETA, quality, genre fit, royalties and contribution dashboard.
- [x] 17. Direct Achievements access, inbox notifications, numeric requirements and effects.
- [x] 19. Stable scene controls; themed hover/focus/tap tooltips; retain visible cursor.

## Writing and economy
- [x] 3. Authorship prototype: title, character, theme, ending, scene targets and editorial tradeoffs.
- [x] 18. Always-visible labeled preview, animated typewriter and persistent authored story outline.
- [x] 12. Reduce quality saturation; quality/editorial choices affect royalties.
- [x] 13. Separate eligibility, purchase prices and upkeep; migrate old ownership.
- [x] 14. Reduce royalty snowballing; publication milestones unlock stronger contracts.
- [x] 15. Simulate early/inherited progression; faster baseline and softer XP above 100.
- [x] 16. Repeat-writing actions and finite book queues, including away progress.

## Verification
- [x] Preserve saved books, titles, editorial plans, ownership and queues.
- [x] Test retirement, bankruptcy, potion expiry and one-time offline rewards.
- [x] Verify duplicate-tab protection in the browser.
- [x] Check desktop/mobile, both themes, keyboard activation and narrow desktop reflow.
- [x] Run JavaScript/PHP regressions and document outcomes in BALANCE.md.

## Further validation after this implementation pass
- [ ] Playtest complete careers with varied authors, purchases, writing strategies and later generations; refine the economy from those results.
- [ ] Test actual 200% browser zoom and perform a fuller keyboard/screen-reader audit. A 640×360 reflow check is complete.
- [ ] Expand branching story/editor interactions if player testing supports it.
- [ ] Consider multi-tab ownership fallback for browsers without Web Locks.


## Career preview: planning and automation

- [x] Align simulation independence with the production rolling-year predicate; record actual cash transactions, editor fees, waiting time, bankruptcies and sustained housing.
- [x] Add reproducible first-life comparisons across all authors, free/paid editing, writing approaches, transition times and three-book controls. Add provisional ordinary-speed pacing targets and a generated comparison report.
- [x] Correct simulated tool replacement to follow slot tiers and reserve pending editor fees before discretionary purchases.
- [ ] Tune remaining pacing issues against the new measurements; broaden career/skill policies and validate established-author sustainability before release.
- [x] Add a slider budget forecast with editing reserves and savings runway using declining existing sales.
- [x] Store a bounded rolling year of source income, editing costs, upkeep and full-time wage comparisons separately from the static journal.
- [x] Award a once-per-life Full-Time Author milestone only after a full observed year of writing supporting the player and outperforming employment.
- [x] Add opt-in promotion and lowest-level skill automation, restricted to the selected branch/category with no automatic purchases or slider changes.
- [x] Verify save/load, gates, accounting and lifetime reset with automated tests; confirm controls and budget load in the preview browser.
- [ ] Continue economy/paid-editing strategy measurements and responsive/theme validation. Further retirement redesign remains deferred.


## Career, skills and 18-upgrade revision
- [x] Centralize candidate task salaries/XP/prerequisites and writing/audience constants; retain the Knight curve with revised career coefficients.
- [x] Improve creative entry wages and early housing affordability; price editing as an optional per-book investment.
- [x] Add a bounded craft-training benefit earned from creative job levels, independent of the selected job.
- [x] Add ordered skill targets and next-promotion prerequisite training with saved preferences and safe skipping.
- [x] Make items.json the 18-item catalogue and preserve the 37-item normal-game dataset in items-legacy.json until rollout.
- [x] Show access, ownership, equipment and replacement budgets; retain free purchased tools and manuscripts through insolvency.
- [x] Audit prerequisite cycles, duplicate unlock signatures, assets, removed-item replacements and achievement references.
- [x] Measure all three authors across four allocations and two lives, plus controls and ten consecutive actual lives under unchanged retirement rules.
- [ ] Final playtesting of late audience growth and career/author income transitions; retirement redesign and default-game rollout remain deferred.

- [x] Replace misleading new-book royalty projections in the writing dashboard with actual published-book income; hide and clear manuscript-only stats when idle, retaining publication/readership totals. Verify first publication and continuous queues in both economies.
