# Progress Knight / Author’s Journey progression comparison

Source snapshot: local files read for this report. No gameplay values changed.

Progress Knight: [main.js](F:/GitHub/progress-knight/js/main.js), [classes.js](F:/GitHub/progress-knight/js/classes.js). Author’s Journey: [jobs](data/jobs.json), [skills](data/skills.json), [legacy items](data/items-legacy.json), [classes](js/classes.js), [multipliers](js/formulas.js), [mechanics](js/mechanics.js), [purchase/queue logic](js/writing-plan.js). The older progress-knight-ai.md was NOT used as the authority.

Numbers are base values per GAME DAY, before levels, author traits, discounts, badges, writing allocation and other multipliers. Knight uses copper-equivalent base units; Author uses dollars. These are not inherently equivalent currencies. L means current level. XP is the base coefficient, not XP per level. Pairing is structural or functional, not a claim that the mechanics are identical.

## Jobs — all 20 in each game

All 20 paired jobs retain exactly the same base XP coefficients. Pay and the supporting multipliers do not.

| Knight job | Author job | Base XP (both) | Knight base pay/day | Author base pay/day | Knight unlock | Author unlock |
| --- | --- | --- | --- | --- | --- | --- |
| Beggar | Gig Worker | 50 | 5 | 40 | Default | Default |
| Farmer | Food Service | 100 | 9 | 70 | Beggar 10 | Gig Worker 10 |
| Fisherman | Delivery Driver | 200 | 15 | 100 | Farmer 10 | Food Service 10 |
| Miner | Warehouse Worker | 400 | 40 | 130 | Strength 10 + Fisherman 10 | Delivery Driver 10 + Focus 10 |
| Blacksmith | Office Temp | 800 | 80 | 160 | Strength 30 + Miner 10 | Warehouse Worker 10 + Focus 30 |
| Merchant | Personal Assistant | 1,600 | 150 | 200 | Bargaining 50 + Blacksmith 10 | Office Temp 10 + Frugality 50 |
| Squire | Intern | 100 | 5 | 40 | Strength 5 | Focus 10 |
| Footman | Blogger | 1,000 | 50 | 80 | Strength 20 + Squire 10 | Intern 10 + Typing Speed 20 |
| Veteran footman | Content Creator | 10,000 | 120 | 150 | Battle tactics 40 + Footman 10 | Blogger 10 + Grammar & Prose 40 |
| Knight | Copy Editor | 100,000 | 300 | 220 | Strength 100 + Veteran footman 10 | Content Creator 10 + Typing Speed 100 |
| Veteran knight | Staff Writer | 1,000,000 | 1,000 | 300 | Battle tactics 150 + Knight 10 | Copy Editor 10 + Grammar & Prose 150 |
| Elite knight | Senior Editor | 7,500,000 | 3,000 | 450 | Strength 300 + Veteran knight 10 | Staff Writer 10 + Typing Speed 300 |
| Holy knight | Ghostwriter | 40,000,000 | 15,000 | 700 | Mana control 500 + Elite knight 10 | Senior Editor 10 + Plotting 500 |
| Legendary knight | Full-Time Author | 150,000,000 | 50,000 | 0 | Mana control 1,000 + Battle tactics 1,000 + Holy knight 10 | Ghostwriter 10 + Plotting 1,000 + Grammar & Prose 1,000 |
| Student | C.W. Student | 100,000 | 100 | 30 | Concentration 200 + Meditation 200 | Focus 200 + Meditation 200 |
| Apprentice mage | Junior Agent | 1,000,000 | 1,000 | 180 | Mana control 400 + Student 10 | C.W. Student 10 + Plotting 400 |
| Mage | Senior Agent | 10,000,000 | 7,500 | 350 | Mana control 700 + Apprentice mage 10 | Junior Agent 10 + Plotting 700 |
| Wizard | Publisher | 100,000,000 | 50,000 | 600 | Mana control 1,000 + Mage 10 | Senior Agent 10 + Plotting 1,000 |
| Master wizard | Literary Titan | 10,000,000,000 | 250,000 | 1,500 | Mana control 1,500 + Wizard 10 | Publisher 10 + Plotting 1,500 |
| Chairman | Head of Publishing | 1,000,000,000,000 | 1,000,000 | 3,000 | Mana control 2,000 + Master wizard 10 | Literary Titan 10 + Plotting 2,000 |

