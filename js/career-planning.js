// Preview planning data is separate from the static, year-end journal.
function careerFinanceRow(day) {
    const rows = gameData.careerFinance;
    let row = rows.find(row => row.day === day);
    if (!row) {
        row = { day, observed: 0, work: 0, sales: 0, upkeep: 0, editing: 0, benchmark: 0 };
        rows.push(row);
    }
    gameData.careerFinance = rows.filter(row => row.day >= Math.floor(gameData.days) - 365);
    return row;
}
function recordCareerIncome(work, duration) {
    if (!BALANCE.writing.salesEnabled || !(duration > 0)) return;
    const start = gameData.days, end = start + duration;
    const benchmark = Math.max(gameData.currentJob.getIncome(), ...Object.values(gameData.taskData)
        .filter(task => task instanceof Job && gameData.unlocks[task.name] && areRequirementsMet(task.baseData))
        .map(task => task.getIncome()));
    for (let day = start; day < end;) {
        const next = Math.min(end, Math.floor(day) + 1), span = next - day;
        const row = careerFinanceRow(Math.floor(day));
        row.observed += span;
        row.work += work * span / duration;
        row.sales += gameData.completedBooks.reduce((sum, book) => sum + bookSalesBetween(book, day, next), 0);
        row.benchmark += benchmark * span;
        day = next;
    }
}
function recordCareerUpkeep(amount, duration) {
    if (!BALANCE.writing.salesEnabled || !(duration > 0)) return;
    const end = gameData.days + duration;
    for (let day = gameData.days; day < end;) {
        const next = Math.min(end, Math.floor(day) + 1);
        careerFinanceRow(Math.floor(day)).upkeep += amount * (next - day) / duration;
        day = next;
    }
}
function writingLivelihood() {
    const end = Math.floor(gameData.days);
    const rows = gameData.careerFinance.filter(row => row.day >= end - 365 && row.day < end);
    const total = key => rows.reduce((sum, row) => sum + row[key], 0);
    const observed = total('observed'), net = total('sales') - total('editing');
    const qualified = observed >= 365 - 1e-6 && net > total('work') && net > total('benchmark') && net >= total('upkeep');
    return { observed, sales: total('sales'), work: total('work'), editing: total('editing'), benchmark: total('benchmark'), net, upkeep: total('upkeep'), qualified };
}
function checkWritingLivelihood() {
    if (!gameData.writingIndependent && writingLivelihood().qualified) {
        gameData.writingIndependent = true;
        addGameNotification({ type: 'summary', name: 'Full-Time Author', message: 'Over a complete game year, book sales after editing covered your upkeep and exceeded both your actual wages and available full-time employment. Your writing can support you.' });
    }
}
function careerBudget() {
    const wages = gameData.currentJob.getIncome() * getWorkFraction();
    const sales = gameData.completedBooks.reduce((sum, book) => sum + bookSalesRate(book), 0);
    const upkeep = getExpense(), plan = gameData.manuscript;
    const reserved = gameData.currentBook && plan?.editor === 'paid' && !plan.editorPaid ? plan.editorFee : 0;
    const available = gameData.coins - reserved;
    // Existing sales decline. Find when savings run out without future releases,
    // purchases, promotions or changes to the current allocation/equipment.
    const funds = days => available + (wages - upkeep) * days + gameData.completedBooks.reduce((sum, book) => sum + bookSalesBetween(book, gameData.days, gameData.days + days), 0);
    let runway = null;
    if (available < 0) runway = 0;
    else if (wages < upkeep) {
        let low = 0, high = 1;
        while (funds(high) >= 0 && high < 1e9) high *= 2;
        if (funds(high) < 0) {
            for (let i = 0; i < 50; i++) { const mid = (low + high) / 2; if (funds(mid) >= 0) low = mid; else high = mid; }
            runway = high;
        }
    }
    return { wages, sales, upkeep, reserved, available, net: wages + sales - upkeep, runway };
}
// Recommendation helpers retained for historical headless balance policies only.
// Live gameplay never applies their suggested skill.
function addTrainingTarget(skill, level) {
    level = Math.floor(Number(level));
    if (!skillBaseData[skill] || !Number.isFinite(level) || level < 1 || level > 100000) return false;
    gameData.automation.targets ||= [];
    const existing = gameData.automation.targets.find(target => target.skill === skill);
    if (existing) existing.level = level;
    else if (gameData.automation.targets.length < 20) gameData.automation.targets.push({ skill, level });
    gameData.automation.lastDay = null;
    return true;
}
function trainingPrerequisite(name, level, visited = new Set()) {
    const task = gameData.taskData[name];
    if (!task || task.level >= level || visited.has(name)) return null;
    visited.add(name);
    if (gameData.unlocks[name] && areRequirementsMet(task.baseData)) return skillBaseData[name] ? task : null;
    // Do not train toward a target that still requires another lifetime or more books.
    for (const req of task.baseData.requirements || []) {
        if (!['skill', 'job'].includes(req.type) && !areRequirementsMet({ requirements: [req] })) return null;
    }
    for (const req of task.baseData.requirements || []) {
        if (['skill', 'job'].includes(req.type) && gameData.taskData[req.name]?.level < req.value) {
            const next = trainingPrerequisite(req.name, req.value, visited);
            if (next) return next;
        }
    }
    return null;
}
function nextTrainingTask() {
    const mode = gameData.automation.trainingMode || 'category';
    if (mode === 'targets') {
        for (const target of gameData.automation.targets || []) {
            const task = trainingPrerequisite(target.skill, target.level);
            if (task) return task;
        }
        return null;
    }
    if (mode === 'promotion') {
        const current = gameData.currentJob;
        const next = (jobCategories[current.baseData.category] || []).map(name => gameData.taskData[name])
            .filter(task => task.baseData.income > current.baseData.income).sort((a, b) => a.baseData.income - b.baseData.income)[0];
        if (!next) return null;
        return trainingPrerequisite(next.name, Math.max(1, next.level + 1));
    }
    const candidates = (skillCategories[gameData.currentSkill.baseData.category] || []).map(name => gameData.taskData[name])
        .filter(task => task && gameData.unlocks[task.name] && areRequirementsMet(task.baseData))
        .sort((a, b) => a.level - b.level);
    return candidates[0]?.level < gameData.currentSkill.level ? candidates[0] : null;
}
function checkCareerMilestones() {
    if (!BALANCE.writing.salesEnabled) return;
    const day = Math.floor(gameData.days);
    if (gameData.automation.lastDay === day) return;
    gameData.automation.lastDay = day;
    checkWritingLivelihood();
    // Neither old saved preferences nor simulation settings may switch live tasks.
    gameData.automation.promote = false;
    gameData.automation.train = false;
}
