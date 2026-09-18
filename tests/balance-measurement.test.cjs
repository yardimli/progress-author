const { test } = require('node:test');
const assert = require('node:assert/strict');
const { simulate } = require('../scripts/simulate-progression.cjs');
test('paid editing measurements reconcile actual cash and remain deterministic', () => {
    const options = { profile: 'career', strategy: 'writing-heavy', editor: 'paid-wait', lives: 1, secondsPerLife: 800, seed: 77 };
    const a = simulate(options), b = simulate(options);
    assert.deepEqual(a, b);
    const life = a.lives[0];
    assert.ok(life.books > 0); assert.ok(life.editing > 0);
    assert.ok(Math.abs(life.receiptsReconcileError) < 1e-6);
    assert.equal(life.rollingYear.net, life.rollingYear.sales - life.rollingYear.editing);
    assert.equal(life.rollingYear.qualified, life.rollingYear.observed >= 365 - 1e-6 && life.rollingYear.net > life.rollingYear.work && life.rollingYear.net > life.rollingYear.benchmark && life.rollingYear.net >= life.rollingYear.upkeep);
});
test('three-book control stops releasing and old sales end', () => {
    const result = simulate({ profile: 'career', strategy: 'writing-heavy', lives: 1, secondsPerLife: 2400, bookLimit: 3 }).lives[0];
    assert.equal(result.books, 3);
    assert.equal(result.dailyRoyalties, 0);
    assert.equal(result.rollingYear.qualified, false);
    assert.ok(Math.abs(result.receiptsReconcileError) < 1e-6);
});
test('invalid measurement inputs fail instead of hanging or silently changing policy', () => {
    for (const options of [{ editor: 'bad' }, { approach: 'bad' }, { stepSeconds: 0 }, { bookLimit: -1 }]) assert.throws(() => simulate(options));
});
