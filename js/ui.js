// DOM manipulation, table creation, updating text

let typingTimeout = null;

function setTab(element, selectedTab) {
	let tabs = Array.prototype.slice.call(document.getElementsByClassName("tab"));
	tabs.forEach(function(tab) {
		tab.style.display = "none";
	});
	document.getElementById(selectedTab).style.display = "block";
	
	let tabButtons = document.getElementsByClassName("tabButton");
	for (let tabButton of tabButtons) {
		tabButton.classList.remove("btn-active");
	}
	element.classList.add("btn-active");
}

// Update UI visibility based on unlocks
function applyUnlocksUI() {
	if (gameData.unlocks.shop) {
		document.getElementById("shopTabButton").classList.remove("hidden");
	} else {
		document.getElementById("shopTabButton").classList.add("hidden");
	}
	
	if (gameData.unlocks.skills) {
		document.getElementById("skillTabButton").classList.remove("hidden");
	} else {
		document.getElementById("skillTabButton").classList.add("hidden");
	}
	
	if (gameData.unlocks.writing) {
		document.getElementById("writingTabButton").classList.remove("hidden");
		document.getElementById("workWritingSliderContainer").classList.remove("hidden");
	} else {
		document.getElementById("writingTabButton").classList.add("hidden");
		document.getElementById("workWritingSliderContainer").classList.add("hidden");
	}
}

function updateWorkWritingBalance(value) {
	gameData.workWritingBalance = parseInt(value);
	document.getElementById("workPercentage").textContent = 100 - gameData.workWritingBalance;
	document.getElementById("writingPercentage").textContent = gameData.workWritingBalance;
	updateUI();
}

function createData(data, baseData) {
	for (let key in baseData) {
		let entity = baseData[key];
		createEntity(data, entity);
	}
}

function createEntity(data, entity) {
	if ("income" in entity) { data[entity.name] = new Job(entity); }
	else if ("maxXp" in entity) { data[entity.name] = new Skill(entity); }
	else { data[entity.name] = new Item(entity); }
	data[entity.name].id = "row " + entity.name;
}

