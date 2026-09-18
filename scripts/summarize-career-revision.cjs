const fs = require('node:fs');
const vm = require('node:vm');
const { createGame } = require('../tests/helpers/headless-game.cjs');
const candidate = createGame({ profile: 'career' });
const matrix = JSON.parse(fs.readFileSync('reports/career-revision-matrix.json'));
const long = JSON.parse(fs.readFileSync('reports/career-revision-ten-lives.json')).runs[0];
const originalJobs = JSON.parse(fs.readFileSync('data/jobs.json'));
const knightSource = fs.readFileSync('F:/GitHub/progress-knight/js/main.js', 'utf8');
const knightJobs = vm.runInNewContext('(' + knightSource.match(/const jobBaseData = (\{[\s\S]*?^\})/m)[1] + ')');
const number = x => Math.round(x).toLocaleString('en-US');
const minutes = x => x === null ? '—' : (x / 60).toFixed(1);
const lines = ['# Career and 18-upgrade revision', '',
    'Preview only. Normal saves still load the preserved 37-item `items-legacy.json`. The canonical `items.json` contains 18 cards; `career-profile.json` supplies salary, task XP/prerequisite/effect and writing parameters. Retirement gates, lifespan, inheritance and prestige are unchanged from the preceding preview.', '',
    '## Changes', '',
    '- Intern base pay: 40 → 160/day; Blogger: 400 → 480/day; C.W. Student: 800 → 3,200/day.',
    '- Rented Room upkeep: 120 → 90/day; access threshold: 6,000 → 4,500 (still 50 days of base upkeep). Other retained item prices/upkeep unchanged.',
    '- Creative and advanced job XP coefficients reduced as shown below; the Knight level-growth formula and existing skill/retirement gates remain.',
    '- Earned Creative Industry levels add 0.1% Writing Craft training each, capped at 25%. The bonus stays after changing jobs and does not come from selecting a role.',
    '- Editor quote: 250 + 0.5 × readers → 500 + 5 × readers. Existing locked manuscript quotes remain unchanged.',
    '- Skill automation supports ordered level targets with prerequisite training, next-promotion prerequisites, or lowest-level training in the selected category. Off by default; no automatic allocation changes or purchases.',
    '- Item access, purchase ownership and active equipment are shown separately. Details preview replacement upkeep/net income. Bankruptcy drops paid upkeep but retains free purchased tools, learned skills and manuscripts.', '',
    '## Knight control and revised career coefficients', '',
    'Knight values are read from the local Progress Knight source. Currencies are not equivalent. Pay ratios deliberately differ for ordinary work and creative entry; the control is the linked training/pay/upkeep structure, not literal copied prices. Normal-game base XP equals the original Knight coefficients.', '',
    '| Role | Knight pay | Preview pay | Knight base XP | Preview base XP |', '| --- | ---: | ---: | ---: | ---: |'];
Object.keys(originalJobs).forEach((old, i) => {
    const name = old === 'Full-Time Author' ? 'Commissioned Author' : old;
    const data = candidate.jobBaseData[name], knight = Object.values(knightJobs)[i];
    lines.push(`| ${name} | ${number(knight.income)} | ${number(data.income)} | ${number(knight.maxXp)} | ${number(data.maxXp)} |`);
});
lines.push('', '## Retained upgrade ladder', '', '| Item | Upfront | Upkeep/day | Effect |', '| --- | ---: | ---: | --- |');
for (const item of Object.values(candidate.gameData.itemData)) lines.push(`| ${item.name} | ${number(item.baseData.purchasePrice || 0)} | ${number(item.getExpense())} | ${item.getEffectDescription().replaceAll('|', ';')} |`);
lines.push('', 'The six homes and three transport tiers are exclusive. Planner/Home Library, Library Card/Masterclass, and Used Laptop/Pro Writing Software replace within their respective slots. Standalone supports stack. Most recurring access gates remain 100 days of upkeep; no cash purchase is charged for those tiers. Removed assets and old tooltip entries remain for legacy saves; the preview uses structured retained-item effects. The Landlord badge maps to Suburban. Editor is a per-manuscript service, with Style Guide access granted for legacy ownership.', '',
    '## Measured pacing and sustainability', '',
    `Matrix: ${matrix.runs.length} scenarios, including all three authors × four allocations × two actual lives, three paid-editor pairs, ordinary/general-career controls, promotion-focused training, acceleration and a three-book control. The ten-life run is separate. Times below are ordinary real minutes; caps never grant synthetic inheritance.`, '',
    '| Beatrice, free editing | Life | First book | Paid housing held a year | Final job | Books | Independence | Qualifying game days |',
    '| --- | ---: | ---: | ---: | --- | ---: | ---: | ---: |');
