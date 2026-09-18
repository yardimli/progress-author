// Multipliers, income, expenses, game speed

function getCurvedQuality(rawQuality) {
	// Asymptotic curve: Compresses an infinitely growing number into a 0 - 100% scale
    const scale = BALANCE.writing.qualityScale || 100;
    return 100 * (1 - (scale / (rawQuality + scale)));
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
function getEffectType(data) {
    if (data.effectType) return data.effectType;
    if (data.category === 'Properties') return 'inspiration';
    return ({ 'All experience': 'allXp', 'Job pay': 'jobPay', 'Job ex.': 'jobXp', 'Job XP': 'jobXp',
        'Skill ex.': 'skillXp', 'Skill XP': 'skillXp', 'Creative Industry experience': 'creativeXp',
        'Typing Speed': 'typingXp', 'Typing Speed experience': 'typingXp',
        'Writing Craft experience': 'craftXp', 'Literary Elite experience': 'literaryXp',
        Expenses: 'expenses', Inspiration: 'inspiration', 'Writing Speed': 'writingSpeed'
    })[data.description];
}

function getWorkFraction() {
    if (!BALANCE.career.strictAllocation && !gameData.currentBook) return 1;
    return (100 - Math.max(0, Math.min(100, Number(gameData.workWritingBalance) || 0))) / 100;
}

// Learned experience transfers between careers and craft, even after switching jobs.
function getCareerCraftBonus() {
    if (!BALANCE.career.craftExperiencePerLevel) return 1;
    const levels = (jobCategories['Creative Industry'] || []).reduce((sum, name) => sum + (gameData.taskData[name]?.level || 0), 0);
    return 1 + Math.min(BALANCE.career.craftExperienceCap, levels * BALANCE.career.craftExperiencePerLevel);
}

function createDynamicMultiplier(validDescriptions) {
	let matchingSkills = [];
	let matchingItems = [];
	
	// Find all matching skills and items once during setup
	for (const taskName in gameData.taskData) {
		const task = gameData.taskData[taskName];
		if (task instanceof Skill && validDescriptions.includes(getEffectType(task.baseData))) {
			matchingSkills.push(task);
		}
	}
	
	for (const itemName in gameData.itemData) {
		const item = gameData.itemData[itemName];
		if (validDescriptions.includes(getEffectType(item.baseData))) {
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
	const allXpMulti = createDynamicMultiplier(['allXp']);
	const jobIncomeMulti = createDynamicMultiplier(['jobPay']);
	const jobXpMulti = createDynamicMultiplier(['jobXp']);
	const skillXpMulti = createDynamicMultiplier(['skillXp']);
	const creativeXpMulti = createDynamicMultiplier(['creativeXp']);
	const typingSpeedMulti = createDynamicMultiplier(['typingXp']);
	const writingCraftMulti = createDynamicMultiplier(['craftXp']);
	const literaryXpMulti = createDynamicMultiplier(['literaryXp']);
	const expenseMulti = createDynamicMultiplier(['expenses']);
	
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
			if (BALANCE.career.creativePay) task.incomeMultipliers.push(getBindedTaskEffect('Typing Speed'));
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
	if (gameData.currentTransportation && getEffectType(gameData.currentTransportation.baseData) === 'inspiration') {
		itemMultiplier *= gameData.currentTransportation.getEffect();
	}
	
	// Iterate through all owned misc items to dynamically apply Inspiration effects
	for (let misc of gameData.currentMisc) {
		if (getEffectType(misc.baseData) === 'inspiration') {
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

// Preserve early upgrades, with diminishing returns on stacked late-game boosts.
function softenMultiplier(value, threshold = 4) {
	return value <= threshold ? value : threshold * Math.sqrt(value / threshold);
}

function getBookRoyalty(quality) {
	if (BALANCE.writing.salesEnabled) {
		const score = Math.max(0, Math.min(100, quality));
        return (BALANCE.writing.royaltyBase + BALANCE.writing.royaltyQuality * score * Math.sqrt(score / BALANCE.writing.royaltyQualityScale)) * (1 + gameData.readership / BALANCE.writing.readerScale) *
            softenMultiplier(getBindedTaskEffect('Royalty Negotiation')() * getBadgeMultiplier('royalties'), BALANCE.writing.royaltySoftCap);
	}
	const readership = 1 + Math.log10(1 + Math.max(0, gameData.fame));
	const negotiation = getBindedTaskEffect('Royalty Negotiation')();
	const score = Math.max(0, Math.min(100, quality));
	const contract = gameData.booksPublished >= 15 ? 1.3 : gameData.booksPublished >= 5 ? 1.15 : 1;
	const catalogue = Math.sqrt(1 + gameData.booksPublished / BALANCE.writing.catalogueDivisor);
	return (BALANCE.writing.royaltyBase + BALANCE.writing.royaltyQuality * score * Math.sqrt(score / 50)) * readership * contract / catalogue *
		softenMultiplier(negotiation * getBadgeMultiplier('royalties'));
}

function getFameGain() {
	let networking = gameData.taskData["Networking"] ? gameData.taskData["Networking"].getEffect() : 1;
	let mediaTours = gameData.taskData["Media Tours"] ? gameData.taskData["Media Tours"].getEffect() : 1;
	let badgeMultiplier = getBadgeMultiplier("fameGain");
	return gameData.booksPublished * networking * mediaTours * badgeMultiplier;
}

function getGameSpeed() {
	if (BALANCE.writing.salesEnabled && salesStepSpeed !== null) return salesStepSpeed;
	let flowState = gameData.taskData["Flow State"];
	let flowStateSpeed = gameData.timeWarpingEnabled && flowState ? flowState.getEffect() : 1;
	let potionMultiplier = gameData.potions.acceleration > 0 && isAccelerationAvailable() ? getAccelerationMultiplier() : 1;
	return baseGameSpeed * +isAlive() * flowStateSpeed * potionMultiplier;
}

function getIncome() {
	let income = 0;
	// Apply work percentage to active job income if not writing a book, work percentage is always 100%
	const workPercentage = getWorkFraction();
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