Knight common work maps to Menial Work; Military maps to Creative Industry; Arcane maps to Literary Elite. Full-Time Author is an important exception: no salary, but a ×5 raw writing-speed bonus merely from selecting the job. At 100% writing, that job earns no job XP.

## Skills — all 17 in each game

Every skill in both games has base XP 100. General linear effects are multipliers. Author quality components are combined and logarithmically softened; the listed components are not direct final quality gains.

| Knight skill | Knight effect | Knight unlock | Author skill | Author effect | Author unlock |
| --- | --- | --- | --- | --- | --- |
| Concentration | 1 + 0.01L Skill xp | Default | Focus | 1 + 0.01L Skill ex.; 1 + 0.01L raw quality component | Default |
| Productivity | 1 + 0.01L Job xp | Concentration 5 | Time Management | 1 + 0.01L Job ex.; 1 + 0.01L raw quality component | Focus 5 |
| Bargaining | max(0.1, 1 − log₇(L+1)/10) expenses | Concentration 20 | Frugality | max(0.1, 1 − log₇(L+1)/10) expenses | Focus 15 |
| Meditation | 1 + 0.01L Happiness | Concentration 30 + Productivity 20 | Meditation | 1 + 0.01L Inspiration; 1 + 0.01L raw quality component | Focus 30 + Time Management 20 |
| Strength | 1 + 0.01L Military pay | Default | Typing Speed | 1 + 0.01L Writing Speed | Equip Used Laptop + Focus 5 |
| Battle tactics | 1 + 0.01L Military xp | Concentration 20 | Grammar & Prose | 1 + 0.01L Creative Industry experience; 1 + 0.02L raw quality component | Focus 20 |
| Muscle memory | 1 + 0.01L Strength xp | Concentration 30 + Strength 30 | Character Dev. | 1 + 0.01L Typing Speed skill XP; 1 + 0.02L raw quality component | Focus 30 + Typing Speed 30 |
| Mana control | 1 + 0.01L T.A.A. xp | Concentration 200 + Meditation 200 | Plotting | 1 + 0.01L Literary Elite experience; 1 + 0.02L raw quality component | Focus 220 + Meditation 200 |
| Immortality | 1 + log₃₃(L+1) lifespan | Apprentice mage 10 | Healthy Lifestyle | 1 + log₃₃(L+1) lifespan | Junior Agent 10 |
| Time warping | 1 + log₁₃(L+1) game speed | Mage 10 | Flow State | 1 + log₁₃(L+1) game speed | Senior Agent 10 |
| Super immortality | 1 + 0.01L Longer lifespan | Chairman 1,000 | Longevity Secrets | 1 + 0.01L Later retirement age; 1 + 0.01L raw quality component | Head of Publishing 1,000 |
| Dark influence | 1 + 0.01L All xp | 1 evil | Brand Management | 1 + 0.01L All experience; 1 + 0.01L raw quality component | Head of Publishing 100 + 1 fame |
| Evil control | 1 + 0.01L Evil gain | 1 evil | Networking | 1 + 0.01L Fame gain; 1 + 0.01L raw quality component | Head of Publishing 110 + 1 fame |
| Intimidation | max(0.1, 1 − log₇(L+1)/10) expenses | 1 evil | Public Speaking | max(0.1, 1 − log₇(L+1)/10) expenses | Head of Publishing 120 + 1 fame |
| Demon training | 1 + 0.01L All xp | 25 evil | Personal Brand | 1 + 0.01L All experience; 1 + 0.01L raw quality component | Head of Publishing 100 + 25 fame |
| Blood meditation | 1 + 0.01L Evil gain | 75 evil | Media Tours | 1 + 0.01L Fame gain; 1 + 0.01L raw quality component | Head of Publishing 100 + 75 fame |
| Demon's wealth | 1 + 0.002L Job pay | 500 evil | Royalty Negotiation | 1 + 0.002L Job pay AND new-book royalties; 1 + 0.01L raw quality component | Head of Publishing 100 + 500 fame |

