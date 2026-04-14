var gameData = {
    taskData: {},
    itemData: {},
    coins: 0,
    days: 365 * 18, // Starts at 18
    fame: 0,
    paused: false,
    timeWarpingEnabled: true,
    rebirthOneCount: 0,
    rebirthTwoCount: 0,
    currentJob: null,
    currentSkill: null,
    currentProperty: null,
    currentMisc: null,
    
    // Writing Process variables
    wordsWritten: 0,
    booksPublished: 0,
    royalties: 0,
    loggedDeath: false
};

var tempData = {};
var skillWithLowestMaxXp = null;

const autoPromoteElement = document.getElementById("autoPromote");
const autoLearnElement = document.getElementById("autoLearn");

const updateSpeed = 20;
const baseLifespan = 365 * 70;
const baseGameSpeed = 4;
const permanentUnlocks = ["Shop", "Automation", "Quick task display"];

// JSON Data containers
let jobBaseData, skillBaseData, itemBaseData, jobCategories, skillCategories, itemCategories, headerRowColors, tooltips;

const units = ["", "k", "M", "B", "T", "q", "Q", "Sx", "Sp", "Oc"];
const jobTabButton = document.getElementById("jobTabButton");

function getBaseLog(x, y) {
    return Math.log(y) / Math.log(x);
}

function getBindedTaskEffect(taskName) {
    let task = gameData.taskData[taskName];
    return task ? task.getEffect.bind(task) : () => 1;
}

function getBindedItemEffect(itemName) {
    let item = gameData.itemData[itemName];
    return item ? item.getEffect.bind(item) : () => 1;
}

