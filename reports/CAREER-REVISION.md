# Career and 18-upgrade revision

Preview only. Normal saves still load the preserved 37-item `items-legacy.json`. The canonical `items.json` contains 18 cards; `career-profile.json` supplies salary, task XP/prerequisite/effect and writing parameters. Retirement gates, lifespan, inheritance and prestige are unchanged from the preceding preview.

## Changes

- Intern base pay: 40 → 160/day; Blogger: 400 → 480/day; C.W. Student: 800 → 3,200/day.
- Rented Room upkeep: 120 → 90/day; access threshold: 6,000 → 4,500 (still 50 days of base upkeep). Other retained item prices/upkeep unchanged.
- Creative and advanced job XP coefficients reduced as shown below; the Knight level-growth formula and existing skill/retirement gates remain.
- Earned Creative Industry levels add 0.1% Writing Craft training each, capped at 25%. The bonus stays after changing jobs and does not come from selecting a role.
- Editor quote: 250 + 0.5 × readers → 500 + 5 × readers. Existing locked manuscript quotes remain unchanged.
- Skill automation supports ordered level targets with prerequisite training, next-promotion prerequisites, or lowest-level training in the selected category. Off by default; no automatic allocation changes or purchases.
- Item access, purchase ownership and active equipment are shown separately. Details preview replacement upkeep/net income. Bankruptcy drops paid upkeep but retains free purchased tools, learned skills and manuscripts.

## Knight control and revised career coefficients

Knight values are read from the local Progress Knight source. Currencies are not equivalent. Pay ratios deliberately differ for ordinary work and creative entry; the control is the linked training/pay/upkeep structure, not literal copied prices. Normal-game base XP equals the original Knight coefficients.

| Role | Knight pay | Preview pay | Knight base XP | Preview base XP |
| --- | ---: | ---: | ---: | ---: |
| Gig Worker | 5 | 40 | 50 | 50 |
| Food Service | 9 | 96 | 100 | 100 |
| Delivery Driver | 15 | 240 | 200 | 200 |
| Warehouse Worker | 40 | 560 | 400 | 400 |
| Office Temp | 80 | 1,280 | 800 | 800 |
| Personal Assistant | 150 | 2,880 | 1,600 | 1,600 |
| Intern | 5 | 160 | 100 | 100 |
| Blogger | 50 | 480 | 1,000 | 600 |
| Content Creator | 120 | 960 | 10,000 | 4,000 |
| Copy Editor | 300 | 2,400 | 100,000 | 25,000 |
| Staff Writer | 1,000 | 8,000 | 1,000,000 | 150,000 |
| Senior Editor | 3,000 | 24,000 | 7,500,000 | 1,000,000 |
| Ghostwriter | 15,000 | 120,000 | 40,000,000 | 7,500,000 |
| Commissioned Author | 50,000 | 400,000 | 150,000,000 | 40,000,000 |
| C.W. Student | 100 | 3,200 | 100,000 | 10,000 |
| Junior Agent | 1,000 | 8,000 | 1,000,000 | 100,000 |
| Senior Agent | 7,500 | 60,000 | 10,000,000 | 1,000,000 |
| Publisher | 50,000 | 400,000 | 100,000,000 | 10,000,000 |
| Literary Titan | 250,000 | 2,000,000 | 10,000,000,000 | 100,000,000 |
| Head of Publishing | 1,000,000 | 8,000,000 | 1,000,000,000,000 | 1,000,000,000 |

## Retained upgrade ladder

| Item | Upfront | Upkeep/day | Effect |
| --- | ---: | ---: | --- |
| Homeless | 0 | 0 | No housing upkeep |
| Walking | 0 | 0 | Free commute |
| Library Card | 0 | 8 | x1.30 Writing Craft experience |
| Used Laptop | 500 | 0 | x1.50 Typing Speed experience ; x1.30 Writing Speed |
| Style Guide | 2,000 | 0 | x1.30 Writing Quality |
| Rented Room | 0 | 90 | x1.40 Inspiration |
| Planner | 0 | 80 | x1.50 Skill XP |
| Bus Pass | 0 | 400 | x1.50 Job XP |
| Pro Writing Software | 50,000 | 0 | x2.00 Typing Speed experience ; x1.80 Writing Speed |
| Studio | 0 | 800 | x2.00 Inspiration |
| Premium Briefcase | 0 | 1,600 | x2.00 Job XP |
| Suburban | 0 | 6,000 | x3.50 Inspiration |
| Used Car | 0 | 8,000 | x3.00 Job XP |
| Home Office | 0 | 60,000 | x2.00 Writing Speed |
| City Penthouse | 0 | 200,000 | x12.00 Inspiration |
| Masterclass Subscription | 0 | 400,000 | x3.00 Writing Craft experience |
| Home Library | 0 | 8,000,000 | x2.00 Skill XP |
| Mansion Estate | 0 | 40,000,000 | x60.00 Inspiration |

The six homes and three transport tiers are exclusive. Planner/Home Library, Library Card/Masterclass, and Used Laptop/Pro Writing Software replace within their respective slots. Standalone supports stack. Most recurring access gates remain 100 days of upkeep; no cash purchase is charged for those tiers. Removed assets and old tooltip entries remain for legacy saves; the preview uses structured retained-item effects. The Landlord badge maps to Suburban. Editor is a per-manuscript service, with Style Guide access granted for legacy ownership.

## Measured pacing and sustainability

Matrix: 20 scenarios, including all three authors × four allocations × two actual lives, three paid-editor pairs, ordinary/general-career controls, promotion-focused training, acceleration and a three-book control. The ten-life run is separate. Times below are ordinary real minutes; caps never grant synthetic inheritance.

