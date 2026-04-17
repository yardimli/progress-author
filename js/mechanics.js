// Writing process, rebirth, death

function applyExpenses() {
	let coins = applySpeed(getExpense());
	gameData.coins -= coins;
	if (gameData.coins < 0) {
		goBankrupt();
	}
}

// Check conditions to unlock new tabs
function checkUnlocks() {
	if (!gameData.unlocks.shop && gameData.taskData["Gig Worker"].level >= 3) {
		gameData.unlocks.shop = true;
		queueTutorialModal("Shop Unlocked", "You've earned enough experience to start looking for better living conditions and equipment. The <b>Shop</b> tab is now available!");
		applyUnlocksUI();
	}
	if (!gameData.unlocks.skills && gameData.currentProperty.name === "Rented Room" && gameData.taskData["Gig Worker"].level >= 5) {
		gameData.unlocks.skills = true;
		queueTutorialModal("Skills Unlocked", "With a roof over your head and more experience under your belt, you can now focus on self-improvement. The <b>Skills</b> tab is now available!");
		applyUnlocksUI();
	}
	if (!gameData.unlocks.writing && gameData.coins >= 20000 && gameData.unlocks.shop && gameData.unlocks.skills) {
		gameData.unlocks.writing = true;
		queueTutorialModal("Writing Unlocked", "You've saved up a substantial amount of money. It's time to pursue your true passion. The <b>Writing</b> tab and Work/Writing balance slider are now available!");
		applyUnlocksUI();
	}
}