function createAllRows(categoryType, containerId) {
	let container = document.getElementById(containerId);
	container.innerHTML = '';
	
	let isJob = categoryType === jobCategories;
	let isSkill = categoryType === skillCategories;
	let isItem = categoryType === itemCategories;
	
	let baseData = isJob ? jobBaseData : (isSkill ? skillBaseData : itemBaseData);
	
	for (let categoryName in categoryType) {
		let headerTemplate = document.getElementById("categoryHeaderTemplate");
		let headerClone = headerTemplate.content.cloneNode(true);
		let categoryDiv = headerClone.querySelector('.category-section');
		categoryDiv.querySelector('.category-header').textContent = categoryName;
		
		let contentDiv = categoryDiv.querySelector('.category-content');
		
		if (isJob || (isItem && categoryName === "Properties")) {
			contentDiv.classList.add('grid');
		} else {
			contentDiv.classList.add('list');
		}
		
		let category = categoryType[categoryName];
		category.forEach(function(name) {
			let templateId;
			if (isJob) templateId = "jobCardTemplate";
			else if (isSkill) templateId = "skillRowTemplate";
			else if (isItem && categoryName === "Properties") templateId = "propertyCardTemplate";
			else templateId = "miscRowTemplate";
			
			let template = document.getElementById(templateId);
			let rowClone = template.content.cloneNode(true);
			let element = rowClone.firstElementChild;
			
			element.id = "row " + name;
			element.querySelector('.name').textContent = name;
			
			let entityData = baseData[name];
			if (entityData && entityData.filefolder && entityData.filename) {
				let imgElement = element.querySelector('.card-image, .row-image');
				if (imgElement) {
					let filefolder = entityData.filefolder + '256';
					let filename = entityData.filename;
					filename = filename.replace('.png', '.jpg');
					imgElement.src = `img/${filefolder}/${filename}`;
					imgElement.alt = name;
					
					imgElement.setAttribute('data-name', name);
					imgElement.setAttribute('data-type', isJob ? 'job' : (isSkill ? 'skill' : 'item'));
					imgElement.style.cursor = 'pointer';
					imgElement.onclick = function (e) {
						e.stopPropagation();
						showModal(this);
					};
				}
			}
			
			if (isJob || isSkill) {
				element.onclick = function() {
					setTask(name);
				};
			} else if (isItem) {
				element.onclick = categoryName === "Properties" ?
					function() { setProperty(name); } :
					function() { setMisc(name); };
			}
			
			contentDiv.appendChild(element);
		});
		
		let lockedPlaceholder = document.createElement("div");
		lockedPlaceholder.id = "locked-" + categoryName.replace(/\s+/g, '-');
		if (isJob || (isItem && categoryName === "Properties")) {
			lockedPlaceholder.className = "ui-card locked-card hiddenTask";
			lockedPlaceholder.innerHTML = `
				<div class="locked-icon">🔒</div>
				<div class="locked-title">Required</div>
				<div class="locked-text"></div>
			`;
		} else {
			lockedPlaceholder.className = "ui-row locked-row hiddenTask";
			lockedPlaceholder.innerHTML = `
				<div class="locked-icon">🔒</div>
				<div class="row-info">
					<div class="locked-title">Required</div>
					<div class="locked-text"></div>
				</div>
			`;
		}
		contentDiv.appendChild(lockedPlaceholder);
		
		container.appendChild(categoryDiv);
		
		if (isItem && categoryName === "Properties") {
			let freeItemsDiv = document.createElement("div");
			freeItemsDiv.className = "category-section";
			
			// Dynamically generate Cheat Items (Potions) using JSON data
			let headerHTML = `<div class="category-header" style="margin-top: 25px;">Cheat Items</div>`;
			let contentDivPotions = document.createElement("div");
			contentDivPotions.className = "category-content list";
			
			if (typeof potionsBaseData !== 'undefined') {
				for (let key in potionsBaseData) {
					let potion = potionsBaseData[key];
					let row = document.createElement("div");
					row.className = "ui-row";
					row.style.cursor = "default";
					
					let imgSrc = `img/${potion.filefolder}256/${potion.filename.replace('.png', '.jpg')}`;
					
					row.innerHTML = `
						<img src="${imgSrc}" class="row-image" alt="${potion.name}" data-name="${potion.name}" data-type="potion" style="cursor: pointer; object-fit: cover;" onclick="showModal(this)">
						<div class="row-info">
							<div class="row-title">${potion.name}</div>
							<div class="row-value">x${potion.effect.toFixed(1)} ${potion.type === 'inspiration' ? 'Inspiration' : 'Game Speed'}</div>
						</div>
						<div class="potion-action" id="action-${potion.type}" style="width: 120px; text-align: right; flex-shrink: 0;">
							<button class="btn" onclick="drinkPotion('${potion.type}')">Drink</button>
						</div>
					`;
					contentDivPotions.appendChild(row);
				}
			}
			
			freeItemsDiv.innerHTML = headerHTML;
			freeItemsDiv.appendChild(contentDivPotions);
			container.appendChild(freeItemsDiv);
		}
	}
}

// Function to dynamically generate the Life Experiences UI
function initLifeExperiencesUI() {
	let container = document.getElementById("lifeExperiencesContainer");
	if (!container) return;
	container.innerHTML = "";
	
	if (typeof lifeExperiencesBaseData !== 'undefined') {
		for (let key in lifeExperiencesBaseData) {
			let exp = lifeExperiencesBaseData[key];
			let div = document.createElement("div");
			div.style.textAlign = "center";
			div.style.flex = "1";
			div.style.minWidth = "80px";
			
			let imgSrc = `img/${exp.filefolder}256/${exp.filename.replace('.png', '.jpg')}`;
			
			div.innerHTML = `
				<img src="${imgSrc}" alt="${exp.name}" data-name="${exp.name}" data-type="experience" style="width: 40px; height: 40px; object-fit: cover; border-radius: 50%; margin-bottom: 5px; cursor: pointer;" onclick="showModal(this)">
				<div style="font-size: 0.85em; font-weight: bold; color: #666;">${exp.name}</div>
				<div id="exp${exp.name}Display" style="color: #b8860b; font-weight: bold;">0</div>
			`;
			container.appendChild(div);
		}
	}
}