function addMultipliers() {
    for (let taskName in gameData.taskData) {
        let task = gameData.taskData[taskName];
        
        task.xpMultipliers = [];
        if (task instanceof Job) task.incomeMultipliers = [];
        
        task.xpMultipliers.push(task.getMaxLevelMultiplier.bind(task));
        task.xpMultipliers.push(getInspiration);
        task.xpMultipliers.push(getBindedTaskEffect("Brand Management"));
        task.xpMultipliers.push(getBindedTaskEffect("Personal Brand"));
        
        if (task instanceof Job) {
            task.incomeMultipliers.push(task.getLevelMultiplier.bind(task));
            task.incomeMultipliers.push(getBindedTaskEffect("Royalty Negotiation"));
            task.xpMultipliers.push(getBindedTaskEffect("Time Management"));
            task.xpMultipliers.push(getBindedItemEffect("Editor"));
        } else if (task instanceof Skill) {
            task.xpMultipliers.push(getBindedTaskEffect("Focus"));
            task.xpMultipliers.push(getBindedItemEffect("Library Card"));
            task.xpMultipliers.push(getBindedItemEffect("Home Office"));
            task.xpMultipliers.push(getBindedItemEffect("Home Library"));
        }
        
        if (jobCategories["Creative Industry"].includes(task.name)) {
            task.xpMultipliers.push(getBindedTaskEffect("Grammar & Prose"));
            task.xpMultipliers.push(getBindedItemEffect("Style Guide"));
        } else if (task.name === "Typing Speed") {
            task.xpMultipliers.push(getBindedTaskEffect("Character Dev."));
            task.xpMultipliers.push(getBindedItemEffect("Used Laptop"));
        } else if (skillCategories["Writing Craft"].includes(task.name)) {
            task.xpMultipliers.push(getBindedItemEffect("Pro Writing Software"));
        } else if (jobCategories["Literary Elite"].includes(task.name)) {
            task.xpMultipliers.push(getBindedTaskEffect("Plotting"));
        } else if (skillCategories["The Business of Writing"].includes(task.name)) {
            task.xpMultipliers.push(getFame);
        }
    }
    
    for (let itemName in gameData.itemData) {
        let item = gameData.itemData[itemName];
        item.expenseMultipliers = [];
        item.expenseMultipliers.push(getBindedTaskEffect("Frugality"));
        item.expenseMultipliers.push(getBindedTaskEffect("Public Speaking"));
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
    let chairEffect = getBindedItemEffect("Ergonomic Chair");
    return meditationEffect() * chairEffect() * gameData.currentProperty.getEffect();
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
    return value * getGameSpeed() / updateSpeed;
}

function getFameGain() {
    let networking = gameData.taskData["Networking"] ? gameData.taskData["Networking"].getEffect() : 1;
    let mediaTours = gameData.taskData["Media Tours"] ? gameData.taskData["Media Tours"].getEffect() : 1;
    return gameData.booksPublished * networking * mediaTours;
}

function getGameSpeed() {
    let flowState = gameData.taskData["Flow State"];
    let flowStateSpeed = gameData.timeWarpingEnabled && flowState ? flowState.getEffect() : 1;
    return baseGameSpeed * +!gameData.paused * +isAlive() * flowStateSpeed;
}

function applyExpenses() {
    let coins = applySpeed(getExpense());
    gameData.coins -= coins;
    if (gameData.coins < 0) {
        goBankrupt();
    }
}

function getExpense() {
    let expense = 0;
    expense += gameData.currentProperty.getExpense();
    for (let misc of gameData.currentMisc) {
        expense += misc.getExpense();
    }
    return expense;
}

function goBankrupt() {
    gameData.coins = 0;
    gameData.currentProperty = gameData.itemData["Homeless"];
    gameData.currentMisc = [];
    logEvent("Ran out of money and went bankrupt! Lost all housing and equipment.");
}

function setTab(element, selectedTab) {
    let tabs = Array.prototype.slice.call(document.getElementsByClassName("tab"));
    tabs.forEach(function(tab) {
        tab.style.display = "none";
    });
    document.getElementById(selectedTab).style.display = "block";
    
    let tabButtons = document.getElementsByClassName("tabButton");
    for (let tabButton of tabButtons) {
        tabButton.classList.remove("w3-blue-gray");
    }
    element.classList.add("w3-blue-gray");
}

function setPause() {
    gameData.paused = !gameData.paused;
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
    gameData.currentProperty = property;
}

function setMisc(miscName) {
    let misc = gameData.itemData[miscName];
    if (gameData.currentMisc.includes(misc)) {
        for (let i = 0; i < gameData.currentMisc.length; i++) {
            if (gameData.currentMisc[i] == misc) {
                gameData.currentMisc.splice(i, 1);
            }
        }
    } else {
        gameData.currentMisc.push(misc);
    }
}

function createData(data, baseData) {
    for (let key in baseData) {
        let entity = baseData[key];
        createEntity(data, entity);
    }
}

function createEntity(data, entity) {
    if ("income" in entity) { data[entity.name] = new Job(entity); }
    else if ("maxXp" in entity) { data[entity.name] = new Skill(entity); }
    else { data[entity.name] = new Item(entity); }
    data[entity.name].id = "row " + entity.name;
}

function createRequiredRow(categoryName) {
    let requiredRow = document.getElementsByClassName("requiredRowTemplate")[0].content.firstElementChild.cloneNode(true);
    requiredRow.classList.add("requiredRow");
    requiredRow.classList.add(removeSpaces(categoryName));
    requiredRow.id = categoryName;
    return requiredRow;
}

function createHeaderRow(templates, categoryType, categoryName) {
    let headerRow = templates.headerRow.content.firstElementChild.cloneNode(true);
    headerRow.getElementsByClassName("category")[0].textContent = categoryName;
    if (categoryType != itemCategories) {
        headerRow.getElementsByClassName("valueType")[0].textContent = categoryType == jobCategories ? "Income/day" : "Effect";
    }
    
    headerRow.style.backgroundColor = headerRowColors[categoryName];
    headerRow.style.color = "#ffffff";
    headerRow.classList.add(removeSpaces(categoryName));
    headerRow.classList.add("headerRow");
    
    return headerRow;
}

function createRow(templates, name, categoryName, categoryType) {
    let row = templates.row.content.firstElementChild.cloneNode(true);
    row.getElementsByClassName("name")[0].textContent = name;
    row.getElementsByClassName("tooltipText")[0].textContent = tooltips[name];
    row.id = "row " + name;
    if (categoryType != itemCategories) {
        row.getElementsByClassName("progressBar")[0].onclick = function() { setTask(name); };
    } else {
        row.getElementsByClassName("button")[0].onclick = categoryName == "Properties" ? function() { setProperty(name); } : function() { setMisc(name); };
    }
    return row;
}

function createAllRows(categoryType, tableId) {
    let templates = {
        headerRow: document.getElementsByClassName(categoryType == itemCategories ? "headerRowItemTemplate" : "headerRowTaskTemplate")[0],
        row: document.getElementsByClassName(categoryType == itemCategories ? "rowItemTemplate" : "rowTaskTemplate")[0],
    };
    
    let table = document.getElementById(tableId);
    
    for (let categoryName in categoryType) {
        let headerRow = createHeaderRow(templates, categoryType, categoryName);
        table.appendChild(headerRow);
        
        let category = categoryType[categoryName];
        category.forEach(function(name) {
            let row = createRow(templates, name, categoryName, categoryType);
            table.appendChild(row);
        });
        
        let requiredRow = createRequiredRow(categoryName);
        table.append(requiredRow);
    }
}

function updateQuickTaskDisplay(taskType) {
    let currentTask = taskType == "job" ? gameData.currentJob : gameData.currentSkill;
    let quickTaskDisplayElement = document.getElementById("quickTaskDisplay");
    let progressBar = quickTaskDisplayElement.getElementsByClassName(taskType)[0];
    progressBar.getElementsByClassName("name")[0].textContent = currentTask.name + " lvl " + currentTask.level;
    progressBar.getElementsByClassName("progressFill")[0].style.width = currentTask.xp / currentTask.getMaxXp() * 100 + "%";
}

function updateRequiredRows(data, categoryType) {
    let requiredRows = document.getElementsByClassName("requiredRow");
    for (let requiredRow of requiredRows) {
        let nextEntity = null;
        let category = categoryType[requiredRow.id];
        if (category == null) { continue; }
        for (let i = 0; i < category.length; i++) {
            let entityName = category[i];
            if (i >= category.length - 1) break;
            let requirements = gameData.requirements[entityName];
            if (requirements && i == 0) {
                if (!requirements.isCompleted()) {
                    nextEntity = data[entityName];
                    break;
                }
            }
            
            let nextIndex = i + 1;
            if (nextIndex >= category.length) { break; }
            let nextEntityName = category[nextIndex];
            let nextEntityRequirements = gameData.requirements[nextEntityName];
            
            if (!nextEntityRequirements.isCompleted()) {
                nextEntity = data[nextEntityName];
                break;
            }
        }
        
        if (nextEntity == null) {
            requiredRow.classList.add("hiddenTask");
        } else {
            requiredRow.classList.remove("hiddenTask");
            let requirementObject = gameData.requirements[nextEntity.name];
            let requirements = requirementObject.requirements;
            
            let coinElement = requiredRow.getElementsByClassName("coins")[0];
            let levelElement = requiredRow.getElementsByClassName("levels")[0];
            let fameElement = requiredRow.getElementsByClassName("fame")[0];
            
            coinElement.classList.add("hiddenTask");
            levelElement.classList.add("hiddenTask");
            fameElement.classList.add("hiddenTask");
            
            let finalText = "";
            if (data == gameData.taskData) {
                if (requirementObject instanceof FameRequirement) {
                    fameElement.classList.remove("hiddenTask");
                    fameElement.textContent = format(requirements[0].requirement) + " fame";
                } else {
                    levelElement.classList.remove("hiddenTask");
                    for (let requirement of requirements) {
                        let task = gameData.taskData[requirement.task];
                        if (task.level >= requirement.requirement) continue;
                        let text = " " + requirement.task + " level " + format(task.level) + "/" + format(requirement.requirement) + ",";
                        finalText += text;
                    }
                    finalText = finalText.substring(0, finalText.length - 1);
                    levelElement.textContent = finalText;
                }
            } else if (data == gameData.itemData) {
                coinElement.classList.remove("hiddenTask");
                formatMoney(requirements[0].requirement, coinElement);
            }
        }
    }
}

function updateTaskRows() {
    for (let key in gameData.taskData) {
        let task = gameData.taskData[key];
        let row = document.getElementById("row " + task.name);
        row.getElementsByClassName("level")[0].textContent = task.level;
        row.getElementsByClassName("xpGain")[0].textContent = format(task.getXpGain());
        row.getElementsByClassName("xpLeft")[0].textContent = format(task.getXpLeft());
        
        let maxLevel = row.getElementsByClassName("maxLevel")[0];
        maxLevel.textContent = task.maxLevel;
        gameData.rebirthOneCount > 0 ? maxLevel.classList.remove("hidden") : maxLevel.classList.add("hidden");
        
        let progressFill = row.getElementsByClassName("progressFill")[0];
        progressFill.style.width = task.xp / task.getMaxXp() * 100 + "%";
        task == gameData.currentJob || task == gameData.currentSkill ? progressFill.classList.add("current") : progressFill.classList.remove("current");
        
        let valueElement = row.getElementsByClassName("value")[0];
        valueElement.getElementsByClassName("income")[0].style.display = task instanceof Job ? "block" : "none";
        valueElement.getElementsByClassName("effect")[0].style.display = task instanceof Skill ? "block" : "none";
        
        let skipSkillElement = row.getElementsByClassName("skipSkill")[0];
        skipSkillElement.style.display = task instanceof Skill && autoLearnElement.checked ? "block" : "none";
        
        if (task instanceof Job) {
            formatMoney(task.getIncome(), valueElement.getElementsByClassName("income")[0]);
        } else {
            valueElement.getElementsByClassName("effect")[0].textContent = task.getEffectDescription();
        }
    }
}

function updateItemRows() {
    for (let key in gameData.itemData) {
        let item = gameData.itemData[key];
        let row = document.getElementById("row " + item.name);
        let button = row.getElementsByClassName("button")[0];
        button.disabled = gameData.coins < item.getExpense();
        let active = row.getElementsByClassName("active")[0];
        let color = itemCategories["Properties"].includes(item.name) ? headerRowColors["Properties"] : headerRowColors["Misc"];
        active.style.backgroundColor = gameData.currentMisc.includes(item) || item == gameData.currentProperty ? color : "white";
        row.getElementsByClassName("effect")[0].textContent = item.getEffectDescription();
        formatMoney(item.getExpense(), row.getElementsByClassName("expense")[0]);
    }
}

function updateHeaderRows(categories) {
    for (let categoryName in categories) {
        let className = removeSpaces(categoryName);
        let headerRow = document.getElementsByClassName(className)[0];
        let maxLevelElement = headerRow.getElementsByClassName("maxLevel")[0];
        gameData.rebirthOneCount > 0 ? maxLevelElement.classList.remove("hidden") : maxLevelElement.classList.add("hidden");
        let skipSkillElement = headerRow.getElementsByClassName("skipSkill")[0];
        skipSkillElement.style.display = categories == skillCategories && autoLearnElement.checked ? "block" : "none";
    }
}

function updateText() {
    document.getElementById("ageDisplay").textContent = daysToYears(gameData.days);
    document.getElementById("dayDisplay").textContent = getDay();
    document.getElementById("lifespanDisplay").textContent = daysToYears(getLifespan());
    document.getElementById("pauseButton").textContent = gameData.paused ? "Play" : "Pause";
    
    formatMoney(gameData.coins, document.getElementById("coinDisplay"));
    setSignDisplay();
    formatMoney(getNet(), document.getElementById("netDisplay"));
    formatMoney(getIncome(), document.getElementById("incomeDisplay"));
    formatMoney(getExpense(), document.getElementById("expenseDisplay"));
    
    document.getElementById("inspirationDisplay").textContent = getInspiration().toFixed(1);
    
    document.getElementById("fameDisplay").textContent = gameData.fame.toFixed(1);
    document.getElementById("fameGainDisplay").textContent = getFameGain().toFixed(1);
    
    document.getElementById("timeWarpingDisplay").textContent = "x" + gameData.taskData["Flow State"].getEffect().toFixed(2);
    document.getElementById("timeWarpingButton").textContent = gameData.timeWarpingEnabled ? "Disable flow" : "Enable flow";
    
    // Writing Process
    document.getElementById("wordsWrittenDisplay").textContent = format(gameData.wordsWritten);
    document.getElementById("bookLengthDisplay").textContent = format(getBookLength());
    document.getElementById("writingSpeedDisplay").textContent = format(getWritingSpeed());
    document.getElementById("bookQualityDisplay").textContent = getBookQuality().toFixed(1);
    document.getElementById("booksPublishedDisplay").textContent = gameData.booksPublished;
    document.getElementById("royaltiesDisplay").textContent = gameData.royalties.toFixed(2);
}

function setSignDisplay() {
    let signDisplay = document.getElementById("signDisplay");
    if (getIncome() > getExpense()) {
        signDisplay.textContent = "+";
        signDisplay.style.color = "green";
    } else if (getExpense() > getIncome()) {
        signDisplay.textContent = "-";
        signDisplay.style.color = "red";
    } else {
        signDisplay.textContent = "";
        signDisplay.style.color = "gray";
    }
}

function getNet() {
    return Math.abs(getIncome() - getExpense());
}

function hideEntities() {
    for (let key in gameData.requirements) {
        let requirement = gameData.requirements[key];
        let completed = requirement.isCompleted();
        for (let element of requirement.elements) {
            if (completed) {
                element.classList.remove("hidden");
            } else {
                element.classList.add("hidden");
            }
        }
    }
}

function doCurrentTask(task) {
    if (!task) return; // Safeguard against undefined tasks
    task.increaseXp();
    if (task instanceof Job) {
        increaseCoins();
    }
}

function getIncome() {
    let income = 0;
    income += gameData.currentJob.getIncome();
    income += gameData.royalties;
    return income;
}

function increaseCoins() {
    let coins = applySpeed(getIncome());
    gameData.coins += coins;
}

function daysToYears(days) {
    return Math.floor(days / 365);
}

function getCategoryFromEntityName(categoryType, entityName) {
    for (let categoryName in categoryType) {
        let category = categoryType[categoryName];
        if (category.includes(entityName)) {
            return category;
        }
    }
}

function getNextEntity(data, categoryType, entityName) {
    let category = getCategoryFromEntityName(categoryType, entityName);
    let nextIndex = category.indexOf(entityName) + 1;
    if (nextIndex > category.length - 1) return null;
    let nextEntityName = category[nextIndex];
    let nextEntity = data[nextEntityName];
    return nextEntity;
}

function autoPromote() {
    if (!autoPromoteElement.checked) return;
    let nextEntity = getNextEntity(gameData.taskData, jobCategories, gameData.currentJob.name);
    if (nextEntity == null) return;
    let requirement = gameData.requirements[nextEntity.name];
    if (requirement.isCompleted()) gameData.currentJob = nextEntity;
}

function checkSkillSkipped(skill) {
    let row = document.getElementById("row " + skill.name);
    return row.getElementsByClassName("checkbox")[0].checked;
}

function setSkillWithLowestMaxXp() {
    let xpDict = {};
    
    for (let skillName in gameData.taskData) {
        let skill = gameData.taskData[skillName];
        let requirement = gameData.requirements[skillName];
        if (skill instanceof Skill && requirement.isCompleted() && !checkSkillSkipped(skill)) {
            xpDict[skill.name] = skill.level;
        }
    }
    
    if (Object.keys(xpDict).length === 0) {
        skillWithLowestMaxXp = gameData.taskData["Focus"];
        return;
    }
    
    let skillName = getKeyOfLowestValueFromDict(xpDict);
    skillWithLowestMaxXp = gameData.taskData[skillName];
}

function getKeyOfLowestValueFromDict(dict) {
    let values = [];
    for (let key in dict) {
        values.push(dict[key]);
    }
    values.sort(function(a, b){return a - b;});
    
    for (let key in dict) {
        if (dict[key] == values[0]) {
            return key;
        }
    }
}

function autoLearn() {
    if (!autoLearnElement.checked || !skillWithLowestMaxXp) return;
    gameData.currentSkill = skillWithLowestMaxXp;
}

function getDay() {
    return Math.floor(gameData.days - daysToYears(gameData.days) * 365);
}

function increaseDays() {
    let increase = applySpeed(1);
    gameData.days += increase;
}

// Formatting
function format(number) {
    let tier = Math.log10(number) / 3 | 0;
    if(tier == 0) return (number % 1 !== 0) ? number.toFixed(1) : number;
    let suffix = units[tier];
    let scale = Math.pow(10, tier * 3);
    let scaled = number / scale;
    return scaled.toFixed(1) + suffix;
}

function formatMoney(money, element) {
    element.innerHTML = `<span>$${format(money)}</span>`;
    element.style.color = "#219ebc";
}

function getElementsByClass(className) {
    return document.getElementsByClassName(removeSpaces(className));
}

function setLightDarkMode() {
    let body = document.getElementById("body");
    body.classList.contains("dark") ? body.classList.remove("dark") : body.classList.add("dark");
}

function removeSpaces(string) {
    return string.replace(/ /g, "");
}

// Logging
function logEvent(message) {
    let logContainer = document.getElementById("logContainer");
    if (!logContainer) return;
    let entry = document.createElement("div");
    entry.className = "log-entry";
    let age = daysToYears(gameData.days);
    let day = getDay();
    entry.innerHTML = `<b style="color: #875F9A">[Age ${age} Day ${day}]</b> ${message}`;
    logContainer.prepend(entry);
}

// Writing Process Logic
function getWritingSpeed() {
    let baseSpeed = 10;
    let typingSpeed = gameData.taskData["Typing Speed"] ? gameData.taskData["Typing Speed"].getEffect() : 1;
    let focus = gameData.taskData["Focus"] ? gameData.taskData["Focus"].getEffect() : 1;
    let inspiration = getInspiration();
    let fullTimeBonus = (gameData.currentJob && gameData.currentJob.name === "Full-Time Author") ? 5 : 1;
    
    return baseSpeed * typingSpeed * focus * inspiration * fullTimeBonus;
}

function getBookLength() {
    let plottingLvl = gameData.taskData["Plotting"] ? gameData.taskData["Plotting"].level : 0;
    return (50 + (plottingLvl * 2)) * 250; // pages to words
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
    if (gameData.wordsWritten >= target) {
        let quality = getBookQuality();
        let fame = gameData.fame;
        let sales = (quality / 100) * (fame + 10) * 5;
        let royalty = sales * 0.1;
        
        gameData.royalties += royalty;
        gameData.booksPublished += 1;
        gameData.wordsWritten -= target; // carry over excess
        
        logEvent(`Published Book #${gameData.booksPublished}! Quality: ${quality.toFixed(1)}%. Earned $${royalty.toFixed(2)}/day in royalties.`);
    }
}

// Rebirth
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
    setTab(jobTabButton, "jobs");
    
    gameData.coins = 0;
    gameData.days = 365 * 18;
    gameData.wordsWritten = 0;
    gameData.booksPublished = 0;
    gameData.royalties = 0;
    gameData.currentJob = gameData.taskData["Gig Worker"];
    gameData.currentSkill = gameData.taskData["Focus"];
    gameData.currentProperty = gameData.itemData["Homeless"];
    gameData.currentMisc = [];
    
    for (let taskName in gameData.taskData) {
        let task = gameData.taskData[taskName];
        if (task.level > task.maxLevel) task.maxLevel = task.level;
        task.level = 0;
        task.xp = 0;
    }
    
    for (let key in gameData.requirements) {
        let requirement = gameData.requirements[key];
        if (requirement.completed && permanentUnlocks.includes(key)) continue;
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
            logEvent("You have reached the end of your lifespan. It's time to retire.");
            gameData.loggedDeath = true;
        }
    }
    else {
        deathText.classList.add("hidden");
        gameData.loggedDeath = false;
    }
    return condition;
}

