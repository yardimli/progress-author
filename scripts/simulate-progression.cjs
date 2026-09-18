// node scripts/simulate-progression.cjs --out reports/progression-baseline.json
const fs = require('node:fs');
const path = require('node:path');
const { createGame } = require('../tests/helpers/headless-game.cjs');

function simulate({ strategy = 'mixed', author = 'author1', lives = 2, secondsPerLife = 7200, seed = 12345, balance = {}, stepSeconds = 1, careerPolicy = 'progression', profile = 'current', editor = 'free', approach = 'balanced', transitionSeconds = 600, bookLimit = null, skillPolicy = 'balanced', accelerated = false } = {}) {
    if (!['free', 'paid-wait', 'paid-free'].includes(editor)) throw new Error('Unknown editor policy');
    if (!['balanced', 'commercial', 'crafted'].includes(approach)) throw new Error('Unknown approach');
    if (!(stepSeconds > 0) || !Number.isFinite(stepSeconds)) throw new Error('Invalid stepSeconds');
    if (!(secondsPerLife > 0) || !Number.isFinite(secondsPerLife)) throw new Error('Invalid secondsPerLife');
    if (!(transitionSeconds >= 0) || !Number.isFinite(transitionSeconds)) throw new Error('Invalid transitionSeconds');
    if (bookLimit !== null && (!Number.isInteger(bookLimit) || bookLimit < 1)) throw new Error('Invalid bookLimit');
    if (!['balanced', 'promotion'].includes(skillPolicy)) throw new Error('Unknown skill policy');
    const g = createGame({ author, seed, balance, profile });
    const reports = [];
    const firstReached = {};
    let ledger;
    const recordMoney = g.recordJournalMoney;
    g.recordJournalMoney = (type, amount, name = '') => {
        if (Number.isFinite(amount) && amount > 0) {
            const key = type === 'purchase' ? (name.startsWith('Editing: ') ? 'editing' : 'purchases') : type === 'royalties' ? 'royalties' : type === 'work' ? 'wages' : type;
            if (key in ledger) ledger[key] += amount;
        }
        return recordMoney(type, amount, name);
    };
    const bankrupt = g.goBankrupt;
    g.goBankrupt = () => { ledger.bankruptcies++; return bankrupt(); };
    for (let life = 1; life <= lives; life++) {
        ledger = { wages: 0, royalties: 0, upkeep: 0, purchases: 0, editing: 0, bankruptcies: 0 };
        g.gameData.draftPlan = { approach, editor: editor === 'free' ? 'none' : 'paid', editorFallback: editor === 'paid-free' ? 'free' : 'pause' };
        const startDay = g.gameData.days;
        const milestones = { firstBookSeconds: null, firstPromotionSeconds: null, firstPaidHomeSeconds: null, sustainableHomeSeconds: null, writingMajoritySeconds: null, writingIndependenceSeconds: null };
        let seconds = 0, homeSince = null, editorWaitSeconds = 0, independentGameDays = 0;
        let yearStart = startDay, yearWages = 0, yearRoyalties = 0, yearCosts = 0;
        let decisionAt = 0;
        const promotions = [];
        const discoveries = [];
        while (seconds < secondsPerLife && g.gameData.days < g.getLifespan() - 1e-7) {
            if (seconds >= decisionAt) {
                let discovery;
                while ((discovery = g.discoverNextCard())) {
                    discoveries.push({ seconds, ...discovery });
                    firstReached[discovery.type + ': ' + discovery.name] ??= { life, seconds };
                }
                if (accelerated) g.gameData.potions.acceleration = 600;
                const eligible = Object.values(g.gameData.taskData).filter(task => g.gameData.unlocks[task.name]);
                const jobs = eligible.filter(task => g.jobBaseData[task.name]);
                const branch = careerPolicy === 'creative' ? 'Creative Industry' : careerPolicy === 'literary' ? 'Literary Elite' : careerPolicy === 'ordinary' ? 'Menial Work' : null;
                const branchJobs = branch ? jobs.filter(job => job.baseData.category === branch) : [];
                const bestJob = (branchJobs.length ? branchJobs : jobs).sort((a, b) => careerPolicy === 'current-wage' ? b.getIncome() - a.getIncome() : b.baseData.income - a.baseData.income)[0];
                if (bestJob && bestJob !== g.gameData.currentJob) {
                    g.gameData.currentJob = bestJob;
                    promotions.push({ seconds, job: bestJob.name });
                    milestones.firstPromotionSeconds ??= seconds;
                }
                const skills = eligible.filter(task => g.skillBaseData[task.name]);
                skills.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
                if (skills[0]) g.gameData.currentSkill = skills[0];
                if (profile === 'career' && skillPolicy === 'promotion') {
                    g.gameData.automation.trainingMode = 'promotion';
                    g.gameData.currentSkill = g.nextTrainingTask() || g.gameData.currentSkill;
                }
                const allocation = strategy === 'job-only' ? 0 : strategy === 'writing-heavy' ? 80 :
                    strategy === 'transition' ? (seconds < transitionSeconds ? 0 : 80) : 40;
                g.gameData.workWritingBalance = allocation;
                if (allocation > 0 && !g.gameData.currentBook && (bookLimit === null || g.gameData.booksPublished < bookLimit)) {
                    g.gameData.selectedGenre = Object.keys(g.sceneTypesBaseData)[0];
                    g.setBookQueue(bookLimit === null ? 'continuous' : String(Math.min(10, bookLimit - g.gameData.booksPublished)));
                    g.startQueuedBook();
                }
                // A reproducible policy, not an optimal player: buy each affordable
                // support; replace home/transport only with a stronger tier. Reserve
                // 35% of current gross income after all equipped upkeep.
                for (const item of Object.values(g.gameData.itemData)) {
                    if (!g.gameData.unlocks[item.name]) continue;
                    const category = item.baseData.category;
                    const prior = category === 'Properties' ? g.gameData.currentProperty : category === 'Transportation' ? g.gameData.currentTransportation : item.baseData.slot ? g.gameData.currentMisc.find(active => active.baseData.slot === item.baseData.slot) : null;
                    if (prior && (item.baseData.slot ? item.baseData.tier <= prior.baseData.tier : item.baseData.effect <= prior.baseData.effect)) continue;
                    if (!prior && g.gameData.currentMisc.includes(item)) continue;
                    const prospectiveExpense = g.getExpense() - (prior?.getExpense() || 0) + item.getExpense();
                    const editorReserve = g.gameData.currentBook && g.gameData.manuscript?.editor === 'paid' && !g.gameData.manuscript.editorPaid ? g.gameData.manuscript.editorFee : 0;
                    if (prospectiveExpense > g.getIncome() * .65 || g.getPurchasePrice(item.name) + editorReserve > g.gameData.coins) continue;
                    const before = g.gameData.coins;
                    if (category === 'Properties') g.setProperty(item.name);
                    else if (category === 'Transportation') g.setTransportation(item.name);
                    else g.setMisc(item.name);
                    if (g.gameData.currentProperty === item || g.gameData.currentTransportation === item || g.gameData.currentMisc.includes(item)) firstReached['equipped: ' + item.name] ??= { life, seconds };
                    yearCosts += before - g.gameData.coins;
                    if (g.gameData.currentProperty.name !== 'Homeless') milestones.firstPaidHomeSeconds ??= seconds;
                }
                decisionAt = seconds + 5;
            }
            const speed = g.getGameSpeed();
            if (!(speed > 0)) break;
            let step = Math.min(stepSeconds, secondsPerLife - seconds, (g.getLifespan() - g.gameData.days) / speed,
                Math.max(1e-7, (yearStart + 365 - g.gameData.days) / speed));
            if (profile === 'career') step = Math.min(step, (Math.floor(g.gameData.days) + 1 - g.gameData.days) / speed);
            if (g.gameData.currentBook && g.getWritingSpeed() > 0) step = Math.min(step,
                Math.max(1e-7, (g.getBookLength() - g.gameData.wordsWritten) / (g.getWritingSpeed() * speed)));
            g.deltaTime = step;
            const before = { ...ledger }, beforeDay = g.gameData.days;
            const wasIndependent = profile === 'career' && g.writingLivelihood().qualified;
            if (g.gameData.manuscript?.awaitingEditor) editorWaitSeconds += step;
            if (profile === 'career') g.advanceWritingEconomy(step);
            else {
                g.updateLogic();
                if (g.gameData.currentBook && g.currentAutoSceneType) g.writeProgress(g.currentAutoSceneType, step);
            }
            g.checkBadgeUnlocks();
            seconds += step;
            yearWages += ledger.wages - before.wages;
            yearRoyalties += ledger.royalties - before.royalties;
            yearCosts += ledger.upkeep - before.upkeep + ledger.editing - before.editing;
            if (wasIndependent) independentGameDays += g.gameData.days - beforeDay;
            if (g.gameData.currentProperty.name === 'Homeless' || ledger.bankruptcies !== before.bankruptcies) homeSince = null;
            else homeSince ??= beforeDay;
            if (homeSince !== null && g.gameData.days - homeSince >= 365) milestones.sustainableHomeSeconds ??= seconds;
            if (g.gameData.booksPublished > 0) {
                milestones.firstBookSeconds ??= seconds;
                firstReached['milestone: First book'] ??= { life, seconds };
            }
            if (profile === 'career') {
                const rolling = g.writingLivelihood();
                if (rolling.observed >= 365 - 1e-6 && rolling.net > rolling.work && rolling.net >= rolling.upkeep) milestones.writingMajoritySeconds ??= seconds;
                if (rolling.qualified) {
                    milestones.writingIndependenceSeconds ??= seconds;
                    firstReached['milestone: Writing independence'] ??= { life, seconds };
                }
            }
            if (g.gameData.days >= yearStart + 365 - 1e-6) {
                if (profile !== 'career' && yearRoyalties > yearWages && yearRoyalties > yearCosts) milestones.writingMajoritySeconds ??= seconds;
                yearStart += 365; yearWages = yearRoyalties = yearCosts = 0;
            }
        }
        reports.push({ life, elapsedSeconds: seconds, gameDays: g.gameData.days - startDay,
            retired: g.gameData.days >= g.getLifespan() - 1e-6, milestones, promotions, discoveries,
            books: g.gameData.booksPublished, readership: g.gameData.readership, coins: g.gameData.coins, ...ledger,
            editorWaitSeconds, independentGameDays,
            rollingYear: profile === 'career' ? { ...g.writingLivelihood() } : null,
            receiptsReconcileError: g.gameData.coins - (ledger.wages + ledger.royalties - ledger.upkeep - ledger.purchases - ledger.editing),
            job: g.gameData.currentJob.name, dailyJobPayAtFullWork: g.gameData.currentJob.getIncome(),
            dailyRoyalties: g.gameData.royalties, dailyUpkeep: g.getExpense(),
            equipped: [g.gameData.currentProperty.name, g.gameData.currentTransportation.name, ...g.gameData.currentMisc.map(item => item.name)],
            levels: Object.fromEntries(Object.values(g.gameData.taskData).map(task => [task.name, task.level])) });
        // This is a true retirement, not synthetic inherited levels at the time cap.
        if (!reports.at(-1).retired) break;
        g.gameData.rebirthOneCount++;
        g.rebirthReset();
    }
    return { strategy, author, seed, careerPolicy, profile, editor, approach, transitionSeconds, bookLimit, skillPolicy, accelerated, firstReached, lives: reports };
}

