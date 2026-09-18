// Run with: node --test tests/balance.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
function game() {
    const context = vm.createContext({ performance, console, window: { location: { hostname: 'localhost' }, addEventListener() {} },
        document: { getElementById: () => null, querySelectorAll: () => [] }, requestAnimationFrame() {},
        localStorage: { getItem: () => null, setItem() {} } });
    for (const file of ['state', 'classes', 'utils', 'formulas', 'mechanics', 'notifications', 'journal', 'save', 'offline', 'writing-plan', 'main']) {
        vm.runInContext(fs.readFileSync(path.join(root, 'js', file + '.js'), 'utf8'), context);
    }
    for (const [name, file] of [['jobBaseData', 'jobs'], ['skillBaseData', 'skills'], ['itemBaseData', 'items-legacy']]) {
        context[name] = JSON.parse(fs.readFileSync(path.join(root, 'data', file + '.json')));
    }
    context.potionsBaseData = JSON.parse(fs.readFileSync(path.join(root, 'data/potions.json')));
    vm.runInContext(`
        badgeBaseData = {};
        gameData.currentMisc = [];
        for (const [name, data] of Object.entries(jobBaseData)) gameData.taskData[name] = new Job(data);
        for (const [name, data] of Object.entries(skillBaseData)) gameData.taskData[name] = new Skill(data);
        for (const [name, data] of Object.entries(itemBaseData)) gameData.itemData[name] = new Item(data);
        gameData.currentJob = gameData.taskData['Gig Worker'];
        gameData.currentSkill = gameData.taskData.Focus;
        gameData.currentProperty = gameData.itemData.Homeless;
        isAlive = () => true;
        logEvent = () => {};
    `, context);
    return context;
}
test('early royalties support writing; fame grows sublinearly', () => {
    const g = game();
    assert.equal(g.getBookRoyalty(0), 12);
    assert.equal(g.getBookRoyalty(50), 42);
    g.gameData.fame = 100;
    const middle = g.getBookRoyalty(50);
    g.gameData.fame = 1000;
    assert.ok(g.getBookRoyalty(50) < middle * 2);
    assert.ok(g.getBookRoyalty(100) > g.getBookRoyalty(50));
});
test('XP and income are independent of frame rate', () => {
    const simulate = fps => {
        const g = game();
        g.deltaTime = 1 / fps;
        for (let i = 0; i < 60 * fps; i++) {
            g.increaseDays(); g.doCurrentTask(g.gameData.currentJob);
        }
        return g.gameData;
    };
    const a = simulate(30), b = simulate(144);
    assert.equal(a.currentJob.level, b.currentJob.level);
    assert.ok(Math.abs(a.currentJob.xp - b.currentJob.xp) < 1e-6);
    assert.ok(Math.abs(a.coins - b.coins) < 1e-6);
    assert.ok(Math.abs(a.days - (365 * 20 + 180)) < 1e-6);
    assert.ok(Math.abs(a.coins - 7200) < 1e-6);
});
test('later levels take longer and extreme boosts have diminishing returns', () => {
    const g = game(), job = g.gameData.currentJob;
    job.level = 100;
    assert.ok(job.getMaxXp() > 50 * 101 * Math.pow(1.01, 100));
    assert.equal(g.softenMultiplier(2), 2);
    assert.equal(g.softenMultiplier(100), 20);
    g.gameData.workWritingBalance = 100;
    g.gameData.writingMultiplier = 1e8;
    assert.equal(g.getWritingSpeed(), 600);
    g.gameData.workWritingBalance = 0;
    assert.equal(g.getWritingSpeed(), 0);
});
test('jobs and skills have cheaper early levels and smoothly rising late costs', () => {
    const g = game();
    for (const task of [g.gameData.currentJob, g.gameData.currentSkill]) {
        const oldCost = level => Math.round(task.baseData.maxXp * (level + 1) * Math.pow(1.01, level) * (1 + level / 100));
        let previous = 0, earlyTotal = 0, oldEarlyTotal = 0;
        for (let level = 0; level <= 200; level++) {
            task.level = level;
            const cost = task.getMaxXp();
            assert.ok(cost > previous, `cost must rise at level ${level}`);
            if (level < 20) { earlyTotal += cost; oldEarlyTotal += oldCost(level); }
            if (level === 10) assert.ok(cost < oldCost(level) * 0.4);
            if (level === 20) assert.ok(cost < oldCost(level) * 0.56);
            if (level >= 40 && level <= 100) assert.equal(cost, oldCost(level));
            if (level > 100) assert.ok(cost < oldCost(level));
            previous = cost;
        }
        assert.ok(earlyTotal < oldEarlyTotal * 0.5, 'reaching level 20 takes under half the previous XP');
        task.level = 5;
        task.xp = task.getMaxXp() + 3;
        task.getXpGain = () => 0;
        task.increaseXp();
        assert.equal(task.level, 6);
        assert.equal(task.xp, 3, 'saved surplus XP is retained');
    }
});
test('royalty migration preserves legacy income and only runs once', () => {
    const g = game();
    g.gameData.completedBooks = [{ id: 'book1', quality: 0, royalties: 0.1 }];
    g.gameData.royalties = 5.1;
    g.loadGameData();
    assert.equal(g.gameData.completedBooks[0].royalties, 12);
    assert.equal(g.gameData.royalties, 17);
    g.loadGameData();
    assert.equal(g.gameData.royalties, 17);
});