function assignMethods() {
    for (let key in gameData.taskData) {
        let task = gameData.taskData[key];
        if (task.baseData.income !== undefined) {
            task.baseData = jobBaseData[task.name];
            task = Object.assign(new Job(jobBaseData[task.name]), task);
        } else {
            task.baseData = skillBaseData[task.name];
            task = Object.assign(new Skill(skillBaseData[task.name]), task);
        }
        gameData.taskData[key] = task;
    }
    
    for (let key in gameData.itemData) {
        let item = gameData.itemData[key];
        item.baseData = itemBaseData[item.name];
        item = Object.assign(new Item(itemBaseData[item.name]), item);
        gameData.itemData[key] = item;
    }
    
    for (let key in gameData.requirements) {
        let requirement = gameData.requirements[key];
        if (requirement.type == "task") {
            requirement = Object.assign(new TaskRequirement(requirement.elements, requirement.requirements), requirement);
        } else if (requirement.type == "coins") {
            requirement = Object.assign(new CoinRequirement(requirement.elements, requirement.requirements), requirement);
        } else if (requirement.type == "age") {
            requirement = Object.assign(new AgeRequirement(requirement.elements, requirement.requirements), requirement);
        } else if (requirement.type == "fame") {
            requirement = Object.assign(new FameRequirement(requirement.elements, requirement.requirements), requirement);
        }
        
        let tempRequirement = tempData["requirements"][key];
        requirement.elements = tempRequirement.elements;
        requirement.requirements = tempRequirement.requirements;
        gameData.requirements[key] = requirement;
    }
    
    // Added fallbacks to prevent crashes from old/corrupted saves
    gameData.currentJob = gameData.taskData[gameData.currentJob?.name] || gameData.taskData["Gig Worker"];
    gameData.currentSkill = gameData.taskData[gameData.currentSkill?.name] || gameData.taskData["Focus"];
    gameData.currentProperty = gameData.itemData[gameData.currentProperty?.name] || gameData.itemData["Homeless"];
    
    let newArray = [];
    for (let misc of gameData.currentMisc) {
        if (gameData.itemData[misc?.name]) {
            newArray.push(gameData.itemData[misc.name]);
        }
    }
    gameData.currentMisc = newArray;
}

