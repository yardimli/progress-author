// js/ui_updater.js:

// Dynamic UI updates for the game loop

function updateRequiredRows (data, categoryType) {
	for (const categoryName in categoryType) {
		const category = categoryType[categoryName];
		let nextEntityFound = false;
		
		const lockedPlaceholder = document.getElementById('locked-' + categoryName.replace(/\s+/g, '-'));
		let categoryReqText = '';
		
		for (let i = 0; i < category.length; i++) {
			const entityName = category[i];
			const element = document.getElementById('row ' + entityName);
			if (!element) continue;
			
			const requirements = gameData.requirements[entityName];
			const previouslyCompleted = requirements ? requirements.completed : true; // Track previous state
			
			if (!requirements || requirements.isCompleted()) {
				if (element.classList.contains('hiddenTask')) {
					element.classList.remove('hiddenTask');
					// Queue info modal if newly unlocked
					if (requirements && !previouslyCompleted && isInitialized) {
						const imgEl = element.querySelector('.card-image, .row-image');
						if (imgEl) queueInfoModal(imgEl, true); // Added true flag for new unlocks
					}
				}
			} else {
				if (!element.classList.contains('hiddenTask')) element.classList.add('hiddenTask');
				
				if (!nextEntityFound) {
					let finalText = '';
					
					if (requirements instanceof FameRequirement) {
						finalText += format(requirements.requirements[0].requirement) + ' fame';
					} else if (requirements instanceof CoinRequirement) {
						finalText += '$' + format(requirements.requirements[0].requirement, 0);
					} else if (requirements instanceof TaskRequirement) {
						const reqStrings = [];
						for (const req of requirements.requirements) {
							const task = gameData.taskData[req.task];
							reqStrings.push(req.task + ' LVL ' + format(task.level, 0) + ' / ' + format(req.requirement, 0));
						}
						finalText += reqStrings.join('<br>');
					} else if (requirements instanceof AgeRequirement) {
						finalText += 'Age ' + format(requirements.requirements[0].requirement, 0);
					}
					
					categoryReqText = finalText;
					nextEntityFound = true;
				}
			}
		}
		
		if (lockedPlaceholder) {
			if (categoryReqText !== '') {
				if (lockedPlaceholder.classList.contains('hiddenTask')) lockedPlaceholder.classList.remove('hiddenTask');
				const textEl = lockedPlaceholder.querySelector('.locked-text');
				if (textEl.innerHTML !== categoryReqText) textEl.innerHTML = categoryReqText;
			} else {
				if (!lockedPlaceholder.classList.contains('hiddenTask')) lockedPlaceholder.classList.add('hiddenTask');
			}
		}
	}
}

function updateTaskRows () {
	for (const key in gameData.taskData) {
		const task = gameData.taskData[key];
		const row = document.getElementById('row ' + task.name);
		if (!row) continue;
		
		const levelElement = row.querySelector('.level');
		if (levelElement) {
			const newLevelText = 'LVL. ' + task.level;
			if (levelElement.textContent !== newLevelText) {
				levelElement.textContent = newLevelText;
			}
		}
		
		const progressFill = row.querySelector('.progressFill');
		if (progressFill) {
			const newWidth = (task.xp / task.getMaxXp() * 100) + '%';
			if (progressFill.style.width !== newWidth) {
				progressFill.style.width = newWidth;
			}
		}
		
		const isActive = (task === gameData.currentJob || task === gameData.currentSkill);
		if (isActive && !row.classList.contains('active')) {
			row.classList.add('active');
		} else if (!isActive && row.classList.contains('active')) {
			row.classList.remove('active');
		}
		
		if (task instanceof Job) {
			const incomeElement = row.querySelector('.income');
			if (incomeElement) {
				const newIncomeHTML = `<span class="color-income-val">● ${format(task.getIncome())}</span> <span class="color-income-lbl">/ day</span>`;
				if (incomeElement.innerHTML !== newIncomeHTML) {
					incomeElement.innerHTML = newIncomeHTML;
				}
			}
		} else {
			const effectElement = row.querySelector('.effect');
			if (effectElement) {
				const newEffectText = task.getEffectDescription();
				if (effectElement.textContent !== newEffectText) {
					effectElement.textContent = newEffectText;
				}
			}
		}
	}
}

