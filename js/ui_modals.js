// Modal, popup, and overlay logic

let typingTimeout = null;

// Helper to update the global pause state based on open modals
function updatePauseState () {
	const modals =['introModal', 'authorSelectionScreen', 'authorBioModal', 'tutorialModal', 'versionModal', 'rebirthOneModal', 'rebirthTwoModal', 'retirementModal', 'debugLevelModal'];
	let anyOpen = false;
	for (const id of modals) {
		const m = document.getElementById(id);
		if (m && m.style.display !== 'none' && m.style.display !== '') {
			anyOpen = true;
			break;
		}
	}
	isPaused = anyOpen;
	if (anyOpen) isHoldingSceneButton = false;
}

// Queue functions for modals
function queueTutorialModal (title, text) {
	popupQueue.push({ type: 'tutorial', title: title, text: text });
}

function queueInfoModal (imgEl, isNewUnlock = false, isBadge = false) {
	addGameNotification({ type: isBadge ? 'badge' : imgEl.getAttribute('data-type'), name: imgEl.getAttribute('data-name') });
}


// Show Tutorial Modal
function showTutorialModal (title, text) {
	const modal = document.getElementById('tutorialModal');
	document.getElementById('tutorialModalTitle').textContent = title;
	document.getElementById('tutorialModalText').innerHTML = text;
	modal.style.display = 'flex';
	updatePauseState();
}

function closeTutorialModal () {
	const modal = document.getElementById('tutorialModal');
	if (modal) modal.style.display = 'none';
	updatePauseState();
}

// Describe the same effect categories consumed by formulas.js and mechanics.js.
function getCardBenefits(name, type, data) {
	const career = [];
	const writing = [];
	if (type === 'job') {
		career.push('Earn daily pay while working; job levels increase your pay.');
		writing.push('Each job level adds life experience that improves book quality, with different strengths for each genre.');
		if (name === 'Full-Time Author') writing.push('While selected, multiplies your raw writing speed by 5 before diminishing returns.');
	} else if (type === 'item' || type === 'skill') {
		const effect = data.category === 'Properties' ? 'Inspiration' : data.description;
		const activeEffect = type === 'skill' || data.effect !== 1;
		if (activeEffect) {
			switch (effect) {
				case 'Job XP': case 'Job ex.': career.push('Gain job levels faster, increasing pay and progressing toward career unlocks.'); break;
				case 'Creative Industry experience': career.push('Level Creative Industry jobs faster.'); break;
				case 'Literary Elite experience': career.push('Level Literary Elite jobs faster.'); break;
				case 'Skill XP': case 'Skill ex.':
					career.push('Learn career-supporting skills faster.'); writing.push('Learn writing skills faster.'); break;
				case 'All experience':
					career.push('Gain job and skill levels faster.'); writing.push('Learn writing skills faster.'); break;
				case 'Inspiration':
					career.push('Inspiration speeds up job and skill learning.'); writing.push('Inspiration increases writing speed.'); break;
				case 'Typing Speed': case 'Typing Speed experience': writing.push('Level the Typing Speed skill faster to improve writing speed.'); break;
				case 'Writing Craft experience': writing.push('Learn Writing Craft skills faster to develop your manuscripts.'); break;
				case 'Writing Speed': writing.push('Increase writing speed to finish manuscripts sooner.'); break;
				case 'Expenses': career.push('Reduce daily upkeep, leaving more income to save.'); break;
				case 'Job pay': career.push('Increase pay from your active job.'); break;
				case 'Fame gain': writing.push('Earn more Fame when starting a new lifetime; Fame improves royalties on future books.'); break;
				case 'Later retirement age': career.push('Extend your working lifetime.'); writing.push('Have more in-game years to finish books.'); break;
				case 'Gamespeed': career.push('With Flow enabled, work and learning advance faster, along with aging and upkeep.'); writing.push('With Flow enabled, manuscripts advance faster in real time.'); break;
			}
		}
		if (name === 'Walking') career.push('Your free starting commute keeps job learning at its normal rate.');
		if (name === 'Focus') writing.push('Also increases writing speed directly.');
		if (name === 'Plotting') writing.push('Raises the word-count limit for your manuscripts.');
		if (name === 'Royalty Negotiation') writing.push('Increases royalties from books published after training.');
		if ((type === 'skill' && data.writingQuality > 0) || (type === 'item' && data.writingQuality > 1)) writing.push('Improves book quality, helping new books earn more royalties.');
		if (type === 'item' && data.writingMultiplier > 1) writing.push('Increases writing speed to finish manuscripts sooner.');
	} else if (type === 'potion') {
		career.push('Speeds up work and learning, along with aging and upkeep.');
		writing.push('Speeds up manuscript progress for the duration of the potion.');
	}
	return { career, writing };
}

