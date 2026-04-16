// Init function, game loop, core update function

function update() {
    increaseDays();
    doCurrentTask(gameData.currentJob);
    doCurrentTask(gameData.currentSkill);
    updateWritingProcess();
    applyExpenses();
    checkUnlocks();
    updateUI();
}

function gameLoop(currentTime) {
    deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    if (deltaTime > 86400) deltaTime = 86400;
    
    // Process popup queue if not currently paused
    if (!isPaused && popupQueue.length > 0) {
        let popup = popupQueue.shift();
        if (popup.type === 'tutorial') {
            showTutorialModal(popup.title, popup.text);
        } else if (popup.type === 'info') {
            // Pass the isNewUnlock flag to showModal
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
        
        update();
    }
    
    saveTimer += deltaTime;
    if (saveTimer >= 3) {
        saveGameData();
        saveTimer = 0;
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
            potionsRes, lifeExpRes // Added new fetch requests
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
            fetch('data/lifeExperiences.json?' + gameData.version)
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
        potionsBaseData = await potionsRes.json(); // Assign potions data
        lifeExperiencesBaseData = await lifeExpRes.json(); // Assign life experiences data
        
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
    if (!gameData.currentBook) {
        pickNextBook();
    }
    
    setCustomEffects();
    addMultipliers();
    
    applyUnlocksUI(); // Apply hidden states to tabs based on unlocks
    
    setTab(jobTabButton, "jobs");
    
    update();
    
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
    
    logEvent("Started a new game. Welcome to Author's Journey!");
    
    isInitialized = true; // Mark as initialized so new unlocks trigger modals
    
    if (!gameData.introSeen) {
        showIntroModal();
    }
}

window.onload = init;