function updateItemRows () {
	for (const key in gameData.itemData) {
		const item = gameData.itemData[key];
		const row = document.getElementById('row ' + item.name);
		if (!row) continue;
		
		const isActive = (gameData.currentProperty === item || gameData.currentMisc.includes(item));
		if (isActive && !row.classList.contains('active')) {
			row.classList.add('active');
		} else if (!isActive && row.classList.contains('active')) {
			row.classList.remove('active');
		}
		
		const effectElement = row.querySelector('.effect');
		if (effectElement) {
			const newEffectText = item.getEffectDescription();
			if (effectElement.textContent !== newEffectText) {
				effectElement.textContent = newEffectText;
			}
		}
		
		const expenseElement = row.querySelector('.expense');
		if (expenseElement) {
			const newExpenseHTML = `<span class="color-expense-val">● -${format(item.getExpense())}</span> <span class="color-expense-lbl">/ day</span>`;
			if (expenseElement.innerHTML !== newExpenseHTML) {
				expenseElement.innerHTML = newExpenseHTML;
			}
		}
	}
}

// Added: New helper function to get the author's image based on their age.
/**
 * Gets the correct author image filename based on the author's current age.
 * The image changes at the start of each decade (30, 40, 50, 60).
 * @param {object} authorData - The base data for the current author.
 * @returns {string} The filename for the aged portrait (e.g., 'arthur_pendelton_40.jpg').
 */
function getAuthorImageFilename (authorData) {
	const age = daysToYears(gameData.days);
	const baseFilename = authorData.filename.replace('.png', '');
	
	let ageSuffix = '';
	if (age >= 60) {
		ageSuffix = '_60';
	} else if (age >= 50) {
		ageSuffix = '_50';
	} else if (age >= 40) {
		ageSuffix = '_40';
	} else if (age >= 30) {
		ageSuffix = '_30';
	}
	
	return `${baseFilename}${ageSuffix}.jpg`;
}

function updateAuthorAndBookUI () {
	if (gameData.currentAuthor && authorsBaseData && authorsBaseData[gameData.currentAuthor]) {
		const author = authorsBaseData[gameData.currentAuthor];
		const authorImg = document.getElementById('authorImage');
		const authorName = document.getElementById('authorNameDisplay');
		
		const filefolder = author.filefolder + '256';
		// Modified: Use helper function to get age-appropriate filename
		const filename = getAuthorImageFilename(author);
		const imgSrc = `img/${filefolder}/${filename}`;
		
		// Modified: Check if src needs updating to prevent unnecessary DOM changes
		if (authorImg && !authorImg.src.includes(imgSrc)) {
			authorImg.src = imgSrc;
		}
		if (authorName && authorName.textContent !== author.name) {
			authorName.textContent = author.name;
		}
	}
	
	const bookSelectionContainer = document.getElementById('bookSelectionContainer');
	const bookStatusRow = document.getElementById('bookStatusRow');
	const manualWritingContainer = document.getElementById('manualWritingContainer');
	const lifeExpSection = document.getElementById('lifeExperiencesSection');
	
	if (gameData.currentBook && booksBaseData && booksBaseData[gameData.currentBook]) {
		if (bookSelectionContainer) bookSelectionContainer.style.display = 'none';
		if (bookStatusRow) bookStatusRow.style.display = 'flex';
		if (manualWritingContainer) manualWritingContainer.style.display = 'flex';
		if (lifeExpSection) lifeExpSection.style.display = 'none'; // Hide when actively writing
		
		const book = booksBaseData[gameData.currentBook];
		const bookImg = document.getElementById('currentBookImage');
		const bookTitle = document.getElementById('currentBookTitle');
		const bookGenre = document.getElementById('currentBookGenre');
		
		const filefolder = book.filefolder + '256';
		const filename = book.filename.replace('.png', '.jpg');
		const imgSrc = `img/${filefolder}/${filename}`;
		
		if (bookImg && bookImg.src !== imgSrc && !bookImg.src.includes(imgSrc)) {
			bookImg.src = imgSrc;
		}
		if (bookTitle && bookTitle.textContent !== book.title) {
			bookTitle.textContent = book.title;
		}
		if (bookGenre && bookGenre.textContent !== book.genre) {
			bookGenre.textContent = book.genre;
		}
	} else {
		if (bookSelectionContainer) bookSelectionContainer.style.display = 'flex';
		if (bookStatusRow) bookStatusRow.style.display = 'none';
		if (manualWritingContainer) manualWritingContainer.style.display = 'none';
		if (lifeExpSection) lifeExpSection.style.display = 'block'; // Show when selecting genre
	}
}

