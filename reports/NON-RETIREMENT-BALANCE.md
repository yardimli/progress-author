# Non-retirement balance measurements

Fresh first lives at ordinary speed; existing retirement rules are unchanged. These are deterministic policy comparisons, not optimal play or proof of release balance.

Regenerate with `node scripts/measure-career-balance.cjs` then `node scripts/summarize-career-balance.cjs`.

## First-life pacing (free editing)

Times are real minutes. Sustained housing means retaining a paid home for 365 game days without bankruptcy. Independence uses the same rolling-year predicate as the game, including the full-time wage comparison.

| Author | Policy | First promotion | First book | Sustained housing | Writing majority | Independence | Books |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| author1 | job-only | 1.64 | — | 6.99 | — | — | 0 |
| author1 | mixed | 2.67 | 3.48 | 52.62 | — | — | 12 |
| author1 | writing-heavy | 7.18 | 2.00 | 71.42 | 46.43 | — | 18 |
| author1 | transition | 1.64 | 11.24 | 6.99 | 40.15 | — | 18 |
| author3 | job-only | 1.64 | — | 6.99 | — | — | 0 |
| author3 | mixed | 2.67 | 3.48 | 52.62 | — | — | 12 |
| author3 | writing-heavy | 7.18 | 2.00 | 71.60 | 46.48 | — | 18 |
| author3 | transition | 1.64 | 11.24 | 6.99 | 40.19 | — | 18 |
| author4 | job-only | 1.64 | — | 6.99 | — | — | 0 |
| author4 | mixed | 2.67 | 3.48 | 52.62 | — | — | 12 |
| author4 | writing-heavy | 7.18 | 2.00 | 71.42 | 46.43 | — | 18 |
| author4 | transition | 1.64 | 11.24 | 6.99 | 40.15 | — | 18 |

## Paid editor compared with free editing

Differences cover the whole first life, including knock-on effects on purchases and later books. Receipt difference minus editor fees is not a controlled per-book return experiment.

| Author | Policy | Extra sales receipts | Editor fees | Extra receipts less fees | Extra readers | Waiting (real minutes) |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| author1 | mixed | $69,559 | $5,083 | $64,476 | 119 | 0.00 |
| author1 | writing-heavy | $90,301 | $8,493 | $81,808 | 180 | 0.00 |
| author1 | transition | $124,900 | $10,752 | $114,148 | 218 | 0.00 |
| author3 | mixed | $68,600 | $5,025 | $63,575 | 118 | 0.00 |
| author3 | writing-heavy | $87,493 | $8,358 | $79,135 | 175 | 0.00 |
| author3 | transition | $122,128 | $10,556 | $111,572 | 215 | 0.00 |
| author4 | mixed | $68,949 | $5,075 | $63,874 | 116 | 0.00 |
| author4 | writing-heavy | $89,463 | $8,475 | $80,988 | 177 | 0.00 |
| author4 | transition | $125,782 | $10,752 | $115,030 | 221 | 0.00 |

## Provisional pacing targets

Provisional ordinary-speed first-life targets for playtesting, not approved release balance.

| Author / policy | Metric | Measured minutes | Target minutes | Result |
| --- | --- | ---: | ---: | --- |
| author1 / job-only | firstPromotionSeconds | 1.64 | 1.00–4.00 | Within band |
| author1 / job-only | sustainableHomeSeconds | 6.99 | 7.00–25.00 | Early |
| author1 / mixed | firstPromotionSeconds | 2.67 | 1.00–4.00 | Within band |
| author1 / mixed | firstBookSeconds | 3.48 | 1.50–5.00 | Within band |
| author1 / mixed | sustainableHomeSeconds | 52.62 | 7.00–25.00 | Late |
| author1 / writing-heavy | firstBookSeconds | 2.00 | 1.50–5.00 | Within band |
| author3 / job-only | firstPromotionSeconds | 1.64 | 1.00–4.00 | Within band |
| author3 / job-only | sustainableHomeSeconds | 6.99 | 7.00–25.00 | Early |
| author3 / mixed | firstPromotionSeconds | 2.67 | 1.00–4.00 | Within band |
| author3 / mixed | firstBookSeconds | 3.48 | 1.50–5.00 | Within band |
| author3 / mixed | sustainableHomeSeconds | 52.62 | 7.00–25.00 | Late |
| author3 / writing-heavy | firstBookSeconds | 2.00 | 1.50–5.00 | Within band |
| author4 / job-only | firstPromotionSeconds | 1.64 | 1.00–4.00 | Within band |
| author4 / job-only | sustainableHomeSeconds | 6.99 | 7.00–25.00 | Early |
| author4 / mixed | firstPromotionSeconds | 2.67 | 1.00–4.00 | Within band |
| author4 / mixed | firstBookSeconds | 3.48 | 1.50–5.00 | Within band |
| author4 / mixed | sustainableHomeSeconds | 52.62 | 7.00–25.00 | Late |
| author4 / writing-heavy | firstBookSeconds | 2.00 | 1.50–5.00 | Within band |

## Controls and accounting

- 37 scenarios; 0 reached the strict writing-independence test in this first life.
- Three-book controls: author1: 3 books, $0/day final sales; author3: 3 books, $0/day final sales; author4: 3 books, $0/day final sales.
- Paid/free fallback produced identical results to waiting in 9/9 standard comparisons. This does not test severe cash shortages; those paths also have dedicated unit tests.
- Largest cash reconciliation error: $3.076e-7.
- Total bankruptcies: 14.

## Additional policies

| Policy | First book (minutes) | Books | Readers | Total sales | Editor fees | Independence (minutes) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| transition, balanced, transition 300s | 6.01 | 19 | 2263 | $850,336 | $0 | — |
| transition, balanced, transition 900s | 16.24 | 18 | 2514 | $941,610 | $0 | — |
| writing-heavy, commercial, transition 600s | 1.67 | 21 | 2062 | $917,148 | $10,576 | — |
| writing-heavy, crafted, transition 600s | 2.38 | 16 | 1806 | $631,166 | $7,677 | — |

## Limits

Five-second decisions; creative career with highest base-pay eligible job, lowest-level eligible skill across categories, upgrades under 65% of current gross income with current editor fee reserved. Default scene/genre, continuous writing unless capped at three books. Transition at 600 seconds unless specified.

Heuristics, not optimal play or user testing. Paid-free and paid-wait can coincide when funds suffice. Independence uses 365 completed game days of observed sales after editing, covering upkeep and exceeding actual wages and feasible full-time employment. Tool purchases are separate. No inheritance or acceleration comparisons in this report.

author1 = Beatrice Hansen; author3 = Rosemary Lis; author4 = James Markman. All policies prefer the creative career, so switching into a low-level creative role can temporarily reduce pay. Other branches, targeted skill choices and active scene matching still need comparisons. No retirement, inheritance or lifespan settings were tuned.
