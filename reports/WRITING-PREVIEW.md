> Current career/upgrade revision: see [CAREER-REVISION.md](CAREER-REVISION.md). The first-life measurement discussion below describes the preceding tuning pass; the new report supersedes its price and pacing conclusions.

# Writing economy preview

Enabled in the separate localhost `?balance=career` preview. Normal-game saves and balance are unchanged. Retirement gates, lifespan, inheritance and prestige rules were not redesigned; that work is deferred. Readership belongs to the current life and clears alongside the existing book catalogue.

## Sales and readership

Each publication awards readers based on quality, genre fit and existing audience. A book's launch income depends on its release audience, quality, approach and royalty negotiation. Subsequent job/slider changes do not reprice it.

Sales decline linearly from the launch rate to zero over 730 game days. Total possible receipts equal `launch rate × 365`. Books remain in the library after sales end. Exact interval integration is used rather than charging an entire interval at its ending rate.

Both online and offline preview progression use the same stepper, split at publications, birthdays, potion expiry and the existing lifespan boundary. It snapshots speed during each step so a newly learned time-speed level cannot retroactively change that interval. Newly published books cannot earn for time before publication.

The writing panel shows audience, estimated launch income and current catalogue sales. Library entries show current income and receipts, updating existing text nodes at most once per second. Historical receipt totals not present in old saves are explicitly labelled as receipts since the update.

## Editing

Choose self-editing (free) or a paid editor (+25% raw quality, before quality diminishing returns). The quote is `500 + 5 × readership`, rounded and locked when a manuscript starts. It is charged once at publication and recorded as an expense with the remaining balance.

If funds are insufficient, the completed manuscript waits while work and other book sales continue. It releases when enough money is available. The player can instead publish without editing, or choose an automatic free fallback in the preset. Queued manuscripts keep the editor/fallback preference and receive their own quote. Existing story/editorial choices remain available.

## Migration

Before converting legacy royalties, back up the save under the preview save key plus `-before-book-sales-1`. Old books keep their initial daily rate, declining to zero over a one-year transition. Unrepresented legacy income becomes a separately labelled legacy catalogue entry. No past receipts or audience awards are invented. Reloading does not renew contracts or apply the former royalty top-up.

## Measurement and remaining work

The latest first-life matrix and provisional pacing targets are in [NON-RETIREMENT-BALANCE.md](NON-RETIREMENT-BALANCE.md). It compares all three authors and paid editing using exact journal-event accounting and the production rolling-year predicate. The older two-life report below remains historical and uses the earlier measurement definitions.

`writing-sales-candidate.json` compares job-only, mixed, writing-heavy and transition policies for Beatrice over two existing lifetimes, with a creative-career policy and free editing. These are initial measurements, not retirement tuning or proof of an optimal strategy. Paid-editor investment strategies and broader author/genre coverage remain to be simulated.

```powershell
node scripts/simulate-progression.cjs --profile career --career-policy creative --lives 2 --author author1 --out reports/writing-sales-candidate.json
node --test tests/*.test.cjs
```

New tests cover finite sales totals, audience awards, job-independent book rates, online/offline agreement across publication/year boundaries, existing lifespan boundaries, migration without renewal, paid editing with insufficient funds, free fallback, and service presets across continuous queues/reloads. Browser checks confirm new writing controls and readership metrics load.

Still open: combined economy tuning, paid-editing and automation strategy comparisons, comprehensive mobile/theme checks and broader author milestones. Retirement/legacy decisions are deferred rather than treated as completed.

Verification after the measurement batch: all 85 automated tests pass; `git diff --check` reports no whitespace errors.

The 37-scenario fresh-life matrix highlights two tuning concerns: mixed creative-career play retains paid housing for a year only after about 53 real minutes, and paid editing's extra lifetime receipts greatly exceed its fees. Fourteen runs experience one bankruptcy each; these are job-only/transition creative-career policies, so branch-entry pay cuts need comparison before lowering all upkeep. None of these first-life policies passes strict employment-replacement independence. That is compatible with the multi-life direction but does not validate later author sustainability. Three-book controls all end with zero current sales. Next tuning should compare entry-job/early-housing choices and editing prices, keeping retirement rules fixed.

## Budget, sustained income and optional automation

The slider now shows daily wages, current sales, upkeep, signed cashflow and cash after reserving the current manuscript editor. Savings runway integrates declining existing sales and assumes no new releases or changed spending; it is a scenario estimate, not a promise. The display refreshes once per second and immediately when allocation changes.

Up to 366 daily rows are retained separately from the static journal. The last 365 completed game days provide actual wages, sales, editing and upkeep. Full-Time Author requires a fully observed year where sales after editing cover upkeep and exceed actual wages and the integrated best discovered, currently eligible full-time wage. No prior history is invented for migrated saves. One-time tool purchases are not amortized into this operating-income milestone. The milestone is reported in the inbox and remains visible in the writing budget for this lifetime.

Career and Skills each offer an off-by-default checkbox: choose better-paying discovered jobs within the current branch, or train the lowest-level discovered skill within the current category. Requirements are rechecked. Automation never buys upgrades or changes allocation. Choices are evaluated at game-day boundaries in both visible and away play, saved, and cleared with the existing lifetime reset. Target-level and prerequisite-driven training remain future work.

Browser smoke check: existing preview reloads with the career checkbox and writing budget/history visible. Comprehensive viewport/theme checks and full strategy balance validation remain open.