function updateBookHistory () {
	const container = document.getElementById('bookHistoryContainer');
	if (!container) return;
	
	if (container.dataset.count == gameData.completedBooks.length) return;
	container.dataset.count = gameData.completedBooks.length;
	
	container.innerHTML = '';
	for (let i = gameData.completedBooks.length - 1; i >= 0; i--) {
		const bookRecord = gameData.completedBooks[i];
		const bookId = bookRecord.id;
		const bookData = booksBaseData[bookId];
		if (!bookData) continue;
		
		const age = bookRecord.age || '?';
		const day = String(bookRecord.day || 0).padStart(3, '0');
		const royalties = bookRecord.royalties || 0;
		const yearlyRoyalties = royalties * 365;
		
		const qualityText = bookRecord.quality ? ` | Quality: ${bookRecord.quality.toFixed(1)}%` : '';
		
		const div = document.createElement('div');
		div.className = 'ui-row';
		div.style.marginBottom = '10px';
		div.style.cursor = 'pointer';
		div.onclick = function () {
			showBookModal(bookId);
		};
		div.innerHTML = `
      <img src="img/${bookData.filefolder}256/${bookData.filename.replace('.png', '.jpg')}" class="row-image" style="width: 60px; height: 90px; object-fit: cover; border-radius: 4px;">
      <div class="row-info">
        <div class="row-title">${bookData.title}</div>
        <div class="row-value">Published: Age ${age}.${day} days${qualityText}</div>
      </div>
      <div class="row-expense" style="text-align: right;">
        <span style="color: #4CAF50; font-weight: bold;">+$${format(royalties)}/day</span><br>
        <span style="font-size: 0.85em; color: #888;">+$${format(yearlyRoyalties)}/yr</span>
      </div>
    `;
		container.appendChild(div);
	}
}

function updatePotionsUI () {
	const types = ['inspiration', 'acceleration'];
	types.forEach(type => {
		const actionContainer = document.getElementById(`action-${type}`);
		if (!actionContainer) return;
		
		const timeLeft = gameData.potions[type];
		if (timeLeft > 0) {
			const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
			const seconds = Math.floor(timeLeft % 60).toString().padStart(2, '0');
			const percentage = (timeLeft / 600) * 100;
			
			actionContainer.innerHTML = `
        <div class="progress-bar" style="width: 100%; height: 30px; background-color: #ddd; border-radius: 4px; position: relative; overflow: hidden;">
          <div style="height: 100%; background-color: #4CAF50; width: ${percentage}%;"></div>
          <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #000; font-weight: bold; text-shadow: 1px 1px 2px rgba(255,255,255,0.8); font-size: 14px;">${minutes}:${seconds}</div>
        </div>
      `;
		} else {
			if (!actionContainer.querySelector('button')) {
				actionContainer.innerHTML = `<button class="btn" onclick="drinkPotion('${type}')">Drink</button>`;
			}
		}
	});
}

// Added: Function to update badge UI based on earned status
function updateBadgesUI() {
	if (!badgeBaseData) return;
	for (const badgeId in badgeBaseData) {
		const isEarned = gameData.earnedBadges.includes(badgeId);
		const badge = badgeBaseData[badgeId];
		
		// Desktop
		const desktopIcon = document.getElementById(`badge-icon-desktop-${badgeId}`);
		if (desktopIcon) {
			if (isEarned) {
				if (desktopIcon.classList.contains('locked-badge')) {
					desktopIcon.classList.remove('locked-badge');
					desktopIcon.title = badge.name;
				}
			} else {
				if (!desktopIcon.classList.contains('locked-badge')) {
					desktopIcon.classList.add('locked-badge');
					desktopIcon.title = `${badge.name} (Locked)`;
				}
			}
		}
		
		// Mobile
		const mobileWrapper = document.getElementById(`badge-wrapper-mobile-${badgeId}`);
		if (mobileWrapper) {
			if (isEarned) {
				if (mobileWrapper.classList.contains('locked-badge')) {
					mobileWrapper.classList.remove('locked-badge');
				}
			} else {
				if (!mobileWrapper.classList.contains('locked-badge')) {
					mobileWrapper.classList.add('locked-badge');
				}
			}
		}
	}
}


