# Progression measurements

For the current combined preview, see [the career/18-upgrade revision](CAREER-REVISION.md). [Earlier non-retirement measurements](NON-RETIREMENT-BALANCE.md) are the preceding tuning baseline. The baseline results below are historical. The current preview runner uses the game's rolling-year independence test and actual journal transactions; old JSON reports retain their original measurement definitions.

These measure the current economy with continuous writing enabled, not the proposed rebalance or optimal play.

```powershell
node scripts/simulate-progression.cjs --out reports/progression-baseline.json
node scripts/simulate-progression.cjs --lives 10 --author author1 --strategy mixed --out reports/progression-ten-lives.json
```

`--lives` accepts 1–100. Optional author/strategy filters restrict the matrix. Each life stops at actual retirement or a 120-minute real-time cap; a capped life is not given artificial inheritance. This runner uses ordinary retirement, not fame retirement. Acceleration is disabled.

Policies choose the lowest-level eligible skill, buy affordable equipment within 65% of gross income, and select the highest base-pay eligible job. This accepts short-term pay cuts to advance a career. A separate current-wage control exposes the trap of refusing every short-term pay cut. These are heuristics, not proofs of earliest possible endgame completion.

Writing uses a balanced approach in the first genre and its default scene. Allocations are 0% (job-only), 40% (mixed), 80% (writing-heavy), and 0% for ten real minutes then 80% (transition). Writing policies publish continuously.

The harness loads production formulas/data with seeded randomness and replaces rendering hooks. Updates follow away-play ordering, at most one real second, split at publication/year/retirement boundaries. This is not a browser frame-rate equivalence test. Income-majority milestones use complete game-year buckets, not the planned rolling-window success test.

## First-life baseline for Beatrice

| Policy | Last job | Books | Final full-work wage/day | Final royalties/day |
| --- | --- | ---: | ---: | ---: |
| Job-only | Personal Assistant | 0 | 619 | 0 |
| Mixed | Personal Assistant | 139 | 637 | 5,550 |
| Writing-heavy | Personal Assistant | 127 | 593 | 5,076 |
| Transition | Personal Assistant | 138 | 604 | 5,985 |

Rounded figures; actual wages are reduced by writing allocation. Permanent royalties already let books dominate this baseline. That does not establish satisfying authorship progression: readership and declining sales are still pending.

The current-wage control stays Gig Worker through its first two lives because the next job initially pays less. Rework wages and communicate promotion prospects together.

## Retirement requirement

Financial independence is intermediate. Endgame careers, upgrades and author milestones must require many retirements. Future tuning must report first reachable life, test aggressive policies, check inheritance/lifespan exploits, and distinguish a heuristic's failure to reach a goal from proof that the goal is inaccessible.

The ten-life Beatrice/mixed baseline completes ten actual retirements. First-publication time improves from approximately 85 seconds to 66 in life two and 64 by life four, then stalls. The policy remains Personal Assistant throughout; its highest task level approaches 160 by life ten. This is evidence of a plateau under this policy, not proof that every player is stuck. Later tuning should provide new generational opportunities rather than repeating the same early progression indefinitely.
