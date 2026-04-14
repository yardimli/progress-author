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

function createRequiredRow(categoryName) {
	let requiredRow = document.getElementsByClassName("requiredRowTemplate")[0].content.firstElementChild.cloneNode(true);
	requiredRow.classList.add("requiredRow");
	requiredRow.classList.add(removeSpaces(categoryName));
	requiredRow.id = categoryName;
	return requiredRow;
}

function createHeaderRow(templates, categoryType, categoryName) {
	let headerRow = templates.headerRow.content.firstElementChild.cloneNode(true);
	headerRow.getElementsByClassName("category")[0].textContent = categoryName;
	if (categoryType != itemCategories) {
		headerRow.getElementsByClassName("valueType")[0].textContent = categoryType == jobCategories ? "Income/day" : "Effect";
	}
	
	headerRow.style.backgroundColor = headerRowColors[categoryName];
	headerRow.style.color = "#ffffff";
	headerRow.classList.add(removeSpaces(categoryName));
	headerRow.classList.add("headerRow");
	
	return headerRow;
}

function createRow(templates, name, categoryName, categoryType) {
	let row = templates.row.content.firstElementChild.cloneNode(true);
	row.getElementsByClassName("name")[0].textContent = name;
	row.getElementsByClassName("tooltipText")[0].textContent = tooltips[name];
	row.id = "row " + name;
	if (categoryType != itemCategories) {
		row.getElementsByClassName("progressBar")[0].onclick = function() { setTask(name); };
	} else {
		row.getElementsByClassName("button")[0].onclick = categoryName == "Properties" ? function() { setProperty(name); } : function() { setMisc(name); };
	}
	return row;
}

function createAllRows(categoryType, tableId) {
	let templates = {
		headerRow: document.getElementsByClassName(categoryType == itemCategories ? "headerRowItemTemplate" : "headerRowTaskTemplate")[0],
		row: document.getElementsByClassName(categoryType == itemCategories ? "rowItemTemplate" : "rowTaskTemplate")[0],
	};
	
	let table = document.getElementById(tableId);
	
	for (let categoryName in categoryType) {
		let headerRow = createHeaderRow(templates, categoryType, categoryName);
		table.appendChild(headerRow);
		
		let category = categoryType[categoryName];
		category.forEach(function(name) {
			let row = createRow(templates, name, categoryName, categoryType);
			table.appendChild(row);
		});
		
		let requiredRow = createRequiredRow(categoryName);
		table.append(requiredRow);
	}
}

function updateQuickTaskDisplay(taskType) {
	let currentTask = taskType == "job" ? gameData.currentJob : gameData.currentSkill;
	let quickTaskDisplayElement = document.getElementById("quickTaskDisplay");
	let progressBar = quickTaskDisplayElement.getElementsByClassName(taskType)[0];
	progressBar.getElementsByClassName("name")[0].textContent = currentTask.name + " lvl " + currentTask.level;
	progressBar.getElementsByClassName("progressFill")[0].style.width = currentTask.xp / currentTask.getMaxXp() * 100 + "%";
}