test('keeping an older version migrates the save without resetting progress', () => {
    const g = game();
    const saved = JSON.parse(JSON.stringify(g.gameData));
    saved.version = '1.0.5'; saved.coins = 12345;
    g.localStorage.getItem = () => JSON.stringify(saved);
    g.loadGameData();
    assert.equal(g.gameData.version, '1.1.0');
    assert.equal(g.gameData.coins, 12345);
    assert.equal(g.gameData.currentJob.name, 'Gig Worker');
});
test('background resume clamps elapsed time and paused scenes cannot add words', () => {
    const g = game();
    g.isPaused = true;
    g.gameData.currentBook = 'book1';
    g.handleSceneClick('Action');
    assert.equal(g.gameData.wordsWritten, 0);
    g.lastTime = 0;
    g.gameLoop(3600000);
    assert.equal(g.deltaTime, 0.1);
    assert.equal(g.gameData.wordsWritten, 0);
});
test('all introduction artwork exists in the game asset set', () => {
    const slides = JSON.parse(fs.readFileSync(path.join(root, 'data/introSlides.json')));
    for (const slide of Object.values(slides)) {
        assert.notEqual(slide.filefolder, 'intro');
        assert.ok(fs.existsSync(path.join(root, 'img', slide.filefolder + '256', slide.filename)));
    }
});
test('animation reuses cached nodes and skips unchanged DOM writes', () => {
    const g = game();
    let queries = 0, writes = 0;
    const node = () => ({ isConnected: true, style: new Proxy({}, {
        set(target, key, value) { writes++; target[key] = value; return true; }
    }) });
    const nodes = { 'row Gig Worker': node(), 'row Focus': node(), writingProgressBar: node() };
    g.document.getElementById = id => {
        queries++;
        return id.startsWith('row ') ? { querySelector: () => nodes[id] } : nodes[id];
    };
    vm.runInContext(fs.readFileSync(path.join(root, 'js/ui_updater.js'), 'utf8'), g);
    g.updateProgressUI();
    const initialQueries = queries, initialWrites = writes;
    for (let i = 0; i < 100; i++) g.updateProgressUI();
    assert.equal(queries, initialQueries);
    assert.equal(writes, initialWrites);
    g.gameData.currentJob.xp = g.gameData.currentJob.getMaxXp() / 2;
    g.updateProgressUI();
    assert.equal(nodes['row Gig Worker'].style.transform, 'scaleX(0.5)');
    g.gameData.currentJob.level = 1;
    g.gameData.currentJob.xp = 0;
    g.updateProgressUI();
    assert.equal(nodes['row Gig Worker'].style.transform, 'scaleX(0)');
});
test('autosaves coalesce and serialize during idle time', () => {
    const g = game();
    let callback, saves = 0, scheduled = 0;
    g.window.requestIdleCallback = cb => { scheduled++; callback = cb; };
    g.saveGameData = () => saves++;
    g.scheduleGameSave(); g.scheduleGameSave();
    assert.equal(scheduled, 1);
    assert.equal(saves, 0);
    callback();
    assert.equal(saves, 1);
    g.scheduleGameSave();
    assert.equal(scheduled, 2);
});

