const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto').webcrypto;
const source = fs.readFileSync(require('node:path').join(__dirname, '../js/stats.js'), 'utf8');
function storage() {
    return { getItem(key) { return this[key] ?? null; }, setItem(key, value) { this[key] = value; }, removeItem(key) { delete this[key]; } };
}
function browser(local = storage(), tab = storage(), start = Date.UTC(2026, 8, 17, 23, 59, 59, 950)) {
    let now = start, heartbeat;
    const requests = [], events = {}, window = {}, document = { hidden: false, addEventListener(type, fn) { events[type] = fn; } };
    window.addEventListener = (type, fn) => { events[type] = fn; };
    class Clock extends Date { constructor(value = now) { super(value); } static now() { return now; } }
    vm.runInNewContext(source, { crypto, Date: Clock, localStorage: local, sessionStorage: tab, window, document,
        navigator: { sendBeacon(url, blob) { requests.push({ url, beacon: true }); return true; } }, Blob,
        fetch(url, options) { requests.push(JSON.parse(options.body)); return Promise.resolve(); },
        setInterval(fn) { heartbeat = fn; }
    });
    return { window, document, local, tab, requests, events, heartbeat, advance(ms) { now += ms; } };
}
test('stats count active frames, split midnight and preserve identity across visits', () => {
    const b = browser();
    b.advance(100); b.window.AuthorStats.addPlayTime(0.1); b.heartbeat();
    const sent = b.requests.at(-1);
    assert.equal(sent.days['2026-09-17'], 0.05);
    assert.equal(sent.days['2026-09-18'], 0.05);
    b.document.hidden = true;
    b.window.AuthorStats.addPlayTime(1);
    b.events.pagehide();
    assert.ok(b.requests.at(-1).beacon);
    const reloaded = browser(b.local, b.tab, Date.UTC(2026, 8, 18, 0, 0, 1));
    assert.equal(reloaded.requests[0].sessionId, sent.sessionId);
    assert.equal(reloaded.requests[0].days['2026-09-18'], 0.05);
    const returning = browser(b.local, storage(), Date.UTC(2026, 8, 18, 1));
    assert.equal(returning.requests[0].visitorId, sent.visitorId);
    assert.notEqual(returning.requests[0].sessionId, sent.sessionId);
    returning.advance(31 * 60 * 1000); returning.heartbeat();
    assert.notEqual(returning.requests.at(-1).sessionId, returning.requests[0].sessionId);
});
test('blocked storage never interrupts gameplay', () => {
    const blocked = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
    assert.doesNotThrow(() => browser(blocked, blocked));
});
