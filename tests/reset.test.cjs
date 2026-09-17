const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function harness() {
    const storage = new Map([['authorsJourneyTheme', 'dark']]);
    const events = {};
    let idle, reloads = 0;
    const context = vm.createContext({
        gameData: { currentAuthor: 'author1', coins: 12345 },
        isInitialized: true, isPaused: false,
        localStorage: { setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
        window: { addEventListener: (name, fn) => events[name] = fn, requestIdleCallback: fn => idle = fn },
        location: { reload: () => { reloads++; events.pagehide(); } }
    });
    for (const name of ['save', 'main']) {
        vm.runInContext(fs.readFileSync(path.join(__dirname, '../js', name + '.js'), 'utf8'), context);
    }
    return { context, storage, events, flushIdle: () => idle(), reloads: () => reloads };
}

test('hard reset survives pagehide and an already queued autosave', () => {
    const h = harness();
    h.context.saveGameData();
    h.context.scheduleGameSave();
    h.context.resetGameData();
    h.flushIdle();
    h.context.saveGameData();
    h.context.scheduleGameSave();
    assert.equal(h.storage.has('authorsJourneySave'), false);
    assert.equal(h.storage.get('authorsJourneyTheme'), 'dark');
    assert.equal(h.reloads(), 1);
    assert.equal(h.context.isPaused, true);
});

test('ordinary exit still persists progress', () => {
    const h = harness();
    h.events.pagehide();
    assert.equal(JSON.parse(h.storage.get('authorsJourneySave')).coins, 12345);
});
