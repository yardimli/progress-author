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
	
	// Added check to only update DOM if text content has changed
	let nameElement = progressBar.getElementsByClassName("name")[0];
	let newNameText = currentTask.name + " lvl " + currentTask.level;
	if (nameElement.textContent !== newNameText) {
		nameElement.textContent = newNameText;
	}
	
	// Added check to only update DOM if width has changed
	let progressFill = progressBar.getElementsByClassName("progressFill")[0];
	let newWidth = (currentTask.xp / currentTask.getMaxXp() * 100) + "%";
	if (progressFill.style.width !== newWidth) {
		progressFill.style.width = newWidth;
	}
}

// Refactored to apply locks directly to the cards/rows and only update when changed
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
				if (element.classList.contains("locked")) element.classList.remove("locked");
				if (element.classList.contains("hiddenTask")) element.classList.remove("hiddenTask");
				let overlay = element.querySelector('.locked-overlay');
				if (overlay && overlay.style.display !== 'none') overlay.style.display = 'none';
			} else if (!nextEntityFound) {
				// Next to unlock
				if (element.classList.contains("hiddenTask")) element.classList.remove("hiddenTask");
				if (!element.classList.contains("locked")) element.classList.add("locked");
				
				let overlay = element.querySelector('.locked-overlay');
				if (overlay) {
					if (overlay.style.display !== 'flex') overlay.style.display = 'flex';
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
					
					// Only update innerHTML if it has changed to prevent repaints
					if (reqText.innerHTML !== finalText) {
						reqText.innerHTML = finalText;
					}
				}
				nextEntityFound = true;
			} else {
				// Hidden (too far down the tree)
				if (!element.classList.contains("hiddenTask")) element.classList.add("hiddenTask");
			}
		}
	}
}

// Refactored to update the new DOM structure only when data changes
function updateTaskRows() {
	for (let key in gameData.taskData) {
		let task = gameData.taskData[key];
		let row = document.getElementById("row " + task.name);
		if (!row) continue;
		
		let levelElement = row.querySelector(".level");
		if (levelElement) {
			let newLevelText = "LVL. " + task.level;
			// Only update if changed
			if (levelElement.textContent !== newLevelText) {
				levelElement.textContent = newLevelText;
			}
		}
		
		// Update max level tooltip dynamically if player has past lives
		let maxLevelTooltip = row.querySelector(".maxLevelTooltip");
		if (maxLevelTooltip) {
			if (gameData.rebirthOneCount > 0) {
				// Only update display if changed
				if (maxLevelTooltip.style.display !== "block") {
					maxLevelTooltip.style.display = "block";
				}
				let multi = 1 + (task.maxLevel / 20);
				let formattedMulti = parseFloat(multi.toFixed(2));
				let text = `Max level in past lives: ${task.maxLevel} and this gave you a x${formattedMulti} multiplier`;
				// Only update text if changed
				if (maxLevelTooltip.textContent !== text) {
					maxLevelTooltip.textContent = text;
				}
			} else {
				// Only update display if changed
				if (maxLevelTooltip.style.display !== "none") {
					maxLevelTooltip.style.display = "none";
				}
			}
		}
		
		let progressFill = row.querySelector(".progressFill");
		if (progressFill) {
			let newWidth = (task.xp / task.getMaxXp() * 100) + "%";
			// Only update width if changed
			if (progressFill.style.width !== newWidth) {
				progressFill.style.width = newWidth;
			}
		}
		
		let isActive = (task === gameData.currentJob || task === gameData.currentSkill);
		// Only toggle class if state doesn't match
		if (isActive && !row.classList.contains("active")) {
			row.classList.add("active");
		} else if (!isActive && row.classList.contains("active")) {
			row.classList.remove("active");
		}
		
		if (task instanceof Job) {
			let incomeElement = row.querySelector(".income");
			if (incomeElement) {
				let newIncomeHTML = `<span style="color: #ffd700">● ${format(task.getIncome())}</span> <span style="color: #a8d08d">/ day</span>`;
				// Only update HTML if changed
				if (incomeElement.innerHTML !== newIncomeHTML) {
					incomeElement.innerHTML = newIncomeHTML;
				}
			}
		} else {
			let effectElement = row.querySelector(".effect");
			if (effectElement) {
				let newEffectText = task.getEffectDescription();
				// Only update text if changed
				if (effectElement.textContent !== newEffectText) {
					effectElement.textContent = newEffectText;
				}
			}
		}
	}
}

