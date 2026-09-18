# Career economy candidate

Historical career-stage report. Readership, finite sales and the Editor service have since been implemented; see [the writing update](WRITING-PREVIEW.md). The ten-life files below describe the earlier permanent-royalty model and should not be presented as current writing-balance results. Retirement redesign is deferred.

Open [the local preview](http://localhost/playground-computer/progress-author/index.html?balance=career). It is enabled only on localhost/loopback hosts; the normal game still uses the current balance. Data lives in `data/career-profile.json`, with shared application/migration code in `js/balance-profile.js`.

## Implemented

- 18 cards instead of 37: six homes, three transport tiers and nine learning/career/writing supports. Editor is removed from passive equipment; its per-book service is not implemented yet.
- One active tier per learning, craft and tool group. Switching tiers preserves access to owned tools; inactive tiers supply neither bonuses nor upkeep.
- Ongoing career/shared upgrades have no purchase price. Equipping requires one day's upkeep in cash. Most unlock reserves are 100 days of base upkeep; the first room uses 50. Affordability is deliberately distinct from sustainability.
- Writing tools use explicit upfront prices and skill/publication requirements, with no higher cash-balance unlock. Used Laptop costs 500, Style Guide 2,000 and Pro Writing Software 50,000; these tools have no upkeep.
- Knight XP curve `base × (level + 1) × 1.01^level`, uncapped career XP multipliers, inherited XP `1 + previous maximum / 10`, and job/skill scale 1 instead of 0.4. Writing retains its separate speed/quality caps.
- Knight-derived creative/literary wages; ordinary wages rise 40 → 96 → 240 → 560 → 1,280 → 2,880. The common ladder is steeper than a straight ×8 conversion to improve the early promotion incentive.
- Typing Speed improves creative wages and manuscripts. Effect calculations use stable identifiers rather than display descriptions.
- Job wages and XP follow the slider even with no active manuscript; independent skill training continues. Commissioned Author replaces the salaried branch's old Full-Time Author slot and has no selection-only manuscript bonus. The actual Full-Time Author milestone remains pending.
- Business skills use book counts and retirement counts. They no longer require the corporate endgame. Ordinary jobs have no publication gates.

## Retirement progression

Minimum completed retirements are candidate values, combined with existing skill/job/cash requirements:

| Unlock | Retirements |
| --- | ---: |
| Ghostwriter | 3 |
| City Penthouse / Masterclass | 4 |
| Publisher | 5 |
| Commissioned Author / Home Library | 6 |
| Literary Titan / Mansion Estate | 8 |
| Head of Publishing | 12 |

Both retirement types count; acceleration cannot bypass these requirements. Gates guarantee that extreme first-life wealth/levels alone cannot finish the game. They do not prove that later content is reachable at an enjoyable pace.

In the ten-life creative-career simulation (Beatrice, 40% writing, ordinary retirements), end-of-life jobs were Blogger, Content Creator, Staff Writer, Senior Editor, Ghostwriter, Ghostwriter, Commissioned Author, Commissioned Author, Ghostwriter, Commissioned Author. Life nine's temporary regression shows that the heuristic and business-skill training priorities still need tuning. The ordinary-career policy is also recorded separately.

Crucially, later salaries now greatly exceed baseline royalties. The writing economy must be rebuilt with readership and declining sales before this candidate replaces the normal game. Endgame author goals and the meaning of inherited readership/fame are not finished.

## Save handling

- Preview save: `authorsJourneyCareerPreview`; normal save: `authorsJourneySave`. Preview version acknowledgement and tab lock use their own keys. Preview sessions do not send play analytics.
- Export a normal save through the existing interface and import that copy into the preview to test migration. The normal save is not automatically imported or modified.
- Before legacy conversion, retain the original under `authorsJourneyCareerPreview-before-career-preview-1` in local storage.
- Removed equipment grants access to the replacement declared in the profile. Many-to-one tiers are deduplicated; only the strongest active replacement in a slot stays equipped. Comfort accessories grant access to housing rather than equipping a house as a miscellaneous item.
- No cash refunds are invented from ownership flags, since old ownership may have been grandfathered. Coins and historical purchase entries remain intact. Editor ownership temporarily grants Style Guide access; per-book editing will have a separate migration decision.
- Old Full-Time Author progress and selection map to Commissioned Author. Repeating the migration does not duplicate items or grant cash.
- New upkeep may make an imported loadout unsustainable; the existing insolvency fallback unequips supports and preserves purchased access and unfinished manuscripts. Read the net daily budget when testing an old save.

## Reproduce and validate

```powershell
node scripts/simulate-progression.cjs --profile career --lives 10 --author author1 --strategy mixed --out reports/career-ten-lives.json
node scripts/simulate-progression.cjs --profile career --career-policy creative --lives 10 --author author1 --strategy mixed --out reports/career-creative-ten-lives.json
node --test tests/*.test.cjs
```

The same limitations as the baseline runner apply: heuristic policies, away-style simulation, fixed default prose choices and ordinary retirement only. Tests cover the reduced catalogue, references, distinct unlock signatures, structured effects, allocation, tier replacement, cost models, insolvency, repeated migrations, save isolation and endgame retirement requirements. All 61 tests pass. Browser smoke checks cover startup, reload, upgrade labels/order, tool details and the writing panel; full mobile/theme playtesting of the completed economy remains pending.