function updateRequiredRows(data, categoryType) {
	for (let categoryName in categoryType) {
		let category = categoryType[categoryName];
		let nextEntityFound = false;
		
		let lockedPlaceholder = document.getElementById("locked-" + categoryName.replace(/\s+/g, '-'));
		let categoryReqText = "";
		
		for (let i = 0; i < category.length; i++) {
			let entityName = category[i];
			let element = document.getElementById("row " + entityName);
			if (!element) continue;
			
			let requirements = gameData.requirements[entityName];
			let previouslyCompleted = requirements ? requirements.completed : true; // Track previous state
			
			if (!requirements || requirements.isCompleted()) {
				if (element.classList.contains("hiddenTask")) {
					element.classList.remove("hiddenTask");
					// Queue info modal if newly unlocked
					if (requirements && !previouslyCompleted && isInitialized) {
						let imgEl = element.querySelector('.card-image, .row-image');
						if (imgEl) queueInfoModal(imgEl);
					}
				}
			} else {
				if (!element.classList.contains("hiddenTask")) element.classList.add("hiddenTask");
				
				if (!nextEntityFound) {
					let finalText = "";
					
					if (requirements instanceof FameRequirement) {
						finalText += format(requirements.requirements[0].requirement) + " fame";
					} else if (requirements instanceof CoinRequirement) {
						finalText += "$" + format(requirements.requirements[0].requirement,0);
					} else if (requirements instanceof TaskRequirement) {
						let reqStrings = [];
						for (let req of requirements.requirements) {
							let task = gameData.taskData[req.task];
							reqStrings.push(req.task + " LVL " + format(task.level,0) + " / " + format(req.requirement,0));
						}
						finalText += reqStrings.join("<br>");
					} else if (requirements instanceof AgeRequirement) {
						finalText += "Age " + format(requirements.requirements[0].requirement,0);
					}
					
					categoryReqText = finalText;
					nextEntityFound = true;
				}
			}
		}
		
		if (lockedPlaceholder) {
			if (categoryReqText !== "") {
				if (lockedPlaceholder.classList.contains("hiddenTask")) lockedPlaceholder.classList.remove("hiddenTask");
				let textEl = lockedPlaceholder.querySelector('.locked-text');
				if (textEl.innerHTML !== categoryReqText) textEl.innerHTML = categoryReqText;
			} else {
				if (!lockedPlaceholder.classList.contains("hiddenTask")) lockedPlaceholder.classList.add("hiddenTask");
			}
		}
	}
}

function updateTaskRows() {
	for (let key in gameData.taskData) {
		let task = gameData.taskData[key];
		let row = document.getElementById("row " + task.name);
		if (!row) continue;
		
		let levelElement = row.querySelector(".level");
		if (levelElement) {
			let newLevelText = "LVL. " + task.level;
			if (levelElement.textContent !== newLevelText) {
				levelElement.textContent = newLevelText;
			}
		}
		
		let progressFill = row.querySelector(".progressFill");
		if (progressFill) {
			let newWidth = (task.xp / task.getMaxXp() * 100) + "%";
			if (progressFill.style.width !== newWidth) {
				progressFill.style.width = newWidth;
			}
		}
		
		let isActive = (task === gameData.currentJob || task === gameData.currentSkill);
		if (isActive && !row.classList.contains("active")) {
			row.classList.add("active");
		} else if (!isActive && row.classList.contains("active")) {
			row.classList.remove("active");
		}
		
		if (task instanceof Job) {
			let incomeElement = row.querySelector(".income");
			if (incomeElement) {
				let newIncomeHTML = `<span class="color-income-val">● ${format(task.getIncome())}</span> <span class="color-income-lbl">/ day</span>`;
				if (incomeElement.innerHTML !== newIncomeHTML) {
					incomeElement.innerHTML = newIncomeHTML;
				}
			}
		} else {
			let effectElement = row.querySelector(".effect");
			if (effectElement) {
				let newEffectText = task.getEffectDescription();
				if (effectElement.textContent !== newEffectText) {
					effectElement.textContent = newEffectText;
				}
			}
		}
	}
}

