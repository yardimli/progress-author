class Task {
    constructor(baseData) {
        this.baseData = baseData;
        this.name = baseData.name;
        this.level = 0;
        this.maxLevel = 0;
        this.xp = 0;
        this.xpMultipliers = [];
        // Load life experience multipliers from JSON
        this.hardship = baseData.hardship || 0;
        this.observation = baseData.observation || 0;
        this.escapism = baseData.escapism || 0;
        this.social = baseData.social || 0;
    }
    
    getMaxXp() {
        const curve = BALANCE.career;
        if (curve.xpCurve === 'knight') return Math.max(1, Math.round(this.baseData.maxXp * (this.level + 1) * Math.pow(curve.xpGrowth, this.level)));
        // Beyond 100, grow steadily instead of compounding into unreachable requirements.
        if (this.level > curve.lateLevel) {
            const anchor = this.baseData.maxXp * (curve.lateLevel + 1) * Math.pow(curve.xpGrowth, curve.lateLevel) * 2;
            return Math.max(1, Math.round(anchor * Math.pow((this.level + 1) / (curve.lateLevel + 1), curve.latePower)));
        }
        // Cheap early levels taper smoothly into the full late-game curve at 40.
        const earlyLevelDiscount = curve.earlyDiscount + (1 - curve.earlyDiscount) * Math.pow(Math.min(this.level, curve.earlyDiscountEnd) / curve.earlyDiscountEnd, curve.earlyDiscountPower);
        return Math.max(1, Math.round(this.baseData.maxXp * (this.level + 1) * Math.pow(curve.xpGrowth, this.level) * (1 + this.level / curve.lateLevel) * earlyLevelDiscount));
    }
    
    getXpLeft() {
        return Math.round(this.getMaxXp() - this.xp);
    }
    
    getMaxLevelMultiplier() {
        return 1 + this.maxLevel / BALANCE.career.inheritanceDivisor;
    }
    
    getXpGain() {
        const base = BALANCE.career.baseXp;
        const multiplier = applyMultipliers(base, this.xpMultipliers) / base;
        return base * (BALANCE.career.xpSoftCap === null ? multiplier : softenMultiplier(multiplier, BALANCE.career.xpSoftCap));
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
        return income * gameData.workMultiplier * BALANCE.career.salaryScale;
    }
    
    getXpGain() {
        let baseGain = super.getXpGain();
        // If not writing a book, work percentage is always 100%
        const workPercentage = getWorkFraction();
        return baseGain * gameData.workMultiplier * gameData.workXpMultiplier * workPercentage;
    }
}

class Skill extends Task {
    constructor(baseData) {
        super(baseData);
    }
    
    getEffect() {
        return 1 + this.baseData.effect * this.level;
    }
    
    // Method to calculate the writing quality multiplier based on skill level
    getWritingQuality() {
        if (!this.baseData.writingQuality) return 1;
        return 1 + this.baseData.writingQuality * this.level;
    }
    
    getEffectDescription() {
        let description = this.baseData.description;
        let effectText = "x" + String(this.getEffect().toFixed(2)) + " " + description;
        
        if (this.baseData.writingQuality) {
            effectText += " | x" + String(this.getWritingQuality().toFixed(2)) + " Writing Quality";
        }
        
        return effectText;
    }
    
    getXpGain() {
        let baseGain = super.getXpGain();
        const careerCraft = this.baseData.category === 'Writing Craft' ? getCareerCraftBonus() : 1;
        return baseGain * gameData.skillMultiplier * gameData.skillXpMultiplier * careerCraft;
    }
}

class Item {
    constructor(baseData) {
        this.baseData = baseData;
        this.name = baseData.name;
        this.expenseMultipliers = [];
    }
    
    getEffect() {
        // Properties and Transportation are mutually exclusive within their own categories
        if (gameData.currentProperty != this && gameData.currentTransportation != this && !gameData.currentMisc.includes(this)) return 1;
        return this.baseData.effect;
    }
    
    // Dynamically appends all 3 multipliers to the description with proper fallbacks
    getEffectDescription() {
        let effectTexts = [];
        
        // Use property-specific label or fallback to the data's description
        let label = this.baseData.description;
        if (itemCategories["Properties"] && itemCategories["Properties"].includes(this.name)) {
            label = "Inspiration";
        } else if (itemCategories["Transportation"] && itemCategories["Transportation"].includes(this.name)) {
            label = label || "Job XP"; // Default label for transportation
        }
        
        // 1. Base Effect (Inspiration, Skill XP, etc.)
        if (this.baseData.effect && this.baseData.effect !== 1) {
            // Fallback to "Effect" if description is completely missing to prevent "undefined"
            let displayText = label || "Effect";
            effectTexts.push("x" + this.baseData.effect.toFixed(2) + " " + displayText);
        }
        
        // 2. Writing Speed Multiplier
        if (this.baseData.writingMultiplier && this.baseData.writingMultiplier !== 1) {
            effectTexts.push("x" + this.baseData.writingMultiplier.toFixed(2) + " Writing Speed");
        }
        
        // 3. Writing Quality Multiplier
        if (this.baseData.writingQuality && this.baseData.writingQuality !== 1) {
            effectTexts.push("x" + this.baseData.writingQuality.toFixed(2) + " Writing Quality");
        }
        
        // Return "No effect" if all multipliers are exactly 1
        if (effectTexts.length === 0) {
            if (BALANCE.writing.salesEnabled && this.name === 'Walking') return 'Free commute';
            if (BALANCE.writing.salesEnabled && this.name === 'Homeless') return 'No housing upkeep';
            return "No effect";
        }
        
        return effectTexts.join(" | ");
    }
    
    getExpense() {
        return applyMultipliers(this.baseData.expense, this.expenseMultipliers) * BALANCE.career.upkeepScale;
    }
}
