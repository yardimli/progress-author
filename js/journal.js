// Only completed years and individual purchases appear in the journal.
function annualJournalEntry(year) {
    let entry = gameData.journalFinance.find(row => row.kind === 'annual' && row.year === year);
    if (!entry) {
        entry = { kind: 'annual', year, day: (year + 1) * 365, closed: false, work: 0, royalties: 0, upkeep: 0, purchases: 0 };
        gameData.journalFinance.unshift(entry);
    }
    return entry;
}

function migrateJournalFinance() {
    if (gameData.journalFinance.every(entry => entry.kind)) return;
    const old = gameData.journalFinance;
    gameData.journalFinance = [];
    for (const entry of old) {
        const annual = annualJournalEntry(Math.floor(entry.month / 12));
        for (const type of ['work', 'royalties', 'upkeep']) annual[type] += entry[type] || 0;
        annual.purchases += Object.values(entry.purchases || {}).reduce((sum, value) => sum + value, 0);
        annual.closed = annual.day <= gameData.days;
    }
    gameData.journalFinanceVersion = 2;
}

function finalizeJournalYears() {
    for (const entry of gameData.journalFinance) {
        if (entry.kind === 'annual' && !entry.closed && entry.day <= gameData.days) entry.closed = true;
    }
    if (gameData.journalFinance.length > 240) {
        gameData.journalFinance.sort((a, b) => b.day - a.day);
        gameData.journalFinance.length = 240;
    }
}

function recordJournalMoney(type, amount, name = '') {
    if (!Number.isFinite(amount) || amount <= 0) return;
    if (type === 'purchase') {
        gameData.journalFinance.unshift({ kind: 'purchase', day: gameData.days, name, amount, balance: gameData.coins });
        annualJournalEntry(Math.floor(gameData.days / 365)).purchases += amount;
        finalizeJournalYears();
        return;
    }
    // Split a simulation step at birthdays so accelerated/offline time stays accurate.
    const duration = Math.max(0, getGameSpeed() * deltaTime);
    if (!duration) { annualJournalEntry(Math.floor(gameData.days / 365))[type] += amount; return; }
    const end = gameData.days + duration;
    let day = gameData.days;
    while (day < end) {
        const year = Math.floor(day / 365);
        const next = Math.min(end, (year + 1) * 365);
        annualJournalEntry(year)[type] += amount * (next - day) / duration;
        day = next;
    }
}

function setJournalFilter(type, visible) {
    if (type === 'income') gameData.journalShowIncome = !!visible;
    else if (type === 'expenses') gameData.journalShowExpenses = !!visible;
    else return;
    renderJournal(true);
    scheduleGameSave();
}

function getJournalEntries() {
    const entries = gameData.logHistory.map(html => {
        const stamp = html.match(/\[Age (\d+)\.(\d+) days\]/);
        return { day: stamp ? Number(stamp[1]) * 365 + Number(stamp[2]) : 0, html, type: 'event' };
    });
    for (const entry of gameData.journalFinance) {
        if (entry.kind === 'purchase') {
            if (gameData.journalShowExpenses) entries.push({ day: entry.day, type: 'expenses', html: `<b>Age ${Math.floor(entry.day / 365)}.${String(Math.floor(entry.day % 365)).padStart(3, '0')} · Purchase −$${format(entry.amount)}</b><br>${escapeGameText(entry.name)} · Balance remaining: $${format(entry.balance)}` });
            continue;
        }
        if (!entry.closed) continue;
        const label = `Age ${entry.year} · Year-end`;
        const income = entry.work + entry.royalties;
        if (gameData.journalShowIncome && income > 0) entries.push({ day: entry.day, type: 'income',
            html: `<b>${label} · Income +$${format(income)}</b><br>Work $${format(entry.work)} · Book royalties $${format(entry.royalties)}` });
        const purchases = entry.purchases;
        if (gameData.journalShowExpenses && entry.upkeep + purchases > 0) entries.push({ day: entry.day, type: 'expenses',
            html: `<b>${label} · Expenses −$${format(entry.upkeep + purchases)}</b><br>Upkeep $${format(entry.upkeep)} · Total purchases $${format(purchases)}` });
    }
    return entries.sort((a, b) => b.day - a.day);
}

let lastJournalRender = -Infinity;
function renderJournal(force = false) {
    const container = document.getElementById('profileLogContainer');
    if (!container) return;
    if (!force) {
        if (!container.getClientRects().length || performance.now() - lastJournalRender < 1000) return;
    }
    lastJournalRender = performance.now();
    for (const [id, checked] of [['journalShowIncome', gameData.journalShowIncome], ['journalShowExpenses', gameData.journalShowExpenses]]) {
        const checkbox = document.getElementById(id);
        if (checkbox) checkbox.checked = checked;
    }
    const html = getJournalEntries().map(entry => `<div class="log-entry journal-${entry.type}">${entry.html}</div>`).join('') || '<p>No journal entries yet.</p>';
    if (container.innerHTML !== html) container.innerHTML = html;
}
