class Task {
    constructor(baseData) {
        this.baseData = baseData;
        this.name = baseData.name;
        this.level = 0;
        this.maxLevel = 0;
        this.xp = 0;
        this.xpMultipliers = [];
    }
    
    getMaxXp() {
        return Math.round(this.baseData.maxXp * (this.level + 1) * Math.pow(1.01, this.level));
    }
    
    getXpLeft() {
        return Math.round(this.getMaxXp() - this.xp);
    }
    
    getMaxLevelMultiplier() {
        return 1 + this.maxLevel / 20;
    }
    
    getXpGain() {
        return applyMultipliers(10, this.xpMultipliers);
    }
    
    increaseXp() {
        this.xp += applySpeed(this.getXpGain());
        if (this.xp >= this.getMaxXp()) {
            let excess = this.xp - this.getMaxXp();
            let leveledUp = false;
            while (excess >= 0) {
                this.level += 1;
                excess -= this.getMaxXp();
                leveledUp = true;
            }
            this.xp = this.getMaxXp() + excess;
            
            if (leveledUp && typeof logEvent === "function") {
                logEvent(`Leveled up ${this.name} to level ${this.level}!`);
            }
        }
    }
}

class Job extends Task {
    constructor(baseData) {
        super(baseData);
        this.incomeMultipliers = [];
    }
    
    getLevelMultiplier() {
        return 1 + Math.log10(this.level + 1);
    }
    
    getIncome() {
        let income = applyMultipliers(this.baseData.income, this.incomeMultipliers);
        return income * gameData.workMultiplier;
    }
    
    getXpGain() {
        let baseGain = super.getXpGain();
        let workPercentage = (100 - gameData.workWritingBalance) / 100;
        return baseGain * gameData.workMultiplier * workPercentage;
    }
}

class Skill extends Task {
    constructor(baseData) {
        super(baseData);
    }
    
    getEffect() {
        return 1 + this.baseData.effect * this.level;
    }
    
    getEffectDescription() {
        let description = this.baseData.description;
        return "x" + String(this.getEffect().toFixed(2)) + " " + description;
    }
    
    getXpGain() {
        let baseGain = super.getXpGain();
        return baseGain * gameData.skillMultiplier;
    }
}

class Item {
    constructor(baseData) {
        this.baseData = baseData;
        this.name = baseData.name;
        this.expenseMultipliers = [];
    }
    
    getEffect() {
        if (gameData.currentProperty != this && !gameData.currentMisc.includes(this)) return 1;
        return this.baseData.effect;
    }
    
    // MODIFIED: Appends the writing multiplier to the description if the item has one defined
    getEffectDescription() {
        let description = this.baseData.description;
        if (itemCategories["Properties"].includes(this.name)) description = "Inspiration";
        
        let effectText = "x" + this.baseData.effect.toFixed(1) + " " + description;
        
        if (this.baseData.writingMultiplier) {
            effectText += " | x" + this.baseData.writingMultiplier.toFixed(1) + " Writing Speed";
        }
        
        return effectText;
    }
    
    getExpense() {
        return applyMultipliers(this.baseData.expense, this.expenseMultipliers);
    }
}

class Requirement {
    constructor(elements, requirements) {
        this.elements = elements;
        this.requirements = requirements;
        this.completed = false;
    }
    
    isCompleted() {
        if (this.completed) { return true; }
        for (let requirement of this.requirements) {
            if (!this.getCondition(requirement)) {
                return false;
            }
        }
        this.completed = true;
        return true;
    }
}

class TaskRequirement extends Requirement {
    constructor(elements, requirements) {
        super(elements, requirements);
        this.type = "task";
    }
    
    getCondition(requirement) {
        return gameData.taskData[requirement.task].level >= requirement.requirement;
    }
}

class CoinRequirement extends Requirement {
    constructor(elements, requirements) {
        super(elements, requirements);
        this.type = "coins";
    }
    
    getCondition(requirement) {
        return gameData.coins >= requirement.requirement;
    }
}

class AgeRequirement extends Requirement {
    constructor(elements, requirements) {
        super(elements, requirements);
        this.type = "age";
    }
    
    getCondition(requirement) {
        return daysToYears(gameData.days) >= requirement.requirement;
    }
}

class FameRequirement extends Requirement {
    constructor(elements, requirements) {
        super(elements, requirements);
        this.type = "fame";
    }
    
    getCondition(requirement) {
        return gameData.fame >= requirement.requirement;
    }
}