for (const r of matrix.runs.filter(r => r.author === 'author1' && r.careerPolicy === 'creative' && r.editor === 'free' && !r.accelerated && r.bookLimit === null && r.skillPolicy === 'balanced')) for (const l of r.lives) lines.push(`| ${r.strategy} | ${l.life} | ${minutes(l.milestones.firstBookSeconds)} | ${minutes(l.milestones.sustainableHomeSeconds)} | ${l.job} | ${l.books} | ${minutes(l.milestones.writingIndependenceSeconds)} | ${number(l.independentGameDays)} |`);
lines.push('', '## Ordinary versus creative career (mixed writing, free editing)', '', '| Career policy | Life | Final job | Full-work wage/day | Books |', '| --- | ---: | --- | ---: | ---: |');
for (const r of matrix.runs.filter(r => r.author === 'author1' && r.strategy === 'mixed' && r.editor === 'free' && !r.accelerated && ['ordinary', 'creative'].includes(r.careerPolicy))) for (const l of r.lives) lines.push(`| ${r.careerPolicy} | ${l.life} | ${l.job} | $${number(l.dailyJobPayAtFullWork)} | ${l.books} |`);
lines.push('', '## Paid-editing opportunity cost', '',
    'Paired first/second lives for Beatrice; whole-policy differences include subsequent audience and equipment effects. A negative net difference means self-editing generated more receipts after service costs under that policy.', '',
    '| Policy | Life | Extra receipts over free editing | Editor fees | Difference after fees |', '| --- | ---: | ---: | ---: | ---: |');
for (const paid of matrix.runs.filter(r => r.editor === 'paid-wait')) {
    const free = matrix.runs.find(r => r.author === paid.author && r.strategy === paid.strategy && r.editor === 'free' && r.careerPolicy === paid.careerPolicy && !r.accelerated && r.bookLimit === null && r.skillPolicy === paid.skillPolicy);
    paid.lives.forEach((l, i) => { const extra = l.royalties - free.lives[i].royalties; lines.push(`| ${paid.strategy} | ${l.life} | $${number(extra)} | $${number(l.editing)} | $${number(extra - l.editing)} |`); });
}
lines.push('', '## Ten actual lives (existing rules)', '', '| Life | Final career | Books | First independence (minutes) | Qualifying game days |', '| ---: | --- | ---: | ---: | ---: |');
for (const l of long.lives) lines.push(`| ${l.life} | ${l.job} | ${l.books} | ${minutes(l.milestones.writingIndependenceSeconds)} | ${number(l.independentGameDays)} |`);
lines.push('', 'First discovered life under this heuristic (not proof of earliest possible access):', '', '| Career / upgrade / milestone | Life |', '| --- | ---: |');
for (const [name, reached] of Object.entries(long.firstReached).filter(([name]) => !name.startsWith('skill:'))) lines.push(`| ${name} | ${reached.life} |`);
const allLives = matrix.runs.flatMap(r => r.lives);
lines.push('', '## Validation and limits', '',
    `- ${matrix.runs.length} matrix scenarios; ${allLives.length} measured lives. Matrix bankruptcies: ${allLives.reduce((s, l) => s + l.bankruptcies, 0)}. Largest cash reconciliation error: $${Math.max(...allLives.map(l => Math.abs(l.receiptsReconcileError))).toExponential(3)}.`,
    '- Mixed ordinary-speed first-life sustained housing improves from about 53 to 18 minutes in the creative-career control. Early job/publication targets remain provisional; the job-only housing result is just under the seven-minute lower target.',
    '- Independence requires 365 completed observed game days of editing-adjusted book income exceeding feasible full-time employment and covering upkeep. Three early releases still expire; ongoing releases can support independence for multiple game years.',
    '- The ten-life policy reaches independence in life two and several later lives, but not every later life. Late audience growth and wage/expense jumps still need playtesting. First-discovery measurements are observations, not new retirement targets.',
    '- Existing late retirement gates still block first-life completion even with extreme wealth/training or acceleration. Further retirement/legacy targets and UI remain deferred.',
    '- Audit checks all 18 retained assets, removed-item replacements, skill/equipment independence, duplicate unlock signatures, badge item references and prerequisite cycles. Tests cover new priority modes, learned craft transfer, replacement budget calculations and insolvency retention.',
    '- Browser checks cover target add/remove, preview reload, upgrade budget details and a narrow 390-pixel viewport in the current dark theme. Full theme/device/accessibility playtesting is still pending.', '',
    'Reproduce: `node scripts/audit-career-data.cjs`, `node scripts/measure-career-revision.cjs`, `node scripts/simulate-progression.cjs --profile career --career-policy creative --lives 10 --author author1 --strategy transition --editor paid-wait --out reports/career-revision-ten-lives.json`, then `node scripts/summarize-career-revision.cjs`.', '');
fs.writeFileSync('reports/CAREER-REVISION.md', lines.join('\n'));