| Beatrice, free editing | Life | First book | Paid housing held a year | Final job | Books | Independence | Qualifying game days |
| --- | ---: | ---: | ---: | --- | ---: | ---: | ---: |
| job-only | 1 | — | 6.8 | Blogger | 0 | — | 0 |
| job-only | 2 | — | 3.4 | Copy Editor | 0 | — | 0 |
| mixed | 1 | 3.5 | 18.1 | Blogger | 14 | — | 0 |
| mixed | 2 | 2.5 | 3.6 | Content Creator | 31 | — | 0 |
| writing-heavy | 1 | 2.0 | 47.4 | Blogger | 20 | — | 0 |
| writing-heavy | 2 | 1.6 | 16.0 | Content Creator | 35 | — | 0 |
| transition | 1 | 10.9 | 6.8 | Blogger | 22 | — | 0 |
| transition | 2 | 10.8 | 3.4 | Content Creator | 40 | 92.2 | 1,714 |

## Ordinary versus creative career (mixed writing, free editing)

| Career policy | Life | Final job | Full-work wage/day | Books |
| --- | ---: | --- | ---: | ---: |
| creative | 1 | Blogger | $1,688 | 14 |
| creative | 2 | Content Creator | $4,819 | 31 |
| ordinary | 1 | Office Temp | $3,492 | 17 |
| ordinary | 2 | Personal Assistant | $8,978 | 36 |

## Paid-editing opportunity cost

Paired first/second lives for Beatrice; whole-policy differences include subsequent audience and equipment effects. A negative net difference means self-editing generated more receipts after service costs under that policy.

| Policy | Life | Extra receipts over free editing | Editor fees | Difference after fees |
| --- | ---: | ---: | ---: | ---: |
| mixed | 1 | $63,404 | $46,035 | $17,369 |
| mixed | 2 | $346,947 | $731,280 | $-384,333 |
| writing-heavy | 1 | $115,243 | $68,925 | $46,318 |
| writing-heavy | 2 | $1,468,123 | $963,975 | $504,148 |
| transition | 1 | $227,655 | $152,260 | $75,395 |
| transition | 2 | $1,096,284 | $1,862,785 | $-766,501 |

## Ten actual lives (existing rules)

| Life | Final career | Books | First independence (minutes) | Qualifying game days |
| ---: | --- | ---: | ---: | ---: |
| 1 | Blogger | 22 | — | 0 |
| 2 | Content Creator | 40 | 94.0 | 1,669 |
| 3 | Staff Writer | 94 | 63.9 | 7,461 |
| 4 | Senior Editor | 129 | 59.7 | 8,197 |
| 5 | Ghostwriter | 134 | 94.0 | 2,063 |
| 6 | Ghostwriter | 142 | 89.1 | 2,939 |
| 7 | Commissioned Author | 145 | 101.6 | 688 |
| 8 | Commissioned Author | 141 | — | 0 |
| 9 | Ghostwriter | 144 | 90.7 | 2,661 |
| 10 | Commissioned Author | 141 | — | 0 |

First discovered life under this heuristic (not proof of earliest possible access):

| Career / upgrade / milestone | Life |
| --- | ---: |
| item: Rented Room | 1 |
| item: Planner | 1 |
| job: Food Service | 1 |
| item: Used Laptop | 1 |
| item: Bus Pass | 1 |
| job: Delivery Driver | 1 |
| item: Studio | 1 |
| job: Intern | 1 |
| item: Premium Briefcase | 1 |
| milestone: First book | 1 |
| item: Style Guide | 1 |
| job: Blogger | 1 |
| item: Suburban | 1 |
| item: Used Car | 1 |
| job: Content Creator | 2 |
| item: Pro Writing Software | 2 |
| item: Home Office | 2 |
| milestone: Writing independence | 2 |
| job: Copy Editor | 3 |
| job: Staff Writer | 3 |
| job: C.W. Student | 4 |
| job: Senior Editor | 4 |
| item: City Penthouse | 5 |
| item: Masterclass Subscription | 5 |
| job: Ghostwriter | 5 |
| item: Home Library | 7 |
| job: Commissioned Author | 7 |
| item: Mansion Estate | 9 |

## Validation and limits

- 20 matrix scenarios; 38 measured lives. Matrix bankruptcies: 0. Largest cash reconciliation error: $1.715e-6.
- Mixed ordinary-speed first-life sustained housing improves from about 53 to 18 minutes in the creative-career control. Early job/publication targets remain provisional; the job-only housing result is just under the seven-minute lower target.
- Independence requires 365 completed observed game days of editing-adjusted book income exceeding feasible full-time employment and covering upkeep. Three early releases still expire; ongoing releases can support independence for multiple game years.
- The ten-life policy reaches independence in life two and several later lives, but not every later life. Late audience growth and wage/expense jumps still need playtesting. First-discovery measurements are observations, not new retirement targets.
- Existing late retirement gates still block first-life completion even with extreme wealth/training or acceleration. Further retirement/legacy targets and UI remain deferred.
- Audit checks all 18 retained assets, removed-item replacements, skill/equipment independence, duplicate unlock signatures, badge item references and prerequisite cycles. Tests cover new priority modes, learned craft transfer, replacement budget calculations and insolvency retention.
- Browser checks cover target add/remove, preview reload, upgrade budget details and a narrow 390-pixel viewport in the current dark theme. Full theme/device/accessibility playtesting is still pending.

Reproduce: `node scripts/audit-career-data.cjs`, `node scripts/measure-career-revision.cjs`, `node scripts/simulate-progression.cjs --profile career --career-policy creative --lives 10 --author author1 --strategy transition --editor paid-wait --out reports/career-revision-ten-lives.json`, then `node scripts/summarize-career-revision.cjs`.