// Added: New function to check for age-based rebirth prompts
function checkRebirthPrompts() {
	const age = daysToYears(gameData.days);
	if (age >= 65 && !gameData.rebirthOnePrompted) {
		showRebirthOneModal();
		gameData.rebirthOnePrompted = true;
	}
	if (age >= 200 && !gameData.rebirthTwoPrompted) {
		showRebirthTwoModal();
		gameData.rebirthTwoPrompted = true;
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
		if (type === 'inspiration') {
			//make sure player has 20K coins, if not increase coins to 20K
			if (gameData.coins < 20000) {
				gameData.coins = 20000;
				logEvent("Not enough coins to drink Inspiration Potion. Coins increased to $20,000.");
			}
		}
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

function getRawWritingSpeed() {
	let baseSpeed = 100;
	let typingSpeed = gameData.taskData["Typing Speed"] ? gameData.taskData["Typing Speed"].getEffect() : 1;
	let focus = gameData.taskData["Focus"] ? gameData.taskData["Focus"].getEffect() : 1;
	let inspiration = getInspiration();
	let fullTimeBonus = (gameData.currentJob && gameData.currentJob.name === "Full-Time Author") ? 5 : 1;
	
	let writingPercentage = gameData.workWritingBalance / 100;
	
	let itemWritingMultiplier = 1;
	if (gameData.currentProperty && gameData.currentProperty.baseData.writingMultiplier) {
		itemWritingMultiplier *= gameData.currentProperty.baseData.writingMultiplier;
	}
	for (let misc of gameData.currentMisc) {
		if (misc.baseData.writingMultiplier) {
			itemWritingMultiplier *= misc.baseData.writingMultiplier;
		}
	}
	
	return baseSpeed * typingSpeed * focus * inspiration * fullTimeBonus * writingPercentage * gameData.writingMultiplier * gameData.writingXpMultiplier * itemWritingMultiplier;
}

function getWritingSpeed() {
	return Math.min(1000, getRawWritingSpeed());
}

function getQualityMultiplier() {
	let rawSpeed = getRawWritingSpeed();
	if (rawSpeed > 1000) {
		return Math.min(10, rawSpeed / 1000);
	}
	return 1;
}

// Called when the user clicks "Start Writing"
function startWritingBook() {
	if (!gameData.selectedGenre) return;
	pickNextBook(gameData.selectedGenre);
	buildSceneButtons(); // Rebuild buttons to match the new book's genre
	updateUI();
	
	// Reset manual writing state
	gameData.currentBookComposition = {};
	typewriterText = "";
	currentTypewriterSentence = "";
	typewriterIndex = 0;
	isHoldingSceneButton = false;
	clickTypingTimer = 0;
	activeSceneType = null;
	isWaitingToClearLine = false; // Reset line clear flag
	isClearingLine = false; // Reset pause flag
	currentTypingSceneType = null; // Reset typing scene type
}

function pickNextBook(genre) {
	if (!booksBaseData) return;
	let allBooks = Object.keys(booksBaseData);
	let genreBooks = allBooks.filter(id => booksBaseData[id].genre === genre);
	let completedIds = gameData.completedBooks.map(b => b.id);
	let availableBooks = genreBooks.filter(id => !completedIds.includes(id));
	
	// Fallback if all books in the selected genre have been written
	if (availableBooks.length === 0) {
		availableBooks = genreBooks;
	}
	
	// Ultimate fallback if genre doesn't exist in books
	if (availableBooks.length === 0) {
		availableBooks = allBooks;
	}
	
	let randomIndex = Math.floor(Math.random() * availableBooks.length);
	gameData.currentBook = availableBooks[randomIndex];
	gameData.wordsWritten = 0; // Reset progress for the new book
}

function getLifeExperiences() {
	let exp = { hardship: 0, observation: 0, escapism: 0, exposure: 0, social: 0 };
	for (let key in gameData.taskData) {
		let task = gameData.taskData[key];
		if (task instanceof Job && task.level > 0) {
			exp.hardship += task.level * task.hardship;
			exp.observation += task.level * task.observation;
			exp.escapism += task.level * task.escapism;
			exp.exposure += task.level * task.exposure;
			exp.social += task.level * task.social;
		}
	}
	
	// Apply author starting multipliers
	if (gameData.currentAuthor && authorsBaseData && authorsBaseData[gameData.currentAuthor]) {
		let authorMults = authorsBaseData[gameData.currentAuthor].multipliers;
		if (authorMults) {
			exp.hardship *= (authorMults.hardship || 1);
			exp.observation *= (authorMults.observation || 1);
			exp.escapism *= (authorMults.escapism || 1);
			exp.exposure *= (authorMults.exposure || 1);
			exp.social *= (authorMults.social || 1);
		}
	}
	
	return exp;
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
	
	let baseSkillQuality = (grammar + plotting + charDev) / 3;
	if (baseSkillQuality === 0) {
		baseSkillQuality = 0.3;
	}
	
	let lifeExp = getLifeExperiences();
	let expMultiplier = 1;
	
	// Determine which genre to use for calculating multipliers
	let currentGenre = "Romance"; // Default fallback
	if (gameData.currentBook && booksBaseData && booksBaseData[gameData.currentBook]) {
		currentGenre = booksBaseData[gameData.currentBook].genre;
	} else if (gameData.selectedGenre) {
		currentGenre = gameData.selectedGenre;
	}
	
	let genreMults = (typeof genresBaseData !== 'undefined' && genresBaseData[currentGenre]) ? genresBaseData[currentGenre] : null;
	
	// Dynamically calculate the multiplier using genre data
	if (genreMults) {
		for (let key in genreMults) {
			let expValue = lifeExp[key.toLowerCase()] || 0;
			let multValue = genreMults[key];
			expMultiplier += Math.log10(expValue + 1) * multValue;
		}
	} else if (typeof lifeExperiencesBaseData !== 'undefined') {
		// Fallback to old logic if genres.json fails
		for (let key in lifeExperiencesBaseData) {
			let expData = lifeExperiencesBaseData[key];
			let expValue = lifeExp[key.toLowerCase()] || 0;
			let multValue = expData.multiplier || 0.1;
			expMultiplier += Math.log10(expValue + 1) * multValue;
		}
	} else {
		// Ultimate fallback
		expMultiplier += (Math.log10(lifeExp.hardship + 1) * 0.1)
			+ (Math.log10(lifeExp.observation + 1) * 0.1)
			+ (Math.log10(lifeExp.escapism + 1) * 0.1)
			+ (Math.log10(lifeExp.exposure + 1) * 0.1)
			+ (Math.log10(lifeExp.social + 1) * 0.1);
	}
	
	let itemQualityMultiplier = 1;
	if (gameData.currentProperty && gameData.currentProperty.baseData.writingQuality) {
		itemQualityMultiplier *= gameData.currentProperty.baseData.writingQuality;
	}
	for (let misc of gameData.currentMisc) {
		if (misc.baseData.writingQuality) {
			itemQualityMultiplier *= misc.baseData.writingQuality;
		}
	}
	
	// Added: Calculate total skill writing quality multiplier
	let skillQualityMultiplier = 1;
	for (let key in gameData.taskData) {
		let task = gameData.taskData[key];
		if (task instanceof Skill) {
			skillQualityMultiplier *= task.getWritingQuality();
		}
	}
	
	// Modified: Include skillQualityMultiplier in the final calculation
	return baseSkillQuality * expMultiplier * itemQualityMultiplier * skillQualityMultiplier;
}

// Calculate the composition multiplier based on how close the player matched the genre ideals
function getCompositionMultiplier() {
	if (!gameData.currentBookComposition) return 1;
	
	let currentGenre = "Romance";
	if (gameData.currentBook && booksBaseData && booksBaseData[gameData.currentBook]) {
		currentGenre = booksBaseData[gameData.currentBook].genre;
	} else if (gameData.selectedGenre) {
		currentGenre = gameData.selectedGenre;
	}
	
	let ideals = genreIdealsBaseData ? genreIdealsBaseData[currentGenre] : null;
	if (!ideals) return 1;
	
	let totalWords = 0;
	for (let key in gameData.currentBookComposition) {
		totalWords += gameData.currentBookComposition[key];
	}
	
	if (totalWords === 0) return 0.1;
	
	let distance = 0;
	// Check all scene types present in either the composition or the ideals
	let allSceneTypes = new Set([...Object.keys(gameData.currentBookComposition), ...Object.keys(ideals)]);
	
	for (let sceneType of allSceneTypes) {
		let actualPct = (gameData.currentBookComposition[sceneType] || 0) / totalWords;
		let idealPct = ideals[sceneType] || 0;
		distance += Math.abs(actualPct - idealPct);
	}
	
	// Max distance is 3.0. Map distance 0 -> 3.0 multiplier, distance 3.0 -> 0.15 multiplier
	let multiplier = 3.0 - (distance * 0.95);
	if (multiplier < 0.15) multiplier = 0.15;
	if (multiplier > 3.0) multiplier = 3.0;
	
	return multiplier;
}

// Manual Writing Progress Function
function writeProgress(sceneType, timeInSeconds) {
	if (!gameData.currentBook) return;
	
	let speedPerSecond = getWritingSpeed();
	let words = speedPerSecond * getGameSpeed() * timeInSeconds;
	
	if (words <= 0) return;
	
	gameData.wordsWritten += words;
	
	if (!gameData.currentBookComposition) {
		gameData.currentBookComposition = {};
	}
	if (!gameData.currentBookComposition[sceneType]) {
		gameData.currentBookComposition[sceneType] = 0;
	}
	gameData.currentBookComposition[sceneType] += words;
	
	let target = getBookLength();
	if (gameData.wordsWritten >= target) {
		finishBook();
	}
}

// Interaction Handlers
function handleSceneClick(sceneType) {
	activeSceneType = sceneType;
	nextSceneType = sceneType; // Queue the genre for the typewriter
	clickTypingTimer = 1.0; // 1 second of typing/progress
	if (typeof updateUI === 'function') updateUI();
}

function handleSceneHoldStart(sceneType) {
	isHoldingSceneButton = true;
	activeSceneType = sceneType;
	nextSceneType = sceneType; // Queue the genre for the typewriter
	clickTypingTimer = 0; // Override click timer
}

function handleSceneHoldEnd() {
	isHoldingSceneButton = false;
	clickTypingTimer = 0; // Clear click timer to stop instantly on release
	activeSceneType = null;
}

function finishBook() {
	let baseQuality = getBookQuality();
	let qualityMultiplier = getQualityMultiplier();
	let compMultiplier = getCompositionMultiplier();
	
	let quality = baseQuality * qualityMultiplier * compMultiplier;
	let fame = gameData.fame;
	let sales = (quality / 100) * (fame + 10) * 5;
	let royalty = sales * 0.1;
	
	if (royalty < 0.10) {
		royalty = 0.10;
	}
	
	gameData.royalties += royalty;
	gameData.booksPublished += 1;
	
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
			quality: quality
		});
	}
	
	// Added: Show the book finished modal before resetting currentBook
	if (typeof showBookFinishedModal === 'function') {
		showBookFinishedModal(gameData.currentBook, quality, royalty);
	}
	
	// Stop writing and wait for the player to select the next genre
	gameData.currentBook = null;
	gameData.wordsWritten = 0;
	gameData.currentBookComposition = {};
	typewriterText = "";
	currentTypewriterSentence = ""; // Reset sentence
	typewriterIndex = 0; // Reset index
	isHoldingSceneButton = false; // Reset hold state
	clickTypingTimer = 0; // Reset click timer
	activeSceneType = null; // Clear active scene
	isWaitingToClearLine = false; // Reset line clear flag
	isClearingLine = false; // Reset pause flag
	currentTypingSceneType = null; // Reset typing scene type
	document.getElementById('liveWritingText').innerHTML = '<span class="blinking-cursor">|</span>';
}

