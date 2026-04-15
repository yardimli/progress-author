// DOM manipulation, table creation, updating text

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
		
		// MODIFIED: Removed category-requirements logic
		
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
		
		// NEW: Inject locked placeholder card/row
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
		
		// NEW: Inject Free Items section after Properties
		if (isItem && categoryName === "Properties") {
			let freeItemsDiv = document.createElement("div");
			freeItemsDiv.className = "category-section";
			freeItemsDiv.innerHTML = `
				<div class="category-header" style="margin-top: 25px;">Free Items</div>
				<div class="category-content list">
					<!-- Inspiration Potion -->
					<div class="ui-row" style="cursor: default;">
						<div class="row-image" style="background-color: #9c27b0; display: flex; align-items: center; justify-content: center; color: white; font-size: 32px; border-radius: 4px;">🧪</div>
						<div class="row-info">
							<div class="row-title">Inspiration Potion</div>
							<div class="row-value">x2.0 Inspiration</div>
						</div>
						<div class="potion-action" id="action-inspiration" style="width: 120px; text-align: right; flex-shrink: 0;">
							<button class="btn" onclick="drinkPotion('inspiration')">Drink</button>
						</div>
					</div>
					<!-- Acceleration Potion -->
					<div class="ui-row" style="cursor: default;">
						<div class="row-image" style="background-color: #ff9800; display: flex; align-items: center; justify-content: center; color: white; font-size: 32px; border-radius: 4px;">⚡</div>
						<div class="row-info">
							<div class="row-title">Acceleration Potion</div>
							<div class="row-value">x2.0 Game Speed</div>
						</div>
						<div class="potion-action" id="action-acceleration" style="width: 120px; text-align: right; flex-shrink: 0;">
							<button class="btn" onclick="drinkPotion('acceleration')">Drink</button>
						</div>
					</div>
				</div>
			`;
			container.appendChild(freeItemsDiv);
		}
	}
}

function updateRequiredRows(data, categoryType) {
	for (let categoryName in categoryType) {
		let category = categoryType[categoryName];
		let nextEntityFound = false;
		
		// MODIFIED: Target the locked placeholder instead of the old categoryReqDiv
		let lockedPlaceholder = document.getElementById("locked-" + categoryName.replace(/\s+/g, '-'));
		let categoryReqText = "";
		
		for (let i = 0; i < category.length; i++) {
			let entityName = category[i];
			let element = document.getElementById("row " + entityName);
			if (!element) continue;
			
			let requirements = gameData.requirements[entityName];
			
			if (!requirements || requirements.isCompleted()) {
				if (element.classList.contains("hiddenTask")) element.classList.remove("hiddenTask");
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
						finalText += reqStrings.join(", ");
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

// MODIFIED: Removed updateHeaderRows()

// MODIFIED: Removed setGameSpeedMultiplier and updateSpeedButtons

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
		let jobIncomeText = `+${format(getIncome())}/day`;
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
		let shopExpenseText = `-${format(getExpense())}/day`;
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
		
		let div = document.createElement("div");
		div.className = "ui-row";
		div.style.marginBottom = "10px";
		div.style.cursor = "default";
		div.innerHTML = `
			<img src="img/${bookData.filefolder}256/${bookData.filename.replace('.png', '.jpg')}" class="row-image" style="width: 60px; height: 90px; object-fit: cover; border-radius: 4px;">
			<div class="row-info">
				<div class="row-title">${bookData.title}</div>
				<div class="row-value">Published: Age ${age}.${day} days</div>
			</div>
			<div class="row-expense" style="text-align: right;">
				<span style="color: #4CAF50; font-weight: bold;">+$${format(royalties)}/day</span><br>
				<span style="font-size: 0.85em; color: #888;">+$${format(yearlyRoyalties)}/yr</span>
			</div>
		`;
		container.appendChild(div);
	}
}

// NEW: Update Potions UI
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
	// MODIFIED: Removed pauseButton update
	
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
	updateIfChanged("bookQualityDisplayTab", getBookQuality().toFixed(1));
	
	let writingProgress = Math.min(100, (gameData.wordsWritten / getBookLength()) * 100);
	let writingProgressBar = document.getElementById("writingProgressBar");
	if (writingProgressBar && writingProgressBar.style.width !== writingProgress + "%") {
		writingProgressBar.style.width = writingProgress + "%";
	}
	updateIfChanged("writingProgressDisplay", writingProgress.toFixed(1) + "%");
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
	// MODIFIED: Removed updateHeaderRows calls
	hideEntities();
	updateAuthorAndBookUI();
	updateText();
	// MODIFIED: Removed updateSpeedButtons()
	updateTabButtons();
	updateBookHistory();
	// NEW: Update Potions UI
	updatePotionsUI();
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
	modalDesc.textContent = tooltips[name] || "";
	
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
}

window.addEventListener('click', function () {
	let modal = document.getElementById('infoModal');
	if (modal && modal.style.display === 'flex') {
		modal.style.display = 'none';
	}
});