function showModal (imgElement, isNewUnlock = false, isBadge = false) {
	const name = imgElement.getAttribute('data-name');
	const type = imgElement.getAttribute('data-type');
	const modal = document.getElementById('infoModal');
	const modalImg = document.getElementById('modalImage');
	const modalCategory = document.getElementById('modalCategory');
	const modalTitle = document.getElementById('modalTitle');
	const modalDesc = document.getElementById('modalDescription');
	const modalMax = document.getElementById('modalMaxLevel');
	const modalUnlockMessage = document.getElementById('modalUnlockMessage');
	const modalContent = modal.querySelector('.modal-content');
	
	modalImg.src = imgElement.src;
	modalImg.alt = name;
	modalTitle.textContent = name;
	const stats = document.getElementById('modalStats');
	const task = gameData.taskData[name];
	const item = gameData.itemData[name];
	let statRows = [];
	if ((type === 'job' || type === 'skill') && task) {
		statRows = [['Level', task.level], ['Next level', `${format(task.xp, 0)} / ${format(task.getMaxXp(), 0)} XP`]];
		statRows.push(type === 'job' ? ['Daily pay', `$${format(task.getIncome())}`] : ['Mastery', task.getEffectDescription()]);
	} else if (type === 'item' && item) {
		statRows = [['Upfront price', getPurchasePrice(name) ? `$${format(getPurchasePrice(name))}` : 'Owned / free'], ['Daily upkeep', `$${format(item.getExpense())}`], ['Benefit', item.getEffectDescription()]];
	} else if (type === 'potion' && potionsBaseData[name]) {
		statRows = [['Bonus', `×${potionsBaseData[name].effect.toFixed(1)}`], ['Duration', '10 minutes']];
	}
	stats.innerHTML = statRows.map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join('');
	stats.hidden = statRows.length === 0;
	
	let categoryText = '';
	let actionWord = '';
	if (type === 'job') {
		categoryText = 'Work';
		actionWord = 'work';
	} else if (type === 'skill') {
		categoryText = 'Skill';
		actionWord = 'learn';
	} else if (type === 'item') {
		if (itemCategories['Properties'] && itemCategories['Properties'].includes(name)) {
			categoryText = 'Shop - Property';
		} else if (itemCategories['Transportation'] && itemCategories['Transportation'].includes(name)) {
			categoryText = 'Shop - Transportation';
		} else if (itemCategories['Home Improvements'] && itemCategories['Home Improvements'].includes(name)) {
			categoryText = 'Shop - Home Improvement';
		} else if (itemCategories['Writing Equipment'] && itemCategories['Writing Equipment'].includes(name)) {
			categoryText = 'Shop - Writing Equipment';
		} else if (itemCategories['Work Equipment'] && itemCategories['Work Equipment'].includes(name)) {
			categoryText = 'Shop - Work Equipment';
		} else {
			categoryText = 'Shop - Misc Item';
		}
		actionWord = 'purchase';
	} else if (type === 'potion') {
		categoryText = 'Bonus Item';
		actionWord = 'use';
	} else if (type === 'experience') {
		categoryText = 'Life Experience';
		actionWord = 'gain';
	} else if (type === 'badge') {
		categoryText = 'Badge Earned';
		actionWord = 'earn';
	}
	if (modalCategory) {
		modalCategory.textContent = categoryText;
	}
	
	if (isNewUnlock && modalUnlockMessage) {
		const entityType = type === 'job' ? 'job' : (type === 'skill' ? 'skill' : (type === 'badge' ? 'badge' : 'item'));
		modalUnlockMessage.textContent = `You have unlocked a new ${entityType} to ${actionWord}!`;
		modalUnlockMessage.style.display = 'block';
		modalContent.classList.add('modal-new-unlock');
	} else if (modalUnlockMessage) {
		modalUnlockMessage.style.display = 'none';
		modalContent.classList.remove('modal-new-unlock');
	}
	
	let descriptionText = tooltips[name] || '';
	const benefits = getCardBenefits(name, type, (task || item)?.baseData || potionsBaseData[name] || {});
	for (const [area, sentences] of Object.entries(benefits)) {
		if (sentences.length) descriptionText += `<p class="card-benefit"><b>${area === 'career' ? 'Career' : 'Writing'}:</b> ${sentences.join(' ')}</p>`;
	}
	if (isBadge && badgeBaseData && badgeBaseData[name.toLowerCase().replace(/ /g, '_')]) {
		const badge = badgeBaseData[name.toLowerCase().replace(/ /g, '_')];
		descriptionText = badge.description;
		descriptionText += `<br><br><b style="color:var(--journal-positive);">Effect: ${badge.effect.text}</b>`;
	}
	if (type === 'job') {
		const task = gameData.taskData[name];
		if (task) {
			descriptionText += `<br><br><b style="color:var(--journal-muted);">Writing Experience Bonuses</b><br>
            <span style="font-size: 0.9em; color: var(--journal-muted);">
            Hardship: +${task.hardship},
            Observation: +${task.observation},
            Escapism: +${task.escapism},
            Social: +${task.social}
            </span>`;
		}
	}
	modalDesc.innerHTML = descriptionText;
	
	if ((type === 'job' || type === 'skill') && gameData.rebirthOneCount > 0) {
		const task = gameData.taskData[name];
		if (task) {
			const multi = 1 + (task.maxLevel / 20);
			const formattedMulti = parseFloat(multi.toFixed(2));
			modalMax.textContent = `Max level in past lives: ${task.maxLevel} and this gave you a x${formattedMulti} multiplier`;
			modalMax.style.display = 'block';
		} else {
			modalMax.style.display = 'none';
		}
	} else {
		modalMax.style.display = 'none';
	}
	
	modal.style.display = 'flex';
	updatePauseState();
}

