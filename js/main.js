// Init function, game loop, core update function

function update() {
    increaseDays();
    autoPromote();
    autoLearn();
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
    
    update();
    
    saveTimer += deltaTime;
    if (saveTimer >= 3) {
        saveGameData();
        saveTimer = 0;
    }
    
    skillTimer += deltaTime;
    if (skillTimer >= 1) {
        setSkillWithLowestMaxXp();
        skillTimer = 0;
    }
    
    requestAnimationFrame(gameLoop);
}

async function init() {
    try {
        const [
            jobsRes, skillsRes, itemsRes,
            jobCatRes, skillCatRes, itemCatRes,
            colorsRes, tooltipsRes, reqRes,
            authorsRes, booksRes // Added fetches for new JSONs
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
            fetch('data/authors.json'), // Fetch authors
            fetch('data/books.json')    // Fetch books
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
        
        authorsBaseData = await authorsRes.json(); // Assign authors data
        booksBaseData = await booksRes.json();     // Assign books data
        
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
        
        // Initialize Author if not set
        if (!gameData.currentAuthor) {
            let authorKeys = Object.keys(authorsBaseData);
            gameData.currentAuthor = authorKeys[Math.floor(Math.random() * authorKeys.length)];
        }
        
        // Initialize Book if not set
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
    } catch (error) {
        console.error("Failed to load game data:", error);
        alert("Failed to load game data. Ensure you are running this on a local web server to allow fetch API to work.");
    }
}

window.onload = init;
