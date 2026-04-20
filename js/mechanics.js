// Writing process, rebirth, death

function applyExpenses () {
	const coins = applySpeed(getExpense());
	gameData.coins -= coins;
	if (gameData.coins < 0) {
		goBankrupt();
	}
}

// Check conditions to unlock new tabs
function checkUnlocks () {
	if (!gameData.unlocks.shop && gameData.taskData['Gig Worker'].level >= 3) {
		gameData.unlocks.shop = true;
		queueTutorialModal('Shop Unlocked', 'You\'ve earned enough experience to start looking for better living conditions and equipment. The <b>Shop</b> tab is now available!');
		applyUnlocksUI();
	}
	if (!gameData.unlocks.skills && gameData.currentProperty.name === 'Rented Room' && gameData.taskData['Gig Worker'].level >= 5) {
		gameData.unlocks.skills = true;
		queueTutorialModal('Skills Unlocked', 'With a roof over your head and more experience under your belt, you can now focus on self-improvement. The <b>Skills</b> tab is now available!');
		applyUnlocksUI();
	}
	
	const hasRoof = gameData.currentProperty && gameData.currentProperty.name !== 'Homeless';
	const hasLaptop = gameData.currentMisc && gameData.currentMisc.some(item => item.name === 'Used Laptop');
	
	if (!gameData.unlocks.writing && hasRoof && hasLaptop) {
		gameData.unlocks.writing = true;
		queueTutorialModal('Writing Unlocked', 'With a roof over your head and a laptop to type on, it\'s time to pursue your true passion. The <b>Writing</b> tab and Work/Writing balance slider are now available!');
		applyUnlocksUI();
	}
}

// Added: Function to check for badge unlocks
function checkBadgeUnlocks() {
	if (!badgeBaseData) return;
	
	for (const badgeId in badgeBaseData) {
		if (gameData.earnedBadges.includes(badgeId)) {
			continue; // Already earned
		}
		
		const badge = badgeBaseData[badgeId];
		let allMet = true;
		for (const req of badge.requirements) {
			if (!isRequirementMet(req)) {
				allMet = false;
				break;
			}
		}
		
		if (allMet) {
			gameData.earnedBadges.push(badgeId);
			logEvent(`Badge Earned: <b style="color: #ffd700;">${badge.name}</b>!`);
			// Create a fake image element to pass to the modal queue
			const fakeImgEl = {
				getAttribute: (attr) => {
					if (attr === 'data-name') return badge.name;
					if (attr === 'data-type') return 'badge';
					return null;
				},
				src: `img/${badge.filefolder}256/${badge.filename.replace('.png', '.jpg')}`
			};
			queueInfoModal(fakeImgEl, true, true);
		}
	}
}

// Added: Helper function to check a single badge requirement
function isRequirementMet(req) {
	switch (req.type) {
		case 'task':
			return gameData.taskData[req.task] && gameData.taskData[req.task].level >= req.level;
		case 'books':
			return gameData.booksPublished >= req.value;
		case 'bookQuality':
			return gameData.completedBooks.some(book => book.quality >= req.value);
		case 'jobCategoryLevel': {
			const jobsInCategory = jobCategories[req.category] || [];
			const count = jobsInCategory.filter(jobName => gameData.taskData[jobName] && gameData.taskData[jobName].level >= req.level).length;
			return count >= req.count;
		}
		case 'skillLevelCount': {
			let count = 0;
			for (const skillName in skillBaseData) {
				if (gameData.taskData[skillName] && gameData.taskData[skillName].level >= req.level) {
					count++;
				}
			}
			return count >= req.count;
		}
		case 'maxTaskLevel': {
			const taskType = req.taskType; // "Job" or "Skill"
			const baseData = taskType === "Job" ? jobBaseData : skillBaseData;
			for (const taskName in baseData) {
				if (gameData.taskData[taskName] && gameData.taskData[taskName].level >= req.level) {
					return true;
				}
			}
			return false;
		}
		case 'item':
			return (gameData.currentProperty && gameData.currentProperty.name === req.name) ||
				(gameData.currentMisc && gameData.currentMisc.some(item => item.name === req.name));
		case 'itemCategory': {
			const itemsInCategory = itemCategories[req.category] || [];
			return itemsInCategory.every(itemName =>
				(gameData.currentProperty && gameData.currentProperty.name === itemName) ||
				(gameData.currentMisc && gameData.currentMisc.some(item => item.name === itemName))
			);
		}
		case 'rebirth':
			return gameData[req.rebirthType] >= req.value;
		case 'age':
			return daysToYears(gameData.days) >= req.value;
		case 'coins':
			return gameData.coins >= req.value;
		case 'fame':
			return gameData.fame >= req.value;
		default:
			return false;
	}
}