function closeInfoModal () {
	const modal = document.getElementById('infoModal');
	if (modal) modal.style.display = 'none';
	updatePauseState();
}

function showBadgeModal(badgeId) {
	const badge = badgeBaseData[badgeId];
	if (!badge) return;
	
	const modal = document.getElementById('badgeDetailsModal');
	const isEarned = gameData.earnedBadges.includes(badgeId);
	
	document.getElementById('badgeModalImage').src = `img/${badge.filefolder}256/${badge.filename.replace('.png', '.jpg')}`;
	document.getElementById('badgeModalTitle').textContent = badge.name;
	document.getElementById('badgeModalDescription').textContent = badge.description;
	
	const effectEl = document.getElementById('badgeModalEffect');
	const statusEl = document.getElementById('badgeModalStatus');
	
	if (isEarned) {
		effectEl.innerHTML = `<b>Effect:</b> ${badge.effect.text}`;
		effectEl.style.display = 'block';
		statusEl.textContent = 'Status: Unlocked';
		statusEl.style.color = 'var(--journal-positive)';
	} else {
		effectEl.textContent = `When earned: ${badge.effect.text}`;
		effectEl.style.display = 'block';
		statusEl.textContent = 'Status: Locked';
		statusEl.style.color = 'var(--journal-danger)';
	}
	
	modal.style.display = 'flex';
	updatePauseState();
}

function closeBadgeModal() {
	const modal = document.getElementById('badgeDetailsModal');
	if (modal) modal.style.display = 'none';
	updatePauseState();
}

function showMobileBadgeModal() {
	const modal = document.getElementById('mobileBadgeModal');
	if (modal) modal.style.display = 'flex';
	updatePauseState();
}

