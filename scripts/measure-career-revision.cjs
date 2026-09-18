const fs = require('node:fs');
const { simulate } = require('./simulate-progression.cjs');
const scenarios = [];
for (const author of ['author1', 'author3', 'author4']) for (const strategy of ['job-only', 'mixed', 'writing-heavy', 'transition']) scenarios.push({ author, strategy, lives: 2 });
for (const strategy of ['mixed', 'writing-heavy', 'transition']) scenarios.push({ author: 'author1', strategy, editor: 'paid-wait', lives: 2 });
scenarios.push({ author: 'author1', strategy: 'mixed', careerPolicy: 'progression', lives: 2 });
scenarios.push({ author: 'author1', strategy: 'writing-heavy', skillPolicy: 'promotion', lives: 2 });
scenarios.push({ author: 'author1', strategy: 'mixed', accelerated: true, lives: 1 });
scenarios.push({ author: 'author1', strategy: 'writing-heavy', bookLimit: 3, lives: 1 });
scenarios.push({ author: 'author1', strategy: 'mixed', careerPolicy: 'ordinary', lives: 2 });
const report = {
    scope: 'Revised career/18-item candidate. Existing retirement, inheritance and lifespan rules unchanged; actual retirement only.',
    limitations: 'Heuristic five-second decisions, not optimal play. Ordinary-speed and accelerated rows are explicitly separated. Life cap 7200 real seconds; never synthesize a retirement. First-reached entries mean discovered access, not purchase. Production rolling-year independence; editor fees and purchases accounted separately.',
    runs: []
};
for (const scenario of scenarios) {
    report.runs.push(simulate({ profile: 'career', careerPolicy: 'creative', ...scenario }));
    fs.writeFileSync('reports/career-revision-matrix.json', JSON.stringify(report, null, 2) + '\n');
    console.log(`Completed ${report.runs.length}/${scenarios.length}: ${JSON.stringify(scenario)}`);
}
