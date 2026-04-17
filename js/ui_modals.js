// Modal, popup, and overlay logic

let typingTimeout = null;

// Helper to update the global pause state based on open modals
function updatePauseState () {
	// Added new modal IDs to the list
	const modals = ['infoModal', 'bookModal', 'introModal', 'authorSelectionScreen', 'authorBioModal', 'tutorialModal', 'versionModal', 'rebirthOneModal', 'rebirthTwoModal', 'retirementModal'];
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

// Added isNewUnlock flag to track if it's a first-time unlock
function queueInfoModal (imgEl, isNewUnlock = false) {
	popupQueue.push({ type: 'info', imgEl: imgEl, isNewUnlock: isNewUnlock });
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

// Added isNewUnlock parameter to handle styling and text for newly unlocked items
function showModal (imgElement, isNewUnlock = false) {
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
	
	// Logic to display what the modal is for (Work, Skill, Shop, etc.)
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
		categoryText = 'Cheat Item';
		actionWord = 'use';
	} else if (type === 'experience') {
		categoryText = 'Life Experience';
		actionWord = 'gain';
	}
	if (modalCategory) {
		modalCategory.textContent = categoryText;
	}
	
	// Handle new unlock styling and text
	if (isNewUnlock && modalUnlockMessage) {
		const entityType = type === 'job' ? 'job' : (type === 'skill' ? 'skill' : 'item');
		modalUnlockMessage.textContent = `You have unlocked a new ${entityType} to ${actionWord}!`;
		modalUnlockMessage.style.display = 'block';
		modalContent.classList.add('modal-new-unlock');
	} else if (modalUnlockMessage) {
		modalUnlockMessage.style.display = 'none';
		modalContent.classList.remove('modal-new-unlock');
	}
	
	let descriptionText = tooltips[name] || '';
	if (type === 'job') {
		const task = gameData.taskData[name];
		if (task) {
			descriptionText += `<br><br><b style="color:#888;">Writing Experience Bonuses</b><br>
            <span style="font-size: 0.9em; color: #aaa;">
            Hardship: +${task.hardship},
            Observation: +${task.observation},
            Escapism: +${task.escapism},
            Exposure: +${task.exposure},
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
	updatePauseState(); // Pause game
}

function closeInfoModal () {
	const modal = document.getElementById('infoModal');
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
		card.style.width = '180px';
		card.style.height = 'auto';
		card.style.padding = '15px';
		card.style.cursor = 'default';
		
		const img = document.createElement('img');
		img.className = 'card-image';
		img.style.width = '190px';
		img.style.height = '190px';
		img.style.cursor = 'pointer';
		const filefolder = author.filefolder + '256';
		const filename = author.filename.replace('.png', '.jpg');
		img.src = `img/${filefolder}/${filename}`;
		img.onclick = () => showAuthorBio(key);
		
		const name = document.createElement('div');
		name.className = 'card-title';
		name.style.fontSize = '1.1em';
		name.style.marginTop = '5px';
		name.style.height = '45px';
		name.textContent = author.name;
		
		const stats = document.createElement('div');
		stats.style.fontSize = '0.9em';
		stats.style.color = '#888';
		stats.style.textAlign = 'left';
		stats.style.marginTop = '10px';
		stats.style.lineHeight = '1.5';
		stats.innerHTML = `
      <b>Hardship:</b> x${mults.hardship.toFixed(1)}<br>
      <b>Observation:</b> x${mults.observation.toFixed(1)}<br>
      <b>Escapism:</b> x${mults.escapism.toFixed(1)}<br>
      <b>Exposure:</b> x${mults.exposure.toFixed(1)}<br>
      <b>Social:</b> x${mults.social.toFixed(1)}
    `;
		
		const selectBtn = document.createElement('button');
		selectBtn.className = 'btn';
		selectBtn.style.marginTop = '15px';
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
	updatePauseState(); // Pause game
}

// Set the selected author and continue game initialization
function selectAuthor (authorId) {
	gameData.currentAuthor = authorId;
	document.getElementById('authorSelectionScreen').style.display = 'none';
	updatePauseState(); // Unpause game
	continueInit();
}

function showAuthorBio (authorId) {
	const author = authorsBaseData[authorId];
	document.getElementById('bioModalName').textContent = author.name;
	document.getElementById('bioModalText').innerHTML = author.biography;
	document.getElementById('authorBioModal').style.display = 'flex';
	updatePauseState(); // Pause game
}

function closeAuthorBio () {
	document.getElementById('authorBioModal').style.display = 'none';
	updatePauseState(); // Unpause game
}

// Modified: Initialize and display the new slideshow-style intro modal
function showIntroModal () {
	const introModal = document.getElementById('introModal');
	if (introModal) {
		currentIntroSlide = 0; // Reset to first slide
		updateIntroSlide();    // Populate slide content
		introModal.style.display = 'flex';
		updatePauseState(); // Pause game
	}
}

// Modified: Function to update the intro modal content based on current slide from JSON object
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
	
	// Toggle Previous button visibility
	if (currentIntroSlide === 0) {
		prevBtn.style.visibility = 'hidden';
	} else {
		prevBtn.style.visibility = 'visible';
	}
	
	// Change Next button text on the last slide
	if (currentIntroSlide === slideKeys.length - 1) {
		nextBtn.textContent = 'Start Journey';
		nextBtn.classList.add('btn-active'); // Highlight the start button
	} else {
		nextBtn.textContent = 'Next';
		nextBtn.classList.remove('btn-active');
	}
}

// Added: Function to go to the previous intro slide
function prevIntroSlide () {
	if (currentIntroSlide > 0) {
		currentIntroSlide--;
		updateIntroSlide();
	}
}

// Modified: Function to go to the next intro slide or close if at the end
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
	updatePauseState(); // Unpause game
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
	updatePauseState(); // Pause game
	
	// Modified: Load first page text from the new booksFirstPageBaseData object
	const firstPageText = (booksFirstPageBaseData && booksFirstPageBaseData[bookId]) ? booksFirstPageBaseData[bookId] : 'Chapter 1\n\nThe beginning of a new journey...';
	startTypingEffect(firstPageText, 'bookModalFirstPage');
}

function closeBookModal () {
	if (typingTimeout) clearTimeout(typingTimeout);
	const modal = document.getElementById('bookModal');
	if (modal) modal.style.display = 'none';
	updatePauseState(); // Unpause game
}

// --- Added: New Modal Functions for Rebirth ---

function showRebirthOneModal() {
	const modal = document.getElementById('rebirthOneModal');
	if (modal) modal.style.display = 'flex';
	updatePauseState();
}

function closeRebirthOneModal() {
	const modal = document.getElementById('rebirthOneModal');
	if (modal) modal.style.display = 'none';
	updatePauseState();
}

function showRebirthTwoModal() {
	const modal = document.getElementById('rebirthTwoModal');
	if (modal) {
		document.getElementById('fameGainDisplayModal').textContent = getFameGain().toFixed(1);
		modal.style.display = 'flex';
	}
	updatePauseState();
}

function closeRebirthTwoModal() {
	const modal = document.getElementById('rebirthTwoModal');
	if (modal) modal.style.display = 'none';
	updatePauseState();
}

function showRetirementModal() {
	const modal = document.getElementById('retirementModal');
	const age = daysToYears(gameData.days);
	
	// Dynamically show available rebirth options based on age
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

function closeRetirementModal() {
	const modal = document.getElementById('retirementModal');
	if (modal) modal.style.display = 'none';
	updatePauseState();
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
		
		let delay = Math.random() * 40 + 20; // 20-60ms typing speed
		
		if (isCorrecting) {
			currentHTML = currentHTML.slice(0, -1);
			isCorrecting = false;
			delay = 100; // Pause after deleting
		} else {
			const char = fullText[currentIndex];
			
			if (/[a-zA-Z]/.test(char) && Math.random() < 0.02) {
				currentHTML += getRandomChar();
				isCorrecting = true;
				delay = 150; // Pause before realizing the mistake
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

// Global click listener to close modals when clicking outside
window.addEventListener('click', function (event) {
	const infoModal = document.getElementById('infoModal');
	if (infoModal && infoModal.style.display === 'flex' && event.target === infoModal) {
		closeInfoModal();
	}
	
	const bookModal = document.getElementById('bookModal');
	if (bookModal && bookModal.style.display === 'flex' && event.target === bookModal) {
		closeBookModal();
	}
	
	const authorBioModal = document.getElementById('authorBioModal');
	if (authorBioModal && authorBioModal.style.display === 'flex' && event.target === authorBioModal) {
		closeAuthorBio();
	}
	
	const tutorialModal = document.getElementById('tutorialModal');
	if (tutorialModal && tutorialModal.style.display === 'flex' && event.target === tutorialModal) {
		closeTutorialModal();
	}
	
	// Added: Event listeners for new closable modals
	const rebirthOneModal = document.getElementById('rebirthOneModal');
	if (rebirthOneModal && rebirthOneModal.style.display === 'flex' && event.target === rebirthOneModal) {
		closeRebirthOneModal();
	}
	
	const rebirthTwoModal = document.getElementById('rebirthTwoModal');
	if (rebirthTwoModal && rebirthTwoModal.style.display === 'flex' && event.target === rebirthTwoModal) {
		closeRebirthTwoModal();
	}
});