function closeMobileBadgeModal() {
	const modal = document.getElementById('mobileBadgeModal');
	if (modal) modal.style.display = 'none';
	updatePauseState();
}


var selectedAuthorIndex = 0;

function showAuthorSelection () {
    selectedAuthorIndex = 0;
    renderAuthorChoice();
    document.getElementById('authorSelectionScreen').style.display = 'flex';
    updatePauseState();
}

function cycleAuthor(direction) {
    const count = Object.keys(authorsBaseData).length;
    selectedAuthorIndex = (selectedAuthorIndex + direction + count) % count;
    renderAuthorChoice();
}

function renderAuthorChoice() {
    const keys = Object.keys(authorsBaseData);
    const key = keys[selectedAuthorIndex];
    const author = authorsBaseData[key];
    const grid = document.getElementById('authorSelectionGrid');
    grid.innerHTML = `
        <article class="author-choice">
            <div class="author-choice-portrait">
                <img src="img/${author.filefolder}256/${author.filename.replace('.png', '.jpg')}" alt="${author.name}">
                <span class="portrait-caption">An unwritten life · Age 20</span>
            </div>
            <div class="author-choice-story">
                <span class="journal-kicker">Your protagonist · ${selectedAuthorIndex + 1} / ${keys.length}</span>
                <h2>${author.name}</h2>
                <p>${author.biography.split('<br>')[0]}</p>
                <div class="author-traits">${Object.entries(author.multipliers).map(([name, value]) => `<div><span>${name}</span><strong>×${value.toFixed(1)}</strong></div>`).join('')}</div>
                <button class="btn author-bio-button">Read their story</button>
                <button class="btn journey-primary author-select-button">Begin as ${author.name.split(' ')[0]}</button>
            </div>
        </article>`;
    grid.querySelector('.author-bio-button').onclick = () => showAuthorBio(key);
    grid.querySelector('.author-select-button').onclick = () => selectAuthor(key);
    document.getElementById('authorChoicePosition').textContent = `${selectedAuthorIndex + 1} / ${keys.length}`;
}

function selectAuthor (authorId) {
	gameData.currentAuthor = authorId;
	document.getElementById('authorSelectionScreen').style.display = 'none';
	updatePauseState();
	continueInit();
}

function showAuthorBio (authorId) {
	const author = authorsBaseData[authorId];
	document.getElementById('bioModalName').textContent = author.name;
	document.getElementById('bioModalText').innerHTML = author.biography;
	document.getElementById('authorBioModal').style.display = 'flex';
	updatePauseState();
}

function closeAuthorBio () {
	document.getElementById('authorBioModal').style.display = 'none';
	updatePauseState();
}

function showIntroModal () {
	const introModal = document.getElementById('introModal');
	if (introModal) {
		currentIntroSlide = 0;
		updateIntroSlide();
		introModal.style.display = 'flex';
		updatePauseState();
	}
}

function updateIntroSlide () {
	if (!introSlidesBaseData) return;
	
	const slideKeys = Object.keys(introSlidesBaseData);
	if (slideKeys.length === 0) return;
	
	const currentKey = slideKeys[currentIntroSlide];
	const slide = introSlidesBaseData[currentKey];
	
	document.getElementById('introModalTitle').textContent = slide.title;
	document.getElementById('introModalText').innerHTML = slide.text;
	
	const imgEl = document.getElementById('introModalImage');
	const filefolder = slide.filefolder + '256';
	const filename = slide.filename.replace('.png', '.jpg');
	imgEl.src = `img/${filefolder}/${filename}`;
	imgEl.alt = slide.title;
	document.getElementById('introChapter').textContent = `Chapter ${currentIntroSlide + 1} / ${slideKeys.length}`;
	
	const prevBtn = document.getElementById('introPrevBtn');
	const nextBtn = document.getElementById('introNextBtn');
	
	if (currentIntroSlide === 0) {
		prevBtn.style.visibility = 'hidden';
	} else {
		prevBtn.style.visibility = 'visible';
	}
	
	if (currentIntroSlide === slideKeys.length - 1) {
		nextBtn.textContent = 'Start Journey';
		nextBtn.classList.add('btn-active');
	} else {
		nextBtn.textContent = 'Next';
		nextBtn.classList.remove('btn-active');
	}
}