**Critical mapping change:** Strength improves military wages; Typing Speed improves manuscript speed instead. Author’s creative career has lost that dedicated salary-growth skill. Plotting and the six business skills retain very high gates; business skills additionally require Head of Publishing levels 100–120, whereas Knight’s dark skills primarily require evil.

## Items — all 16 Knight items and all 37 Author items

Knight charges NO upfront purchase price. Its coin thresholds unlock ongoing upkeep commitments. *Tent and Book have zero item-level thresholds but the Shop itself requires 750 coins (50 × Tent’s 15/day); the starting Homeless property is already active. Other item thresholds are 100 × base upkeep in a fresh game. Requirement amounts are constructed from getExpense() before effects are attached. Only one home is active; miscellaneous effects stack. Author adds a mutually exclusive transportation slot.

Author purchase price is max(20% of coin unlock threshold, 60 × base upkeep), rounded, with free default/owned items. Existing-save ownership exemptions are not reflected in these fresh-run prices.

### Properties — corresponding ladder positions

| Knight | Knight unlock / cost / effect | Author | Author unlock / cost / effect |
| --- | --- | --- | --- |
| Homeless | Default*<br>Upfront: 0; upkeep: 0/day<br>×1 Happiness | Homeless | Default<br>Upfront: 0; upkeep: 0/day<br>×1.6 Inspiration |
| Tent | Default*<br>Upfront: 0; upkeep: 15/day<br>×1.4 Happiness | Rented Room | 5,000 cash<br>Upfront: 1,800; upkeep: 30/day<br>×3.2 Inspiration; ×1.2 writing speed; ×1.05 raw quality |
| Wooden hut | 10,000 coins<br>Upfront: 0; upkeep: 100/day<br>×2 Happiness | Studio | 60,000 cash<br>Upfront: 12,000; upkeep: 75/day<br>×6.4 Inspiration; ×1.4 writing speed; ×1.1 raw quality |
| Cottage | 75,000 coins<br>Upfront: 0; upkeep: 750/day<br>×3.5 Happiness | Suburban | 300,000 cash<br>Upfront: 60,000; upkeep: 120/day<br>×12.8 Inspiration; ×1.7 writing speed; ×1.15 raw quality |
| House | 300,000 coins<br>Upfront: 0; upkeep: 3,000/day<br>×6 Happiness | Large House | 3,000,000 cash<br>Upfront: 600,000; upkeep: 250/day<br>×25.6 Inspiration; ×2.1 writing speed; ×1.2 raw quality |
| Large house | 2,500,000 coins<br>Upfront: 0; upkeep: 25,000/day<br>×12 Happiness | City Penthouse | 35,000,000 cash<br>Upfront: 7,000,000; upkeep: 600/day<br>×51.2 Inspiration; ×2.6 writing speed; ×1.25 raw quality |
| Small palace | 30,000,000 coins<br>Upfront: 0; upkeep: 300,000/day<br>×25 Happiness | Private Villa | 100,000,000 cash<br>Upfront: 20,000,000; upkeep: 2,000/day<br>×102.4 Inspiration; ×3.2 writing speed; ×1.3 raw quality |
| Grand palace | 500,000,000 coins<br>Upfront: 0; upkeep: 5,000,000/day<br>×60 Happiness | Mansion Estate | 1,000,000,000 cash<br>Upfront: 200,000,000; upkeep: 5,000/day<br>×204.8 Inspiration; ×4 writing speed; ×1.4 raw quality |

### Closest functional miscellaneous counterparts

These are approximate role matches. The charm trains Knight Magic skills; the subscription trains Author Writing Craft skills. The names are not used to imply identical categories.

