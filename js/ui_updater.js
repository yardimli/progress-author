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

function updateAuthorAndBookUI () {
	if (gameData.currentAuthor && authorsBaseData && authorsBaseData[gameData.currentAuthor]) {
		const author = authorsBaseData[gameData.currentAuthor];
		const authorImg = document.getElementById('authorImage');
		const authorName = document.getElementById('authorNameDisplay');
		
		const filefolder = author.filefolder + '256';
		const filename = author.filename.replace('.png', '.jpg');
		const imgSrc = `img/${filefolder}/${filename}`;
		
		if (authorImg && authorImg.src !== imgSrc && !authorImg.src.includes(imgSrc)) {
			authorImg.src = imgSrc;
		}
		if (authorName && authorName.textContent !== author.name) {
			authorName.textContent = author.name;
		}
	}
	
	const bookSelectionContainer = document.getElementById('bookSelectionContainer');
	const bookStatusRow = document.getElementById('bookStatusRow');
	const manualWritingContainer = document.getElementById('manualWritingContainer');
	
	if (gameData.currentBook && booksBaseData && booksBaseData[gameData.currentBook]) {
		if (bookSelectionContainer) bookSelectionContainer.style.display = 'none';
		if (bookStatusRow) bookStatusRow.style.display = 'flex';
		if (manualWritingContainer) manualWritingContainer.style.display = 'flex';
		
		const book = booksBaseData[gameData.currentBook];
		const bookImg = document.getElementById('currentBookImage');
		const bookTitle = document.getElementById('currentBookTitle');
		
		const filefolder = book.filefolder + '256';
		const filename = book.filename.replace('.png', '.jpg');
		const imgSrc = `img/${filefolder}/${filename}`;
		
		if (bookImg && bookImg.src !== imgSrc && !bookImg.src.includes(imgSrc)) {
			bookImg.src = imgSrc;
		}
		if (bookTitle && bookTitle.textContent !== book.title) {
			bookTitle.textContent = book.title;
		}
	} else {
		if (bookSelectionContainer) bookSelectionContainer.style.display = 'flex';
		if (bookStatusRow) bookStatusRow.style.display = 'none';
		if (manualWritingContainer) manualWritingContainer.style.display = 'none';
	}
}

