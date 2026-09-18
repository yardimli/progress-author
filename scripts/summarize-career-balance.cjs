const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function summarize(report, targets) {
    const minutes = value => value === null ? '—' : (value / 60).toFixed(2);
    const money = value => Math.round(value).toLocaleString('en-US');
    const standard = report.runs.filter(r => r.bookLimit === null && r.approach === 'balanced' && r.transitionSeconds === 600);
    const lines = ['# Non-retirement balance measurements', '',
        'Fresh first lives at ordinary speed; existing retirement rules are unchanged. These are deterministic policy comparisons, not optimal play or proof of release balance.', '',
        'Regenerate with `node scripts/measure-career-balance.cjs` then `node scripts/summarize-career-balance.cjs`.', '',
        '## First-life pacing (free editing)', '',
        'Times are real minutes. Sustained housing means retaining a paid home for 365 game days without bankruptcy. Independence uses the same rolling-year predicate as the game, including the full-time wage comparison.', '',
        '| Author | Policy | First promotion | First book | Sustained housing | Writing majority | Independence | Books |',
        '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |'];
    for (const r of standard.filter(r => r.editor === 'free')) {
        const l = r.lives[0], m = l.milestones;
        lines.push(`| ${r.author} | ${r.strategy} | ${minutes(m.firstPromotionSeconds)} | ${minutes(m.firstBookSeconds)} | ${minutes(m.sustainableHomeSeconds)} | ${minutes(m.writingMajoritySeconds)} | ${minutes(m.writingIndependenceSeconds)} | ${l.books} |`);
    }
    lines.push('', '## Paid editor compared with free editing', '',
        'Differences cover the whole first life, including knock-on effects on purchases and later books. Receipt difference minus editor fees is not a controlled per-book return experiment.', '',
        '| Author | Policy | Extra sales receipts | Editor fees | Extra receipts less fees | Extra readers | Waiting (real minutes) |',
        '| --- | --- | ---: | ---: | ---: | ---: | ---: |');
    for (const r of standard.filter(r => r.editor === 'paid-wait')) {
        const l = r.lives[0], free = standard.find(f => f.author === r.author && f.strategy === r.strategy && f.editor === 'free').lives[0];
        const extra = l.royalties - free.royalties;
        lines.push(`| ${r.author} | ${r.strategy} | $${money(extra)} | $${money(l.editing)} | $${money(extra - l.editing)} | ${l.readership - free.readership} | ${minutes(l.editorWaitSeconds)} |`);
    }
    lines.push('', '## Provisional pacing targets', '', targets.status + '.', '', '| Author / policy | Metric | Measured minutes | Target minutes | Result |', '| --- | --- | ---: | ---: | --- |');
    for (const r of standard.filter(r => r.editor === 'free')) for (const t of targets.targets.filter(t => t.strategies.includes(r.strategy))) {
        const v = r.lives[0].milestones[t.metric];
        lines.push(`| ${r.author} / ${r.strategy} | ${t.metric} | ${minutes(v)} | ${minutes(t.min)}–${minutes(t.max)} | ${v === null ? 'Not reached' : v < t.min ? 'Early' : v > t.max ? 'Late' : 'Within band'} |`);
    }
    const capped = report.runs.filter(r => r.bookLimit === 3);
    const independent = report.runs.filter(r => r.lives[0].milestones.writingIndependenceSeconds !== null);
    const fallbacks = standard.filter(r => r.editor === 'paid-free');
    const sameFallback = fallbacks.filter(r => JSON.stringify(r.lives) === JSON.stringify(standard.find(w => w.author === r.author && w.strategy === r.strategy && w.editor === 'paid-wait').lives)).length;
    lines.push('', '## Controls and accounting', '',
        `- ${report.runs.length} scenarios; ${independent.length} reached the strict writing-independence test in this first life.`,
        `- Three-book controls: ${capped.map(r => `${r.author}: ${r.lives[0].books} books, $${money(r.lives[0].dailyRoyalties)}/day final sales`).join('; ')}.`,
        `- Paid/free fallback produced identical results to waiting in ${sameFallback}/${fallbacks.length} standard comparisons. This does not test severe cash shortages; those paths also have dedicated unit tests.`,
        `- Largest cash reconciliation error: $${Math.max(...report.runs.map(r => Math.abs(r.lives[0].receiptsReconcileError))).toExponential(3)}.`,
        `- Total bankruptcies: ${report.runs.reduce((s, r) => s + r.lives[0].bankruptcies, 0)}.`, '',
        '## Additional policies', '', '| Policy | First book (minutes) | Books | Readers | Total sales | Editor fees | Independence (minutes) |', '| --- | ---: | ---: | ---: | ---: | ---: | ---: |');
    for (const r of report.runs.filter(r => r.bookLimit === null && (r.approach !== 'balanced' || r.transitionSeconds !== 600))) {
        const l = r.lives[0];
        lines.push(`| ${r.strategy}, ${r.approach}, transition ${r.transitionSeconds}s | ${minutes(l.milestones.firstBookSeconds)} | ${l.books} | ${l.readership} | $${money(l.royalties)} | $${money(l.editing)} | ${minutes(l.milestones.writingIndependenceSeconds)} |`);
    }
    lines.push('', '## Limits', '', report.policy, '', report.limitations, '',
        'author1 = Beatrice Hansen; author3 = Rosemary Lis; author4 = James Markman. All policies prefer the creative career, so switching into a low-level creative role can temporarily reduce pay. Other branches, targeted skill choices and active scene matching still need comparisons. No retirement, inheritance or lifespan settings were tuned.', '');
    return lines.join('\n');
}
if (require.main === module) {
    const report = JSON.parse(fs.readFileSync(path.join(root, 'reports/non-retirement-balance.json')));
    const targets = JSON.parse(fs.readFileSync(path.join(root, 'reports/balance-targets.json')));
    fs.writeFileSync(path.join(root, 'reports/NON-RETIREMENT-BALANCE.md'), summarize(report, targets));
}
module.exports = { summarize };