function checkRebirthPrompts () {
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

function goBankrupt () {
	gameData.coins = 0;
	gameData.currentProperty = gameData.itemData['Homeless'];
	gameData.currentMisc = [];
	logEvent('Ran out of money and went bankrupt! Lost all housing and equipment.');
}

function setTimeWarping () {
	gameData.timeWarpingEnabled = !gameData.timeWarpingEnabled;
}

function setTask (taskName) {
	const task = gameData.taskData[taskName];
	task instanceof Job ? gameData.currentJob = task : gameData.currentSkill = task;
}

function setProperty (propertyName) {
	const property = gameData.itemData[propertyName];
	if (gameData.currentProperty !== property) {
		gameData.currentProperty = property;
		logEvent(`Moved into ${property.name}.`);
	}
}

function setMisc (miscName) {
	const misc = gameData.itemData[miscName];
	if (gameData.currentMisc.includes(misc)) {
		for (let i = 0; i < gameData.currentMisc.length; i++) {
			if (gameData.currentMisc[i] === misc) {
				gameData.currentMisc.splice(i, 1);
				logEvent(`Stopped using ${misc.name}.`);
			}
		}
	} else {
		gameData.currentMisc.push(misc);
		logEvent(`Started using ${misc.name}.`);
	}
}

function drinkPotion (type) {
	if (gameData.potions[type] <= 0) {
		gameData.potions[type] = 600; // 10 minutes in seconds
		if (type === 'inspiration') {
			if (gameData.coins < 20000) {
				gameData.coins = 20000;
				logEvent('Not enough coins to drink Inspiration Potion. Coins increased to $20,000.');
			}
		}
		logEvent(`Drank ${type === 'inspiration' ? 'Inspiration' : 'Acceleration'} Potion!`);
	}
}

function doCurrentTask (task) {
	if (!task) return;
	task.increaseXp();
	if (task instanceof Job) {
		increaseCoins();
	}
}

function increaseCoins () {
	const coins = applySpeed(getIncome());
	gameData.coins += coins;
}

function increaseDays () {
	const increase = applySpeed(1);
	gameData.days += increase;
}

function getRawWritingSpeed () {
	const baseSpeed = 100;
	const typingSpeed = gameData.taskData['Typing Speed'] ? gameData.taskData['Typing Speed'].getEffect() : 1;
	const focus = gameData.taskData['Focus'] ? gameData.taskData['Focus'].getEffect() : 1;
	const inspiration = getInspiration();
	const fullTimeBonus = (gameData.currentJob && gameData.currentJob.name === 'Full-Time Author') ? 5 : 1;
	
	const writingPercentage = gameData.workWritingBalance / 100;
	
	let itemWritingMultiplier = 1;
	if (gameData.currentProperty && gameData.currentProperty.baseData.writingMultiplier) {
		itemWritingMultiplier *= gameData.currentProperty.baseData.writingMultiplier;
	}
	for (const misc of gameData.currentMisc) {
		if (misc.baseData.writingMultiplier) {
			itemWritingMultiplier *= misc.baseData.writingMultiplier;
		}
	}
	
	const badgeMultiplier = getBadgeMultiplier("writingSpeed"); // Added: Badge multiplier for writing speed
	
	return baseSpeed * typingSpeed * focus * inspiration * fullTimeBonus * writingPercentage * gameData.writingMultiplier * gameData.writingXpMultiplier * itemWritingMultiplier * badgeMultiplier;
}

function getWritingSpeed () {
	return Math.min(1000, getRawWritingSpeed());
}

function getQualityMultiplier () {
	const rawSpeed = getRawWritingSpeed();
	if (rawSpeed > 1000) {
		return Math.min(10, rawSpeed / 1000);
	}
	return 1;
}

// Called when the user clicks "Start Writing"
function startWritingBook () {
	if (!gameData.selectedGenre) return;
	pickNextBook(gameData.selectedGenre);
	buildSceneButtons(); // Rebuild buttons to match the new book's genre
	
	// Modified: Determine default scene type for auto-writing
	let currentGenre = gameData.selectedGenre;
	if (gameData.currentBook && booksBaseData && booksBaseData[gameData.currentBook]) {
		currentGenre = booksBaseData[gameData.currentBook].genre;
	}
	let defaultScene = "Action";
	if (sceneTypesBaseData && sceneTypesBaseData[currentGenre]) {
		defaultScene = Object.keys(sceneTypesBaseData[currentGenre])[0] || "Action";
	}
	currentAutoSceneType = defaultScene;
	nextSceneType = defaultScene;
	
	updateUI();
	
	// Reset manual writing state
	gameData.currentBookComposition = {};
	typewriterText = '';
	currentTypewriterSentence = '';
	typewriterIndex = 0;
	isHoldingSceneButton = false;
	isWaitingToClearLine = false; // Reset line clear flag
	isClearingLine = false; // Reset pause flag
	currentTypingSceneType = null; // Reset typing scene type
}

function pickNextBook (genre) {
	if (!booksBaseData) return;
	const allBooks = Object.keys(booksBaseData);
	const genreBooks = allBooks.filter(id => booksBaseData[id].genre === genre);
	const completedIds = gameData.completedBooks.map(b => b.id);
	let availableBooks = genreBooks.filter(id => !completedIds.includes(id));
	
	// Fallback if all books in the selected genre have been written
	if (availableBooks.length === 0) {
		availableBooks = genreBooks;
	}
	
	// Ultimate fallback if genre doesn't exist in books
	if (availableBooks.length === 0) {
		availableBooks = allBooks;
	}
	
	const randomIndex = Math.floor(Math.random() * availableBooks.length);
	gameData.currentBook = availableBooks[randomIndex];
	gameData.wordsWritten = 0; // Reset progress for the new book
}

function getLifeExperiences () {
	const exp = { hardship: 0, observation: 0, escapism: 0, exposure: 0, social: 0 };
	for (const key in gameData.taskData) {
		const task = gameData.taskData[key];
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
		const authorMults = authorsBaseData[gameData.currentAuthor].multipliers;
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

function getBookLength () {
	if (gameData.currentBook && booksBaseData && booksBaseData[gameData.currentBook]) {
		return booksBaseData[gameData.currentBook].wordCount;
	}
	const plottingLvl = gameData.taskData['Plotting'] ? gameData.taskData['Plotting'].level : 0;
	return (50 + (plottingLvl * 2)) * 250;
}

function getBookQuality () {
	const grammar = gameData.taskData['Grammar & Prose'] ? gameData.taskData['Grammar & Prose'].level : 0;
	const plotting = gameData.taskData['Plotting'] ? gameData.taskData['Plotting'].level : 0;
	const charDev = gameData.taskData['Character Dev.'] ? gameData.taskData['Character Dev.'].level : 0;
	
	let baseSkillQuality = (grammar + plotting + charDev) / 3;
	if (baseSkillQuality === 0) {
		baseSkillQuality = 0.3;
	}
	
	const lifeExp = getLifeExperiences();
	let expMultiplier = 1;
	
	// Determine which genre to use for calculating multipliers
	let currentGenre = 'Romance'; // Default fallback
	if (gameData.currentBook && booksBaseData && booksBaseData[gameData.currentBook]) {
		currentGenre = booksBaseData[gameData.currentBook].genre;
	} else if (gameData.selectedGenre) {
		currentGenre = gameData.selectedGenre;
	}
	
	const genreMults = (typeof genresBaseData !== 'undefined' && genresBaseData[currentGenre]) ? genresBaseData[currentGenre] : null;
	
	// Dynamically calculate the multiplier using genre data
	if (genreMults) {
		for (const key in genreMults) {
			const expValue = lifeExp[key.toLowerCase()] || 0;
			const multValue = genreMults[key];
			expMultiplier += Math.log10(expValue + 1) * multValue;
		}
	} else if (typeof lifeExperiencesBaseData !== 'undefined') {
		// Fallback to old logic if genres.json fails
		for (const key in lifeExperiencesBaseData) {
			const expData = lifeExperiencesBaseData[key];
			const expValue = lifeExp[key.toLowerCase()] || 0;
			const multValue = expData.multiplier || 0.1;
			expMultiplier += Math.log10(expValue + 1) * multValue;
		}
	} else {
		// Ultimate fallback
		expMultiplier += (Math.log10(lifeExp.hardship + 1) * 0.1) +
			(Math.log10(lifeExp.observation + 1) * 0.1) +
			(Math.log10(lifeExp.escapism + 1) * 0.1) +
			(Math.log10(lifeExp.exposure + 1) * 0.1) +
			(Math.log10(lifeExp.social + 1) * 0.1);
	}
	
	let itemQualityMultiplier = 1;
	if (gameData.currentProperty && gameData.currentProperty.baseData.writingQuality) {
		itemQualityMultiplier *= gameData.currentProperty.baseData.writingQuality;
	}
	for (const misc of gameData.currentMisc) {
		if (misc.baseData.writingQuality) {
			itemQualityMultiplier *= misc.baseData.writingQuality;
		}
	}
	
	let skillQualityMultiplier = 1;
	for (const key in gameData.taskData) {
		const task = gameData.taskData[key];
		if (task instanceof Skill) {
			skillQualityMultiplier *= task.getWritingQuality();
		}
	}
	
	const badgeMultiplier = getBadgeMultiplier("writingQuality"); // Added: Badge multiplier for writing quality
	
	return baseSkillQuality * expMultiplier * itemQualityMultiplier * skillQualityMultiplier * badgeMultiplier;
}

// Calculate the composition multiplier based on how close the player matched the genre ideals
function getCompositionMultiplier () {
	if (!gameData.currentBookComposition) return 1;
	
	let currentGenre = 'Romance';
	if (gameData.currentBook && booksBaseData && booksBaseData[gameData.currentBook]) {
		currentGenre = booksBaseData[gameData.currentBook].genre;
	} else if (gameData.selectedGenre) {
		currentGenre = gameData.selectedGenre;
	}
	
	const ideals = genreIdealsBaseData ? genreIdealsBaseData[currentGenre] : null;
	if (!ideals) return 1;
	
	let totalWords = 0;
	for (const key in gameData.currentBookComposition) {
		totalWords += gameData.currentBookComposition[key];
	}
	
	if (totalWords === 0) return 0.1;
	
	let distance = 0;
	// Check all scene types present in either the composition or the ideals
	const allSceneTypes = new Set([...Object.keys(gameData.currentBookComposition), ...Object.keys(ideals)]);
	
	for (const sceneType of allSceneTypes) {
		const actualPct = (gameData.currentBookComposition[sceneType] || 0) / totalWords;
		const idealPct = ideals[sceneType] || 0;
		distance += Math.abs(actualPct - idealPct);
	}
	
	// Max distance is 3.0. Map distance 0 -> 3.0 multiplier, distance 3.0 -> 0.15 multiplier
	let multiplier = 3.0 - (distance * 0.95);
	if (multiplier < 0.15) multiplier = 0.15;
	if (multiplier > 3.0) multiplier = 3.0;
	
	return multiplier;
}

// Writing Progress Function (Called automatically every frame)
function writeProgress (sceneType, timeInSeconds) {
	if (!gameData.currentBook) return;
	
	let speedPerSecond = getWritingSpeed();
	
	// Modified: Apply flat 2x multiplier if holding the scene button
	if (isHoldingSceneButton) {
		speedPerSecond *= 2;
	}
	
	const words = speedPerSecond * getGameSpeed() * timeInSeconds;
	
	if (words <= 0) return;
	
	gameData.wordsWritten += words;
	
	if (!gameData.currentBookComposition) {
		gameData.currentBookComposition = {};
	}
	if (!gameData.currentBookComposition[sceneType]) {
		gameData.currentBookComposition[sceneType] = 0;
	}
	gameData.currentBookComposition[sceneType] += words;
	
	const target = getBookLength();
	if (gameData.wordsWritten >= target) {
		finishBook();
	}
}

// Interaction Handlers
function handleSceneClick (sceneType) {
	// Modified: Set active auto scene
	currentAutoSceneType = sceneType;
	nextSceneType = sceneType; // Queue the genre for the typewriter
	
	// Modified: Instant 3 days of progress per click
	if (gameData.currentBook) {
		const speedPerDay = getWritingSpeed();
		const words = speedPerDay * 3; // 3 days worth of words
		
		if (words > 0) {
			gameData.wordsWritten += words;
			
			if (!gameData.currentBookComposition) {
				gameData.currentBookComposition = {};
			}
			if (!gameData.currentBookComposition[sceneType]) {
				gameData.currentBookComposition[sceneType] = 0;
			}
			gameData.currentBookComposition[sceneType] += words;
			
			const target = getBookLength();
			if (gameData.wordsWritten >= target) {
				finishBook();
			}
		}
	}
	
	if (typeof updateUI === 'function') updateUI();
}

function handleSceneHoldStart (sceneType) {
	isHoldingSceneButton = true;
	currentAutoSceneType = sceneType; // Modified: Update auto scene
	nextSceneType = sceneType; // Queue the genre for the typewriter
}

function handleSceneHoldEnd () {
	isHoldingSceneButton = false;
}

function finishBook () {
	const baseQuality = getBookQuality();
	const qualityMultiplier = getQualityMultiplier();
	const compMultiplier = getCompositionMultiplier();
	
	const quality = baseQuality * qualityMultiplier * compMultiplier;
	const fame = gameData.fame;
	const sales = (quality / 100) * (fame + 10) * 5;
	let royalty = sales * 0.1;
	royalty *= getBadgeMultiplier("royalties"); // Added: Badge multiplier for royalties
	
	if (royalty < 0.10) {
		royalty = 0.10;
	}
	
	gameData.royalties += royalty;
	gameData.booksPublished += 1;
	
	const bookTitle = booksBaseData[gameData.currentBook] ? booksBaseData[gameData.currentBook].title : 'Unknown Book';
	logEvent(`Published Book #${gameData.booksPublished}: "${bookTitle}"! Quality: ${quality.toFixed(1)}%. Earned $${format(royalty)}/day in royalties.`);
	
	const bookAge = daysToYears(gameData.days);
	const bookDay = getDay();
	
	const alreadyCompleted = gameData.completedBooks.some(b => b.id === gameData.currentBook);
	if (!alreadyCompleted) {
		gameData.completedBooks.push({
			id: gameData.currentBook,
			age: bookAge,
			day: bookDay,
			royalties: royalty,
			quality: quality
		});
	}
	
	if (typeof showBookFinishedModal === 'function') {
		showBookFinishedModal(gameData.currentBook, quality, royalty);
	}
	
	// Stop writing and wait for the player to select the next genre
	gameData.currentBook = null;
	gameData.wordsWritten = 0;
	gameData.currentBookComposition = {};
	typewriterText = '';
	currentTypewriterSentence = ''; // Reset sentence
	typewriterIndex = 0; // Reset index
	isHoldingSceneButton = false; // Reset hold state
	currentAutoSceneType = null; // Clear active scene
	isWaitingToClearLine = false; // Reset line clear flag
	isClearingLine = false; // Reset pause flag
	currentTypingSceneType = null; // Reset typing scene type
	document.getElementById('liveWritingText').innerHTML = '<span class="blinking-cursor">|</span>';
}

function rebirthOne () {
	gameData.rebirthOneCount += 1;
	logEvent('Retired and started a new chapter. Legacy bonuses updated.');
	rebirthReset();
	closeRetirementModal();
	closeRebirthOneModal();
}

function rebirthTwo () {
	gameData.rebirthTwoCount += 1;
	const fameGain = getFameGain();
	gameData.fame += fameGain;
	logEvent(`Retired as a Legend. Gained ${fameGain.toFixed(1)} Fame!`);
	
	rebirthReset();
	closeRetirementModal();
	closeRebirthTwoModal();
	
	for (const taskName in gameData.taskData) {
		const task = gameData.taskData[taskName];
		task.maxLevel = 0;
	}
}

function rebirthReset () {
	gameData.coins = 0;
	gameData.days = 365 * 18;
	gameData.wordsWritten = 0;
	gameData.booksPublished = 0;
	gameData.royalties = 0;
	gameData.currentJob = gameData.taskData['Gig Worker'];
	gameData.currentSkill = gameData.taskData['Focus'];
	gameData.currentProperty = gameData.itemData['Homeless'];
	gameData.currentMisc = [];
	
	gameData.currentBook = null;
	gameData.completedBooks = [];
	
	gameData.rebirthOnePrompted = false;
	gameData.rebirthTwoPrompted = false;
	
	for (const taskName in gameData.taskData) {
		const task = gameData.taskData[taskName];
		if (task.level > task.maxLevel) task.maxLevel = task.level;
		task.level = 0;
		task.xp = 0;
	}
	
	for (const key in gameData.requirements) {
		const requirement = gameData.requirements[key];
		requirement.completed = false;
	}
}

function getLifespan () {
	const healthy = gameData.taskData['Healthy Lifestyle'] ? gameData.taskData['Healthy Lifestyle'].getEffect() : 1;
	const longevity = gameData.taskData['Longevity Secrets'] ? gameData.taskData['Longevity Secrets'].getEffect() : 1;
	const badgeBonus = getBadgeMultiplier("lifespan") * 365; // Added: Badge bonus for lifespan (in days)
	return baseLifespan * healthy * longevity + badgeBonus;
}

function isAlive () {
	const condition = gameData.days < getLifespan();
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