function updateRequiredRows(data, categoryType) {
	let requiredRows = document.getElementsByClassName("requiredRow");
	for (let requiredRow of requiredRows) {
		let nextEntity = null;
		let category = categoryType[requiredRow.id];
		if (category == null) { continue; }
		for (let i = 0; i < category.length; i++) {
			let entityName = category[i];
			if (i >= category.length - 1) break;
			let requirements = gameData.requirements[entityName];
			if (requirements && i == 0) {
				if (!requirements.isCompleted()) {
					nextEntity = data[entityName];
					break;
				}
			}
			
			let nextIndex = i + 1;
			if (nextIndex >= category.length) { break; }
			let nextEntityName = category[nextIndex];
			let nextEntityRequirements = gameData.requirements[nextEntityName];
			
			if (!nextEntityRequirements.isCompleted()) {
				nextEntity = data[nextEntityName];
				break;
			}
		}
		
		if (nextEntity == null) {
			requiredRow.classList.add("hiddenTask");
		} else {
			requiredRow.classList.remove("hiddenTask");
			let requirementObject = gameData.requirements[nextEntity.name];
			let requirements = requirementObject.requirements;
			
			let coinElement = requiredRow.getElementsByClassName("coins")[0];
			let levelElement = requiredRow.getElementsByClassName("levels")[0];
			let fameElement = requiredRow.getElementsByClassName("fame")[0];
			
			coinElement.classList.add("hiddenTask");
			levelElement.classList.add("hiddenTask");
			fameElement.classList.add("hiddenTask");
			
			let finalText = "";
			if (data == gameData.taskData) {
				if (requirementObject instanceof FameRequirement) {
					fameElement.classList.remove("hiddenTask");
					fameElement.textContent = format(requirements[0].requirement) + " fame";
				} else {
					levelElement.classList.remove("hiddenTask");
					for (let requirement of requirements) {
						let task = gameData.taskData[requirement.task];
						if (task.level >= requirement.requirement) continue;
						let text = " " + requirement.task + " level " + format(task.level) + "/" + format(requirement.requirement) + ",";
						finalText += text;
					}
					finalText = finalText.substring(0, finalText.length - 1);
					levelElement.textContent = finalText;
				}
			} else if (data == gameData.itemData) {
				coinElement.classList.remove("hiddenTask");
				formatMoney(requirements[0].requirement, coinElement);
			}
		}
	}
}

function updateTaskRows() {
	for (let key in gameData.taskData) {
		let task = gameData.taskData[key];
		let row = document.getElementById("row " + task.name);
		row.getElementsByClassName("level")[0].textContent = task.level;
		row.getElementsByClassName("xpGain")[0].textContent = format(task.getXpGain());
		row.getElementsByClassName("xpLeft")[0].textContent = format(task.getXpLeft());
		
		let maxLevel = row.getElementsByClassName("maxLevel")[0];
		maxLevel.textContent = task.maxLevel;
		gameData.rebirthOneCount > 0 ? maxLevel.classList.remove("hidden") : maxLevel.classList.add("hidden");
		
		let progressFill = row.getElementsByClassName("progressFill")[0];
		progressFill.style.width = task.xp / task.getMaxXp() * 100 + "%";
		task == gameData.currentJob || task == gameData.currentSkill ? progressFill.classList.add("current") : progressFill.classList.remove("current");
		
		let valueElement = row.getElementsByClassName("value")[0];
		valueElement.getElementsByClassName("income")[0].style.display = task instanceof Job ? "block" : "none";
		valueElement.getElementsByClassName("effect")[0].style.display = task instanceof Skill ? "block" : "none";
		
		let skipSkillElement = row.getElementsByClassName("skipSkill")[0];
		skipSkillElement.style.display = task instanceof Skill && autoLearnElement.checked ? "block" : "none";
		
		if (task instanceof Job) {
			formatMoney(task.getIncome(), valueElement.getElementsByClassName("income")[0]);
		} else {
			valueElement.getElementsByClassName("effect")[0].textContent = task.getEffectDescription();
		}
	}
}

function updateItemRows() {
	for (let key in gameData.itemData) {
		let item = gameData.itemData[key];
		let row = document.getElementById("row " + item.name);
		let button = row.getElementsByClassName("button")[0];
		button.disabled = gameData.coins < item.getExpense();
		let active = row.getElementsByClassName("active")[0];
		let color = itemCategories["Properties"].includes(item.name) ? headerRowColors["Properties"] : headerRowColors["Misc"];
		active.style.backgroundColor = gameData.currentMisc.includes(item) || item == gameData.currentProperty ? color : "white";
		row.getElementsByClassName("effect")[0].textContent = item.getEffectDescription();
		formatMoney(item.getExpense(), row.getElementsByClassName("expense")[0]);
	}
}

function updateHeaderRows(categories) {
	for (let categoryName in categories) {
		let className = removeSpaces(categoryName);
		let headerRow = document.getElementsByClassName(className)[0];
		let maxLevelElement = headerRow.getElementsByClassName("maxLevel")[0];
		gameData.rebirthOneCount > 0 ? maxLevelElement.classList.remove("hidden") : maxLevelElement.classList.add("hidden");
		let skipSkillElement = headerRow.getElementsByClassName("skipSkill")[0];
		skipSkillElement.style.display = categories == skillCategories && autoLearnElement.checked ? "block" : "none";
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
}