function prevIntroSlide () {
	if (currentIntroSlide > 0) {
		currentIntroSlide--;
		updateIntroSlide();
	}
}

function nextIntroSlide () {
	if (!introSlidesBaseData) return;
	
	const slideKeys = Object.keys(introSlidesBaseData);
	if (currentIntroSlide < slideKeys.length - 1) {
		currentIntroSlide++;
		updateIntroSlide();
	} else {
		closeIntroModal();
	}
}

function closeIntroModal () {
	const introModal = document.getElementById('introModal');
	if (introModal) {
		introModal.style.display = 'none';
	}
	gameData.introSeen = true;
	saveGameData();
	updatePauseState();
}

function showBookModal (bookId, record = null) {
	const book = booksBaseData[bookId];
	if (!book) return;
	
	const modal = document.getElementById('bookModal');
	const modalImg = document.getElementById('bookModalImage');
	const modalTitle = document.getElementById('bookModalTitle');
	const modalSubtitle = document.getElementById('bookModalSubtitle');
	const modalInfo = document.getElementById('bookModalInfo');
	
	const filefolder = book.filefolder + '256';
	const filename = book.filename.replace('.png', '.jpg');
	modalImg.src = `img/${filefolder}/${filename}`;
	
	modalTitle.textContent = record?.title || getBookTitle(bookId);
	modalSubtitle.textContent = book.subtitle;
	modalInfo.innerHTML = `<b>Genre:</b> ${book.genre} | <b>Words:</b> ${format(record?.words || (bookId === gameData.currentBook ? getBookLength() : book.wordCount), 0)}<br><i>Illustrative manuscript preview</i>`;
	
	modal.style.display = 'flex';
	updatePauseState();
	
	const plan = record?.story || (bookId === gameData.currentBook ? gameData.manuscript : null);
	const firstPageText = plan ? `Your story outline\n\n${plan.protagonist || 'A writer'} pursues ${plan.theme || 'a new beginning'}, leading to a ${plan.ending || 'hopeful'} ending.\n\nApproach: ${plan.approach || 'balanced'}. Editorial decision: ${plan.edit || 'keep the original draft'}.` : ((booksFirstPageBaseData && booksFirstPageBaseData[bookId]) ? booksFirstPageBaseData[bookId] : 'Chapter 1\n\nThe beginning of a new journey...');
	if (plan) {
		if (typingTimeout) clearTimeout(typingTimeout);
		document.getElementById('bookModalFirstPage').textContent = firstPageText;
	} else startTypingEffect(firstPageText, 'bookModalFirstPage');
}

function closeBookModal () {
	if (typingTimeout) clearTimeout(typingTimeout);
	const modal = document.getElementById('bookModal');
	if (modal) modal.style.display = 'none';
	updatePauseState();
}

function showBookFinishedModal (bookId, quality, royalty, publication = null) {
	const book = booksBaseData[bookId];
	if (!book) return;
	
	const modal = document.getElementById('bookFinishedModal');
	const modalImg = document.getElementById('bookFinishedModalImage');
	const modalTitle = document.getElementById('bookFinishedModalTitle');
	const modalSubtitle = document.getElementById('bookFinishedModalSubtitle');
	const modalInfo = document.getElementById('bookFinishedModalInfo');
	const statsBox = document.getElementById('bookFinishedStatsBox');
	
	const filefolder = book.filefolder + '256';
	const filename = book.filename.replace('.png', '.jpg');
	modalImg.src = `img/${filefolder}/${filename}`;
	
	modalTitle.textContent = publication?.name || book.title;
	modalSubtitle.textContent = book.subtitle;
	modalInfo.innerHTML = `<b>Genre:</b> ${book.genre} | <b>Words:</b> ${format(publication?.words || book.wordCount, 0)}`;
	
	statsBox.innerHTML = `
		<div style="margin-bottom: 8px; font-size: 1.1em;"><b>Final Quality:</b> <span style="color: var(--journal-positive);">${quality.toFixed(1)}%</span></div>
		<div style="font-size: 1.1em;"><b>Royalties Earned:</b> <span style="color: var(--chart-royalties);">+$${format(royalty)}/day</span></div>
	`;
	
	modal.style.display = 'flex';
	updatePauseState();
}

