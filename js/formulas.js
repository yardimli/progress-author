// Multipliers, income, expenses, game speed

function getCurvedQuality(rawQuality) {
	// Asymptotic curve: Compresses an infinitely growing number into a 0 - 100% scale
	return 100 * (1 - (100 / (rawQuality + 100)));
}

// Added: Get combined multiplier for a specific badge effect type
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

function addMultipliers() {
	for (let taskName in gameData.taskData) {
		let task = gameData.taskData[taskName];
		
		task.xpMultipliers = [];
		if (task instanceof Job) task.incomeMultipliers = [];
		
		task.xpMultipliers.push(task.getMaxLevelMultiplier.bind(task));
		task.xpMultipliers.push(getInspiration);
		task.xpMultipliers.push(getBindedTaskEffect("Brand Management"));
		task.xpMultipliers.push(getBindedTaskEffect("Personal Brand"));
		task.xpMultipliers.push(() => getBadgeMultiplier("allXp")); // Added: Badge multiplier for all XP
		
		if (task instanceof Job) {
			task.incomeMultipliers.push(task.getLevelMultiplier.bind(task));
			task.incomeMultipliers.push(getBindedTaskEffect("Royalty Negotiation"));
			task.incomeMultipliers.push(() => getBadgeMultiplier("jobIncome")); // Added: Badge multiplier for job income
			
			task.xpMultipliers.push(getBindedTaskEffect("Time Management"));
			// Modified: Replaced Editor with Bus Pass for Job XP
			task.xpMultipliers.push(getBindedItemEffect("Bus Pass"));
			task.xpMultipliers.push(() => getBadgeMultiplier("jobXp")); // Added: Badge multiplier for job XP
		} else if (task instanceof Skill) {
			task.xpMultipliers.push(getBindedTaskEffect("Focus"));
			// Modified: Replaced Library Card, Home Office, and Home Library with new items for Skill XP
			task.xpMultipliers.push(getBindedItemEffect("Planner"));
			task.xpMultipliers.push(getBindedItemEffect("Focus Supplements"));
			task.xpMultipliers.push(getBindedItemEffect("Networking Membership"));
			task.xpMultipliers.push(() => getBadgeMultiplier("skillXp")); // Added: Badge multiplier for skill XP
		}
		
		if (jobCategories["Creative Industry"].includes(task.name)) {
			task.xpMultipliers.push(getBindedTaskEffect("Grammar & Prose"));
			// Modified: Replaced Style Guide with Industry Magazine for Creative Industry XP
			task.xpMultipliers.push(getBindedItemEffect("Industry Magazine"));
			task.xpMultipliers.push(() => getBadgeMultiplier("creativeXp")); // Added: Badge multiplier for creative XP
		} else if (task.name === "Typing Speed") {
			task.xpMultipliers.push(getBindedTaskEffect("Character Dev."));
			// Modified: Replaced Used Laptop with Smart Assistant for Typing Speed XP
			task.xpMultipliers.push(getBindedItemEffect("Smart Assistant"));
		} else if (skillCategories["Writing Craft"].includes(task.name)) {
			// Modified: Replaced Pro Writing Software with Masterclass Subscription for Writing Craft XP
			task.xpMultipliers.push(getBindedItemEffect("Masterclass Subscription"));
		} else if (jobCategories["Literary Elite"].includes(task.name)) {
			task.xpMultipliers.push(getBindedTaskEffect("Plotting"));
			task.xpMultipliers.push(() => getBadgeMultiplier("literaryXp")); // Added: Badge multiplier for literary XP
		} else if (skillCategories["The Business of Writing"].includes(task.name)) {
			task.xpMultipliers.push(getFame);
		}
	}
	
	for (let itemName in gameData.itemData) {
		let item = gameData.itemData[itemName];
		item.expenseMultipliers = [];
		item.expenseMultipliers.push(getBindedTaskEffect("Frugality"));
		item.expenseMultipliers.push(getBindedTaskEffect("Public Speaking"));
		item.expenseMultipliers.push(() => getBadgeMultiplier("expense")); // Added: Badge multiplier for expenses
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
	// Modified: Replaced Ergonomic Chair with Coffee Machine for Inspiration
	let chairEffect = getBindedItemEffect("Coffee Machine");
	let potionMultiplier = gameData.potions.inspiration > 0 ? 2.0 : 1.0;
	return meditationEffect() * chairEffect() * gameData.currentProperty.getEffect() * potionMultiplier;
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
	let badgeMultiplier = getBadgeMultiplier("fameGain"); // Added: Badge multiplier for fame gain
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
	// Apply work percentage to active job income
	// Modified: If not writing a book, work percentage is always 100%
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
