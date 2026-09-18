const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { createGame } = require('./helpers/headless-game.cjs');
const { simulate } = require('../scripts/simulate-progression.cjs');

function manuscriptGame() {
    const g = createGame({ profile: 'release' });
    g.booksBaseData = { example: { title: 'A story', genre: 'Romance', wordCount: 100 } };
    g.sceneTypesBaseData = { Romance: { Dialogue: {} } };
    g.gameData.selectedGenre = 'Romance';
    g.gameData.workWritingBalance = 100;
    g.gameData.draftPlan = { approach: 'crafted', theme: 'justice' };
    g.startWritingBook();
    return g;
}

test('publication stops until the player starts another manuscript', () => {
    const g = manuscriptGame();
    g.finishBook();
    for (let i = 0; i < 12; i++) g.finishBook();
    assert.equal(g.gameData.booksPublished, 1);
    assert.equal(g.gameData.currentBook, null);
    g.startWritingBook();
    assert.equal(g.gameData.currentBook, 'example');
    assert.equal(g.gameData.manuscript.approach, 'crafted');
    assert.equal(g.gameData.manuscript.theme, 'justice');
});

test('legacy queue migration retains the active draft but removes future-book settings', () => {
    const g = manuscriptGame();
    g.gameData.queueMode = 'continuous'; g.gameData.queueRemaining = 10; g.gameData.queueGenre = 'Romance';
    g.gameData.wordsWritten = 25;
    g.saveGameData(); g.loadGameData();
    assert.equal(g.gameData.wordsWritten, 25);
    assert.equal(g.gameData.currentBook, 'example');
    for (const key of ['queueMode', 'queueRemaining', 'queueGenre']) assert.equal(g.gameData[key], undefined);
    g.saveGameData(); g.loadGameData();
    assert.equal(g.gameData.queueMode, undefined);
});

test('manual start refuses an active draft, missing genre or retirement', () => {
    const g = manuscriptGame(), current = g.gameData.manuscript;
    g.startWritingBook(); assert.equal(g.gameData.manuscript, current);
    g.finishBook(); g.gameData.selectedGenre = 'missing';
    g.startWritingBook(); assert.equal(g.gameData.currentBook, null);
    g.gameData.selectedGenre = 'Romance'; g.gameData.days = g.getLifespan();
    g.startWritingBook(); assert.equal(g.gameData.currentBook, null);
});

test('offline progress finishes the active manuscript without starting another or duplicating catch-up', () => {
    const g = manuscriptGame();
    g.gameData.lastProgressAt = 1000000; g.gameData.offlineEligible = true;
    g.advanceAwayProgress(1060060);
    assert.equal(g.gameData.booksPublished, 1);
    assert.equal(g.gameData.currentBook, null);
    g.advanceAwayProgress(1060060);
    assert.equal(g.gameData.booksPublished, 1);
});

test('balance overrides affect production formulas without leaking to another game', () => {
    const live = createGame();
    const candidate = createGame({ balance: { career: { salaryScale: 2, inheritanceDivisor: 10, xpSoftCap: null } } });
    assert.equal(candidate.gameData.currentJob.getIncome(), live.gameData.currentJob.getIncome() * 2);
    live.gameData.currentJob.maxLevel = candidate.gameData.currentJob.maxLevel = 100;
    assert.equal(candidate.gameData.currentJob.getMaxLevelMultiplier(), 11);
    assert.equal(live.gameData.currentJob.getMaxLevelMultiplier(), 6);
    assert.equal(vm.runInContext('BALANCE.career.xpSoftCap', live), 4);
});

test('simulation is reproducible and allocates time rather than free manuscript progress', () => {
    const options = { secondsPerLife: 90, lives: 1, strategy: 'mixed', seed: 77 };
    assert.deepEqual(simulate(options), simulate(options));
    const jobs = simulate({ ...options, strategy: 'job-only' }).lives[0];
    const writing = simulate({ ...options, strategy: 'writing-heavy' }).lives[0];
    assert.equal(jobs.books, 0);
    assert.ok(jobs.wages > writing.wages);
    assert.ok(writing.books > 0);
    assert.equal(jobs.retired, false);
});

test('potions never manufacture money', () => {
    const g = createGame();
    g.gameData.coins = 7;
    g.drinkPotion('inspiration');
    assert.equal(g.gameData.coins, 7);
});