function closeBookFinishedModal () {
	const modal = document.getElementById('bookFinishedModal');
	if (modal) modal.style.display = 'none';
	updatePauseState();
}

function showRebirthOneModal () {
	const modal = document.getElementById('rebirthOneModal');
	if (modal) modal.style.display = 'flex';
	updatePauseState();
}

function closeRebirthOneModal () {
	const modal = document.getElementById('rebirthOneModal');
	if (modal) modal.style.display = 'none';
	updatePauseState();
}

function showRebirthTwoModal () {
	const modal = document.getElementById('rebirthTwoModal');
	if (modal) {
		document.getElementById('fameGainDisplayModal').textContent = getFameGain().toFixed(1);
		modal.style.display = 'flex';
	}
	updatePauseState();
}

function closeRebirthTwoModal () {
	const modal = document.getElementById('rebirthTwoModal');
	if (modal) modal.style.display = 'none';
	updatePauseState();
}

function showRetirementModal () {
	const modal = document.getElementById('retirementModal');
	const age = daysToYears(gameData.days);
	
	const rebirthOneContent = document.getElementById('retirementRebirthOne');
	const rebirthTwoContent = document.getElementById('retirementRebirthTwo');
	
	if (rebirthOneContent) {
		rebirthOneContent.style.display = age >= 65 ? 'block' : 'none';
	}
	if (rebirthTwoContent) {
		if (age >= 200) {
			document.getElementById('fameGainDisplayRetirement').textContent = getFameGain().toFixed(1);
			rebirthTwoContent.style.display = 'block';
		} else {
			rebirthTwoContent.style.display = 'none';
		}
	}
	
	if (modal) modal.style.display = 'flex';
	updatePauseState();
}

function closeRetirementModal () {
	const modal = document.getElementById('retirementModal');
	if (modal) modal.style.display = 'none';
	updatePauseState();
}