function updateText () {
	const updateIfChanged = (id, newText) => {
		const el = document.getElementById(id);
		if (el && el.textContent !== String(newText)) {
			el.textContent = newText;
		}
	};
	
	updateIfChanged('ageDisplay', daysToYears(gameData.days));
	const dayStr = String(getDay()).padStart(3, '0');
	updateIfChanged('dayDisplay', dayStr);
	updateIfChanged('lifespanDisplay', daysToYears(getLifespan()));
	
	const updateMoneyIfChanged = (money, id) => {
		const el = document.getElementById(id);
		if (!el) return;
		const newHTML = `$${format(money)}`;
		if (el.innerHTML !== newHTML) {
			el.innerHTML = newHTML;
		}
	};
	
	updateMoneyIfChanged(gameData.coins, 'coinDisplay');
	setSignDisplay();
	updateMoneyIfChanged(getNet(), 'netDisplay');
	
	updateIfChanged('inspirationDisplay', getInspiration().toFixed(1));
	
	updateIfChanged('fameDisplay', format(gameData.fame));
	updateIfChanged('fameGainDisplay', format(getFameGain()));
	
	updateIfChanged('timeWarpingDisplay', gameData.taskData['Flow State'].getEffect().toFixed(2));
	updateIfChanged('timeWarpingButton', gameData.timeWarpingEnabled ? 'Disable flow' : 'Enable flow');
	
	const writingSpeed = getWritingSpeed();
	updateIfChanged('writingSpeedDisplayTab', format(writingSpeed));
	updateIfChanged('bookQualityDisplayTab', getBookQuality().toFixed(2));
	
	// Display expected quality in the selection screen
	updateIfChanged('expectedQualityDisplay', getBookQuality().toFixed(2));
	
	const speedOverlay = document.getElementById('writingSpeedOverlay');
	if (speedOverlay) {
		if (writingSpeed <= 0 && gameData.unlocks.writing) {
			speedOverlay.style.display = 'flex';
		} else {
			speedOverlay.style.display = 'none';
		}
	}
	
	const lifeExp = getLifeExperiences();
	
	// Dynamically update Life Experiences text using JSON data
	if (typeof lifeExperiencesBaseData !== 'undefined') {
		for (const key in lifeExperiencesBaseData) {
			const expName = lifeExperiencesBaseData[key].name;
			const expValue = lifeExp[key.toLowerCase()] || 0;
			updateIfChanged(`exp${expName}Display`, format(expValue, 1));
		}
	}
	
	const qualityMultiplier = getQualityMultiplier();
	const multiplierDisplay = document.getElementById('bookQualityMultiplierDisplay');
	if (multiplierDisplay) {
		if (qualityMultiplier > 1) {
			multiplierDisplay.textContent = ` (x${qualityMultiplier.toFixed(2)})`;
			multiplierDisplay.style.color = '#4CAF50';
		} else {
			multiplierDisplay.textContent = '';
		}
	}
	
	// Modified: Only update the composition multiplier display if the text or color actually changed
	const compMultiplier = getCompositionMultiplier();
	const compMultiplierDisplay = document.getElementById('compMultiplierDisplay');
	if (compMultiplierDisplay) {
		let newText = '';
		let newColor = '';
		
		if (compMultiplier !== 1) {
			newText = ` (x${compMultiplier.toFixed(2)} Comp)`;
			newColor = compMultiplier > 1 ? '#4CAF50' : '#ff4c4c';
		}
		
		if (compMultiplierDisplay.textContent !== newText) {
			compMultiplierDisplay.textContent = newText;
		}
		if (compMultiplierDisplay.style.color !== newColor) {
			compMultiplierDisplay.style.color = newColor;
		}
	}
	
	updateIfChanged('workPercentage', 100 - gameData.workWritingBalance);
	updateIfChanged('writingPercentage', gameData.workWritingBalance);
	const slider = document.getElementById('workWritingSlider');
	if (slider && slider.value !== String(gameData.workWritingBalance)) {
		slider.value = gameData.workWritingBalance;
	}
	
	const writingProgress = Math.min(100, (gameData.wordsWritten / getBookLength()) * 100);
	const writingProgressBar = document.getElementById('writingProgressBar');
	if (writingProgressBar && writingProgressBar.style.width !== writingProgress + '%') {
		writingProgressBar.style.width = writingProgress + '%';
	}
	updateIfChanged('writingProgressDisplay', writingProgress.toFixed(1) + '%');
	
	// Update game version display in settings
	const versionDisplay = document.getElementById('gameVersionDisplay');
	if (versionDisplay && versionDisplay.textContent !== 'v' + GAME_VERSION) {
		versionDisplay.textContent = 'v' + GAME_VERSION;
	}
}