test('acceleration data, live speed and tooltip consistently specify x6.0', () => {
    const g = game();
    const normal = g.getGameSpeed();
    assert.equal(g.potionsBaseData['Acceleration Potion'].effect, 6);
    g.drinkPotion('acceleration');
    assert.equal(g.gameData.potions.acceleration, 600);
    assert.equal(g.getGameSpeed(), normal * 6);
    const tooltips = JSON.parse(fs.readFileSync(path.join(root, 'data/tooltips.json')));
    assert.ok(tooltips['Acceleration Potion'].includes('x6.0'));
});
test('production potion gates activation and discovery until 600 active seconds', () => {
    const g = game();
    g.window.location.hostname = 'game.example';
    g.isInitialized = true;
    g.gameData.activePlaySeconds = 599.99;
    assert.equal(g.isAccelerationAvailable(), false);
    g.drinkPotion('acceleration');
    assert.equal(g.gameData.potions.acceleration, 0);
    g.gameData.activePlaySeconds = 600;
    assert.equal(g.discoverNextCard().name, 'Acceleration Potion');
    assert.equal(g.isAccelerationAvailable(), true);
    g.drinkPotion('acceleration');
    assert.equal(g.getGameSpeed(), 18);
    assert.equal(g.discoverNextCard(), null);
    for (const host of ['localhost', '127.0.0.1', '[::1]', 'test.localhost']) assert.ok(g.isLocalGameHost(host));
    for (const host of ['localhost.example.com', 'example.com', '192.168.1.10']) assert.equal(g.isLocalGameHost(host), false);
});
test('eligible discoveries no longer wait for a countdown or unread popup', () => {
    const g = game();
    g.jobBaseData = { Intern: g.jobBaseData.Intern };
    g.skillBaseData = { Frugality: g.skillBaseData.Frugality };
    g.itemBaseData = {};
    g.isInitialized = true;
    g.gameData.taskData.Focus.level = 30;
    g.gameData.nextCardUnlockAt = 999999;
    g.popupQueue.push({ type: 'info' });
    assert.equal(g.discoverNextCard().name, 'Intern');
    assert.equal(g.discoverNextCard().name, 'Frugality');
    assert.equal(g.discoverNextCard(), null);
    assert.equal(g.gameData.unlocks.Intern, true);
    assert.equal(g.gameData.unlocks.Frugality, true);
});
test('notifications persist as plain data without pausing or queuing a modal', () => {
    const g = game();
    g.addGameNotification({ type: 'skill', name: 'Focus' });
    g.addGameNotification({ type: 'skill', name: 'Focus' });
    assert.equal(g.gameData.notifications.length, 1);
    assert.equal(g.isPaused, false);
    assert.equal(g.popupQueue.length, 0);
    const save = JSON.stringify(g.gameData);
    g.localStorage.getItem = () => save;
    g.loadGameData();
    assert.equal(g.gameData.notifications[0].name, 'Focus');
    assert.equal(g.gameData.notifications[0].read, false);
});
test('restoring a book resumes its selected scene and can finish the manuscript', () => {
    const g = game();
    g.booksBaseData = { example: { title: 'Example', genre: 'Romance', wordCount: 100 } };
    g.sceneTypesBaseData = { Romance: { Dialogue: ['Hello'], Action: ['Go'] } };
    g.gameData.currentBook = 'example';
    g.gameData.wordsWritten = 99;
    g.gameData.currentBookComposition = { Dialogue: 80, Action: 19 };
    g.gameData.activeScene = 'Action';
    const save = JSON.stringify(g.gameData);
    g.currentAutoSceneType = null;
    g.localStorage.getItem = () => save;
    g.loadGameData();
    assert.equal(g.currentAutoSceneType, 'Action');
    assert.equal(g.gameData.wordsWritten, 99);
    g.document.getElementById = id => id === 'liveWritingText' ? { innerHTML: '' } : null;
    g.getWritingSpeed = () => 10;
    g.writeProgress(g.currentAutoSceneType, 1);
    assert.equal(g.gameData.currentBook, null);
    assert.equal(g.gameData.booksPublished, 1);
    assert.equal(g.gameData.notifications[0].type, 'book');
    assert.equal(g.isPaused, false);
});
test('legacy books recover a scene, invalid progress and missing books safely', () => {
    const g = game();
    g.booksBaseData = { example: { genre: 'Romance', wordCount: 100 } };
    g.sceneTypesBaseData = { Romance: { Dialogue: [], Action: [] } };
    g.gameData.currentBook = 'example';
    g.gameData.wordsWritten = NaN;
    g.gameData.currentBookComposition = { Dialogue: 30, Action: -1, Removed: 10 };
    g.restoreWritingSession();
    assert.equal(g.currentAutoSceneType, 'Dialogue');
    assert.equal(g.gameData.wordsWritten, 0);
    assert.equal(Object.keys(g.gameData.currentBookComposition).length, 1);
    g.gameData.currentBook = 'removed';
    g.restoreWritingSession();
    assert.equal(g.gameData.currentBook, null);
    assert.equal(g.currentAutoSceneType, null);
});
test('debug level editing requires explicit local opt-in', () => {
    for (const [hostname, search, expected] of [['localhost', '', false], ['localhost', '?debug=1', true], ['game.example', '?debug=1', false]]) {
        const context = vm.createContext({ performance, window: { location: { hostname, search } } });
        vm.runInContext(fs.readFileSync(path.join(root, 'js/state.js'), 'utf8'), context);
        assert.equal(context.isDebugMode, expected);
    }
});
test('no non-starting cards share an identical set of unlock requirements', () => {
    const seen = new Map();
    for (const file of ['jobs', 'skills', 'items-legacy']) {
        const data = JSON.parse(fs.readFileSync(path.join(root, 'data', file + '.json')));
        for (const entity of Object.values(data)) {
            if (!entity.requirements?.length) continue;
            const key = JSON.stringify(entity.requirements.map(r => [r.type, r.name || '', r.value]).sort());
            assert.equal(seen.has(key), false, `${entity.name} collides with ${seen.get(key)}`);
            seen.set(key, entity.name);
        }
    }
});
test('paused and background frames do not advance potion unlock playtime', () => {
    const g = game();
    g.isPaused = true;
    g.lastTime = 0;
    g.gameLoop(50);
    assert.equal(g.gameData.activePlaySeconds, 0);
    g.isPaused = false;
    g.document.hidden = true;
    g.gameLoop(100);
    assert.equal(g.gameData.activePlaySeconds, 0);
});
test('active play clock is unscaled and survives a save reload', () => {
    const g = game();
    for (const name of ['updateTypewriter', 'updateUI', 'updateProgressUI', 'checkBadgeUnlocks', 'checkRebirthPrompts', 'scheduleGameSave']) g[name] = () => {};
    g.gameData.potions.acceleration = 600;
    g.lastTime = 0;
    for (let time = 100; time <= 60000; time += 100) g.gameLoop(time);
    assert.ok(Math.abs(g.gameData.activePlaySeconds - 60) < 1e-6);
    assert.ok(Math.abs(g.gameData.days - (365 * 20 + 1080)) < 1e-6);
    g.gameData.nextCardUnlockAt = 67;
    const saved = JSON.stringify(g.gameData);
    g.localStorage.getItem = () => saved;
    g.loadGameData();
    assert.ok(Math.abs(g.gameData.activePlaySeconds - 60) < 1e-6);
    assert.equal(g.gameData.nextCardUnlockAt, 67);
});
test('writing bar has a full-width base for its transform animation', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const tag = html.match(/<div[^>]*id="writingProgressBar"[^>]*>/)[0];
    assert.ok(!/width:\s*0/.test(tag));
    const css = fs.readFileSync(path.join(root, 'css/journal.css'), 'utf8');
    assert.match(css, /#writingProgressBar,\s*\.potion-fill\s*\{\s*width:\s*100%/);
});

