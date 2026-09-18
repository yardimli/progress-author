const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createGame, root } = require('./helpers/headless-game.cjs');

test('normal production startup loads the released catalogue and balance without a query flag', async () => {
    const g = createGame();
    const requests = [];
    g.fetch = async (url, options) => {
        assert.equal(options.cache, 'no-store');
        const file = url.split('?')[0]; requests.push(file);
        return { json: async () => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8')) };
    };
    g.createAllRows = g.initLifeExperiencesUI = () => {};
    g.createData = (target, source) => {
        for (const [name, data] of Object.entries(source)) target[name] = { name, baseData: data };
    };
    g.offerVersionRestart = () => true;
    g.alert = message => { throw new Error(message); };
    await g.init();
    assert.equal(vm.runInContext('IS_CAREER_PREVIEW', g), false);
    assert.equal(g.gameSaveKey(), 'authorsJourneySave');
    assert.ok(requests.includes('data/career-profile.json'));
    assert.ok(!requests.includes('data/items-legacy.json'));
    assert.equal(Object.keys(g.itemBaseData).length, 18);
    assert.equal(vm.runInContext('BALANCE.writing.salesEnabled', g), true);
    assert.equal(g.gameData.balanceProfile, 'career-authorship-1');
});

test('main-save rollout preserves a manuscript, queue and progress and migrates only once', () => {
    const old = createGame();
    old.gameData.version = '1.1.0';
    old.gameData.currentProperty = old.gameData.itemData['Large House'];
    old.gameData.ownedItems = ['Large House', 'Editor'];
    old.gameData.taskData.Focus.level = 21;
    old.gameData.coins = 12345;
    old.gameData.selectedGenre = 'Romance';
    old.setBookQueue('continuous'); old.startQueuedBook();
    old.gameData.wordsWritten = 123;
    old.gameData.completedBooks = [{ id: 'older', quality: 30, royalties: 8 }];
    old.gameData.royalties = 8;
    const original = JSON.stringify(old.gameData);
    const g = createGame({ profile: 'release' });
    g.localStorage.setItem('authorsJourneySave', original);
    g.localStorage.setItem('authorsJourneyCareerPreview', 'separate preview');
    g.loadGameData();
    assert.equal(g.gameData.version, '2.0.0');
    assert.equal(g.gameData.coins, 12345);
    assert.equal(g.gameData.taskData.Focus.level, 21);
    assert.equal(g.gameData.currentProperty.name, 'Suburban');
    assert.ok(g.gameData.ownedItems.includes('Style Guide'));
    assert.equal(g.gameData.currentBook, old.gameData.currentBook);
    assert.equal(g.gameData.wordsWritten, 123);
    assert.equal(g.gameData.queueMode, 'continuous');
    assert.equal(g.gameData.completedBooks[0].sales.duration, 365);
    assert.equal(g.gameData.royalties, 8);
    assert.equal(g.localStorage.getItem('authorsJourneySave-before-career-authorship-1'), original);
    g.saveGameData();
    const migrated = g.localStorage.getItem(g.gameSaveKey());
    g.loadGameData(); g.saveGameData();
    assert.equal(g.localStorage.getItem(g.gameSaveKey()), migrated);
    assert.equal(g.localStorage.getItem('authorsJourneyCareerPreview'), 'separate preview');
    assert.equal(g.localStorage.getItem('authorsJourneySave-before-career-authorship-1'), original);
});
