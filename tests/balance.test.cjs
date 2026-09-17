// Run with: node --test tests/balance.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
function game() {
    const context = vm.createContext({ performance, console, window: { location: { hostname: 'localhost' }, addEventListener() {} },
        document: { getElementById: () => null }, requestAnimationFrame() {},
        localStorage: { getItem: () => null, setItem() {} } });
    for (const file of ['state', 'classes', 'utils', 'formulas', 'mechanics', 'save', 'main']) {
        vm.runInContext(fs.readFileSync(path.join(root, 'js', file + '.js'), 'utf8'), context);
    }
    for (const [name, file] of [['jobBaseData', 'jobs'], ['skillBaseData', 'skills'], ['itemBaseData', 'items']]) {
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
    assert.ok(Math.abs(a.days - (365 * 20 + 60)) < 1e-6);
    assert.ok(Math.abs(a.coins - 2400) < 1e-6);
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
    g.gameData.currentJob.xp = 25;
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
    assert.equal(g.getGameSpeed(), 6);
    assert.equal(g.discoverNextCard(), null);
    for (const host of ['localhost', '127.0.0.1', '[::1]', 'test.localhost']) assert.ok(g.isLocalGameHost(host));
    for (const host of ['localhost.example.com', 'example.com', '192.168.1.10']) assert.equal(g.isLocalGameHost(host), false);
});
test('new discoveries are separated across categories, including after level jumps', () => {
    const g = game();
    g.jobBaseData = { Intern: g.jobBaseData.Intern };
    g.skillBaseData = { Frugality: g.skillBaseData.Frugality };
    g.itemBaseData = {};
    g.isInitialized = true;
    g.gameData.taskData.Focus.level = 30;
    assert.equal(g.discoverNextCard().name, 'Intern');
    assert.equal(g.discoverNextCard(), null);
    g.gameData.activePlaySeconds = 9.99;
    assert.equal(g.discoverNextCard(), null);
    g.gameData.activePlaySeconds = 10;
    assert.equal(g.discoverNextCard().name, 'Frugality');
    assert.equal(g.discoverNextCard(), null);
    assert.equal(g.gameData.unlocks.Intern, true);
    assert.equal(g.gameData.unlocks.Frugality, true);
});
test('no non-starting cards share an identical set of unlock requirements', () => {
    const seen = new Map();
    for (const file of ['jobs', 'skills', 'items']) {
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
    assert.ok(Math.abs(g.gameData.days - (365 * 20 + 360)) < 1e-6);
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