function updateTabButtons () {
	const updateImg = (imgId, entity) => {
		const imgEl = document.getElementById(imgId);
		if (!imgEl) return;
		if (entity && entity.baseData) {
			const src = `img/${entity.baseData.filefolder}256/${entity.baseData.filename.replace('.png', '.jpg')}`;
			if (imgEl.src !== src && !imgEl.src.includes(src)) {
				imgEl.src = src;
				imgEl.style.display = 'inline-block';
			}
		} else {
			if (imgEl.style.display !== 'none') imgEl.style.display = 'none';
		}
	};
	
	updateImg('jobTabImg', gameData.currentJob);
	const jobTabText = document.getElementById('jobTabText');
	if (jobTabText) {
		const jobIncomeText = `+$${format(getIncome(), 0)}/day`;
		if (jobTabText.textContent !== jobIncomeText) jobTabText.textContent = jobIncomeText;
	}
	
	updateImg('skillTabImg', gameData.currentSkill);
	const skillTabText = document.getElementById('skillTabText');
	if (skillTabText) {
		const skillLvlText = gameData.currentSkill ? `Lvl ${gameData.currentSkill.level}` : '';
		if (skillTabText.textContent !== skillLvlText) skillTabText.textContent = skillLvlText;
	}
	
	const writingImgEl = document.getElementById('writingTabImg');
	if (writingImgEl) {
		if (gameData.currentBook && booksBaseData && booksBaseData[gameData.currentBook]) {
			const book = booksBaseData[gameData.currentBook];
			const src = `img/${book.filefolder}256/${book.filename.replace('.png', '.jpg')}`;
			if (writingImgEl.src !== src && !writingImgEl.src.includes(src)) {
				writingImgEl.src = src;
				writingImgEl.style.display = 'inline-block';
			}
		} else {
			if (writingImgEl.style.display !== 'none') writingImgEl.style.display = 'none';
		}
	}
	
	updateImg('shopTabImg', gameData.currentProperty);
	const shopTabText = document.getElementById('shopTabText');
	if (shopTabText) {
		const shopExpenseText = `-$${format(getExpense(), 0)}/day`;
		if (shopTabText.textContent !== shopExpenseText) shopTabText.textContent = shopExpenseText;
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
	
	updateIfChanged('wordsWrittenDisplay', format(gameData.wordsWritten));
	updateIfChanged('bookLengthDisplay', format(getBookLength(), 0));
	
	const writingSpeed = getWritingSpeed();
	updateIfChanged('writingSpeedDisplayTab', format(writingSpeed));
	updateIfChanged('bookQualityDisplayTab', getBookQuality().toFixed(2));
	
	// Display expected quality in the selection screen
	updateIfChanged('expectedQualityDisplay', getBookQuality().toFixed(2));
	
	// Display warning if writing speed is 0
	const speedWarning = document.getElementById('writingSpeedWarning');
	if (speedWarning) {
		if (writingSpeed <= 0) {
			speedWarning.style.display = 'block';
		} else {
			speedWarning.style.display = 'none';
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
	
	const compMultiplier = getCompositionMultiplier();
	const compMultiplierDisplay = document.getElementById('compMultiplierDisplay');
	if (compMultiplierDisplay) {
		if (compMultiplier !== 1) {
			compMultiplierDisplay.textContent = ` (x${compMultiplier.toFixed(2)} Comp)`;
			compMultiplierDisplay.style.color = compMultiplier > 1 ? '#4CAF50' : '#ff4c4c';
		} else {
			compMultiplierDisplay.textContent = '';
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
function updateCompositionUI() {
	const container = document.getElementById('compositionStats');
	if (!container || !gameData.currentBookComposition) return;
	
	let totalWords = 0;
	for (let key in gameData.currentBookComposition) {
		totalWords += gameData.currentBookComposition[key];
	}
	
	let html = '';
	if (totalWords === 0) {
		html = '<i>Start writing to see composition...</i>';
	} else {
		html = '<div style="display: flex; flex-wrap: wrap; gap: 10px; font-size: 0.85em;">';
		for (let sceneType in gameData.currentBookComposition) {
			let words = gameData.currentBookComposition[sceneType];
			let pct = (words / totalWords * 100).toFixed(1);
			html += `<div style="background: rgba(0,0,0,0.05); padding: 5px 10px; border-radius: 4px;"><b>${sceneType}:</b> ${pct}%</div>`;
		}
		html += '</div>';
	}
	
	// Only update the DOM if the generated HTML is different from the current innerHTML
	if (container.innerHTML !== html) {
		container.innerHTML = html;
	}
}

// Handles the realistic typewriter effect for the manual writing interface
function updateTypewriter(deltaTime) {
	// Check if actively writing (holding button or within 1-second click window)
	let isActivelyWriting = (isHoldingSceneButton || clickTypingTimer > 0);
	
	// Instantly stop outputting if not actively writing (unless finishing a typo correction)
	if (!isActivelyWriting && !isLiveCorrecting) {
		return;
	}
	
	liveTypingDelay -= deltaTime * 1000;
	if (liveTypingDelay > 0) return;
	
	if (isLiveCorrecting) {
		typewriterText = typewriterText.slice(0, -1);
		isLiveCorrecting = false;
		liveTypingDelay = 35; // Pause after deleting
	} else {
		// If the sentence is finished, clear the line and start over
		if (typewriterIndex >= currentTypewriterSentence.length) {
			typewriterText = ""; // Clear the line
			typewriterIndex = 0;
			
			// Fetch new sentence using the queued scene type (allows finishing last sentence before switching)
			let sceneToUse = nextSceneType || "Action";
			let sentences = sceneTypesBaseData ? sceneTypesBaseData[sceneToUse] : null;
			if (sentences && sentences.length > 0) {
				currentTypewriterSentence = sentences[Math.floor(Math.random() * sentences.length)] + " ";
			} else {
				currentTypewriterSentence = "Writing... ";
			}
		}
		
		let char = currentTypewriterSentence[typewriterIndex];
		
		if (/[a-zA-Z]/.test(char) && Math.random() < 0.03) { // 3% chance for typo
			const chars = 'abcdefghijklmnopqrstuvwxyz';
			typewriterText += chars.charAt(Math.floor(Math.random() * chars.length));
			isLiveCorrecting = true;
			liveTypingDelay = 60; // Pause before realizing mistake
		} else {
			typewriterText += char;
			typewriterIndex++;
			// Delay between 167ms and 500ms (averages 40-80 chars per second)
			liveTypingDelay = Math.random() * 8 + 16;
		}
	}
	
	const displayEl = document.getElementById('liveWritingText');
	if (displayEl) {
		displayEl.innerHTML = typewriterText + '<span class="blinking-cursor">|</span>';
		displayEl.scrollLeft = displayEl.scrollWidth; // Keep cursor in view if it overflows
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
	updateTabButtons();
	updateBookHistory();
	updatePotionsUI();
	updateCompositionUI();
}
