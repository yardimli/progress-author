// Init function, game loop, core update function

function update() {
    increaseDays();
    doCurrentTask(gameData.currentJob);
    doCurrentTask(gameData.currentSkill);
    updateWritingProcess();
    applyExpenses();
    updateUI();
}

function gameLoop(currentTime) {
    deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    if (deltaTime > 86400) deltaTime = 86400;
    
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
            authorsRes, booksRes
        ] = await Promise.all([
            fetch('data/jobs.json'),
            fetch('data/skills.json'),
            fetch('data/items.json'),
            fetch('data/jobCategories.json'),
            fetch('data/skillCategories.json'),
            fetch('data/itemCategories.json'),
            fetch('data/headerRowColors.json'),
            fetch('data/tooltips.json'),
            fetch('data/requirements.json'),
            fetch('data/authors.json'),
            fetch('data/books.json')
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
        
        createAllRows(jobCategories, "jobTable");
        createAllRows(skillCategories, "skillTable");
        createAllRows(itemCategories, "itemTable");
        
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
            let authorKeys = Object.keys(authorsBaseData);
            gameData.currentAuthor = authorKeys[Math.floor(Math.random() * authorKeys.length)];
        }
        
        if (!gameData.currentBook) {
            pickNextBook();
        }
        
        setCustomEffects();
        addMultipliers();
        
        setTab(jobTabButton, "jobs");
        
        update();
        
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
        
        logEvent("Started a new game. Welcome to Author's Journey!");
        
        // NEW: Show intro modal if it hasn't been seen yet
        if (!gameData.introSeen) {
            showIntroModal();
        }
        
    } catch (error) {
        console.error("Failed to load game data:", error);
        alert("Failed to load game data. Ensure you are running this on a local web server to allow fetch API to work.");
    }
}

window.onload = init;
