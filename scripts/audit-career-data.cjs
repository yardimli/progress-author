const fs = require('node:fs');
const path = require('node:path');
const { createGame, root } = require('../tests/helpers/headless-game.cjs');
function audit(g = createGame({ profile: 'career' })) {
    const errors = [], entities = { ...g.jobBaseData, ...g.skillBaseData, ...g.itemBaseData };
    const signatures = new Map(), visited = new Set(), visiting = new Set();
    const dependencies = entity => (entity.requirements || []).filter(r => ['skill', 'job', 'shop'].includes(r.type)).map(r => r.name);
    function visit(name, trail = []) {
        if (!entities[name]) { errors.push('Missing prerequisite: ' + name); return; }
        if (visiting.has(name)) { errors.push('Circular prerequisite: ' + [...trail, name].join(' -> ')); return; }
        if (visited.has(name)) return;
        visiting.add(name);
        for (const dep of dependencies(entities[name])) visit(dep, [...trail, name]);
        visiting.delete(name); visited.add(name);
    }
    for (const [name, entity] of Object.entries(entities)) {
        visit(name);
        const signature = JSON.stringify((entity.requirements || []).map(r => JSON.stringify(r)).sort());
        if (entity.requirements?.length) {
            if (signatures.has(signature)) errors.push('Duplicate unlock: ' + name + ' / ' + signatures.get(signature));
            signatures.set(signature, name);
        }
        const image = path.join(root, 'img', entity.filefolder + '256', entity.filename.replace('.png', '.jpg'));
        if (!fs.existsSync(image)) errors.push('Missing image: ' + name);
    }
    for (const badge of Object.values(g.badgeBaseData)) for (const req of badge.requirements || []) {
        if (req.type === 'item' && !g.itemBaseData[req.name]) errors.push('Retired badge item: ' + req.name);
    }
    for (const skill of Object.values(g.skillBaseData)) if (skill.requirements.some(r => r.type === 'shop')) errors.push('Equipment-dependent skill: ' + skill.name);
    const legacy = JSON.parse(fs.readFileSync(path.join(root, 'data/items-legacy.json')));
    const profile = JSON.parse(fs.readFileSync(path.join(root, 'data/career-profile.json')));
    for (const name of Object.keys(legacy).filter(name => !g.itemBaseData[name])) if (!g.itemBaseData[profile.replacements[name]]) errors.push('Missing migration replacement: ' + name);
    return { jobs: Object.keys(g.jobBaseData).length, skills: Object.keys(g.skillBaseData).length, upgrades: Object.keys(g.itemBaseData).length, retiredUpgrades: Object.keys(legacy).length - Object.keys(g.itemBaseData).length, errors };
}
if (require.main === module) { const result = audit(); console.log(JSON.stringify(result, null, 2)); if (result.errors.length) process.exitCode = 1; }
module.exports = { audit };
