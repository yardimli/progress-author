const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createGame, root } = require('./helpers/headless-game.cjs');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'output/imagegen/item-retheme-manifest.json'), 'utf8'));

test('all rethemed upgrades preserve economic values, effects and access requirements', () => {
    const items = JSON.parse(fs.readFileSync(path.join(root, 'data/items.json'), 'utf8'));
    const cosmetic = new Set(['name', 'filename', 'imageprompt', 'flavorText']);
    const mechanics = data => Object.fromEntries(Object.entries(data).filter(([key]) => !cosmetic.has(key)));
    assert.equal(Object.keys(items).length, 18);
    for (const row of manifest) {
        assert.deepEqual(mechanics(items[row.name]), mechanics(row.original), row.name);
        assert.ok(items[row.name].flavorText.length > 20);
        assert.ok(fs.existsSync(path.join(root, 'img/items256', items[row.name].filename)));
    }
});

test('all prior upgrade names migrate with ownership, equipment and notification actions intact', () => {
    const g = createGame({ profile: 'release' });
    const saved = JSON.parse(JSON.stringify(g.gameData));
    saved.balanceProfile = 'career-authorship-3';
    saved.coins = 123456;
    saved.itemData = Object.fromEntries(manifest.map(row => [row.oldName, { name: row.oldName, baseData: row.original }]));
    saved.ownedItems = manifest.map(row => row.oldName);
    saved.unlocks = Object.fromEntries(saved.ownedItems.map(name => [name, true]));
    saved.currentProperty = { name: 'Mansion Estate' };
    saved.currentTransportation = { name: 'Used Car' };
    saved.currentMisc = [{ name: 'Home Office' }, { name: 'Style Guide' }];
    saved.notifications = manifest.map(row => ({ type: 'item', name: row.oldName, read: false }));
    g.localStorage.setItem(g.gameSaveKey(), JSON.stringify(saved)); g.loadGameData();
    assert.equal(g.gameData.coins, 123456);
    assert.equal(g.gameData.currentProperty.name, 'Global Arts Foundation');
    assert.equal(g.gameData.currentTransportation.name, 'Private Jet');
    assert.deepEqual(Array.from(g.gameData.currentMisc, item => item.name), ['Writing Production Team', 'Professional Manuscript Assessment']);
    for (const row of manifest) {
        assert.ok(g.gameData.ownedItems.includes(row.name), row.name);
        assert.equal(g.gameData.unlocks[row.name], true, row.name);
        assert.ok(g.gameData.notifications.some(entry => entry.type === 'item' && entry.name === row.name));
    }
    g.saveGameData(); const once = g.localStorage.getItem(g.gameSaveKey());
    g.loadGameData(); g.saveGameData(); assert.equal(g.localStorage.getItem(g.gameSaveKey()), once);
});
