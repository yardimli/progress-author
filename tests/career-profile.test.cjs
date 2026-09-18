const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { createGame } = require('./helpers/headless-game.cjs');

const candidate = () => createGame({ profile: 'career' });

test('candidate has 18 valid upgrades and all prerequisites refer to retained entities', () => {
    const g = candidate();
    assert.equal(Object.keys(g.itemBaseData).length, 18);
    assert.equal(Object.keys(createGame().itemBaseData).length, 37);
    const signatures = new Set();
    for (const entity of [...Object.values(g.jobBaseData), ...Object.values(g.skillBaseData), ...Object.values(g.itemBaseData)]) {
        for (const r of entity.requirements || []) {
            if (['skill', 'job'].includes(r.type)) assert.ok(g.gameData.taskData[r.name], `${entity.name}: ${r.name}`);
            if (r.type === 'shop') assert.ok(g.gameData.itemData[r.name]);
        }
        if (entity.requirements.length) {
            const signature = JSON.stringify(entity.requirements.map(r => JSON.stringify(r)).sort());
            assert.ok(!signatures.has(signature), `duplicate unlock: ${entity.name}`);
            signatures.add(signature);
        }
    }
    assert.equal(g.badgeBaseData.landlord.requirements[0].name, 'Suburban');
});

test('allocation reduces wages and job training even while no book is active, never independent training', () => {
    const g = candidate(), job = g.gameData.currentJob, skill = g.gameData.currentSkill;
    const pay = g.getIncome(), jobXp = job.getXpGain(), skillXp = skill.getXpGain();
    g.gameData.workWritingBalance = 60;
    assert.equal(g.getIncome(), pay * .4);
    assert.equal(job.getXpGain(), jobXp * .4);
    assert.equal(skill.getXpGain(), skillXp);
    g.gameData.workWritingBalance = 100;
    assert.equal(g.getIncome(), 0);
    assert.equal(job.getXpGain(), 0);
    assert.equal(skill.getXpGain(), skillXp);
});

test('replacement equipment charges once and only active tiers contribute expense and effects', () => {
    const g = candidate();
    g.gameData.coins = 1e9;
    for (const name of ['Planner', 'Home Library', 'Used Laptop', 'Pro Writing Software']) g.gameData.unlocks[name] = true;
    const before = g.gameData.coins;
    g.setMisc('Planner');
    assert.equal(g.gameData.coins, before);
    g.setMisc('Home Library');
    assert.deepEqual(Array.from(g.gameData.currentMisc, i => i.name), ['Home Library']);
    assert.equal(g.gameData.itemData.Planner.getEffect(), 1);
    assert.equal(g.gameData.itemData['Home Library'].getEffect(), 2);
    g.setMisc('Used Laptop');
    assert.equal(g.gameData.coins, before - 500);
    g.setMisc('Pro Writing Software');
    assert.equal(g.gameData.coins, before - 50500);
    assert.ok(!g.gameData.currentMisc.some(i => i.name === 'Used Laptop'));
    g.setMisc('Used Laptop');
    assert.equal(g.gameData.coins, before - 50500);
    assert.equal(g.gameData.currentMisc.filter(i => i.baseData.slot === 'tools').length, 1);
});

test('upkeep must be funded before equipping; insolvency preserves manuscript and purchased tools', () => {
    const g = candidate();
    g.gameData.unlocks['Rented Room'] = true;
    g.setProperty('Rented Room');
    assert.equal(g.gameData.currentProperty.name, 'Homeless');
    g.gameData.coins = 120;
    g.setProperty('Rented Room');
    assert.equal(g.gameData.coins, 120);
    g.gameData.currentBook = 'unfinished';
    g.gameData.wordsWritten = 50;
    g.gameData.ownedItems = ['Used Laptop'];
    g.goBankrupt();
    assert.equal(g.gameData.currentBook, 'unfinished');
    assert.equal(g.gameData.wordsWritten, 50);
    assert.equal(g.gameData.ownedItems[0], 'Used Laptop');
    assert.equal(g.getExpense(), 0);
});