function showAuthorProfileModal () {
	const modal = document.getElementById('authorProfileModal');
	if (!modal || !gameData.currentAuthor) return;
	
	// --- Populate Profile Tab ---
	const author = authorsBaseData[gameData.currentAuthor];
	const profileImg = document.getElementById('profileAuthorImage');
	const filefolder = author.filefolder + '256';
	const filename = getAuthorImageFilename(author);
	profileImg.src = `img/${filefolder}/${filename}`;
	
	document.getElementById('profileAuthorName').textContent = author.name;
	document.getElementById('profileCareerStats').innerHTML = `<div><span>Age</span><strong>${daysToYears(gameData.days)}</strong></div><div><span>Books</span><strong>${gameData.booksPublished}</strong></div><div><span>Royalties / day</span><strong>$${format(gameData.royalties)}</strong></div><div><span>Badges</span><strong>${gameData.earnedBadges.length}</strong></div>`;
	document.getElementById('profileAuthorBio').innerHTML = author.biography;
	document.getElementById('profileGameVersion').textContent = 'v' + GAME_VERSION;
	syncThemeControl();
	
	// --- Populate Achievements Tab ---
	const achievementsGrid = document.getElementById('profileAchievementsGrid');
	achievementsGrid.innerHTML = '';
	for (const badgeId in badgeBaseData) {
		const badge = badgeBaseData[badgeId];
		const isEarned = gameData.earnedBadges.includes(badgeId);
		const wrapper = document.createElement('div');
		wrapper.className = 'badge-wrapper' + (isEarned ? '' : ' locked-badge');
		wrapper.onclick = () => showBadgeModal(badgeId);
		wrapper.innerHTML = `
            <img src="img/${badge.filefolder}256/${badge.filename.replace('.png', '.jpg')}" class="badge-icon-mobile" alt="${badge.name}">
            <div class="badge-name-mobile">${badge.name}</div>
        `;
		achievementsGrid.appendChild(wrapper);
		const progress = document.createElement('p'); progress.className = 'achievement-progress';
		progress.textContent = `${isEarned ? 'Earned' : badge.requirements.map(describeBadgeProgress).join(' · ')} · ${badge.effect.text}`;
		wrapper.append(progress);
		wrapper.tabIndex = 0;
		wrapper.onkeydown = event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); showBadgeModal(badgeId); } };
	}
	
	const achievementsBooks = document.getElementById('profileAchievementsBooks');
	achievementsBooks.innerHTML = '';
	if (gameData.completedBooks.length > 0) {
		for (let i = gameData.completedBooks.length - 1; i >= 0; i--) {
			const bookRecord = gameData.completedBooks[i];
			const bookData = booksBaseData[bookRecord.id];
			if (!bookData) continue;
			const div = document.createElement('div');
			div.className = 'ui-row';
			div.style.marginBottom = '10px';
			div.innerHTML = `
                <img src="img/${bookData.filefolder}256/${bookData.filename.replace('.png', '.jpg')}" class="row-image" style="width: 50px; height: 75px; object-fit: cover; border-radius: 4px;">
                <div class="row-info">
                    <div class="row-title">${escapeGameText(bookRecord.title || bookData.title)}</div>
                    <div class="row-value">Quality: ${bookRecord.quality.toFixed(1)}% | Royalties: $${format(bookRecord.royalties)}/day</div>
                </div>`;
			achievementsBooks.appendChild(div);
			if (bookRecord.story) {
				const story = document.createElement('p');
				const plan = bookRecord.story;
				story.textContent = `${plan.protagonist || 'A writer'} · ${plan.theme || 'a new beginning'} · ${plan.ending || 'hopeful'} ending · ${plan.approach || 'balanced'} approach · ${plan.edit || 'original draft'}`;
				div.querySelector('.row-info').append(story);
			}
		}
	} else {
		achievementsBooks.innerHTML = '<p>No books published yet.</p>';
	}
	
	// --- Populate Logs Tab ---
	renderJournal(true);
	
	// --- Show Modal ---
	modal.style.display = 'flex';
	switchProfileTab('profile', document.querySelector('.profile-modal-tabs .tab-btn'));
	updatePauseState();
}

function closeAuthorProfileModal () {
	const modal = document.getElementById('authorProfileModal');
	if (modal) modal.style.display = 'none';
	updatePauseState();
}

function renderAuthorChart () {
	observeAuthorChart();
	requestAuthorChartDraw();
}


function startTypingEffect (fullText, elementId) {
	if (typingTimeout) clearTimeout(typingTimeout);
	
	const container = document.getElementById(elementId);
	if (!container) return;
	
	container.innerHTML = '<span class="blinking-cursor">|</span>';
	
	let currentIndex = 0;
	let currentHTML = '';
	let isCorrecting = false;
	
	const getRandomChar = () => {
		const chars = 'abcdefghijklmnopqrstuvwxyz';
		return chars.charAt(Math.floor(Math.random() * chars.length));
	};
	
	function typeNext () {
		if (currentIndex >= fullText.length && !isCorrecting) {
			container.innerHTML = currentHTML + '<span class="blinking-cursor">|</span>';
			return;
		}
		
		let delay = Math.random() * 40 + 20;
		
		if (isCorrecting) {
			currentHTML = currentHTML.slice(0, -1);
			isCorrecting = false;
			delay = 100;
		} else {
			const char = fullText[currentIndex];
			
			if (/[a-zA-Z]/.test(char) && Math.random() < 0.02) {
				currentHTML += getRandomChar();
				isCorrecting = true;
				delay = 150;
			} else {
				if (char === '\n') {
					currentHTML += '<br>';
				} else {
					currentHTML += char;
				}
				currentIndex++;
			}
		}
		
		container.innerHTML = currentHTML + '<span class="blinking-cursor">|</span>';
		
		const wordApp = document.getElementById('wordAppContainer');
		if (wordApp) wordApp.scrollTop = wordApp.scrollHeight;
		
		typingTimeout = setTimeout(typeNext, delay);
	}
	
	typingTimeout = setTimeout(typeNext, 500);
}