function awayGame() {
    const g = game();
    g.gameData.currentAuthor = 'test'; g.gameData.introSeen = true;
    g.gameData.offlineEligible = true; g.gameData.lastProgressAt = 1000000;
    g.isInitialized = true;
    g.authorsBaseData = {}; g.sceneTypesBaseData = { Romance: { Dialogue: ['Example'] } };
    g.booksBaseData = { example: { title: 'Example', genre: 'Romance', wordCount: 100 } };
    return g;
}

test('pacing milestones and inherited experience remain attainable', t => {
    const simulate = inherited => {
        const g = game();
        g.jobCategories = g.buildCategories(g.jobBaseData);
        g.skillCategories = g.buildCategories(g.skillBaseData);
        g.itemCategories = g.buildCategories(g.itemBaseData);
        g.setCustomEffects(); g.addMultipliers();
        g.gameData.currentJob.maxLevel = inherited.jobEnd || 0;
        g.gameData.currentSkill.maxLevel = inherited.skillEnd || 0;
        g.deltaTime = .1;
        const result = {};
        for (let tick = 1; tick <= 60000; tick++) {
            g.updateLogic();
            for (const [name, task] of [['job', g.gameData.currentJob], ['skill', g.gameData.currentSkill]]) {
                for (const level of [10, 20, 100]) if (task.level >= level && !result[name + level]) result[name + level] = Math.round(tick / 10);
            }
            if (result.job100 && result.skill100) break;
        }
        result.jobEnd = g.gameData.currentJob.level;
        result.skillEnd = g.gameData.currentSkill.level;
        return result;
    };
    const first = simulate({}), next = simulate(first);
    t.diagnostic(JSON.stringify({ firstLife: first, nextLife: next }));
    assert.ok(first.job10 < 120 && first.skill10 < 180);
    assert.ok(first.job20 < 600 && first.skill20 < 600);
    assert.ok(next.job20 < first.job20 && next.skill20 < first.skill20);
    assert.ok(next.jobEnd > first.jobEnd && next.skillEnd > first.skillEnd);
});

