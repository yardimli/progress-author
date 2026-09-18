const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function harness(saved = true) {
    const storage = new Map(saved ? [['authorsJourneySave', '{"version":"1.0.5","coins":12345}']] : []);
    const nodes = { versionModal: { style: { display: 'none' } }, updateVersionLabel: {}, keepCurrentGameButton: { focus() {} } };
    let continued = 0, reloads = 0;
    const context = vm.createContext({
        GAME_VERSION: '1.1.0', isPaused: false, isInitialized: false,
        document: { getElementById: id => nodes[id] },
        localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
        finishLoadingGame: () => continued++, location: { reload: () => reloads++ }
    });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/save.js'), 'utf8'), context);
    return { context, storage, nodes, continued: () => continued, reloads: () => reloads };
}

test('existing saves get an update choice without being overwritten; keep is remembered', () => {
    const h = harness();
    const original = h.storage.get('authorsJourneySave');
    assert.equal(h.context.offerVersionRestart(), true);
    assert.equal(h.context.isPaused, true);
    assert.equal(h.nodes.versionModal.style.display, 'flex');
    assert.equal(h.storage.get('authorsJourneySave'), original);
    assert.equal(h.storage.has('authorsJourneyAcknowledgedVersion'), false, 'wait for the choice');
    h.context.chooseVersionRestart(false);
    assert.equal(h.continued(), 1);
    assert.equal(h.nodes.versionModal.style.display, 'none');
    assert.equal(h.storage.get('authorsJourneySave'), original);
    assert.equal(h.storage.get('authorsJourneyAcknowledgedVersion'), '1.1.0');
    assert.equal(h.context.offerVersionRestart(), false);
    h.context.GAME_VERSION = '1.2.0';
    assert.equal(h.context.offerVersionRestart(), true, 'a later update can ask again');
});

test('restart clears only the game save and retains the acknowledged version', () => {
    const h = harness();
    h.context.offerVersionRestart(); h.context.chooseVersionRestart(true);
    assert.equal(h.storage.has('authorsJourneySave'), false);
    assert.equal(h.storage.get('authorsJourneyAcknowledgedVersion'), '1.1.0');
    assert.equal(h.reloads(), 1);
    assert.equal(h.continued(), 0);
    assert.equal(h.context.offerVersionRestart(), false);
});

test('new players skip the update prompt', () => {
    const h = harness(false);
    assert.equal(h.context.offerVersionRestart(), false);
    assert.equal(h.storage.get('authorsJourneyAcknowledgedVersion'), '1.1.0');
    assert.equal(h.nodes.versionModal.style.display, 'none');
});
