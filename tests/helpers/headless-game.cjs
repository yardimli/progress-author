const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');

// Execute production game code with deterministic randomness and no rendering.
function createGame({ seed = 12345, author = 'author1', balance = {}, profile = 'current' } = {}) {
    let randomState = seed >>> 0;
    const math = Object.create(Math);
    math.random = () => ((randomState = (1664525 * randomState + 1013904223) >>> 0) / 4294967296);
    const storage = new Map();
    const context = vm.createContext({ console, performance, Math: math,
        window: { location: { hostname: profile === 'career' ? 'localhost' : 'simulation.invalid', search: profile === 'career' ? '?balance=career' : '' }, addEventListener() {} },
        document: { getElementById: () => null, querySelectorAll: () => [] },
        requestAnimationFrame() {},
        localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)) }
    });
    for (const name of ['state', 'balance-profile', 'book-sales', 'career-planning', 'classes', 'utils', 'formulas', 'mechanics', 'notifications', 'journal', 'save', 'offline', 'writing-plan', 'main']) {
        vm.runInContext(fs.readFileSync(path.join(root, 'js', name + '.js'), 'utf8'), context, { filename: name + '.js' });
    }
    for (const [variable, file] of Object.entries({ jobBaseData: 'jobs', skillBaseData: 'skills', itemBaseData: profile === 'current' ? 'items-legacy' : 'items',
        authorsBaseData: 'authors', booksBaseData: 'books', potionsBaseData: 'potions', lifeExperiencesBaseData: 'lifeExperiences',
        genresBaseData: 'genres', sceneTypesBaseData: 'sceneTypes', genreIdealsBaseData: 'genreIdeals', badgeBaseData: 'badges' })) {
        context[variable] = JSON.parse(fs.readFileSync(path.join(root, 'data', file + '.json'), 'utf8'));
    }
    if (!context.authorsBaseData[author]) throw new Error('Unknown author: ' + author);
    if (!['current', 'career', 'release'].includes(profile)) throw new Error('Unknown profile: ' + profile);
    if (profile !== 'current') context.applyCareerProfile(JSON.parse(fs.readFileSync(path.join(root, 'data/career-profile.json'), 'utf8')));
    context.applyCareerPresentation();
    context.balanceOverrides = balance;
    context.authorId = author;
    vm.runInContext(`
        for (const [group, values] of Object.entries(balanceOverrides)) {
            if (!BALANCE[group]) throw new Error('Unknown balance group: ' + group);
            Object.assign(BALANCE[group], values);
        }
        jobCategories = buildCategories(jobBaseData);
        skillCategories = buildCategories(skillBaseData);
        itemCategories = buildCategories(itemBaseData);
        for (const data of Object.values(jobBaseData)) gameData.taskData[data.name] = new Job(data);
        for (const data of Object.values(skillBaseData)) gameData.taskData[data.name] = new Skill(data);
        for (const data of Object.values(itemBaseData)) gameData.itemData[data.name] = new Item(data);
        gameData.currentJob = gameData.taskData['Gig Worker'];
        gameData.currentSkill = gameData.taskData.Focus;
        gameData.currentProperty = gameData.itemData.Homeless;
        gameData.currentTransportation = gameData.itemData.Walking;
        gameData.currentMisc = [];
        gameData.currentAuthor = authorId;
        gameData.workXpMultiplier = BALANCE.career.jobXpScale;
        gameData.skillXpMultiplier = BALANCE.career.skillXpScale;
        gameData.writingXpMultiplier = BALANCE.writing.xpScale;
        gameData.introSeen = true;
        isInitialized = true;
        isCatchingUp = true;
        buildSceneButtons = () => {};
        updateUI = () => {};
        showRetirementModal = () => {};
        queueInfoModal = () => {};
        logEvent = () => {};
        setCustomEffects();
        addMultipliers();
    `, context);
    return context;
}
module.exports = { createGame, root };