test('new short manuscripts, editorial plans, purchases and queues survive reload', () => {
    const g = awayGame();
    g.booksBaseData.example.wordCount = 80000;
    g.gameData.currentBook = 'example';
    assert.equal(g.getBookLength(), 80000, 'existing manuscripts retain their length');
    assert.equal(g.getNewManuscriptLength(), 12000);
    g.gameData.booksPublished = 1; assert.equal(g.getNewManuscriptLength(), 18000);
    g.gameData.booksPublished = 2; assert.equal(g.getNewManuscriptLength(), 24000);
    g.gameData.manuscript = { title: 'My story', approach: 'crafted', targetWords: 12000, edit: 'revise' };
    g.gameData.ownedItems = ['Used Laptop']; g.gameData.queueRemaining = 3; g.gameData.queueGenre = 'Romance';
    const saved = JSON.stringify(g.gameData); g.localStorage.getItem = () => saved;
    g.loadGameData();
    assert.equal(g.getBookLength(), 13800);
    assert.equal(g.getBookTitle(), 'My story');
    assert.equal(g.getPurchasePrice('Used Laptop'), 0);
    assert.equal(g.gameData.queueRemaining, 3);
    assert.equal(g.gameData.queueGenre, 'Romance');
});
test('away progress expires potions, preserves active analytics, and cannot be claimed twice', () => {
    const g = awayGame();
    g.gameData.potions.acceleration = 2;
    const before = g.gameData.days;
    g.advanceAwayProgress(1010000);
    assert.equal(g.gameData.days - before, 60);
    assert.equal(g.gameData.potions.acceleration, 0);
    assert.equal(g.gameData.activePlaySeconds, 0);
    const coins = g.gameData.coins;
    g.advanceAwayProgress(1010000);
    assert.equal(g.gameData.coins, coins);
    assert.equal(g.gameData.notifications.filter(n => n.name === 'While you were away').length, 1);
});
test('away progress stops at retirement and handles bankruptcy', () => {
    const g = awayGame();
    g.gameData.days = g.getLifespan() - 2;
    g.advanceAwayProgress(1100000);
    assert.equal(g.gameData.days, g.getLifespan());
    const h = awayGame();
    h.gameData.currentProperty = h.gameData.itemData['Mansion Estate'];
    h.gameData.coins = 1;
    h.advanceAwayProgress(1002000);
    assert.equal(h.gameData.currentProperty.name, 'Homeless');
    assert.ok(h.gameData.coins >= 0);
});
test('offline book queue finishes exactly the requested number without dialogs', () => {
    const g = awayGame();
    g.gameData.currentBook = 'example'; g.gameData.selectedGenre = 'Romance';
    g.gameData.queueGenre = 'Romance'; g.gameData.queueRemaining = 2;
    g.currentAutoSceneType = 'Dialogue';
    g.getWritingSpeed = () => 100;
    g.advanceAwayProgress(1005000);
    assert.equal(g.gameData.booksPublished, 3);
    assert.equal(g.gameData.completedBooks.length, 3);
    assert.equal(g.gameData.queueRemaining, 0);
    assert.equal(g.gameData.currentBook, null);
    assert.equal(g.isPaused, false);
});
test('upgrades cost money once, maintain upkeep and refuse unaffordable purchases', () => {
    const g = game();
    g.gameData.unlocks['Used Laptop'] = true;
    g.gameData.coins = 0;
    g.setMisc('Used Laptop');
    assert.equal(g.gameData.currentMisc.length, 0);
    g.gameData.coins = 6000;
    assert.equal(g.getPurchasePrice('Used Laptop'), 5000);
    g.setMisc('Used Laptop');
    assert.equal(g.gameData.coins, 1000);
    assert.equal(g.getPurchasePrice('Used Laptop'), 0);
    g.setMisc('Used Laptop'); g.setMisc('Used Laptop');
    assert.equal(g.gameData.coins, 1000);
    assert.equal(g.getExpense(), 3);
});
test('editorial tradeoffs change length and quality; quality matters to royalties', () => {
    const g = awayGame();
    g.gameData.currentBook = 'example'; g.gameData.wordsWritten = 50;
    g.updateExperienceUI = () => {};
    g.gameData.manuscript = { approach: 'crafted' };
    g.chooseEditorial('revise');
    assert.equal(g.getBookLength(), 115);
    assert.equal(g.getManuscriptQualityBonus(), 1.35 * 1.25);
    assert.ok(g.getBookRoyalty(80) > g.getBookRoyalty(50) * 1.5);
    const first = g.getBookRoyalty(50);
    g.gameData.booksPublished = 100;
    assert.ok(g.getBookRoyalty(50) < first);
});

