const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { createGame } = require('./helpers/headless-game.cjs');
const { simulate } = require('../scripts/simulate-progression.cjs');

function queueGame() {
    const g = createGame();
    g.booksBaseData = { example: { title: 'A story', genre: 'Romance', wordCount: 100 } };
    g.sceneTypesBaseData = { Romance: { Dialogue: {} } };
    g.gameData.selectedGenre = 'Romance';
    g.gameData.workWritingBalance = 100;
    g.gameData.draftPlan = { approach: 'crafted', theme: 'justice' };
    g.setBookQueue('continuous');
    g.startQueuedBook();
    return g;
}

test('continuous writing crosses the old ten-book limit and can stop after its current draft', () => {
    const g = queueGame();
    for (let i = 0; i < 12; i++) g.finishBook();
    assert.equal(g.gameData.booksPublished, 12);
    assert.equal(g.gameData.currentBook, 'example');
    assert.equal(g.gameData.manuscript.approach, 'crafted');
    assert.equal(g.gameData.manuscript.theme, 'justice');
    assert.equal(g.gameData.queueRemaining, 0);
    g.setBookQueue('0');
    assert.equal(g.gameData.currentBook, 'example');
    g.finishBook();
    assert.equal(g.gameData.currentBook, null);
});

test('continuous queue saves as plain data, waits at zero allocation and stops at retirement', () => {
    const g = queueGame();
    g.saveGameData();
    const saved = JSON.parse(g.localStorage.getItem('authorsJourneySave'));
    assert.equal(saved.queueMode, 'continuous');
    g.loadGameData();
    assert.equal(g.gameData.queueMode, 'continuous');
    g.gameData.workWritingBalance = 0;
    g.writeProgress('Dialogue', 60);
    assert.equal(g.gameData.wordsWritten, 0);
    assert.equal(g.gameData.booksPublished, 0);
    g.gameData.days = g.getLifespan();
    g.finishBook();
    assert.equal(g.gameData.currentBook, null);
    g.rebirthReset();
    assert.equal(g.gameData.queueMode, 'finite');
});

test('missing queue genre stops once with a non-blocking notice and preserves an active draft', () => {
    const g = queueGame();
    const current = g.gameData.manuscript;
    g.startQueuedBook();
    assert.equal(g.gameData.manuscript, current);
    g.gameData.queueGenre = 'missing';
    g.finishBook();
    assert.equal(g.gameData.currentBook, null);
    assert.equal(g.gameData.queueMode, 'finite');
    assert.equal(g.gameData.notifications.filter(n => n.name === 'Writing queue stopped').length, 1);
    g.startQueuedBook();
    assert.equal(g.gameData.notifications.filter(n => n.name === 'Writing queue stopped').length, 1);
    assert.equal(g.isPaused, false);
});

test('continuous writing completes offline without granting duplicate catch-up', () => {
    const g = queueGame();
    g.gameData.lastProgressAt = 1000000;
    g.gameData.offlineEligible = true;
    g.advanceAwayProgress(1000060 + 60000);
    assert.ok(g.gameData.booksPublished > 10);
    const books = g.gameData.booksPublished;
    g.advanceAwayProgress(1000060 + 60000);
    assert.equal(g.gameData.booksPublished, books);
    assert.equal(g.gameData.queueMode, 'continuous');
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