function setSignDisplay () {
	const signDisplay = document.getElementById('signDisplay');
	if (!signDisplay) return;
	const income = getIncome();
	const expense = getExpense();
	
	let newText = '';
	let newColor = 'gray';
	
	if (income > expense) {
		newText = '+';
		newColor = '#4CAF50';
	} else if (expense > income) {
		newText = '-';
		newColor = '#f44336';
	}
	
	if (signDisplay.textContent !== newText) {
		signDisplay.textContent = newText;
		signDisplay.style.color = newColor;
	}
}

function hideEntities () {
	for (const key in gameData.requirements) {
		const requirement = gameData.requirements[key];
		const completed = requirement.isCompleted();
		for (const element of requirement.elements) {
			if (element.id && element.id.startsWith('row ')) {
				continue;
			}
			
			if (completed) {
				if (element.classList.contains('hidden')) {
					element.classList.remove('hidden');
				}
			} else {
				if (!element.classList.contains('hidden')) {
					element.classList.add('hidden');
				}
			}
		}
	}
}

// Updates the composition statistics UI
function updateCompositionUI () {
	if (!gameData.currentBookComposition) return;
	
	let totalWords = 0;
	for (const key in gameData.currentBookComposition) {
		totalWords += gameData.currentBookComposition[key];
	}
	
	// Target the buttons directly to update their background strength via CSS variables
	const sceneBtns = document.querySelectorAll('.scene-btn');
	sceneBtns.forEach(btn => {
		const sceneType = btn.dataset.scene;
		let pct = 0;
		
		if (totalWords > 0) {
			const words = gameData.currentBookComposition[sceneType] || 0;
			pct = words / totalWords;
		}
		
		// Modified: Only update the CSS variable if it changed
		const currentPctVar = btn.style.getPropertyValue('--pct');
		// Drop pct to 2 decimal places for comparison to avoid excessive updates from tiny float differences
		pct = parseFloat(pct.toFixed(2));
		if (currentPctVar !== String(pct)) {
			btn.style.setProperty('--pct', pct);
		}
		
		// Modified: Highlight active auto scene with border class instead of background class
		const isActive = (sceneType === currentAutoSceneType);
		if (isActive) {
			if (!btn.classList.contains('scene-btn-active')) {
				btn.classList.add('scene-btn-active');
				btn.classList.remove('btn-active'); // Ensure old background class is removed
			}
		} else {
			if (btn.classList.contains('scene-btn-active')) {
				btn.classList.remove('scene-btn-active');
			}
		}
	});
}