// Refactored to update the new DOM structure only when data changes
function updateItemRows() {
	for (let key in gameData.itemData) {
		let item = gameData.itemData[key];
		let row = document.getElementById("row " + item.name);
		if (!row) continue;
		
		let isActive = (gameData.currentProperty === item || gameData.currentMisc.includes(item));
		// Only toggle class if state doesn't match
		if (isActive && !row.classList.contains("active")) {
			row.classList.add("active");
		} else if (!isActive && row.classList.contains("active")) {
			row.classList.remove("active");
		}
		
		let effectElement = row.querySelector(".effect");
		if (effectElement) {
			let newEffectText = item.getEffectDescription();
			// Only update text if changed
			if (effectElement.textContent !== newEffectText) {
				effectElement.textContent = newEffectText;
			}
		}
		
		let expenseElement = row.querySelector(".expense");
		if (expenseElement) {
			let newExpenseHTML = `<span style="color: #ffd700">● -${format(item.getExpense())}</span> <span style="color: #ff4c4c">/ day</span>`;
			// Only update HTML if changed
			if (expenseElement.innerHTML !== newExpenseHTML) {
				expenseElement.innerHTML = newExpenseHTML;
			}
		}
	}
}

// Refactored to toggle the skip checkboxes in the list layout only when changed
function updateHeaderRows(categories) {
	let skipElements = document.querySelectorAll('.skipSkill');
	let display = autoLearnElement.checked ? "block" : "none";
	skipElements.forEach(el => {
		if (el.style.display !== display) {
			el.style.display = display;
		}
	});
}

// Function to handle speed multiplier buttons
function setGameSpeedMultiplier(multiplier) {
	gameData.speedMultiplier = multiplier;
	updateSpeedButtons();
}

// Function to update speed buttons UI only when changed
function updateSpeedButtons() {
	let buttons = document.getElementsByClassName("speed-btn");
	for (let btn of buttons) {
		let isActive = parseInt(btn.textContent) === (gameData.speedMultiplier || 1);
		if (isActive && !btn.classList.contains("w3-blue-gray")) {
			btn.classList.add("w3-blue-gray");
		} else if (!isActive && btn.classList.contains("w3-blue-gray")) {
			btn.classList.remove("w3-blue-gray");
		}
	}
}

function updateText() {
	// Helper function to update text content only if changed
	const updateIfChanged = (id, newText) => {
		let el = document.getElementById(id);
		if (el && el.textContent !== String(newText)) {
			el.textContent = newText;
		}
	};
	
	updateIfChanged("ageDisplay", daysToYears(gameData.days));
	updateIfChanged("dayDisplay", getDay());
	updateIfChanged("lifespanDisplay", daysToYears(getLifespan()));
	updateIfChanged("pauseButton", gameData.paused ? "Play" : "Pause");
	
	// Helper function to update money format only if changed
	const updateMoneyIfChanged = (money, id) => {
		let el = document.getElementById(id);
		if (!el) return;
		let newHTML = `<span>$${format(money)}</span>`;
		if (el.innerHTML !== newHTML) {
			formatMoney(money, el);
		}
	};
	
	updateMoneyIfChanged(gameData.coins, "coinDisplay");
	setSignDisplay();
	updateMoneyIfChanged(getNet(), "netDisplay");
	updateMoneyIfChanged(getIncome(), "incomeDisplay");
	updateMoneyIfChanged(getExpense(), "expenseDisplay");
	
	updateIfChanged("inspirationDisplay", getInspiration().toFixed(1));
	
	updateIfChanged("fameDisplay", gameData.fame.toFixed(1));
	updateIfChanged("fameGainDisplay", getFameGain().toFixed(1));
	
	updateIfChanged("timeWarpingDisplay", "x" + gameData.taskData["Flow State"].getEffect().toFixed(2));
	updateIfChanged("timeWarpingButton", gameData.timeWarpingEnabled ? "Disable flow" : "Enable flow");
	
	// Writing Process
	updateIfChanged("wordsWrittenDisplay", format(gameData.wordsWritten));
	updateIfChanged("bookLengthDisplay", format(getBookLength()));
	updateIfChanged("writingSpeedDisplay", format(getWritingSpeed()));
	updateIfChanged("bookQualityDisplay", getBookQuality().toFixed(1));
	updateIfChanged("booksPublishedDisplay", gameData.booksPublished);
	updateIfChanged("royaltiesDisplay", format(gameData.royalties));
}

function setSignDisplay() {
	let signDisplay = document.getElementById("signDisplay");
	let income = getIncome();
	let expense = getExpense();
	
	let newText = "";
	let newColor = "gray";
	
	if (income > expense) {
		newText = "+";
		newColor = "green";
	} else if (expense > income) {
		newText = "-";
		newColor = "red";
	}
	
	// Only update DOM if text or color has changed
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