| Knight | Knight unlock / cost / effect | Author | Author unlock / cost / effect |
| --- | --- | --- | --- |
| Book | Default*<br>Upfront: 0; upkeep: 10/day<br>×1.5 Skill xp | Planner | 65,000 cash<br>Upfront: 13,000; upkeep: 4/day<br>×1.38 Skill XP |
| Dumbbells | 5,000 coins<br>Upfront: 0; upkeep: 50/day<br>×1.5 Strength xp | Mechanical Keyboard | 10,000 cash<br>Upfront: 2,000; upkeep: 8/day<br>×1.1 Typing Speed experience; ×1.1 writing speed |
| Personal squire | 20,000 coins<br>Upfront: 0; upkeep: 200/day<br>×2 Job xp | Premium Briefcase | 12,000 cash<br>Upfront: 2,400; upkeep: 10/day<br>×1.2 Job XP |
| Steel longsword | 100,000 coins<br>Upfront: 0; upkeep: 1,000/day<br>×2 Military xp | No direct counterpart | — |
| Butler | 750,000 coins<br>Upfront: 0; upkeep: 7,500/day<br>×1.5 Happiness | Coffee Machine | 125,000 cash<br>Upfront: 25,000; upkeep: 8/day<br>×1.88 Inspiration; ×1.1 writing speed |
| Sapphire charm | 5,000,000 coins<br>Upfront: 0; upkeep: 50,000/day<br>×3 Magic xp | Masterclass Subscription | 4,500,000 cash<br>Upfront: 900,000; upkeep: 50/day<br>×2.75 Writing Craft experience |
| Study desk | 100,000,000 coins<br>Upfront: 0; upkeep: 1,000,000/day<br>×2 Skill xp | Focus Supplements | 15,000,000 cash<br>Upfront: 3,000,000; upkeep: 85/day<br>×3.13 Skill XP |
| Library | 1,000,000,000 coins<br>Upfront: 0; upkeep: 10,000,000/day<br>×1.5 Skill xp | Networking Membership | 50,000,000 cash<br>Upfront: 10,000,000; upkeep: 150/day<br>×2.5 Skill XP |

### Additional Author items

| Knight | Knight values | Author | Author unlock / cost / effect |
| --- | --- | --- | --- |
| No direct counterpart | — | Walking | Default<br>Upfront: 0; upkeep: 0/day<br>×1 Job XP |
| No direct counterpart | — | Bicycle | 13,000 cash<br>Upfront: 2,600; upkeep: 2/day<br>×1.1 Job XP |
| No direct counterpart | — | Mini Fridge | 20,000 cash<br>Upfront: 4,000; upkeep: 6/day<br>×1.15 Inspiration |
| No direct counterpart | — | Bus Pass | 15,000 cash<br>Upfront: 3,000; upkeep: 5/day<br>×1.25 Job XP |
| No direct counterpart | — | Ambient Lighting | 40,000 cash<br>Upfront: 8,000; upkeep: 10/day<br>×1.2 Inspiration |
| No direct counterpart | — | Scooter | 50,000 cash<br>Upfront: 10,000; upkeep: 10/day<br>×1.5 Job XP |
| No direct counterpart | — | Standing Desk Converter | 75,000 cash<br>Upfront: 15,000; upkeep: 15/day<br>×1.15 Skill XP |
| No direct counterpart | — | Used Car | 175,000 cash<br>Upfront: 35,000; upkeep: 25/day<br>×2 Job XP |
| No direct counterpart | — | Used Laptop | 25,000 cash<br>Upfront: 5,000; upkeep: 3/day<br>×1.25 Inspiration; ×1.3 writing speed |
| No direct counterpart | — | Noise-Canceling Headphones | 35,000 cash<br>Upfront: 7,000; upkeep: 18/day<br>×1.2 Skill XP; ×1.15 writing speed |
| No direct counterpart | — | Ergonomic Chair | 90,000 cash<br>Upfront: 18,000; upkeep: 5/day<br>×1.25 Inspiration; ×1.2 writing speed; ×1.1 raw quality |
| No direct counterpart | — | Dual Monitors | 100,000 cash<br>Upfront: 20,000; upkeep: 25/day<br>×1.25 Inspiration; ×1.4 writing speed |
| No direct counterpart | — | Style Guide | 150,000 cash<br>Upfront: 30,000; upkeep: 12/day<br>×1.25 Inspiration; ×1.6 raw quality |
| No direct counterpart | — | Pro Writing Software | 200,000 cash<br>Upfront: 40,000; upkeep: 20/day<br>×1.25 Inspiration; ×1.8 raw quality |
| No direct counterpart | — | New Car | 800,000 cash<br>Upfront: 160,000; upkeep: 60/day<br>×3 Job XP |
| No direct counterpart | — | Library Card | Default<br>Upfront: 0; upkeep: 1/day<br>×1.25 Inspiration; ×1.2 raw quality |
| No direct counterpart | — | Home Office | 1,500,000 cash<br>Upfront: 300,000; upkeep: 40/day<br>×1.25 Inspiration; ×1.5 writing speed; ×2 raw quality |
| No direct counterpart | — | Editor | 6,000,000 cash<br>Upfront: 1,200,000; upkeep: 70/day<br>×1.25 Inspiration; ×2 raw quality |
| No direct counterpart | — | Home Library | 25,000,000 cash<br>Upfront: 5,000,000; upkeep: 100/day<br>×1.25 Inspiration; ×2.5 raw quality |
| No direct counterpart | — | Private Driver | 5,000,000 cash<br>Upfront: 1,000,000; upkeep: 200/day<br>×5 Job XP |
| No direct counterpart | — | First Class Flights | 18,000,000 cash<br>Upfront: 3,600,000; upkeep: 400/day<br>×7.5 Job XP |
| No direct counterpart | — | Private Jet | 60,000,000 cash<br>Upfront: 12,000,000; upkeep: 1,000/day<br>×10 Job XP |

