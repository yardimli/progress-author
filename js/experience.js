function setExperienceText(id, value) {
    const element = document.getElementById(id);
    if (element && element.textContent !== value) element.textContent = value;
}

function openResourceDetails() {
    const modal = document.getElementById('resourceModal');
    modal.style.display = 'flex';
    modal.querySelector('button').focus();
}
function openAchievements() {
    showAuthorProfileModal();
    switchProfileTab('achievements', document.querySelector('[onclick="switchProfileTab(\'achievements\', this)"]'));
}

function openJournal() {
    showAuthorProfileModal();
    switchProfileTab('logs', document.getElementById('journalTabButton'));
}

function initExperienceUI() {
    document.getElementById('resourceContent').append(document.getElementById('resourceBands'));
    for (const panel of document.querySelectorAll('.panel-column')) {
        if (panel.id === 'writing') continue;
        const button = document.createElement('button'); button.className = 'btn future-toggle';
        button.textContent = 'Show future categories'; button.setAttribute('aria-expanded', 'false');
        button.onclick = () => {
            const show = panel.classList.toggle('show-future');
            button.textContent = show ? 'Hide future categories' : 'Show future categories';
            button.setAttribute('aria-expanded', String(show));
        };
        panel.querySelector('.journey-goal').after(button);
    }
    installGameTooltips();
}

function updateExperienceUI() {
    const plan = gameData.manuscript;
    const editorial = document.getElementById('editorialChoice');
    if (editorial) editorial.hidden = !gameData.currentBook || !!plan?.edit || gameData.wordsWritten < getBookLength() * .5;
    const queue = document.getElementById('bookQueue');
    if (queue && document.activeElement !== queue) {
        const value = String(gameData.queueRemaining || 0);
        if (![...queue.options].some(option => option.value === value)) queue.add(new Option(`${value} more books`, value));
        queue.value = value;
    }
    if (plan) setExperienceText('storyPreview', `${getBookTitle()}: ${plan.protagonist || 'a writer'} pursues ${plan.theme || 'a new beginning'}, heading toward a ${plan.ending || 'hopeful'} ending. ${plan.edit === 'revise' ? 'Your revision adds space for the consequences to unfold.' : plan.edit === 'cut' ? 'Your edit cuts away detours and moves directly to the ending.' : 'The shape of this story is yours to choose.'}`);
    const book = gameData.currentBook;
    const goal = gameData.booksPublished === 0 ? (book ? 'Your first milestone: finish this manuscript. Give writing time with the slider; publication starts a daily royalty income.' : 'Your first milestone: publish a book. Open Writing, choose a genre and allocate writing time. Work funds your living costs; Skills improve your craft.') :
        gameData.booksPublished < 5 ? `Build your backlist: ${gameData.booksPublished}/5 books. Five publications unlock a better royalty contract.` :
        `Build your legacy: ${gameData.booksPublished} books published. Train your craft, improve your next book, and carry experience into your next lifetime.`;
    for (const el of document.querySelectorAll('.journey-goal')) if (el.textContent !== goal) el.textContent = goal;
    const speed = getWritingSpeed() * getGameSpeed();
    const remaining = book && speed > 0 ? Math.ceil(Math.max(0, getBookLength() - gameData.wordsWritten) / speed) : null;
    const quality = getProjectedBookQuality();
    const values = [
        ['Writing speed', `${format(speed, 1)} words / real second`],
        ['Time to finish', remaining === null ? 'Allocate writing time' : `${Math.floor(remaining / 60)}m ${remaining % 60}s`],
        ['Projected quality', `${quality.toFixed(1)}%`],
        ['New book royalties', `$${format(getBookRoyalty(quality) * currentApproach().royalty)} / game day`],
        ['Genre fit', `${Math.round(Math.max(0, Math.min(1, (getCompositionMultiplier() - 1.1) / 1.9)) * 100)}%`],
        ['Publications', String(gameData.booksPublished)]
    ];
    const metrics = document.getElementById('writingMetrics');
    if (metrics) {
        if (!metrics.children.length) for (let i = 0; i < values.length; i++) {
            const cell = document.createElement('div'); cell.append(document.createElement('span'), document.createElement('strong')); metrics.append(cell);
        }
        values.forEach(([label, value], i) => {
            const cell = metrics.children[i];
            if (cell.firstChild.textContent !== label) cell.firstChild.textContent = label;
            if (cell.lastChild.textContent !== value) cell.lastChild.textContent = value;
        });
    }
    setExperienceText('writingBreakdown', `Typing skill ×${gameData.taskData['Typing Speed'].getEffect().toFixed(2)} · Focus ×${gameData.taskData.Focus.getEffect().toFixed(2)} · Inspiration ×${getInspiration().toFixed(2)} · Craft & life experience ×${getWritingQualityMultiplier().toFixed(2)} · Composition ×${getCompositionMultiplier().toFixed(2)}. Quality is projected for this manuscript, including its current scene mix. Choose scenes to approach your genre's preferred mix. Each scene button shows its target in the tooltip.`);
    for (const panel of document.querySelectorAll('.panel-column')) {
        let nextShown = false;
        for (const section of panel.querySelectorAll('.category-section')) {
            const unlocked = [...section.querySelectorAll('[id^="row "]')].some(row => !row.classList.contains('hiddenTask'));
            section.classList.toggle('distant-category', !unlocked && nextShown);
            if (!unlocked) nextShown = true;
        }
    }
}

