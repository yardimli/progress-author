// Candidate-only book economy. Rates are fixed at publication; wages and slider
// changes never reprice a published book. A triangular sales curve integrates exactly.
var salesStepSpeed = null;
function bookSalesRate(book, day = gameData.days) {
    if (!book.sales) return book.royalties || 0;
    const age = day - book.sales.startDay;
    return age < 0 || age >= book.sales.duration ? 0 : book.sales.launchRate * (1 - age / book.sales.duration);
}
function bookSalesBetween(book, from, to) {
    if (!book.sales) return 0;
    const { startDay, duration, launchRate } = book.sales;
    const a = Math.max(0, Math.min(duration, from - startDay));
    const b = Math.max(a, Math.min(duration, to - startDay));
    return launchRate * ((b - a) - (b * b - a * a) / (2 * duration));
}
function refreshBookIncome() {
    gameData.royalties = gameData.completedBooks.reduce((sum, book) => sum + bookSalesRate(book), 0);
}
function collectBookSales(from, to) {
    let income = 0;
    for (const book of gameData.completedBooks) {
        const amount = bookSalesBetween(book, from, to);
        book.lifetimeReceipts = (book.lifetimeReceipts || 0) + amount;
        income += amount;
    }
    return income;
}
function attachBookSales(book, quality) {
    book.sales = { startDay: gameData.days, duration: BALANCE.writing.salesDays, launchRate: book.royalties };
    book.lifetimeReceipts = 0;
    const config = BALANCE.writing;
    const fit = Math.max(0, Math.min(1, (getCompositionMultiplier() - config.fitBase) / config.fitRange));
    const gain = (config.audienceBase + config.audienceQuality * quality + gameData.readership * config.audienceGrowth) *
        (config.audienceQualityFloor + (1 - config.audienceQualityFloor) * quality / 100) * (config.audienceFitFloor + (1 - config.audienceFitFloor) * fit);
    book.readersGained = Math.max(1, Math.round(gain));
    gameData.readership += book.readersGained;
    refreshBookIncome();
}
function migrateBookSales() {
    if (gameData.bookSalesVersion === 1) { refreshBookIncome(); return; }
    const backupKey = gameSaveKey() + '-before-book-sales-1';
    if (!localStorage.getItem(backupKey)) localStorage.setItem(backupKey, JSON.stringify(gameData));
    // Unknown historic release dates receive a bounded one-year transition.
    // Do not invent past receipts or retroactive audience growth.
    for (const book of gameData.completedBooks) {
        if (!Number.isFinite(book.quality)) book.quality = 0;
        book.sales ||= { startDay: gameData.days, duration: 365, launchRate: Math.max(0, book.royalties || 0) };
        book.lifetimeReceipts ||= 0;
        book.legacyReceiptsUnknown = true;
    }
    const represented = gameData.completedBooks.reduce((sum, book) => sum + bookSalesRate(book), 0);
    const remainder = Math.max(0, gameData.royalties - represented);
    if (remainder > 0) gameData.completedBooks.push({ id: null, title: 'Legacy catalogue', quality: 0, royalties: remainder,
        lifetimeReceipts: 0, legacyReceiptsUnknown: true, sales: { startDay: gameData.days, duration: 365, launchRate: remainder } });
    gameData.bookSalesVersion = 1;
    gameData.royaltyBalanceVersion = 1;
    refreshBookIncome();
}
function editingQuote() { return Math.round(BALANCE.writing.editorBase + gameData.readership * BALANCE.writing.editorReaderFee); }
function prepareBookService(plan) {
    if (!BALANCE.writing.salesEnabled) return;
    plan.editor = plan.editor === 'paid' ? 'paid' : 'none';
    plan.editorFee = plan.editor === 'paid' ? editingQuote() : 0;
    plan.editorPaid = false;
    plan.awaitingEditor = false;
}
function settleBookEditor() {
    const plan = gameData.manuscript;
    if (!plan || plan.editor !== 'paid' || plan.editorPaid) return true;
    if (gameData.coins < plan.editorFee) {
        if (plan.editorFallback === 'free') { plan.editor = 'none'; plan.awaitingEditor = false; return true; }
        plan.awaitingEditor = true;
        addGameNotification({ type: 'summary', name: 'Manuscript awaiting editing', message: `Your completed manuscript needs $${format(plan.editorFee)} for its editor. Other progress continues. Publish without editing or save enough to pay.` });
        return false;
    }
    gameData.coins -= plan.editorFee;
    careerFinanceRow(Math.floor(gameData.days)).editing += plan.editorFee;
    recordJournalMoney('purchase', plan.editorFee, 'Editing: ' + getBookTitle());
    plan.editorPaid = true;
    plan.awaitingEditor = false;
    return true;
}
function publishWithoutEditor() {
    if (!gameData.currentBook || !gameData.manuscript?.awaitingEditor) return;
    gameData.manuscript.editor = 'none';
    gameData.manuscript.awaitingEditor = false;
    finishBook();
}
// One shared path for visible and away play, split at publication, birthday,
// retirement and potion expiry. New books never earn for time before publication.
function advanceWritingEconomy(seconds) {
    const previousDelta = deltaTime;
    let remaining = seconds;
    try {
        while (remaining > 1e-8 && gameData.days < getLifespan()) {
            const speed = getGameSpeed();
            if (!(speed > 0)) break;
            let step = Math.min(1, remaining, (getLifespan() - gameData.days) / speed,
                (Math.floor(gameData.days) + 1 - gameData.days) / speed,
                ((Math.floor(gameData.days / 365) + 1) * 365 - gameData.days) / speed);
            for (const value of Object.values(gameData.potions)) if (value > 0) step = Math.min(step, value);
            if (gameData.currentBook && getWritingSpeed() > 0) {
                const writing = getWritingSpeed() * speed * (isHoldingSceneButton ? 2 : 1);
                step = Math.min(step, Math.max(1e-8, (getBookLength() - gameData.wordsWritten) / writing));
            }
            deltaTime = step;
            const plannedWords = getWritingSpeed() * speed * step * (isHoldingSceneButton ? 2 : 1);
            salesStepSpeed = speed;
            try {
                updateLogic();
                if (gameData.currentBook && currentAutoSceneType) writeProgress(currentAutoSceneType, step, plannedWords);
            } finally { salesStepSpeed = null; }
            for (const key of Object.keys(gameData.potions)) gameData.potions[key] = Math.max(0, gameData.potions[key] - step);
            refreshBookIncome();
            remaining -= step;
        }
    } finally { deltaTime = previousDelta; }
}
