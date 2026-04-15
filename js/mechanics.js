// Writing process, rebirth, death

function applyExpenses() {
	let coins = applySpeed(getExpense());
	gameData.coins -= coins;
	if (gameData.coins < 0) {
		goBankrupt();
	}
}

function goBankrupt() {
	gameData.coins = 0;
	gameData.currentProperty = gameData.itemData["Homeless"];
	gameData.currentMisc = [];
	logEvent("Ran out of money and went bankrupt! Lost all housing and equipment.");
}

function setTimeWarping() {
	gameData.timeWarpingEnabled = !gameData.timeWarpingEnabled;
}

function setTask(taskName) {
	let task = gameData.taskData[taskName];
	task instanceof Job ? gameData.currentJob = task : gameData.currentSkill = task;
}

function setProperty(propertyName) {
	let property = gameData.itemData[propertyName];
	if (gameData.currentProperty !== property) {
		gameData.currentProperty = property;
		logEvent(`Moved into ${property.name}.`);
	}
}

function setMisc(miscName) {
	let misc = gameData.itemData[miscName];
	if (gameData.currentMisc.includes(misc)) {
		for (let i = 0; i < gameData.currentMisc.length; i++) {
			if (gameData.currentMisc[i] == misc) {
				gameData.currentMisc.splice(i, 1);
				logEvent(`Stopped using ${misc.name}.`);
			}
		}
	} else {
		gameData.currentMisc.push(misc);
		logEvent(`Started using ${misc.name}.`);
	}
}

function drinkPotion(type) {
	if (gameData.potions[type] <= 0) {
		gameData.potions[type] = 600; // 10 minutes in seconds
		logEvent(`Drank ${type === 'inspiration' ? 'Inspiration' : 'Acceleration'} Potion!`);
	}
}

function doCurrentTask(task) {
	if (!task) return;
	task.increaseXp();
	if (task instanceof Job) {
		increaseCoins();
	}
}

function increaseCoins() {
	let coins = applySpeed(getIncome());
	gameData.coins += coins;
}

function increaseDays() {
	let increase = applySpeed(1);
	gameData.days += increase;
}

// Calculates the raw writing speed before the 1000 words/day cap
function getRawWritingSpeed() {
	let baseSpeed = 100;
	let typingSpeed = gameData.taskData["Typing Speed"] ? gameData.taskData["Typing Speed"].getEffect() : 1;
	let focus = gameData.taskData["Focus"] ? gameData.taskData["Focus"].getEffect() : 1;
	let inspiration = getInspiration();
	let fullTimeBonus = (gameData.currentJob && gameData.currentJob.name === "Full-Time Author") ? 5 : 1;
	
	// Apply writing percentage from the slider
	let writingPercentage = gameData.workWritingBalance / 100;
	
	// MODIFIED: Calculate combined item writing multipliers
	let itemWritingMultiplier = 1;
	if (gameData.currentProperty && gameData.currentProperty.baseData.writingMultiplier) {
		itemWritingMultiplier *= gameData.currentProperty.baseData.writingMultiplier;
	}
	for (let misc of gameData.currentMisc) {
		if (misc.baseData.writingMultiplier) {
			itemWritingMultiplier *= misc.baseData.writingMultiplier;
		}
	}
	
	// MODIFIED: Apply the global writing multiplier and item multipliers
	return baseSpeed * typingSpeed * focus * inspiration * fullTimeBonus * writingPercentage * gameData.writingMultiplier * itemWritingMultiplier;
}

// Caps writing speed at 1000 words/day
function getWritingSpeed() {
	return Math.min(1000, getRawWritingSpeed());
}

// Converts excess writing speed into a quality multiplier (Max x10)
function getQualityMultiplier() {
	let rawSpeed = getRawWritingSpeed();
	if (rawSpeed > 1000) {
		return Math.min(10, rawSpeed / 1000);
	}
	return 1;
}

function pickNextBook() {
	if (!booksBaseData) return;
	let allBooks = Object.keys(booksBaseData);
	let completedIds = gameData.completedBooks.map(b => b.id);
	let availableBooks = allBooks.filter(id => !completedIds.includes(id));
	
	if (availableBooks.length === 0) {
		availableBooks = allBooks;
	}
	
	let randomIndex = Math.floor(Math.random() * availableBooks.length);
	gameData.currentBook = availableBooks[randomIndex];
}

function getBookLength() {
	if (gameData.currentBook && booksBaseData && booksBaseData[gameData.currentBook]) {
		return booksBaseData[gameData.currentBook].wordCount;
	}
	let plottingLvl = gameData.taskData["Plotting"] ? gameData.taskData["Plotting"].level : 0;
	return (50 + (plottingLvl * 2)) * 250;
}