function getProjectedBookQuality() {
    return getCurvedQuality(getBookQuality() * getQualityMultiplier() * getCompositionMultiplier() * getManuscriptQualityBonus());
}

function describeBadgeProgress(req) {
    const levels = names => names.map(name => gameData.taskData[name]?.level || 0);
    const pair = (label, value, target) => `${label}: ${format(value)} / ${format(target)}`;
    switch (req.type) {
        case 'books': return pair('Books', gameData.booksPublished, req.value);
        case 'bookQuality': return pair('Best quality %', Math.max(0, ...gameData.completedBooks.map(book => book.quality)), req.value);
        case 'task': return pair(req.task, gameData.taskData[req.task]?.level || 0, req.level);
        case 'jobCategoryLevel': return pair(`${req.category} jobs at level ${req.level}`, levels(jobCategories[req.category] || []).filter(level => level >= req.level).length, req.count);
        case 'skillLevelCount': return pair(`Skills at level ${req.level}`, levels(Object.keys(skillBaseData)).filter(level => level >= req.level).length, req.count);
        case 'maxTaskLevel': return pair(`Highest ${req.taskType} level`, Math.max(0, ...levels(Object.keys(req.taskType === 'Job' ? jobBaseData : skillBaseData))), req.level);
        case 'coins': return pair('Funds', gameData.coins, req.value);
        case 'fame': return pair('Fame', gameData.fame, req.value);
        case 'age': return pair('Age', daysToYears(gameData.days), req.value);
        case 'rebirth': return pair('Rebirths', gameData[req.rebirthType] || 0, req.value);
        case 'item': return `${req.name}: ${isRequirementMet(req) ? 'equipped' : 'equip to earn'}`;
        default: return isRequirementMet(req) ? 'Complete' : 'In progress';
    }
}

function installGameTooltips() {
    if (document.getElementById('gameTooltip')) return;
    const tip = document.createElement('div'); tip.id = 'gameTooltip'; tip.role = 'tooltip'; tip.hidden = true; document.body.append(tip);
    let target;
    function hide() { tip.hidden = true; if (target) target.removeAttribute('aria-describedby'); }
    function show(event) {
        const el = event.target.closest('[title], [data-tooltip]');
        if (!el) return;
        if (el.title) { el.dataset.tooltip = el.title; el.removeAttribute('title'); }
        hide(); target = el; tip.textContent = el.dataset.tooltip; tip.hidden = false;
        el.setAttribute('aria-describedby', tip.id);
        const rect = el.getBoundingClientRect();
        tip.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - tip.offsetWidth - 8)) + 'px';
        tip.style.top = Math.max(8, Math.min(rect.bottom + 8, window.innerHeight - tip.offsetHeight - 8)) + 'px';
    }
    document.addEventListener('pointerover', show);
    document.addEventListener('focusin', show);
    document.addEventListener('pointerout', hide);
    document.addEventListener('focusout', hide);
    document.addEventListener('click', event => { hide(); show(event); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') hide(); });
}