test('story choices change normalized scene targets and reward matching them', () => {
    const g = awayGame();
    g.genreIdealsBaseData = { Romance: { Dialogue: .5, Drama: .5 } };
    g.sceneTypesBaseData.Romance = { Dialogue: [], Drama: [] };
    g.gameData.currentBook = 'example';
    g.gameData.manuscript = { protagonist: 'two rivals', theme: 'ambition', ending: 'hopeful' };
    const ideals = g.getManuscriptIdeals('Romance');
    assert.ok(ideals.Drama > ideals.Dialogue);
    assert.ok(Math.abs(Object.values(ideals).reduce((a, b) => a + b, 0) - 1) < 1e-9);
    g.gameData.currentBookComposition = { ...ideals };
    assert.equal(g.getCompositionMultiplier(), 3);
    g.gameData.currentBookComposition = { Dialogue: 1 };
    assert.ok(g.getCompositionMultiplier() < 3);
});

test('journal records actual income, upkeep and purchases with persistent independent filters', () => {
    const g = game();
    g.deltaTime = 1;
    g.gameData.royalties = 5;
    g.gameData.coins = 6000;
    g.gameData.unlocks['Used Laptop'] = true;
    g.setMisc('Used Laptop');
    g.increaseCoins(); g.applyExpenses();
    const entry = g.gameData.journalFinance.find(row => row.kind === 'annual');
    assert.equal(entry.work, 120);
    assert.equal(entry.royalties, 15);
    assert.equal(entry.upkeep, 9);
    assert.equal(entry.purchases, 5000);
    const purchase = g.gameData.journalFinance.find(row => row.kind === 'purchase');
    assert.equal(purchase.amount, 5000);
    assert.equal(purchase.balance, 1000);
    assert.equal(g.gameData.coins, 6000 + entry.work + entry.royalties - entry.upkeep - 5000);
    g.gameData.logHistory = ['<b>[Age 20.000 days]</b>Career began.'];
    assert.equal(g.getJournalEntries().length, 2, 'only the purchase and career event appear during the year');
    assert.match(g.getJournalEntries().find(row => row.type === 'expenses').html, /Balance remaining/);
    g.scheduleGameSave = () => {};
    g.setJournalFilter('income', false);
    assert.equal(g.getJournalEntries().filter(e => e.type === 'income').length, 0);
    assert.equal(g.getJournalEntries().filter(e => e.type === 'expenses').length, 1);
    g.increaseCoins();
    assert.equal(entry.work, 240, 'hidden income continues recording');
    const saved = JSON.stringify(g.gameData); g.localStorage.getItem = () => saved;
    g.loadGameData();
    assert.equal(g.gameData.journalShowIncome, false);
    assert.equal(g.gameData.journalFinance.find(row => row.kind === 'annual').work, 240);
    g.gameData.days = 365 * 21;
    g.finalizeJournalYears();
    g.setJournalFilter('income', true); g.setJournalFilter('expenses', false);
    assert.equal(g.getJournalEntries().filter(e => e.type === 'income').length, 1);
    assert.equal(g.getJournalEntries().filter(e => e.type === 'expenses').length, 0);
    assert.equal(g.getJournalEntries().filter(e => e.type === 'event').length, 1);
    const completed = JSON.stringify(g.getJournalEntries());
    g.gameData.days += 31; g.increaseCoins();
    assert.equal(JSON.stringify(g.getJournalEntries()), completed, 'current-year activity does not change published summaries');
    assert.equal(g.gameData.journalFinance.length, 3, 'next year has a separate hidden accumulator');
});

