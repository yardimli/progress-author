// Aggregate actual cash movements by game month, rather than logging every frame.
function recordJournalMoney(type, amount, name = '') {
    if (!Number.isFinite(amount) || amount <= 0) return;
    const month = Math.floor(gameData.days * 12 / 365);
    const history = gameData.journalFinance;
    let entry = history[0];
    if (!entry || entry.month !== month) {
        entry = { month, day: gameData.days, work: 0, royalties: 0, upkeep: 0, purchases: {} };
        history.unshift(entry);
        history.length = Math.min(history.length, 120);
    }
    entry.day = gameData.days;
    if (type === 'purchase') entry.purchases[name] = (entry.purchases[name] || 0) + amount;
    else entry[type] += amount;
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
        const label = `Age ${Math.floor(entry.month / 12)}, month ${entry.month % 12 + 1}`;
        const income = entry.work + entry.royalties;
        if (gameData.journalShowIncome && income > 0) entries.push({ day: entry.day, type: 'income',
            html: `<b>${label} · Income +$${format(income)}</b><br>Work $${format(entry.work)} · Book royalties $${format(entry.royalties)}` });
        const purchases = Object.values(entry.purchases).reduce((sum, amount) => sum + amount, 0);
        if (gameData.journalShowExpenses && entry.upkeep + purchases > 0) entries.push({ day: entry.day, type: 'expenses',
            html: `<b>${label} · Expenses −$${format(entry.upkeep + purchases)}</b><br>Upkeep $${format(entry.upkeep)}${purchases ? ` · Purchases $${format(purchases)} (${Object.entries(entry.purchases).map(([name, amount]) => `${escapeGameText(name)}: $${format(amount)}`).join(', ')})` : ''}` });
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