test('structured effects survive prose changes and Typing Speed supports creative wages only', () => {
    const g = candidate();
    for (const data of [...Object.values(g.skillBaseData), ...Object.values(g.itemBaseData)]) data.description = 'Changed display prose';
    g.gameData.taskData.Focus.level = 100;
    g.addMultipliers();
    assert.equal(g.createDynamicMultiplier(['skillXp'])(), 2);
    const creative = g.gameData.taskData.Intern, ordinary = g.gameData.taskData['Gig Worker'];
    const creativePay = creative.getIncome(), ordinaryPay = ordinary.getIncome();
    g.gameData.taskData['Typing Speed'].level = 100;
    assert.equal(creative.getIncome(), creativePay * 2);
    assert.equal(ordinary.getIncome(), ordinaryPay);
    g.gameData.workWritingBalance = 100;
    const writing = g.getRawWritingSpeed();
    g.gameData.currentJob = g.gameData.taskData['Commissioned Author'];
    assert.equal(g.getRawWritingSpeed(), writing);
});

test('endgame eligibility requires many retirements even with first-life extreme wealth and levels', () => {
    const g = candidate();
    for (const task of Object.values(g.gameData.taskData)) task.level = 100000;
    g.gameData.coins = 1e15;
    g.gameData.booksPublished = 100000;
    const endgame = g.jobBaseData['Head of Publishing'];
    assert.equal(g.areRequirementsMet(endgame), false);
    assert.equal(g.areRequirementsMet(g.itemBaseData['Mansion Estate']), false);
    g.gameData.rebirthOneCount = 11;
    assert.equal(g.areRequirementsMet(endgame), false);
    g.gameData.rebirthTwoCount = 1;
    assert.equal(g.areRequirementsMet(endgame), true);
    assert.equal(g.areRequirementsMet({ requirements: [{ type: 'unknown', value: 1 }] }), false);
});

test('imported legacy items migrate idempotently with backup, replacement access and no invented refunds', () => {
    const legacy = createGame();
    legacy.gameData.currentProperty = legacy.gameData.itemData['Large House'];
    legacy.gameData.currentMisc = ['Planner', 'Focus Supplements', 'Editor'].map(n => legacy.gameData.itemData[n]);
    legacy.gameData.ownedItems = ['Large House', 'Planner', 'Focus Supplements', 'Editor'];
    legacy.gameData.currentJob = legacy.gameData.taskData['Full-Time Author'];
    legacy.gameData.currentJob.level = 42;
    legacy.gameData.unlocks['Full-Time Author'] = true;
    legacy.gameData.coins = 12345;
    const original = JSON.stringify(legacy.gameData);
    const g = candidate();
    g.localStorage.setItem('authorsJourneySave', 'normal game untouched');
    g.localStorage.setItem(g.gameSaveKey(), original);
    g.loadGameData();
    assert.equal(g.gameData.currentJob.name, 'Commissioned Author');
    assert.equal(g.gameData.currentJob.level, 42);
    assert.equal(g.gameData.currentProperty.name, 'Suburban');
    assert.deepEqual(Array.from(g.gameData.currentMisc, i => i.name), ['Home Library', 'Style Guide']);
    assert.equal(g.gameData.coins, 12345);
    assert.equal(g.localStorage.getItem(g.gameSaveKey() + '-before-career-preview-1'), original);
    assert.equal(g.localStorage.getItem('authorsJourneySave'), 'normal game untouched');
    g.saveGameData();
    const once = g.localStorage.getItem(g.gameSaveKey());
    g.loadGameData(); g.saveGameData();
    assert.equal(g.localStorage.getItem(g.gameSaveKey()), once);
});

test('candidate XP matches Knight curve and inherits through actual retirement without save leakage', () => {
    const g = candidate(), task = g.gameData.currentJob;
    task.level = 100;
    assert.equal(task.getMaxXp(), Math.round(task.baseData.maxXp * 101 * 1.01 ** 100));
    g.gameData.rebirthOneCount++;
    g.rebirthReset();
    assert.equal(task.maxLevel, 100);
    assert.equal(task.getMaxLevelMultiplier(), 11);
    g.saveGameData();
    assert.equal(g.localStorage.getItem('authorsJourneySave'), null);
    assert.equal(vm.runInContext('IS_CAREER_PREVIEW', g), true);
});
