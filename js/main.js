// Init function, game loop, core update function

// Renamed from update() to updateLogic() and removed updateUI()
// This allows logic to run every frame while UI updates periodically
function updateLogic () {
    increaseDays();
    doCurrentTask(gameData.currentJob);
    doCurrentTask(gameData.currentSkill);
    applyExpenses();
    checkBadgeUnlocks();
    checkRebirthPrompts();
    trackMonthlyData(); // Added: Track data for chart
}

function gameLoop (currentTime) {
    deltaTime = (currentTime - lastTime) / 1000;
    
    // Limit frame rate to ~60 FPS to reduce CPU load
    // Returning here without updating lastTime ensures deltaTime accumulates correctly
    if (deltaTime < 0.016) {
        requestAnimationFrame(gameLoop);
        return;
    }
    
    lastTime = currentTime;
    
    if (deltaTime > 86400) deltaTime = 86400;
    
    // Process popup queue immediately if not paused
    if (!isPaused && popupQueue.length > 0) {
        const popup = popupQueue.shift();
        if (popup.type === 'tutorial') {
            showTutorialModal(popup.title, popup.text);
        } else if (popup.type === 'info') {
            showModal(popup.imgEl, popup.isNewUnlock);
        } else if (popup.type === 'badge') {
            showModal(popup.imgEl, popup.isNewUnlock, true);
        }
    }
    
    // Only update game logic if not paused
    if (!isPaused) {
        // Update potion timers (real-time)
        if (gameData.potions.inspiration > 0) {
            gameData.potions.inspiration -= deltaTime;
            if (gameData.potions.inspiration < 0) gameData.potions.inspiration = 0;
        }
        if (gameData.potions.acceleration > 0) {
            gameData.potions.acceleration -= deltaTime;
            if (gameData.potions.acceleration < 0) gameData.potions.acceleration = 0;
        }
        
        if (gameData.currentBook && currentAutoSceneType) {
            writeProgress(currentAutoSceneType, deltaTime);
        }
        
        updateTypewriter(deltaTime);
        
        updateLogic();
        
        textUpdateTimer += deltaTime;
        if (textUpdateTimer >= 0.2) {
            textUpdateTimer -= 0.2;
            updateUI();
        }
    }
    
    saveTimer += deltaTime;
    if (saveTimer >= 3) {
        saveGameData();
        saveTimer -= 3;
    }
    
    requestAnimationFrame(gameLoop);
}

// Added: Function to track and store monthly data for the chart
function trackMonthlyData () {
    const daysInMonth = 365 / 12;
    const currentMonthIndex = Math.floor(gameData.days / daysInMonth);
    const lastTrackedMonthIndex = Math.floor(tempData.monthlyTracker.lastDayChecked / daysInMonth);
    
    // Update trackers for the current frame
    tempData.monthlyTracker.inspirationSum += getInspiration();
    tempData.monthlyTracker.inspirationCount++;
    
    if (currentMonthIndex > lastTrackedMonthIndex) {
        // A new month has passed, finalize and store the data
        const age = daysToYears(tempData.monthlyTracker.lastDayChecked);
        const month = Math.floor((tempData.monthlyTracker.lastDayChecked % 365) / daysInMonth);
        
        const avgInspiration = tempData.monthlyTracker.inspirationCount > 0 ? tempData.monthlyTracker.inspirationSum / tempData.monthlyTracker.inspirationCount : 0;
        const avgQuality = tempData.monthlyTracker.qualityCount > 0 ? tempData.monthlyTracker.qualitySum / tempData.monthlyTracker.qualityCount : 0;
        
        gameData.monthlyChartData.push({
            age: age + month / 12,
            income: tempData.monthlyTracker.income,
            expense: tempData.monthlyTracker.expense,
            royalties: tempData.monthlyTracker.royalties,
            wordsWritten: tempData.monthlyTracker.wordsWritten,
            booksPublished: tempData.monthlyTracker.booksPublished,
            inspiration: avgInspiration,
            bookQuality: avgQuality
        });
        
        // Reset the tracker for the new month
        tempData.monthlyTracker = {
            lastDayChecked: gameData.days,
            income: 0,
            expense: 0,
            royalties: 0,
            wordsWritten: 0,
            booksPublished: 0,
            inspirationSum: 0,
            inspirationCount: 0,
            qualitySum: 0,
            qualityCount: 0
        };
    }
    
    // Always update the lastDayChecked to the current day
    tempData.monthlyTracker.lastDayChecked = gameData.days;
}

