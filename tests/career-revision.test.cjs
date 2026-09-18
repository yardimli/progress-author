const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createGame } = require('./helpers/headless-game.cjs');
const { audit } = require('../scripts/audit-career-data.cjs');
test('reduced catalogue has valid art, migration destinations and acyclic distinct prerequisites', () => {
    const result = audit();
    assert.deepEqual(result.errors, []); assert.equal(result.upgrades, 18); assert.equal(result.retiredUpgrades, 19);
    const g = createGame({ profile: 'career' });
    g.skillBaseData.Focus.requirements = [{ type: 'skill', name: 'Typing Speed', value: 1 }];
    assert.ok(audit(g).errors.some(message => message.includes('Circular')));
});
test('craft transfer comes from earned creative levels, is bounded, and survives job changes', () => {
    const g = createGame({ profile: 'career' }), craft = g.gameData.taskData['Typing Speed'];
    const base = craft.getXpGain();
    g.gameData.currentJob = g.gameData.taskData.Intern;
    assert.equal(craft.getXpGain(), base);
    g.gameData.taskData.Intern.level = 100;
    assert.equal(craft.getXpGain(), base * 1.1);
    g.gameData.currentJob = g.gameData.taskData['Gig Worker'];
    assert.equal(craft.getXpGain(), base * 1.1);
    g.gameData.taskData.Intern.level = 100000;
    assert.equal(craft.getXpGain(), base * 1.25);
});
test('priority targets train prerequisites, respect order and persist without changing allocation', () => {
    const g = createGame({ profile: 'career' });
    g.gameData.unlocks.Focus = true;
    g.gameData.automation = { train: true, trainingMode: 'targets', lastDay: null };
    g.addTrainingTarget('Typing Speed', 20); g.addTrainingTarget('Focus', 30);
    g.gameData.workWritingBalance = 70;
    assert.equal(g.nextTrainingTask().name, 'Focus');
    g.gameData.taskData.Focus.level = 7; g.gameData.unlocks['Typing Speed'] = true;
    g.runCareerAutomation(); assert.equal(g.gameData.currentSkill.name, 'Typing Speed');
    g.gameData.taskData['Typing Speed'].level = 20;
    assert.equal(g.nextTrainingTask().name, 'Focus');
    g.saveGameData(); g.loadGameData();
    assert.equal(g.gameData.automation.targets.length, 2); assert.equal(g.gameData.workWritingBalance, 70);
    assert.equal(g.addTrainingTarget('Missing', 1), false); assert.equal(g.addTrainingTarget('Focus', Infinity), false);
});
test('promotion training finds craft prerequisites and skips retirement-gated targets', () => {
    const g = createGame({ profile: 'career' });
    g.gameData.currentJob = g.gameData.taskData.Intern; g.gameData.currentJob.level = 10;
    g.gameData.automation.trainingMode = 'promotion';
    g.gameData.taskData.Focus.level = 10; g.gameData.unlocks['Typing Speed'] = true;
    assert.equal(g.nextTrainingTask().name, 'Typing Speed');
    g.gameData.currentJob = g.gameData.taskData['Senior Editor'];
    assert.equal(g.nextTrainingTask(), null);
});
test('bankruptcy stops upkeep while keeping purchased free tools, training and manuscript', () => {
    const g = createGame({ profile: 'career' });
    g.gameData.coins = 100000; g.gameData.unlocks['Used Laptop'] = g.gameData.unlocks.Planner = true;
    g.setMisc('Used Laptop'); g.setMisc('Planner'); g.gameData.taskData['Typing Speed'].level = 17;
    g.gameData.currentBook = 'draft'; g.gameData.manuscript = { editor: 'paid', editorFee: 500, awaitingEditor: true };
    g.goBankrupt();
    assert.deepEqual(Array.from(g.gameData.currentMisc, item => item.name), ['Used Laptop']);
    assert.equal(g.getExpense(), 0); assert.equal(g.gameData.taskData['Typing Speed'].level, 17);
    assert.equal(g.gameData.currentBook, 'draft'); assert.equal(g.gameData.manuscript.awaitingEditor, true);
    assert.equal(g.getUpgradeState('Used Laptop').label, 'Equipped');
    g.setMisc('Used Laptop'); assert.equal(g.getUpgradeState('Used Laptop').label, 'Purchased');
});
test('upgrade budget replaces upkeep rather than stacking tiers and never changes live equipment', () => {
    const g = createGame({ profile: 'career' });
    g.gameData.coins = 1e10; g.gameData.unlocks.Planner = true; g.setMisc('Planner');
    const before = g.getExpense(), coins = g.gameData.coins;
    const budget = g.getUpgradeBudget('Home Library');
    assert.equal(budget.upkeep, before - g.gameData.itemData.Planner.getExpense() + g.gameData.itemData['Home Library'].getExpense());
    assert.equal(budget.replacing, 'Planner'); assert.equal(g.getExpense(), before); assert.equal(g.gameData.coins, coins);
});