// Handles the realistic typewriter effect for the manual writing interface
function updateTypewriter (deltaTime) {
	// Actively writing as long as there is a book and writing speed > 0
	const isActivelyWriting = (gameData.currentBook !== null && getWritingSpeed() > 0);
	
	// Instantly stop outputting if not actively writing (unless finishing a typo correction)
	if (!isActivelyWriting && !isLiveCorrecting) {
		return;
	}
	
	// If the player changed the scene type, immediately clear and start a new sentence
	if (nextSceneType !== currentTypingSceneType) {
		currentTypingSceneType = nextSceneType;
		typewriterIndex = currentTypewriterSentence.length; // Force sentence end
		isLiveCorrecting = false; // Cancel any ongoing typo correction
		liveTypingDelay = 0; // Force immediate update
	}
	
	liveTypingDelay -= deltaTime * 1000;
	
	// Use a while loop to process multiple characters if deltaTime is large.
	// This prevents the typing speed from slowing down when frame rate is capped.
	while (liveTypingDelay <= 0) {
		// Clear the line if the 200ms delay has finished
		if (isClearingLine) {
			typewriterText = '';
			isClearingLine = false;
			isWaitingToClearLine = false; // Safety reset to ensure it doesn't trigger immediately again
		}
		
		if (isLiveCorrecting) {
			typewriterText = typewriterText.slice(0, -1);
			isLiveCorrecting = false;
			liveTypingDelay += 35; // Add to delay instead of overwriting
		} else {
			// If the sentence is finished, clear the line and start over
			if (typewriterIndex >= currentTypewriterSentence.length) {
				typewriterText = ''; // Clear the line
				typewriterIndex = 0;
				isWaitingToClearLine = false; // Reset line clear flag
				isClearingLine = false; // Reset pause flag
				
				// Fetch new sentence using the queued scene type and current genre
				const sceneToUse = nextSceneType || 'Action';
				let currentGenre = 'Romance';
				if (gameData.currentBook && booksBaseData && booksBaseData[gameData.currentBook]) {
					currentGenre = booksBaseData[gameData.currentBook].genre;
				} else if (gameData.selectedGenre) {
					currentGenre = gameData.selectedGenre;
				}
				
				// Access nested scene types by genre
				const sentences = (sceneTypesBaseData && sceneTypesBaseData[currentGenre]) ? sceneTypesBaseData[currentGenre][sceneToUse] : null;
				
				if (sentences && sentences.length > 0) {
					currentTypewriterSentence = sentences[Math.floor(Math.random() * sentences.length)] + ' ';
				} else {
					currentTypewriterSentence = 'Writing... ';
				}
			}
			
			const char = currentTypewriterSentence[typewriterIndex];
			
			if (/[a-zA-Z]/.test(char) && Math.random() < 0.03) { // 3% chance for typo
				const chars = 'abcdefghijklmnopqrstuvwxyz';
				typewriterText += chars.charAt(Math.floor(Math.random() * chars.length));
				isLiveCorrecting = true;
				liveTypingDelay += 80; // Add to delay
			} else {
				typewriterText += char;
				typewriterIndex++;
				liveTypingDelay += Math.random() * 16 + 32; // Add to delay
				
				// Check if we should clear the line because we finished a word and exceeded 75% width
				if (isWaitingToClearLine && (char === ' ' || char === '-')) {
					isClearingLine = true; // Set flag to clear on next tick
					liveTypingDelay += 250; // Add 200ms pause so the user can read the word
					isWaitingToClearLine = false; // Reset flag after catching the word boundary
				}
			}
		}
		
		// Safety break to prevent infinite loops if delay gets stuck
		if (liveTypingDelay <= 0 && liveTypingDelay > -1) {
			liveTypingDelay = 1;
		}
	}
	
	const displayEl = document.getElementById('liveWritingText');
	if (displayEl) {
		// Wrap the text in a span to accurately measure its width relative to the container
		displayEl.innerHTML = '<span id="liveWritingTextInner">' + typewriterText + '</span><span class="blinking-cursor">|</span>';
		displayEl.scrollLeft = displayEl.scrollWidth; // Keep cursor in view if it overflows
		
		// Check if the text width exceeds 75% of the container's visible width
		const innerSpan = document.getElementById('liveWritingTextInner');
		// Prevent triggering if we are already in the process of clearing the line
		if (innerSpan && innerSpan.offsetWidth > displayEl.clientWidth * 0.75 && !isClearingLine) {
			isWaitingToClearLine = true;
		}
	}
}

// Main UI Update loop
function updateUI () {
	updateTaskRows();
	updateItemRows();
	updateRequiredRows(gameData.taskData, jobCategories);
	updateRequiredRows(gameData.taskData, skillCategories);
	updateRequiredRows(gameData.itemData, itemCategories);
	hideEntities();
	updateAuthorAndBookUI();
	updateText();
	updateBookHistory();
	updatePotionsUI();
	updateCompositionUI();
	updateBadgesUI(); // Added: Update badge display
}