function updateItemRows() {
	for (let key in gameData.itemData) {
		let item = gameData.itemData[key];
		let row = document.getElementById("row " + item.name);
		if (!row) continue;
		
		let isActive = (gameData.currentProperty === item || gameData.currentMisc.includes(item));
		if (isActive && !row.classList.contains("active")) {
			row.classList.add("active");
		} else if (!isActive && row.classList.contains("active")) {
			row.classList.remove("active");
		}
		
		let effectElement = row.querySelector(".effect");
		if (effectElement) {
			let newEffectText = item.getEffectDescription();
			if (effectElement.textContent !== newEffectText) {
				effectElement.textContent = newEffectText;
			}
		}
		
		let expenseElement = row.querySelector(".expense");
		if (expenseElement) {
			let newExpenseHTML = `<span class="color-expense-val">● -${format(item.getExpense())}</span> <span class="color-expense-lbl">/ day</span>`;
			if (expenseElement.innerHTML !== newExpenseHTML) {
				expenseElement.innerHTML = newExpenseHTML;
			}
		}
	}
}

function updateAuthorAndBookUI() {
	if (gameData.currentAuthor && authorsBaseData && authorsBaseData[gameData.currentAuthor]) {
		let author = authorsBaseData[gameData.currentAuthor];
		let authorImg = document.getElementById("authorImage");
		let authorName = document.getElementById("authorNameDisplay");
		
		let filefolder = author.filefolder + '256';
		let filename = author.filename.replace('.png', '.jpg');
		let imgSrc = `img/${filefolder}/${filename}`;
		
		if (authorImg && authorImg.src !== imgSrc && !authorImg.src.includes(imgSrc)) {
			authorImg.src = imgSrc;
		}
		if (authorName && authorName.textContent !== author.name) {
			authorName.textContent = author.name;
		}
	}
	
	if (gameData.currentBook && booksBaseData && booksBaseData[gameData.currentBook]) {
		let book = booksBaseData[gameData.currentBook];
		let bookImg = document.getElementById("currentBookImage");
		let bookTitle = document.getElementById("currentBookTitle");
		
		let filefolder = book.filefolder + '256';
		let filename = book.filename.replace('.png', '.jpg');
		let imgSrc = `img/${filefolder}/${filename}`;
		
		if (bookImg && bookImg.src !== imgSrc && !bookImg.src.includes(imgSrc)) {
			bookImg.src = imgSrc;
		}
		if (bookTitle && bookTitle.textContent !== book.title) {
			bookTitle.textContent = book.title;
		}
	}
}

function updateTabButtons() {
	const updateImg = (imgId, entity) => {
		let imgEl = document.getElementById(imgId);
		if (!imgEl) return;
		if (entity && entity.baseData) {
			let src = `img/${entity.baseData.filefolder}256/${entity.baseData.filename.replace('.png', '.jpg')}`;
			if (imgEl.src !== src && !imgEl.src.includes(src)) {
				imgEl.src = src;
				imgEl.style.display = "inline-block";
			}
		} else {
			if (imgEl.style.display !== "none") imgEl.style.display = "none";
		}
	};
	
	updateImg("jobTabImg", gameData.currentJob);
	let jobTabText = document.getElementById("jobTabText");
	if (jobTabText) {
		let jobIncomeText = `+$${format(getIncome(),0)}/day`;
		if (jobTabText.textContent !== jobIncomeText) jobTabText.textContent = jobIncomeText;
	}
	
	updateImg("skillTabImg", gameData.currentSkill);
	let skillTabText = document.getElementById("skillTabText");
	if (skillTabText) {
		let skillLvlText = gameData.currentSkill ? `Lvl ${gameData.currentSkill.level}` : "";
		if (skillTabText.textContent !== skillLvlText) skillTabText.textContent = skillLvlText;
	}
	
	let writingImgEl = document.getElementById("writingTabImg");
	if (writingImgEl) {
		if (gameData.currentBook && booksBaseData && booksBaseData[gameData.currentBook]) {
			let book = booksBaseData[gameData.currentBook];
			let src = `img/${book.filefolder}256/${book.filename.replace('.png', '.jpg')}`;
			if (writingImgEl.src !== src && !writingImgEl.src.includes(src)) {
				writingImgEl.src = src;
				writingImgEl.style.display = "inline-block";
			}
		} else {
			if (writingImgEl.style.display !== "none") writingImgEl.style.display = "none";
		}
	}
	
	updateImg("shopTabImg", gameData.currentProperty);
	let shopTabText = document.getElementById("shopTabText");
	if (shopTabText) {
		let shopExpenseText = `-$${format(getExpense(),0)}/day`;
		if (shopTabText.textContent !== shopExpenseText) shopTabText.textContent = shopExpenseText;
	}
}