let currentDebugTask = null;

function showDebugModal (taskName) {
	if (!isDebugMode) return;
	currentDebugTask = taskName;
	const modal = document.getElementById('debugLevelModal');
	const taskNameSpan = document.getElementById('debugTaskName');
	const input = document.getElementById('debugLevelInput');
	
	if (modal && taskNameSpan && input) {
		taskNameSpan.textContent = taskName;
		const task = gameData.taskData[taskName];
		input.value = task ? task.level : 0;
		modal.style.display = 'flex';
		updatePauseState();
		input.focus();
	}
}

function closeDebugModal () {
	const modal = document.getElementById('debugLevelModal');
	if (modal) modal.style.display = 'none';
	currentDebugTask = null;
	updatePauseState();
}

function applyDebugLevel () {
	if (!isDebugMode) return;
	const input = document.getElementById('debugLevelInput');
	if (input && currentDebugTask) {
		const newLevel = parseInt(input.value, 10);
		if (Number.isSafeInteger(newLevel) && newLevel >= 0 && newLevel <= 10000) {
			const task = gameData.taskData[currentDebugTask];
			if (task) {
				task.level = newLevel;
				task.xp = 0; // Reset XP for the new level
				if (task.level > task.maxLevel) {
					task.maxLevel = task.level;
				}
				if (typeof updateUI === 'function') updateUI();
			}
		}
	}
	closeDebugModal();
}

window.addEventListener('click', function (event) {
	const infoModal = document.getElementById('infoModal');
	if (infoModal && infoModal.style.display === 'flex' && event.target === infoModal) {
		closeInfoModal();
	}
	
	const bookModal = document.getElementById('bookModal');
	if (bookModal && bookModal.style.display === 'flex' && event.target === bookModal) {
		closeBookModal();
	}
	
	const bookFinishedModal = document.getElementById('bookFinishedModal');
	if (bookFinishedModal && bookFinishedModal.style.display === 'flex' && event.target === bookFinishedModal) {
		closeBookFinishedModal();
	}
	
	const authorBioModal = document.getElementById('authorBioModal');
	if (authorBioModal && authorBioModal.style.display === 'flex' && event.target === authorBioModal) {
		closeAuthorBio();
	}
	
	const tutorialModal = document.getElementById('tutorialModal');
	if (tutorialModal && tutorialModal.style.display === 'flex' && event.target === tutorialModal) {
		closeTutorialModal();
	}
	
	const rebirthOneModal = document.getElementById('rebirthOneModal');
	if (rebirthOneModal && rebirthOneModal.style.display === 'flex' && event.target === rebirthOneModal) {
		closeRebirthOneModal();
	}
	
	const rebirthTwoModal = document.getElementById('rebirthTwoModal');
	if (rebirthTwoModal && rebirthTwoModal.style.display === 'flex' && event.target === rebirthTwoModal) {
		closeRebirthTwoModal();
	}
	
	const authorProfileModal = document.getElementById('authorProfileModal');
	if (authorProfileModal && authorProfileModal.style.display === 'flex' && event.target === authorProfileModal) {
		closeAuthorProfileModal();
	}
	
	const badgeDetailsModal = document.getElementById('badgeDetailsModal');
	if (badgeDetailsModal && badgeDetailsModal.style.display === 'flex' && event.target === badgeDetailsModal) {
		closeBadgeModal();
	}
	
	const mobileBadgeModal = document.getElementById('mobileBadgeModal');
	if (mobileBadgeModal && mobileBadgeModal.style.display === 'flex' && event.target === mobileBadgeModal) {
		closeMobileBadgeModal();
	}
	
	const debugLevelModal = document.getElementById('debugLevelModal');
	if (debugLevelModal && debugLevelModal.style.display === 'flex' && event.target === debugLevelModal) {
		closeDebugModal();
	}
});
