// DOM manipulation, table creation, updating text

function setTab(element, selectedTab) {
	let tabs = Array.prototype.slice.call(document.getElementsByClassName("tab"));
	tabs.forEach(function(tab) {
		tab.style.display = "none";
	});
	document.getElementById(selectedTab).style.display = "block";
	
	let tabButtons = document.getElementsByClassName("tabButton");
	for (let tabButton of tabButtons) {
		tabButton.classList.remove("w3-blue-gray");
	}
	element.classList.add("w3-blue-gray");
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

// Refactored to build the new grid and list layouts
function createAllRows(categoryType, containerId) {
	let container = document.getElementById(containerId);
	container.innerHTML = ''; // Clear existing content
	
	let isJob = categoryType === jobCategories;
	let isSkill = categoryType === skillCategories;
	let isItem = categoryType === itemCategories;
	
	for (let categoryName in categoryType) {
		// Create Category Header
		let headerTemplate = document.getElementById("categoryHeaderTemplate");
		let headerClone = headerTemplate.content.cloneNode(true);
		let categoryDiv = headerClone.querySelector('.category-section');
		categoryDiv.querySelector('.category-header').textContent = categoryName;
		
		let contentDiv = categoryDiv.querySelector('.category-content');
		
		// Determine layout type (grid for jobs/properties, list for skills/misc)
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
			
			// Set tooltip text based on entity type
			if (isJob || isSkill) {
				element.querySelector('.baseTooltip').textContent = tooltips[name];
			} else {
				element.querySelector('.tooltipText').textContent = tooltips[name];
			}
			
			// Attach click handlers
			if (isJob || isSkill) {
				element.onclick = function() { setTask(name); };
			} else if (isItem) {
				element.onclick = categoryName === "Properties" ? function() { setProperty(name); } : function() { setMisc(name); };
			}
			
			contentDiv.appendChild(element);
		});
		
		container.appendChild(categoryDiv);
	}
}

function updateQuickTaskDisplay(taskType) {
	let currentTask = taskType == "job" ? gameData.currentJob : gameData.currentSkill;
	let quickTaskDisplayElement = document.getElementById("quickTaskDisplay");
	let progressBar = quickTaskDisplayElement.getElementsByClassName(taskType)[0];
	progressBar.getElementsByClassName("name")[0].textContent = currentTask.name + " lvl " + currentTask.level;
	progressBar.getElementsByClassName("progressFill")[0].style.width = currentTask.xp / currentTask.getMaxXp() * 100 + "%";
}

// Refactored to apply locks directly to the cards/rows
function updateRequiredRows(data, categoryType) {
	for (let categoryName in categoryType) {
		let category = categoryType[categoryName];
		let nextEntityFound = false;
		
		for (let i = 0; i < category.length; i++) {
			let entityName = category[i];
			let element = document.getElementById("row " + entityName);
			if (!element) continue;
			
			let requirements = gameData.requirements[entityName];
			
			if (!requirements || requirements.isCompleted()) {
				// Unlocked
				element.classList.remove("locked", "hiddenTask");
				let overlay = element.querySelector('.locked-overlay');
				if (overlay) overlay.style.display = 'none';
			} else if (!nextEntityFound) {
				// Next to unlock
				element.classList.remove("hiddenTask");
				element.classList.add("locked");
				let overlay = element.querySelector('.locked-overlay');
				if (overlay) {
					overlay.style.display = 'flex';
					let reqText = overlay.querySelector('.req-text');
					
					let finalText = "";
					if (requirements instanceof FameRequirement) {
						finalText = format(requirements.requirements[0].requirement) + " fame";
					} else if (requirements instanceof CoinRequirement) {
						finalText = "$" + format(requirements.requirements[0].requirement);
					} else if (requirements instanceof TaskRequirement) {
						for (let req of requirements.requirements) {
							let task = gameData.taskData[req.task];
							finalText += req.task + " " + format(task.level) + "/" + format(req.requirement) + "<br>";
						}
					} else if (requirements instanceof AgeRequirement) {
						finalText = "Age " + format(requirements.requirements[0].requirement);
					}
					reqText.innerHTML = finalText;
				}
				nextEntityFound = true;
			} else {
				// Hidden (too far down the tree)
				element.classList.add("hiddenTask");
			}
		}
	}
}

// Refactored to update the new DOM structure
function updateTaskRows() {
	for (let key in gameData.taskData) {
		let task = gameData.taskData[key];
		let row = document.getElementById("row " + task.name);
		if (!row) continue;
		
		let levelElement = row.querySelector(".level");
		if (levelElement) levelElement.textContent = "LVL. " + task.level;
		
		// Update max level tooltip dynamically if player has past lives
		let maxLevelTooltip = row.querySelector(".maxLevelTooltip");
		if (maxLevelTooltip) {
			if (gameData.rebirthOneCount > 0) {
				maxLevelTooltip.style.display = "block";
				let multi = 1 + (task.maxLevel / 20);
				let formattedMulti = parseFloat(multi.toFixed(2));
				let text = `Max level in past lives: ${task.maxLevel} and this gave you a x${formattedMulti} multiplier`;
				if (maxLevelTooltip.textContent !== text) {
					maxLevelTooltip.textContent = text;
				}
			} else {
				maxLevelTooltip.style.display = "none";
			}
		}
		
		let progressFill = row.querySelector(".progressFill");
		if (progressFill) progressFill.style.width = (task.xp / task.getMaxXp() * 100) + "%";
		
		if (task === gameData.currentJob || task === gameData.currentSkill) {
			row.classList.add("active");
		} else {
			row.classList.remove("active");
		}
		
		if (task instanceof Job) {
			let incomeElement = row.querySelector(".income");
			if (incomeElement) {
				incomeElement.innerHTML = `<span style="color: #ffd700">● ${format(task.getIncome())}</span> <span style="color: #a8d08d">/ day</span>`;
			}
		} else {
			let effectElement = row.querySelector(".effect");
			if (effectElement) {
				effectElement.textContent = task.getEffectDescription();
			}
		}
	}
}

