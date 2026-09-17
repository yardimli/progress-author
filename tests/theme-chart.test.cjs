const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, '../js', name + '.js'), 'utf8');

function theme(saved, matches) {
    let listener, dark;
    const media = { matches, addEventListener: (_, callback) => listener = callback };
    const control = {};
    const context = vm.createContext({
        window: { matchMedia: () => media },
        document: { body: { classList: { toggle: (_, value) => dark = value } },
            documentElement: { style: {} }, getElementById: () => control, addEventListener() {} },
        localStorage: { getItem: () => saved, setItem: (_, value) => saved = value }
    });
    vm.runInContext(read('theme'), context);
    return { context, control, dark: () => dark, saved: () => saved,
        change(value) { media.matches = value; listener(); } };
}
test('theme follows device initially and responds to live device changes', () => {
    const g = theme(null, true);
    assert.equal(g.dark(), true);
    assert.equal(g.control.value, 'system');
    g.change(false);
    assert.equal(g.dark(), false);
});
test('explicit theme persists and can return to device mode', () => {
    const g = theme('light', true);
    assert.equal(g.dark(), false);
    g.context.setGameTheme('dark');
    assert.equal(g.saved(), 'dark');
    g.change(false);
    assert.equal(g.dark(), true);
    g.context.setGameTheme('system');
    assert.equal(g.dark(), false);
    g.change(true);
    assert.equal(g.dark(), true);
    g.context.setGameTheme('invalid');
    assert.equal(g.saved(), 'system');
});
function chart(width = 360, height = 240, dpr = 2) {
    const calls = [];
    const ctx = new Proxy({}, { get: (target, key) => target[key] || ((...args) => calls.push([key, ...args])) });
    const canvas = { parentElement: {}, getContext: () => ctx, getBoundingClientRect: () => ({ width, height }) };
    const summary = {};
    const context = vm.createContext({ Intl, window: { devicePixelRatio: dpr },
        document: { getElementById: id => id === 'authorChart' ? canvas : summary },
        getComputedStyle: () => ({ getPropertyValue: () => '#112233' }) });
    vm.runInContext(read('chart'), context);
    return { context, canvas, calls, summary };
}
test('chart handles empty, one-point and centuries-long careers', () => {
    const g = chart();
    assert.equal(g.context.getChartRange([]).maxAge, 21);
    const range = g.context.getChartRange([{ age: 201.5, income: 500 }, { age: 20.1 }]);
    assert.equal(range.minAge, 20);
    assert.equal(range.maxAge, 202);
    for (const data of [[], [{ age: 20.1, income: 40 }], range.data]) {
        g.context.drawAuthorChart('authorChart', data);
    }
    assert.ok(g.calls.some(call => call[0] === 'arc')); // Single points remain visible.
    for (const call of g.calls) for (const arg of call.slice(1)) {
        if (typeof arg === 'number') assert.ok(Number.isFinite(arg));
    }
});
test('chart uses CSS coordinates with a high-DPI backing store and skips hidden canvas', () => {
    const g = chart();
    g.context.drawAuthorChart('authorChart', []);
    assert.equal(g.canvas.width, 720);
    assert.equal(g.canvas.height, 480);
    assert.deepEqual(g.calls.find(call => call[0] === 'setTransform'), ['setTransform', 2, 0, 0, 2, 0, 0]);
    assert.ok(g.summary.textContent.includes('career develops'));
    const hidden = chart(0, 0);
    hidden.context.drawAuthorChart('authorChart', []);
    assert.equal(hidden.calls.length, 0);
});
