let isCatchingUp = false;
let offlinePaused = false;

function formatAwayDuration(seconds) {
    const total = Math.floor(Math.max(0, seconds) + 1e-6);
    if (total < 1) return 'less than 1s';
    const hours = Math.floor(total / 3600);
    return `${hours ? hours + 'h ' : ''}${Math.floor(total / 60) % 60}m ${total % 60}s`;
}

function advanceAwayProgress(now = Date.now()) {
    const previous = gameData.lastProgressAt;
    gameData.lastProgressAt = now;
    if (!previous || !gameData.offlineEligible || !gameData.introSeen || !gameData.currentAuthor || offlinePaused) return;
    const awaySeconds = Math.max(0, (now - previous) / 1000);
    const elapsed = Math.min(8 * 3600, awaySeconds);
    if (elapsed < 1) return;
    const initial = { coins: gameData.coins, books: gameData.booksPublished, days: gameData.days };
    const oldDelta = deltaTime;
    let remaining = elapsed, played = 0;
    isCatchingUp = true;
    isHoldingSceneButton = false;
    try {
        while (remaining > 0.00001 && gameData.days < getLifespan()) {
            const speed = getGameSpeed();
            if (!(speed > 0)) break;
            let step = Math.min(1, remaining, (getLifespan() - gameData.days) / speed);
            for (const value of Object.values(gameData.potions)) if (value > 0) step = Math.min(step, value);
            if (gameData.currentBook && currentAutoSceneType && getWritingSpeed() > 0) {
                step = Math.min(step, Math.max(0.00001, (getBookLength() - gameData.wordsWritten) / (getWritingSpeed() * speed)));
            }
            deltaTime = step;
            if (BALANCE.writing.salesEnabled) advanceWritingEconomy(step);
            else {
            updateLogic();
            if (gameData.currentBook && currentAutoSceneType) writeProgress(currentAutoSceneType, step);
            for (const key of Object.keys(gameData.potions)) gameData.potions[key] = Math.max(0, gameData.potions[key] - step);
            }
            checkBadgeUnlocks();
            let discovery;
            while ((discovery = discoverNextCard())) addGameNotification(discovery);
            remaining -= step; played += step;
        }
    } finally { isCatchingUp = false; deltaTime = oldDelta; }
    if (played > 0) addGameNotification({ type: 'summary', name: 'While you were away', awaySeconds, simulatedSeconds: played, message: `Away for ${formatAwayDuration(awaySeconds)} · ${formatAwayDuration(played)} simulated · $${format(gameData.coins - initial.coins)} balance change · ${gameData.booksPublished - initial.books} books published. ${gameData.days >= getLifespan() ? 'Progress stopped at retirement.' : ''} Away progress is limited to 8 hours per return.` });
    saveGameData();
}

// Web Locks serialize whole game sessions across tabs, including offline rewards.
async function startOwnedGame() {
    if (!navigator.locks) { await init(); return; }
    await navigator.locks.request(gameSaveKey() + '-owner', { ifAvailable: true }, async lock => {
        if (!lock) {
            document.body.innerHTML = '<main style="padding:3rem;max-width:40rem;margin:auto"><h1>Your journey is open in another tab</h1><p>Use that tab, or close it and reload here. This prevents conflicting saves and duplicate offline rewards.</p><button onclick="location.reload()">Try again</button></main>';
            return;
        }
        await init();
        await new Promise(resolve => window.addEventListener('pagehide', resolve, { once: true }));
    });
}

window.addEventListener('visibilitychange', () => {
    if (!isInitialized) return;
    if (document.hidden) {
        gameData.lastProgressAt = Date.now();
        gameData.offlineEligible = !isPaused;
        saveGameData();
    } else {
        advanceAwayProgress();
        lastTime = performance.now();
        updateUI();
    }
});
window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
