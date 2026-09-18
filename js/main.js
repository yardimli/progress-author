// Init function, game loop, core update function

// Renamed from update() to updateLogic() and removed updateUI()
// This allows logic to run every frame while UI updates periodically
function updateLogic () {
    if (BALANCE.writing.salesEnabled) runCareerAutomation();
    doCurrentTask(gameData.currentJob);
    doCurrentTask(gameData.currentSkill);
    applyExpenses();
    increaseDays();
    trackMonthlyData();
}

function gameLoop (currentTime) {
    deltaTime = (currentTime - lastTime) / 1000;
    
    lastTime = currentTime;
    // Background tabs suspend rAF. Resume without a giant simulation/UI burst.
    deltaTime = Math.min(Math.max(deltaTime, 0), 0.1);
    if (document.hidden) {
        requestAnimationFrame(gameLoop);
        return;
    }
    gameData.lastProgressAt = Date.now();
    gameData.offlineEligible = !isPaused;
    
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
        if (isInitialized && isAlive()) window.AuthorStats?.addPlayTime(deltaTime);
        gameData.activePlaySeconds += deltaTime;
        if (BALANCE.writing.salesEnabled) {
            advanceWritingEconomy(deltaTime);
            updateTypewriter(deltaTime);
        } else {
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
        }
        
        textUpdateTimer += deltaTime;
        if (textUpdateTimer >= 0.25) {
            textUpdateTimer %= 0.25;
            checkBadgeUnlocks();
            checkRebirthPrompts();
            updateUI();
        }
        updateProgressUI();
    }
    
    saveTimer += deltaTime;
    if (saveTimer >= 3) {
        scheduleGameSave();
        saveTimer -= 3;
    }
    
    requestAnimationFrame(gameLoop);
}

// Function to track and store monthly data for the chart
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
        // Independent of the version stored in a player's older save.
        const dataRevision = Date.now();
        const fetchData = name => fetch(`data/${name}.json?v=${dataRevision}`, { cache: 'no-store' });
        const[
            jobsRes, skillsRes, itemsRes,
            colorsRes, tooltipsRes,
            authorsRes, booksRes,
            potionsRes, lifeExpRes, genresRes,
            sceneTypesRes, genreIdealsRes,
            booksFirstPageRes,
            introSlidesRes,
            badgesRes
        ] = await Promise.all([
            fetchData('jobs'),
            fetchData('skills'),
            fetchData(IS_CAREER_PREVIEW ? 'items' : 'items-legacy'),
            fetchData('headerRowColors'),
            fetchData('tooltips'),
            fetchData('authors'),
            fetchData('books'),
            fetchData('potions'),
            fetchData('lifeExperiences'),
            fetchData('genres'),
            fetchData('sceneTypes'),
            fetchData('genreIdeals'),
            fetchData('booksFirstPage'),
            fetchData('introSlides'),
            fetchData('badges')
        ]);
        
        jobBaseData = await jobsRes.json();
        skillBaseData = await skillsRes.json();
        itemBaseData = await itemsRes.json();
        if (IS_CAREER_PREVIEW) {
            const profile = await fetchData('career-profile');
            applyCareerProfile(await profile.json());
            const notice = document.createElement('p');
            notice.textContent = 'Career and writing preview · Separate save · Readership, two-year book sales and optional editing are being balanced.';
            notice.className = 'career-preview-notice';
            document.getElementById('writing').prepend(notice);
        }
        
        // Build categories dynamically from base data
        jobCategories = buildCategories(jobBaseData);
        skillCategories = buildCategories(skillBaseData);
        itemCategories = buildCategories(itemBaseData);
        
        headerRowColors = await colorsRes.json();
        tooltips = await tooltipsRes.json();
        
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
        applyCareerPresentation();
        
        createAllRows(jobCategories, 'jobTable');
        createAllRows(skillCategories, 'skillTable');
        createAllRows(itemCategories, 'itemTable');
        initLifeExperiencesUI();
        
        createData(gameData.taskData, jobBaseData);
        createData(gameData.taskData, skillBaseData);
        createData(gameData.itemData, itemBaseData);
        
        gameData.currentJob = gameData.taskData['Gig Worker'];
        gameData.currentSkill = gameData.taskData.Focus;
        gameData.currentProperty = gameData.itemData.Homeless;
        gameData.currentMisc =[];
        
        if (offerVersionRestart()) return;
        finishLoadingGame();
    } catch (error) {
        console.error('Failed to load game data:', error);
        alert('Failed to load game data. Ensure you are running this on a local web server to allow fetch API to work.');
    }
}

function finishLoadingGame() {
    loadGameData();
    if (isResettingSave) return;
    if (!gameData.currentAuthor) { showAuthorSelection(); return; }
    continueInit();
}

function continueInit () {
    populateGenres();
    buildSceneButtons();
    initExperienceUI();
    
    setCustomEffects();
    addMultipliers();
    isInitialized = true;
    advanceAwayProgress();
    
    updateLogic();
    updateUI();
    
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
    
    if (gameData.logHistory.length === 0) {
        logEvent("Started a new game. Welcome to Author's Journey!");
    }
    
    isInitialized = true;
    
    if (!gameData.introSeen) {
        showIntroModal();
    }
}

window.onload = () => startOwnedGame();

// Serialize saves outside animation work; flush when leaving the page.
let pendingGameSave = false;
function scheduleGameSave() {
    if (isResettingSave || pendingGameSave) return;
    pendingGameSave = true;
    const persist = () => {
        pendingGameSave = false;
        saveGameData();
    };
    if (window.requestIdleCallback) window.requestIdleCallback(persist, { timeout: 1000 });
    else setTimeout(persist, 0);
}
window.addEventListener('pagehide', () => {
    if (isInitialized) saveGameData();
});
