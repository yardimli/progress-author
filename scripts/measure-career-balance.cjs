// First-life comparisons only. Existing retirement rules are never modified.
const fs = require('node:fs');
const path = require('node:path');
const { simulate } = require('./simulate-progression.cjs');
function scenarios() {
    const result = [];
    for (const author of ['author1', 'author3', 'author4']) {
        for (const strategy of ['job-only', 'mixed', 'writing-heavy', 'transition']) {
            for (const editor of strategy === 'job-only' ? ['free'] : ['free', 'paid-wait', 'paid-free']) {
                result.push({ author, strategy, editor });
            }
        }
        result.push({ author, strategy: 'writing-heavy', editor: 'free', bookLimit: 3 });
    }
    for (const transitionSeconds of [300, 900]) result.push({ author: 'author1', strategy: 'transition', transitionSeconds });
    for (const approach of ['commercial', 'crafted']) result.push({ author: 'author1', strategy: 'writing-heavy', editor: 'paid-wait', approach });
    return result;
}
if (require.main === module) {
    const output = process.argv[2] || 'reports/non-retirement-balance.json';
    const runs = [];
    for (const scenario of scenarios()) {
        runs.push(simulate({ profile: 'career', lives: 1, careerPolicy: 'creative', ...scenario }));
        console.log(`${runs.length}: ${scenario.author}/${scenario.strategy}/${scenario.editor || 'free'}${scenario.bookLimit ? '/three-books-only' : ''}`);
    }
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, JSON.stringify({
        scope: 'Fresh first lives, ordinary speed, existing lifespan. No retirement tuning. Seed 12345.',
        policy: 'Five-second decisions; creative career with highest base-pay eligible job, lowest-level eligible skill across categories, upgrades under 65% of current gross income with current editor fee reserved. Default scene/genre, continuous writing unless capped at three books. Transition at 600 seconds unless specified.',
        limitations: 'Heuristics, not optimal play or user testing. Paid-free and paid-wait can coincide when funds suffice. Independence uses 365 completed game days of observed sales after editing, covering upkeep and exceeding actual wages and feasible full-time employment. Tool purchases are separate. No inheritance or acceleration comparisons in this report.',
        runs
    }, null, 2) + '\n');
    console.log(`Wrote ${runs.length} scenarios to ${output}`);
}
module.exports = { scenarios };
