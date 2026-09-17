const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('writing bar, counters and prose share a one-second DOM budget', () => {
    let writes = 0;
    const nodes = new Map();
    const context = vm.createContext({
        gameData: { currentBook: 'Book', wordsWritten: 10 },
        typewriterText: 'First sentence', isClearingLine: false,
        getBookLength: () => 100, getBookQuality: () => 20,
        getCurvedQuality: value => value, getWritingSpeed: () => 5, format: String,
        document: { getElementById(id) {
            if (!nodes.has(id)) {
                const node = { style: {}, offsetWidth: 0, clientWidth: 100, scrollWidth: 0 };
                Object.defineProperty(node, 'textContent', {
                    get() { return this.text; },
                    set(value) { this.text = value; writes++; }
                });
                nodes.set(id, node);
            }
            return nodes.get(id);
        } }
    });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/ui_updater.js'), 'utf8'), context);
    context.updateWritingUI(0);
    const initialWrites = writes;
    context.gameData.wordsWritten = 50;
    context.typewriterText = 'Next sentence';
    for (let time = 1; time < 1000; time++) context.updateWritingUI(time);
    assert.equal(writes, initialWrites);
    assert.equal(nodes.get('writingProgressBar').style.transform, 'scaleX(0.1)');
    context.updateWritingUI(1000);
    assert.equal(nodes.get('writingProgressBar').style.transform, 'scaleX(0.5)');
    assert.equal(nodes.get('writingProgressDisplay').textContent, '50.0%');
    assert.equal(nodes.get('header-val-progress').textContent, '50.0%');
    assert.equal(nodes.get('liveWritingTextInner').textContent, 'Next sentence');
    const updatedWrites = writes;
    context.updateWritingUI(2000);
    assert.equal(writes, updatedWrites, 'unchanged text is not rewritten');
});