if (require.main === module) {
    const output = process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : null;
    const lifeArgument = process.argv.indexOf('--lives');
    const lives = lifeArgument >= 0 ? Number(process.argv[lifeArgument + 1]) : 2;
    if (!Number.isInteger(lives) || lives < 1 || lives > 100) throw new Error('--lives must be an integer from 1 to 100');
    const selected = flag => process.argv.includes(flag) ? process.argv[process.argv.indexOf(flag) + 1] : null;
    const authorFilter = selected('--author'), strategyFilter = selected('--strategy');
    const profile = selected('--profile') || 'current';
    const careerPolicy = selected('--career-policy') || 'progression';
    const editor = selected('--editor') || 'free', approach = selected('--approach') || 'balanced';
    const skillPolicy = selected('--skill-policy') || 'balanced', accelerated = process.argv.includes('--accelerated');
    if (!['progression', 'current-wage', 'creative', 'literary', 'ordinary'].includes(careerPolicy)) throw new Error('Unknown --career-policy');
    if (!['current', 'career'].includes(profile)) throw new Error('Unknown --profile');
    const authors = ['author1', 'author3', 'author4'];
    const strategies = ['job-only', 'mixed', 'writing-heavy', 'transition'];
    if (authorFilter && !authors.includes(authorFilter)) throw new Error('Unknown --author');
    if (strategyFilter && !strategies.includes(strategyFilter)) throw new Error('Unknown --strategy');
    const runs = [];
    for (const author of authorFilter ? [authorFilter] : authors) {
        for (const strategy of strategyFilter ? [strategyFilter] : strategies) runs.push(simulate({ author, strategy, lives, profile, careerPolicy, editor, approach, skillPolicy, accelerated }));
    }
    if (!authorFilter && !strategyFilter) runs.push(simulate({ strategy: 'job-only', careerPolicy: 'current-wage', lives, profile }));
    const report = { model: profile === 'career' ? 'Career and writing candidate: readership, finite sales and configurable editing' : 'Current live economy with continuous writing enabled; shared tuning controls extracted without changing values',
        policy: `Five-second decisions; highest base-wage progression except the explicitly labelled current-wage control; lowest-level eligible skill; upgrades under 65% of current gross income, reserving pending editing fees; ${approach} prose in the first genre; editor policy ${editor}; no potion. Transition switches to 80% writing at 600 real seconds.`,
        limitations: 'Heuristic policies, not optimal play. Preview uses the production rolling-year operating-income test; the legacy profile retains year buckets. Sustainable housing means a paid home retained for 365 game days without bankruptcy, not guaranteed future affordability. Cash totals use actual journal events, including editor charges. No acceleration; retirement design unchanged. One-time tools are excluded from the operating-income milestone but included in cash accounting.', runs };
    const text = JSON.stringify(report, null, 2) + '\n';
    if (output) { fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, text); }
    else process.stdout.write(text);
    if (output) console.log(`Wrote ${runs.length} deterministic strategy/author runs to ${output}`);
}
module.exports = { simulate };
