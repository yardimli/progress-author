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
    if (BALANCE.writing.salesEnabled) {
        for (const [panel, key, label] of [['skills', 'train', 'Automatically choose training using the plan below']]) {
            const control = document.createElement('label');
            const input = document.createElement('input');
            input.type = 'checkbox'; input.checked = gameData.automation[key];
            input.onchange = () => { gameData.automation[key] = input.checked; gameData.automation.lastDay = null; scheduleGameSave(); };
            control.append(input, document.createTextNode(label + ' (checked once per game day).'));
            document.getElementById(panel).querySelector('.journey-goal').after(control);
        }
        buildTrainingControls();
        for (const [id, field, fallback] of [['bookEditor', 'editor', 'none']]) {
            const input = document.getElementById(id);
            input.value = gameData.draftPlan?.[field] || fallback;
            input.onchange = () => { gameData.draftPlan ||= {}; gameData.draftPlan[field] = input.value; };
        }
    }
    document.getElementById('resourceContent').append(document.getElementById('resourceBands'));
    for (const panel of document.querySelectorAll('.panel-column')) {
        const goal = panel.querySelector('.journey-goal');
        const text = document.createElement('span');
        const hide = document.createElement('button');
        hide.className = 'btn journey-goal-hide'; hide.textContent = 'Hide';
        hide.setAttribute('aria-label', 'Hide this journey goal until your next lifetime');
        hide.onclick = () => {
            gameData.hiddenJourneyGoals ||= {};
            gameData.hiddenJourneyGoals[panel.id] = true;
            goal.hidden = true; scheduleGameSave();
        };
        goal.replaceChildren(text, hide);
        goal.hidden = !!gameData.hiddenJourneyGoals?.[panel.id];
    }
    installGameTooltips();
}

function buildTrainingControls() {
    const section = document.createElement('section');
    section.className = 'writing-dashboard'; section.id = 'trainingPlanControls';
    section.innerHTML = '<h3>Training plan</h3><label>Priority <select id="trainingMode"><option value="category">Lowest level in selected category</option><option value="promotion">Skills for the next job in this branch</option><option value="targets">My ordered skill targets</option></select></label><div id="trainingTargetControls"><label>Skill <select id="trainingTargetSkill"></select></label> <label>Target level <input id="trainingTargetLevel" type="number" min="1" max="100000" value="20"></label> <button class="btn" id="addTrainingTarget">Add / update target</button><ol id="trainingTargets"></ol></div><p>Automatic training must be enabled above. Locked targets train their available skill prerequisites first. Unavailable targets are skipped. When no target can advance, your selected skill continues training. This never switches your job or time allocation.</p>';
    document.getElementById('skills').querySelector('input[type="checkbox"]').parentElement.after(section);
    const mode = document.getElementById('trainingMode');
    mode.value = gameData.automation.trainingMode || 'category';
    const targetControls = document.getElementById('trainingTargetControls');
    targetControls.hidden = mode.value !== 'targets';
    mode.onchange = () => { gameData.automation.trainingMode = mode.value; gameData.automation.lastDay = null; targetControls.hidden = mode.value !== 'targets'; scheduleGameSave(); };
    const choices = document.getElementById('trainingTargetSkill');
    for (const name of Object.keys(skillBaseData)) choices.add(new Option(name, name));
    document.getElementById('addTrainingTarget').onclick = () => {
        if (addTrainingTarget(choices.value, document.getElementById('trainingTargetLevel').value)) { renderTrainingTargets(); scheduleGameSave(); }
    };
    renderTrainingTargets();
}
function renderTrainingTargets() {
    const list = document.getElementById('trainingTargets'); list.replaceChildren();
    for (const [index, target] of (gameData.automation.targets || []).entries()) {
        const row = document.createElement('li'); row.append(document.createTextNode(`${target.skill} → level ${target.level} `));
        for (const [label, action] of [['Move up', () => {
            if (index > 0) [gameData.automation.targets[index - 1], gameData.automation.targets[index]] = [gameData.automation.targets[index], gameData.automation.targets[index - 1]];
        }], ['Remove', () => gameData.automation.targets.splice(index, 1)]]) {
            const button = document.createElement('button'); button.className = 'btn'; button.textContent = label;
            button.setAttribute('aria-label', `${label} ${target.skill}`); button.disabled = label === 'Move up' && index === 0;
            button.onclick = () => { action(); gameData.automation.lastDay = null; renderTrainingTargets(); scheduleGameSave(); };
            row.append(button);
        }
        list.append(row);
    }
}