// Refactored to update the new DOM structure
function updateItemRows() {
	for (let key in gameData.itemData) {
		let item = gameData.itemData[key];
		let row = document.getElementById("row " + item.name);
		if (!row) continue;
		
		if (gameData.currentProperty === item || gameData.currentMisc.includes(item)) {
			row.classList.add("active");
		} else {
			row.classList.remove("active");
		}
		
		let effectElement = row.querySelector(".effect");
		if (effectElement) {
			effectElement.textContent = item.getEffectDescription();
		}
		
		let expenseElement = row.querySelector(".expense");
		if (expenseElement) {
			expenseElement.innerHTML = `<span style="color: #ffd700">● -${format(item.getExpense())}</span> <span style="color: #ff4c4c">/ day</span>`;
		}
	}
}

// Refactored to toggle the skip checkboxes in the list layout
function updateHeaderRows(categories) {
	let skipElements = document.querySelectorAll('.skipSkill');
	let display = autoLearnElement.checked ? "block" : "none";
	skipElements.forEach(el => el.style.display = display);
}

// Function to handle speed multiplier buttons
function setGameSpeedMultiplier(multiplier) {
	gameData.speedMultiplier = multiplier;
	updateSpeedButtons();
}

// Function to update speed buttons UI
function updateSpeedButtons() {
	let buttons = document.getElementsByClassName("speed-btn");
	for (let btn of buttons) {
		if (parseInt(btn.textContent) === (gameData.speedMultiplier || 1)) {
			btn.classList.add("w3-blue-gray");
		} else {
			btn.classList.remove("w3-blue-gray");
		}
	}
}

function updateText() {
	document.getElementById("ageDisplay").textContent = daysToYears(gameData.days);
	document.getElementById("dayDisplay").textContent = getDay();
	document.getElementById("lifespanDisplay").textContent = daysToYears(getLifespan());
	document.getElementById("pauseButton").textContent = gameData.paused ? "Play" : "Pause";
	
	formatMoney(gameData.coins, document.getElementById("coinDisplay"));
	setSignDisplay();
	formatMoney(getNet(), document.getElementById("netDisplay"));
	formatMoney(getIncome(), document.getElementById("incomeDisplay"));
	formatMoney(getExpense(), document.getElementById("expenseDisplay"));
	
	document.getElementById("inspirationDisplay").textContent = getInspiration().toFixed(1);
	
	document.getElementById("fameDisplay").textContent = gameData.fame.toFixed(1);
	document.getElementById("fameGainDisplay").textContent = getFameGain().toFixed(1);
	
	document.getElementById("timeWarpingDisplay").textContent = "x" + gameData.taskData["Flow State"].getEffect().toFixed(2);
	document.getElementById("timeWarpingButton").textContent = gameData.timeWarpingEnabled ? "Disable flow" : "Enable flow";
	
	// Writing Process
	document.getElementById("wordsWrittenDisplay").textContent = format(gameData.wordsWritten);
	document.getElementById("bookLengthDisplay").textContent = format(getBookLength());
	document.getElementById("writingSpeedDisplay").textContent = format(getWritingSpeed());
	document.getElementById("bookQualityDisplay").textContent = getBookQuality().toFixed(1);
	document.getElementById("booksPublishedDisplay").textContent = gameData.booksPublished;
	document.getElementById("royaltiesDisplay").textContent = format(gameData.royalties);
}

function setSignDisplay() {
	let signDisplay = document.getElementById("signDisplay");
	if (getIncome() > getExpense()) {
		signDisplay.textContent = "+";
		signDisplay.style.color = "green";
	} else if (getExpense() > getIncome()) {
		signDisplay.textContent = "-";
		signDisplay.style.color = "red";
	} else {
		signDisplay.textContent = "";
		signDisplay.style.color = "gray";
	}
}

function hideEntities() {
	for (let key in gameData.requirements) {
		let requirement = gameData.requirements[key];
		let completed = requirement.isCompleted();
		for (let element of requirement.elements) {
			if (completed) {
				element.classList.remove("hidden");
			} else {
				element.classList.add("hidden");
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
	let day = getDay();
	entry.innerHTML = `<b style="color: #875F9A">[Age ${age} Day ${day}]</b> ${message}`;
	logContainer.prepend(entry);
}

function updateUI() {
	updateTaskRows();
	updateItemRows();
	updateRequiredRows(gameData.taskData, jobCategories);
	updateRequiredRows(gameData.taskData, skillCategories);
	updateRequiredRows(gameData.itemData, itemCategories);
	updateHeaderRows(jobCategories);
	updateHeaderRows(skillCategories);
	updateQuickTaskDisplay("job");
	updateQuickTaskDisplay("skill");
	hideEntities();
	updateText();
	updateSpeedButtons();
}
