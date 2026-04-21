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
			const previouslyCompleted = requirements ? requirements.completed : true;
			
			if (!requirements || requirements.isCompleted()) {
				if (element.classList.contains('hiddenTask')) {
					element.classList.remove('hiddenTask');
					if (requirements && !previouslyCompleted && isInitialized) {
						const imgEl = element.querySelector('.card-image, .row-image');
						if (imgEl) queueInfoModal(imgEl, true);
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
	const bookSelectionContainer = document.getElementById('bookSelectionContainer');
	const bookStatusRow = document.getElementById('bookStatusRow');
	const manualWritingContainer = document.getElementById('manualWritingContainer');
	const lifeExpSection = document.getElementById('lifeExperiencesSection');
	
	if (gameData.currentBook && booksBaseData && booksBaseData[gameData.currentBook]) {
		if (bookSelectionContainer) bookSelectionContainer.style.display = 'none';
		if (bookStatusRow) bookStatusRow.style.display = 'flex';
		if (manualWritingContainer) manualWritingContainer.style.display = 'flex';
		if (lifeExpSection) lifeExpSection.style.display = 'none';
		
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
		if (lifeExpSection) lifeExpSection.style.display = 'block';
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

function updateBand (bandClass, newHTML) {
	const bandContent = document.querySelector(`.${bandClass} .info-band-content`);
	const band = bandContent.parentElement;
	
	const fullHTML = `<span class="marquee-item">${newHTML}</span><span class="marquee-item">${newHTML}</span>`;
	
	if (bandContent.innerHTML !== fullHTML) {
		bandContent.innerHTML = fullHTML;
		
		setTimeout(() => {
			const item = bandContent.querySelector('.marquee-item');
			if (item && item.offsetWidth > band.offsetWidth) {
				band.classList.add('scrolling');
			} else {
				band.classList.remove('scrolling');
			}
		}, 50);
	}
}

function updateHeaderVal (className, newText) {
	const elements = document.querySelectorAll('.' + className);
	elements.forEach(el => {
		if (el.textContent !== String(newText)) {
			el.textContent = newText;
		}
	});
}

function checkBandScrolling (bandClass) {
	const band = document.querySelector(`.${bandClass}`);
	if (!band) return;
	
	const item = band.querySelector('.marquee-item');
	if (item && item.offsetWidth > band.offsetWidth) {
		if (!band.classList.contains('scrolling')) {
			band.classList.add('scrolling');
		}
	} else {
		if (band.classList.contains('scrolling')) {
			band.classList.remove('scrolling');
		}
	}
}

function updateHeaderUI () {
	// Author Image
	if (gameData.currentAuthor && authorsBaseData && authorsBaseData[gameData.currentAuthor]) {
		const author = authorsBaseData[gameData.currentAuthor];
		const authorImg = document.getElementById('authorImage');
		const filefolder = author.filefolder + '256';
		const filename = getAuthorImageFilename(author);
		const imgSrc = `img/${filefolder}/${filename}`;
		if (authorImg && !authorImg.src.includes(imgSrc)) {
			authorImg.src = imgSrc;
		}
	}
	
	// Band 1: Author Info
	const authorName = (gameData.currentAuthor && authorsBaseData && authorsBaseData[gameData.currentAuthor]) ? authorsBaseData[gameData.currentAuthor].name : '...';
	const ageStr = `${daysToYears(gameData.days)}.${String(getDay()).padStart(3, '0')}`;
	
	updateHeaderVal('header-val-author', authorName);
	updateHeaderVal('header-val-age', ageStr);
	
	// Band 2: Task Info
	const job = gameData.currentJob;
	const skill = gameData.currentSkill;
	const property = gameData.currentProperty;
	
	updateHeaderVal('header-val-job', job ? `${job.name} (Lvl ${job.level}, $${format(job.getIncome())}/d)` : 'None');
	updateHeaderVal('header-val-skill', skill ? `${skill.name} (Lvl ${skill.level})` : 'None');
	updateHeaderVal('header-val-property', property ? property.name : 'None');
	
	// Band 3: Core Stats
	updateHeaderVal('header-val-balance', `$${format(gameData.coins)}`);
	
	const dailyNet = getIncome() - getExpense();
	const netFormatted = (dailyNet >= 0 ? '+' : '-') + '$' + format(Math.abs(dailyNet)) + '/d';
	const netColor = dailyNet >= 0 ? '#4CAF50' : '#f44336';
	
	const netElements = document.querySelectorAll('.header-val-net');
	netElements.forEach(el => {
		const newText = `(${netFormatted})`;
		if (el.textContent !== newText) {
			el.textContent = newText;
		}
		if (el.style.color !== netColor) {
			el.style.color = netColor;
		}
	});
	
	updateHeaderVal('header-val-income', `$${format(getIncome() * (365 / 12))}/mo`);
	updateHeaderVal('header-val-expense', `$${format(getExpense() * (365 / 12))}/mo`);
	updateHeaderVal('header-val-inspiration', `${getInspiration().toFixed(1)}x`);
	updateHeaderVal('header-val-badges', gameData.earnedBadges ? gameData.earnedBadges.length : 0);
	updateHeaderVal('header-val-books', gameData.booksPublished);
	updateHeaderVal('header-val-progress', gameData.currentBook ? `${((gameData.wordsWritten / getBookLength()) * 100).toFixed(1)}%` : 'Idle');
	
	// Modified: Calculate exact multiplier without Math.round from applyMultipliers
	let jobRawMulti = 1;
	if (gameData.currentJob && gameData.currentJob.xpMultipliers) {
		gameData.currentJob.xpMultipliers.forEach(fn => jobRawMulti *= fn());
	}
	const workMulti = gameData.currentJob ? (jobRawMulti * gameData.workMultiplier * gameData.workXpMultiplier) : 1;
	updateHeaderVal('header-val-work-multi', workMulti.toFixed(2));
	
	// Modified: Calculate exact multiplier without Math.round from applyMultipliers
	let skillRawMulti = 1;
	if (gameData.currentSkill && gameData.currentSkill.xpMultipliers) {
		gameData.currentSkill.xpMultipliers.forEach(fn => skillRawMulti *= fn());
	}
	const skillMulti = gameData.currentSkill ? (skillRawMulti * gameData.skillMultiplier * gameData.skillXpMultiplier) : 1;
	updateHeaderVal('header-val-skill-multi', skillMulti.toFixed(2));
	
	const qualityMulti = typeof getWritingQualityMultiplier === 'function' ? getWritingQualityMultiplier() : 1;
	updateHeaderVal('header-val-quality-multi', qualityMulti.toFixed(2));
	
	// Band 4: Logs
	const lastLogs = gameData.logHistory.slice(0, 2).map(log => log.replace(/<[^>]*>?/gm, '')).join(' \u00A0 | \u00A0 ');
	updateHeaderVal('header-val-logs', lastLogs);
	
	['band-1', 'band-2', 'band-3', 'band-4'].forEach(checkBandScrolling);
}

function updateText () {
	const updateIfChanged = (id, newText) => {
		const el = document.getElementById(id);
		if (el && el.textContent !== String(newText)) {
			el.textContent = newText;
		}
	};
	
	updateIfChanged('timeWarpingDisplay', gameData.taskData['Flow State'].getEffect().toFixed(2));
	updateIfChanged('timeWarpingButton', gameData.timeWarpingEnabled ? 'Disable flow' : 'Enable flow');
	
	const writingSpeed = getWritingSpeed();
	
	updateIfChanged('writingSpeedDisplayTab', format(writingSpeed));
	
	updateIfChanged('bookQualityDisplayTab', getCurvedQuality(getBookQuality()).toFixed(2));
	updateIfChanged('expectedQualityDisplay', getCurvedQuality(getBookQuality()).toFixed(2));
	
	const writingTimeAlert = document.getElementById('writingTimeAlert');
	if (writingTimeAlert) {
		if (gameData.workWritingBalance === 0) {
			writingTimeAlert.style.display = 'block';
		} else {
			writingTimeAlert.style.display = 'none';
		}
	}
	
	const lifeExp = getLifeExperiences();
	
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

function updateCompositionUI () {
	if (!gameData.currentBookComposition) return;
	
	let totalWords = 0;
	for (const key in gameData.currentBookComposition) {
		totalWords += gameData.currentBookComposition[key];
	}
	
	const sceneBtns = document.querySelectorAll('.scene-btn');
	sceneBtns.forEach(btn => {
		const sceneType = btn.dataset.scene;
		let pct = 0;
		
		if (totalWords > 0) {
			const words = gameData.currentBookComposition[sceneType] || 0;
			pct = words / totalWords;
		}
		
		const currentPctVar = btn.style.getPropertyValue('--pct');
		pct = parseFloat(pct.toFixed(2));
		if (currentPctVar !== String(pct)) {
			btn.style.setProperty('--pct', pct);
		}
		
		const isActive = (sceneType === currentAutoSceneType);
		if (isActive) {
			if (!btn.classList.contains('scene-btn-active')) {
				btn.classList.add('scene-btn-active');
				btn.classList.remove('btn-active');
			}
		} else {
			if (btn.classList.contains('scene-btn-active')) {
				btn.classList.remove('scene-btn-active');
			}
		}
	});
}

function updateTypewriter (deltaTime) {
	const isActivelyWriting = (gameData.currentBook !== null && getWritingSpeed() > 0);
	
	if (!isActivelyWriting && !isLiveCorrecting) {
		return;
	}
	
	if (nextSceneType !== currentTypingSceneType) {
		currentTypingSceneType = nextSceneType;
		typewriterIndex = currentTypewriterSentence.length;
		isLiveCorrecting = false;
		liveTypingDelay = 0;
	}
	
	liveTypingDelay -= deltaTime * 1000;
	
	while (liveTypingDelay <= 0) {
		if (isClearingLine) {
			typewriterText = '';
			isClearingLine = false;
			isWaitingToClearLine = false;
		}
		
		if (isLiveCorrecting) {
			typewriterText = typewriterText.slice(0, -1);
			isLiveCorrecting = false;
			liveTypingDelay += 35;
		} else {
			if (typewriterIndex >= currentTypewriterSentence.length) {
				typewriterText = '';
				typewriterIndex = 0;
				isWaitingToClearLine = false;
				isClearingLine = false;
				
				const sceneToUse = nextSceneType || 'Action';
				let currentGenre = 'Romance';
				if (gameData.currentBook && booksBaseData && booksBaseData[gameData.currentBook]) {
					currentGenre = booksBaseData[gameData.currentBook].genre;
				} else if (gameData.selectedGenre) {
					currentGenre = gameData.selectedGenre;
				}
				
				const sentences = (sceneTypesBaseData && sceneTypesBaseData[currentGenre]) ? sceneTypesBaseData[currentGenre][sceneToUse] : null;
				
				if (sentences && sentences.length > 0) {
					currentTypewriterSentence = sentences[Math.floor(Math.random() * sentences.length)] + ' ';
				} else {
					currentTypewriterSentence = 'Writing... ';
				}
			}
			
			const char = currentTypewriterSentence[typewriterIndex];
			
			if (/[a-zA-Z]/.test(char) && Math.random() < 0.03) {
				const chars = 'abcdefghijklmnopqrstuvwxyz';
				typewriterText += chars.charAt(Math.floor(Math.random() * chars.length));
				isLiveCorrecting = true;
				liveTypingDelay += 80;
			} else {
				typewriterText += char;
				typewriterIndex++;
				liveTypingDelay += Math.random() * 16 + 32;
				
				if (isWaitingToClearLine && (char === ' ' || char === '-')) {
					isClearingLine = true;
					liveTypingDelay += 250;
					isWaitingToClearLine = false;
				}
			}
		}
		
		if (liveTypingDelay <= 0 && liveTypingDelay > -1) {
			liveTypingDelay = 1;
		}
	}
	
	const displayEl = document.getElementById('liveWritingText');
	if (displayEl) {
		displayEl.innerHTML = '<span id="liveWritingTextInner">' + typewriterText + '</span><span class="blinking-cursor">|</span>';
		displayEl.scrollLeft = displayEl.scrollWidth;
		
		const innerSpan = document.getElementById('liveWritingTextInner');
		if (innerSpan && innerSpan.offsetWidth > displayEl.clientWidth * 0.75 && !isClearingLine) {
			isWaitingToClearLine = true;
		}
	}
}

function updateUI () {
	updateHeaderUI();
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
}