function rebirthOne() {
	gameData.rebirthOneCount += 1;
	logEvent("Retired and started a new chapter. Legacy bonuses updated.");
	rebirthReset();
	closeRetirementModal(); // Added: Close modal after action
	closeRebirthOneModal(); // Added: Close modal after action
}

function rebirthTwo() {
	gameData.rebirthTwoCount += 1;
	let fameGain = getFameGain();
	gameData.fame += fameGain;
	logEvent(`Retired as a Legend. Gained ${fameGain.toFixed(1)} Fame!`);
	
	rebirthReset();
	closeRetirementModal(); // Added: Close modal after action
	closeRebirthTwoModal(); // Added: Close modal after action
	
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
	
	gameData.currentBook = null;
	gameData.completedBooks = [];
	
	// Added: Reset rebirth prompt flags
	gameData.rebirthOnePrompted = false;
	gameData.rebirthTwoPrompted = false;
	
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
	// Modified: Instead of showing text, this now triggers a non-closable retirement modal.
	if (!condition) {
		gameData.days = getLifespan();
		showRetirementModal(); // Show the forced retirement modal
		if (!gameData.loggedDeath) {
			logEvent("You have reached your retirement age. It's time to retire.");
			gameData.loggedDeath = true;
		}
	} else {
		gameData.loggedDeath = false;
	}
	return condition;
}
