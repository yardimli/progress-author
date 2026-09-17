// Anonymous browser identity plus per-tab visits; no IP or game save is sent.
(() => {
    const prefix = 'authorJourneyStats.';
    const validId = value => /^[a-f0-9-]{36}$/.test(value || '');
    const uuid = () => crypto.randomUUID ? crypto.randomUUID() : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
    const read = (storage, key) => { try { return storage.getItem(key); } catch { return null; } };
    const write = (storage, key, value) => { try { storage.setItem(key, value); } catch { /* Tracking must never interrupt play. */ } };
    let local, tab;
    try { local = localStorage; tab = sessionStorage; } catch { return; }
    let visitorId = read(local, prefix + 'visitor');
    if (!validId(visitorId)) { visitorId = uuid(); write(local, prefix + 'visitor', visitorId); }
    let visit;
    try { visit = JSON.parse(read(local, prefix + 'visit.' + read(tab, prefix + 'current'))); } catch { /* Start fresh. */ }
    function ensureVisit() {
        const now = Date.now();
        if (!visit || !validId(visit.sessionId) || visit.visitorId !== visitorId || now - visit.lastSeen > 30 * 60 * 1000 || now / 1000 - visit.startedAt > 30 * 86400) {
            visit = { visitorId, sessionId: uuid(), startedAt: Math.floor(now / 1000), lastSeen: now, days: {} };
            write(tab, prefix + 'current', visit.sessionId);
        }
    }
    function persist() { write(local, prefix + 'visit.' + visit.sessionId, JSON.stringify(visit)); }
    function send(beacon = false) {
        if (!visit) return;
        persist();
        const body = JSON.stringify(visit);
        try {
            if (beacon && navigator.sendBeacon && navigator.sendBeacon('stats.php', new Blob([body], { type: 'application/json' }))) return;
            fetch('stats.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true, credentials: 'omit' }).catch(() => {});
        } catch { /* Offline play is unaffected; the next cumulative heartbeat retries. */ }
    }
    ensureVisit();
    // Prune old local tracking records without touching the player's save or identity.
    try {
        for (const key of Object.keys(local)) {
            if (!key.startsWith(prefix + 'visit.') || key.endsWith(visit.sessionId)) continue;
            const old = JSON.parse(local.getItem(key));
            if (!old || Date.now() - old.lastSeen > 7 * 86400000) local.removeItem(key);
        }
    } catch { /* Storage may be unavailable. */ }
    window.AuthorStats = {
        addPlayTime(seconds) {
            if (document.hidden || !Number.isFinite(seconds) || seconds <= 0) return;
            ensureVisit();
            const now = Date.now();
            // Split a frame crossing UTC midnight between the correct daily totals.
            const end = now, start = end - Math.min(seconds, 1) * 1000;
            const midnight = new Date(new Date(end).toISOString().slice(0, 10) + 'T00:00:00Z').getTime();
            for (const [time, duration] of [[start, Math.max(0, midnight - start)], [end, end - Math.max(start, midnight)]]) {
                if (duration <= 0) continue;
                const day = new Date(time).toISOString().slice(0, 10);
                visit.days[day] = (visit.days[day] || 0) + duration / 1000;
            }
            visit.lastSeen = now;
        }
    };
    send();
    setInterval(() => {
        if (document.hidden) return;
        ensureVisit(); visit.lastSeen = Date.now(); send();
    }, 15000);
    document.addEventListener('visibilitychange', () => { if (document.hidden) send(true); });
    window.addEventListener('pagehide', () => send(true));
})();
