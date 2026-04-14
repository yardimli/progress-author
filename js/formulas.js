// Multipliers, income, expenses, game speed

function getBindedTaskEffect(taskName) {
	let task = gameData.taskData[taskName];
	return task ? task.getEffect.bind(task) : () => 1;
}

function getBindedItemEffect(itemName) {
	let item = gameData.itemData[itemName];
	return item ? item.getEffect.bind(item) : () => 1;
}

function addMultipliers() {
	for (let taskName in gameData.taskData) {
		let task = gameData.taskData[taskName];
		
		task.xpMultipliers = [];
		if (task instanceof Job) task.incomeMultipliers = [];
		
		task.xpMultipliers.push(task.getMaxLevelMultiplier.bind(task));
		task.xpMultipliers.push(getInspiration);
		task.xpMultipliers.push(getBindedTaskEffect("Brand Management"));
		task.xpMultipliers.push(getBindedTaskEffect("Personal Brand"));
		
		if (task instanceof Job) {
			task.incomeMultipliers.push(task.getLevelMultiplier.bind(task));
			task.incomeMultipliers.push(getBindedTaskEffect("Royalty Negotiation"));
			task.xpMultipliers.push(getBindedTaskEffect("Time Management"));
			task.xpMultipliers.push(getBindedItemEffect("Editor"));
		} else if (task instanceof Skill) {
			task.xpMultipliers.push(getBindedTaskEffect("Focus"));
			task.xpMultipliers.push(getBindedItemEffect("Library Card"));
			task.xpMultipliers.push(getBindedItemEffect("Home Office"));
			task.xpMultipliers.push(getBindedItemEffect("Home Library"));
		}
		
		if (jobCategories["Creative Industry"].includes(task.name)) {
			task.xpMultipliers.push(getBindedTaskEffect("Grammar & Prose"));
			task.xpMultipliers.push(getBindedItemEffect("Style Guide"));
		} else if (task.name === "Typing Speed") {
			task.xpMultipliers.push(getBindedTaskEffect("Character Dev."));
			task.xpMultipliers.push(getBindedItemEffect("Used Laptop"));
		} else if (skillCategories["Writing Craft"].includes(task.name)) {
			task.xpMultipliers.push(getBindedItemEffect("Pro Writing Software"));
		} else if (jobCategories["Literary Elite"].includes(task.name)) {
			task.xpMultipliers.push(getBindedTaskEffect("Plotting"));
		} else if (skillCategories["The Business of Writing"].includes(task.name)) {
			task.xpMultipliers.push(getFame);
		}
	}
	
	for (let itemName in gameData.itemData) {
		let item = gameData.itemData[itemName];
		item.expenseMultipliers = [];
		item.expenseMultipliers.push(getBindedTaskEffect("Frugality"));
		item.expenseMultipliers.push(getBindedTaskEffect("Public Speaking"));
	}
}

function setCustomEffects() {
	let frugality = gameData.taskData["Frugality"];
	frugality.getEffect = function() {
		let multiplier = 1 - getBaseLog(7, frugality.level + 1) / 10;
		if (multiplier < 0.1) { multiplier = 0.1; }
		return multiplier;
	};
	
	let publicSpeaking = gameData.taskData["Public Speaking"];
	publicSpeaking.getEffect = function() {
		let multiplier = 1 - getBaseLog(7, publicSpeaking.level + 1) / 10;
		if (multiplier < 0.1) { multiplier = 0.1; }
		return multiplier;
	};
	
	let flowState = gameData.taskData["Flow State"];
	flowState.getEffect = function() {
		return 1 + getBaseLog(13, flowState.level + 1);
	};
	
	let healthyLifestyle = gameData.taskData["Healthy Lifestyle"];
	healthyLifestyle.getEffect = function() {
		return 1 + getBaseLog(33, healthyLifestyle.level + 1);
	};
}

function getInspiration() {
	let meditationEffect = getBindedTaskEffect("Meditation");
	let chairEffect = getBindedItemEffect("Ergonomic Chair");
	return meditationEffect() * chairEffect() * gameData.currentProperty.getEffect();
}

function getFame() {
	return gameData.fame === 0 ? 1 : gameData.fame;
}

function applyMultipliers(value, multipliers) {
	let finalMultiplier = 1;
	multipliers.forEach(function(multiplierFunction) {
		finalMultiplier *= multiplierFunction();
	});
	return Math.round(value * finalMultiplier);
}

function applySpeed(value) {
	return value * getGameSpeed() * deltaTime;
}

function getFameGain() {
	let networking = gameData.taskData["Networking"] ? gameData.taskData["Networking"].getEffect() : 1;
	let mediaTours = gameData.taskData["Media Tours"] ? gameData.taskData["Media Tours"].getEffect() : 1;
	return gameData.booksPublished * networking * mediaTours;
}

function getGameSpeed() {
	let flowState = gameData.taskData["Flow State"];
	let flowStateSpeed = gameData.timeWarpingEnabled && flowState ? flowState.getEffect() : 1;
	return baseGameSpeed * +!gameData.paused * +isAlive() * flowStateSpeed;
}

function getIncome() {
	let income = 0;
	income += gameData.currentJob.getIncome();
	income += gameData.royalties;
	return income;
}

function getExpense() {
	let expense = 0;
	expense += gameData.currentProperty.getExpense();
	for (let misc of gameData.currentMisc) {
		expense += misc.getExpense();
	}
	return expense;
}

function getNet() {
	return Math.abs(getIncome() - getExpense());
}