## Upgrade affordability

These figures are cash runway for ONE item at undiscounted base upkeep, with zero further income and no other expenses. They are not estimates of actual survival time. Knight’s typical reserve is 100 days. Author’s shown reserve is after its upfront purchase, assuming purchase immediately at its coin threshold.

| Author item | Cash unlock | Purchase | Upkeep/day | Reserve after purchase | Days of this upkeep remaining |
| --- | --- | --- | --- | --- | --- |
| Rented Room | 5,000 | 1,800 | 30 | 3,200 | 106.667 |
| Used Laptop | 25,000 | 5,000 | 3 | 20,000 | 6,666.667 |
| Coffee Machine | 125,000 | 25,000 | 8 | 100,000 | 12,500 |
| Studio | 60,000 | 12,000 | 75 | 48,000 | 640 |
| Home Office | 1,500,000 | 300,000 | 40 | 1,200,000 | 30,000 |
| Home Library | 25,000,000 | 5,000,000 | 100 | 20,000,000 | 200,000 |
| Networking Membership | 50,000,000 | 10,000,000 | 150 | 40,000,000 | 266,666.667 |
| Mansion Estate | 1,000,000,000 | 200,000,000 | 5,000 | 800,000,000 | 160,000 |

## Growth and automation

| Mechanic | Progress Knight source | Author source |
| --- | --- | --- |
| Concurrent progression | One job + one skill at full rate | One skill at full rate; job wage AND job XP multiplied by work allocation; manuscript uses the remaining allocation |
| Pay range: common branch | 5 → 150 (×30) | 40 → 200 (×5) |
| Pay range: specialist branch | 5 → 50,000 (×10,000) | 40 → 700 through Ghostwriter (×17.5), then zero salary at Full-Time Author |
| Pay range: advanced branch | 100 → 1,000,000 (×10,000) | 30 → 3,000 (×100) |
| XP multiplication | Product of bonuses, no global soft cap | Above combined ×4: 4 × sqrt(product/4); job and skill XP then have baseline ×0.4 |
| Inheritance | 1 + max historical level/10 | 1 + max historical level/20, then affected by combined XP softening |
| XP requirements | base × (L+1) × 1.01^L | Extra early discount and (1+L/100); power-law tail after 100, but identical job base XP coefficients |
| Homes: upkeep ladder | 0, 15, 100, 750, 3,000, 25,000, 300,000, 5,000,000 | 0, 30, 75, 120, 250, 600, 2,000, 5,000 |
| Homes: main bonus | ×1 → ×60 happiness | ×1.6 → ×204.8 inspiration, plus writing bonuses; XP effect softened |
| Automation | Unlocks at age 20; auto-promote within branch; auto-learn lowest-level eligible non-skipped skill | Finite manuscript queue, at most ten further books; no matching job/skill automation |
| Persistent money | No manuscript royalty subsystem | Royalties persist until rebirth; catalogue dampening reduces each NEW book’s reward, not existing royalties |
| Published-book progression | Not applicable | Quality/royalties, badges, life book count, future contract bonuses at 5 and 15; books also contribute to fame at second rebirth |
| Time rate | 4 game days/real second | 3 game days/real second; optional ×6 acceleration |