function replaceSaveDict(dict, saveDict) {
    for (let key in dict) {
        if (!(key in saveDict)) {
            saveDict[key] = dict[key];
        } else if (dict == gameData.requirements) {
            if (saveDict[key].type != tempData["requirements"][key].type) {
                saveDict[key] = tempData["requirements"][key];
            }
        }
    }
    
    for (let key in saveDict) {
        if (!(key in dict)) {
            delete saveDict[key];
        }
    }
}

function saveGameData() {
    localStorage.setItem("authorsJourneySave", JSON.stringify(gameData));
}

function loadGameData() {
    let gameDataSave = JSON.parse(localStorage.getItem("authorsJourneySave"));
    
    if (gameDataSave !== null) {
        replaceSaveDict(gameData, gameDataSave);
        replaceSaveDict(gameData.requirements, gameDataSave.requirements);
        replaceSaveDict(gameData.taskData, gameDataSave.taskData);
        replaceSaveDict(gameData.itemData, gameDataSave.itemData);
        
        gameData = gameDataSave;
    }
    
    assignMethods();
}

function updateUI() {
    updateTaskRows();
    updateItemRows();
    updateRequiredRows(gameData.taskData, jobCategories);
    updateRequiredRows(gameData.taskData, skillCategories);
    updateRequiredRows(gameData.itemData, itemCategories);
    updateHeaderRows(jobCategories);
    updateHeaderRows(skillCategories);
    updateQuickTaskDisplay("job");
    updateQuickTaskDisplay("skill");
    hideEntities();
    updateText();
}

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