function updateBookHistory() {
	let container = document.getElementById("bookHistoryContainer");
	if (!container) return;
	
	if (container.dataset.count == gameData.completedBooks.length) return;
	container.dataset.count = gameData.completedBooks.length;
	
	container.innerHTML = "";
	for (let i = gameData.completedBooks.length - 1; i >= 0; i--) {
		let bookRecord = gameData.completedBooks[i];
		let bookId = bookRecord.id;
		let bookData = booksBaseData[bookId];
		if (!bookData) continue;
		
		let age = bookRecord.age || "?";
		let day = String(bookRecord.day || 0).padStart(3, '0');
		let royalties = bookRecord.royalties || 0;
		let yearlyRoyalties = royalties * 365;
		
		let qualityText = bookRecord.quality ? ` | Quality: ${bookRecord.quality.toFixed(1)}%` : "";
		
		let div = document.createElement("div");
		div.className = "ui-row";
		div.style.marginBottom = "10px";
		div.style.cursor = "pointer";
		div.onclick = function() {
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

function updatePotionsUI() {
	const types = ['inspiration', 'acceleration'];
	types.forEach(type => {
		let actionContainer = document.getElementById(`action-${type}`);
		if (!actionContainer) return;
		
		let timeLeft = gameData.potions[type];
		if (timeLeft > 0) {
			let minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
			let seconds = Math.floor(timeLeft % 60).toString().padStart(2, '0');
			let percentage = (timeLeft / 600) * 100;
			
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

function updateText() {
	const updateIfChanged = (id, newText) => {
		let el = document.getElementById(id);
		if (el && el.textContent !== String(newText)) {
			el.textContent = newText;
		}
	};
	
	updateIfChanged("ageDisplay", daysToYears(gameData.days));
	let dayStr = String(getDay()).padStart(3, '0');
	updateIfChanged("dayDisplay", dayStr);
	updateIfChanged("lifespanDisplay", daysToYears(getLifespan()));
	
	const updateMoneyIfChanged = (money, id) => {
		let el = document.getElementById(id);
		if (!el) return;
		let newHTML = `$${format(money)}`;
		if (el.innerHTML !== newHTML) {
			el.innerHTML = newHTML;
		}
	};
	
	updateMoneyIfChanged(gameData.coins, "coinDisplay");
	setSignDisplay();
	updateMoneyIfChanged(getNet(), "netDisplay");
	
	updateIfChanged("inspirationDisplay", getInspiration().toFixed(1));
	
	updateIfChanged("fameDisplay", format(gameData.fame));
	updateIfChanged("fameGainDisplay", format(getFameGain()));
	
	updateIfChanged("timeWarpingDisplay", gameData.taskData["Flow State"].getEffect().toFixed(2));
	updateIfChanged("timeWarpingButton", gameData.timeWarpingEnabled ? "Disable flow" : "Enable flow");
	
	updateIfChanged("wordsWrittenDisplay", format(gameData.wordsWritten));
	updateIfChanged("bookLengthDisplay", format(getBookLength(),0));
	
	updateIfChanged("writingSpeedDisplayTab", format(getWritingSpeed()));
	updateIfChanged("bookQualityDisplayTab", getBookQuality().toFixed(2));
	
	let lifeExp = getLifeExperiences();
	
	// Dynamically update Life Experiences text using JSON data
	if (typeof lifeExperiencesBaseData !== 'undefined') {
		for (let key in lifeExperiencesBaseData) {
			let expName = lifeExperiencesBaseData[key].name;
			let expValue = lifeExp[key.toLowerCase()] || 0;
			updateIfChanged(`exp${expName}Display`, format(expValue, 1));
		}
	}
	
	let qualityMultiplier = getQualityMultiplier();
	let multiplierDisplay = document.getElementById("bookQualityMultiplierDisplay");
	if (multiplierDisplay) {
		if (qualityMultiplier > 1) {
			multiplierDisplay.textContent = ` (x${qualityMultiplier.toFixed(2)})`;
			multiplierDisplay.style.color = "#4CAF50";
		} else {
			multiplierDisplay.textContent = "";
		}
	}
	
	updateIfChanged("workPercentage", 100 - gameData.workWritingBalance);
	updateIfChanged("writingPercentage", gameData.workWritingBalance);
	let slider = document.getElementById("workWritingSlider");
	if (slider && slider.value !== String(gameData.workWritingBalance)) {
		slider.value = gameData.workWritingBalance;
	}
	
	let writingProgress = Math.min(100, (gameData.wordsWritten / getBookLength()) * 100);
	let writingProgressBar = document.getElementById("writingProgressBar");
	if (writingProgressBar && writingProgressBar.style.width !== writingProgress + "%") {
		writingProgressBar.style.width = writingProgress + "%";
	}
	updateIfChanged("writingProgressDisplay", writingProgress.toFixed(1) + "%");
	
	// Update game version display in settings
	let versionDisplay = document.getElementById("gameVersionDisplay");
	if (versionDisplay && versionDisplay.textContent !== "v" + GAME_VERSION) {
		versionDisplay.textContent = "v" + GAME_VERSION;
	}
}

function setSignDisplay() {
	let signDisplay = document.getElementById("signDisplay");
	if (!signDisplay) return;
	let income = getIncome();
	let expense = getExpense();
	
	let newText = "";
	let newColor = "gray";
	
	if (income > expense) {
		newText = "+";
		newColor = "#4CAF50";
	} else if (expense > income) {
		newText = "-";
		newColor = "#f44336";
	}
	
	if (signDisplay.textContent !== newText) {
		signDisplay.textContent = newText;
		signDisplay.style.color = newColor;
	}
}

function hideEntities() {
	for (let key in gameData.requirements) {
		let requirement = gameData.requirements[key];
		let completed = requirement.isCompleted();
		for (let element of requirement.elements) {
			if (element.id && element.id.startsWith("row ")) {
				continue;
			}
			
			if (completed) {
				if (element.classList.contains("hidden")) {
					element.classList.remove("hidden");
				}
			} else {
				if (!element.classList.contains("hidden")) {
					element.classList.add("hidden");
				}
			}
		}
	}
}

function setLightDarkMode() {
	let body = document.getElementById("body");
	body.classList.contains("dark") ? body.classList.remove("dark") : body.classList.add("dark");
}

function logEvent(message) {
	let logContainer = document.getElementById("logContainer");
	if (!logContainer) return;
	let entry = document.createElement("div");
	entry.className = "log-entry";
	let age = daysToYears(gameData.days);
	let day = String(getDay()).padStart(3, '0');
	entry.innerHTML = `<b style="color: #875F9A">[Age ${age}.${day} days]</b> ${message}`;
	logContainer.prepend(entry);
}

function updateUI() {
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
}

// Helper to update the global pause state based on open modals
function updatePauseState() {
	const modals = ['infoModal', 'bookModal', 'introModal', 'authorSelectionScreen', 'authorBioModal', 'tutorialModal', 'versionModal'];
	let anyOpen = false;
	for (let id of modals) {
		let m = document.getElementById(id);
		if (m && m.style.display !== 'none' && m.style.display !== '') {
			anyOpen = true;
			break;
		}
	}
	isPaused = anyOpen;
}

// Queue functions for modals
function queueTutorialModal(title, text) {
	popupQueue.push({ type: 'tutorial', title: title, text: text });
}

function queueInfoModal(imgEl) {
	popupQueue.push({ type: 'info', imgEl: imgEl });
}

// Show Tutorial Modal
function showTutorialModal(title, text) {
	let modal = document.getElementById('tutorialModal');
	document.getElementById('tutorialModalTitle').textContent = title;
	document.getElementById('tutorialModalText').innerHTML = text;
	modal.style.display = 'flex';
	updatePauseState();
}

function closeTutorialModal() {
	let modal = document.getElementById('tutorialModal');
	if (modal) modal.style.display = 'none';
	updatePauseState();
}

function showModal (imgElement) {
	let name = imgElement.getAttribute('data-name');
	let type = imgElement.getAttribute('data-type');
	let modal = document.getElementById('infoModal');
	let modalImg = document.getElementById('modalImage');
	let modalTitle = document.getElementById('modalTitle');
	let modalDesc = document.getElementById('modalDescription');
	let modalMax = document.getElementById('modalMaxLevel');
	
	modalImg.src = imgElement.src;
	modalTitle.textContent = name;
	
	let descriptionText = tooltips[name] || "";
	if (type === 'job') {
		let task = gameData.taskData[name];
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
		let task = gameData.taskData[name];
		if (task) {
			let multi = 1 + (task.maxLevel / 20);
			let formattedMulti = parseFloat(multi.toFixed(2));
			modalMax.textContent = `Max level in past lives: ${task.maxLevel} and this gave you a x${formattedMulti} multiplier`;
			modalMax.style.display = "block";
		} else {
			modalMax.style.display = "none";
		}
	} else {
		modalMax.style.display = "none";
	}
	
	modal.style.display = "flex";
	updatePauseState(); // Pause game
}

function closeInfoModal() {
	let modal = document.getElementById('infoModal');
	if (modal) modal.style.display = 'none';
	updatePauseState();
}

function showAuthorSelection() {
	let screen = document.getElementById("authorSelectionScreen");
	let grid = document.getElementById("authorSelectionGrid");
	grid.innerHTML = "";
	
	for (let key in authorsBaseData) {
		let author = authorsBaseData[key];
		let mults = author.multipliers;
		
		let card = document.createElement("div");
		card.className = "ui-card";
		card.style.width = "180px";
		card.style.height = "auto";
		card.style.padding = "15px";
		card.style.cursor = "default";
		
		let img = document.createElement("img");
		img.className = "card-image";
		img.style.width = "190px";
		img.style.height = "190px";
		img.style.cursor = "pointer";
		let filefolder = author.filefolder + '256';
		let filename = author.filename.replace('.png', '.jpg');
		img.src = `img/${filefolder}/${filename}`;
		img.onclick = () => showAuthorBio(key);
		
		let name = document.createElement("div");
		name.className = "card-title";
		name.style.fontSize = "1.1em";
		name.style.marginTop = "5px";
		name.style.height = "45px";
		name.textContent = author.name;
		
		let stats = document.createElement("div");
		stats.style.fontSize = "0.9em";
		stats.style.color = "#888";
		stats.style.textAlign = "left";
		stats.style.marginTop = "10px";
		stats.style.lineHeight = "1.5";
		stats.innerHTML = `
			<b>Hardship:</b> x${mults.hardship.toFixed(1)}<br>
			<b>Observation:</b> x${mults.observation.toFixed(1)}<br>
			<b>Escapism:</b> x${mults.escapism.toFixed(1)}<br>
			<b>Exposure:</b> x${mults.exposure.toFixed(1)}<br>
			<b>Social:</b> x${mults.social.toFixed(1)}
		`;
		
		let selectBtn = document.createElement("button");
		selectBtn.className = "btn";
		selectBtn.style.marginTop = "15px";
		selectBtn.style.width = "100%";
		selectBtn.textContent = "Select";
		selectBtn.onclick = () => selectAuthor(key);
		
		card.appendChild(img);
		card.appendChild(name);
		card.appendChild(stats);
		card.appendChild(selectBtn);
		grid.appendChild(card);
	}
	
	screen.style.display = "flex";
	updatePauseState(); // Pause game
}

// Set the selected author and continue game initialization
function selectAuthor(authorId) {
	gameData.currentAuthor = authorId;
	document.getElementById("authorSelectionScreen").style.display = "none";
	updatePauseState(); // Unpause game
	continueInit();
}

function showAuthorBio(authorId) {
	let author = authorsBaseData[authorId];
	document.getElementById("bioModalName").textContent = author.name;
	document.getElementById("bioModalText").innerHTML = author.biography;
	document.getElementById("authorBioModal").style.display = "flex";
	updatePauseState(); // Pause game
}

function closeAuthorBio() {
	document.getElementById("authorBioModal").style.display = "none";
	updatePauseState(); // Unpause game
}

function showIntroModal() {
	let introModal = document.getElementById('introModal');
	if (introModal) {
		introModal.style.display = 'flex';
		updatePauseState(); // Pause game
	}
}

function closeIntroModal() {
	let introModal = document.getElementById('introModal');
	if (introModal) {
		introModal.style.display = 'none';
	}
	gameData.introSeen = true;
	saveGameData();
	updatePauseState(); // Unpause game
}

function showBookModal(bookId) {
	let book = booksBaseData[bookId];
	if (!book) return;
	
	let modal = document.getElementById('bookModal');
	let modalImg = document.getElementById('bookModalImage');
	let modalTitle = document.getElementById('bookModalTitle');
	let modalSubtitle = document.getElementById('bookModalSubtitle');
	let modalInfo = document.getElementById('bookModalInfo');
	
	let filefolder = book.filefolder + '256';
	let filename = book.filename.replace('.png', '.jpg');
	modalImg.src = `img/${filefolder}/${filename}`;
	
	modalTitle.textContent = book.title;
	modalSubtitle.textContent = book.subtitle;
	modalInfo.innerHTML = `<b>Genre:</b> ${book.genre} | <b>Words:</b> ${format(book.wordCount, 0)}<br><i>"${book.hook}"</i>`;
	
	modal.style.display = "flex";
	updatePauseState(); // Pause game
	
	let firstPageText = book.firstPage || "Chapter 1\n\nThe beginning of a new journey...";
	startTypingEffect(firstPageText, "bookModalFirstPage");
}

function closeBookModal() {
	if (typingTimeout) clearTimeout(typingTimeout);
	let modal = document.getElementById('bookModal');
	if (modal) modal.style.display = 'none';
	updatePauseState(); // Unpause game
}

function startTypingEffect(fullText, elementId) {
	if (typingTimeout) clearTimeout(typingTimeout);
	
	let container = document.getElementById(elementId);
	if (!container) return;
	
	container.innerHTML = '<span class="blinking-cursor">|</span>';
	
	let currentIndex = 0;
	let currentHTML = "";
	let isCorrecting = false;
	
	const getRandomChar = () => {
		const chars = "abcdefghijklmnopqrstuvwxyz";
		return chars.charAt(Math.floor(Math.random() * chars.length));
	};
	
	function typeNext() {
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
			let char = fullText[currentIndex];
			
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
		
		let wordApp = document.getElementById("wordAppContainer");
		if (wordApp) wordApp.scrollTop = wordApp.scrollHeight;
		
		typingTimeout = setTimeout(typeNext, delay);
	}
	
	typingTimeout = setTimeout(typeNext, 500);
}

window.addEventListener('click', function (event) {
	let infoModal = document.getElementById('infoModal');
	if (infoModal && infoModal.style.display === 'flex' && event.target === infoModal) {
		closeInfoModal();
	}
	
	let bookModal = document.getElementById('bookModal');
	if (bookModal && bookModal.style.display === 'flex' && event.target === bookModal) {
		closeBookModal();
	}
	
	let authorBioModal = document.getElementById('authorBioModal');
	if (authorBioModal && authorBioModal.style.display === 'flex' && event.target === authorBioModal) {
		closeAuthorBio();
	}
	
	let tutorialModal = document.getElementById('tutorialModal');
	if (tutorialModal && tutorialModal.style.display === 'flex' && event.target === tutorialModal) {
		closeTutorialModal();
	}
});