async function init () {
    try {
        const [
            jobsRes, skillsRes, itemsRes,
            jobCatRes, skillCatRes, itemCatRes,
            colorsRes, tooltipsRes, reqRes,
            authorsRes, booksRes,
            potionsRes, lifeExpRes, genresRes,
            sceneTypesRes, genreIdealsRes,
            booksFirstPageRes,
            introSlidesRes,
            badgesRes
        ] = await Promise.all([
            fetch('data/jobs.json?' + gameData.version),
            fetch('data/skills.json?' + gameData.version),
            fetch('data/items.json?' + gameData.version),
            fetch('data/jobCategories.json?' + gameData.version),
            fetch('data/skillCategories.json?' + gameData.version),
            fetch('data/itemCategories.json?' + gameData.version),
            fetch('data/headerRowColors.json?' + gameData.version),
            fetch('data/tooltips.json?' + gameData.version),
            fetch('data/requirements.json?' + gameData.version),
            fetch('data/authors.json?' + gameData.version),
            fetch('data/books.json?' + gameData.version),
            fetch('data/potions.json?' + gameData.version),
            fetch('data/lifeExperiences.json?' + gameData.version),
            fetch('data/genres.json?' + gameData.version),
            fetch('data/sceneTypes.json?' + gameData.version),
            fetch('data/genreIdeals.json?' + gameData.version),
            fetch('data/booksFirstPage.json?' + gameData.version),
            fetch('data/introSlides.json?' + gameData.version),
            fetch('data/badges.json?' + gameData.version)
        ]);
        
        jobBaseData = await jobsRes.json();
        skillBaseData = await skillsRes.json();
        itemBaseData = await itemsRes.json();
        
        jobCategories = await jobCatRes.json();
        skillCategories = await skillCatRes.json();
        itemCategories = await itemCatRes.json();
        headerRowColors = await colorsRes.json();
        tooltips = await tooltipsRes.json();
        const requirementsData = await reqRes.json();
        
        authorsBaseData = await authorsRes.json();
        booksBaseData = await booksRes.json();
        potionsBaseData = await potionsRes.json();
        lifeExperiencesBaseData = await lifeExpRes.json();
        genresBaseData = await genresRes.json();
        sceneTypesBaseData = await sceneTypesRes.json();
        genreIdealsBaseData = await genreIdealsRes.json();
        booksFirstPageBaseData = await booksFirstPageRes.json();
        introSlidesBaseData = await introSlidesRes.json();
        badgeBaseData = await badgesRes.json();
        
        createAllRows(jobCategories, 'jobTable');
        createAllRows(skillCategories, 'skillTable');
        createAllRows(itemCategories, 'itemTable');
        initLifeExperiencesUI();
        
        createData(gameData.taskData, jobBaseData);
        createData(gameData.taskData, skillBaseData);
        createData(gameData.itemData, itemBaseData);
        
        gameData.currentJob = gameData.taskData['Gig Worker'];
        gameData.currentSkill = gameData.taskData['Focus'];
        gameData.currentProperty = gameData.itemData['Homeless'];
        gameData.currentMisc = [];
        
        setupRequirements(requirementsData);
        
        tempData['requirements'] = {};
        for (const key in gameData.requirements) {
            const requirement = gameData.requirements[key];
            tempData['requirements'][key] = requirement;
        }
        
        loadGameData();
        
        if (!gameData.currentAuthor) {
            showAuthorSelection();
            return;
        }
        
        continueInit();
        
    } catch (error) {
        console.error('Failed to load game data:', error);
        alert('Failed to load game data. Ensure you are running this on a local web server to allow fetch API to work.');
    }
}

function continueInit () {
    populateGenres();
    buildSceneButtons();
    
    setCustomEffects();
    addMultipliers();
    
    updateLogic();
    updateUI();
    
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
    
    if (gameData.logHistory.length === 0) { // Modified: Check log history to prevent re-logging on load
        logEvent("Started a new game. Welcome to Author's Journey!");
    }
    
    isInitialized = true;
    
    if (!gameData.introSeen) {
        showIntroModal();
    }
}

window.onload = init;