function resetGameData() {
    localStorage.removeItem("authorsJourneySave");
    location.reload();
}

function importGameData() {
    let importExportBox = document.getElementById("importExportBox");
    let data = JSON.parse(window.atob(importExportBox.value));
    gameData = data;
    saveGameData();
    location.reload();
}

function exportGameData() {
    let importExportBox = document.getElementById("importExportBox");
    importExportBox.value = window.btoa(JSON.stringify(gameData));
}

function setupRequirements(reqData) {
    gameData.requirements = {};
    for (let key in reqData) {
        let req = reqData[key];
        let elements = [];
        for (let el of req.elements) {
            if (el.type === "id") {
                let domEl = document.getElementById(el.value);
                if (domEl) elements.push(domEl);
            } else if (el.type === "class") {
                let cols = document.getElementsByClassName(removeSpaces(el.value));
                for(let i=0; i<cols.length; i++) elements.push(cols[i]);
            }
        }
        
        if (req.type === "task") {
            gameData.requirements[key] = new TaskRequirement(elements, req.requirements);
        } else if (req.type === "coins") {
            gameData.requirements[key] = new CoinRequirement(elements, req.requirements);
        } else if (req.type === "age") {
            gameData.requirements[key] = new AgeRequirement(elements, req.requirements);
        } else if (req.type === "fame") {
            gameData.requirements[key] = new FameRequirement(elements, req.requirements);
        }
    }
}