var lastBudgetRefresh = -Infinity;
var lastBudgetAllocation = null;
function updateExperienceUI() {
    const budgetPanel = document.getElementById('careerBudgetPanel');
    if (budgetPanel) budgetPanel.hidden = !BALANCE.writing.salesEnabled;
    if (BALANCE.writing.salesEnabled && (performance.now() - lastBudgetRefresh >= 1000 || lastBudgetAllocation !== gameData.workWritingBalance)) {
        lastBudgetRefresh = performance.now();
        lastBudgetAllocation = gameData.workWritingBalance;
        const budget = careerBudget(), history = writingLivelihood();
        setExperienceText('careerBudgetText', `Per game day: work $${format(budget.wages)} + book sales $${format(budget.sales)} − upkeep $${format(budget.upkeep)} = ${budget.net < 0 ? '−' : '+'}$${format(Math.abs(budget.net))}. Editing reserved: $${format(budget.reserved)}. Available savings: $${format(budget.available)}.`);
        setExperienceText('careerRunwayText', `Estimated savings runway: ${budget.runway === null ? 'current wages cover upkeep' : budget.runway === 0 ? 'editing fee exceeds savings' : format(budget.runway, 1) + ' game days'}. Includes declining existing sales; assumes no future releases, purchases or changes to work and upkeep. ${gameData.currentBook ? 'Manuscript finish estimate is above.' : 'No manuscript is in progress.'}`);
        setExperienceText('writingLivelihoodText', `${gameData.writingIndependent ? 'Full-Time Author milestone earned. ' : ''}Last 365 completed game days (${format(Math.min(365, history.observed), 0)} observed): books $${format(history.sales)}, editing-adjusted books $${format(history.net)}, wages $${format(history.work)}, upkeep $${format(history.upkeep)}. Earn independence when a full year of editing-adjusted book income covers upkeep and exceeds actual wages and available full-time employment.`);
    }
    const plan = gameData.manuscript;
    const service = document.getElementById('bookServiceSettings');
    if (service) service.hidden = !BALANCE.writing.salesEnabled;
    const feeHelp = document.getElementById('editorFeeHelp');
    if (feeHelp) feeHelp.hidden = !!gameData.hasUsedEditor || (gameData.completedBooks || []).some(book => book.story?.editorPaid);
    if (BALANCE.writing.salesEnabled) setExperienceText('bookEditorQuote', `Next manuscript: $${format(editingQuote())} for paid editing.${gameData.currentBook && plan?.editor === 'paid' ? ` Current manuscript's locked fee: $${format(plan.editorFee)}.` : ''}`);
    const editorial = document.getElementById('editorialChoice');
    if (editorial) editorial.hidden = !gameData.currentBook || !!plan?.edit || gameData.wordsWritten < getBookLength() * .5;
    if (plan) setExperienceText('storyPreview', `${getBookTitle()}: ${plan.protagonist || 'a writer'} pursues ${plan.theme || 'a new beginning'}, heading toward a ${plan.ending || 'hopeful'} ending. ${plan.edit === 'revise' ? 'Your revision adds space for the consequences to unfold.' : plan.edit === 'cut' ? 'Your edit cuts away detours and moves directly to the ending.' : 'The shape of this story is yours to choose.'}`);
    const book = gameData.currentBook;
    const goal = gameData.booksPublished === 0 ? (book ? 'Your first milestone: finish this manuscript. Give writing time with the slider; publication starts a daily royalty income.' : 'Your first milestone: publish a book. Open Writing, choose a genre and allocate writing time. Work funds your living costs; Skills improve your craft.') :
        gameData.booksPublished < 5 ? `Build your backlist: ${gameData.booksPublished}/5 books. Five publications unlock a better royalty contract.` :
        `Build your legacy: ${gameData.booksPublished} books published. Train your craft, improve your next book, and carry experience into your next lifetime.`;
    const displayGoal = BALANCE.writing.salesEnabled ? 'Work funds your living costs. Publish stronger books to grow your readership; each release earns declining sales for two game years. Build an audience that can support your writing.' : goal;
    for (const el of document.querySelectorAll('.journey-goal')) {
        el.hidden = !!gameData.hiddenJourneyGoals?.[el.parentElement.id];
        const text = el.querySelector('span');
        if (text && text.textContent !== displayGoal) text.textContent = displayGoal;
    }
    const speed = book ? getWritingSpeed() * getGameSpeed() : 0;
    const remaining = book && speed > 0 ? Math.ceil(Math.max(0, getBookLength() - gameData.wordsWritten) / speed) : null;
    const quality = book ? getProjectedBookQuality() : 0;
    const values = [
        ['Manuscript', !book ? 'No active manuscript' : plan?.awaitingEditor ? 'Awaiting editing' : speed > 0 ? 'Writing' : 'Writing paused'],
        ['Writing speed', book ? `${format(speed, 1)} words / real second` : '', !book],
        ['Time to finish', !book ? '' : plan?.awaitingEditor ? 'Draft complete · awaiting editing' : remaining === null ? 'Allocate writing time' : `${Math.floor(remaining / 60)}m ${remaining % 60}s`, !book],
        ['Projected quality', book ? `${quality.toFixed(1)}%` : '', !book],
        ['Published book income', `$${format(gameData.royalties)} / game day`],
        ['Genre fit', book ? `${Math.round(Math.max(0, Math.min(1, (getCompositionMultiplier() - 1.1) / 1.9)) * 100)}%` : '', !book],
        ['Publications', String(gameData.booksPublished)]
    ];
    if (BALANCE.writing.salesEnabled) values.push(['Readership', format(gameData.readership, 0)]);
    const metrics = document.getElementById('writingMetrics');
    if (metrics) {
        for (let i = metrics.children.length; i < values.length; i++) {
            const cell = document.createElement('div'); cell.append(document.createElement('span'), document.createElement('strong')); metrics.append(cell);
        }
        values.forEach(([label, value, hidden = false], i) => {
            const cell = metrics.children[i];
            if (cell.hidden !== hidden) cell.hidden = hidden;
            if (cell.firstChild.textContent !== label) cell.firstChild.textContent = label;
            if (cell.lastChild.textContent !== value) cell.lastChild.textContent = value;
        });
    }
    const breakdown = document.getElementById('writingBreakdown');
    if (breakdown) {
        const details = breakdown.closest('details');
        if (details) details.hidden = !book;
    }
    setExperienceText('writingBreakdown', book ? `Typing skill ×${gameData.taskData['Typing Speed'].getEffect().toFixed(2)} · Focus ×${gameData.taskData.Focus.getEffect().toFixed(2)} · Inspiration ×${getInspiration().toFixed(2)} · Craft & life experience ×${getWritingQualityMultiplier().toFixed(2)} · Composition ×${getCompositionMultiplier().toFixed(2)}. Quality is projected for this manuscript, including its current scene mix. Choose scenes to approach your genre's preferred mix. Each scene button shows its target in the tooltip. Published book income only includes released books; this manuscript earns nothing until publication.` : '');
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
