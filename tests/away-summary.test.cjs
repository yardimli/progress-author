const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createGame } = require('./helpers/headless-game.cjs');

test('a short unread away summary cannot hide a later longer return', () => {
    const g = createGame({ profile: 'release' });
    g.gameData.lastProgressAt = 1000000; g.gameData.offlineEligible = true;
    g.advanceAwayProgress(1001000);
    g.advanceAwayProgress(1126000);
    const entries = g.gameData.notifications.filter(n => n.name === 'While you were away');
    assert.equal(entries.length, 2);
    assert.equal(entries[0].awaySeconds, 125);
    assert.ok(Math.abs(entries[0].simulatedSeconds - 125) < 1e-6);
    assert.match(entries[0].message, /Away for 2m 5s · 2m 5s simulated/);
    const coins = g.gameData.coins;
    g.advanceAwayProgress(1126000);
    assert.equal(g.gameData.coins, coins);
    assert.equal(g.gameData.notifications.filter(n => n.name === 'While you were away').length, 2);
});

test('retirement reports actual absence separately from the brief progress awarded', () => {
    const g = createGame({ profile: 'release' });
    g.gameData.days = g.getLifespan() - g.getGameSpeed();
    g.gameData.lastProgressAt = 1000000; g.gameData.offlineEligible = true;
    g.advanceAwayProgress(1000000 + 9 * 3600000);
    const entry = g.gameData.notifications.find(n => n.name === 'While you were away');
    assert.equal(entry.awaySeconds, 9 * 3600);
    assert.ok(Math.abs(entry.simulatedSeconds - 1) < 1e-6);
    assert.match(entry.message, /Away for 9h 0m 0s · 0m 1s simulated/);
    assert.match(entry.message, /Progress stopped at retirement/);
});