// Init
async function init() {
    try {
        const [jobsRes, skillsRes, itemsRes, miscRes] = await Promise.all([
            fetch('data/jobs.json'),
            fetch('data/skills.json'),
            fetch('data/items.json'),
            fetch('data/misc.json')
        ]);
        
        jobBaseData = await jobsRes.json();
        skillBaseData = await skillsRes.json();
        itemBaseData = await itemsRes.json();
        
        const miscData = await miscRes.json();
        jobCategories = miscData.jobCategories;
        skillCategories = miscData.skillCategories;
        itemCategories = miscData.itemCategories;
        headerRowColors = miscData.headerRowColors;
        tooltips = miscData.tooltips;
        
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
        
        setupRequirements(miscData.requirements);
        
        tempData["requirements"] = {};
        for (let key in gameData.requirements) {
            let requirement = gameData.requirements[key];
            tempData["requirements"][key] = requirement;
        }
        
        loadGameData();
        
        setCustomEffects();
        addMultipliers();
        
        setTab(jobTabButton, "jobs");
        
        update();
        setInterval(update, 1000 / updateSpeed);
        setInterval(saveGameData, 3000);
        setInterval(setSkillWithLowestMaxXp, 1000);
        
        logEvent("Started a new game. Welcome to Author's Journey!");
    } catch (error) {
        console.error("Failed to load game data:", error);
        alert("Failed to load game data. Ensure you are running this on a local web server to allow fetch API to work.");
    }
}

window.onload = init;
