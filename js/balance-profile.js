// Opt-in candidate profile. Production data stays unchanged until the writing
// economy and migration are ready to ship together.
var activeBalanceProfile = null;
const EFFECT_LABELS = {
    inspiration: 'Inspiration', jobXp: 'Job XP', skillXp: 'Skill XP', allXp: 'All experience',
    creativeXp: 'Creative Industry experience', literaryXp: 'Literary Elite experience',
    typingXp: 'Typing Speed experience', craftXp: 'Writing Craft experience', expenses: 'Expenses',
    jobPay: 'Job pay', writingSpeed: 'Writing Speed', fame: 'Fame gain',
    lifespan: 'Later retirement age', gameSpeed: 'Gamespeed'
};

function applyCareerProfile(profile) {
    activeBalanceProfile = profile;
    Object.assign(BALANCE.career, profile.career);
    Object.assign(BALANCE.writing, profile.writing);
    gameData.balanceProfile = profile.id;
    gameData.bookSalesVersion = 1;
    gameData.workXpMultiplier = BALANCE.career.jobXpScale;
    gameData.skillXpMultiplier = BALANCE.career.skillXpScale;
    for (const [name, income] of Object.entries(profile.salaries)) jobBaseData[name].income = income;
    const professional = jobBaseData['Full-Time Author'];
    delete jobBaseData['Full-Time Author'];
    professional.name = 'Commissioned Author';
    jobBaseData[professional.name] = professional;
    for (const [name, data] of Object.entries(profile.jobs)) Object.assign(jobBaseData[name], data, {
        requirements: [...data.requirements, ...(profile.careerRetirements[name] ? [{ type: 'retirements', value: profile.careerRetirements[name] }] : [])]
    });
    for (const [name, data] of Object.entries(profile.skills)) Object.assign(skillBaseData[name], data, { description: EFFECT_LABELS[data.effectType] });
    const accessCost = data => data.purchasePrice || data.requirements.find(req => req.type === 'coins')?.value || 0;
    itemBaseData = Object.fromEntries(profile.catalogue.map(name => [name, itemBaseData[name]]).sort((a, b) => accessCost(a[1]) - accessCost(b[1])).map(([name, data]) => [name, {
        ...data, description: EFFECT_LABELS[data.effectType]
    }]));
}

function applyCareerPresentation() {
    if (!activeBalanceProfile) return;
    if (badgeBaseData?.landlord) {
        badgeBaseData.landlord.requirements = [{ type: 'item', name: 'Suburban' }];
        badgeBaseData.landlord.description = 'Equip the Suburban home. A home to call your own.';
    }
}

function migrateCareerSave(saved) {
    if (!activeBalanceProfile || saved.balanceProfile === activeBalanceProfile.id) return;
    const replacements = activeBalanceProfile.replacements;
    const mapped = name => replacements[name] || name;
    const oldItems = saved.itemData || {};
    const oldJob = saved.taskData?.['Full-Time Author'];
    if (oldJob) {
        oldJob.name = 'Commissioned Author';
        saved.taskData['Commissioned Author'] = oldJob;
        delete saved.taskData['Full-Time Author'];
    }
    if (saved.currentJob?.name === 'Full-Time Author') saved.currentJob.name = 'Commissioned Author';
    const owned = new Set(saved.ownedItems || []);
    for (const item of [saved.currentProperty, saved.currentTransportation, ...(saved.currentMisc || [])]) if (item?.name) owned.add(item.name);
    // Replacement access preserves value without inventing cash refunds for
    // grandfathered ownership or for purchases lost from the bounded journal.
    saved.ownedItems = [...new Set([...owned].map(mapped).filter(name => itemBaseData[name]))];
    saved.unlocks ||= {};
    if (saved.unlocks['Full-Time Author']) saved.unlocks['Commissioned Author'] = true;
    delete saved.unlocks['Full-Time Author'];
    for (const name of [...owned, ...Object.keys(saved.unlocks).filter(name => saved.unlocks[name])]) {
        if (itemBaseData[mapped(name)]) saved.unlocks[mapped(name)] = true;
    }
    for (const oldName of Object.keys(replacements)) delete saved.unlocks[oldName];
    for (const field of ['currentProperty', 'currentTransportation']) {
        if (saved[field]) saved[field] = { name: mapped(saved[field].name) };
    }
    const active = new Map();
    for (const item of saved.currentMisc || []) {
        const name = mapped(item.name), data = itemBaseData[name];
        if (!data || ['Properties', 'Transportation'].includes(data.category)) continue;
        const slot = data.slot || name;
        if (!active.has(slot) || (data.tier || 0) > (itemBaseData[active.get(slot)].tier || 0)) active.set(slot, name);
    }
    saved.currentMisc = [...active.values()].map(name => ({ name }));
    saved.itemData = Object.fromEntries(Object.keys(itemBaseData).map(name => [name, oldItems[name] || { name, baseData: itemBaseData[name] }]));
    saved.workXpMultiplier = BALANCE.career.jobXpScale;
    saved.skillXpMultiplier = BALANCE.career.skillXpScale;
    saved.balanceProfile = activeBalanceProfile.id;
    saved.notifications ||= [];
    saved.notifications.unshift({ type: 'summary', name: 'Career preview migration', read: false, age: saved.days,
        message: 'Older upgrades were exchanged for their replacement tiers, without cash refunds. Former Editor ownership grants Style Guide access; hiring an editor is now an optional service paid per manuscript. Careers and upkeep have changed. Your original save is backed up separately.' });
}
