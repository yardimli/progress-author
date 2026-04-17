// Init function, game loop, core update function

// Renamed from update() to updateLogic() and removed updateUI()
// This allows logic to run every frame while UI updates periodically
function updateLogic() {
    increaseDays();
    doCurrentTask(gameData.currentJob);
    doCurrentTask(gameData.currentSkill);
    applyExpenses();
    checkUnlocks();
    checkRebirthPrompts(); // Added: Check for age-based rebirth modals.
}

function gameLoop(currentTime) {
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
        let popup = popupQueue.shift();
        if (popup.type === 'tutorial') {
            showTutorialModal(popup.title, popup.text);
        } else if (popup.type === 'info') {
            showModal(popup.imgEl, popup.isNewUnlock);
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
        
        // Handle manual writing continuous hold or click timer
        if (clickTypingTimer > 0) {
            clickTypingTimer -= deltaTime;
            if (clickTypingTimer <= 0 && !isHoldingSceneButton) {
                activeSceneType = null; // Stop writing if timer runs out and not holding
            }
        }
        
        if (activeSceneType) {
            writeProgress(activeSceneType, deltaTime);
        }
        
        // Process the visual typewriter effect independently of game speed
        updateTypewriter(deltaTime);
        
        // Run core game logic every frame so it scales correctly with deltaTime
        updateLogic();
        
        textUpdateTimer += deltaTime;
        if (textUpdateTimer >= 0.2) { // Update UI 5 times a second to save CPU
            textUpdateTimer -= 0.2; // Keep remainder instead of resetting to 0
            updateUI();
        }
    }
    
    saveTimer += deltaTime;
    if (saveTimer >= 3) {
        saveGameData();
        saveTimer -= 3; // Keep remainder instead of resetting to 0
    }
    
    requestAnimationFrame(gameLoop);
}

async function init() {
    try {
        const [
            jobsRes, skillsRes, itemsRes,
            jobCatRes, skillCatRes, itemCatRes,
            colorsRes, tooltipsRes, reqRes,
            authorsRes, booksRes,
            potionsRes, lifeExpRes, genresRes,
            sceneTypesRes, genreIdealsRes,
            booksFirstPageRes,
            introSlidesRes // Added: Fetch intro slides
        ] = await Promise.all([
            fetch('data/jobs.json?' + gameData.version), // Cache busting with version query param
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
            fetch('data/introSlides.json?' + gameData.version) // Added: Fetch intro slides
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
        genresBaseData = await genresRes.json(); // Assign genres data
        sceneTypesBaseData = await sceneTypesRes.json();
        genreIdealsBaseData = await genreIdealsRes.json();
        booksFirstPageBaseData = await booksFirstPageRes.json(); // Added: Assign first page data
        introSlidesBaseData = await introSlidesRes.json(); // Added: Assign intro slides data
        
        createAllRows(jobCategories, "jobTable");
        createAllRows(skillCategories, "skillTable");
        createAllRows(itemCategories, "itemTable");
        initLifeExperiencesUI(); // Initialize dynamic Life Experiences UI
        
        createData(gameData.taskData, jobBaseData);
        createData(gameData.taskData, skillBaseData);
        createData(gameData.itemData, itemBaseData);
        
        gameData.currentJob = gameData.taskData["Gig Worker"];
        gameData.currentSkill = gameData.taskData["Focus"];
        gameData.currentProperty = gameData.itemData["Homeless"];
        gameData.currentMisc = [];
        
        setupRequirements(requirementsData);
        
        tempData["requirements"] = {};
        for (let key in gameData.requirements) {
            let requirement = gameData.requirements[key];
            tempData["requirements"][key] = requirement;
        }
        
        loadGameData();
        
        if (!gameData.currentAuthor) {
            // Show author selection screen instead of random pick
            showAuthorSelection();
            return; // Halt initialization until author is selected
        }
        
        continueInit();
        
    } catch (error) {
        console.error("Failed to load game data:", error);
        alert("Failed to load game data. Ensure you are running this on a local web server to allow fetch API to work.");
    }
}

// Continues initialization after an author is selected or loaded
function continueInit() {
    populateGenres(); // Populate the genre dropdown
    buildSceneButtons(); // Build the manual writing buttons
    
    setCustomEffects();
    addMultipliers();
    
    applyUnlocksUI(); // Apply hidden states to tabs based on unlocks
    
    setTab(jobTabButton, "jobs");
    
    updateLogic(); // Run logic once
    updateUI();    // Update UI once
    
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
    
    logEvent("Started a new game. Welcome to Author's Journey!");
    
    isInitialized = true; // Mark as initialized so new unlocks trigger modals
    
    if (!gameData.introSeen) {
        showIntroModal();
    }
}

window.onload = init;