test('year-end journal splits accelerated time and publishes summaries only once', () => {
    const g = game();
    g.gameData.days = 365 * 21 - 1;
    g.deltaTime = 1; // Three game days, spanning the year boundary.
    g.increaseCoins(); g.increaseDays();
    const closed = g.gameData.journalFinance.find(row => row.year === 20);
    const pending = g.gameData.journalFinance.find(row => row.year === 21);
    assert.equal(closed.work, 40);
    assert.equal(pending.work, 80);
    assert.equal(closed.closed, true);
    assert.equal(pending.closed, false);
    assert.equal(g.getJournalEntries().length, 1);
    const snapshot = JSON.stringify(g.getJournalEntries());
    g.finalizeJournalYears();
    assert.equal(JSON.stringify(g.getJournalEntries()), snapshot);
});

test('legacy monthly journal totals migrate into completed and pending years', () => {
    const g = game();
    g.gameData.days = 365 * 21 + 50;
    g.gameData.journalFinance = [
        { month: 252, work: 30, royalties: 5, upkeep: 2, purchases: {} },
        { month: 251, work: 100, royalties: 10, upkeep: 20, purchases: { Laptop: 50 } },
        { month: 250, work: 200, royalties: 20, upkeep: 40, purchases: {} }
    ];
    g.migrateJournalFinance();
    const complete = g.gameData.journalFinance.find(row => row.year === 20);
    assert.equal(complete.work, 300);
    assert.equal(complete.purchases, 50);
    assert.equal(complete.closed, true);
    assert.equal(g.getJournalEntries().length, 2);
    g.migrateJournalFinance();
    assert.equal(g.gameData.journalFinance.length, 2);
});