function getBookQuality() {
	let grammar = gameData.taskData["Grammar & Prose"] ? gameData.taskData["Grammar & Prose"].level : 0;
	let plotting = gameData.taskData["Plotting"] ? gameData.taskData["Plotting"].level : 0;
	let charDev = gameData.taskData["Character Dev."] ? gameData.taskData["Character Dev."].level : 0;
	return (grammar + plotting + charDev) / 3;
}

function updateWritingProcess() {
	let speed = applySpeed(getWritingSpeed());
	gameData.wordsWritten += speed;
	
	let target = getBookLength();
	
	while (gameData.wordsWritten >= target) {
		// Apply quality multiplier and enforce minimum royalty
		let baseQuality = getBookQuality();
		let multiplier = getQualityMultiplier();
		let quality = baseQuality * multiplier;
		let fame = gameData.fame;
		let sales = (quality / 100) * (fame + 10) * 5;
		let royalty = sales * 0.1;
		
		if (royalty < 0.10) {
			royalty = 0.10;
		}
		
		gameData.royalties += royalty;
		gameData.booksPublished += 1;
		gameData.wordsWritten -= target;
		
		let bookTitle = booksBaseData[gameData.currentBook] ? booksBaseData[gameData.currentBook].title : "Unknown Book";
		logEvent(`Published Book #${gameData.booksPublished}: "${bookTitle}"! Quality: ${quality.toFixed(1)}%. Earned $${format(royalty)}/day in royalties.`);
		
		let bookAge = daysToYears(gameData.days);
		let bookDay = getDay();
		
		let alreadyCompleted = gameData.completedBooks.some(b => b.id === gameData.currentBook);
		if (!alreadyCompleted) {
			gameData.completedBooks.push({
				id: gameData.currentBook,
				age: bookAge,
				day: bookDay,
				royalties: royalty,
				quality: quality // Save the final quality for the UI
			});
		}
		
		pickNextBook();
		target = getBookLength();
	}
}

function rebirthOne() {
	gameData.rebirthOneCount += 1;
	logEvent("Retired and started a new chapter. Legacy bonuses updated.");
	rebirthReset();
}

function rebirthTwo() {
	gameData.rebirthTwoCount += 1;
	let fameGain = getFameGain();
	gameData.fame += fameGain;
	logEvent(`Retired as a Legend. Gained ${fameGain.toFixed(1)} Fame!`);
	
	rebirthReset();
	
	for (let taskName in gameData.taskData) {
		let task = gameData.taskData[taskName];
		task.maxLevel = 0;
	}
}

function rebirthReset() {
	setTab(document.getElementById("jobTabButton"), "jobs");
	
	gameData.coins = 0;
	gameData.days = 365 * 18;
	gameData.wordsWritten = 0;
	gameData.booksPublished = 0;
	gameData.royalties = 0;
	gameData.currentJob = gameData.taskData["Gig Worker"];
	gameData.currentSkill = gameData.taskData["Focus"];
	gameData.currentProperty = gameData.itemData["Homeless"];
	gameData.currentMisc = [];
	
	gameData.currentAuthor = null;
	gameData.currentBook = null;
	gameData.completedBooks = [];
	if (authorsBaseData) {
		let authorKeys = Object.keys(authorsBaseData);
		gameData.currentAuthor = authorKeys[Math.floor(Math.random() * authorKeys.length)];
	}
	pickNextBook();
	
	for (let taskName in gameData.taskData) {
		let task = gameData.taskData[taskName];
		if (task.level > task.maxLevel) task.maxLevel = task.level;
		task.level = 0;
		task.xp = 0;
	}
	
	for (let key in gameData.requirements) {
		let requirement = gameData.requirements[key];
		requirement.completed = false;
	}
}

function getLifespan() {
	let healthy = gameData.taskData["Healthy Lifestyle"] ? gameData.taskData["Healthy Lifestyle"].getEffect() : 1;
	let longevity = gameData.taskData["Longevity Secrets"] ? gameData.taskData["Longevity Secrets"].getEffect() : 1;
	return baseLifespan * healthy * longevity;
}

function isAlive() {
	let condition = gameData.days < getLifespan();
	let deathText = document.getElementById("deathText");
	if (!condition) {
		gameData.days = getLifespan();
		deathText.classList.remove("hidden");
		if (!gameData.loggedDeath) {
			logEvent("You have reached your retirement age. It's time to retire.");
			gameData.loggedDeath = true;
		}
	}
	else {
		deathText.classList.add("hidden");
		gameData.loggedDeath = false;
	}
	return condition;
}
