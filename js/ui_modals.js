// Modal, popup, and overlay logic

let typingTimeout = null;
// Removed: Chart.js instance variable is no longer needed

// Helper to update the global pause state based on open modals
function updatePauseState () {
	const modals =['infoModal', 'bookModal', 'introModal', 'authorSelectionScreen', 'authorBioModal', 'tutorialModal', 'versionModal', 'rebirthOneModal', 'rebirthTwoModal', 'retirementModal', 'bookFinishedModal', 'badgeDetailsModal', 'mobileBadgeModal', 'authorProfileModal', 'debugLevelModal'];
	let anyOpen = false;
	for (const id of modals) {
		const m = document.getElementById(id);
		if (m && m.style.display !== 'none' && m.style.display !== '') {
			anyOpen = true;
			break;
		}
	}
	isPaused = anyOpen;
}

// Queue functions for modals
function queueTutorialModal (title, text) {
	popupQueue.push({ type: 'tutorial', title: title, text: text });
}

function queueInfoModal (imgEl, isNewUnlock = false, isBadge = false) {
	if (isBadge) {
		popupQueue.push({ type: 'badge', imgEl: imgEl, isNewUnlock: isNewUnlock });
	} else {
		popupQueue.push({ type: 'info', imgEl: imgEl, isNewUnlock: isNewUnlock });
	}
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
	modalTitle.textContent = name;
	
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
	if (isBadge && badgeBaseData && badgeBaseData[name.toLowerCase().replace(/ /g, '_')]) {
		const badge = badgeBaseData[name.toLowerCase().replace(/ /g, '_')];
		descriptionText = badge.description;
		descriptionText += `<br><br><b style="color:#4CAF50;">Effect: ${badge.effect.text}</b>`;
	}
	if (type === 'job') {
		const task = gameData.taskData[name];
		if (task) {
			descriptionText += `<br><br><b style="color:#888;">Writing Experience Bonuses</b><br>
            <span style="font-size: 0.9em; color: #aaa;">
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
		statusEl.style.color = '#4CAF50';
	} else {
		effectEl.style.display = 'none';
		statusEl.textContent = 'Status: Locked';
		statusEl.style.color = '#f44336';
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


function showAuthorSelection () {
	const screen = document.getElementById('authorSelectionScreen');
	const grid = document.getElementById('authorSelectionGrid');
	grid.innerHTML = '';
	
	for (const key in authorsBaseData) {
		const author = authorsBaseData[key];
		const mults = author.multipliers;
		
		const card = document.createElement('div');
		card.className = 'ui-card';
		card.style.cursor = 'default';
		
		const img = document.createElement('img');
		img.className = 'card-image';
		img.style.cursor = 'pointer';
		const filefolder = author.filefolder + '256';
		const filename = author.filename.replace('.png', '.jpg');
		img.src = `img/${filefolder}/${filename}`;
		img.onclick = () => showAuthorBio(key);
		
		const name = document.createElement('div');
		name.className = 'card-title';
		name.style.fontSize = '1.1em';
		name.style.marginTop = '5px';
		name.textContent = author.name;
		
		const stats = document.createElement('div');
		stats.style.fontSize = '0.9em';
		stats.style.color = '#888';
		stats.style.textAlign = 'left';
		stats.style.marginTop = '10px';
		stats.style.marginBottom = '15px';
		stats.style.lineHeight = '1.5';
		stats.style.width = '100%';
		stats.innerHTML = `
      <b>Hardship:</b> x${mults.hardship.toFixed(1)}<br>
      <b>Observation:</b> x${mults.observation.toFixed(1)}<br>
      <b>Escapism:</b> x${mults.escapism.toFixed(1)}<br>
      <b>Social:</b> x${mults.social.toFixed(1)}
    `;
		
		const selectBtn = document.createElement('button');
		selectBtn.className = 'btn';
		selectBtn.style.marginTop = 'auto';
		selectBtn.style.width = '100%';
		selectBtn.textContent = 'Select';
		selectBtn.onclick = () => selectAuthor(key);
		
		card.appendChild(img);
		card.appendChild(name);
		card.appendChild(stats);
		card.appendChild(selectBtn);
		grid.appendChild(card);
	}
	
	screen.style.display = 'flex';
	updatePauseState();
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

function showBookModal (bookId) {
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
	
	modalTitle.textContent = book.title;
	modalSubtitle.textContent = book.subtitle;
	modalInfo.innerHTML = `<b>Genre:</b> ${book.genre} | <b>Words:</b> ${format(book.wordCount, 0)}<br><i>"${book.hook}"</i>`;
	
	modal.style.display = 'flex';
	updatePauseState();
	
	const firstPageText = (booksFirstPageBaseData && booksFirstPageBaseData[bookId]) ? booksFirstPageBaseData[bookId] : 'Chapter 1\n\nThe beginning of a new journey...';
	startTypingEffect(firstPageText, 'bookModalFirstPage');
}

function closeBookModal () {
	if (typingTimeout) clearTimeout(typingTimeout);
	const modal = document.getElementById('bookModal');
	if (modal) modal.style.display = 'none';
	updatePauseState();
}

function showBookFinishedModal (bookId, quality, royalty) {
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
	
	modalTitle.textContent = book.title;
	modalSubtitle.textContent = book.subtitle;
	modalInfo.innerHTML = `<b>Genre:</b> ${book.genre} | <b>Words:</b> ${format(book.wordCount, 0)}<br><i>"${book.hook}"</i>`;
	
	statsBox.innerHTML = `
		<div style="margin-bottom: 8px; font-size: 1.1em;"><b>Final Quality:</b> <span style="color: #4CAF50;">${quality.toFixed(1)}%</span></div>
		<div style="font-size: 1.1em;"><b>Royalties Earned:</b> <span style="color: #219ebc;">+$${format(royalty)}/day</span></div>
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
	document.getElementById('profileAuthorBio').innerHTML = author.biography;
	document.getElementById('profileGameVersion').textContent = 'v' + GAME_VERSION;
	
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
                    <div class="row-title">${bookData.title}</div>
                    <div class="row-value">Quality: ${bookRecord.quality.toFixed(1)}% | Royalties: $${format(bookRecord.royalties)}/day</div>
                </div>`;
			achievementsBooks.appendChild(div);
		}
	} else {
		achievementsBooks.innerHTML = '<p>No books published yet.</p>';
	}
	
	// --- Populate Logs Tab ---
	const logContainer = document.getElementById('profileLogContainer');
	logContainer.innerHTML = gameData.logHistory.map(log => `<div class="log-entry">${log}</div>`).join('');
	
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
	// A small delay to ensure the canvas is visible and has its final dimensions
	setTimeout(() => {
		drawAuthorChart('authorChart', gameData.monthlyChartData);
	}, 100);
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

// Added: Debug modal state
let currentDebugTask = null;

// Added: Show debug modal
function showDebugModal (taskName) {
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

// Added: Close debug modal
function closeDebugModal () {
	const modal = document.getElementById('debugLevelModal');
	if (modal) modal.style.display = 'none';
	currentDebugTask = null;
	updatePauseState();
}

// Added: Apply debug level
function applyDebugLevel () {
	const input = document.getElementById('debugLevelInput');
	if (input && currentDebugTask) {
		const newLevel = parseInt(input.value, 10);
		if (!isNaN(newLevel) && newLevel >= 0) {
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
	
	// Added: Close debug modal on outside click
	const debugLevelModal = document.getElementById('debugLevelModal');
	if (debugLevelModal && debugLevelModal.style.display === 'flex' && event.target === debugLevelModal) {
		closeDebugModal();
	}
});
