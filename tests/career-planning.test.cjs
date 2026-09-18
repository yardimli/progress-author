const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createGame } = require('./helpers/headless-game.cjs');
test('runway integrates declining sales and reserves pending editing', () => {
    const g = createGame({ profile: 'career' });
    g.gameData.workWritingBalance = 100;
    g.gameData.coins = 1000;
    g.gameData.currentBook = 'test';
    g.gameData.manuscript = { editor: 'paid', editorFee: 250 };
    g.getExpense = () => 100;
    g.gameData.completedBooks = [{ sales: { startDay: g.gameData.days, duration: 10, launchRate: 200 } }];
    const b = g.careerBudget();
    assert.equal(b.available, 750); assert.equal(b.net, 100);
    assert.ok(Math.abs(b.runway - 17.5) < 1e-8);
    g.gameData.workWritingBalance = 0; g.getExpense = () => 0;
    assert.equal(g.careerBudget().runway, null);
});
test('daily finance tracks exact sales across boundaries and survives reload', () => {
    const g = createGame({ profile: 'career' });
    const start = g.gameData.days;
    g.gameData.completedBooks = [{ sales: { startDay: start, duration: 10, launchRate: 100 } }];
    g.recordCareerIncome(60, 1.5); g.recordCareerUpkeep(30, 1.5);
    assert.equal(g.gameData.careerFinance.length, 2);
    assert.equal(g.gameData.careerFinance.reduce((s, r) => s + r.sales, 0), 138.75);
    assert.equal(g.gameData.careerFinance.reduce((s, r) => s + r.upkeep, 0), 30);
    g.saveGameData(); g.loadGameData();
    assert.equal(g.gameData.careerFinance[1].observed, .5);
    for (let i = 0; i < 500; i++) { g.gameData.days++; g.careerFinanceRow(Math.floor(g.gameData.days)); }
    assert.ok(g.gameData.careerFinance.length <= 366);
});
test('independence needs a full observed year and beats employment after editing', () => {
    const g = createGame({ profile: 'career' }), end = Math.floor(g.gameData.days);
    g.gameData.careerFinance = Array.from({ length: 365 }, (_, i) => ({ day: end - 365 + i, observed: 1, sales: 100, editing: 10, work: 0, benchmark: 95, upkeep: 50 }));
    assert.equal(g.writingLivelihood().qualified, false);
    g.gameData.careerFinance.forEach(row => row.benchmark = 80);
    assert.equal(g.writingLivelihood().qualified, true);
    g.checkWritingLivelihood(); g.checkWritingLivelihood();
    assert.equal(g.gameData.notifications.filter(n => n.name === 'Full-Time Author').length, 1);
    g.gameData.careerFinance.shift(); assert.equal(g.writingLivelihood().qualified, false);
});
test('legacy job automation cannot change employment or allocation', () => {
    const g = createGame({ profile: 'career' });
    const current = g.gameData.currentJob, food = g.gameData.taskData['Food Service'];
    food.baseData.requirements = []; g.gameData.unlocks[food.name] = true;
    g.gameData.workWritingBalance = 65;
    g.checkCareerMilestones(); assert.equal(g.gameData.currentJob, current);
    g.gameData.automation.promote = true; g.gameData.automation.lastDay = null;
    food.baseData.requirements = [{ type: 'books', value: 99 }];
    g.checkCareerMilestones(); assert.equal(g.gameData.currentJob, current);
    food.baseData.requirements = []; g.gameData.days++;
    g.checkCareerMilestones(); assert.equal(g.gameData.currentJob, current);
    assert.equal(g.gameData.workWritingBalance, 65);
    g.saveGameData(); g.loadGameData(); assert.equal(g.gameData.automation.promote, false);
});
test('saved automatic training cannot switch the selected skill and reset clears accounting', () => {
    const g = createGame({ profile: 'career' });
    const focus = g.gameData.taskData.Focus, other = g.gameData.taskData[ g.skillCategories[focus.baseData.category].find(name => name !== focus.name) ];
    focus.level = 20; other.baseData.requirements = []; g.gameData.unlocks[other.name] = true;
    g.gameData.automation.train = true; g.checkCareerMilestones();
    assert.equal(g.gameData.currentSkill, focus);
    g.careerFinanceRow(Math.floor(g.gameData.days)); g.gameData.writingIndependent = true;
    g.rebirthReset(); assert.equal(g.gameData.careerFinance.length, 0);
    assert.equal(g.gameData.writingIndependent, false); assert.equal(g.gameData.automation.train, false);
});

test('hidden journey goals survive reload and return for a new lifetime', () => {
    const g = createGame({ profile: 'release' });
    g.gameData.hiddenJourneyGoals = { jobs: true, writing: true };
    g.gameData.hasUsedEditor = true;
    g.saveGameData(); g.loadGameData();
    assert.equal(g.gameData.hiddenJourneyGoals.jobs, true);
    assert.equal(g.gameData.hiddenJourneyGoals.writing, true);
    g.rebirthReset();
    assert.equal(Object.keys(g.gameData.hiddenJourneyGoals).length, 0);
    assert.equal(g.gameData.hasUsedEditor, true);
});
