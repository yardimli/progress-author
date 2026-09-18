const writingApproaches = {
    balanced: { speed: 1, quality: 1, royalty: 1 },
    commercial: { speed: 1.2, quality: .85, royalty: 1.15 },
    crafted: { speed: .8, quality: 1.35, royalty: 1 }
};
function escapeGameText(text) { return String(text).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
function currentApproach() { return writingApproaches[gameData.manuscript?.approach] || writingApproaches.balanced; }
function getManuscriptQualityBonus() {
    return currentApproach().quality * (gameData.manuscript?.edit === 'revise' ? 1.25 : gameData.manuscript?.edit === 'cut' ? .9 : 1);
}
function getManuscriptLengthBonus() { return gameData.manuscript?.edit === 'revise' ? 1.15 : gameData.manuscript?.edit === 'cut' ? .9 : 1; }
function getManuscriptIdeals(genre) {
    const base = genreIdealsBaseData?.[genre];
    if (!base) return null;
    const ideals = { ...base }, plan = gameData.manuscript;
    if (!plan) return ideals;
    const priorities = {
        'an outsider': 'Internal Monologue', 'a reluctant mentor': 'Dialogue', 'two rivals': 'Drama',
        belonging: 'Dialogue', ambition: 'Drama', justice: 'Action',
        hopeful: 'Dialogue', bittersweet: 'Internal Monologue', unresolved: 'Mystery'
    };
    for (const choice of [plan.protagonist, plan.theme, plan.ending]) {
        const scene = priorities[choice];
        if (scene && sceneTypesBaseData?.[genre]?.[scene]) ideals[scene] = (ideals[scene] || 0) + .1;
    }
    const total = Object.values(ideals).reduce((sum, value) => sum + value, 0);
    return Object.fromEntries(Object.entries(ideals).map(([scene, value]) => [scene, value / total]));
}
function planNewManuscript() {
    const value = (id, fallback) => document.getElementById(id)?.value || fallback;
    const plan = gameData.draftPlan || {};
    gameData.manuscript = {
        title: value('manuscriptTitle', '').slice(0, 80),
        protagonist: value('storyCharacter', plan.protagonist || 'an outsider'),
        theme: value('storyTheme', plan.theme || 'belonging'),
        ending: value('storyEnding', plan.ending || 'hopeful'),
        approach: value('writingApproach', plan.approach || 'balanced'), edit: null
    };
    gameData.draftPlan = { ...gameData.manuscript, title: '' };
}
function chooseEditorial(edit) {
    if (!['keep', 'revise', 'cut'].includes(edit) || !gameData.currentBook || gameData.manuscript?.edit || gameData.wordsWritten < getBookLength() * .5) return;
    gameData.manuscript ||= { approach: 'balanced' };
    gameData.manuscript.edit = edit;
    updateExperienceUI();
}
function getBookTitle(id = gameData.currentBook) {
    return id === gameData.currentBook && gameData.manuscript?.title ? gameData.manuscript.title : booksBaseData[id]?.title || 'Untitled manuscript';
}
function getNewManuscriptLength() {
    const fullLength = booksBaseData[gameData.currentBook]?.wordCount || 12000;
    return Math.min(fullLength, gameData.booksPublished < 3 ? 12000 + gameData.booksPublished * 6000 : fullLength);
}
function startQueuedBook() {
    if (!gameData.queueRemaining || gameData.days >= getLifespan()) return;
    gameData.queueRemaining--;
    gameData.selectedGenre = gameData.queueGenre || gameData.selectedGenre;
    pickNextBook(gameData.selectedGenre);
    gameData.manuscript = { ...(gameData.draftPlan || {}), title: '', edit: null };
    gameData.manuscript.targetWords = getNewManuscriptLength();
    const scenes = Object.keys(sceneTypesBaseData[gameData.selectedGenre] || {});
    gameData.activeScene = currentAutoSceneType = nextSceneType = scenes[0] || 'Action';
    if (!isCatchingUp) buildSceneButtons();
}
function setBookQueue(value) {
    gameData.queueRemaining = Math.max(0, Math.min(10, parseInt(value, 10) || 0));
    gameData.queueGenre = gameData.selectedGenre;
}
function getPurchasePrice(name) {
    const data = itemBaseData[name];
    if (!data || !data.requirements?.length || gameData.ownedItems?.includes(name)) return 0;
    const threshold = data.requirements.find(r => r.type === 'coins')?.value || 0;
    return Math.round(Math.max(threshold * .2, (data.expense || 0) * 60));
}
function buyUpgrade(name) {
    if (!gameData.unlocks[name] && itemBaseData[name]?.requirements?.length) return false;
    const price = getPurchasePrice(name);
    if (gameData.coins < price) {
        addGameNotification({ type: 'summary', name: 'Save for this upgrade', message: `${name} costs $${format(price)} upfront. You have $${format(gameData.coins)}. Upkeep is separate.` });
        return false;
    }
    gameData.coins -= price;
    gameData.ownedItems ||= [];
    if (!gameData.ownedItems.includes(name)) gameData.ownedItems.push(name);
    return true;
}
