// Multipliers, income, expenses, game speed

function getCurvedQuality(rawQuality) {
	// Asymptotic curve: Compresses an infinitely growing number into a 0 - 100% scale
	return 100 * (1 - (100 / (rawQuality + 100)));
}

// Get combined multiplier for a specific badge effect type
function getBadgeMultiplier(type) {
	let multiplier = 1;
	if (!badgeBaseData) return 1;
	
	for (const badgeId of gameData.earnedBadges) {
		const badge = badgeBaseData[badgeId];
		if (badge && badge.effect && badge.effect.type === type) {
			// For lifespan, the value is additive, not multiplicative
			if (type === 'lifespan') {
				multiplier += badge.effect.value;
			} else {
				multiplier *= badge.effect.value;
			}
		}
	}
	// For lifespan, we return the total years to add, not a multiplier
	return type === 'lifespan' ? multiplier - 1 : multiplier;
}


function getBindedTaskEffect(taskName) {
	let task = gameData.taskData[taskName];
	return task ? task.getEffect.bind(task) : () => 1;
}

function getBindedItemEffect(itemName) {
	let item = gameData.itemData[itemName];
	return item ? item.getEffect.bind(item) : () => 1;
}

// Helper to dynamically apply multipliers based on JSON descriptions
function createDynamicMultiplier(validDescriptions) {
	let matchingSkills = [];
	let matchingItems = [];
	
	// Find all matching skills and items once during setup
	for (const taskName in gameData.taskData) {
		const task = gameData.taskData[taskName];
		if (task instanceof Skill && validDescriptions.includes(task.baseData.description)) {
			matchingSkills.push(task);
		}
	}
	
	for (const itemName in gameData.itemData) {
		const item = gameData.itemData[itemName];
		if (validDescriptions.includes(item.baseData.description)) {
			matchingItems.push(item);
		}
	}
	
	// Return a closure that iterates the pre-filtered arrays for maximum performance
	return () => {
		let multi = 1;
		for (let i = 0; i < matchingSkills.length; i++) {
			multi *= matchingSkills[i].getEffect();
		}
		for (let i = 0; i < matchingItems.length; i++) {
			multi *= matchingItems[i].getEffect();
		}
		return multi;
	};
}

function addMultipliers() {
	// Pre-create the dynamic multiplier functions so we don't recreate them for every task
	const allXpMulti = createDynamicMultiplier(["All experience"]);
	const jobIncomeMulti = createDynamicMultiplier(["Job pay"]);
	const jobXpMulti = createDynamicMultiplier(["Job ex.", "Job XP"]);
	const skillXpMulti = createDynamicMultiplier(["Skill ex.", "Skill XP"]);
	const creativeXpMulti = createDynamicMultiplier(["Creative Industry experience"]);
	const typingSpeedMulti = createDynamicMultiplier(["Typing Speed", "Typing Speed experience"]);
	const writingCraftMulti = createDynamicMultiplier(["Writing Craft experience"]);
	const literaryXpMulti = createDynamicMultiplier(["Literary Elite experience"]);
	const expenseMulti = createDynamicMultiplier(["Expenses"]);
	
	for (let taskName in gameData.taskData) {
		let task = gameData.taskData[taskName];
		
		task.xpMultipliers = [];
		if (task instanceof Job) task.incomeMultipliers = [];
		
		task.xpMultipliers.push(task.getMaxLevelMultiplier.bind(task));
		task.xpMultipliers.push(getInspiration);
		
		// Use dynamic category lookup instead of hardcoded strings
		task.xpMultipliers.push(allXpMulti);
		task.xpMultipliers.push(() => getBadgeMultiplier("allXp"));
		
		if (task instanceof Job) {
			task.incomeMultipliers.push(task.getLevelMultiplier.bind(task));
			task.incomeMultipliers.push(jobIncomeMulti);
			task.incomeMultipliers.push(() => getBadgeMultiplier("jobIncome"));
			
			task.xpMultipliers.push(jobXpMulti);
			task.xpMultipliers.push(() => getBadgeMultiplier("jobXp"));
		} else if (task instanceof Skill) {
			task.xpMultipliers.push(skillXpMulti);
			task.xpMultipliers.push(() => getBadgeMultiplier("skillXp"));
		}
		
		if (jobCategories["Creative Industry"].includes(task.name)) {
			task.xpMultipliers.push(creativeXpMulti);
			task.xpMultipliers.push(() => getBadgeMultiplier("creativeXp"));
		} else if (task.name === "Typing Speed") {
			task.xpMultipliers.push(typingSpeedMulti);
		} else if (skillCategories["Writing Craft"].includes(task.name)) {
			task.xpMultipliers.push(writingCraftMulti);
		} else if (jobCategories["Literary Elite"].includes(task.name)) {
			task.xpMultipliers.push(literaryXpMulti);
			task.xpMultipliers.push(() => getBadgeMultiplier("literaryXp"));
		} else if (skillCategories["The Business of Writing"].includes(task.name)) {
			task.xpMultipliers.push(getFame);
		}
	}
	
	for (let itemName in gameData.itemData) {
		let item = gameData.itemData[itemName];
		item.expenseMultipliers = [];
		item.expenseMultipliers.push(expenseMulti);
		item.expenseMultipliers.push(() => getBadgeMultiplier("expense"));
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
	let potionMultiplier = gameData.potions.inspiration > 0 ? 2.0 : 1.0;
	
	let itemMultiplier = 1;
	
	// Apply current property effect
	if (gameData.currentProperty) {
		itemMultiplier *= gameData.currentProperty.getEffect();
	}
	
	// Apply current transportation effect if it provides Inspiration
	if (gameData.currentTransportation && gameData.currentTransportation.baseData.description === "Inspiration") {
		itemMultiplier *= gameData.currentTransportation.getEffect();
	}
	
	// Iterate through all owned misc items to dynamically apply Inspiration effects
	for (let misc of gameData.currentMisc) {
		if (misc.baseData.description === "Inspiration") {
			itemMultiplier *= misc.getEffect();
		}
	}
	
	return meditationEffect() * itemMultiplier * potionMultiplier;
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
	let badgeMultiplier = getBadgeMultiplier("fameGain");
	return gameData.booksPublished * networking * mediaTours * badgeMultiplier;
}

function getGameSpeed() {
	let flowState = gameData.taskData["Flow State"];
	let flowStateSpeed = gameData.timeWarpingEnabled && flowState ? flowState.getEffect() : 1;
	let potionMultiplier = gameData.potions.acceleration > 0 ? 2.0 : 1.0;
	return baseGameSpeed * +isAlive() * flowStateSpeed * potionMultiplier;
}

function getIncome() {
	let income = 0;
	// Apply work percentage to active job income if not writing a book, work percentage is always 100%
	const workPercentage = (gameData.currentBook) ? (100 - gameData.workWritingBalance) / 100 : 1;
	income += gameData.currentJob.getIncome() * workPercentage;
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
