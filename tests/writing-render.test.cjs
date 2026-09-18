const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('writing bar and counters keep a one-second DOM budget independently of prose', () => {
    let writes = 0;
    const nodes = new Map();
    const context = vm.createContext({
        gameData: { currentBook: 'Book', wordsWritten: 10 },
        typewriterText: 'First sentence', isClearingLine: false,
        getBookLength: () => 100, getBookQuality: () => 20,
        getCurvedQuality: value => value, getWritingSpeed: () => 5, format: String,
        document: { querySelectorAll() { return [this.getElementById('header-val-progress')]; }, getElementById(id) {
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
    assert.equal(nodes.has('liveWritingTextInner'), false, 'stats updates do not render prose');
    const updatedWrites = writes;
    context.updateWritingUI(2000);
    assert.equal(writes, updatedWrites, 'unchanged text is not rewritten');
});

test('typewriter renders characters and corrections before the next stats update', () => {
    let text = '', writes = 0;
    const inner = { offsetWidth: 0, get textContent() { return text; }, set textContent(value) { text = value; writes++; } };
    const display = { clientWidth: 500, scrollWidth: 100 };
    const context = vm.createContext({
        Math: Object.assign(Object.create(Math), { random: () => .5 }),
        gameData: { currentBook: 'book', selectedGenre: 'Romance' }, getWritingSpeed: () => 10,
        booksBaseData: { book: { genre: 'Romance' } }, sceneTypesBaseData: { Romance: { Dialogue: ['Hello there'] } },
        nextSceneType: 'Dialogue', currentTypingSceneType: 'Dialogue',
        typewriterText: '', currentTypewriterSentence: 'Hello there ', typewriterIndex: 0,
        liveTypingDelay: 0, isLiveCorrecting: false, isClearingLine: false, isWaitingToClearLine: false,
        document: { getElementById: id => id === 'liveWritingTextInner' ? inner : display }
    });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/ui_updater.js'), 'utf8'), context);
    context.updateTypewriter(.001);
    assert.equal(text, 'H');
    context.updateTypewriter(.005);
    assert.equal(writes, 1, 'frames without new characters do not rewrite the DOM');
    context.updateTypewriter(.04);
    assert.equal(text, 'He');
    context.typewriterText = 'Hex'; context.isLiveCorrecting = true; context.liveTypingDelay = 0;
    context.updateTypewriter(.001);
    assert.equal(text, 'He', 'a simulated typo is backspaced immediately');
    context.gameData.currentBook = null;
    const before = writes; context.updateTypewriter(.1);
    assert.equal(writes, before, 'idle manuscripts do not animate');
});
