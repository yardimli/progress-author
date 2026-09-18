const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createGame, root } = require('./helpers/headless-game.cjs');

test('dashboard shows published income and clears completed manuscript stats in both economies', () => {
    for (const profile of ['current', 'career']) {
        const g = createGame({ profile });
        const node = () => ({ children: [], hidden: false, textContent: '', append(...nodes) { this.children.push(...nodes); this.firstChild = this.children[0]; this.lastChild = this.children.at(-1); } });
        const metrics = node(), details = node(), breakdown = node();
        breakdown.closest = () => details;
        g.document.createElement = node;
        g.document.getElementById = id => ({ writingMetrics: metrics, writingBreakdown: breakdown }[id] || null);
        vm.runInContext(fs.readFileSync(path.join(root, 'js/experience.js'), 'utf8'), g);
        const visible = () => Object.fromEntries(metrics.children.filter(cell => !cell.hidden).map(cell => [cell.firstChild.textContent, cell.lastChild.textContent]));
        g.booksBaseData = { example: { title: 'First book', genre: 'Romance', wordCount: 100 } };
        g.sceneTypesBaseData = { Romance: { Dialogue: {} } };
        g.gameData.selectedGenre = 'Romance'; g.gameData.workWritingBalance = 50;
        g.startWritingBook(); g.updateExperienceUI();
        assert.equal(visible()['Published book income'], `$${g.format(0)} / game day`);
        assert.ok(visible()['Projected quality']);
        g.finishBook(); g.updateExperienceUI();
        assert.equal(visible().Manuscript, 'No active manuscript');
        for (const label of ['Writing speed', 'Time to finish', 'Projected quality', 'Genre fit']) assert.equal(visible()[label], undefined);
        assert.equal(details.hidden, true); assert.equal(breakdown.textContent, '');
        assert.equal(visible()['Published book income'], `$${g.format(g.gameData.royalties)} / game day`);
        assert.ok(g.gameData.royalties > 0);
        g.startWritingBook(); g.finishBook(); g.startWritingBook(); g.updateExperienceUI();
        assert.equal(visible().Manuscript, 'Writing');
        assert.ok(visible()['Writing speed']); assert.equal(details.hidden, false);
    }
});
