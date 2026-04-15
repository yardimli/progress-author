// LocalStorage, import/export, data assignment

function assignMethods() {
	for (let key in gameData.taskData) {
		let task = gameData.taskData[key];
		if (task.baseData.income !== undefined) {
			task.baseData = jobBaseData[task.name];
			task = Object.assign(new Job(jobBaseData[task.name]), task);
		} else {
			task.baseData = skillBaseData[task.name];
			task = Object.assign(new Skill(skillBaseData[task.name]), task);
		}
		gameData.taskData[key] = task;
	}
	
	for (let key in gameData.itemData) {
		let item = gameData.itemData[key];
		item.baseData = itemBaseData[item.name];
		item = Object.assign(new Item(itemBaseData[item.name]), item);
		gameData.itemData[key] = item;
	}
	
	for (let key in gameData.requirements) {
		let requirement = gameData.requirements[key];
		if (requirement.type == "task") {
			requirement = Object.assign(new TaskRequirement(requirement.elements, requirement.requirements), requirement);
		} else if (requirement.type == "coins") {
			requirement = Object.assign(new CoinRequirement(requirement.elements, requirement.requirements), requirement);
		} else if (requirement.type == "age") {
			requirement = Object.assign(new AgeRequirement(requirement.elements, requirement.requirements), requirement);
		} else if (requirement.type == "fame") {
			requirement = Object.assign(new FameRequirement(requirement.elements, requirement.requirements), requirement);
		}
		
		let tempRequirement = tempData["requirements"][key];
		requirement.elements = tempRequirement.elements;
		requirement.requirements = tempRequirement.requirements;
		gameData.requirements[key] = requirement;
	}
	
	gameData.currentJob = gameData.taskData[gameData.currentJob?.name] || gameData.taskData["Gig Worker"];
	gameData.currentSkill = gameData.taskData[gameData.currentSkill?.name] || gameData.taskData["Focus"];
	gameData.currentProperty = gameData.itemData[gameData.currentProperty?.name] || gameData.itemData["Homeless"];
	
	let newArray = [];
	for (let misc of gameData.currentMisc) {
		if (gameData.itemData[misc?.name]) {
			newArray.push(gameData.itemData[misc.name]);
		}
	}
	gameData.currentMisc = newArray;
}

function replaceSaveDict(dict, saveDict) {
	for (let key in dict) {
		if (!(key in saveDict)) {
			saveDict[key] = dict[key];
		} else if (dict == gameData.requirements) {
			if (saveDict[key].type != tempData["requirements"][key].type) {
				saveDict[key] = tempData["requirements"][key];
			}
		}
	}
	
	for (let key in saveDict) {
		if (!(key in dict)) {
			delete saveDict[key];
		}
	}
}

function saveGameData() {
	localStorage.setItem("authorsJourneySave", JSON.stringify(gameData));
}

function loadGameData() {
	let gameDataSave = JSON.parse(localStorage.getItem("authorsJourneySave"));
	
	if (gameDataSave !== null) {
		replaceSaveDict(gameData, gameDataSave);
		replaceSaveDict(gameData.requirements, gameDataSave.requirements);
		replaceSaveDict(gameData.taskData, gameDataSave.taskData);
		replaceSaveDict(gameData.itemData, gameDataSave.itemData);
		
		gameData = gameDataSave;
		
		// NEW: Backward compatibility for potions
		if (!gameData.potions) {
			gameData.potions = { inspiration: 0, acceleration: 0 };
		}
		
		if (gameData.completedBooks && gameData.completedBooks.length > 0) {
			if (typeof gameData.completedBooks[0] === 'string') {
				gameData.completedBooks = gameData.completedBooks.map(id => ({
					id: id,
					age: "?",
					day: "?",
					royalties: 0
				}));
			}
		}
	}
	
	assignMethods();
}

function resetGameData() {
	localStorage.removeItem("authorsJourneySave");
	location.reload();
}

function importGameData() {
	let importExportBox = document.getElementById("importExportBox");
	let data = JSON.parse(window.atob(importExportBox.value));
	gameData = data;
	saveGameData();
	location.reload();
}

function exportGameData() {
	let importExportBox = document.getElementById("importExportBox");
	importExportBox.value = window.btoa(JSON.stringify(gameData));
}

function setupRequirements(reqData) {
	gameData.requirements = {};
	for (let key in reqData) {
		let req = reqData[key];
		let elements = [];
		for (let el of req.elements) {
			if (el.type === "id") {
				let domEl = document.getElementById(el.value);
				if (domEl) elements.push(domEl);
			} else if (el.type === "class") {
				let cols = document.getElementsByClassName(removeSpaces(el.value));
				for(let i=0; i<cols.length; i++) elements.push(cols[i]);
			}
		}
		
		if (req.type === "task") {
			gameData.requirements[key] = new TaskRequirement(elements, req.requirements);
		} else if (req.type === "coins") {
			gameData.requirements[key] = new CoinRequirement(elements, req.requirements);
		} else if (req.type === "age") {
			gameData.requirements[key] = new AgeRequirement(elements, req.requirements);
		} else if (req.type === "fame") {
			gameData.requirements[key] = new FameRequirement(elements, req.requirements);
		}
	}
}
